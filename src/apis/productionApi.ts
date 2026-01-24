import { service } from "@/services/service";

// Production Batches
export const createProductionBatch = async (data: any) => {
    const response = await service({
        url: "/production",
        method: "post",
        data: data,
    });
    return response;
};

export const getProductionBatches = async (params?: { 
    productId?: string; 
    startDate?: string; 
    endDate?: string 
}) => {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
        ? `/production?${queryParams.toString()}` 
        : "/production";
    
    const response = await service({
        url,
        method: "get",
    });
    return response;
};

export const getProductionBatchById = async (id: string) => {
    const response = await service({
        url: `/production/${id}`,
        method: "get",
    });
    return response;
};

export const getProductionsByProduct = async (productId: string) => {
    const response = await service({
        url: `/production/product/${productId}`,
        method: "get",
    });
    return response;
};

