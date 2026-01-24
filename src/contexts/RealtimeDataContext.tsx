import React, { createContext, useContext, useEffect, useState } from "react";
import { getWebSocketService } from "@/services/websocketService";

interface RealtimeDataContextType {
  inventoryUpdates: any[];
  restockUpdates: any[];
  billingUpdates: any[];
  productUpdates: any[];
  shopUpdates: any[];
  dashboardUpdates: any[];
  lowStockAlerts: any[];
  systemHealth: any;
  isConnected: boolean;
  connectionStatus: any;
  reconnectAttempts: number;
  clearUpdates: (type: string) => void;
  clearAllUpdates: () => void;
  reconnect: () => void;
  refreshConnection: () => void;
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

export const RealtimeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventoryUpdates, setInventoryUpdates] = useState<any[]>([]);
  const [restockUpdates, setRestockUpdates] = useState<any[]>([]);
  const [billingUpdates, setBillingUpdates] = useState<any[]>([]);
  const [productUpdates, setProductUpdates] = useState<any[]>([]);
  const [shopUpdates, setShopUpdates] = useState<any[]>([]);
  const [dashboardUpdates, setDashboardUpdates] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const wsService = getWebSocketService();
    
    // Connection status
    const handleConnectionStatus = (status: any) => {
      console.log('Connection status update:', status);
      setIsConnected(status.connected);
      setConnectionStatus(status);
      setReconnectAttempts(status.attempts || 0);
    };

    // Inventory updates
    const handleInventoryUpdate = (data: any) => {
      setInventoryUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates
    };

    // Restock updates
    const handleRestockUpdate = (data: any) => {
      setRestockUpdates(prev => [data, ...prev.slice(0, 49)]);
    };

    // Billing updates
    const handleBillingUpdate = (data: any) => {
      setBillingUpdates(prev => [data, ...prev.slice(0, 49)]);
    };

    // Product updates
    const handleProductUpdate = (data: any) => {
      setProductUpdates(prev => [data, ...prev.slice(0, 49)]);
    };

    // Shop updates
    const handleShopUpdate = (data: any) => {
      setShopUpdates(prev => [data, ...prev.slice(0, 49)]);
    };

    // Dashboard updates
    const handleDashboardUpdate = (data: any) => {
      setDashboardUpdates(prev => [data, ...prev.slice(0, 49)]);
    };

    // Low stock alerts
    const handleLowStockAlert = (data: any) => {
      setLowStockAlerts(prev => [data, ...prev.slice(0, 49)]);
    };

    // Raw material low stock alerts
    const handleRawMaterialLowStockAlert = (data: any) => {
      setLowStockAlerts(prev => [data, ...prev.slice(0, 49)]);
    };

    // System health
    const handleSystemHealth = (data: any) => {
      setSystemHealth(data);
    };

    // Subscribe to events
    wsService.on('connection:status', handleConnectionStatus);
    wsService.on('inventory:update', handleInventoryUpdate);
    wsService.on('restock:status:update', handleRestockUpdate);
    wsService.on('billing:update', handleBillingUpdate);
    wsService.on('product:update', handleProductUpdate);
    wsService.on('shop:update', handleShopUpdate);
    wsService.on('dashboard:update', handleDashboardUpdate);
    wsService.on('low_stock:alert', handleLowStockAlert);
    wsService.on('raw_material:low_stock', handleRawMaterialLowStockAlert);
    wsService.on('system:health', handleSystemHealth);

    // Initial connection status
    const initialStatus = wsService.getConnectionStatus();
    setIsConnected(initialStatus.connected);
    setConnectionStatus(initialStatus);
    setReconnectAttempts(initialStatus.attempts || 0);

    return () => {
      wsService.off('connection:status', handleConnectionStatus);
      wsService.off('inventory:update', handleInventoryUpdate);
      wsService.off('restock:status:update', handleRestockUpdate);
      wsService.off('billing:update', handleBillingUpdate);
      wsService.off('product:update', handleProductUpdate);
      wsService.off('shop:update', handleShopUpdate);
      wsService.off('dashboard:update', handleDashboardUpdate);
      wsService.off('low_stock:alert', handleLowStockAlert);
      wsService.off('raw_material:low_stock', handleRawMaterialLowStockAlert);
      wsService.off('system:health', handleSystemHealth);
    };
  }, []);

  const clearUpdates = (type: string) => {
    switch (type) {
      case 'inventory':
        setInventoryUpdates([]);
        break;
      case 'restock':
        setRestockUpdates([]);
        break;
      case 'billing':
        setBillingUpdates([]);
        break;
      case 'product':
        setProductUpdates([]);
        break;
      case 'shop':
        setShopUpdates([]);
        break;
      case 'dashboard':
        setDashboardUpdates([]);
        break;
      case 'lowStock':
        setLowStockAlerts([]);
        break;
    }
  };

  const clearAllUpdates = () => {
    setInventoryUpdates([]);
    setRestockUpdates([]);
    setBillingUpdates([]);
    setProductUpdates([]);
    setShopUpdates([]);
    setDashboardUpdates([]);
    setLowStockAlerts([]);
  };

  const reconnect = () => {
    const wsService = getWebSocketService();
    wsService.reconnect();
  };

  const refreshConnection = () => {
    const wsService = getWebSocketService();
    wsService.refreshConnection();
  };

  return (
    <RealtimeDataContext.Provider value={{
      inventoryUpdates,
      restockUpdates,
      billingUpdates,
      productUpdates,
      shopUpdates,
      dashboardUpdates,
      lowStockAlerts,
      systemHealth,
      isConnected,
      connectionStatus,
      reconnectAttempts,
      clearUpdates,
      clearAllUpdates,
      reconnect,
      refreshConnection
    }}>
      {children}
    </RealtimeDataContext.Provider>
  );
};

export const useRealtimeData = () => {
  const context = useContext(RealtimeDataContext);
  if (!context) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }
  return context;
};

