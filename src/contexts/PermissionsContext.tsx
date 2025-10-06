import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

// Types
interface Permission {
  module: string;
  actions: string[];
}

interface RoutePermission {
  module: string;
  action: string;
}

interface PermissionContextType {
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (permissions: RoutePermission[]) => boolean;
  hasAllPermissions: (permissions: RoutePermission[]) => boolean;
  getModuleActions: (module: string) => string[];
  isModuleAccessible: (module: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  userPermissions: Permission[];
  isLoading: boolean; // Added loading state
}

const PermissionContext = createContext<PermissionContextType | null>(null);

// Permission Provider Component
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, roles, isLoading: authLoading, isInitialized } = useAuth();

  // Check if we're still loading permissions data
  const isLoading = useMemo(() => {
    // If auth is still loading or not initialized, we're loading
    if (authLoading || !isInitialized) return true;

    // If we have a user but no roles data yet, we might still be loading roles
    // But don't wait forever - if auth is initialized, we can proceed
    if (user && roles.length === 0) {
      // Give it a bit of time but don't wait indefinitely
      // In practice, you might want to add a timestamp check here
      return false; // Changed to false to prevent infinite loading
    }

    // If we have a user with a roleId but can't find that role,
    // it might be a data issue rather than loading
    if (
      user &&
      roles.length > 0 &&
      !roles.find((role) => role.id === user.roleId)
    ) {
      console.warn(`User role ${user.roleId} not found in available roles`);
      // Don't block on this - it might be a data inconsistency
      return false;
    }

    return false;
  }, [authLoading, isInitialized, user, roles]);

const userPermissions: any = useMemo(() => {
  if (!isInitialized || authLoading || !user) return [];

  // ✅ Use permissions from the backend-provided user object first
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions;
  }

  // Fallback to role-based permissions
  if (roles.length > 0) {
    const userRole = roles.find((role) => role.id === user.roleId);
    return userRole?.permissions || [];
  }

  return [];
}, [user, roles, isInitialized, authLoading]);


  // Create a permission map for faster lookups
  const permissionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    if (userPermissions.length === 0) {
      return map; // Return empty map if no permissions
    }

    userPermissions.forEach((permission: Permission) => {
      if (!map.has(permission.module)) {
        map.set(permission.module, new Set());
      }
      permission.actions.forEach((action) => {
        map.get(permission.module)?.add(action);
      });
    });
    return map;
  }, [userPermissions]);

  const hasPermission = (module: string, action: string): boolean => {
    // Return false while loading to prevent unauthorized access
    if (isLoading) return false;

    // Also check if user is authenticated
    if (!user || !isInitialized) return false;

    // Special case for Dashboard - if user is authenticated, allow access
    if (module === "Dashboard" && action === "read") {
      console.log("Dashboard permission check - allowing access for authenticated user");
      return true;
    }

    return permissionMap.get(module)?.has(action) || false;
  };

  const hasAnyPermission = (permissions: RoutePermission[]): boolean => {
    // Return false while loading to prevent unauthorized access
    if (isLoading) return false;

    // Also check if user is authenticated
    if (!user || !isInitialized) return false;

    // Special case for Dashboard - if user is authenticated, allow access
    if (permissions.some(({ module, action }) => module === "Dashboard" && action === "read")) {
      console.log("Dashboard permission check in hasAnyPermission - allowing access for authenticated user");
      return true;
    }

    return permissions.some(({ module, action }) =>
      hasPermission(module, action)
    );
  };

  const hasAllPermissions = (permissions: RoutePermission[]): boolean => {
    // Return false while loading to prevent unauthorized access
    if (isLoading) return false;

    // Also check if user is authenticated
    if (!user || !isInitialized) return false;

    // Special case for Dashboard - if user is authenticated, allow access
    if (permissions.some(({ module, action }) => module === "Dashboard" && action === "read")) {
      console.log("Dashboard permission check in hasAllPermissions - allowing access for authenticated user");
      return true;
    }

    return permissions.every(({ module, action }) =>
      hasPermission(module, action)
    );
  };

  const getModuleActions = (module: string): string[] => {
    if (isLoading || !user || !isInitialized) return [];
    return Array.from(permissionMap.get(module) || []);
  };

  const isModuleAccessible = (module: string): boolean => {
    if (isLoading || !user || !isInitialized) return false;
    return (
      permissionMap.has(module) && (permissionMap.get(module)?.size || 0) > 0
    );
  };

  const hasModuleAccess = (module: string): boolean => {
    return isModuleAccessible(module);
  };

  const contextValue: PermissionContextType = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getModuleActions,
    isModuleAccessible,
    hasModuleAccess,
    userPermissions,
    isLoading, // Expose loading state
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permissions
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

// Permission Gate Component for conditional rendering
interface PermissionGateProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingFallback?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action,
  children,
  fallback = null,
  showLoadingFallback = false,
}) => {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading && showLoadingFallback) {
    return <>{fallback}</>;
  }

  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
};

// Module Gate Component for module-level access
interface ModuleGateProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoadingFallback?: boolean;
}

export const ModuleGate: React.FC<ModuleGateProps> = ({
  module,
  children,
  fallback = null,
  showLoadingFallback = false,
}) => {
  const { hasModuleAccess, isLoading } = usePermissions();

  if (isLoading && showLoadingFallback) {
    return <>{fallback}</>;
  }

  return hasModuleAccess(module) ? <>{children}</> : <>{fallback}</>;
};
