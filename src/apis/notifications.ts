import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";

export type Notification = {
  id: string;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  category?: string;
  priority?: string;
  metadata?: any;
};

export async function fetchNotifications(): Promise<Notification[]> {
  return service<Notification[]>({
    url: API_URL.notifications.list,
    method: "GET",
  });
}

export async function markNotificationRead(id: string): Promise<Notification> {
  return service<Notification>({
    url: API_URL.notifications.read(id),
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<{
  success: boolean;
}> {
  return service<{ success: boolean }>({
    url: API_URL.notifications.readAll,
    method: "POST",
  });
}

// New function to clear individual notification (hide from UI without deleting from DB)
export async function clearNotification(
  id: string
): Promise<{ success: boolean }> {
  return service<{ success: boolean }>({
    url: API_URL.notifications.clear(id),
    method: "POST",
  });
}

// New function to clear all notifications (hide from UI without deleting from DB)
export async function clearAllNotifications(): Promise<{ success: boolean }> {
  return service<{ success: boolean }>({
    url: API_URL.notifications.clearAll,
    method: "POST",
  });
}

export function subscribeNotifications(
  onEvent: (payload: any) => void
): () => void {
  let isCancelled = false;
  const poll = async () => {
    try {
      const list = await fetchNotifications();
      if (!isCancelled && Array.isArray(list)) {
        onEvent({ batch: list });
      }
    } catch {}
  };
  // initial fetch and interval
  poll();
  const id = setInterval(poll, 600000); // 10 minutes
  return () => {
    isCancelled = true;
    clearInterval(id);
  };
}
