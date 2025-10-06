import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface ShopInventoryItem {
  id: string;
  shopId: string;
  productId: string;
  currentStock: number;
  minStockPerItem?: number;
  lowStockAlertsEnabled?: boolean;
  lastRestockDate?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    minStockLevel?: number;
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

export interface CreateShopInventoryRequest {
  shopId: string;
  productId: string;
  currentStock?: number;
  minStockPerItem?: number;
  lowStockAlertsEnabled?: boolean;
}

export interface BulkCreateShopInventoryRequestItem {
  productId: string;
  currentStock?: number;
  minStockPerItem?: number;
  lowStockAlertsEnabled?: boolean;
}

export interface BulkCreateShopInventoryRequest {
  shopId: string;
  items: BulkCreateShopInventoryRequestItem[];
}

export interface UpdateStockRequest {
  currentStock: number;
}

// Create shop inventory entry
export const createShopInventory = async (data: CreateShopInventoryRequest): Promise<ShopInventoryItem> => {
  const response = await service({
    url: API_URL.shopInventory.create,
    method: "POST",
    data,
  });
  // @ts-ignore
  return response;
};

export const bulkCreateShopInventory = async (data: BulkCreateShopInventoryRequest): Promise<{ createdCount: number; items: ShopInventoryItem[] }> => {
  const response = await service({
    url: API_URL.shopInventory.create,
    method: "POST",
    data,
  });
  // @ts-ignore
  return response;
};

// Get shop inventory by shop ID
export const getShopInventory = async (shopId: string): Promise<ShopInventoryItem[]> => {
  const response = await service({
    url: API_URL.shopInventory.getByShopId(shopId),
    method: "GET",
  });
  // @ts-ignore
  return response;
};

// Get single shop inventory item by ID
export const getShopInventoryItem = async (id: string): Promise<ShopInventoryItem> => {
  const response = await service({
    url: API_URL.shopInventory.getById(id),
    method: "GET",
  });
  // @ts-ignore
  return response;
};

// Update shop inventory stock
export const updateShopInventoryStock = async (id: string, data: UpdateStockRequest): Promise<ShopInventoryItem> => {
  const response = await service({
    url: API_URL.shopInventory.updateStock(id),
    method: "PATCH",
    data,
  });
  // @ts-ignore
  return response;
};

// Remove product from shop (soft delete)
export const removeProductFromShop = async (id: string): Promise<{ message: string }> => {
  const response = await service({
    url: API_URL.shopInventory.remove(id),
    method: "DELETE",
  });
  // @ts-ignore
  return response;
};
