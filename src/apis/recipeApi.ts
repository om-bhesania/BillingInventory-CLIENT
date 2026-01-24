import { service } from "@/services/service";

// Recipes
export const createRecipe = async (data: any) => {
    const response = await service({
        url: "/recipes",
        method: "post",
        data: data,
    });
    return response;
};

export const getRecipes = async (params?: { productId?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const url = queryParams.toString() 
        ? `/recipes?${queryParams.toString()}` 
        : "/recipes";
    
    const response = await service({
        url,
        method: "get",
    });
    return response;
};

export const getRecipesByProduct = async (productId: string) => {
    const response = await service({
        url: `/recipes/product/${productId}`,
        method: "get",
    });
    return response;
};

export const getRecipeById = async (id: string) => {
    const response = await service({
        url: `/recipes/${id}`,
        method: "get",
    });
    return response;
};

export const updateRecipe = async (id: string, data: any) => {
    const response = await service({
        url: `/recipes/${id}`,
        method: "put",
        data: data,
    });
    return response;
};

export const deleteRecipe = async (id: string) => {
    const response = await service({
        url: `/recipes/${id}`,
        method: "delete",
    });
    return response;
};

export const setDefaultRecipe = async (id: string) => {
    const response = await service({
        url: `/recipes/${id}/set-default`,
        method: "put",
    });
    return response;
};

