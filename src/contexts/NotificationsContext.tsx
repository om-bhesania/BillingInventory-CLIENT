import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Notification, fetchNotifications, markAllNotificationsRead, markNotificationRead, subscribeNotifications, clearNotification, clearAllNotifications } from "@/apis/notifications";
import { useAuth } from "@/contexts/AuthContext";

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications().then(setNotifications).catch(() => {});
    const unsubscribe = subscribeNotifications((evt) => {
      if (evt?.event === "created" && evt.notification) {
        setNotifications((prev) => [evt.notification as Notification, ...prev]);
      } else if (Array.isArray(evt?.batch)) {
        setNotifications(evt.batch as Notification[]);
      }
    });
    return () => unsubscribe();
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const markRead = async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {}
  };

  const markAllReadFn = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const clearNotificationFn = async (id: string) => {
    try {
      await clearNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  const clearAllNotificationsFn = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch {}
  };

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markRead, 
      markAllRead: markAllReadFn,
      clearNotification: clearNotificationFn,
      clearAllNotifications: clearAllNotificationsFn
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
};


