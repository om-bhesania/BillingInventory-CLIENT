import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface LowStockItem {
  id: string;
  shopId?: string;
  shopName?: string;
  productId: string;
  productName: string;
  category: string;
  flavor: string;
  currentStock: number;
  minStockLevel: number;
  stockDeficit: number;
  lastRestockDate?: string;
  urgency: 'critical' | 'warning' | 'low';
}

export interface LowStockResponse {
  items: LowStockItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LowStockStats {
  totalLowStockItems: number;
  criticalStockItems: number;
  affectedShops?: number;
  urgencyLevels: {
    critical: number;
    warning: number;
  };
}

export interface LowStockStatsResponse {
  stats: LowStockStats;
}

export interface LowStockFilters {
  categories: string[];
  flavors: string[];
  shops?: Array<{ id: string; name: string }>;
}

export interface LowStockFiltersResponse {
  filters: LowStockFilters;
}

// Get low stock alerts with pagination and filters
export const getLowStockAlerts = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
  flavor?: string;
  shopId?: string;
}): Promise<LowStockResponse> => {
  const response = await service<LowStockResponse>({
    url: API_URL.lowStock.list,
    method: "GET",
    query: params,
  });
  return response;
};

// Get low stock statistics
export const getLowStockStats = async (): Promise<LowStockStatsResponse> => {
  const response = await service<LowStockStatsResponse>({
    url: API_URL.lowStock.stats,
    method: "GET",
  });
  return response;
};

// Get available filters for low stock alerts
export const getLowStockFilters = async (): Promise<LowStockFiltersResponse> => {
  const response = await service<LowStockFiltersResponse>({
    url: API_URL.lowStock.filters,
    method: "GET",
  });
  return response;
};
