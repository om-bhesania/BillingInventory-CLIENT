import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getWebSocketService } from '@/services/websocketService';

interface DateRange {
  from: Date;
  to: Date;
}

interface ComparisonPeriod {
  from: Date;
  to: Date;
  label: string;
  type: 'previous' | 'year_ago' | 'custom';
}

interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  orders: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  products: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  customers: {
    current: number;
    previous: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface LiveInsight {
  id: string;
  type: 'growth' | 'decline' | 'opportunity' | 'warning';
  category: 'financial' | 'product' | 'customer' | 'operational' | 'strategic';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  timestamp: Date;
  data: any;
}

interface LiveData {
  type: string;
  data: any;
  timestamp: Date;
}

interface DashboardWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  metrics: DashboardMetrics | null;
  insights: LiveInsight[];
  liveData: LiveData[];
  dateRange: DateRange | null;
  comparisonPeriod: ComparisonPeriod | null;
  preferences: any;
}

interface DashboardWebSocketActions {
  connect: () => void;
  disconnect: () => void;
  changeDateRange: (dateRange: DateRange, comparisonType?: string) => void;
  subscribeToLiveData: (type: string) => void;
  unsubscribeFromLiveData: (type: string) => void;
  subscribeToInsights: () => void;
  unsubscribeFromInsights: () => void;
  savePreferences: (preferences: any) => void;
  loadPreferences: () => void;
  resetToDefault: () => void;
  clearInsights: () => void;
}

export const useDashboardWebSocket = (): DashboardWebSocketState & DashboardWebSocketActions => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<DashboardWebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    metrics: null,
    insights: [],
    liveData: [],
    dateRange: null,
    comparisonPeriod: null,
    preferences: {}
  });

  const wsService = getWebSocketService();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsService.isConnected || state.isConnecting) {
      return;
    }

    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    // Use the existing WebSocket service
    wsService.connect();

    // Listen to WebSocket service events
    const handleConnect = () => {
      console.log('🔌 Dashboard WebSocket connected');
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null
      }));
      reconnectAttempts.current = 0;
      
      toast({
        title: "Connected to Real-time Dashboard",
        description: "You're now receiving live updates",
        duration: 3000,
      });
    };

    const handleDisconnect = (reason: string) => {
      console.log('🔌 Dashboard WebSocket disconnected:', reason);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false
      }));
    };

    const handleError = (error: any) => {
      console.error('🔌 Dashboard WebSocket connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Connection failed'
      }));
      
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to real-time dashboard. Some features may be limited.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    // Subscribe to WebSocket service events
    wsService.on('connected', handleConnect);
    wsService.on('disconnected', handleDisconnect);
    wsService.on('connection:error', handleError);

    // Dashboard-specific events
    const handleDashboardConnected = (data: any) => {
      console.log('📊 Dashboard WebSocket features:', data.features);
      setState(prev => ({ ...prev, preferences: data.preferences || {} }));
    };

    const handleDateRangeUpdated = (data: any) => {
      console.log('📊 Date range updated:', data);
      setState(prev => ({
        ...prev,
        dateRange: data.dateRange,
        comparisonPeriod: data.comparisonPeriod,
        metrics: data.metrics
      }));
    };

    const handleLiveData = (data: any) => {
      console.log('📊 Live data received:', data);
      setState(prev => ({
        ...prev,
        liveData: [...prev.liveData.slice(-49), data] // Keep last 50 items
      }));
    };

    const handleNewInsight = (insight: LiveInsight) => {
      console.log('📊 New insight received:', insight);
      setState(prev => ({
        ...prev,
        insights: [insight, ...prev.insights.slice(0, 19)] // Keep last 20 insights
      }));

      // Show toast for high-impact insights
      if (insight.impact === 'high') {
        toast({
          title: insight.title,
          description: insight.description,
          duration: 8000,
          action: insight.actionable && insight.actionText ? {
            altText: insight.actionText,
            onClick: () => {
              if (insight.actionUrl) {
                window.location.href = insight.actionUrl;
              }
            }
          } : undefined
        });
      }
    };

    const handlePreferencesLoaded = (data: any) => {
      setState(prev => ({ ...prev, preferences: data.preferences }));
    };

    const handlePreferencesSaved = (data: any) => {
      setState(prev => ({ ...prev, preferences: data.preferences }));
      toast({
        title: "Preferences Saved",
        description: "Your dashboard preferences have been updated",
        duration: 2000,
      });
    };

    const handleResetComplete = (data: any) => {
      setState(prev => ({
        ...prev,
        dateRange: data.dateRange,
        preferences: data.preferences
      }));
      toast({
        title: "Reset to Default",
        description: "Dashboard has been reset to default settings",
        duration: 3000,
      });
    };

    const handleDashboardError = (data: any) => {
      console.error('📊 Dashboard error:', data);
      toast({
        title: "Dashboard Error",
        description: data.message || 'An error occurred',
        variant: "destructive",
        duration: 5000,
      });
    };

    // Subscribe to dashboard events
    wsService.on('dashboard:connected', handleDashboardConnected);
    wsService.on('dashboard:dateRange:updated', handleDateRangeUpdated);
    wsService.on('dashboard:live:data', handleLiveData);
    wsService.on('dashboard:insight:new', handleNewInsight);
    wsService.on('dashboard:preferences:loaded', handlePreferencesLoaded);
    wsService.on('dashboard:preferences:saved', handlePreferencesSaved);
    wsService.on('dashboard:reset:complete', handleResetComplete);
    wsService.on('dashboard:error', handleDashboardError);

  }, [user, toast]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }));
  }, [wsService]);

  const changeDateRange = useCallback((dateRange: DateRange, comparisonType?: string) => {
    if (wsService.isConnected) {
      try {
        wsService.emit('dashboard:dateRange:change', { dateRange, comparisonType });
        console.log('📊 Date range change requested:', { dateRange, comparisonType });
      } catch (error) {
        console.error('📊 Error changing date range:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to update date range' 
        }));
      }
    } else {
      console.warn('📊 WebSocket not connected, cannot change date range');
      setState(prev => ({ 
        ...prev, 
        error: 'WebSocket not connected' 
      }));
    }
  }, [wsService]);

  const subscribeToLiveData = useCallback((type: string) => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:subscribe:live', { type });
    }
  }, [wsService]);

  const unsubscribeFromLiveData = useCallback((type: string) => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:unsubscribe:live', { type });
    }
  }, [wsService]);

  const subscribeToInsights = useCallback(() => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:subscribe:insights');
    }
  }, [wsService]);

  const unsubscribeFromInsights = useCallback(() => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:unsubscribe:insights');
    }
  }, [wsService]);

  const savePreferences = useCallback((preferences: any) => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:preferences:save', { preferences });
    }
  }, [wsService]);

  const loadPreferences = useCallback(() => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:preferences:load');
    }
  }, [wsService]);

  const resetToDefault = useCallback(() => {
    if (wsService.isConnected) {
      wsService.emit('dashboard:reset:default');
    }
  }, [wsService]);

  const clearInsights = useCallback(() => {
    setState(prev => ({ ...prev, insights: [] }));
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && !wsService.isConnected && !state.isConnecting) {
      connect();
    }
  }, [user, wsService.isConnected, state.isConnecting, connect]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!user && wsService.isConnected) {
      disconnect();
    }
  }, [user, wsService.isConnected, disconnect]);

  // Sync connection status with WebSocket service
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: wsService.isConnected
    }));
  }, [wsService.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    changeDateRange,
    subscribeToLiveData,
    unsubscribeFromLiveData,
    subscribeToInsights,
    unsubscribeFromInsights,
    savePreferences,
    loadPreferences,
    resetToDefault,
    clearInsights
  };
};
