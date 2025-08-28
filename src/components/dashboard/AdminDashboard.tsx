import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  BarChart3
} from 'lucide-react';
import { DashboardMetrics } from '@/apis/dashboardApi';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  metrics: DashboardMetrics['metrics'];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{growth}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalRevenue?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalRevenue?.count || 0} fulfilled restocks
            </p>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.totalRevenue?.total || 0}
                previousValue={metrics.totalRevenue?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Shops */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalShops?.total || 0}
            </div>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.totalShops?.total || 0}
                previousValue={metrics.totalShops?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalProducts?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active products
            </p>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.totalProducts?.total || 0}
                previousValue={metrics.totalProducts?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalCategories?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Product categories
            </p>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.totalCategories?.total || 0}
                previousValue={metrics.totalCategories?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Restock Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Restock Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {metrics.pendingRestockRequests?.count || 0}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Items requiring restocking across all shops
            </p>
            <div className="mb-4">
              <TrendIndicator
                value={metrics.pendingRestockRequests?.count || 0}
                previousValue={metrics.pendingRestockRequests?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/restock-management')}
            >
              View All Requests
            </Button>
          </CardContent>
        </Card>

        {/* System Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              System Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {metrics.systemNotifications?.count || 0}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Unread system notifications
            </p>
            <div className="mb-4">
              <TrendIndicator
                value={metrics.systemNotifications?.count || 0}
                previousValue={metrics.systemNotifications?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/notifications')}
            >
              View Notifications
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shop Performance */}
      {metrics.shopPerformance && metrics.shopPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Revenue Generating Shops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.shopPerformance.map((shop, index) => (
                <div key={shop.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {shop.orderCount} fulfilled restocks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(shop.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <div className="mt-1">
                      <TrendIndicator
                        value={shop.totalRevenue}
                        previousValue={shop.previousRevenue}
                        showPercentage={false}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/inventory/add')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Package className="h-6 w-6" />
              <span>Add Product</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/shops/add')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <ShoppingCart className="h-6 w-6" />
              <span>Add Shop</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/employees/add')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Users className="h-6 w-6" />
              <span>Add Employee</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
