import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineBell } from "react-icons/hi";
import { notifyInfo } from "../../utils/hotToast.jsx";
import { connectRealtimeSocket, disconnectRealtimeSocket } from "../../realtime/socketClient.js";
import { registerBrowserPushToken, subscribeForegroundFcmMessages } from "../../realtime/fcmClient.js";

const POLL_INTERVAL_MS = 6000;

const formatRelativeTime = (isoString) => {
  if (!isoString) return "Just now";

  const time = new Date(isoString).getTime();
  if (Number.isNaN(time)) return "Just now";

  const diffMs = Date.now() - time;
  const diffSec = Math.max(1, Math.floor(diffMs / 1000));

  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

const getNotificationRoute = (notification) => {
  if (notification?.meta?.route) {
    return notification.meta.route;
  }

  if (notification?.type === "telemedicine_message") {
    return "/telemedicine";
  }

  return "/doctor-dashboard/appointments";
};

const mergeNotifications = (previous, incoming) => {
  const map = new Map();

  [...incoming, ...previous].forEach((item) => {
    if (item?._id) {
      map.set(item._id, item);
    }
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
};

const DoctorNotificationBell = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userType, token, userId } = useSelector((state) => state.auth);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const lastCheckedRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || userType !== "Doctor" || !token) {
      disconnectRealtimeSocket();
      return undefined;
    }

    const socket = connectRealtimeSocket({
      apiBaseUrl,
      authToken: token,
    });

    if (!socket) {
      return undefined;
    }

    const handleRealtimeNotification = (payload = {}) => {
      const incoming = payload.notification;
      if (!incoming?._id) return;
      if (seenIdsRef.current.has(incoming._id)) return;

      seenIdsRef.current.add(incoming._id);
      lastCheckedRef.current = incoming.createdAt || new Date().toISOString();

      setNotifications((previous) => mergeNotifications(previous, [incoming]));
      setUnreadCount((previous) =>
        Number.isFinite(payload.unreadCount) ? payload.unreadCount : previous + 1
      );

      notifyInfo(incoming.title || "Patient update", incoming.message || "You have a new update", {
        push: true,
        duration: 5500,
      });
    };

    socket.on("notification:new", handleRealtimeNotification);

    return () => {
      socket.off("notification:new", handleRealtimeNotification);
      disconnectRealtimeSocket();
    };
  }, [apiBaseUrl, isLoggedIn, token, userType]);

  useEffect(() => {
    if (!isLoggedIn || userType !== "Doctor" || !token || !userId) {
      return undefined;
    }

    let unsubscribeForeground = () => {};
    let isDisposed = false;

    const setupPushLayer = async () => {
      try {
        await registerBrowserPushToken({
          apiBaseUrl,
          authToken: token,
          userId,
        });

        const stop = await subscribeForegroundFcmMessages((payload) => {
          const data = payload?.data || {};
          const notificationId = data.notificationId;

          if (notificationId && seenIdsRef.current.has(notificationId)) {
            return;
          }

          const incoming = {
            _id: notificationId || `fcm-${Date.now()}`,
            type: data.type || "system",
            title: payload?.notification?.title || data.title || "Patient update",
            message: payload?.notification?.body || data.body || "You have a new update",
            createdAt: new Date().toISOString(),
            isRead: false,
            meta: {
              route: data.route,
            },
          };

          seenIdsRef.current.add(incoming._id);
          lastCheckedRef.current = incoming.createdAt;
          setNotifications((previous) => mergeNotifications(previous, [incoming]));
          setUnreadCount((previous) => previous + 1);

          notifyInfo(incoming.title, incoming.message, {
            push: true,
            duration: 5500,
          });
        });

        if (!isDisposed) {
          unsubscribeForeground = stop;
        }
      } catch (error) {
        console.error("Failed to initialize FCM", error);
      }
    };

    setupPushLayer();

    return () => {
      isDisposed = true;
      unsubscribeForeground();
    };
  }, [apiBaseUrl, isLoggedIn, token, userId, userType]);

  useEffect(() => {
    if (!isLoggedIn || userType !== "Doctor" || !token) {
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
      lastCheckedRef.current = null;
      seenIdsRef.current = new Set();
      initializedRef.current = false;
      return undefined;
    }

    let isDisposed = false;

    const fetchNotifications = async ({ incremental = false } = {}) => {
      if (pollingRef.current) return;
      pollingRef.current = true;

      if (!incremental && !initializedRef.current) {
        setIsLoading(true);
      }

      try {
        const query = new URLSearchParams({ limit: "20" });
        if (incremental && lastCheckedRef.current) {
          query.set("after", lastCheckedRef.current);
        }

        const response = await fetch(
          `${apiBaseUrl}/api/doctor-dashboard/notifications?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(data.notifications)) {
          return;
        }

        const fetched = data.notifications;
        setUnreadCount(Number.isFinite(data.unreadCount) ? data.unreadCount : 0);

        if (!initializedRef.current) {
          setNotifications(fetched);
          seenIdsRef.current = new Set(fetched.map((item) => item._id));
          lastCheckedRef.current = fetched[0]?.createdAt || new Date().toISOString();
          initializedRef.current = true;
          return;
        }

        if (fetched.length === 0) {
          return;
        }

        lastCheckedRef.current = fetched[0]?.createdAt || lastCheckedRef.current;

        const incoming = [...fetched].reverse();
        const newlyArrived = incoming.filter((item) => {
          if (!item?._id) return false;
          if (seenIdsRef.current.has(item._id)) return false;
          seenIdsRef.current.add(item._id);
          return true;
        });

        if (newlyArrived.length > 0) {
          setNotifications((previous) => mergeNotifications(previous, newlyArrived));

          newlyArrived.forEach((notification) => {
            notifyInfo(notification.title || "Patient update", notification.message || "You have a new update", {
              push: true,
              duration: 5500,
            });
          });
        }
      } catch (error) {
        console.error("Notification polling failed", error);
      } finally {
        pollingRef.current = false;
        if (!incremental) {
          setIsLoading(false);
        }
      }
    };

    const run = async () => {
      if (isDisposed) return;
      await fetchNotifications({ incremental: false });
    };

    run();
    const intervalId = window.setInterval(() => {
      if (!isDisposed) {
        fetchNotifications({ incremental: true });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, [apiBaseUrl, isLoggedIn, token, userType]);

  useEffect(() => {
    if (!isOpen || unreadCount <= 0 || !token) return;

    const markAllRead = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/doctor-dashboard/notifications/read-all`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        setUnreadCount(0);
        setNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    };

    markAllRead();
  }, [apiBaseUrl, isOpen, token, unreadCount]);

  if (!isLoggedIn || userType !== "Doctor") {
    return null;
  }

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    navigate(getNotificationRoute(notification));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((previous) => !previous);
          setIsLoading(false);
        }}
        className="relative p-1.5 sm:p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400 transition-all"
        title="Notifications"
      >
        <HiOutlineBell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(90vw,360px)] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Doctor notifications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Live updates from your patients</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-3 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800 hover:bg-red-50/60 dark:hover:bg-red-900/10 transition ${
                    notification.isRead ? "opacity-80" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                      {notification.title || "Patient update"}
                    </p>
                    {!notification.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />}
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorNotificationBell;
