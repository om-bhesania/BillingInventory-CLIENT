import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export const useNotificationCounts = () => {
  const { notifications } = useNotifications();
  const { user } = useAuth();

  const counts = useMemo(() => {
    const isAdmin = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "owner";
    const isShopOwner = user?.role?.toLowerCase() === "shop owner" || 
                       user?.role?.toLowerCase() === "shop_owner" || 
                       user?.role?.toLowerCase() === "shopowner";

    const unreadNotifications = notifications.filter(n => !n.isRead);

    return {
      // Admin notifications
      invoices: isAdmin ? unreadNotifications.filter(n => 
        n.category === "BILLING" || n.type.includes("INVOICE")
      ).length : 0,
      
      restock: isAdmin ? unreadNotifications.filter(n => 
        n.category === "RESTOCK" || n.type.includes("RESTOCK")
      ).length : 0,
      
      support: isAdmin ? unreadNotifications.filter(n => 
        n.category === "CHAT" || n.type.includes("CHAT") || n.type.includes("TICKET")
      ).length : 0,
      
      // Shop Owner notifications
      lowStock: isShopOwner ? unreadNotifications.filter(n => 
        n.category === "INVENTORY" || n.type.includes("LOW_STOCK")
      ).length : 0,
      
      // General notifications
      total: unreadNotifications.length
    };
  }, [notifications, user?.role]);

  return counts;
};
