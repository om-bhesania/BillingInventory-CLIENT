import { DashboardMetrics } from "@/apis/dashboardApi";
import { DateRange } from "@/components/ui/DateRangePicker";
import {
  subDays,
  subMonths,
  subQuarters,
  subYears,
  isAfter,
  isBefore,
  isSameDay,
} from "date-fns";

// Enhanced color palette with semantic meanings
export const ENHANCED_CHART_COLORS = {
  // Performance colors
  excellent: "#10b981", // Green - excellent performance
  good: "#3b82f6", // Blue - good performance
  average: "#f59e0b", // Yellow - average performance
  poor: "#ef4444", // Red - poor performance

  // Trend colors
  positive: "#10b981", // Green - positive trend
  negative: "#ef4444", // Red - negative trend
  neutral: "#6b7280", // Gray - neutral/no change

  // Status colors
  success: "#22c55e", // Success states
  warning: "#f97316", // Warning states
  info: "#06b6d4", // Information states

  // Category colors for charts
  colors: [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#84cc16",
    "#ec4899",
    "#14b8a6",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#a78bfa",
    "#f87171",
  ],
};

// Enhanced trend analysis with strength and confidence
export interface EnhancedTrend {
  percentage: number;
  direction: "up" | "down" | "stable";
  strength: "strong" | "moderate" | "weak";
  confidence: "high" | "medium" | "low";
  isSignificant: boolean;
  previousValue: number;
  currentValue: number;
}

// Anomaly detection result
export interface AnomalyDetection {
  isAnomaly: boolean;
  severity: "low" | "medium" | "high" | "critical";
  type: "spike" | "drop" | "trend_change" | "seasonal_variation";
  description: string;
  confidence: number;
  suggestedAction: string;
}

// Business insight
export interface BusinessInsight {
  type: "opportunity" | "warning" | "recommendation" | "trend";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  action: string;
  data: any;
}

// Calculate equivalent previous period for any date range
export const calculatePreviousPeriod = (dateRange: DateRange): DateRange => {
  const duration = dateRange.to.getTime() - dateRange.from.getTime();
  const daysDiff = Math.ceil(duration / (1000 * 60 * 60 * 24));

  let previousFrom: Date;
  let previousTo: Date;

  if (daysDiff === 0) {
    // Same day - go back 1 day
    previousFrom = subDays(dateRange.from, 1);
    previousTo = subDays(dateRange.to, 1);
  } else if (daysDiff <= 7) {
    // Week or less - go back same number of days
    previousFrom = subDays(dateRange.from, daysDiff + 1);
    previousTo = subDays(dateRange.from, 1);
  } else if (daysDiff <= 31) {
    // Month or less - go back same number of days
    previousFrom = subDays(dateRange.from, daysDiff + 1);
    previousTo = subDays(dateRange.from, 1);
  } else if (daysDiff <= 90) {
    // Quarter or less - go back same number of days
    previousFrom = subDays(dateRange.from, daysDiff + 1);
    previousTo = subDays(dateRange.from, 1);
  } else {
    // Year or more - go back same number of days
    previousFrom = subDays(dateRange.from, daysDiff + 1);
    previousTo = subDays(dateRange.from, 1);
  }

  return { from: previousFrom, to: previousTo };
};

// Enhanced percentage change calculation with confidence
export const calculateEnhancedPercentageChange = (
  current: number,
  previous: number,
  sampleSize?: number
): EnhancedTrend => {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "stable",
      strength: current > 0 ? "strong" : "weak",
      confidence: "low",
      isSignificant: false,
      previousValue: previous,
      currentValue: current,
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  const isPositive = percentage >= 0;

  // Determine strength based on percentage
  let strength: "strong" | "moderate" | "weak";
  if (Math.abs(percentage) >= 25) strength = "strong";
  else if (Math.abs(percentage) >= 10) strength = "moderate";
  else strength = "weak";

  // Determine confidence based on sample size and magnitude
  let confidence: "high" | "medium" | "low";
  if (sampleSize && sampleSize > 100 && Math.abs(percentage) > 5) {
    confidence = "high";
  } else if (sampleSize && sampleSize > 50 && Math.abs(percentage) > 3) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  // Determine if change is statistically significant
  const isSignificant = Math.abs(percentage) > 5 && confidence !== "low";

  return {
    percentage: Math.abs(percentage),
    direction: isPositive ? "up" : "down",
    strength,
    confidence,
    isSignificant,
    previousValue: previous,
    currentValue: current,
  };
};

// Anomaly detection using statistical methods
export const detectAnomalies = (
  data: number[],
  threshold: number = 2.5
): AnomalyDetection[] => {
  if (data.length < 3) return [];

  const anomalies: AnomalyDetection[] = [];
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      const isSpike = value > mean;
      const severity =
        zScore > 4
          ? "critical"
          : zScore > 3
          ? "high"
          : zScore > 2.5
          ? "medium"
          : "low";

      anomalies.push({
        isAnomaly: true,
        severity,
        type: isSpike ? "spike" : "drop",
        description: `${
          isSpike ? "Unusual spike" : "Unusual drop"
        } detected (${zScore.toFixed(2)}σ from mean)`,
        confidence: Math.min(95, (zScore / 4) * 100),
        suggestedAction: isSpike
          ? "Investigate cause of increased activity"
          : "Check for system issues or data problems",
      });
    }
  });

  return anomalies;
};

// Generate business insights based on data analysis
export const generateBusinessInsights = (
  metrics: DashboardMetrics["metrics"],
  dateRange: DateRange
): BusinessInsight[] => {
  const insights: BusinessInsight[] = [];

  // Revenue insights
  if (
    metrics.shopRevenue &&
    metrics.shopRevenue.total &&
    Number(metrics.shopRevenue.total) > 0
  ) {
    const revenueTrend = calculateEnhancedPercentageChange(
      Number(metrics.shopRevenue.total) || 0,
      Number(metrics.shopRevenue.previousPeriod) || 0,
      Number(metrics.shopRevenue.count) || 0
    );

    if (revenueTrend.direction === "up" && revenueTrend.strength === "strong") {
      insights.push({
        type: "opportunity",
        priority: "high",
        title: "Strong Revenue Growth",
        description: `Revenue increased by ${revenueTrend.percentage.toFixed(
          1
        )}% compared to previous period`,
        impact: "Positive - indicates strong business performance",
        action:
          "Consider expanding successful product lines and marketing strategies",
        data: revenueTrend,
      });
    } else if (
      revenueTrend.direction === "down" &&
      revenueTrend.strength === "strong"
    ) {
      insights.push({
        type: "warning",
        priority: "high",
        title: "Revenue Decline Detected",
        description: `Revenue decreased by ${revenueTrend.percentage.toFixed(
          1
        )}% compared to previous period`,
        impact: "Negative - requires immediate attention",
        action:
          "Analyze product performance, check pricing strategy, review market conditions",
        data: revenueTrend,
      });
    }
  }

  // Product performance insights
  if (metrics.topSellingProducts && metrics.topSellingProducts.length > 0) {
    const topProduct = metrics.topSellingProducts[0];
    if (topProduct && topProduct.growth && topProduct.growth > 20) {
      insights.push({
        type: "recommendation",
        priority: "high",
        title: "High-Performing Product",
        description: `${topProduct.product?.name || "Product"} shows ${(
          topProduct.growth || 0
        ).toFixed(1)}% growth`,
        impact: "Opportunity to increase stock and marketing focus",
        action: "Increase inventory levels and consider expanding product line",
        data: topProduct,
      });
    }

    // Check for declining products
    const decliningProducts = metrics.topSellingProducts.filter(
      (p) => p && p.growth && p.growth < -10
    );
    if (decliningProducts.length > 0) {
      insights.push({
        type: "warning",
        priority: "medium",
        title: "Products with Declining Sales",
        description: `${decliningProducts.length} products showing declining sales trends`,
        impact: "Risk of inventory buildup and reduced profitability",
        action:
          "Review pricing, marketing, and consider product updates or discontinuation",
        data: decliningProducts,
      });
    }
  }

  // Stock level insights
  if (
    metrics.currentStockLevels &&
    metrics.currentStockLevels.lowStockCount &&
    metrics.currentStockLevels.lowStockCount > 0
  ) {
    insights.push({
      type: "warning",
      priority: "medium",
      title: "Low Stock Alerts",
      description: `${metrics.currentStockLevels.lowStockCount} items are running low on stock`,
      impact: "Risk of stockouts and lost sales",
      action:
        "Prioritize restocking for high-demand items and review inventory management",
      data: metrics.currentStockLevels,
    });
  }

  // Category performance insights
  if (metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0) {
    const bestCategory = metrics.categoryBreakdown.reduce(
      (best, current) => (current.quantity > best.quantity ? current : best),
      metrics.categoryBreakdown[0] // initial value
    );

    if (bestCategory.growth > 15) {
      insights.push({
        type: "opportunity",
        priority: "medium",
        title: "High-Growth Category",
        description: `${bestCategory.category} category growing at ${(
          bestCategory.growth || 0
        ).toFixed(1)}%`,
        impact: "Opportunity to expand category offerings",
        action:
          "Increase variety within this category and cross-promote related products",
        data: bestCategory,
      });
    }
  }

  // Restock efficiency insights
  if (metrics.restockExpenses) {
    const restockTrend = calculateEnhancedPercentageChange(
      metrics.restockExpenses.total,
      metrics.restockExpenses.previousPeriod || 0
    );

    if (restockTrend.direction === "up" && restockTrend.percentage > 20) {
      insights.push({
        type: "warning",
        priority: "medium",
        title: "Increasing Restock Costs",
        description: `Restock expenses increased by ${restockTrend.percentage.toFixed(
          1
        )}%`,
        impact: "Higher operational costs affecting profitability",
        action:
          "Review supplier pricing, optimize order quantities, and negotiate better terms",
        data: restockTrend,
      });
    }
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Calculate average order value and trends
export const calculateAverageOrderValue = (
  metrics: DashboardMetrics["metrics"]
) => {
  if (
    !metrics.shopRevenue ||
    !metrics.shopRevenue.count ||
    Number(metrics.shopRevenue.count) === 0
  )
    return null;

  const currentTotal = Number(metrics.shopRevenue.total) || 0;
  const currentCount = Number(metrics.shopRevenue.count) || 1;
  const previousTotal = Number(metrics.shopRevenue.previousPeriod) || 0;
  const previousCount = Number(metrics.shopRevenue.previousPeriod) || 1;

  const currentAOV = currentTotal / currentCount;
  const previousAOV = previousTotal / previousCount;

  const aovTrend = calculateEnhancedPercentageChange(currentAOV, previousAOV);

  return {
    current: currentAOV,
    previous: previousAOV,
    trend: aovTrend,
  };
};

// Calculate product contribution share
export const calculateProductContribution = (
  metrics: DashboardMetrics["metrics"]
) => {
  if (!metrics.topSellingProducts || !metrics.shopRevenue) return [];

  const totalRevenue = metrics.shopRevenue.total;

  return metrics.topSellingProducts
    .map((product) => {
      const productRevenue = product.quantity * (product.product?.price || 0);
      const contribution = (productRevenue / totalRevenue) * 100;

      return {
        ...product,
        revenue: productRevenue,
        contribution: contribution,
        contributionRank: 0, // Will be set after sorting
      };
    })
    .sort((a, b) => b.contribution - a.contribution)
    .map((product, index) => ({
      ...product,
      contributionRank: index + 1,
    }));
};

// Enhanced moving average with multiple windows
export const calculateEnhancedMovingAverage = (
  data: number[],
  windows: number[] = [3, 7, 14]
): Record<string, number[]> => {
  const result: Record<string, number[]> = {};

  windows.forEach((window) => {
    result[`${window}Day`] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result[`${window}Day`].push(null as any);
      } else {
        const sum = data
          .slice(i - window + 1, i + 1)
          .reduce((acc, val) => acc + val, 0);
        result[`${window}Day`].push(sum / window);
      }
    }
  });

  return result;
};

// Forecast potential stockouts based on sales velocity
export const forecastStockouts = (
  products: any[],
  currentStock: any[],
  daysToForecast: number = 30
): Array<{
  productId: string;
  daysUntilStockout: number;
  risk: "high" | "medium" | "low";
}> => {
  const forecasts = [];

  products.forEach((product) => {
    const stockItem = currentStock.find(
      (item) => item.productId === product.productId
    );
    if (!stockItem) return;

    const dailySales = product.quantity / daysToForecast;
    const daysUntilStockout = stockItem.currentStock / dailySales;

    let risk: "high" | "medium" | "low";
    if (daysUntilStockout <= 7) risk = "high";
    else if (daysUntilStockout <= 14) risk = "medium";
    else risk = "low";

    if (daysUntilStockout <= daysToForecast) {
      forecasts.push({
        productId: product.productId,
        daysUntilStockout: Math.floor(daysUntilStockout),
        risk,
      });
    }
  });

  return forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
};

// Generate role-specific insights
export const generateRoleBasedInsights = (
  metrics: DashboardMetrics["metrics"],
  role: "Admin" | "Shop_Owner",
  dateRange: DateRange
): BusinessInsight[] => {
  const baseInsights = generateBusinessInsights(metrics, dateRange);

  if (role === "Admin") {
    // Admin-specific insights
    const adminInsights: BusinessInsight[] = [];

    // Check if shopPerformance exists and has data before processing
    if (metrics.shopPerformance && metrics.shopPerformance.length > 0) {
      const topShop = metrics.shopPerformance.reduce((best, current) =>
        current.totalRevenue > best.totalRevenue ? current : best
      );

      if (topShop.revenueGrowth > 20) {
        adminInsights.push({
          type: "opportunity",
          priority: "high",
          title: "High-Performing Shop",
          description: `${topShop.name} shows ${(
            topShop.revenueGrowth || 0
          ).toFixed(1)}% revenue growth`,
          impact: "Model for other shops to follow",
          action: "Document best practices and share with other shop owners",
          data: topShop,
        });
      }

      const underperformingShops = metrics.shopPerformance.filter(
        (shop) => shop.revenueGrowth < -10
      );
      if (underperformingShops.length > 0) {
        adminInsights.push({
          type: "warning",
          priority: "medium",
          title: "Underperforming Shops",
          description: `${underperformingShops.length} shops showing declining revenue`,
          impact: "Overall system performance affected",
          action: "Provide additional support and training to struggling shops",
          data: underperformingShops,
        });
      }
    }

    if (
      metrics.pendingRestockRequests &&
      metrics.pendingRestockRequests.count > 10
    ) {
      adminInsights.push({
        type: "warning",
        priority: "medium",
        title: "High Restock Request Volume",
        description: `${metrics.pendingRestockRequests.count} pending restock requests`,
        impact: "Potential delays in shop operations",
        action: "Prioritize high-demand items and optimize fulfillment process",
        data: metrics.pendingRestockRequests,
      });
    }

    return [...baseInsights, ...adminInsights];
  } else {
    // Shop Owner specific insights
    const shopOwnerInsights: BusinessInsight[] = [];

    // Add inventory optimization insights
    if (
      metrics.currentStockLevels &&
      metrics.currentStockLevels.lowStockItems
    ) {
      const lowStockItems = metrics.currentStockLevels.lowStockItems || [];
      if (lowStockItems.length > 0) {
        shopOwnerInsights.push({
          type: "recommendation",
          priority: "high",
          title: "Inventory Optimization Needed",
          description: `${lowStockItems.length} items need immediate restocking`,
          impact: "Prevent stockouts and maintain customer satisfaction",
          action:
            "Prioritize restocking based on sales velocity and profit margins",
          data: lowStockItems,
        });
      }
    }

    // Add customer behavior insights
    if (metrics.shopRevenue && metrics.shopRevenue.count) {
      const aov = calculateAverageOrderValue(metrics);
      if (aov && aov.trend && aov.trend.direction === "up") {
        shopOwnerInsights.push({
          type: "opportunity",
          priority: "medium",
          title: "Increasing Customer Value",
          description: `Average order value increased by ${aov.trend.percentage.toFixed(
            1
          )}%`,
          impact: "Higher revenue per customer transaction",
          action:
            "Continue upselling strategies and bundle high-margin products",
          data: aov,
        });
      }
    }

    return [...baseInsights, ...shopOwnerInsights];
  }
};

// Data transformation functions for charts
export const transformCategoryData = (metrics: DashboardMetrics["metrics"]) => {
  if (!metrics.categoryBreakdown) return [];

  return metrics.categoryBreakdown.map((item, index) => ({
    label: item.category,
    value: item.quantity || 0,
    previousValue: item.previousQuantity || 0,
    growth: typeof item.growth === "number" ? item.growth : 0,
    color:
      ENHANCED_CHART_COLORS.colors[index % ENHANCED_CHART_COLORS.colors.length],
  }));
};

export const transformFlavorData = (metrics: DashboardMetrics["metrics"]) => {
  if (!metrics.flavorBreakdown) return [];

  return metrics.flavorBreakdown.map((item, index) => ({
    label: item.flavor,
    value: item.quantity || 0,
    previousValue: item.previousQuantity || 0,
    growth: typeof item.growth === "number" ? item.growth : 0,
    color:
      ENHANCED_CHART_COLORS.colors[index % ENHANCED_CHART_COLORS.colors.length],
  }));
};

export const transformSalesTrendData = (
  metrics: DashboardMetrics["metrics"]
) => {
  if (!metrics.salesTrend || !Array.isArray(metrics.salesTrend)) return [];

  return metrics.salesTrend.map((item) => ({
    date: item?.date || new Date().toISOString(),
    total: Number(item?.total) || 0,
  }));
};

export const getBestCategories = (metrics: DashboardMetrics["metrics"]) => {
  if (!metrics.categoryBreakdown) return [];

  return metrics.categoryBreakdown
    .sort((a, b) => (b.growth || 0) - (a.growth || 0))
    .slice(0, 5);
};

export const getBestFlavors = (metrics: DashboardMetrics["metrics"]) => {
  if (!metrics.flavorBreakdown) return [];

  return metrics.flavorBreakdown
    .sort((a, b) => (b.growth || 0) - (a.growth || 0))
    .slice(0, 5);
};

export const getTopSellingProducts = (metrics: DashboardMetrics["metrics"]) => {
  if (!metrics.topSellingProducts) return [];

  return metrics.topSellingProducts
    .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
    .slice(0, 10)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};

export const calculateRevenueTrends = (
  metrics: DashboardMetrics["metrics"]
) => {
  if (!metrics.shopRevenue) return null;

  const current = Number(metrics.shopRevenue.total) || 0;
  const previous = Number(metrics.shopRevenue.previousPeriod) || 0;
  const count = Number(metrics.shopRevenue.count) || 0;

  return {
    current,
    previous,
    count,
  };
};

export const calculateRestockTrends = (
  metrics: DashboardMetrics["metrics"]
) => {
  if (!metrics.restockExpenses) return null;

  const current = Number(metrics.restockExpenses.total) || 0;
  const previous = Number(metrics.restockExpenses.previousPeriod) || 0;
  const count = Number(metrics.restockExpenses.count) || 0;

  return {
    current,
    previous,
    count,
  };
};
