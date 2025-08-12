import { service } from "@/services/service";

// Categories
export const addCategories = async (data: any) => {
    const response = await service({
        url: "/categories",
        method: "post",
        data: data,
    });
    return response;
};
export const getCategories = async () => {
    const response = await service({
        url: "/categories",
        method: "get",
    });
    return response;
};
