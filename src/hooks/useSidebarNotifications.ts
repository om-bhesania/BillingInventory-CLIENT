import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";

export const useSidebarNotifications = () => {
  const { notifications } = useNotifications();
  const { user } = useAuth();
  const location = useLocation();
  const [clearedModules, setClearedModules] = useState<Set<string>>(new Set());

  // Clear badges when visiting relevant pages
  useEffect(() => {
    const path = location.pathname;
    
    // Clear badges based on current page
    if (path.includes('/invoices')) {
      setClearedModules(prev => new Set([...prev, 'Billing']));
    } else if (path.includes('/restock-management') || path.includes('/low-stock')) {
      setClearedModules(prev => new Set([...prev, 'Restock Management']));
    } else if (path.includes('/tickets')) {
      setClearedModules(prev => new Set([...prev, 'Support']));
    } else if (path.includes('/shop-inventory')) {
      setClearedModules(prev => new Set([...prev, 'Shop Inventory']));
    }
  }, [location.pathname]);

  const counts = useMemo(() => {
    const isAdmin = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "owner";
    const isShopOwner = user?.role?.toLowerCase() === "shop owner" || 
                       user?.role?.toLowerCase() === "shop_owner" || 
                       user?.role?.toLowerCase() === "shopowner";

    const unreadNotifications = notifications.filter(n => !n.isRead);

    return {
      // Admin notifications
      invoices: isAdmin && !clearedModules.has('Billing') ? unreadNotifications.filter(n => 
        n.category === "BILLING" || n.type.includes("INVOICE")
      ).length : 0,
      
      restock: isAdmin && !clearedModules.has('Restock Management') ? unreadNotifications.filter(n => 
        n.category === "RESTOCK" || n.type.includes("RESTOCK")
      ).length : 0,
      
      support: isAdmin && !clearedModules.has('Support') ? unreadNotifications.filter(n => 
        n.category === "CHAT" || n.type.includes("CHAT") || n.type.includes("TICKET")
      ).length : 0,
      
      // Shop Owner notifications
      lowStock: isShopOwner && !clearedModules.has('Shop Inventory') ? unreadNotifications.filter(n => 
        n.category === "INVENTORY" || n.type.includes("LOW_STOCK")
      ).length : 0,
      
      // General notifications
      total: unreadNotifications.length
    };
  }, [notifications, user?.role, clearedModules]);

  return counts;
};
