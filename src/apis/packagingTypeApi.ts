import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface PackagingType { id: string; name: string; isActive: boolean }

export const getPackagingTypes = async (): Promise<PackagingType[]> => {
  return service<PackagingType[]>({ url: API_URL.packagingTypes.list, method: "GET" });
};

export const addPackagingType = async (data: { name: string }): Promise<PackagingType> => {
  return service<PackagingType>({ url: API_URL.packagingTypes.create, method: "POST", data });
};

export const updatePackagingType = async (id: string, data: Partial<PackagingType>): Promise<PackagingType> => {
  return service<PackagingType>({ url: API_URL.packagingTypes.update(id), method: "PUT", data });
};

export const deletePackagingType = async (id: string): Promise<{ message: string }> => {
  return service<{ message: string }>({ url: API_URL.packagingTypes.delete(id), method: "DELETE" });
};


