import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export const addRole = async (role: any) => {
  const response = await service({
    url: API_URL.role.add,
    method: "POST",
    data: role,
  });
  return response;
};

export const getRole = async () => {
  const response = await service({
    url: API_URL.role.getAll,
    method: "GET",
  });
  return response;
};

export const getEmployee = async () => {
  const response = await service({
    url: API_URL.employee.getAll,
    method: "GET",
  });
  return response;
};
