import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface StockAdjustmentRequest {
  id: string;
  shopId: string;
  productId: string;
  currentStock: number;
  adjustedStock: number;
  reason: string;
  customReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    managerId: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
}

export interface CreateStockAdjustmentRequest {
  shopId: string;
  productId: string;
  currentStock: number;
  adjustedStock: number;
  reason: string;
  customReason?: string;
  notes?: string;
}

export interface UpdateStockAdjustmentStatus {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface StockAdjustmentFilters {
  status?: 'pending' | 'approved' | 'rejected';
  shopId?: string;
}

export const stockAdjustmentApi = {
  // Create stock adjustment request
  createStockAdjustment: async (data: CreateStockAdjustmentRequest): Promise<{ success: boolean; data: StockAdjustmentRequest }> => {
    const response = await service({
      url: API_URL.stockAdjustments.create,
      method: 'POST',
      data
    });
    return response;
  },

  // Get stock adjustment requests
  getStockAdjustments: async (filters?: StockAdjustmentFilters): Promise<{ success: boolean; data: StockAdjustmentRequest[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.shopId) params.append('shopId', filters.shopId);
    
    const response = await service({
      url: `${API_URL.stockAdjustments.list}?${params.toString()}`,
      method: 'GET'
    });
    return response;
  },

  // Get stock adjustment details
  getStockAdjustmentDetails: async (adjustmentId: string): Promise<{ success: boolean; data: StockAdjustmentRequest }> => {
    const response = await service({
      url: `${API_URL.stockAdjustments.details}/${adjustmentId}`,
      method: 'GET'
    });
    return response;
  },

  // Update stock adjustment status (admin only)
  updateStockAdjustmentStatus: async (adjustmentId: string, data: UpdateStockAdjustmentStatus): Promise<{ success: boolean; data: StockAdjustmentRequest }> => {
    const response = await service({
      url: `${API_URL.stockAdjustments.updateStatus}/${adjustmentId}/status`,
      method: 'PATCH',
      data
    });
    return response;
  },

  // Get default adjustment reasons
  getDefaultReasons: async (): Promise<{ success: boolean; data: string[] }> => {
    const response = await service({
      url: API_URL.stockAdjustments.defaultReasons,
      method: 'GET'
    });
    return response;
  }
};

export default stockAdjustmentApi;
