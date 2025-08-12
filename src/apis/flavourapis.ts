// Flavour

import { service } from "@/services/service";

export const addFlavours = async (data: any) => {
    const response = await service({
        url: "/flavours",
        method: "post",
        data: data,
    });
    return response;
};

export const getFlavours = async () => {
    const response = await service({
        url: "/flavours",
        method: "get",
    });
    return response;
};