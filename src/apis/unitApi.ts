import { service } from "@/services/service";

// Units
export const addUnits = async (data: any) => {
    const response = await service({
        url: "/units",
        method: "post",
        data: data,
    });
    return response;
};

export const getUnits = async () => {
    const response = await service({
        url: "/units",
        method: "get",
    });
    return response;
};

export const getUnitById = async (id: string) => {
    const response = await service({
        url: `/units/${id}`,
        method: "get",
    });
    return response;
};

export const updateUnit = async (id: string, data: any) => {
    const response = await service({
        url: `/units/${id}`,
        method: "put",
        data: data,
    });
    return response;
};

export const deleteUnit = async (id: string) => {
    const response = await service({
        url: `/units/${id}`,
        method: "delete",
    });
    return response;
};

