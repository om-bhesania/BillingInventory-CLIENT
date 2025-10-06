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
import { refreshToken } from "@/apis/authApi";
import {
  fetchRoles,
  Role,
  hasAnyRole,
  isAdmin as isAdminRole,
  isShopOwner as isShopOwnerRole,
} from "@/services/rolesService";
import { logger } from "@/utils/logger";
import LoadingSpinner from "@/components/ui/Loader";

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
  getUserShopIds: () => string[];
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
  managedShops?: { id: string; name: string }[]; // New field for managed shops
  publicId: string; // New field for public ID
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

  const getUserShopId = () => {
    const managedShops = user?.managedShops || [];
    return managedShops.length > 0 ? managedShops[0].id : undefined;
  };

  const getUserShopIds = () => {
    return user?.managedShops?.map((shop) => shop.id) || [];
  };

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
      // Validate user has required properties
      if (!userData.id || !userData.role || !userData.email) {
        console.error("Missing required user properties:", {
          hasId: !!userData.id,
          hasRole: !!userData.role,
          hasEmail: !!userData.email,
        });
        throw new Error("Invalid user data structure");
      }

      // Enhanced role validation with normalization - BUT ONLY IF ROLES ARE LOADED
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
      } else {
        // If roles aren't loaded yet, skip validation - we'll validate later
        console.log("Roles not loaded yet, skipping role validation");
      }

      return true;
    } catch (error) {
      console.error("User verification failed:", error);
      return false;
    }
  };

  // Load roles - separate from auth initialization
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData: any = await fetchRoles();
        setRoles(rolesData);
        logger.data.success("roles", `Loaded ${rolesData.length} roles`);
      } catch (error) {
        logger.data.error("roles", error);
        setRoles([]); // Set empty array on error so we don't block forever
      }
    };

    loadRoles();
  }, []);

  // Initialize authentication - INDEPENDENT of roles loading
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing auth...");

        const token = sessionStorage.getItem("auth_token");
        const userData = sessionStorage.getItem("user_data");

        if (!token || !userData) {
          console.log("No token or user data found");
          setIsAuthenticated(false);
          setUser(null);
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Check token expiry
        if (isTokenExpired(token)) {
          console.log("Token expired, attempting refresh...");
          try {
            const refreshData = await refreshToken();
            sessionStorage.setItem("auth_token", refreshData.token);
            sessionStorage.setItem(
              "user_data",
              JSON.stringify(refreshData.user)
            );

            // Verify the refreshed user data (roles validation will be skipped if not loaded)
            const isValid = await verifyUserAuthentication(
              refreshData.user,
              refreshData.token
            );
            if (isValid) {
              console.log("Token refresh successful");
              setIsAuthenticated(true);
              setUser(refreshData.user);
            } else {
              throw new Error("Invalid refreshed user data");
            }
          } catch (refreshError) {
            console.log("Token refresh failed:", refreshError);
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("user_data");
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Token is valid, verify user data (roles validation will be skipped if not loaded)
          console.log("Token valid, verifying user data...");
          const parsedUserData = JSON.parse(userData);
          const isValid = await verifyUserAuthentication(parsedUserData, token);

          if (isValid) {
            console.log("User data verification successful");
            setIsAuthenticated(true);
            setUser(parsedUserData);
          } else {
            console.log("User data verification failed");
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("user_data");
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log("Auth initialization complete");
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Remove roles dependency

  // Proactive token expiry check
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const token = sessionStorage.getItem("auth_token");
      if (token && isTokenExpired(token)) {
        try {
          const data = await refreshToken();
          sessionStorage.setItem("auth_token", data.token);
          sessionStorage.setItem("user_data", JSON.stringify(data.user));

          const isValid = await verifyUserAuthentication(data.user, data.token);
          if (isValid) {
            setIsAuthenticated(true);
            setUser(data.user);
          } else {
            throw new Error("Invalid auto-refreshed user data");
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
    window.addEventListener("auth:invalid-token", handleAuthFailure);
    return () => {
      window.removeEventListener("auth:token-expired", handleAuthFailure);
      window.removeEventListener("auth:invalid-token", handleAuthFailure);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      logger.auth.login(`Attempting login for ${email}`);

      const response = await loginApi(email, password);
      console.log("Login API response:", response);

      const { token, user }: any = response;

      // Add validation for the response structure
      if (!token || !user) {
        throw new Error(
          "Invalid response from login API - missing token or user"
        );
      }

      // Verify user data before setting state (roles validation will be skipped if not loaded)
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
      console.error("Login error details:", error);
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

  // On invalid token, navigate to login with toast
  useEffect(() => {
    const onInvalid = () => {
      Swal.fire({
        icon: "error",
        title: "Session expired",
        text: "Invalid token. Please sign in again.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
      navigate("/login");
    };
    window.addEventListener("auth:invalid-token", onInvalid);
    return () => window.removeEventListener("auth:invalid-token", onInvalid);
  }, [navigate]);

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
        getUserShopIds,
        isLoading,
        isInitialized,
      }}
    >
      {/* Always render children so hooks can access context. Show overlay while initializing. */}
      {children}
      {(isLoading || !isInitialized) && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[9998]">
          <LoadingSpinner message="Verifying Authentication..." />
        </div>
      )}
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
