import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface RestockRequest {
  id: string;
  shopId: string;
  productId: string;
  requestedAmount: number;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
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
}

export interface RejectRestockRequestRequest {
  notes?: string;
}

// Create restock request
export const createRestockRequest = async (data: CreateRestockRequestRequest): Promise<RestockRequest> => {
  const response = await service<RestockRequest>({
    url: API_URL.restockRequest.create,
    method: "POST",
    data,
  });
  return response;
};

// Get restock requests by shop ID
export const getRestockRequests = async (shopId: string): Promise<RestockRequest[]> => {
  const response = await service<RestockRequest[]>({
    url: API_URL.restockRequest.getByShopId(shopId),
    method: "GET",
  });
  return response;
};

// Approve restock request
export const approveRestockRequest = async (id: string): Promise<RestockRequest> => {
  const response = await service<RestockRequest>({
    url: API_URL.restockRequest.approve(id),
    method: "PATCH",
  });
  return response;
};

// Reject restock request
export const rejectRestockRequest = async (id: string, data: RejectRestockRequestRequest): Promise<RestockRequest> => {
  const response = await service<RestockRequest>({
    url: API_URL.restockRequest.reject(id),
    method: "PATCH",
    data,
  });
  return response;
};
