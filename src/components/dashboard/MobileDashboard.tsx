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
  CheckCircle,
  Menu,
  X,
  SwipeUp,
  SwipeDown,
  Touch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { cn } from '@/lib/utils';

interface MobileMetricCardProps {
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

const MobileMetricCard: React.FC<MobileMetricCardProps> = ({
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
    <Card className={cn("touch-manipulation", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}

          <Progress 
            value={Math.min(Math.abs(growth), 100)} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface MobileDashboardProps {
  className?: string;
  showLiveIndicator?: boolean;
  autoRefresh?: boolean;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  className,
  showLiveIndicator = true,
  autoRefresh = true
}) => {
  const {
    isConnected,
    metrics,
    liveData,
    insights,
    subscribeToLiveData,
    unsubscribeFromLiveData,
    subscribeToInsights,
    unsubscribeFromInsights
  } = useDashboardWebSocket();

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'insights' | 'live'>('metrics');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-subscribe to live data
  useEffect(() => {
    if (isConnected && autoRefresh) {
      subscribeToLiveData('metrics');
      subscribeToInsights();
      setIsLiveMode(true);
      return () => {
        unsubscribeFromLiveData('metrics');
        unsubscribeFromInsights();
        setIsLiveMode(false);
      };
    }
  }, [isConnected, autoRefresh, subscribeToLiveData, unsubscribeFromLiveData, subscribeToInsights, unsubscribeFromInsights]);

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
      unsubscribeFromInsights();
      setIsLiveMode(false);
    } else {
      subscribeToLiveData('metrics');
      subscribeToInsights();
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decline':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'growth':
        return 'border-green-200 bg-green-50';
      case 'decline':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!isConnected) {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Connect to view real-time dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
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
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {formatLastUpdate()}
              </span>
            )}
          </div>
        </div>
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dashboard Settings</h3>
              
              <div className="space-y-2">
                <Button
                  variant={isLiveMode ? "default" : "outline"}
                  onClick={handleLiveToggle}
                  className="w-full justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isLiveMode ? 'Pause Live Updates' : 'Enable Live Updates'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('metrics')}
                  className="w-full justify-start"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Metrics
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('insights')}
                  className="w-full justify-start"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Insights
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'metrics' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('metrics')}
          className="flex-1"
        >
          <Activity className="h-4 w-4 mr-1" />
          Metrics
        </Button>
        <Button
          variant={activeTab === 'insights' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('insights')}
          className="flex-1"
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Insights
        </Button>
        <Button
          variant={activeTab === 'live' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('live')}
          className="flex-1"
        >
          <Zap className="h-4 w-4 mr-1" />
          Live
        </Button>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <MobileMetricCard
              title="Revenue"
              value={metrics.revenue.current}
              previousValue={metrics.revenue.previous}
              growth={metrics.revenue.growth}
              trend={metrics.revenue.trend}
              icon={DollarSign}
              format="currency"
              description="Total revenue"
            />
            
            <MobileMetricCard
              title="Orders"
              value={metrics.orders.current}
              previousValue={metrics.orders.previous}
              growth={metrics.orders.growth}
              trend={metrics.orders.trend}
              icon={ShoppingCart}
              format="number"
              description="Total orders"
            />
            
            <MobileMetricCard
              title="Products"
              value={metrics.products.current}
              previousValue={metrics.products.previous}
              growth={metrics.products.growth}
              trend={metrics.products.trend}
              icon={Package}
              format="number"
              description="In inventory"
            />
            
            <MobileMetricCard
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
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No insights available
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight) => (
                <Card key={insight.id} className={cn("border-l-4", getInsightColor(insight.type))}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            )}
                          >
                            {insight.impact}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Tab */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Live Data Stream
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveData.length === 0 ? (
                <div className="text-center py-4">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No live data available
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {liveData.slice(-10).reverse().map((data, index) => (
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
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Swipe Instructions */}
      <div className="text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1">
          <SwipeUp className="h-3 w-3" />
          <span>Swipe up for more</span>
        </div>
      </div>
    </div>
  );
};
