import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
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

  const getProgressValue = () => {
    if (previousValue === 0) return value > 0 ? 100 : 0;
    return Math.min(Math.abs(growth), 100);
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          
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
              <span>{getProgressValue().toFixed(0)}%</span>
            </div>
            <Progress 
              value={getProgressValue()} 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RealTimeMetricsProps {
  className?: string;
  showLiveIndicator?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className,
  showLiveIndicator = true,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const {
    isConnected,
    metrics,
    liveData,
    subscribeToLiveData,
    unsubscribeFromLiveData
  } = useDashboardWebSocket();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Auto-subscribe to live data
  useEffect(() => {
    if (isConnected && autoRefresh) {
      subscribeToLiveData('metrics');
      setIsLiveMode(true);
      return () => {
        unsubscribeFromLiveData('metrics');
        setIsLiveMode(false);
      };
    }
  }, [isConnected, autoRefresh, subscribeToLiveData, unsubscribeFromLiveData]);

  // Update last update time when new data arrives
  useEffect(() => {
    if (liveData.length > 0) {
      const latestData = liveData[liveData.length - 1];
      setLastUpdate(new Date(latestData.timestamp));
    }
  }, [liveData]);

  const handleLiveToggle = () => {
    if (isLiveMode) {
      unsubscribeFromLiveData('metrics');
      setIsLiveMode(false);
    } else {
      subscribeToLiveData('metrics');
      setIsLiveMode(true);
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never updated';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (!isConnected) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Connect to WebSocket to view real-time metrics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Loading real-time metrics...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
          {showLiveIndicator && (
            <Badge 
              variant={isLiveMode ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isLiveMode ? "bg-green-100 text-green-800" : ""
              )}
            >
              <Zap className="h-3 w-3 mr-1" />
              {isLiveMode ? 'Live' : 'Paused'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLiveToggle}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            {isLiveMode ? 'Pause' : 'Resume'}
          </Button>
          
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Updated {formatLastUpdate()}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={metrics.revenue.current}
          previousValue={metrics.revenue.previous}
          growth={metrics.revenue.growth}
          trend={metrics.revenue.trend}
          icon={DollarSign}
          format="currency"
          description="Total revenue generated"
        />
        
        <MetricCard
          title="Orders"
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

      {/* Live Data Stream */}
      {isLiveMode && liveData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Data Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {liveData.slice(-5).reverse().map((data, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                >
                  <span className="font-medium">{data.type}</span>
                  <span className="text-muted-foreground">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
