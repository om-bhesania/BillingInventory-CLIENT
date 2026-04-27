import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  costPrice?: number;
  minStockLevel?: number;
  totalStock?: number;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
  flavor: {
    id: string;
    name: string;
  };
}

export const addProduct = async (product: any): Promise<Product> => {
  const response = await service<Product>({
    url: API_URL.products.create,
    method: "POST",
    data: product,
  });
  return response;
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await service<Product[]>({
    url: API_URL.products.getAll,
    method: "GET",
  });
  return response;
};

export const getProductsById = async (id: string): Promise<Product> => {
  const response = await service<Product>({
    url: API_URL.products.getById(id),
    method: "GET",
  });
  return response;
};

export const editProduct = async (product: any, id: string): Promise<Product> => {
  const response = await service<Product>({
    url: API_URL.products.update(id),
    method: "PUT",
    data: product,
  });
  return response;
};

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await service<{ message: string }>({
    url: API_URL.products.delete(id),
    method: "DELETE",
  });
  return response;
};

