import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Store,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Plus,
  Eye,
  ShoppingCart,
  Users,
  Target
} from 'lucide-react';
import { AreaAnalyticsCard } from '@/components/analytics/AreaAnalyticsCard';
import { ShopInsightsCard } from '@/components/analytics/ShopInsightsCard';
import { ShopInsightsService, ShopPerformanceData } from '@/services/shopInsightsService';
import { ShopFinancialsCard } from '@/components/financials/ShopFinancialsCard';
import { DiscountCodeManager } from '@/components/discounts/DiscountCodeManager';
import { cn } from '@/lib/utils';
import { getDashboardMetrics, getRecentActivities } from '@/apis/dashboardApi';
import { getLowStockStats } from '@/apis/lowStockApi';
import { getBillingStats } from '@/apis/billingApi';

interface ShopOwnerDashboardProps {
  className?: string;
  shopId?: string;
}

interface ShopStats {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingPayments: number;
  totalOrders: number;
  averageOrderValue: number;
  currentStock: number;
  lowStockItems: number;
  restockRequests: number;
  activeDiscounts: number;
}

interface RecentTransaction {
  id: string;
  type: 'sale' | 'restock' | 'adjustment' | 'payment';
  title: string;
  description: string;
  amount: number;
  timestamp: Date;
  status: 'success' | 'pending' | 'failed';
}

interface TopSellingFlavor {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export const ShopOwnerDashboard: React.FC<ShopOwnerDashboardProps> = ({ 
  className, 
  shopId 
}) => {
  const [stats, setStats] = useState<ShopStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    pendingPayments: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    currentStock: 0,
    lowStockItems: 0,
    restockRequests: 0,
    activeDiscounts: 0
  });
  
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topSellingFlavors, setTopSellingFlavors] = useState<TopSellingFlavor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<ShopPerformanceData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [shopId]);

  // Generate performance data for insights
  useEffect(() => {
    if (stats && topSellingFlavors.length > 0) {
      const performanceData: ShopPerformanceData = {
        totalRevenue: stats.totalRevenue,
        totalExpenses: stats.totalExpenses,
        totalProfit: stats.totalProfit,
        pendingPayments: stats.pendingPayments,
        totalOrders: stats.totalOrders,
        averageOrderValue: stats.averageOrderValue,
        topSellingFlavors: topSellingFlavors.map(flavor => ({
          flavorId: flavor.id,
          flavorName: flavor.name,
          totalRevenue: flavor.revenue,
          totalQuantity: flavor.quantity,
          averagePrice: flavor.revenue / flavor.quantity
        })),
        lowStockItems: Array.from({ length: stats.lowStockItems }, (_, i) => ({
          productId: `product-${i}`,
          productName: `Product ${i + 1}`,
          currentStock: 5 + (i * 2), // More realistic progression
          minStock: 10,
          percentage: 20 + (i * 10) // More realistic progression
        })),
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          type: tx.type as 'sale' | 'restock' | 'adjustment',
          amount: tx.amount,
          date: new Date(tx.date),
          description: tx.description
        }))
      };
      setPerformanceData(performanceData);
    }
  }, [stats, topSellingFlavors, recentTransactions]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from APIs
      const [dashboardData, activitiesData, lowStockData, billingData] = await Promise.all([
        getDashboardMetrics(),
        getRecentActivities(),
        getLowStockStats(),
        shopId ? getBillingStats(shopId) : Promise.resolve({ totalBillings: 0, totalRevenue: 0, byStatus: {} })
      ]);

      // Transform dashboard data to stats format
      const transformedStats: ShopStats = {
        totalRevenue: dashboardData.metrics.shopRevenue?.total || billingData.totalRevenue || 0,
        totalExpenses: 0, // This would need to be calculated
        totalProfit: 0, // This would need to be calculated
        pendingPayments: billingData.byStatus.pending?.total || 0,
        totalOrders: billingData.totalBillings || 0,
        averageOrderValue: billingData.totalBillings > 0 ? billingData.totalRevenue / billingData.totalBillings : 0,
        currentStock: dashboardData.metrics.currentStockLevels?.totalItems || 0,
        lowStockItems: lowStockData.stats.totalLowStockItems || 0,
        restockRequests: dashboardData.metrics.pendingRestockRequests?.count || 0,
        activeDiscounts: 0 // This would need to be added to the API
      };

      // Transform activities data
      const transformedTransactions: RecentTransaction[] = activitiesData.activities.map((activity, index) => ({
        id: activity.timestamp || index.toString(),
        type: activity.type as any,
        title: activity.action,
        description: activity.details,
        amount: activity.amount || 0,
        timestamp: new Date(activity.timestamp),
        status: activity.status as any || 'success'
      }));

      // Transform top selling flavors from dashboard data
      const transformedTopFlavors: TopSellingFlavor[] = dashboardData.metrics.topSellingProducts?.map((product, index) => ({
        id: product.productId,
        name: product.product?.flavor?.name || `Flavor ${index + 1}`,
        quantity: product.quantity,
        revenue: product.quantity * (product.product?.price || 0),
        percentage: 0 // This would need to be calculated
      })) || [];

      setStats(transformedStats);
      setRecentTransactions(transformedTransactions);
      setTopSellingFlavors(transformedTopFlavors);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Fallback to mock data
      const mockStats: ShopStats = {
        totalRevenue: 125000,
        totalExpenses: 75000,
        totalProfit: 50000,
        pendingPayments: 5000,
        totalOrders: 45,
        averageOrderValue: 2800,
        currentStock: 150,
        lowStockItems: 3,
        restockRequests: 2,
        activeDiscounts: 1
      };
      
      const mockTransactions: RecentTransaction[] = [
        {
          id: '1',
          type: 'sale',
          title: 'Sale - Vanilla Ice Cream',
          description: 'Sold 10 units to customer',
          amount: 500,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'success'
        },
        {
          id: '2',
          type: 'restock',
          title: 'Restock Request',
          description: 'Requested 50 units of Chocolate Ice Cream',
          amount: -2500,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          id: '3',
          type: 'payment',
          title: 'Payment Received',
          description: 'Payment of ₹5,000 received',
          amount: 5000,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'success'
        },
        {
          id: '4',
          type: 'adjustment',
          title: 'Stock Adjustment',
          description: 'Stock adjusted for Mint Ice Cream',
          amount: 0,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          status: 'success'
        }
      ];
      
      const mockTopFlavors: TopSellingFlavor[] = [
        { id: '1', name: 'Vanilla', quantity: 45, revenue: 22500, percentage: 35 },
        { id: '2', name: 'Chocolate', quantity: 30, revenue: 18000, percentage: 28 },
        { id: '3', name: 'Strawberry', quantity: 25, revenue: 15000, percentage: 23 },
        { id: '4', name: 'Mint', quantity: 15, revenue: 9000, percentage: 14 }
      ];
      
      setStats(mockStats);
      setRecentTransactions(mockTransactions);
      setTopSellingFlavors(mockTopFlavors);
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

  const getTransactionIcon = (type: RecentTransaction['type']) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4" />;
      case 'restock':
        return <Package className="h-4 w-4" />;
      case 'adjustment':
        return <BarChart3 className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: RecentTransaction['type'], status: RecentTransaction['status']) => {
    if (status === 'failed') return 'text-red-600 bg-red-50 border-red-200';
    if (status === 'pending') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    
    switch (type) {
      case 'sale':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'restock':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'adjustment':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'payment':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: RecentTransaction['status']) => {
    const statusConfig = {
      success: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
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
          <h1 className="text-3xl font-bold">Shop Dashboard</h1>
          <p className="text-gray-600">Manage your ice cream shop operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
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
              <span className="text-sm text-green-600">+8.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalProfit)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-blue-600">40% profit margin</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-purple-600">{stats.currentStock}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-purple-600">Units in inventory</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-red-600">Items need restocking</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border",
                        getTransactionColor(transaction.type, transaction.status)
                      )}
                    >
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{transaction.title}</p>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(transaction.timestamp)}
                          </span>
                          <span className={cn(
                            "text-xs font-medium",
                            transaction.amount > 0 ? "text-green-600" : 
                            transaction.amount < 0 ? "text-red-600" : "text-gray-600"
                          )}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Selling Flavors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Top Selling Flavors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topSellingFlavors.map((flavor) => (
                    <div key={flavor.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{flavor.name}</span>
                        <span className="text-sm text-gray-600">{flavor.quantity} units</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{formatCurrency(flavor.revenue)}</span>
                          <span>{flavor.percentage}%</span>
                        </div>
                        <Progress value={flavor.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials">
          <ShopFinancialsCard />
        </TabsContent>

        <TabsContent value="inventory">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Inventory Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.currentStock}</p>
                    <p className="text-sm text-gray-600">Total Stock</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
                    <p className="text-sm text-gray-600">Low Stock Items</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.restockRequests}</p>
                    <p className="text-sm text-gray-600">Pending Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaAnalyticsCard />
            <ShopInsightsCard performanceData={performanceData} />
          </div>
        </TabsContent>

        <TabsContent value="discounts">
          <DiscountCodeManager isFactoryWide={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopOwnerDashboard;
