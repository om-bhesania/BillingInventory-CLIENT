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
