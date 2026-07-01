"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Bell, Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Notification {
  id: string; title: string; message: string;
  type: string; isRead: boolean; createdAt: string;
}

const typeStyle: Record<string, string> = {
  LOW_STOCK:   "badge badge-amber",
  EXPIRY:      "badge badge-red",
  DELIVERY:    "badge badge-blue",
  INTERACTION: "badge badge-fuchsia",
};

export default function Header({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const d = await response.json();
      if (d.success) {
        setNotifications(d.data);
        setUnread(d.data.filter((n: Notification) => !n.isRead).length);
      } else {
        setNotificationError(d.error ?? "Unable to load notifications");
      }
    } catch {
      setNotificationError("Unable to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const openNotification = async (notification: Notification) => {
    setSelectedNotification({ ...notification, isRead: true });
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    if (!notification.isRead) setUnread(prev => Math.max(0, prev - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id }),
    });
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        <span className="hidden sm:block">SmartPharm •</span>
        <span className="font-semibold text-gray-700">{user?.name}</span>
        <span className="text-gray-300 hidden sm:block">—</span>
        <span className="hidden sm:block text-gray-500">
          {(user as any)?.role?.replace("_", " ")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setOpen(!open);
              setProfileOpen(false);
            }}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-4 h-4 text-gray-600" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="fixed right-4 top-14 sm:absolute sm:right-0 sm:top-11 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-800 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {loadingNotifications ? (
                    <div className="px-4 py-8 flex items-center justify-center text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 mr-2 spinner" /> Loading notifications
                    </div>
                  ) : notificationError ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-red-600">{notificationError}</p>
                      <button onClick={loadNotifications} className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-900">
                        Try again
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications</p>
                  ) : notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`block w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${!n.isRead ? "bg-teal-50/40" : ""}`}
                    >
                      <span className={typeStyle[n.type] ?? "badge badge-gray"}>
                        {n.type.replace("_", " ")}
                      </span>
                      <p className="text-sm font-medium text-gray-800 mt-1.5">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setOpen(false);
            }}
            className="w-9 h-9 bg-teal-700 rounded-lg flex items-center justify-center text-white text-sm font-bold hover:bg-teal-800 transition-colors"
            aria-label="Open profile menu"
          >
            {user?.name?.charAt(0) ?? "?"}
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="fixed right-4 top-14 sm:absolute sm:right-0 sm:top-11 w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden fade-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? "Staff user"}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</p>
                  <p className="text-[11px] font-semibold text-teal-700 mt-2">
                    {(user as any)?.role?.replace("_", " ") ?? "STAFF"}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedNotification && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className={typeStyle[selectedNotification.type] ?? "badge badge-gray"}>
                  {selectedNotification.type.replace("_", " ")}
                </span>
                <h3 className="font-bold text-gray-900 text-lg mt-3">{selectedNotification.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(selectedNotification.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelectedNotification(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-6 whitespace-pre-wrap">{selectedNotification.message}</p>
            <div className="flex justify-end pt-5 mt-5 border-t border-gray-100">
              <button type="button" onClick={() => setSelectedNotification(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
