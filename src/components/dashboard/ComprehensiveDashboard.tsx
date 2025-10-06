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
  BarChart3,
  PieChart,
  LineChart,
  Star,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Zap,
  Activity,
  Lightbulb
} from 'lucide-react';
import { useDashboard } from '@/hooks/use-getDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { SimpleDateRangePicker } from '@/components/ui/SimpleDateRangePicker';
import { TrendChart, BarChart, DoughnutChart, SalesTrendChart } from '@/components/charts';
import { EnhancedAnalyticsDashboard } from '@/components/charts/EnhancedAnalyticsDashboard';
import { AnalyticsDashboard } from '@/components/charts/AnalyticsDashboard';
import { transformSalesTrendData, transformCategoryData, transformFlavorData } from '@/lib/analytics';
import { getTopSellingProducts, getLowStockStats, getTotalRevenue, getTotalItemsWorth } from '@/apis/dashboardApi';
import { subDays } from 'date-fns';

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
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
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

interface ComprehensiveDashboardProps {
  className?: string;
}

export const ComprehensiveDashboard: React.FC<ComprehensiveDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const { 
    dashboardData, 
    isLoading, 
    error, 
    isRefreshing, 
    handleManualRefresh,
    formatLastRefresh,
    lastRefresh,
    handleDateRangeChange,
    dateRange
  } = useDashboard();

  const [activeTab, setActiveTab] = useState('overview');
  const [realRevenue, setRealRevenue] = useState<any>(null);
  const [totalItemsWorth, setTotalItemsWorth] = useState<any>(null);

  // Fetch new revenue data
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (user?.role === 'Admin') {
        try {
          const [revenueData, itemsWorthData] = await Promise.all([
            getTotalRevenue(),
            getTotalItemsWorth()
          ]);
          setRealRevenue(revenueData);
          setTotalItemsWorth(itemsWorthData);
        } catch (error) {
          console.error('Error fetching revenue data:', error);
        }
      }
    };

    fetchRevenueData();
  }, [user?.role]);

  // WebSocket listener for real-time revenue updates
  useEffect(() => {
    if (user?.role === 'Admin') {
      const handleRevenueUpdate = () => {
        // Refresh revenue data when a new billing is created
        const fetchRevenueData = async () => {
          try {
            const [revenueData, itemsWorthData] = await Promise.all([
              getTotalRevenue(),
              getTotalItemsWorth()
            ]);
            setRealRevenue(revenueData);
            setTotalItemsWorth(itemsWorthData);
          } catch (error) {
            console.error('Error fetching updated revenue data:', error);
          }
        };
        fetchRevenueData();
      };

      // Listen for revenue updates
      window.addEventListener('revenue_updated', handleRevenueUpdate);
      
      // Cleanup
      return () => {
        window.removeEventListener('revenue_updated', handleRevenueUpdate);
      };
    }
  }, [user?.role]);

  // Generate metrics from dashboard data
  const getMetrics = () => {
    if (!dashboardData?.metrics) {
      return {
        revenue: { current: 0, previous: 0, growth: 0, trend: 'stable' as const },
        orders: { current: 0, previous: 0, growth: 0, trend: 'stable' as const },
        products: { current: 0, previous: 0, growth: 0, trend: 'stable' as const },
        customers: { current: 0, previous: 0, growth: 0, trend: 'stable' as const }
      };
    }

    const metrics = dashboardData.metrics;
    
    return {
      revenue: {
        current: metrics.totalRevenue?.total || 0,
        previous: metrics.totalRevenue?.previousPeriod || 0,
        growth: metrics.totalRevenue?.growth || 0,
        trend: (metrics.totalRevenue?.growth || 0) > 0 ? 'up' : 'down' as 'up' | 'down'
      },
      orders: {
        current: metrics.totalRevenue?.count || 0,
        previous: 0,
        growth: 0,
        trend: 'stable' as 'up' | 'down' | 'stable'
      },
      products: {
        current: metrics.totalProducts?.total || 0,
        previous: metrics.totalProducts?.previousPeriod || 0,
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
  };

  const metrics = getMetrics();

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
            Comprehensive Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's your complete business overview.
          </p>
          <div className="flex items-center gap-4 mt-2">
            {lastRefresh && (
              <p className="text-xs text-muted-foreground">
                Last updated: {formatLastRefresh()}
              </p>
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

      {/* Date Range Picker */}
      <SimpleDateRangePicker
        onDateRangeChange={handleDateRangeChange}
        initialDateRange={dateRange}
        defaultDateRange={{ from: subDays(new Date(), 30), to: new Date() }}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="shops" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shops
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

          {/* New Revenue Cards - Admin Only */}
          {user?.role === 'Admin' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {realRevenue ? new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(realRevenue.totalRevenue) : '₹0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {realRevenue?.totalBills || 0} bills generated
                  </p>
                  {realRevenue?.totalProfit && (
                    <p className="text-xs text-green-600 font-medium">
                      Profit: ₹{realRevenue.totalProfit.toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items Worth</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalItemsWorth ? new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalItemsWorth.totalItemsWorth) : '₹0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalItemsWorth?.totalRequests || 0} fulfilled requests
                  </p>
                  <p className="text-xs text-blue-600">
                    Inventory tracking value
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {realRevenue ? new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(realRevenue.totalProfit) : '₹0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From all shop sales
                  </p>
                  {realRevenue?.totalRevenue && realRevenue?.totalProfit && (
                    <p className="text-xs text-muted-foreground">
                      Margin: {((realRevenue.totalProfit / realRevenue.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue vs Items</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {realRevenue && totalItemsWorth ? 
                      `${((realRevenue.totalRevenue / totalItemsWorth.totalItemsWorth) * 100).toFixed(0)}%` : 
                      '0%'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue conversion rate
                  </p>
                  <p className="text-xs text-blue-600">
                    Sales vs Inventory Value
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sales Trend Chart */}
          <SalesTrendChart
            data={transformSalesTrendData(dashboardData?.metrics || {})}
            title="Sales Trend Analysis"
            subtitle="Daily sales performance with moving average trend line"
            currency="INR"
          />

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
                    <Badge variant={(dashboardData?.metrics?.totalRevenue?.growth || 0) > 0 ? "default" : "destructive"}>
                      {(dashboardData?.metrics?.totalRevenue?.growth || 0) > 0 ? '+' : ''}{(dashboardData?.metrics?.totalRevenue?.growth || 0).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order Growth</span>
                    <Badge variant={(dashboardData?.metrics?.totalOrders?.growth || 0) > 0 ? "default" : "destructive"}>
                      {(dashboardData?.metrics?.totalOrders?.growth || 0) > 0 ? '+' : ''}{(dashboardData?.metrics?.totalOrders?.growth || 0).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Shop Growth</span>
                    <Badge variant={(dashboardData?.metrics?.totalShops?.growth || 0) > 0 ? "default" : "destructive"}>
                      {(dashboardData?.metrics?.totalShops?.growth || 0) > 0 ? '+' : ''}{(dashboardData?.metrics?.totalShops?.growth || 0).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Status</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">
                        {isLoading ? 'Loading...' : 'Connected'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Update</span>
                    <span className="text-xs text-muted-foreground">
                      {lastRefresh ? formatLastRefresh() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="text-xs text-muted-foreground">
                        {error ? 'Error' : 'Healthy'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Advanced Analytics</h3>
            <Badge variant="secondary">
              <BarChart3 className="h-3 w-3 mr-1" />
              Charts & Insights
            </Badge>
          </div>

          {/* Revenue Analytics - Admin Only */}
          {user?.role === 'Admin' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {realRevenue ? new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(realRevenue.totalRevenue) : '₹0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {realRevenue?.totalBills || 0} bills generated
                  </p>
                  {realRevenue?.totalProfit && (
                    <p className="text-xs text-green-600 font-medium">
                      Profit: ₹{realRevenue.totalProfit.toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items Worth</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalItemsWorth ? new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(totalItemsWorth.totalItemsWorth) : '₹0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalItemsWorth?.totalRequests || 0} fulfilled requests
                  </p>
                  <p className="text-xs text-blue-600">
                    Inventory tracking value
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {realRevenue ? new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(realRevenue.totalProfit) : '₹0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From all shop sales
                  </p>
                  {realRevenue?.totalRevenue && realRevenue?.totalProfit && (
                    <p className="text-xs text-muted-foreground">
                      Margin: {((realRevenue.totalProfit / realRevenue.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue vs Items</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {realRevenue && totalItemsWorth ? 
                      `${((realRevenue.totalRevenue / totalItemsWorth.totalItemsWorth) * 100).toFixed(0)}%` : 
                      '0%'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revenue conversion rate
                  </p>
                  <p className="text-xs text-blue-600">
                    Sales vs Inventory Value
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Enhanced Analytics Dashboard */}
          <EnhancedAnalyticsDashboard 
            metrics={dashboardData?.metrics}
            role={user?.role === 'Admin' ? 'Admin' : 'Shop_Owner'}
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Product Analytics</h3>
            <Badge variant="secondary">
              <Package className="h-3 w-3 mr-1" />
              Product Stats
            </Badge>
          </div>

          {/* Product Performance Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData?.metrics?.topSellingProducts?.slice(0, 3).map((product, index) => (
                    <div key={product.productId} className="flex justify-between items-center">
                      <span className="text-sm">{product.product?.flavor?.name || `Product ${index + 1}`}</span>
                      <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                        {product.quantity} units
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">No product data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Flavor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transformFlavorData(dashboardData?.metrics || {}).slice(0, 3).map((flavor, index) => {
                    const percentage = Math.min(100, Math.max(0, (flavor.value / (flavor.value + (flavor.previousValue || 0))) * 100));
                    return (
                      <div key={flavor.label} className="flex justify-between items-center">
                        <span className="text-sm">{flavor.label}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-16 h-2" />
                          <span className="text-xs">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">No flavor data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">In Stock</span>
                    <Badge variant="default">
                      {dashboardData?.metrics?.currentStockLevels?.totalItems || 0} products
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Stock</span>
                    <Badge variant="destructive">
                      {dashboardData?.metrics?.lowStockAlerts?.count || 0} products
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Out of Stock</span>
                    <Badge variant="outline">
                      {dashboardData?.metrics?.outOfStockItems?.count || 0} products
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Charts */}
          {dashboardData?.metrics && (
            <div className="grid gap-6 md:grid-cols-2">
              <BarChart
                data={transformCategoryData(dashboardData?.metrics || {}).map(item => ({
                  label: item.label,
                  value: item.value,
                  previousValue: item.previousValue,
                  growth: item.growth
                }))}
                title="Product Sales Performance"
                subtitle="Top selling products with growth indicators"
                valueLabel="Units Sold"
                maxItems={5}
              />

              <DoughnutChart
                data={transformFlavorData(dashboardData?.metrics || {}).map(item => ({
                  label: item.label,
                  value: item.value,
                  color: item.color
                }))}
                title="Flavor Distribution"
                subtitle="Product flavor breakdown by sales volume"
                showLegend={true}
              />
            </div>
          )}
        </TabsContent>

        {/* Shops Tab */}
        <TabsContent value="shops" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Shop Analytics</h3>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              Shop Stats
            </Badge>
          </div>

          {/* Shop Performance Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Performing Shops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData?.metrics?.shopPerformance?.slice(0, 3).map((shop, index) => (
                    <div key={shop.id} className="flex justify-between items-center">
                      <span className="text-sm">{shop.name}</span>
                      <Badge variant={index === 0 ? "default" : index === 1 ? "secondary" : "outline"}>
                        ₹{shop.totalRevenue?.toLocaleString() || 0}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">No shop data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Shop Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Shops</span>
                    <Badge variant="default">
                      {dashboardData?.metrics?.totalShops?.total || 0} shops
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Revenue</span>
                    <Badge variant="secondary">
                      ₹{dashboardData?.metrics?.totalRevenue?.total?.toLocaleString() || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. per Shop</span>
                    <Badge variant="outline">
                      ₹{dashboardData?.metrics?.totalShops?.total ? 
                        Math.round((dashboardData?.metrics?.totalRevenue?.total || 0) / dashboardData?.metrics?.totalShops?.total).toLocaleString() : 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Shop Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs">
                        {dashboardData?.metrics?.totalShops?.total || 0} shops
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Offline</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-xs">
                        {dashboardData?.metrics?.offlineShops?.count || 0} shops
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shop Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <BarChart
              data={dashboardData?.metrics?.shopPerformance?.map(shop => ({
                label: shop.name,
                value: shop.totalRevenue,
                previousValue: shop.previousRevenue,
                growth: shop.revenueGrowth
              })) || []}
              title="Shop Revenue Performance"
              subtitle="Revenue by shop location with growth indicators"
              valueLabel="Revenue (INR)"
              maxItems={5}
            />

            <TrendChart
              data={transformSalesTrendData(dashboardData?.metrics || {}).map(item => ({
                date: item.date,
                value: item.total,
                previousValue: item.total * 0.85 // Estimate previous period as 85% of current
              }))}
              title="Shop Performance Trend"
              subtitle="Daily revenue trends across all shops"
              valueLabel="Revenue (INR)"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
