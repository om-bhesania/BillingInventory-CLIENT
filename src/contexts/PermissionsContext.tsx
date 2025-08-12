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
}

const PermissionContext = createContext<PermissionContextType | null>(null);

// Permission Provider Component
export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, roles } = useAuth();

  const userPermissions:any = useMemo(() => {
    if (!user || !roles) return [];
    const userRole = roles.find((role) => role.id === user?.roleId);
    return userRole?.permissions || [];
  }, [user, roles]);

  // Create a permission map for faster lookups
  const permissionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
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
    return permissionMap.get(module)?.has(action) || false;
  };

  const hasAnyPermission = (permissions: RoutePermission[]): boolean => {
    return permissions.some(({ module, action }) =>
      hasPermission(module, action)
    );
  };

  const hasAllPermissions = (permissions: RoutePermission[]): boolean => {
    return permissions.every(({ module, action }) =>
      hasPermission(module, action)
    );
  };

  const getModuleActions = (module: string): string[] => {
    return Array.from(permissionMap.get(module) || []);
  };

  const isModuleAccessible = (module: string): boolean => {
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
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();

  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
};

// Module Gate Component for module-level access
interface ModuleGateProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ModuleGate: React.FC<ModuleGateProps> = ({
  module,
  children,
  fallback = null,
}) => {
  const { hasModuleAccess } = usePermissions();

  return hasModuleAccess(module) ? <>{children}</> : <>{fallback}</>;
};
