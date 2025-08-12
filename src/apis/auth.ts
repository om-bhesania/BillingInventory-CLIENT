import { LoginResponse } from "@/pages/types";
import { service } from "@/services/service";

// Updated to explicitly console.log the URL being called for debugging
export const loginApi = async (email: string, password: string) => { 

  try {
    const response = await service<LoginResponse>({
      url: "/auth/login",
      method: "POST",
      data: { email, password },
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
};

export const logoutApi = async () => {
  try {
    await service({
      url: "/auth/logout",
      method: "POST",
    });
  } catch (error) {
    console.error("Logout API error:", error);
    throw error;
  }
};
// registerApi is not used in the codebase, so it is commented out
export const registerApi = async (data: any) => {
  try {
    const response = await service<LoginResponse>({
      url: "/auth/register",
      method: "POST",
      data: data,
    });

    console.log("Register API response received:", response);
    return response;
  } catch (error) {
    console.error("Register API error:", error);
    throw error;
  }
};
