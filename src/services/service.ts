import axios, { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import { logger } from "@/utils/logger";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ensure refresh cookie is sent
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.api.request(config.method?.toUpperCase() || 'GET', config.url || '', config.data);
    return config;
  },
  (error) => {
    logger.api.error('REQUEST', error.config?.url || '', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // logger.api.response(
    //   response.config.method?.toUpperCase() || 'GET',
    //   response.config.url || '',
    //   response.status,
    //   response.data
    // );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.message || "An error occurred";
    
    logger.api.error(
      originalRequest?.method?.toUpperCase() || 'GET',
      originalRequest?.url || '',
      error
    );
    
    // If 401 and not already trying to refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        logger.auth.tokenRefresh("Attempting to refresh token...");
        // Attempt to refresh the token
        const refreshResponse = await api.post("/auth/refresh", {});
        const { token, user } = refreshResponse.data;
        if (token) {
          logger.auth.tokenRefresh("Token refreshed successfully", { userId: user?.id });
          sessionStorage.setItem("auth_token", token);
          if (user) sessionStorage.setItem("user_data", JSON.stringify(user));
          // Update the Authorization header and retry the original request
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        logger.auth.tokenExpired("Token refresh failed");
        // If refresh fails, clear session but don't redirect automatically
        // Let the app handle the authentication failure
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user_data");
        
        // Dispatch a custom event to notify the app about auth failure
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
        
        return Promise.reject(refreshError);
      }
    }
    
    // Show error toast for non-401 errors or after refresh attempt
    if (error.response?.status !== 401) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
    
    return Promise.reject(error);
  }
);

interface ServiceConfig extends Omit<AxiosRequestConfig, "url" | "method"> {
  query?: Record<string, unknown>;
}

export const service = async <T>({
  url,
  method = "GET",
  query,
  ...config
}: {
  url: string;
  method?: string;
} & ServiceConfig): Promise<T> => {
  const response = await api({
    url,
    method,
    params: query,
    ...config,
  });
  return response.data;
};

export default api;
