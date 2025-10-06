import { getWebSocketService } from './websocketService';

export interface RealtimeMetric {
  id: string;
  type: 'revenue' | 'orders' | 'products' | 'customers' | 'inventory' | 'restock' | 'notifications';
  value: number;
  previousValue: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  confidence: 'high' | 'medium' | 'low';
  timestamp: Date;
  metadata?: any;
}

export interface LiveInsight {
  id: string;
  type: 'growth' | 'decline' | 'opportunity' | 'warning' | 'alert';
  category: 'financial' | 'product' | 'customer' | 'operational' | 'strategic';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  timestamp: Date;
  data: any;
  confidence: number;
  priority: number;
}

export interface RealtimeMetricsState {
  isConnected: boolean;
  isStreaming: boolean;
  metrics: Map<string, RealtimeMetric>;
  insights: LiveInsight[];
  lastUpdate: Date | null;
  error: string | null;
  streamingTypes: Set<string>;
}

class RealtimeMetricsService {
  private wsService = getWebSocketService();
  private state: RealtimeMetricsState = {
    isConnected: false,
    isStreaming: false,
    metrics: new Map(),
    insights: [],
    lastUpdate: null,
    error: null,
    streamingTypes: new Set()
  };
  private listeners: Set<(state: RealtimeMetricsState) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private insightInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeWebSocketListeners();
  }

  private initializeWebSocketListeners() {
    // Connection status
    this.wsService.on('connected', () => {
      this.updateState({ isConnected: true, error: null });
    });

    this.wsService.on('disconnected', () => {
      this.updateState({ 
        isConnected: false, 
        isStreaming: false,
        error: 'Connection lost'
      });
      this.stopAllStreaming();
    });

    // Real-time metrics
    this.wsService.on('dashboard:live:data', (data: any) => {
      this.handleLiveData(data);
    });

    // Live insights
    this.wsService.on('dashboard:insight:new', (insight: LiveInsight) => {
      this.handleNewInsight(insight);
    });

    // Dashboard updates
    this.wsService.on('dashboard:update', (data: any) => {
      this.handleDashboardUpdate(data);
    });

    // Error handling
    this.wsService.on('dashboard:error', (error: any) => {
      this.updateState({ error: error.message || 'Unknown error' });
    });
  }

  private updateState(updates: Partial<RealtimeMetricsState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private handleLiveData(data: any) {
    const metric: RealtimeMetric = {
      id: data.id || `${data.type}-${Date.now()}`,
      type: data.type,
      value: data.value || 0,
      previousValue: data.previousValue || 0,
      growth: data.growth || 0,
      trend: data.trend || 'stable',
      confidence: data.confidence || 'medium',
      timestamp: new Date(data.timestamp || Date.now()),
      metadata: data.metadata
    };

    this.state.metrics.set(metric.id, metric);
    this.updateState({ 
      lastUpdate: new Date(),
      isStreaming: true
    });
  }

  private handleNewInsight(insight: LiveInsight) {
    const newInsight = {
      ...insight,
      timestamp: new Date(insight.timestamp || Date.now())
    };

    this.state.insights.unshift(newInsight);
    
    // Keep only last 50 insights
    if (this.state.insights.length > 50) {
      this.state.insights = this.state.insights.slice(0, 50);
    }

    this.updateState({ lastUpdate: new Date() });
  }

  private handleDashboardUpdate(data: any) {
    if (data.metrics) {
      Object.entries(data.metrics).forEach(([key, value]: [string, any]) => {
        const metric: RealtimeMetric = {
          id: `${key}-${Date.now()}`,
          type: key as any,
          value: value.current || value.total || 0,
          previousValue: value.previous || value.previousPeriod || 0,
          growth: value.growth || 0,
          trend: value.trend || 'stable',
          confidence: 'high',
          timestamp: new Date(),
          metadata: value
        };
        this.state.metrics.set(metric.id, metric);
      });
    }

    this.updateState({ lastUpdate: new Date() });
  }

  // Public API
  public subscribe(listener: (state: RealtimeMetricsState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): RealtimeMetricsState {
    return { ...this.state };
  }

  public startStreaming(type: string) {
    if (!this.state.isConnected) {
      console.warn('Cannot start streaming: WebSocket not connected');
      return;
    }

    this.state.streamingTypes.add(type);
    this.wsService.emit('dashboard:subscribe:live', { type });
    
    this.updateState({ 
      isStreaming: true,
      streamingTypes: new Set(this.state.streamingTypes)
    });
  }

  public stopStreaming(type: string) {
    this.state.streamingTypes.delete(type);
    this.wsService.emit('dashboard:unsubscribe:live', { type });
    
    if (this.state.streamingTypes.size === 0) {
      this.updateState({ isStreaming: false });
    } else {
      this.updateState({ streamingTypes: new Set(this.state.streamingTypes) });
    }
  }

  public startInsightsStreaming() {
    if (!this.state.isConnected) {
      console.warn('Cannot start insights streaming: WebSocket not connected');
      return;
    }

    this.wsService.emit('dashboard:subscribe:insights');
  }

  public stopInsightsStreaming() {
    this.wsService.emit('dashboard:unsubscribe:insights');
  }

  public getMetricsByType(type: string): RealtimeMetric[] {
    return Array.from(this.state.metrics.values())
      .filter(metric => metric.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getLatestMetric(type: string): RealtimeMetric | null {
    const metrics = this.getMetricsByType(type);
    return metrics.length > 0 ? metrics[0] : null;
  }

  public getInsightsByCategory(category: string): LiveInsight[] {
    return this.state.insights.filter(insight => insight.category === category);
  }

  public getHighPriorityInsights(): LiveInsight[] {
    return this.state.insights
      .filter(insight => insight.impact === 'high' || insight.priority > 7)
      .sort((a, b) => b.priority - a.priority);
  }

  public clearInsights() {
    this.updateState({ insights: [] });
  }

  public clearMetrics() {
    this.updateState({ metrics: new Map() });
  }

  public clearAll() {
    this.updateState({ 
      metrics: new Map(), 
      insights: [],
      lastUpdate: null,
      error: null
    });
  }

  private stopAllStreaming() {
    this.state.streamingTypes.forEach(type => {
      this.wsService.emit('dashboard:unsubscribe:live', { type });
    });
    this.wsService.emit('dashboard:unsubscribe:insights');
    
    this.updateState({ 
      streamingTypes: new Set(),
      isStreaming: false
    });
  }

  // Generate mock data for development/testing
  public generateMockData(type: string, count: number = 10) {
    const mockMetrics: RealtimeMetric[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const value = Math.floor(Math.random() * 1000) + 100;
      const previousValue = value * (0.8 + Math.random() * 0.4);
      const growth = ((value - previousValue) / previousValue) * 100;
      
      mockMetrics.push({
        id: `${type}-mock-${i}`,
        type: type as any,
        value,
        previousValue,
        growth,
        trend: growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable',
        confidence: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        timestamp: new Date(now.getTime() - i * 60000), // 1 minute intervals
        metadata: { mock: true }
      });
    }

    mockMetrics.forEach(metric => {
      this.state.metrics.set(metric.id, metric);
    });

    this.updateState({ lastUpdate: new Date() });
  }

  public generateMockInsights(count: number = 5) {
    const insightTypes = ['growth', 'decline', 'opportunity', 'warning', 'alert'];
    const categories = ['financial', 'product', 'customer', 'operational', 'strategic'];
    const impacts = ['high', 'medium', 'low'];
    
    const mockInsights: LiveInsight[] = [];

    for (let i = 0; i < count; i++) {
      const type = insightTypes[Math.floor(Math.random() * insightTypes.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const impact = impacts[Math.floor(Math.random() * impacts.length)];
      
      mockInsights.push({
        id: `insight-mock-${i}`,
        type: type as any,
        category: category as any,
        title: `Mock ${type.charAt(0).toUpperCase() + type.slice(1)} Insight ${i + 1}`,
        description: `This is a mock ${type} insight for ${category} category with ${impact} impact.`,
        impact: impact as any,
        actionable: Math.random() > 0.5,
        actionText: Math.random() > 0.5 ? 'View Details' : undefined,
        actionUrl: Math.random() > 0.5 ? '/analytics' : undefined,
        timestamp: new Date(),
        data: { mock: true, confidence: Math.random() * 100 },
        confidence: Math.random() * 100,
        priority: Math.floor(Math.random() * 10) + 1
      });
    }

    this.state.insights.unshift(...mockInsights);
    this.updateState({ lastUpdate: new Date() });
  }
}

// Singleton instance
let realtimeMetricsService: RealtimeMetricsService | null = null;

export const getRealtimeMetricsService = (): RealtimeMetricsService => {
  if (!realtimeMetricsService) {
    realtimeMetricsService = new RealtimeMetricsService();
  }
  return realtimeMetricsService;
};

export default RealtimeMetricsService;
