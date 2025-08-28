import { DashboardMetrics } from '@/apis/dashboardApi';

// Color palette for charts
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  warning: '#f97316',
  info: '#06b6d4',
  success: '#22c55e',
  muted: '#6b7280',
  // Additional colors for multiple datasets
  colors: [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'
  ]
};

// Calculate percentage change between two values
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Calculate trend direction and strength
export const calculateTrend = (current: number, previous: number) => {
  const percentage = calculatePercentageChange(current, previous);
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
};

// Calculate moving average for trend analysis
export const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(null as any);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((acc, val) => acc + val, 0);
      result.push(sum / window);
    }
  }
  return result;
};

// Calculate growth rate over multiple periods
export const calculateGrowthRate = (values: number[]): number => {
  if (values.length < 2) return 0;
  
  const first = values[0];
  const last = values[values.length - 1];
  
  if (first === 0) return last > 0 ? 100 : 0;
  
  return ((last - first) / first) * 100;
};

// Transform category breakdown data for charts
export const transformCategoryData = (metrics: DashboardMetrics['metrics']) => {
  if (!metrics.categoryBreakdown) return [];
  
  return metrics.categoryBreakdown.map((item, index) => ({
    label: item.category,
    value: item.quantity,
    previousValue: item.previousQuantity,
    growth: item.growth,
    color: CHART_COLORS.colors[index % CHART_COLORS.colors.length]
  }));
};

// Transform flavor breakdown data for charts
export const transformFlavorData = (metrics: DashboardMetrics['metrics']) => {
  if (!metrics.flavorBreakdown) return [];
  
  return metrics.flavorBreakdown.map((item, index) => ({
    label: item.flavor,
    value: item.quantity,
    previousValue: item.previousQuantity,
    growth: item.growth,
    color: CHART_COLORS.colors[index % CHART_COLORS.colors.length]
  }));
};

// Transform sales trend data for charts
export const transformSalesTrendData = (metrics: DashboardMetrics['metrics']) => {
  if (!metrics.salesTrend) return [];
  
  return metrics.salesTrend.map(item => ({
    date: item.date,
    total: item.total
  }));
};

// Calculate best performing categories
export const getBestCategories = (metrics: DashboardMetrics['metrics'], limit: number = 5) => {
  if (!metrics.categoryBreakdown) return [];
  
  return metrics.categoryBreakdown
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      color: CHART_COLORS.colors[index % CHART_COLORS.colors.length]
    }));
};

// Calculate best performing flavors
export const getBestFlavors = (metrics: DashboardMetrics['metrics'], limit: number = 5) => {
  if (!metrics.flavorBreakdown) return [];
  
  return metrics.flavorBreakdown
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      color: CHART_COLORS.colors[index % CHART_COLORS.colors.length]
    }));
};

// Calculate top selling products
export const getTopSellingProducts = (metrics: DashboardMetrics['metrics'], limit: number = 10) => {
  if (!metrics.topSellingProducts) return [];
  
  return metrics.topSellingProducts
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      color: CHART_COLORS.colors[index % CHART_COLORS.colors.length]
    }));
};

// Calculate revenue trends
export const calculateRevenueTrends = (metrics: DashboardMetrics['metrics']) => {
  const shopRevenue = metrics.shopRevenue;
  if (!shopRevenue) return null;
  
  const current = shopRevenue.total;
  const previous = shopRevenue.previousPeriod || 0;
  const trend = calculateTrend(current, previous);
  
  return {
    current,
    previous,
    trend,
    growth: shopRevenue.growth || 0,
    count: shopRevenue.count || 0
  };
};

// Calculate restock expense trends
export const calculateRestockTrends = (metrics: DashboardMetrics['metrics']) => {
  const restockExpenses = metrics.restockExpenses;
  if (!restockExpenses) return null;
  
  const current = restockExpenses.total;
  const previous = restockExpenses.previousPeriod || 0;
  const trend = calculateTrend(current, previous);
  
  return {
    current,
    previous,
    trend,
    growth: restockExpenses.growth || 0,
    count: restockExpenses.count || 0
  };
};
