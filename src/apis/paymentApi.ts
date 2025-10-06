import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface PaymentVerification {
  restockRequestId: string;
  verified: boolean;
  notes?: string;
}

export interface ReceiptUpload {
  restockRequestId: string;
  receiptFile: File;
}

export interface ShopFinancials {
  id: string;
  shopId: string;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingPayments: number;
  lastUpdated: string;
  shop: {
    name: string;
    address: string;
  };
}

export interface PaymentQueueItem {
  id: string;
  shopId: string;
  productId: string;
  requestedAmount: number;
  totalAmount: number;
  finalAmount: number;
  paymentStatus: string;
  receiptPath: string;
  createdAt: string;
  shop: {
    name: string;
    managerId: string;
  };
  product: {
    name: string;
    sku: string;
    unitPrice: number;
  };
}

export const paymentApi = {
  // Upload receipt for restock request
  uploadReceipt: async (data: ReceiptUpload): Promise<{ success: boolean; data: any }> => {
    const formData = new FormData();
    formData.append('receipt', data.receiptFile);
    
    const response = await service({
      url: `${API_URL.payments.uploadReceipt}/${data.restockRequestId}`,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Verify payment (admin only)
  verifyPayment: async (restockRequestId: string, data: PaymentVerification): Promise<{ success: boolean; data: any }> => {
    const response = await service({
      url: `${API_URL.payments.verifyPayment}/${restockRequestId}`,
      method: 'PATCH',
      data
    });
    return response;
  },

  // Get receipt file (admin only)
  getReceipt: async (filename: string): Promise<Blob> => {
    const response = await service({
      url: `${API_URL.payments.uploadReceipt}/${filename}`,
      method: 'GET',
      responseType: 'blob'
    });
    return response;
  },

  // Get payment verification queue (admin only)
  getPaymentQueue: async (): Promise<{ success: boolean; data: PaymentQueueItem[] }> => {
    const response = await service({
      url: `${API_URL.payments.getPaymentDetails}/queue`,
      method: 'GET'
    });
    return response;
  },

  // Get shop financials
  getShopFinancials: async (shopId: string): Promise<{ success: boolean; data: ShopFinancials }> => {
    const response = await service({
      url: `${API_URL.payments.getPaymentDetails}/financials/${shopId}`,
      method: 'GET'
    });
    return response;
  }
};

export default paymentApi;
