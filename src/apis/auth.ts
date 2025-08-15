import { LoginResponse } from "@/pages/types";
import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

// Updated to explicitly console.log the URL being called for debugging
export const loginApi = async (email: string, password: string) => { 

  try {
    const response = await service<LoginResponse>({
      url: API_URL.auth.login,
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
      url: API_URL.auth.logout,
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
      url: API_URL.auth.register,
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
