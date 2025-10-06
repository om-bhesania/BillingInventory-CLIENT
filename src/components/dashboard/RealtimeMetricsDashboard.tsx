import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Bell,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRealtimeMetricsService, RealtimeMetric, LiveInsight } from '@/services/realtimeMetricsService';
import { format } from 'date-fns';

interface RealtimeMetricsDashboardProps {
  className?: string;
  showInsights?: boolean;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const metricIcons = {
  revenue: DollarSign,
  orders: ShoppingCart,
  products: Package,
  customers: Users,
  inventory: BarChart3,
  restock: RefreshCw,
  notifications: Bell
};

const metricColors = {
  revenue: 'text-green-600',
  orders: 'text-blue-600',
  products: 'text-purple-600',
  customers: 'text-orange-600',
  inventory: 'text-indigo-600',
  restock: 'text-yellow-600',
  notifications: 'text-red-600'
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-600'
};

const confidenceColors = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800'
};

const impactColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
};

export const RealtimeMetricsDashboard: React.FC<RealtimeMetricsDashboardProps> = ({
  className,
  showInsights = true,
  showControls = true,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [state, setState] = useState(getRealtimeMetricsService().getState());
  const [selectedMetricType, setSelectedMetricType] = useState<string>('revenue');
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);

  const realtimeService = getRealtimeMetricsService();

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(setState);
    return unsubscribe;
  }, [realtimeService]);

  // Auto-refresh for mock data generation
  useEffect(() => {
    if (!autoRefresh || state.isConnected) return;

    const interval = setInterval(() => {
      if (!state.isConnected && !isGeneratingMockData) {
        // Generate mock data when not connected
        realtimeService.generateMockData(selectedMetricType, 5);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, state.isConnected, selectedMetricType, isGeneratingMockData, realtimeService]);

  const handleStartStreaming = useCallback((type: string) => {
    realtimeService.startStreaming(type);
  }, [realtimeService]);

  const handleStopStreaming = useCallback((type: string) => {
    realtimeService.stopStreaming(type);
  }, [realtimeService]);

  const handleStartInsights = useCallback(() => {
    realtimeService.startInsightsStreaming();
  }, [realtimeService]);

  const handleStopInsights = useCallback(() => {
    realtimeService.stopInsightsStreaming();
  }, [realtimeService]);

  const handleGenerateMockData = useCallback(async () => {
    setIsGeneratingMockData(true);
    try {
      realtimeService.generateMockData(selectedMetricType, 10);
      realtimeService.generateMockInsights(5);
    } finally {
      setIsGeneratingMockData(false);
    }
  }, [realtimeService, selectedMetricType]);

  const handleClearAll = useCallback(() => {
    realtimeService.clearAll();
  }, [realtimeService]);

  const getConnectionStatus = () => {
    if (state.isConnecting) return { status: 'connecting', icon: RefreshCw, text: 'Connecting...', color: 'text-yellow-500' };
    if (state.isConnected) return { status: 'connected', icon: Wifi, text: 'Live', color: 'text-green-500' };
    return { status: 'disconnected', icon: WifiOff, text: 'Offline', color: 'text-red-500' };
  };

  const renderMetricCard = (metric: RealtimeMetric) => {
    const Icon = metricIcons[metric.type] || Activity;
    const TrendIcon = trendIcons[metric.trend];
    const colorClass = metricColors[metric.type] || 'text-gray-600';
    const trendColorClass = trendColors[metric.trend];

    return (
      <Card key={metric.id} className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Icon className={cn("h-4 w-4", colorClass)} />
            <span className="capitalize">{metric.type}</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <TrendIcon className={cn("h-4 w-4", trendColorClass)} />
            <Badge variant="outline" className={cn("text-xs", confidenceColors[metric.confidence])}>
              {metric.confidence}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>vs {metric.previousValue.toLocaleString()}</span>
            <span className={cn("font-medium", trendColorClass)}>
              {metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {format(metric.timestamp, 'HH:mm:ss')}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsightCard = (insight: LiveInsight) => {
    const impactColorClass = impactColors[insight.impact];
    
    return (
      <Card key={insight.id} className={cn("border-l-4", impactColorClass)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
            <Badge variant="outline" className={cn("text-xs", impactColorClass)}>
              {insight.impact}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {insight.category} • {format(insight.timestamp, 'HH:mm:ss')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
          {insight.actionable && insight.actionText && (
            <Button size="sm" variant="outline" className="text-xs">
              {insight.actionText}
            </Button>
          )}
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Confidence: {insight.confidence.toFixed(0)}%</span>
            <span>Priority: {insight.priority}/10</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  const latestMetrics = Array.from(state.metrics.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 12);

  const highPriorityInsights = state.insights
    .filter(insight => insight.impact === 'high' || insight.priority > 7)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-time Metrics</h2>
          <p className="text-muted-foreground">
            Live dashboard with real-time updates and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <StatusIcon className={cn("h-4 w-4", connectionStatus.color, state.isConnecting && "animate-spin")} />
            <span className={cn("text-sm", connectionStatus.color)}>
              {connectionStatus.text}
            </span>
          </div>
          {state.lastUpdate && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(state.lastUpdate, 'HH:mm:ss')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Metric Type:</label>
                <select
                  value={selectedMetricType}
                  onChange={(e) => setSelectedMetricType(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="revenue">Revenue</option>
                  <option value="orders">Orders</option>
                  <option value="products">Products</option>
                  <option value="customers">Customers</option>
                  <option value="inventory">Inventory</option>
                  <option value="restock">Restock</option>
                  <option value="notifications">Notifications</option>
                </select>
              </div>
              
              <Button
                onClick={() => handleStartStreaming(selectedMetricType)}
                disabled={state.isConnected && state.streamingTypes.has(selectedMetricType)}
                size="sm"
              >
                Start Streaming
              </Button>
              
              <Button
                onClick={() => handleStopStreaming(selectedMetricType)}
                disabled={!state.streamingTypes.has(selectedMetricType)}
                variant="outline"
                size="sm"
              >
                Stop Streaming
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleStartInsights}
                disabled={state.isConnected}
                size="sm"
                variant="outline"
              >
                Start Insights
              </Button>
              
              <Button
                onClick={handleStopInsights}
                disabled={!state.isConnected}
                size="sm"
                variant="outline"
              >
                Stop Insights
              </Button>
              
              <Button
                onClick={handleGenerateMockData}
                disabled={isGeneratingMockData}
                size="sm"
                variant="outline"
              >
                {isGeneratingMockData ? 'Generating...' : 'Generate Mock Data'}
              </Button>
              
              <Button
                onClick={handleClearAll}
                size="sm"
                variant="destructive"
              >
                Clear All
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Streaming: {Array.from(state.streamingTypes).join(', ') || 'None'} | 
              Insights: {state.insights.length} | 
              Metrics: {state.metrics.size}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          {showInsights && <TabsTrigger value="insights">Insights</TabsTrigger>}
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {latestMetrics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestMetrics.map(renderMetricCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No metrics available</p>
                  <p className="text-xs text-muted-foreground">
                    Start streaming or generate mock data to see metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showInsights && (
          <TabsContent value="insights" className="space-y-4">
            {highPriorityInsights.length > 0 ? (
              <div className="space-y-4">
                {highPriorityInsights.map(renderInsightCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No insights available</p>
                    <p className="text-xs text-muted-foreground">
                      Start insights streaming or generate mock data
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
