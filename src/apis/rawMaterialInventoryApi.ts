import { service } from "@/services/service";

export interface RawMaterialInventory {
  id: string;
  shopId?: string;
  materialId: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  batchNumber?: string;
  expiryDate?: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  material?: RawMaterial;
  shop?: Shop;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  isPerishable: boolean;
  category?: RawMaterialCategory;
  supplier?: Supplier;
}

export interface RawMaterialCategory {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name: string;
}

export interface CreateRawMaterialInventoryRequest {
  shopId?: string;
  materialId: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface UpdateRawMaterialInventoryRequest {
  currentStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface GetRawMaterialInventoriesParams {
  shopId?: string;
  materialId?: string;
  lowStock?: boolean;
}

// Create raw material inventory
export const createRawMaterialInventory = async (data: CreateRawMaterialInventoryRequest): Promise<RawMaterialInventory> => {
  const response = await service<RawMaterialInventory>({
    url: "/raw-material-inventory",
    method: "POST",
    data,
  });
  return response;
};

// Get all raw material inventories
export const getRawMaterialInventories = async (params?: GetRawMaterialInventoriesParams): Promise<RawMaterialInventory[]> => {
  const queryParams = new URLSearchParams();
  if (params?.shopId) queryParams.append('shopId', params.shopId);
  if (params?.materialId) queryParams.append('materialId', params.materialId);
  if (params?.lowStock !== undefined) queryParams.append('lowStock', params.lowStock.toString());

  const url = queryParams.toString() ? `/raw-material-inventory?${queryParams.toString()}` : "/raw-material-inventory";
  
  const response = await service<RawMaterialInventory[]>({
    url,
    method: "GET",
  });
  return response;
};

// Update raw material inventory
export const updateRawMaterialInventory = async (
  id: string,
  data: UpdateRawMaterialInventoryRequest
): Promise<RawMaterialInventory> => {
  const response = await service<RawMaterialInventory>({
    url: `/raw-material-inventory/${id}`,
    method: "PUT",
    data,
  });
  return response;
};

// Delete raw material inventory
export const deleteRawMaterialInventory = async (id: string): Promise<{ message: string }> => {
  const response = await service<{ message: string }>({
    url: `/raw-material-inventory/${id}`,
    method: "DELETE",
  });
  return response;
};
