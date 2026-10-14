"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { performLogout } from "@/lib/clientLogout";

// 30 minutes inactivity threshold
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins (1,800,000 ms)
export const INACTIVITY_STORAGE_KEY = "iq_last_active_timestamp";
export const INACTIVITY_BROADCAST_KEY = "iq_inactivity_logout_broadcast";
const THROTTLE_INTERVAL_MS = 10 * 1000; // Throttle storage writes to once every 10 seconds

/**
 * Global Inactivity Watcher:
 * Automatically logs out any authenticated User or Admin if they have been away from
 * the website for more than 30 minutes (idle, tab backgrounded, laptop closed, or inactive).
 */
export default function InactivityWatcher() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lastThrottleRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);

  useEffect(() => {
    // Only monitor when a user or admin is actively authenticated
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    const isAdmin =
      pathname?.startsWith("/admin") ||
      (session.user as { role?: string })?.role === "ADMIN";

    const logoutRedirectUrl = isAdmin
      ? "/admin/login?reason=inactivity"
      : "/login?reason=inactivity";

    /**
     * Executes universal auto-logout and redirects with inactivity feedback
     */
    const triggerInactivityLogout = async () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      console.warn(
        `[InactivityWatcher] Inactivity limit of 30 minutes exceeded for ${
          isAdmin ? "Admin" : "User"
        }. Initiating auto-logout.`
      );

      try {
        localStorage.removeItem(INACTIVITY_STORAGE_KEY);
        // Broadcast to any other open tabs
        localStorage.setItem(INACTIVITY_BROADCAST_KEY, Date.now().toString());
        sessionStorage.setItem("iq_inactivity_logout", "true");
      } catch {
        // Ignore storage errors in private/incognito mode
      }

      await performLogout(logoutRedirectUrl);
    };

    /**
     * Evaluates whether the user has been away from the website for > 30 minutes
     */
    const evaluateInactivity = () => {
      if (isLoggingOutRef.current) return;

      try {
        const storedStr = localStorage.getItem(INACTIVITY_STORAGE_KEY);
        if (!storedStr) {
          // If no timestamp recorded yet, set current time
          const now = Date.now();
          lastThrottleRef.current = now;
          localStorage.setItem(INACTIVITY_STORAGE_KEY, now.toString());
          return;
        }

        const lastActive = parseInt(storedStr, 10);
        if (isNaN(lastActive) || lastActive <= 0) {
          localStorage.setItem(INACTIVITY_STORAGE_KEY, Date.now().toString());
          return;
        }

        const elapsed = Date.now() - lastActive;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          triggerInactivityLogout();
        }
      } catch (err) {
        console.error("[InactivityWatcher] Inactivity check error:", err);
      }
    };

    /**
     * Throttled recorder: updates the user's last activity timestamp
     */
    const recordUserActivity = () => {
      if (isLoggingOutRef.current) return;

      const now = Date.now();
      if (now - lastThrottleRef.current > THROTTLE_INTERVAL_MS) {
        lastThrottleRef.current = now;
        try {
          localStorage.setItem(INACTIVITY_STORAGE_KEY, now.toString());
        } catch {
          // Ignore storage quota/permission errors
        }
      }
    };

    // 1. Initial check on mount / page load
    evaluateInactivity();

    // 2. Mark initial activity if not timed out
    if (!isLoggingOutRef.current) {
      recordUserActivity();
    }

    // 3. User activity event listeners (covers mouse, keyboard, touch, scroll, clicks)
    const monitoredEvents = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "mousemove",
    ];

    monitoredEvents.forEach((event) => {
      window.addEventListener(event, recordUserActivity, { passive: true });
    });

    // 4. Away detection: Tab visibility change & window focus
    // Triggers instantly when user switches back to this tab, unlocks computer, or wakes device
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        evaluateInactivity();
        if (!isLoggingOutRef.current) {
          recordUserActivity();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // 5. Cross-tab synchronization via storage event
    const handleStorageEvent = (event: StorageEvent) => {
      // If another tab logged out due to inactivity, log this tab out immediately
      if (event.key === INACTIVITY_BROADCAST_KEY && event.newValue) {
        triggerInactivityLogout();
        return;
      }

      // If another tab recorded fresh activity, update local throttle reference
      if (event.key === INACTIVITY_STORAGE_KEY && event.newValue) {
        const remoteTime = parseInt(event.newValue, 10);
        if (!isNaN(remoteTime)) {
          lastThrottleRef.current = remoteTime;
          if (Date.now() - remoteTime >= INACTIVITY_TIMEOUT_MS) {
            triggerInactivityLogout();
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    // 6. Periodic heartbeat check while tab is open (every 15 seconds)
    const intervalTimer = setInterval(evaluateInactivity, 15000);

    return () => {
      monitoredEvents.forEach((event) => {
        window.removeEventListener(event, recordUserActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("storage", handleStorageEvent);
      clearInterval(intervalTimer);
    };
  }, [status, session, pathname]);

  return null;
}
