"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ShoppingBag,
  XCircle,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  X,
  Clock,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  type: "ORDER_PLACED" | "ORDER_CANCELLED" | "USER_REGISTERED" | "LOW_STOCK";
  title: string;
  description: string;
  timestamp: string;
  link: string;
  meta?: Record<string, unknown>;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function AdminNotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin_read_notifications");
        if (saved) return new Set(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    return new Set();
  });
  const [isOpen, setIsOpen] = useState(false);
  const [newOrderToast, setNewOrderToast] = useState<NotificationItem | null>(null);
  const lastKnownOrderIdRef = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUpdates = async (isInitial = false) => {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!res.ok || !isMounted) return;
        const data = await res.json();

        if (data && Array.isArray(data.notifications) && isMounted) {
          setNotifications(data.notifications);

          // Check if there is a brand new order placed
          const latestOrderNotif = data.notifications.find(
            (n: NotificationItem) => n.type === "ORDER_PLACED"
          );

          if (latestOrderNotif && latestOrderNotif.meta && typeof latestOrderNotif.meta === "object") {
            const currentLatestId = (latestOrderNotif.meta as { orderId?: string }).orderId;
            if (
              !isInitial &&
              lastKnownOrderIdRef.current &&
              currentLatestId &&
              lastKnownOrderIdRef.current !== currentLatestId
            ) {
              setNewOrderToast(latestOrderNotif);
              setTimeout(() => {
                if (isMounted) setNewOrderToast(null);
              }, 7000);
            }
            if (currentLatestId) {
              lastKnownOrderIdRef.current = currentLatestId;
            }
          }
        }
      } catch {
        // ignore fetch errors
      }
    };

    queueMicrotask(() => {
      if (isMounted) {
        loadUpdates(true);
      }
    });

    const interval = setInterval(() => {
      if (isMounted) {
        loadUpdates(false);
      }
    }, 25000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("admin_read_notifications", JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    const newRead = new Set(readIds);
    newRead.add(notif.id);
    setReadIds(newRead);
    try {
      localStorage.setItem("admin_read_notifications", JSON.stringify(Array.from(newRead)));
    } catch {}

    setIsOpen(false);
    router.push(notif.link);
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "ORDER_PLACED":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case "ORDER_CANCELLED":
        return (
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
        );
      case "USER_REGISTERED":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        );
      case "LOW_STOCK":
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-gray-700 hover:text-black hover:bg-gray-100 transition-colors focus:outline-hidden cursor-pointer"
        aria-label="Website Notifications"
        title="Website Notifications & Order Updates"
      >
        <Bell className="w-5 h-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-white animate-in zoom-in-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Toast when a new order is detected */}
      {newOrderToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-zinc-950 text-white rounded-2xl p-4 shadow-2xl border border-zinc-800 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  New Order Alert!
                </span>
                <button
                  type="button"
                  onClick={() => setNewOrderToast(null)}
                  className="text-zinc-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-semibold text-zinc-100 mt-1 line-clamp-2">
                {newOrderToast.title}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {newOrderToast.description}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleNotificationClick(newOrderToast);
                    setNewOrderToast(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-colors cursor-pointer"
                >
                  View in Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 tracking-tight">
                Website Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs px-4">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-gray-600">No updates yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Recent orders, cancellations, and user signups will appear here automatically.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRead = readIds.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {getIcon(notif.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs ${!isRead ? "font-bold text-gray-950" : "font-medium text-gray-800"} truncate`}>
                          {notif.title}
                        </p>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.description}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(notif.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 text-center">
            <Link
              href="/admin/orders"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black transition-colors"
            >
              <span>View All Customer Orders</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
