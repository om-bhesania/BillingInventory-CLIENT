import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendIndicator } from '@/components/ui/TrendIndicator';
import {
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import { DashboardMetrics } from '@/apis/dashboardApi';
import { useNavigate } from 'react-router-dom';

// To integrate the new Chart.js components, you can:
// 1. Import the AnalyticsDashboard: import { AnalyticsDashboard } from '@/components/charts';
    // 2. Add it to your dashboard: <AnalyticsDashboard metrics={metrics} />
// 3. Or use individual charts: import { BarChart, DoughnutChart } from '@/components/charts';

interface ShopOwnerDashboardProps {
  metrics: DashboardMetrics['metrics'];
}

const ShopOwnerDashboard: React.FC<ShopOwnerDashboardProps> = ({ metrics }) => {
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Shop Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shop Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.shopRevenue?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.shopRevenue?.count || 0} invoices
            </p>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.shopRevenue?.total || 0}
                previousValue={metrics.shopRevenue?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Restock Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restock Expenses</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.restockExpenses?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.restockExpenses?.count || 0} fulfilled restocks
            </p>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.restockExpenses?.total || 0}
                previousValue={metrics.restockExpenses?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Stock Levels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.currentStockLevels?.totalItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total inventory items
            </p>
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                {metrics.currentStockLevels?.lowStockCount || 0} low stock
              </Badge>
            </div>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.currentStockLevels?.totalItems || 0}
                previousValue={metrics.currentStockLevels?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Restock Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restock Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.pendingRestockRequests?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending requests
            </p>
            <div className="mt-2">
              <TrendIndicator
                value={metrics.pendingRestockRequests?.count || 0}
                previousValue={metrics.pendingRestockRequests?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      {metrics.topSellingProducts && metrics.topSellingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topSellingProducts.map((item, index) => (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product?.category?.name} - {item.product?.flavor?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.quantity} units</p>
                    <p className="text-sm text-muted-foreground">Sold</p>
                    <div className="mt-1">
                      <TrendIndicator
                        value={item.quantity}
                        previousValue={item.previousQuantity}
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

      {/* Low Stock Alerts */}
      {metrics.currentStockLevels?.lowStockItems && metrics.currentStockLevels.lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.currentStockLevels.lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">{item.product?.name}</p>
                      <Badge variant="outline" className={getUrgencyColor(item.urgency || 'low')}>
                        {item.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.product?.category?.name} - {item.product?.flavor?.name}
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Stock</p>
                        <p className="font-medium">{item.currentStock}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min Level</p>
                        <p className="font-medium">{item.minStockLevel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deficit</p>
                        <p className="font-medium text-red-600">{item.stockDeficit}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/shop-inventory')}
                  >
                    Manage Stock
                  </Button>
                </div>
              ))}
              {metrics.currentStockLevels.lowStockCount > 5 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/low-stock')}
                  >
                    View All Low Stock Items ({metrics.currentStockLevels.lowStockCount})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shop Notifications */}
      {metrics.shopNotifications && metrics.shopNotifications.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Shop Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {metrics.shopNotifications.count}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Unread notifications for your shop
            </p>
            <div className="mb-4">
              <TrendIndicator
                value={metrics.shopNotifications?.count || 0}
                previousValue={metrics.shopNotifications?.previousPeriod}
                showPercentage={false}
                size="sm"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/notifications')}
            >
              View All Notifications
            </Button>
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
              onClick={() => navigate('/invoices/add')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <DollarSign className="h-6 w-6" />
              <span>Create Invoice</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/shop-inventory')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Package className="h-6 w-6" />
              <span>Manage Inventory</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/low-stock')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="h-6 w-6" />
              <span>Low Stock Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopOwnerDashboard;
