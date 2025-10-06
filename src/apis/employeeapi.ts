import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

// Role management
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

// Employee management
export const getEmployee = async () => {
  const response = await service({
    url: API_URL.employee.getAll,
    method: "GET",
  });
  return response;
};

export const getEmployeeById = async (id: string) => {
  const response = await service({
    url: `${API_URL.employee.getAll}/${id}`,
    method: "GET",
  });
  return response;
};

export const createEmployee = async (employeeData: any) => {
  const response = await service({
    url: API_URL.employee.getAll,
    method: "POST",
    data: employeeData,
  });
  return response;
};

export const updateEmployee = async (id: string, employeeData: any) => {
  const response = await service({
    url: `${API_URL.employee.getAll}/${id}`,
    method: "PUT",
    data: employeeData,
  });
  return response;
};

export const updateEmployeeStatus = async (id: string, isActive: boolean) => {
  const response = await service({
    url: `${API_URL.employee.getAll}/${id}/status`,
    method: "PATCH",
    data: { isActive },
  });
  return response;
};

export const deleteEmployee = async (id: string) => {
  const response = await service({
    url: `${API_URL.employee.getAll}/${id}`,
    method: "DELETE",
  });
  return response;
};

export const getEmployeeRoles = async () => {
  const response = await service({
    url: `${API_URL.employee.getAll}/roles`,
    method: "GET",
  });
  return response;
};

export const getAvailableShops = async () => {
  const response = await service({
    url: `${API_URL.employee.getAll}/shops`,
    method: "GET",
  });
  return response;
};
