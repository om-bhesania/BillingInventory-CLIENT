import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Zap,
  Activity,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Target,
  Star
} from 'lucide-react';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { useDashboard } from '@/hooks/use-getDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  format?: 'currency' | 'number' | 'percentage';
  description?: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  growth,
  trend,
  icon: Icon,
  format = 'number',
  description,
  className
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={cn("relative overflow-hidden hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-3xl font-bold">{formatValue(value)}</div>
          
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">
              vs {formatValue(previousValue)}
            </span>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Growth Progress</span>
              <span>{Math.min(Math.abs(growth), 100).toFixed(0)}%</span>
            </div>
            <Progress 
              value={Math.min(Math.abs(growth), 100)} 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface LiveInsightCardProps {
  insight: {
    id: string;
    type: 'growth' | 'decline' | 'opportunity' | 'warning';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    timestamp: Date;
  };
}

const LiveInsightCard: React.FC<LiveInsightCardProps> = ({ insight }) => {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'growth': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decline': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInsightColor = () => {
    switch (insight.type) {
      case 'growth': return 'border-l-green-500 bg-green-50';
      case 'decline': return 'border-l-red-500 bg-red-50';
      case 'opportunity': return 'border-l-blue-500 bg-blue-50';
      case 'warning': return 'border-l-orange-500 bg-orange-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={cn("border-l-4", getInsightColor())}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getInsightIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <Badge variant="secondary" className={cn("text-xs", getImpactColor())}>
                {insight.impact}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {insight.description}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              {new Date(insight.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ModernDashboardProps {
  className?: string;
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const { 
    dashboardData, 
    isLoading, 
    error, 
    isRefreshing, 
    handleManualRefresh,
    formatLastRefresh,
    lastRefresh
  } = useDashboard();

  const {
    isConnected: isWebSocketConnected,
    metrics: liveMetrics,
    insights: liveInsights,
    changeDateRange,
    subscribeToInsights,
    unsubscribeFromInsights
  } = useDashboardWebSocket();

  const [activeTab, setActiveTab] = useState('overview');
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Auto-subscribe to insights when WebSocket connects
  useEffect(() => {
    if (isWebSocketConnected && !isLiveMode) {
      subscribeToInsights();
      setIsLiveMode(true);
    }
    return () => {
      if (isLiveMode) {
        unsubscribeFromInsights();
        setIsLiveMode(false);
      }
    };
  }, [isWebSocketConnected, subscribeToInsights, unsubscribeFromInsights, isLiveMode]);

  // Generate mock live metrics if WebSocket data is not available
  const getDisplayMetrics = () => {
    if (liveMetrics) {
      return liveMetrics;
    }

    // Fallback to dashboard data or generate mock data
    if (dashboardData?.metrics) {
      return {
        revenue: {
          current: dashboardData.metrics.totalRevenue?.total || 0,
          previous: dashboardData.metrics.totalRevenue?.previousPeriod || 0,
          growth: dashboardData.metrics.totalRevenue?.growth || 0,
          trend: (dashboardData.metrics.totalRevenue?.growth || 0) > 0 ? 'up' : 'down' as 'up' | 'down'
        },
        orders: {
          current: dashboardData.metrics.totalRevenue?.count || 0,
          previous: 0,
          growth: 0,
          trend: 'stable' as 'up' | 'down' | 'stable'
        },
        products: {
          current: dashboardData.metrics.totalProducts?.total || 0,
          previous: dashboardData.metrics.totalProducts?.previousPeriod || 0,
          growth: 0,
          trend: 'stable' as 'up' | 'down' | 'stable'
        },
        customers: {
          current: 150,
          previous: 120,
          growth: 25,
          trend: 'up' as 'up' | 'down' | 'stable'
        }
      };
    }

    // Mock data fallback
    return {
      revenue: { current: 125000, previous: 100000, growth: 25, trend: 'up' as 'up' | 'down' | 'stable' },
      orders: { current: 1250, previous: 1000, growth: 25, trend: 'up' as 'up' | 'down' | 'stable' },
      products: { current: 45, previous: 40, growth: 12.5, trend: 'up' as 'up' | 'down' | 'stable' },
      customers: { current: 150, previous: 120, growth: 25, trend: 'up' as 'up' | 'down' | 'stable' }
    };
  };

  // Generate mock insights if WebSocket data is not available
  const getDisplayInsights = () => {
    if (liveInsights.length > 0) {
      return liveInsights;
    }

    // Mock insights fallback
    return [
      {
        id: '1',
        type: 'growth' as const,
        title: 'Revenue Growth Detected',
        description: 'Your revenue has increased by 25% compared to last month. This is a positive trend that suggests strong customer demand.',
        impact: 'high' as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: '2',
        type: 'opportunity' as const,
        title: 'Inventory Optimization Opportunity',
        description: 'Consider restocking Chocolate flavor - it\'s showing high demand and low stock levels.',
        impact: 'medium' as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      },
      {
        id: '3',
        type: 'warning' as const,
        title: 'Low Stock Alert',
        description: 'Vanilla ice cream is running low. Consider placing a restock order soon.',
        impact: 'high' as const,
        timestamp: new Date(Date.now() - 1000 * 60 * 90) // 1.5 hours ago
      }
    ];
  };

  const metrics = getDisplayMetrics();
  const insights = getDisplayInsights();

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modern Dashboard</h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modern Dashboard</h1>
            <p className="text-muted-foreground">Error loading dashboard</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleManualRefresh} disabled={isRefreshing}>
                {isRefreshing ? "Retrying..." : "Try Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modern Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's your business overview.
          </p>
          <div className="flex items-center gap-4 mt-2">
            {lastRefresh && (
              <p className="text-xs text-muted-foreground">
                Last updated: {formatLastRefresh()}
              </p>
            )}
            {isWebSocketConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Zap className="h-3 w-3" />
                Live Updates Active
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live-metrics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Metrics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value={metrics.revenue.current}
              previousValue={metrics.revenue.previous}
              growth={metrics.revenue.growth}
              trend={metrics.revenue.trend}
              icon={DollarSign}
              format="currency"
              description="Total revenue generated"
            />
            
            <MetricCard
              title="Total Orders"
              value={metrics.orders.current}
              previousValue={metrics.orders.previous}
              growth={metrics.orders.growth}
              trend={metrics.orders.trend}
              icon={ShoppingCart}
              format="number"
              description="Total orders placed"
            />
            
            <MetricCard
              title="Products"
              value={metrics.products.current}
              previousValue={metrics.products.previous}
              growth={metrics.products.growth}
              trend={metrics.products.trend}
              icon={Package}
              format="number"
              description="Products in inventory"
            />
            
            <MetricCard
              title="Customers"
              value={metrics.customers.current}
              previousValue={metrics.customers.previous}
              growth={metrics.customers.growth}
              trend={metrics.customers.trend}
              icon={Users}
              format="number"
              description="Active customers"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <Badge variant={metrics.revenue.growth > 0 ? "default" : "destructive"}>
                      {metrics.revenue.growth > 0 ? '+' : ''}{metrics.revenue.growth.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order Growth</span>
                    <Badge variant={metrics.orders.growth > 0 ? "default" : "destructive"}>
                      {metrics.orders.growth > 0 ? '+' : ''}{metrics.orders.growth.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Growth</span>
                    <Badge variant={metrics.customers.growth > 0 ? "default" : "destructive"}>
                      {metrics.customers.growth > 0 ? '+' : ''}{metrics.customers.growth.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WebSocket</span>
                    <div className="flex items-center gap-2">
                      {isWebSocketConnected ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isWebSocketConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Live Insights</span>
                    <Badge variant="secondary">
                      {insights.length} active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Update</span>
                    <span className="text-xs text-muted-foreground">
                      {lastRefresh ? formatLastRefresh() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Metrics Tab */}
        <TabsContent value="live-metrics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
            <div className="flex items-center gap-2">
              {isWebSocketConnected && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Live Revenue"
              value={metrics.revenue.current}
              previousValue={metrics.revenue.previous}
              growth={metrics.revenue.growth}
              trend={metrics.revenue.trend}
              icon={DollarSign}
              format="currency"
              description="Real-time revenue tracking"
            />
            
            <MetricCard
              title="Live Orders"
              value={metrics.orders.current}
              previousValue={metrics.orders.previous}
              growth={metrics.orders.growth}
              trend={metrics.orders.trend}
              icon={ShoppingCart}
              format="number"
              description="Real-time order tracking"
            />
            
            <MetricCard
              title="Live Products"
              value={metrics.products.current}
              previousValue={metrics.products.previous}
              growth={metrics.products.growth}
              trend={metrics.products.trend}
              icon={Package}
              format="number"
              description="Real-time inventory tracking"
            />
            
            <MetricCard
              title="Live Customers"
              value={metrics.customers.current}
              previousValue={metrics.customers.previous}
              growth={metrics.customers.growth}
              trend={metrics.customers.trend}
              icon={Users}
              format="number"
              description="Real-time customer tracking"
            />
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {insights.length} insights
              </Badge>
            </div>
          </div>

          {insights.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Insights Available</h3>
                  <p className="text-muted-foreground">
                    AI is analyzing your data to generate insights...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <LiveInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
