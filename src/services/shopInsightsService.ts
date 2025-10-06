import { AreaAnalytics, FlavorPerformance } from './areaAnalyticsService';

export interface ShopInsight {
  id: string;
  type: 'revenue' | 'inventory' | 'performance' | 'recommendation' | 'alert';
  title: string;
  description: string;
  value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
}

export interface ShopRecommendation {
  id: string;
  type: 'flavor' | 'inventory' | 'pricing' | 'marketing' | 'operational';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimatedBenefit?: string;
  actionSteps: string[];
}

export interface ShopPerformanceData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingPayments: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingFlavors: FlavorPerformance[];
  lowStockItems: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minStock: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: 'sale' | 'restock' | 'adjustment';
    amount: number;
    date: Date;
    description: string;
  }>;
  areaAnalytics?: AreaAnalytics;
}

export class ShopInsightsService {
  /**
   * Generate comprehensive shop insights based on performance data
   */
  static generateInsights(data: ShopPerformanceData): ShopInsight[] {
    const insights: ShopInsight[] = [];

    // Revenue insights
    insights.push(...this.generateRevenueInsights(data));

    // Inventory insights
    insights.push(...this.generateInventoryInsights(data));

    // Performance insights
    insights.push(...this.generatePerformanceInsights(data));

    // Area-based recommendations
    if (data.areaAnalytics) {
      insights.push(...this.generateAreaBasedInsights(data.areaAnalytics));
    }

    // Sort by priority and return
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate shop recommendations based on performance data
   */
  static generateRecommendations(data: ShopPerformanceData): ShopRecommendation[] {
    const recommendations: ShopRecommendation[] = [];

    // Flavor recommendations
    recommendations.push(...this.generateFlavorRecommendations(data));

    // Inventory recommendations
    recommendations.push(...this.generateInventoryRecommendations(data));

    // Pricing recommendations
    recommendations.push(...this.generatePricingRecommendations(data));

    // Marketing recommendations
    recommendations.push(...this.generateMarketingRecommendations(data));

    // Operational recommendations
    recommendations.push(...this.generateOperationalRecommendations(data));

    return recommendations;
  }

  /**
   * Generate revenue-based insights
   */
  private static generateRevenueInsights(data: ShopPerformanceData): ShopInsight[] {
    const insights: ShopInsight[] = [];

    // Profit margin analysis
    const profitMargin = (data.totalProfit / data.totalRevenue) * 100;
    if (profitMargin < 20) {
      insights.push({
        id: 'low-profit-margin',
        type: 'revenue',
        title: 'Low Profit Margin',
        description: `Your profit margin is ${profitMargin.toFixed(1)}%, which is below the recommended 20%. Consider reviewing your pricing strategy.`,
        value: profitMargin,
        unit: '%',
        trend: 'down',
        priority: 'high',
        actionable: true,
        actionText: 'Review Pricing',
        actionUrl: '/inventory'
      });
    } else if (profitMargin > 35) {
      insights.push({
        id: 'excellent-profit-margin',
        type: 'revenue',
        title: 'Excellent Profit Margin',
        description: `Great job! Your profit margin of ${profitMargin.toFixed(1)}% is well above the industry average.`,
        value: profitMargin,
        unit: '%',
        trend: 'up',
        priority: 'low',
        actionable: false
      });
    }

    // Pending payments alert
    if (data.pendingPayments > 0) {
      insights.push({
        id: 'pending-payments',
        type: 'revenue',
        title: 'Pending Payments',
        description: `You have ₹${data.pendingPayments.toLocaleString()} in pending payments. Follow up to improve cash flow.`,
        value: data.pendingPayments,
        unit: '₹',
        trend: 'stable',
        priority: 'medium',
        actionable: true,
        actionText: 'View Payments',
        actionUrl: '/payments'
      });
    }

    // Revenue growth analysis (would need historical data in real implementation)
    if (data.totalRevenue > 100000) {
      insights.push({
        id: 'strong-revenue',
        type: 'revenue',
        title: 'Strong Revenue Performance',
        description: `Your total revenue of ₹${data.totalRevenue.toLocaleString()} shows strong business performance.`,
        value: data.totalRevenue,
        unit: '₹',
        trend: 'up',
        priority: 'low',
        actionable: false
      });
    }

    return insights;
  }

  /**
   * Generate inventory-based insights
   */
  private static generateInventoryInsights(data: ShopPerformanceData): ShopInsight[] {
    const insights: ShopInsight[] = [];

    // Low stock alerts
    data.lowStockItems.forEach(item => {
      if (item.percentage <= 20) {
        insights.push({
          id: `critical-stock-${item.productId}`,
          type: 'alert',
          title: 'Critical Stock Alert',
          description: `${item.productName} is critically low at ${item.percentage}% of minimum stock. Immediate restock needed.`,
          value: item.percentage,
          unit: '%',
          trend: 'down',
          priority: 'high',
          actionable: true,
          actionText: 'Restock Now',
          actionUrl: '/inventory/restock'
        });
      } else if (item.percentage <= 40) {
        insights.push({
          id: `low-stock-${item.productId}`,
          type: 'alert',
          title: 'Low Stock Alert',
          description: `${item.productName} is running low at ${item.percentage}% of minimum stock. Consider placing a restock order.`,
          value: item.percentage,
          unit: '%',
          trend: 'down',
          priority: 'medium',
          actionable: true,
          actionText: 'Plan Restock',
          actionUrl: '/inventory/restock'
        });
      }
    });

    // Inventory turnover analysis
    const totalInventoryValue = data.lowStockItems.reduce((sum, item) => sum + (item.currentStock * 100), 0); // Assuming ₹100 per unit
    const inventoryTurnover = data.totalRevenue / totalInventoryValue;
    
    if (inventoryTurnover < 2) {
      insights.push({
        id: 'slow-inventory-turnover',
        type: 'inventory',
        title: 'Slow Inventory Turnover',
        description: 'Your inventory turnover is low. Consider reducing stock levels or improving sales velocity.',
        value: inventoryTurnover,
        unit: 'x',
        trend: 'down',
        priority: 'medium',
        actionable: true,
        actionText: 'Optimize Inventory',
        actionUrl: '/inventory'
      });
    }

    return insights;
  }

  /**
   * Generate performance-based insights
   */
  private static generatePerformanceInsights(data: ShopPerformanceData): ShopInsight[] {
    const insights: ShopInsight[] = [];

    // Average order value analysis
    if (data.averageOrderValue < 200) {
      insights.push({
        id: 'low-aov',
        type: 'performance',
        title: 'Low Average Order Value',
        description: `Your average order value is ₹${data.averageOrderValue}. Consider upselling or bundling strategies.`,
        value: data.averageOrderValue,
        unit: '₹',
        trend: 'down',
        priority: 'medium',
        actionable: true,
        actionText: 'Improve AOV',
        actionUrl: '/analytics'
      });
    } else if (data.averageOrderValue > 500) {
      insights.push({
        id: 'high-aov',
        type: 'performance',
        title: 'Excellent Average Order Value',
        description: `Great job! Your average order value of ₹${data.averageOrderValue} is above industry standards.`,
        value: data.averageOrderValue,
        unit: '₹',
        trend: 'up',
        priority: 'low',
        actionable: false
      });
    }

    // Top performer recognition
    if (data.topSellingFlavors.length > 0) {
      const topFlavor = data.topSellingFlavors[0];
      insights.push({
        id: 'top-performer',
        type: 'performance',
        title: 'Top Performing Flavor',
        description: `${topFlavor.flavorName} is your best seller with ₹${topFlavor.totalRevenue.toLocaleString()} in revenue.`,
        value: topFlavor.totalRevenue,
        unit: '₹',
        trend: 'up',
        priority: 'low',
        actionable: false
      });
    }

    return insights;
  }

  /**
   * Generate area-based insights
   */
  private static generateAreaBasedInsights(areaAnalytics: AreaAnalytics): ShopInsight[] {
    const insights: ShopInsight[] = [];

    // Market opportunity
    if (areaAnalytics.totalShops < 5) {
      insights.push({
        id: 'market-opportunity',
        type: 'recommendation',
        title: 'Market Opportunity',
        description: `Only ${areaAnalytics.totalShops} shops in your area. Great opportunity to capture market share.`,
        value: areaAnalytics.totalShops,
        unit: 'shops',
        trend: 'stable',
        priority: 'medium',
        actionable: true,
        actionText: 'Expand Marketing',
        actionUrl: '/marketing'
      });
    }

    // Popular flavors in area
    if (areaAnalytics.topFlavors.length > 0) {
      const topAreaFlavor = areaAnalytics.topFlavors[0];
      insights.push({
        id: 'area-popular-flavor',
        type: 'recommendation',
        title: 'Popular in Your Area',
        description: `${topAreaFlavor.flavorName} is performing well in your area. Consider stocking more.`,
        value: topAreaFlavor.totalRevenue,
        unit: '₹',
        trend: 'up',
        priority: 'medium',
        actionable: true,
        actionText: 'Stock More',
        actionUrl: '/inventory/restock'
      });
    }

    return insights;
  }

  /**
   * Generate flavor recommendations
   */
  private static generateFlavorRecommendations(data: ShopPerformanceData): ShopRecommendation[] {
    const recommendations: ShopRecommendation[] = [];

    // If area analytics available, recommend popular flavors
    if (data.areaAnalytics) {
      const topAreaFlavors = data.areaAnalytics.topFlavors.slice(0, 3);
      const currentFlavors = data.topSellingFlavors.map(f => f.flavorName);
      
      topAreaFlavors.forEach(flavor => {
        if (!currentFlavors.includes(flavor.flavorName)) {
          recommendations.push({
            id: `flavor-${flavor.flavorId}`,
            type: 'flavor',
            title: `Add ${flavor.flavorName}`,
            description: `${flavor.flavorName} is popular in your area with ₹${flavor.totalRevenue.toLocaleString()} in sales.`,
            impact: 'medium',
            effort: 'low',
            estimatedBenefit: `Potential revenue increase of ₹${Math.floor(flavor.totalRevenue * 0.3).toLocaleString()}`,
            actionSteps: [
              'Check current inventory levels',
              'Place restock request for this flavor',
              'Monitor sales performance',
              'Adjust stock levels based on demand'
            ]
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate inventory recommendations
   */
  private static generateInventoryRecommendations(data: ShopPerformanceData): ShopRecommendation[] {
    const recommendations: ShopRecommendation[] = [];

    // Stock optimization
    if (data.lowStockItems.length > 0) {
      recommendations.push({
        id: 'stock-optimization',
        type: 'inventory',
        title: 'Optimize Stock Levels',
        description: 'Several items are running low. Implement a more proactive restocking strategy.',
        impact: 'high',
        effort: 'medium',
        estimatedBenefit: 'Reduce stockouts and improve customer satisfaction',
        actionSteps: [
          'Set up automatic low stock alerts',
          'Implement safety stock levels',
          'Create regular restock schedule',
          'Monitor sales patterns for better forecasting'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate pricing recommendations
   */
  private static generatePricingRecommendations(data: ShopPerformanceData): ShopRecommendation[] {
    const recommendations: ShopRecommendation[] = [];

    const profitMargin = (data.totalProfit / data.totalRevenue) * 100;
    
    if (profitMargin < 20) {
      recommendations.push({
        id: 'pricing-optimization',
        type: 'pricing',
        title: 'Optimize Pricing Strategy',
        description: 'Your profit margin is below industry standards. Consider reviewing your pricing.',
        impact: 'high',
        effort: 'medium',
        estimatedBenefit: `Potential profit increase of ₹${Math.floor(data.totalProfit * 0.2).toLocaleString()}`,
        actionSteps: [
          'Analyze competitor pricing',
          'Review cost structure',
          'Test price increases on slow-moving items',
          'Implement dynamic pricing for popular items'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate marketing recommendations
   */
  private static generateMarketingRecommendations(data: ShopPerformanceData): ShopRecommendation[] {
    const recommendations: ShopRecommendation[] = [];

    if (data.averageOrderValue < 300) {
      recommendations.push({
        id: 'upselling-strategy',
        type: 'marketing',
        title: 'Implement Upselling Strategy',
        description: 'Your average order value is below potential. Focus on upselling techniques.',
        impact: 'medium',
        effort: 'low',
        estimatedBenefit: `Potential revenue increase of ₹${Math.floor(data.totalRevenue * 0.15).toLocaleString()}`,
        actionSteps: [
          'Train staff on upselling techniques',
          'Create combo offers and bundles',
          'Display premium items prominently',
          'Implement loyalty program'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate operational recommendations
   */
  private static generateOperationalRecommendations(data: ShopPerformanceData): ShopRecommendation[] {
    const recommendations: ShopRecommendation[] = [];

    // Cash flow management
    if (data.pendingPayments > data.totalRevenue * 0.1) {
      recommendations.push({
        id: 'cash-flow-management',
        type: 'operational',
        title: 'Improve Cash Flow Management',
        description: 'High pending payments are affecting cash flow. Implement better payment tracking.',
        impact: 'high',
        effort: 'low',
        estimatedBenefit: 'Improved cash flow and reduced financial stress',
        actionSteps: [
          'Set up payment reminders',
          'Implement payment tracking system',
          'Offer early payment discounts',
          'Review credit terms with customers'
        ]
      });
    }

    return recommendations;
  }
}

export default ShopInsightsService;
