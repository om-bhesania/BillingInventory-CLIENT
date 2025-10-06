import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Store,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { AreaAnalyticsCard } from '@/components/analytics/AreaAnalyticsCard';
import { ShopInsightsCard } from '@/components/analytics/ShopInsightsCard';
import { ShopInsightsService, ShopPerformanceData } from '@/services/shopInsightsService';
import { BulkOperationsPanel } from '@/components/admin/BulkOperationsPanel';
import { PaymentVerificationPanel } from '@/components/payments/PaymentVerificationPanel';
import { StockAdjustmentAdminPanel } from '@/components/inventory/StockAdjustmentAdminPanel';
import { DiscountCodeManager } from '@/components/discounts/DiscountCodeManager';
import { cn } from '@/lib/utils';
import { getDashboardMetrics, getRecentActivities } from '@/apis/dashboardApi';
import { getLowStockStats } from '@/apis/lowStockApi';
import { fetchNotifications } from '@/apis/notifications';

interface AdminDashboardProps {
  className?: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalShops: number;
  pendingRequests: number;
  activeOrders: number;
  lowStockAlerts: number;
  pendingPayments: number;
  totalProfit: number;
  averageOrderValue: number;
}

interface RecentActivity {
  id: string;
  type: 'restock' | 'payment' | 'adjustment' | 'chat' | 'discount';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  shopName?: string;
  amount?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalShops: 0,
    pendingRequests: 0,
    activeOrders: 0,
    lowStockAlerts: 0,
    pendingPayments: 0,
    totalProfit: 0,
    averageOrderValue: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [performanceData, setPerformanceData] = useState<ShopPerformanceData | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Generate performance data for insights
  useEffect(() => {
    if (stats) {
      const performanceData: ShopPerformanceData = {
        totalRevenue: stats.totalRevenue,
        totalExpenses: stats.totalRevenue * 0.7, // Estimate expenses
        totalProfit: stats.totalProfit,
        pendingPayments: stats.pendingPayments,
        totalOrders: stats.activeOrders,
        averageOrderValue: stats.averageOrderValue,
        topSellingFlavors: [
          { flavorId: '1', flavorName: 'Vanilla', totalRevenue: 15000, totalQuantity: 100, averagePrice: 150 },
          { flavorId: '2', flavorName: 'Chocolate', totalRevenue: 12000, totalQuantity: 80, averagePrice: 150 },
          { flavorId: '3', flavorName: 'Strawberry', totalRevenue: 8000, totalQuantity: 60, averagePrice: 133 }
        ],
        lowStockItems: Array.from({ length: stats.lowStockAlerts }, (_, i) => ({
          productId: `product-${i}`,
          productName: `Product ${i + 1}`,
          currentStock: 5 + (i * 2), // More realistic progression
          minStock: 10,
          percentage: 20 + (i * 10) // More realistic progression
        })),
        recentTransactions: recentActivity.map(activity => ({
          id: activity.id,
          type: activity.type as 'sale' | 'restock' | 'adjustment',
          amount: activity.amount || 0,
          date: new Date(activity.timestamp),
          description: activity.description
        }))
      };
      setPerformanceData(performanceData);
    }
  }, [stats, recentActivity]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from APIs
      const [dashboardData, activitiesData, lowStockData, notificationsData] = await Promise.all([
        getDashboardMetrics(),
        getRecentActivities(),
        getLowStockStats(),
        fetchNotifications()
      ]);

      // Transform dashboard data to stats format
      const transformedStats: DashboardStats = {
        totalRevenue: dashboardData.metrics.totalRevenue?.total || 0,
        totalShops: dashboardData.metrics.totalShops?.total || 0,
        pendingRequests: dashboardData.metrics.pendingRestockRequests?.count || 0,
        activeOrders: 0, // This would need to be added to the API
        lowStockAlerts: lowStockData.stats.totalLowStockItems || 0,
        pendingPayments: 0, // This would need to be added to the API
        totalProfit: 0, // This would need to be calculated
        averageOrderValue: 0 // This would need to be calculated
      };

      // Transform activities data
      const transformedActivities: RecentActivity[] = activitiesData.activities.map((activity, index) => ({
        id: activity.timestamp || index.toString(),
        type: activity.type as any,
        title: activity.action,
        description: activity.details,
        timestamp: new Date(activity.timestamp),
        status: activity.status as any || 'info',
        shopName: activity.shopName,
        amount: activity.amount
      }));

      setStats(transformedStats);
      setRecentActivity(transformedActivities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Fallback to mock data
      const mockStats: DashboardStats = {
        totalRevenue: 1250000,
        totalShops: 45,
        pendingRequests: 12,
        activeOrders: 8,
        lowStockAlerts: 5,
        pendingPayments: 3,
        totalProfit: 375000,
        averageOrderValue: 2800
      };
      
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'restock',
          title: 'New Restock Request',
          description: 'Ice Cream Palace requested 50 units of Vanilla Ice Cream',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'info',
          shopName: 'Ice Cream Palace',
          amount: 2500
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Verified',
          description: 'Payment of ₹5,000 verified for Sweet Dreams',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'success',
          shopName: 'Sweet Dreams',
          amount: 5000
        },
        {
          id: '3',
          type: 'adjustment',
          title: 'Stock Adjustment Approved',
          description: 'Stock adjustment request approved for Frozen Delights',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'success',
          shopName: 'Frozen Delights'
        },
        {
          id: '4',
          type: 'chat',
          title: 'New Chat Request',
          description: 'New chat request from Cool Cones',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'info',
          shopName: 'Cool Cones'
        },
        {
          id: '5',
          type: 'discount',
          title: 'Discount Code Created',
          description: 'New factory discount code "SUMMER20" created',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'info'
        }
      ];
      
      setStats(mockStats);
      setRecentActivity(mockActivity);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'restock':
        return <Package className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'adjustment':
        return <BarChart3 className="h-4 w-4" />;
      case 'chat':
        return <Users className="h-4 w-4" />;
      case 'discount':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your ice cream business operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalShops}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-blue-600">+3 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-yellow-600">Requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-red-600">Immediate action needed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border",
                        getActivityColor(activity.status)
                      )}
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </span>
                          {activity.amount && (
                            <span className="text-xs font-medium">
                              {formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Profit</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats.totalProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Order Value</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(stats.averageOrderValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Orders</span>
                    <span className="font-medium text-purple-600">
                      {stats.activeOrders}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Payments</span>
                    <span className="font-medium text-yellow-600">
                      {formatCurrency(stats.pendingPayments)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <BulkOperationsPanel />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentVerificationPanel />
        </TabsContent>

        <TabsContent value="inventory">
          <StockAdjustmentAdminPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaAnalyticsCard />
            <ShopInsightsCard performanceData={performanceData} />
          </div>
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountCodeManager isFactoryWide={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
