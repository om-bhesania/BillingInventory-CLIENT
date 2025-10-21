import { service } from "@/services/service";

export interface RawMaterialCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRawMaterialCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateRawMaterialCategoryRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Create raw material category
export const createRawMaterialCategory = async (data: CreateRawMaterialCategoryRequest): Promise<RawMaterialCategory> => {
  const response = await service<RawMaterialCategory>({
    url: "/raw-material-categories",
    method: "POST",
    data,
  });
  return response;
};

// Get all raw material categories
export const getRawMaterialCategories = async (): Promise<RawMaterialCategory[]> => {
  const response = await service<RawMaterialCategory[]>({
    url: "/raw-material-categories",
    method: "GET",
  });
  return response;
};

// Get raw material category by ID
export const getRawMaterialCategoryById = async (id: string): Promise<RawMaterialCategory> => {
  const response = await service<RawMaterialCategory>({
    url: `/raw-material-categories/${id}`,
    method: "GET",
  });
  return response;
};

// Update raw material category
export const updateRawMaterialCategory = async (
  id: string,
  data: UpdateRawMaterialCategoryRequest
): Promise<RawMaterialCategory> => {
  const response = await service<RawMaterialCategory>({
    url: `/raw-material-categories/${id}`,
    method: "PUT",
    data,
  });
  return response;
};

// Delete raw material category
export const deleteRawMaterialCategory = async (id: string): Promise<{ message: string }> => {
  const response = await service<{ message: string }>({
    url: `/raw-material-categories/${id}`,
    method: "DELETE",
  });
  return response;
};
