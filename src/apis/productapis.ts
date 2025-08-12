import { service } from "@/services/service";

export const addProduct = async (product: any) => {
  const response = await service({
    url: "/products/add-products",
    method: "POST",
    data: product,
  });
  return response;
};

export const getProducts = async () => {
  const response = await service({
    url: "/products/get-products",
    method: "get",
  });
  return response;
};


export const getProductsById = async (id: string) => {
  const response = await service({
    url: `/products/${id}`,
    method: "get",
  });
  return response;
};

export const editProduct = async (product: any, id: string) => {
  const response = await service({
    url: `/products/${id}`,
    method: "PUT",
    data: product,
  });
  return response;
};

export const deleteProduct = async (id: string) => {
  const response = await service({
    url: `/products/delete/${id}/permanent`,
    method: "DELETE",
  });
  return response;
};

