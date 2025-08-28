import { DashboardMetrics } from '@/apis/dashboardApi';

// Chart data processor utilities for working with real API data
export class ChartDataProcessor {
  private metrics: DashboardMetrics['metrics'];

  constructor(metrics: DashboardMetrics['metrics']) {
    this.metrics = metrics;
  }

  // Process sales trend data for line charts
  processSalesTrendData() {
    if (!this.metrics.salesTrend) return [];
    
    return this.metrics.salesTrend.map(item => ({
      date: item.date,
      total: item.total || 0,
      orders: item.orders || 0,
      averageOrder: item.averageOrder || 0
    }));
  }

  // Process category breakdown for bar charts
  processCategoryData() {
    if (!this.metrics.categoryBreakdown) return [];
    
    const result = this.metrics.categoryBreakdown.map((item, index) => ({
      label: item.category,
      value: item.quantity || 0,
      previousValue: item.previousQuantity || 0,
      growth: typeof item.growth === 'number' ? item.growth : 0,
      color: this.getChartColor(index)
    }));
    
    // Debug logging
    console.log('ChartDataProcessor - Category Data:', {
      input: this.metrics.categoryBreakdown?.slice(0, 2),
      output: result.slice(0, 2)
    });
    
    return result;
  }

  // Process flavor breakdown for bar charts
  processFlavorData() {
    if (!this.metrics.flavorBreakdown) return [];
    
    const result = this.metrics.flavorBreakdown.map((item, index) => ({
      label: item.flavor,
      value: item.quantity || 0,
      previousValue: item.previousQuantity || 0,
      growth: typeof item.growth === 'number' ? item.growth : 0,
      color: this.getChartColor(index)
    }));
    
    // Debug logging
    console.log('ChartDataProcessor - Flavor Data:', {
      input: this.metrics.flavorBreakdown?.slice(0, 2),
      output: result.slice(0, 2)
    });
    
    return result;
  }

  // Process product performance data
  processProductPerformance() {
    if (!this.metrics.topSellingProducts) return [];
    
    return this.metrics.topSellingProducts
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        color: this.getChartColor(index)
      }));
  }

  // Process enhanced chart data if available
  processEnhancedChartData() {
    if (!this.metrics.chartData) return null;
    
    const { chartData } = this.metrics;
    
    return {
      dailySales: chartData.dailySales || [],
      weeklySales: chartData.weeklySales || [],
      monthlySales: chartData.monthlySales || [],
      productPerformance: chartData.productPerformance || [],
      inventoryAnalytics: chartData.inventoryAnalytics || null,
      customerAnalytics: chartData.customerAnalytics || null,
      geographicData: chartData.geographicData || [],
      seasonalTrends: chartData.seasonalTrends || []
    };
  }

  // Get revenue trends
  processRevenueTrends() {
    if (!this.metrics.shopRevenue) return null;
    
    const current = Number(this.metrics.shopRevenue.total) || 0;
    const previous = Number(this.metrics.shopRevenue.previousPeriod) || 0;
    const growth = Number(this.metrics.shopRevenue.growth) || 0;
    
    return {
      current,
      previous,
      growth,
      count: Number(this.metrics.shopRevenue.count) || 0,
      trend: this.calculateTrend(current, previous)
    };
  }

  // Get restock expense trends
  processRestockTrends() {
    if (!this.metrics.restockExpenses) return null;
    
    const current = Number(this.metrics.restockExpenses.total) || 0;
    const previous = Number(this.metrics.restockExpenses.previousPeriod) || 0;
    const growth = Number(this.metrics.restockExpenses.growth) || 0;
    
    return {
      current,
      previous,
      growth,
      count: Number(this.metrics.restockExpenses.count) || 0,
      trend: this.calculateTrend(current, previous)
    };
  }

  // Calculate trend information
  private calculateTrend(current: number, previous: number) {
    if (previous === 0) {
      return {
        percentage: current > 0 ? 100 : 0,
        direction: current > 0 ? 'up' : 'stable',
        strength: current > 0 ? 'strong' : 'weak',
        isPositive: current > 0
      };
    }
    
    const percentage = ((current - previous) / previous) * 100;
    const isPositive = percentage >= 0;
    
    let strength: 'strong' | 'moderate' | 'weak' = 'weak';
    if (Math.abs(percentage) >= 20) strength = 'strong';
    else if (Math.abs(percentage) >= 10) strength = 'moderate';
    
    return {
      percentage: Math.abs(percentage),
      direction: isPositive ? 'up' : 'down',
      strength,
      isPositive
    };
  }

  // Get chart colors
  private getChartColor(index: number): string {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
      '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f87171'
    ];
    
    return colors[index % colors.length];
  }

  // Get best performing categories
  getBestCategories(limit: number = 5) {
    if (!this.metrics.categoryBreakdown) return [];
    
    return this.metrics.categoryBreakdown
      .sort((a, b) => (b.growth || 0) - (a.growth || 0))
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        color: this.getChartColor(index)
      }));
  }

  // Get best performing flavors
  getBestFlavors(limit: number = 5) {
    if (!this.metrics.flavorBreakdown) return [];
    
    return this.metrics.flavorBreakdown
      .sort((a, b) => (b.growth || 0) - (a.growth || 0))
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        color: this.getChartColor(index)
      }));
  }

  // Get top selling products
  getTopSellingProducts(limit: number = 10) {
    if (!this.metrics.topSellingProducts) return [];
    
    return this.metrics.topSellingProducts
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        color: this.getChartColor(index)
      }));
  }

  // Check if data is available for charts
  hasChartData(): boolean {
    return !!(
      this.metrics.salesTrend?.length ||
      this.metrics.categoryBreakdown?.length ||
      this.metrics.flavorBreakdown?.length ||
      this.metrics.topSellingProducts?.length
    );
  }

  // Get data summary for debugging
  getDataSummary() {
    return {
      hasSalesTrend: !!this.metrics.salesTrend?.length,
      hasCategoryData: !!this.metrics.categoryBreakdown?.length,
      hasFlavorData: !!this.metrics.flavorBreakdown?.length,
      hasProductData: !!this.metrics.topSellingProducts?.length,
      hasEnhancedData: !!this.metrics.chartData,
      totalMetrics: Object.keys(this.metrics).length
    };
  }
}

// Export convenience functions
export const processChartData = (metrics: DashboardMetrics['metrics']) => {
  const processor = new ChartDataProcessor(metrics);
  
  return {
    salesTrend: processor.processSalesTrendData(),
    categoryData: processor.processCategoryData(),
    flavorData: processor.processFlavorData(),
    productData: processor.processProductPerformance(),
    enhancedData: processor.processEnhancedChartData(),
    revenueTrends: processor.processRevenueTrends(),
    restockTrends: processor.processRestockTrends(),
    bestCategories: processor.getBestCategories(),
    bestFlavors: processor.getBestFlavors(),
    topProducts: processor.getTopSellingProducts(),
    hasData: processor.hasChartData(),
    summary: processor.getDataSummary()
  };
};
