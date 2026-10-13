"use client";

import { signOut } from "next-auth/react";

/**
 * Universal logout handler:
 * 1. Calls /api/auth/logout to invalidate all HTTP-only cookies (session tokens, 2FA, csrf).
 * 2. Purges any client-accessible document cookies.
 * 3. Signals NextAuth to clear active React session state.
 * 4. Navigates directly to the homepage ("/") with a clean reload.
 */
export async function performLogout(callbackUrl: string = "/") {
  try {
    // 1. Invalidate HTTP-only cookies on the server
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Failed to call /api/auth/logout:", err);
  }

  // 2. Clear any non-HTTP-only cookies accessible in the browser
  if (typeof document !== "undefined") {
    try {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      }
    } catch (err) {
      console.error("Failed to clear document cookies:", err);
    }
  }

  // 3. Inform NextAuth of sign out
  try {
    await signOut({ callbackUrl, redirect: false });
  } catch (err) {
    console.error("NextAuth signOut error:", err);
  }

  // 4. Unconditional navigation to callbackUrl (defaults to "/")
  if (typeof window !== "undefined") {
    window.location.href = callbackUrl;
  }
}
