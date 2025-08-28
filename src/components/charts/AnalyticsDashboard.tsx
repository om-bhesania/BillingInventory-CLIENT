import React from 'react';
import { 
  TrendChart, 
  BarChart, 
  DoughnutChart, 
  SalesTrendChart 
} from './index';
import { processChartData } from '@/lib/chartDataProcessor';
import { DashboardMetrics } from '@/apis/dashboardApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, Star } from 'lucide-react';

interface AnalyticsDashboardProps {
  metrics: DashboardMetrics['metrics'];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  metrics
}) => {
  // Process chart data using the new processor
  const chartData = processChartData(metrics);
  
  // Check if we have data to display
  if (!chartData.hasData) {
    return (
      <div className="p-6 bg-muted rounded-lg">
        <p className="text-muted-foreground text-center">
          No chart data available. Please ensure your Metrics API is returning the required data.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Required data:</strong> salesTrend, categoryBreakdown, flavorBreakdown, or topSellingProducts
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Data summary: {JSON.stringify(chartData.summary, null, 2)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Trend Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{chartData.revenueTrends?.current?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.revenueTrends?.count || 0} invoices
            </p>
            {chartData.revenueTrends?.trend && (
              <div className={`flex items-center gap-1 mt-2 ${chartData.revenueTrends.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {chartData.revenueTrends.trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {chartData.revenueTrends.trend.isPositive ? '+' : ''}{chartData.revenueTrends.trend.percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restock Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restock Expenses</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{chartData.restockTrends?.current?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.restockTrends?.count || 0} fulfilled restocks
            </p>
            {chartData.restockTrends?.trend && (
              <div className={`flex items-center gap-1 mt-2 ${chartData.restockTrends.trend.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                {chartData.restockTrends.trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {chartData.restockTrends.trend.isPositive ? '+' : ''}{chartData.restockTrends.trend.percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Category Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Category</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.bestCategories[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.bestCategories[0]?.quantity?.toLocaleString() || 0} units sold
            </p>
            {chartData.bestCategories[0]?.growth && (
              <div className={`flex items-center gap-1 mt-2 ${chartData.bestCategories[0].growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {chartData.bestCategories[0].growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {chartData.bestCategories[0].growth >= 0 ? '+' : ''}{chartData.bestCategories[0].growth.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best Flavor Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Flavor</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.bestFlavors[0]?.flavor || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.bestFlavors[0]?.quantity?.toLocaleString() || 0} units sold
            </p>
            {chartData.bestFlavors[0]?.growth && (
              <div className={`flex items-center gap-1 mt-2 ${chartData.bestFlavors[0].growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {chartData.bestFlavors[0].growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {chartData.bestFlavors[0].growth >= 0 ? '+' : ''}{chartData.bestFlavors[0].growth.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Trend Chart */}
        {chartData.salesTrend.length > 0 && (
          <div className="md:col-span-2">
            <SalesTrendChart
              data={chartData.salesTrend}
              title="Sales Trend Analysis"
              subtitle="Daily sales performance with moving average trend line"
              currency="INR"
            />
          </div>
        )}

        {/* Category Performance */}
        {chartData.categoryData.length > 0 && (
          <BarChart
            data={chartData.categoryData.map(item => ({
              label: item.label,
              value: item.value,
              previousValue: item.previousValue,
              growth: item.growth
            }))}
            title="Category Performance"
            subtitle="Top performing product categories with growth indicators"
            valueLabel="Units Sold"
            maxItems={8}
          />
        )}

        {/* Flavor Performance */}
        {chartData.flavorData.length > 0 && (
          <BarChart
            data={chartData.flavorData.map(item => ({
              label: item.label,
              value: item.value,
              previousValue: item.previousValue,
              growth: item.growth
            }))}
            title="Flavor Performance"
            subtitle="Best selling flavors with trend analysis"
            valueLabel="Units Sold"
            maxItems={8}
          />
        )}

        {/* Category Breakdown */}
        {chartData.categoryData.length > 0 && (
          <DoughnutChart
            data={chartData.categoryData.map(item => ({
              label: item.label,
              value: item.value,
              color: item.color
            }))}
            title="Category Distribution"
            subtitle="Product category breakdown by sales volume"
            showLegend={false}
          />
        )}

        {/* Flavor Breakdown */}
        {chartData.flavorData.length > 0 && (
          <DoughnutChart
            data={chartData.flavorData.map(item => ({
              label: item.label,
              value: item.value,
              color: item.color
            }))}
            title="Flavor Distribution"
            subtitle="Product flavor breakdown by sales volume"
            showLegend={false}
          />
        )}
      </div>

      {/* Top Products Table */}
      {chartData.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.topProducts.slice(0, 10).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {product.rank}
                    </div>
                    <div>
                      <p className="font-medium">{product.product?.name || `Product ${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.product?.category?.name || 'Category'} - {product.product?.flavor?.name || 'Flavor'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.quantity.toLocaleString()} units</div>
                    <div className={`text-sm ${(product.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(product.growth || 0) >= 0 ? '+' : ''}{(product.growth || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
