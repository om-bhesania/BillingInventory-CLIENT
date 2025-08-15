import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { loginApi } from "@/apis/auth";
import { logoutApi } from "@/apis/auth";
import {
  fetchRoles,
  Role,
  hasAnyRole,
  isAdmin as isAdminRole,
  isShopOwner as isShopOwnerRole,
} from "@/services/rolesService";
import { logger } from "@/utils/logger";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  roles: Role[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
  isShopOwner: () => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  getUserShopId: () => string | undefined;
  isLoading: boolean;
  isInitialized: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Dynamic role from backend
  roleId: string;
  contact?: string;
  ownedShop?: {
    id: string;
    name: string;
  };
  managedShop?: {
    id: string;
    name: string;
  };
  permissions: any; // Fixed typo: was "premissions"
}

interface LoginResponse {
  token: string;
  user: User;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Utility to check if JWT is expired
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
        Verifying authentication...
      </p>
    </div>
  </div>
);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  // Helper functions for role-based access
  const isAdmin = () => {
    const hasAccess = user?.role ? isAdminRole(user.role) : false;
    logger.auth.roleCheck("Admin", hasAccess);
    return hasAccess;
  };

  const isEmployee = () => {
    const hasAccess = user?.role ? isShopOwnerRole(user.role) : false; // Shop Owner is the employee role
    logger.auth.roleCheck("Shop Owner (Employee)", hasAccess);
    return hasAccess;
  };

  const isShopOwner = () => {
    const hasAccess = user?.role ? isShopOwnerRole(user.role) : false;
    logger.auth.roleCheck("Shop Owner", hasAccess);
    return hasAccess;
  };

  const hasRole = (roleName: string) => {
    const hasAccess = user?.role === roleName;
    logger.auth.roleCheck(roleName, hasAccess);
    return hasAccess;
  };

  const hasAnyRoleCheck = (roleNames: string[]) => {
    const hasAccess = user?.role ? roleNames.includes(user.role) : false;
    logger.auth.roleCheck(`${roleNames.join("|")}`, hasAccess);
    return hasAccess;
  };

  const getUserShopId = () => user?.ownedShop?.id || user?.managedShop?.id;
  const normalizeRoleName = (roleName: string): string => {
    // Convert spaces to underscores and handle common variations
    return roleName
      .trim()
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase(); // Make case-insensitive
  };
  // Comprehensive authentication verification
  const verifyUserAuthentication = async (userData: User, token: string) => {
    try {
      console.log("Verifying user data:", userData);
      console.log("Available roles:", roles);

      // Validate user has required properties
      if (!userData.id || !userData.role || !userData.email) {
        console.error("Missing required user properties:", {
          hasId: !!userData.id,
          hasRole: !!userData.role,
          hasEmail: !!userData.email,
        });
        throw new Error("Invalid user data structure");
      }

      // Enhanced role validation with normalization
      if (roles.length > 0) {
        const normalizedUserRole = normalizeRoleName(userData.role);
        const availableRoleNames = roles.map((role) =>
          normalizeRoleName(role.name)
        );

        console.log("Normalized user role:", normalizedUserRole);
        console.log("Available normalized roles:", availableRoleNames);

        const userHasValidRole =
          availableRoleNames.includes(normalizedUserRole);

        if (!userHasValidRole) {
          console.error(
            `Invalid user role: ${userData.role} (normalized: ${normalizedUserRole})`
          );
          console.error(
            "Available roles:",
            roles.map((r) => r.name)
          );
          throw new Error(`Invalid user role: ${userData.role}`);
        }

        console.log("Role validation passed for:", userData.role);
      }

      return true;
    } catch (error) {
      console.error("User verification failed:", error);
      return false;
    }
  };

  // Fetch roles on app load
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setIsLoading(true);
        const rolesData: any = await fetchRoles();
        setRoles(rolesData);
        logger.data.success("roles", `Loaded ${rolesData.length} roles`);
        return rolesData;
      } catch (error) {
        logger.data.error("roles", error);
        return [];
      }
    };

    loadRoles();
  }, []);

  // Enhanced authentication check on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        const token = sessionStorage.getItem("auth_token");
        const userData = sessionStorage.getItem("user_data");

        if (!token || !userData) {
          setIsAuthenticated(false);
          setUser(null);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Check token expiry
        if (isTokenExpired(token)) {
          try {
            const response = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });

            if (response.ok) {
              const refreshData = await response.json();
              sessionStorage.setItem("auth_token", refreshData.token);
              sessionStorage.setItem(
                "user_data",
                JSON.stringify(refreshData.user)
              );

              // Verify the refreshed user data
              const isValid = await verifyUserAuthentication(
                refreshData.user,
                refreshData.token
              );
              if (isValid) {
                setIsAuthenticated(true);
                setUser(refreshData.user);
              } else {
                throw new Error("Invalid refreshed user data");
              }
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("user_data");
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Token is valid, verify user data
          const parsedUserData = JSON.parse(userData);
          const isValid = await verifyUserAuthentication(parsedUserData, token);

          if (isValid) {
            setIsAuthenticated(true);
            setUser(parsedUserData);
          }
        }
      } catch (error) {
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user_data");
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    // Only initialize after roles are available or after a reasonable timeout
    if (roles.length > 0) {
      initializeAuth();
    } else {
      // Fallback timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        initializeAuth();
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [roles]);

  // Proactive token expiry check
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const token = sessionStorage.getItem("auth_token");
      if (token && isTokenExpired(token)) {
        try {
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem("auth_token", data.token);
            sessionStorage.setItem("user_data", JSON.stringify(data.user));

            const isValid = await verifyUserAuthentication(
              data.user,
              data.token
            );
            if (isValid) {
              setIsAuthenticated(true);
              setUser(data.user);
            } else {
              throw new Error("Invalid auto-refreshed user data");
            }
          } else {
            throw new Error("Auto-refresh failed");
          }
        } catch (error) {
          sessionStorage.removeItem("auth_token");
          sessionStorage.removeItem("user_data");
          setIsAuthenticated(false);
          setUser(null);
          navigate("/login");
        }
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  // Listen for authentication failures from the service layer
  useEffect(() => {
    const handleAuthFailure = () => {
      logger.auth.tokenExpired(
        "Authentication failure detected, updating state..."
      );
      setIsAuthenticated(false);
      setUser(null);
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user_data");
    };

    window.addEventListener("auth:token-expired", handleAuthFailure);
    return () =>
      window.removeEventListener("auth:token-expired", handleAuthFailure);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      logger.auth.login(`Attempting login for ${email}`);

      const response = await loginApi(email, password);
      console.log("Login API response:", response); // Add debugging

      const { token, user }: any = response;

      // Add validation for the response structure
      if (!token || !user) {
        throw new Error(
          "Invalid response from login API - missing token or user"
        );
      }

      // Verify user data before setting state
      const isValid = await verifyUserAuthentication(user, token);
      if (!isValid) {
        throw new Error("Invalid user data received from login");
      }

      sessionStorage.setItem("auth_token", token);
      sessionStorage.setItem("user_data", JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);

      logger.auth.login(`Login successful for ${user.name}`, {
        userId: user.id,
        role: user.role,
      });

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome back, ${user.name}!`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });

      // Small delay to ensure state is properly set before navigation
      setTimeout(() => {
        navigate("/");
        setIsLoading(false);
      }, 100);
    } catch (error) {
      setIsLoading(false);
      console.error("Login error details:", error); // Enhanced error logging
      logger.auth.login(`Login failed for ${email}`, error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      logger.auth.logout(`Logging out user ${user?.name || "Unknown"}`);
      await logoutApi(); // Call backend to clear refresh token cookie
    } catch (e) {
      // Ignore errors
    }

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user_data");
    setUser(null);
    setIsAuthenticated(false);

    logger.auth.logout("User logged out successfully");

    Swal.fire({
      icon: "success",
      title: "Logged out",
      text: "You have been successfully logged out.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    });

    setIsLoading(false);
    navigate("/login");
  };

  // Show loading spinner until fully initialized
  if (isLoading || !isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        roles,
        login,
        logout,
        isAdmin,
        isEmployee,
        isShopOwner,
        hasRole,
        hasAnyRole: hasAnyRoleCheck,
        getUserShopId,
        isLoading,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { useAuth, AuthProvider };
