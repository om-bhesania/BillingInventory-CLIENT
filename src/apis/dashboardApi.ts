import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";
import { DateRange } from "@/components/ui/DateRangePicker";

export interface DashboardMetrics {
  role: 'Admin' | 'Shop_Owner';
  metrics: {
    // Admin metrics
    totalRevenue?: {
      total: number;
      count: number;
      growth: number;
      previousPeriod: number;
    };
    // New revenue metrics
    realRevenue?: {
      totalRevenue: number;
      totalProfit: number;
      totalBills: number;
      revenueByShop: Record<string, number>;
      lastUpdated: string;
    };
    totalItemsWorth?: {
      totalItemsWorth: number;
      totalRequests: number;
      itemsWorthByShop: Record<string, number>;
      lastUpdated: string;
    };
    totalShops?: {
      total: number;
      growth: number;
      previousPeriod: number;
    };
    totalProducts?: {
      total: number;
      previousPeriod: number;
    };
    totalCategories?: {
      total: number;
      previousPeriod: number;
    };
    pendingRestockRequests?: {
      count: number;
      requests: any[];
      previousPeriod: number;
    };
    shopPerformance?: Array<{
      id: string;
      name: string;
      totalRevenue: number;
      orderCount: number;
      previousRevenue: number;
      revenueGrowth: number;
    }>;
    systemNotifications?: {
      count: number;
      notifications: any[];
      previousPeriod: number;
    };
    // Shop Owner metrics
    shopRevenue?: {
      total: number;
      count: number;
      growth: number;
      previousPeriod: number;
    };
    topSellingProducts?: Array<{
      productId: string;
      quantity: number;
      product: any;
      previousQuantity: number;
      growth: number;
    }>;
    currentStockLevels?: {
      totalItems: number;
      lowStockItems: any[];
      lowStockCount: number;
      previousPeriod: number;
    };
    shopNotifications?: {
      count: number;
      notifications: any[];
      previousPeriod: number;
    };
    // Common new metrics
    bestCategory?: { 
      name: string; 
      quantity: number;
      previousQuantity: number;
      growth: number;
    } | null;
    bestFlavor?: { 
      name: string; 
      quantity: number;
      previousQuantity: number;
      growth: number;
    } | null;
    categoryBreakdown?: Array<{ 
      category: string; 
      quantity: number;
      previousQuantity: number;
      growth: number;
    }>;
    flavorBreakdown?: Array<{ 
      flavor: string; 
      quantity: number;
      previousQuantity: number;
      growth: number;
    }>;
    salesTrend?: Array<{ 
      date: string; 
      total: number;
      orders?: number;
      averageOrder?: number;
    }>;
    // Shop Owner specific metrics
    restockExpenses?: {
      total: number;
      count: number;
      previousPeriod: number;
      growth: number;
    };
    // Enhanced chart data
    chartData?: {
      // Time series data for trends
      dailySales?: Array<{
        date: string;
        revenue: number;
        orders: number;
        averageOrderValue: number;
      }>;
      weeklySales?: Array<{
        week: string;
        revenue: number;
        orders: number;
        averageOrderValue: number;
      }>;
      monthlySales?: Array<{
        month: string;
        revenue: number;
        orders: number;
        averageOrderValue: number;
      }>;
      // Product performance data
      productPerformance?: Array<{
        productId: string;
        name: string;
        category: string;
        flavor: string;
        quantity: number;
        revenue: number;
        previousQuantity: number;
        previousRevenue: number;
        growth: number;
        revenueGrowth: number;
      }>;
      // Inventory analytics
      inventoryAnalytics?: {
        totalProducts: number;
        lowStockProducts: number;
        outOfStockProducts: number;
        overstockedProducts: number;
        stockTurnoverRate: number;
        averageStockLevel: number;
      };
      // Customer analytics
      customerAnalytics?: {
        totalCustomers: number;
        newCustomers: number;
        returningCustomers: number;
        averageCustomerValue: number;
        customerRetentionRate: number;
        topCustomers: Array<{
          customerId: string;
          name: string;
          totalSpent: number;
          orderCount: number;
          lastOrderDate: string;
        }>;
      };
      // Geographic data for location-based charts
      geographicData?: Array<{
        location: string;
        revenue: number;
        orders: number;
        customers: number;
      }>;
      // Seasonal trends
      seasonalTrends?: Array<{
        period: string;
        revenue: number;
        orders: number;
        averageOrderValue: number;
        seasonality: 'high' | 'medium' | 'low';
      }>;
    };
  };
}

export interface RecentActivity {
  type: 'billing' | 'restock' | 'inventory' | 'user';
  action: string;
  details: string;
  amount?: number;
  timestamp: string;
  shopName?: string;
  status?: string;
}

export interface DashboardResponse {
  role: 'Admin' | 'Shop_Owner';
  metrics: DashboardMetrics;
}

export interface ActivitiesResponse {
  activities: RecentActivity[];
}

// Get dashboard metrics based on user role with date filtering
export const getDashboardMetrics = async (dateRange?: DateRange): Promise<DashboardMetrics> => {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append('from', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append('to', dateRange.to.toISOString());
  }

  const response = await service<DashboardMetrics>({
    url: `${API_URL.dashboard.metrics}?${params.toString()}`,
    method: "GET",
  });
  return response;
};

// Get recent activities for dashboard with date filtering
export const getRecentActivities = async (dateRange?: DateRange): Promise<ActivitiesResponse> => {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append('from', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append('to', dateRange.to.toISOString());
  }

  const response = await service<ActivitiesResponse>({
    url: `${API_URL.dashboard.activities}?${params.toString()}`,
    method: "GET",
  });
  return response;
};

// Refresh dashboard data (with rate limiting - once every 5 minutes)
export const refreshDashboardData = async (dateRange?: DateRange): Promise<DashboardMetrics> => {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append('from', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append('to', dateRange.to.toISOString());
  }

  const response = await service<DashboardMetrics>({
    url: `${API_URL.dashboard.refresh}?${params.toString()}`,
    method: "POST",
  });
  return response;
};

// Get chart-specific data for analytics
export const getChartData = async (dateRange?: DateRange, chartType?: string): Promise<any> => {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append('from', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append('to', dateRange.to.toISOString());
  }
  if (chartType) {
    params.append('chartType', chartType);
  }

  const response = await service<any>({
    url: `${API_URL.dashboard.charts}?${params.toString()}`,
    method: "GET",
  });
  return response;
};

// Get enhanced analytics data
export const getEnhancedAnalytics = async (dateRange?: DateRange): Promise<any> => {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.append('from', dateRange.from.toISOString());
  }
  if (dateRange?.to) {
    params.append('to', dateRange.to.toISOString());
  }

  const response = await service<any>({
    url: `${API_URL.dashboard.enhanced}?${params.toString()}`,
    method: "GET",
  });
  return response;
};

// Get real-time chart updates
export const getRealTimeChartData = async (lastUpdate?: string): Promise<any> => {
  const params = new URLSearchParams();
  if (lastUpdate) {
    params.append('lastUpdate', lastUpdate);
  }

  const response = await service<any>({
    url: `${API_URL.dashboard.realtime}?${params.toString()}`,
    method: "GET",
  });
  return response;
};

// Get total revenue from all shop billings (real revenue)
export const getTotalRevenue = async (): Promise<{
  totalRevenue: number;
  totalProfit: number;
  totalBills: number;
  revenueByShop: Record<string, number>;
  lastUpdated: string;
}> => {
  const response = await service<any>({
    url: `${API_URL.base}/products/total-revenue`,
    method: "GET",
  });
  return response;
};

// Get total items worth from restock requests (inventory tracking)
export const getTotalItemsWorth = async (): Promise<{
  totalItemsWorth: number;
  totalRequests: number;
  itemsWorthByShop: Record<string, number>;
  lastUpdated: string;
}> => {
  const response = await service<any>({
    url: `${API_URL.base}/products/total-items-worth`,
    method: "GET",
  });
  return response;
};
