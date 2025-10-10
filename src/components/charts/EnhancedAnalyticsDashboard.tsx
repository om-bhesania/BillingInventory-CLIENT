import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendChart, BarChart, DoughnutChart, SalesTrendChart } from "./index";
import {
  transformCategoryData,
  transformFlavorData,
  transformSalesTrendData,
  getBestCategories,
  getBestFlavors,
  getTopSellingProducts,
  calculateRevenueTrends,
  calculateRestockTrends,
  calculatePreviousPeriod,
  calculateEnhancedPercentageChange,
  detectAnomalies,
  generateRoleBasedInsights,
  calculateAverageOrderValue,
  calculateProductContribution,
  forecastStockouts,
} from "@/lib/enhancedAnalytics";
import { DashboardMetrics } from "@/apis/dashboardApi";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { EnhancedKPICard } from "@/components/ui/EnhancedKPICard";
import { BusinessInsights } from "@/components/ui/BusinessInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Star,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { ChartErrorBoundary } from "./ChartErrorBoundary";
import useDashboard from "@/hooks/use-getDashboardData";

interface EnhancedAnalyticsDashboardProps {
  metrics?: DashboardMetrics["metrics"];
  role?: "Admin" | "Shop_Owner";
  className?: string;
}

export const EnhancedAnalyticsDashboard: React.FC<
  EnhancedAnalyticsDashboardProps
> = ({ metrics: propMetrics, role: propRole, className = "" }) => {
  // Use the dashboard hook
  const {
    dashboardData,
    dateRange,
    isRefreshing,
    isAdmin,
    handleDateRangeChange,
    handleManualRefresh,
  } = useDashboard();

  // Use metrics from props or hook data, prefer props for flexibility
  const metrics = propMetrics || dashboardData?.metrics;
  const role = propRole || (isAdmin ? "Admin" : "Shop_Owner");

  const [previousPeriod, setPreviousPeriod] = useState<any>(null);

  // Calculate previous period when date range changes
  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      setPreviousPeriod(calculatePreviousPeriod(dateRange));
    }
  }, [dateRange]);

  // Early return if no metrics
  if (!metrics) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Analytics Data Available
              </h3>
              <p className="text-muted-foreground mb-4">
                Analytics data is not available. Please check back later or
                contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform data for charts
  const categoryData = transformCategoryData(metrics);
  const flavorData = transformFlavorData(metrics);
  const salesTrendData = transformSalesTrendData(metrics);

  // Debug logging to understand data structure
  console.log("EnhancedAnalyticsDashboard - Data Debug:", {
    categoryData: categoryData.slice(0, 2),
    flavorData: flavorData.slice(0, 2),
    metrics: {
      hasCategoryBreakdown: !!metrics.categoryBreakdown,
      hasFlavorBreakdown: !!metrics.flavorBreakdown,
      categoryBreakdownLength: metrics.categoryBreakdown?.length,
      flavorBreakdownLength: metrics.flavorBreakdown?.length,
      shopRevenue: {
        total: metrics.shopRevenue?.total,
        type: typeof metrics.shopRevenue?.total,
        count: metrics.shopRevenue?.count,
      },
      restockExpenses: {
        total: metrics.restockExpenses?.total,
        type: typeof metrics.restockExpenses?.total,
        count: metrics.restockExpenses?.count,
      },
    },
  });

  // Get best performers
  const bestCategories = getBestCategories(metrics);
  const bestFlavors = getBestFlavors(metrics);
  const topProducts = getTopSellingProducts(metrics);

  // Calculate trends with enhanced analytics
  const revenueTrends = calculateRevenueTrends(metrics);
  const restockTrends = calculateRestockTrends(metrics);
  const aovData = calculateAverageOrderValue(metrics);
  const productContributions = calculateProductContribution(metrics);

  // Generate business insights
  const insights = generateRoleBasedInsights(metrics, role, dateRange);

  // Detect anomalies in sales data
  const salesValues = salesTrendData.map((item) => item.total);
  const anomalies = detectAnomalies(salesValues);

  // Forecast stockouts
  const stockoutForecasts = forecastStockouts(
    topProducts,
    metrics.currentStockLevels?.lowStockItems || []
  );
  console.log("stockoutForecasts", stockoutForecasts);
  const formatCurrency = (amount: unknown, debugKey?: string) => {
    // Normalize: allow raw numbers, numeric strings with commas/currency symbols
    let numericValue: number;
    if (typeof amount === "string") {
      const cleaned = amount.replace(/[^0-9.-]/g, "");
      numericValue = cleaned ? parseFloat(cleaned) : NaN;
    } else {
      numericValue = Number((amount as any)?.valueOf?.() ?? amount);
    }

    if (!Number.isFinite(numericValue)) {
      if (process.env.NODE_ENV !== "production") {
        console.log("formatCurrency: invalid amount", {
          key: debugKey,
          amount,
        });
      }
      return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  const handleExport = () => {
    // Export functionality
    console.log("Exporting dashboard data...");
  };

  const hasValidChartData =
    categoryData.length > 0 ||
    flavorData.length > 0 ||
    salesTrendData.length > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Date Range and Controls */}
      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-white rounded-lg border shadow-sm ${role === "Admin" && 'hidden' } `}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role !== "Admin" ? "Shop Analytics Dashboard" : ""}
          </h1>
          <p className="text-gray-600 mt-1">
            {role === "Admin"
              ? ""
              : "Monitor all shops, products, and system performance"}
          </p>
        </div>

        {/* <div className="flex flex-col sm:flex-row items-center gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div> */}
      </div>

      {/* Date Range Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Current Period: {dateRange?.from?.toLocaleDateString()} -{" "}
            {dateRange?.to?.toLocaleDateString()}
          </span>
        </div>
        {previousPeriod && (
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>
              Previous: {previousPeriod.from.toLocaleDateString()} -{" "}
              {previousPeriod.to.toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Role-based KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {role === "Admin" ? (
          // Admin KPIs
          <>
            <EnhancedKPICard
              title="Total Revenue"
              value={Number(metrics.totalRevenue?.total ?? 0)}
              subtitle={`${metrics.totalRevenue?.count || 0} total invoices`}
              trend={
                metrics.totalRevenue
                  ? calculateEnhancedPercentageChange(
                      metrics.totalRevenue.total,
                      metrics.totalRevenue.previousPeriod || 0,
                      metrics.totalRevenue.count
                    )
                  : undefined
              }
              icon={<DollarSign className="h-4 w-4" />}
              formatValue={formatCurrency}
            />

            <EnhancedKPICard
              title="Total Shops"
              value={metrics.totalShops?.total || 0}
              subtitle="Active shops in system"
              trend={
                metrics.totalShops
                  ? calculateEnhancedPercentageChange(
                      metrics.totalShops.total,
                      metrics.totalShops.previousPeriod || 0
                    )
                  : undefined
              }
              icon={<Users className="h-4 w-4" />}
            />

            <EnhancedKPICard
              title="Total Products"
              value={metrics.totalProducts?.total || 0}
              subtitle="Products in catalog"
              trend={
                metrics.totalProducts
                  ? calculateEnhancedPercentageChange(
                      metrics.totalProducts?.total,
                      metrics.totalProducts?.previousPeriod || 0
                    )
                  : undefined
              }
              icon={<Package className="h-4 w-4" />}
            />

            <EnhancedKPICard
              title="Restock Requests"
              value={metrics.pendingRestockRequests?.count || 0}
              subtitle="Pending requests"
              trend={
                metrics?.pendingRestockRequests
                  ? calculateEnhancedPercentageChange(
                      metrics.pendingRestockRequests?.count,
                      metrics.pendingRestockRequests?.previousPeriod || 0
                    )
                  : undefined
              }
              icon={<ShoppingCart className="h-4 w-4" />}
            />
          </>
        ) : (
          // Shop Owner KPIs
          <>
            <EnhancedKPICard
              title="Shop Revenue"
              value={Number(metrics?.shopRevenue?.total ?? 0)}
              subtitle={`${metrics?.shopRevenue?.count || 0} invoices`}
              trend={
                revenueTrends
                  ? calculateEnhancedPercentageChange(
                      revenueTrends.current,
                      revenueTrends.previous,
                      revenueTrends.count
                    )
                  : undefined
              }
              icon={<DollarSign className="h-4 w-4" />}
              formatValue={formatCurrency}
            />

            <EnhancedKPICard
              title="Restock Expenses"
              value={Number(metrics?.restockExpenses?.total ?? 0)}
              subtitle={`${
                metrics?.restockExpenses?.count || 0
              } fulfilled restocks`}
              trend={
                restockTrends
                  ? calculateEnhancedPercentageChange(
                      restockTrends.current,
                      restockTrends.previous
                    )
                  : undefined
              }
              icon={<ShoppingCart className="h-4 w-4" />}
              formatValue={formatCurrency}
            />

            <EnhancedKPICard
              title="Current Stock"
              value={metrics.currentStockLevels?.totalItems || 0}
              subtitle="Total inventory items"
              icon={<Package className="h-4 w-4" />}
            />

            <EnhancedKPICard
              title="Low Stock Alerts"
              value={metrics.currentStockLevels?.lowStockCount || 0}
              subtitle="Items needing restock"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Business Insights */}
      <BusinessInsights
        insights={insights}
        title={`${
          role === "Admin" ? "System" : "Shop"
        } Insights & Recommendations`}
        maxInsights={6}
      />

      {/* Charts Grid */}
      {hasValidChartData ? (
        <div className="grid gap-6 md:grid-cols-2 h-auto">
          {/* Sales Trend Chart */}
          <div className="md:col-span-2">
            <ChartErrorBoundary>
              <SalesTrendChart
                data={salesTrendData}
                title="Sales Trend Analysis"
                subtitle="Daily sales performance with moving average trend line"
                currency="INR"
              />
            </ChartErrorBoundary>
          </div>

          {/* Category Performance */}
          <ChartErrorBoundary>
            <BarChart
              data={categoryData.map((item) => ({
                label: item.label,
                value: item.value,
                previousValue: item.previousValue,
                growth: item.growth || 0,
              }))}
              title="Category Performance"
              subtitle="Top performing product categories with growth indicators"
              valueLabel="Units Sold"
              maxItems={8}
            />
          </ChartErrorBoundary>

          {/* Flavor Performance */}
          <ChartErrorBoundary>
            <BarChart
              data={flavorData.map((item) => ({
                label: item.label,
                value: item.value,
                previousValue: item.previousValue,
                growth: item.growth || 0,
              }))}
              title="Flavor Performance"
              subtitle="Best selling flavors with trend analysis"
              valueLabel="Units Sold"
              maxItems={8}
            />
          </ChartErrorBoundary>

          {/* Category Breakdown */}
          <ChartErrorBoundary>
            <DoughnutChart
              data={categoryData.map((item) => ({
                label: item.label,
                value: item.value,
                color: item.color,
              }))}
              title="Category Distribution"
              subtitle="Product category breakdown by sales volume"
              showLegend={false}
            />
          </ChartErrorBoundary>

          {/* Flavor Breakdown */}
          <ChartErrorBoundary>
            <DoughnutChart
              data={flavorData.map((item) => ({
                label: item.label,
                value: item.value,
                color: item.color,
              }))}
              title="Flavor Distribution"
              subtitle="Product flavor breakdown by sales volume"
              showLegend={false}
            />
          </ChartErrorBoundary>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No Chart Data Available
              </h3>
              <p className="text-muted-foreground mb-4">
                Chart data is not available for the selected time period. Please
                try a different date range or check back later.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-specific Additional Sections */}
      {role === "Admin" && metrics.shopPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Shop Performance Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.shopPerformance
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 10)
                .map((shop, index) => (
                  <div
                    key={shop.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{shop.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {shop.orderCount} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(shop.totalRevenue, shop.name)}
                      </div>
                      <div
                        className={`text-sm ${
                          (shop.revenueGrowth || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {(shop.revenueGrowth || 0) >= 0 ? "+" : ""}
                        {(shop.revenueGrowth || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin: Best Products and Flavors Across All Shops */}
      {role === "Admin" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Best Products Across All Shops */}
          {metrics.topSellingProducts &&
            metrics.topSellingProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Top Products Across All Shops
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topSellingProducts
                      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
                      .slice(0, 8)
                      .map((product, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {product.product?.name ||
                                  `Product ${index + 1}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.product?.category?.name || "Category"}{" "}
                                - {product.product?.flavor?.name || "Flavor"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              {product.quantity.toLocaleString()} units
                            </div>
                            <div
                              className={`text-xs ${
                                (product.growth || 0) >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {(product.growth || 0) >= 0 ? "+" : ""}
                              {(product.growth || 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Best Flavors Across All Shops */}
          {metrics.flavorBreakdown && metrics.flavorBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Top Flavors Across All Shops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.flavorBreakdown
                    .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
                    .slice(0, 8)
                    .map((flavor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {flavor.flavor}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Flavor Performance
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {flavor.quantity.toLocaleString()} units
                          </div>
                          <div
                            className={`text-xs ${
                              (flavor.growth || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(flavor.growth || 0) >= 0 ? "+" : ""}
                            {(flavor.growth || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.slice(0, 10).map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {product.rank}
                    </div>
                    <div>
                      <p className="font-medium">
                        {product.product?.name || `Product ${index + 1}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.product?.category?.name || "Category"} -{" "}
                        {product.product?.flavor?.name || "Flavor"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {product.quantity.toLocaleString()} units
                    </div>
                    <div
                      className={`text-sm ${
                        (product.growth || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(product.growth || 0) >= 0 ? "+" : ""}
                      {(product.growth || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stockout Forecasts */}
      {stockoutForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stockout Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockoutForecasts.slice(0, 5).map((forecast, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        forecast.risk === "high"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : forecast.risk === "medium"
                          ? "border-orange-200 text-orange-700 bg-orange-50"
                          : "border-yellow-200 text-yellow-700 bg-yellow-50"
                      }
                    >
                      {forecast.risk} risk
                    </Badge>
                    <div>
                      <p className="font-medium">
                        Product {forecast.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {forecast.daysUntilStockout} days until stockout
                      </p>
                    </div>
                  </div>
                  <Link to={`/shop-inventory/add?itemId=${forecast.productId}`}>
                    Restock Now
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomaly Detection */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anomaly, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-red-50 border-red-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={
                        anomaly.severity === "critical"
                          ? "border-red-300 text-red-800 bg-red-100"
                          : anomaly.severity === "high"
                          ? "border-orange-300 text-orange-800 bg-orange-100"
                          : anomaly.severity === "medium"
                          ? "border-yellow-300 text-yellow-800 bg-yellow-100"
                          : "border-blue-300 text-blue-800 bg-blue-100"
                      }
                    >
                      {anomaly.severity} severity
                    </Badge>
                    <span className="text-sm font-medium">{anomaly.type}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {anomaly.description}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Action:</strong> {anomaly.suggestedAction}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function for className concatenation
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
