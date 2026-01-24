import { service } from "@/services/service";

// Raw Material Inventory
export const getRawMaterialInventories = async () => {
    const response = await service({
        url: "/raw-material-inventory",
        method: "get",
    });
    return response;
};

export const getLowStockItems = async () => {
    const response = await service({
        url: "/raw-material-inventory/low-stock",
        method: "get",
    });
    return response;
};

export const getRawMaterialInventoryById = async (id: string) => {
    const response = await service({
        url: `/raw-material-inventory/${id}`,
        method: "get",
    });
    return response;
};

export const initializeInventory = async (data: any) => {
    const response = await service({
        url: "/raw-material-inventory",
        method: "post",
        data: data,
    });
    return response;
};

export const updateRawMaterialInventory = async (id: string, data: any) => {
    const response = await service({
        url: `/raw-material-inventory/${id}`,
        method: "put",
        data: data,
    });
    return response;
};

