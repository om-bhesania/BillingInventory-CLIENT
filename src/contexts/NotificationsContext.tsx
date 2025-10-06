import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Notification, fetchNotifications, markAllNotificationsRead, markNotificationRead, subscribeNotifications, clearNotification, clearAllNotifications } from "@/apis/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { getWebSocketService } from "@/services/websocketService";

type RealtimeUpdate = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
};

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'userId'>) => void;
  isWebSocketConnected: boolean;
  connectionStatus: { connected: boolean; attempts: number };
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, attempts: 0 });

  // Helper function to create notification from WebSocket data
  const createNotificationFromUpdate = (data: any, type: string): Omit<Notification, 'id' | 'userId'> => {
    const timestamp = new Date().toISOString();
    return {
      type,
      message: data.message || `${type} updated`,
      isRead: false,
      createdAt: timestamp,
      category: data.category || getCategoryFromType(type),
      priority: data.priority || getPriorityFromType(type),
      metadata: data.metadata
    };
  };

  // Helper function to get category from update type
  const getCategoryFromType = (type: string): string => {
    const categoryMap: Record<string, string> = {
      'inventory': 'INVENTORY',
      'restock': 'RESTOCK',
      'billing': 'BILLING',
      'product': 'INVENTORY',
      'shop': 'SYSTEM',
      'dashboard': 'SYSTEM',
      'lowStock': 'INVENTORY',
      'chat': 'CHAT',
      'factory': 'FACTORY',
      'LOW_STOCK_ALERT': 'INVENTORY',
      'RESTOCK_REQUEST': 'RESTOCK',
      'RESTOCK_APPROVED': 'RESTOCK',
      'RESTOCK_REJECTED': 'RESTOCK',
      'SHOP_INVOICE_CREATED': 'BILLING',
      'FACTORY_INVOICE_CREATED': 'FACTORY',
      'PRODUCT_CREATED': 'INVENTORY',
      'PRODUCT_UPDATED': 'INVENTORY',
      'CATEGORY_CREATED': 'INVENTORY',
      'CATEGORY_UPDATED': 'INVENTORY',
      'CATEGORY_DEACTIVATED': 'INVENTORY',
      'FLAVOR_CREATED': 'INVENTORY',
      'CHAT_MESSAGE': 'CHAT',
      'CHAT_REQUEST': 'CHAT',
      'LOGIN_SUCCESS': 'SYSTEM'
    };
    return categoryMap[type] || 'SYSTEM';
  };

  // Helper function to get priority from update type
  const getPriorityFromType = (type: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      'lowStock': 'HIGH',
      'LOW_STOCK_ALERT': 'HIGH',
      'inventory': 'MEDIUM',
      'restock': 'MEDIUM',
      'RESTOCK_REQUEST': 'MEDIUM',
      'RESTOCK_APPROVED': 'MEDIUM',
      'RESTOCK_REJECTED': 'HIGH',
      'billing': 'MEDIUM',
      'SHOP_INVOICE_CREATED': 'MEDIUM',
      'FACTORY_INVOICE_CREATED': 'MEDIUM',
      'product': 'LOW',
      'PRODUCT_CREATED': 'LOW',
      'PRODUCT_UPDATED': 'LOW',
      'CATEGORY_CREATED': 'LOW',
      'CATEGORY_UPDATED': 'LOW',
      'CATEGORY_DEACTIVATED': 'LOW',
      'FLAVOR_CREATED': 'LOW',
      'shop': 'LOW',
      'dashboard': 'LOW',
      'chat': 'MEDIUM',
      'CHAT_MESSAGE': 'MEDIUM',
      'CHAT_REQUEST': 'MEDIUM',
      'factory': 'MEDIUM',
      'system': 'LOW',
      'LOGIN_SUCCESS': 'LOW'
    };
    return priorityMap[type] || 'MEDIUM';
  };

  useEffect(() => {
    if (!user) return;
    
    // Initialize WebSocket service
    const wsService = getWebSocketService();
    
    // Fetch initial notifications
    fetchNotifications().then(setNotifications).catch(() => {});
    
    // Setup WebSocket event listeners
    const handleWebSocketNotification = (data: any) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification as Notification, ...prev]);
      }
    };

    const handleConnectionStatus = (status: any) => {
      setIsWebSocketConnected(status.connected);
      setConnectionStatus(wsService.getConnectionStatus());
    };

    const handleNotificationReadSuccess = (data: any) => {
      if (data?.notificationId) {
        setNotifications((prev) => 
          prev.map((n) => 
            n.id === data.notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    };

    const handleNotificationCleared = (data: any) => {
      if (data?.notificationId) {
        setNotifications((prev) => prev.filter(n => n.id !== data.notificationId));
      }
    };

    const handleNotificationClearedAll = () => {
      setNotifications([]);
    };

    // Comprehensive live update handler for all notification types
    const handleLiveUpdate = (data: any, type: string) => {
      const notification = createNotificationFromUpdate(data, type);
      addNotificationFn(notification);
    };

    // Realtime update handlers - now add as notifications
    const handleInventoryUpdate = (data: any) => {
      handleLiveUpdate(data, 'inventory');
    };

    const handleRestockUpdate = (data: any) => {
      handleLiveUpdate(data, 'restock');
    };

    const handleBillingUpdate = (data: any) => {
      handleLiveUpdate(data, 'billing');
    };

    const handleProductUpdate = (data: any) => {
      handleLiveUpdate(data, 'product');
    };

    const handleShopUpdate = (data: any) => {
      handleLiveUpdate(data, 'shop');
    };

    const handleDashboardUpdate = (data: any) => {
      handleLiveUpdate(data, 'dashboard');
    };

    const handleLowStockAlert = (data: any) => {
      handleLiveUpdate(data, 'lowStock');
    };

    // Handle chat notifications
    const handleChatMessage = (data: any) => {
      handleLiveUpdate(data, 'CHAT_MESSAGE');
    };

    // Handle chat request notifications
    const handleChatRequest = (data: any) => {
      handleLiveUpdate(data, 'CHAT_REQUEST');
    };

    // Handle system notifications
    const handleSystemNotification = (data: any) => {
      handleLiveUpdate(data, 'system');
    };

    // Handle payment notifications
    const handlePaymentUpdate = (data: any) => {
      handleLiveUpdate(data, 'payment');
    };

    // Handle discount notifications
    const handleDiscountUpdate = (data: any) => {
      handleLiveUpdate(data, 'discount');
    };

    // Handle restock request notifications
    const handleRestockRequestCreated = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    const handleRestockRequestApproved = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    const handleRestockRequestRejected = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    const handleRestockRequestStatusUpdated = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    const handleRestockRequestFulfilled = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    const handleRestockRequestAutoGenerated = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    const handleRestockRequestHidden = (data: any) => {
      handleLiveUpdate(data, 'RESTOCK_REQUEST');
    };

    // Subscribe to WebSocket events
    wsService.on('notification:new', handleWebSocketNotification);
    wsService.on('connection:status', handleConnectionStatus);
    wsService.on('notification:read:success', handleNotificationReadSuccess);
    wsService.on('notification:cleared', handleNotificationCleared);
    wsService.on('notification:cleared_all', handleNotificationClearedAll);
    
    // Subscribe to realtime update events
    wsService.on('inventory:update', handleInventoryUpdate);
    wsService.on('restock:status:update', handleRestockUpdate);
    wsService.on('billing:update', handleBillingUpdate);
    wsService.on('product:update', handleProductUpdate);
    wsService.on('shop:update', handleShopUpdate);
    wsService.on('dashboard:update', handleDashboardUpdate);
    wsService.on('low_stock:alert', handleLowStockAlert);
    wsService.on('chat:message:new', handleChatMessage);
    wsService.on('chat_request_assigned', handleChatRequest);
    wsService.on('chat_request_status_updated', handleChatRequest);
    wsService.on('system:notification', handleSystemNotification);
    wsService.on('payment:update', handlePaymentUpdate);
    wsService.on('discount:update', handleDiscountUpdate);
    
    // Restock request specific events
    wsService.on('restock_request_created', handleRestockRequestCreated);
    wsService.on('restock_request_approved', handleRestockRequestApproved);
    wsService.on('restock_request_rejected', handleRestockRequestRejected);
    wsService.on('restock_request_status_updated', handleRestockRequestStatusUpdated);
    wsService.on('restock_request_fulfilled', handleRestockRequestFulfilled);
    wsService.on('restock_request_auto_generated', handleRestockRequestAutoGenerated);
    wsService.on('restock_request_hidden', handleRestockRequestHidden);

    // Keep existing SSE subscription as fallback
    const unsubscribe = subscribeNotifications((evt) => {
      if (evt?.event === "created" && evt.notification) {
        setNotifications((prev) => [evt.notification as Notification, ...prev]);
      } else if (Array.isArray(evt?.batch)) {
        setNotifications(evt.batch as Notification[]);
      }
    });

    // Initial connection status
    setConnectionStatus(wsService.getConnectionStatus());
    setIsWebSocketConnected(wsService.isConnected);

    return () => {
      unsubscribe();
      wsService.off('notification:new', handleWebSocketNotification);
      wsService.off('connection:status', handleConnectionStatus);
      wsService.off('notification:read:success', handleNotificationReadSuccess);
      wsService.off('notification:cleared', handleNotificationCleared);
      wsService.off('notification:cleared_all', handleNotificationClearedAll);
      
      // Cleanup realtime update listeners
      wsService.off('inventory:update', handleInventoryUpdate);
      wsService.off('restock:status:update', handleRestockUpdate);
      wsService.off('billing:update', handleBillingUpdate);
      wsService.off('product:update', handleProductUpdate);
      wsService.off('shop:update', handleShopUpdate);
      wsService.off('dashboard:update', handleDashboardUpdate);
      wsService.off('low_stock:alert', handleLowStockAlert);
      wsService.off('chat:message:new', handleChatMessage);
      wsService.off('chat_request_assigned', handleChatRequest);
      wsService.off('chat_request_status_updated', handleChatRequest);
      wsService.off('system:notification', handleSystemNotification);
      wsService.off('payment:update', handlePaymentUpdate);
      wsService.off('discount:update', handleDiscountUpdate);
      
      // Cleanup restock request event listeners
      wsService.off('restock_request_created', handleRestockRequestCreated);
      wsService.off('restock_request_approved', handleRestockRequestApproved);
      wsService.off('restock_request_rejected', handleRestockRequestRejected);
      wsService.off('restock_request_status_updated', handleRestockRequestStatusUpdated);
      wsService.off('restock_request_fulfilled', handleRestockRequestFulfilled);
      wsService.off('restock_request_auto_generated', handleRestockRequestAutoGenerated);
      wsService.off('restock_request_hidden', handleRestockRequestHidden);
    };
  }, [user?.id]);

  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.isRead).length, 
    [notifications]
  );

  const markRead = async (id: string) => {
    try {
      // Try WebSocket first
      const wsService = getWebSocketService();
      if (wsService.isConnected) {
        wsService.markNotificationAsRead(id);
        // Optimistically update UI
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      } else {
        // Fallback to API
        const updated = await markNotificationRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
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

  const addNotificationFn = (notification: Omit<Notification, 'id' | 'userId'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user?.id || 0
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markRead, 
      markAllRead: markAllReadFn,
      clearNotification: clearNotificationFn,
      clearAllNotifications: clearAllNotificationsFn,
      addNotification: addNotificationFn,
      isWebSocketConnected,
      connectionStatus
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


