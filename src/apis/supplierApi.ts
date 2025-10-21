import { service } from "@/services/service";

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  materials?: RawMaterial[];
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  isPerishable: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contact: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contact?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

// Create supplier
export const createSupplier = async (data: CreateSupplierRequest): Promise<Supplier> => {
  const response = await service<Supplier>({
    url: "/suppliers",
    method: "POST",
    data,
  });
  return response;
};

// Get all suppliers
export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await service<Supplier[]>({
    url: "/suppliers",
    method: "GET",
  });
  return response;
};

// Get supplier by ID
export const getSupplierById = async (id: string): Promise<Supplier> => {
  const response = await service<Supplier>({
    url: `/suppliers/${id}`,
    method: "GET",
  });
  return response;
};

// Update supplier
export const updateSupplier = async (
  id: string,
  data: UpdateSupplierRequest
): Promise<Supplier> => {
  const response = await service<Supplier>({
    url: `/suppliers/${id}`,
    method: "PUT",
    data,
  });
  return response;
};

// Delete supplier
export const deleteSupplier = async (id: string): Promise<{ message: string }> => {
  const response = await service<{ message: string }>({
    url: `/suppliers/${id}`,
    method: "DELETE",
  });
  return response;
};
