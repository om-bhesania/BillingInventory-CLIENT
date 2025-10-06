import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  Activity,
  Building2,
  MapPin,
  Star,
  AlertCircle,
  Zap,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRealtimeMetricsService, RealtimeMetric, LiveInsight } from '@/services/realtimeMetricsService';
import { getSmartWebSocketService } from '@/services/smartWebSocketService';
import { format } from 'date-fns';

interface ShopPerformance {
  id: string;
  name: string;
  location: string;
  revenue: number;
  orders: number;
  growth: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdate: Date;
  metrics: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    inventory: number;
  };
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  database: number;
  lastUpdate: Date;
}

interface FranchiseMetrics {
  totalShops: number;
  activeShops: number;
  totalRevenue: number;
  averageRevenuePerShop: number;
  topPerformingShop: string;
  underperformingShops: number;
  growthRate: number;
  complianceScore: number;
}

interface AdminRealtimeDashboardProps {
  className?: string;
  enableMultiShopView?: boolean;
  enableSystemMonitoring?: boolean;
  enableFranchiseMetrics?: boolean;
  refreshInterval?: number;
}

const statusColors = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const healthColors = {
  healthy: 'text-green-600',
  warning: 'text-yellow-600',
  critical: 'text-red-600'
};

export const AdminRealtimeDashboard: React.FC<AdminRealtimeDashboardProps> = ({
  className,
  enableMultiShopView = true,
  enableSystemMonitoring = true,
  enableFranchiseMetrics = true,
  refreshInterval = 5000
}) => {
  const [currentView, setCurrentView] = useState('overview');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [shopPerformance, setShopPerformance] = useState<ShopPerformance[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [franchiseMetrics, setFranchiseMetrics] = useState<FranchiseMetrics | null>(null);
  const [state, setState] = useState(getRealtimeMetricsService().getState());
  const [smartWsState, setSmartWsState] = useState(getSmartWebSocketService().getState());

  const realtimeService = getRealtimeMetricsService();
  const smartWsService = getSmartWebSocketService();

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(setState);
    return unsubscribe;
  }, [realtimeService]);

  useEffect(() => {
    const unsubscribe = smartWsService.subscribe(setSmartWsState);
    return unsubscribe;
  }, [smartWsService]);

  // Generate mock data for development
  useEffect(() => {
    generateMockShopPerformance();
    generateMockSystemHealth();
    generateMockFranchiseMetrics();
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isConnected) {
        refreshAllData();
      } else {
        // Generate mock data when not connected
        generateMockShopPerformance();
        generateMockSystemHealth();
        generateMockFranchiseMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, state.isConnected]);

  const generateMockShopPerformance = () => {
    const shops: ShopPerformance[] = [
      {
        id: 'shop-1',
        name: 'Downtown Location',
        location: '123 Main St, Downtown',
        revenue: 45000,
        orders: 1200,
        growth: 15.2,
        status: 'excellent',
        lastUpdate: new Date(),
        metrics: {
          revenue: 45000,
          orders: 1200,
          customers: 850,
          products: 45,
          inventory: 1200
        }
      },
      {
        id: 'shop-2',
        name: 'Mall Branch',
        location: '456 Mall Ave, Shopping Center',
        revenue: 32000,
        orders: 950,
        growth: 8.5,
        status: 'good',
        lastUpdate: new Date(),
        metrics: {
          revenue: 32000,
          orders: 950,
          customers: 650,
          products: 42,
          inventory: 980
        }
      },
      {
        id: 'shop-3',
        name: 'Airport Terminal',
        location: '789 Airport Blvd, Terminal 2',
        revenue: 28000,
        orders: 750,
        growth: -2.1,
        status: 'warning',
        lastUpdate: new Date(),
        metrics: {
          revenue: 28000,
          orders: 750,
          customers: 420,
          products: 38,
          inventory: 850
        }
      },
      {
        id: 'shop-4',
        name: 'Suburban Plaza',
        location: '321 Suburb St, Plaza',
        revenue: 15000,
        orders: 400,
        growth: -12.3,
        status: 'critical',
        lastUpdate: new Date(),
        metrics: {
          revenue: 15000,
          orders: 400,
          customers: 280,
          products: 35,
          inventory: 600
        }
      }
    ];

    setShopPerformance(shops);
  };

  const generateMockSystemHealth = () => {
    setSystemHealth({
      status: 'healthy',
      cpu: 45,
      memory: 62,
      disk: 78,
      network: 85,
      database: 92,
      lastUpdate: new Date()
    });
  };

  const generateMockFranchiseMetrics = () => {
    setFranchiseMetrics({
      totalShops: 4,
      activeShops: 4,
      totalRevenue: 120000,
      averageRevenuePerShop: 30000,
      topPerformingShop: 'Downtown Location',
      underperformingShops: 1,
      growthRate: 7.3,
      complianceScore: 94
    });
  };

  const refreshAllData = () => {
    // Send refresh commands via smart WebSocket
    smartWsService.sendMessage('admin:refresh:shops', {}, { priority: 'high' });
    smartWsService.sendMessage('admin:refresh:system', {}, { priority: 'medium' });
    smartWsService.sendMessage('admin:refresh:franchise', {}, { priority: 'medium' });
  };

  const handleShopSelect = (shopId: string) => {
    setSelectedShop(shopId);
    setCurrentView('shop-detail');
  };

  const renderShopCard = (shop: ShopPerformance) => {
    const statusColor = statusColors[shop.status];
    const TrendIcon = shop.growth > 0 ? TrendingUp : shop.growth < 0 ? TrendingDown : Minus;
    const trendColor = shop.growth > 0 ? 'text-green-600' : shop.growth < 0 ? 'text-red-600' : 'text-gray-600';

    return (
      <Card 
        key={shop.id} 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          selectedShop === shop.id && "ring-2 ring-blue-500",
          statusColor
        )}
        onClick={() => handleShopSelect(shop.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{shop.name}</CardTitle>
            <Badge variant="outline" className={cn("text-xs", statusColor)}>
              {shop.status}
            </Badge>
          </div>
          <CardDescription className="text-xs flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {shop.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Revenue</span>
              <span className="text-sm font-medium">${shop.revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Orders</span>
              <span className="text-sm font-medium">{shop.orders.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Growth</span>
              <div className="flex items-center space-x-1">
                <TrendIcon className={cn("h-3 w-3", trendColor)} />
                <span className={cn("text-xs font-medium", trendColor)}>
                  {shop.growth > 0 ? '+' : ''}{shop.growth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Updated: {format(shop.lastUpdate, 'HH:mm:ss')}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSystemHealthCard = () => {
    if (!systemHealth) return null;

    const healthColor = healthColors[systemHealth.status];
    const StatusIcon = systemHealth.status === 'healthy' ? CheckCircle : 
                      systemHealth.status === 'warning' ? AlertTriangle : AlertCircle;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StatusIcon className={cn("h-5 w-5", healthColor)} />
            <span>System Health</span>
          </CardTitle>
          <CardDescription>
            Last updated: {format(systemHealth.lastUpdate, 'HH:mm:ss')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span className="text-sm">CPU</span>
                </div>
                <span className="text-sm font-medium">{systemHealth.cpu}%</span>
              </div>
              <Progress value={systemHealth.cpu} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm">Memory</span>
                </div>
                <span className="text-sm font-medium">{systemHealth.memory}%</span>
              </div>
              <Progress value={systemHealth.memory} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm">Disk</span>
                </div>
                <span className="text-sm font-medium">{systemHealth.disk}%</span>
              </div>
              <Progress value={systemHealth.disk} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span className="text-sm">Network</span>
                </div>
                <span className="text-sm font-medium">{systemHealth.network}%</span>
              </div>
              <Progress value={systemHealth.network} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFranchiseMetrics = () => {
    if (!franchiseMetrics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Total Shops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchiseMetrics.totalShops}</div>
            <div className="text-xs text-muted-foreground">
              {franchiseMetrics.activeShops} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${franchiseMetrics.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Avg: ${franchiseMetrics.averageRevenuePerShop.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{franchiseMetrics.growthRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              vs last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{franchiseMetrics.complianceScore}%</div>
            <div className="text-xs text-muted-foreground">
              {franchiseMetrics.underperformingShops} underperforming
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getConnectionStatus = () => {
    if (state.isConnecting) return { status: 'connecting', icon: RefreshCw, text: 'Connecting...', color: 'text-yellow-500' };
    if (state.isConnected) return { status: 'connected', icon: Wifi, text: 'Live', color: 'text-green-500' };
    return { status: 'disconnected', icon: WifiOff, text: 'Offline', color: 'text-red-500' };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Real-time Dashboard</h2>
          <p className="text-muted-foreground">
            Multi-shop monitoring and system health overview
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <StatusIcon className={cn("h-4 w-4", connectionStatus.color, state.isConnecting && "animate-spin")} />
            <span className={cn("text-sm", connectionStatus.color)}>
              {connectionStatus.text}
            </span>
          </div>
          <Button
            onClick={refreshAllData}
            size="sm"
            variant="outline"
            disabled={state.isConnecting}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", state.isConnecting && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Smart WebSocket Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Smart WebSocket Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{smartWsState.stats.messagesSent}</div>
              <div className="text-xs text-muted-foreground">Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{smartWsState.stats.messagesReceived}</div>
              <div className="text-xs text-muted-foreground">Messages Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{smartWsState.stats.batchesProcessed}</div>
              <div className="text-xs text-muted-foreground">Batches Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {smartWsState.connectionStatus.latency}ms
              </div>
              <div className="text-xs text-muted-foreground">Average Latency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={currentView} onValueChange={setCurrentView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shops">Shop Performance</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="franchise">Franchise Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {enableFranchiseMetrics && renderFranchiseMetrics()}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {enableSystemMonitoring && renderSystemHealthCard()}
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Suburban Plaza showing declining performance
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      System memory usage above 80%
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shopPerformance.map(renderShopCard)}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {enableSystemMonitoring && renderSystemHealthCard()}
        </TabsContent>

        <TabsContent value="franchise" className="space-y-4">
          {enableFranchiseMetrics && renderFranchiseMetrics()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
