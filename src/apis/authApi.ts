import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    publicId: string;
    managedShops?: { id: string; name: string }[];
    permissions: any[];
  };
}

export interface RefreshResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    publicId: string;
    managedShops?: { id: string; name: string }[];
    permissions: any[];
  };
}

// Login user
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await service<LoginResponse>({
    url: API_URL.auth.login,
    method: "POST",
    data,
  });
  return response;
};

// Refresh token
export const refreshToken = async (): Promise<RefreshResponse> => {
  const response = await service<RefreshResponse>({
    url: API_URL.auth.refresh,
    method: "POST",
  });
  return response;
};

// Logout user
export const logoutUser = async (): Promise<{ message: string }> => {
  const response = await service<{ message: string }>({
    url: API_URL.auth.logout,
    method: "POST",
  });
  return response;
};

// User permissions response interface
export interface UserPermsResponse {
  status: string;
  permissions: {
    module: string;
    actions: string[];
  }[];
  role: string;
}

// Get user permissions - called on page refresh to sync permissions
export const getUserPerms = async (): Promise<UserPermsResponse> => {
  const response = await service<UserPermsResponse>({
    url: API_URL.auth.userPerms,
    method: "GET",
  });
  return response;
};
