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
  premissions: any;
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
  const [loading, setLoading] = useState(true);
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
  const hasAnyRole = (roleNames: string[]) => {
    const hasAccess = user?.role ? roleNames.includes(user.role) : false;
    logger.auth.roleCheck(`${roleNames.join("|")}`, hasAccess);
    return hasAccess;
  };
  const getUserShopId = () => user?.ownedShop?.id || user?.managedShop?.id;

  // Fetch roles on app load
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesData: any = await fetchRoles();
        setRoles(rolesData);
        logger.data.success("roles", `Loaded ${rolesData.length} roles`);
      } catch (error) {
        logger.data.error("roles", error);
      }
    };

    loadRoles();
  }, []);

  // On app load, check token expiry and refresh if needed
  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("auth_token");
      const userData = sessionStorage.getItem("user_data");
      if (token && userData) {
        if (isTokenExpired(token)) {
          // Try to refresh
          try {
            const response = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              sessionStorage.setItem("auth_token", data.token);
              sessionStorage.setItem("user_data", JSON.stringify(data.user));
              setIsAuthenticated(true);
              setUser(data.user);
            } else {
              sessionStorage.removeItem("auth_token");
              sessionStorage.removeItem("user_data");
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch {
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("user_data");
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Proactive token expiry check on every route change (optional, for extra safety)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = sessionStorage.getItem("auth_token");
      if (token && isTokenExpired(token)) {
        // Try to refresh
        fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        })
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Refresh failed");
            }
          })
          .then((data) => {
            sessionStorage.setItem("auth_token", data.token);
            sessionStorage.setItem("user_data", JSON.stringify(data.user));
            setIsAuthenticated(true);
            setUser(data.user);
          })
          .catch(() => {
            sessionStorage.removeItem("auth_token");
            sessionStorage.removeItem("user_data");
            setIsAuthenticated(false);
            setUser(null);
            navigate("/login");
          });
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [navigate]);

  // Listen for authentication failures from the service layer
  useEffect(() => {
    const handleAuthFailure = () => {
      logger.auth.tokenExpired(
        "Authentication failure detected, updating state..."
      );
      setIsAuthenticated(false);
      setUser(null);
      // Don't navigate automatically, let the component handle it
    };

    window.addEventListener("auth:token-expired", handleAuthFailure);
    return () =>
      window.removeEventListener("auth:token-expired", handleAuthFailure);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      logger.auth.login(`Attempting login for ${email}`);
      const response = await loginApi(email, password);
      const { token, user }: any = response;
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
      navigate("/");
    } catch (error) {
      logger.auth.login(`Login failed for ${email}`, error);
      throw error;
    }
  };

  const logout = async () => {
    try {
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
    navigate("/login");
  };

  if (loading) return null; // or a loading spinner

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
        hasAnyRole,
        getUserShopId,
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
