import { service } from "@/services/service";

export interface RawMaterial {
  id: string;
  name: string;
  categoryId: string;
  supplierId: string;
  unit: string;
  unitPrice: number;
  isPerishable: boolean;
  shelfLife?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: RawMaterialCategory;
  supplier?: Supplier;
  inventories?: RawMaterialInventory[];
}

export interface RawMaterialCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
}

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
  shop?: Shop;
}

export interface Shop {
  id: string;
  name: string;
}

export interface CreateRawMaterialRequest {
  name: string;
  categoryId: string;
  supplierId: string;
  unit: string;
  unitPrice: number;
  isPerishable?: boolean;
  shelfLife?: number;
}

export interface UpdateRawMaterialRequest {
  name?: string;
  categoryId?: string;
  supplierId?: string;
  unit?: string;
  unitPrice?: number;
  isPerishable?: boolean;
  shelfLife?: number;
  isActive?: boolean;
}

export interface GetRawMaterialsParams {
  categoryId?: string;
  isPerishable?: boolean;
  shopId?: string;
}

// Create raw material
export const createRawMaterial = async (data: CreateRawMaterialRequest): Promise<RawMaterial> => {
  const response = await service<RawMaterial>({
    url: "/raw-materials",
    method: "POST",
    data,
  });
  return response;
};

// Get all raw materials
export const getRawMaterials = async (params?: GetRawMaterialsParams): Promise<RawMaterial[]> => {
  const queryParams = new URLSearchParams();
  if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params?.isPerishable !== undefined) queryParams.append('isPerishable', params.isPerishable.toString());
  if (params?.shopId) queryParams.append('shopId', params.shopId);

  const url = queryParams.toString() ? `/raw-materials?${queryParams.toString()}` : "/raw-materials";
  
  const response = await service<RawMaterial[]>({
    url,
    method: "GET",
  });
  return response;
};

// Get raw material by ID
export const getRawMaterialById = async (id: string): Promise<RawMaterial> => {
  const response = await service<RawMaterial>({
    url: `/raw-materials/${id}`,
    method: "GET",
  });
  return response;
};

// Update raw material
export const updateRawMaterial = async (
  id: string,
  data: UpdateRawMaterialRequest
): Promise<RawMaterial> => {
  const response = await service<RawMaterial>({
    url: `/raw-materials/${id}`,
    method: "PUT",
    data,
  });
  return response;
};

// Delete raw material
export const deleteRawMaterial = async (id: string): Promise<{ message: string }> => {
  const response = await service<{ message: string }>({
    url: `/raw-materials/${id}`,
    method: "DELETE",
  });
  return response;
};
