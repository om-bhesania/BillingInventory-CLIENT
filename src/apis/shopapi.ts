import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export const addShop = async (shop: any) => {
  const response = await service({
    url: API_URL.shop.add,
    method: "POST",
    data: shop,
  });
  return response;
};

export const getShop = async () => {
  const response = await service({
    url: API_URL.shop.getAll,
    method: "GET",
  });
  return response;
};

export const getShopById = async (id: string) => {
  const response = await service({
    url: API_URL.shop.byId(id),
    method: "GET",
  });
  return response;
};

export const updateShop = async (id: string, data: any) => {
  const response = await service({
    url: API_URL.shop.byId(id),
    method: "PUT",
    data,
  });
  return response;
};

export const deleteShop = async (id: string) => {
  const response = await service({
    url: API_URL.shop.byId(id),
    method: "DELETE",
  });
  return response;
};