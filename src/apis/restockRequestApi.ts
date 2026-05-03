import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface RestockRequest {
  id: string;
  shopId: string;
  productId: string;
  requestedAmount: number;
  status: "waiting_for_approval" | "approved_pending" | "fulfilled" | "rejected" | "pending" | "approved";
  requestType?: "RESTOCK" | "INVENTORY_ADD";
  notes?: string;
  paymentMethod?: "upfront" | "credit";
  paymentStatus?: "pending" | "paid" | "verified" | "rejected" | "pending_verification";
  receiptPath?: string;
  totalAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  finalAmount?: number;
  approvedAt?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
  submissionBatchId?: string | null;
  shop?: {
    id: string;
    name: string;
    managerId?: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    category: {
      id: string;
      name: string;
    };
    flavor: {
      id: string;
      name: string;
    };
  };
}

export interface CreateRestockRequestRequest {
  shopId: string;
  productId: string;
  requestedAmount: number;
  notes?: string;
  requestType?: "RESTOCK" | "INVENTORY_ADD";
  /** Same value on each line when submitting multiple products in one action */
  submissionBatchId?: string;
  paymentMethod?: "upfront" | "credit";
  discountCode?: string;
  totalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
}

export interface RejectRestockRequestRequest {
  notes?: string;
}

// Create restock request
export const createRestockRequest = async (
  data: CreateRestockRequestRequest
): Promise<RestockRequest> => {
  const response = await service<RestockRequest>({
    url: API_URL.restockRequest.create,
    method: "POST",
    data,
  });
  return response;
};

export const getAllRestockRequests = async (): Promise<RestockRequest[]> => {
  const response = await service<RestockRequest[]>({
    url: API_URL.restockRequest.getAll,
    method: "GET",
  });
  return response;
};

// Get restock requests by shop ID
export const getRestockRequests = async (
  shopId: string
): Promise<RestockRequest[]> => {
  const response = await service<RestockRequest[]>({
    url: API_URL.restockRequest.getByShopId(shopId),
    method: "GET",
  });
  return response;
};

// Approve restock request
export const approveRestockRequest = async (
  id: string
): Promise<RestockRequest> => {
  const response = await service<RestockRequest>({
    url: API_URL.restockRequest.approve(id),
    method: "PATCH",
  });
  return response;
};

// Reject restock request
export const rejectRestockRequest = async (
  id: string,
  data: RejectRestockRequestRequest
): Promise<RestockRequest> => {
  const response = await service<RestockRequest>({
    url: API_URL.restockRequest.reject(id),
    method: "PATCH",
    data,
  });
  return response;
};
