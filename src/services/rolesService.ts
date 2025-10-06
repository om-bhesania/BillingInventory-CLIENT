import { API_URL } from "./apiuri";
import api, { service } from "./service";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  contact: string;
}

// Fetch all roles from the backend
export const fetchRoles = async () => {
  try {
    const response = await service({
      url: API_URL.role.getAll,
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

// Get role by name
export const getRoleByName = (
  roles: Role[],
  roleName: string
): Role | undefined => {
  return roles.find((role) => role.name === roleName);
};

// Check if user has a specific role
export const hasRole = (userRole: string, requiredRole: string): boolean => {
  return userRole === requiredRole;
};

// Check if user has any of the required roles
export const hasAnyRole = (
  userRole: string,
  requiredRoles: string[]
): boolean => {
  return requiredRoles.includes(userRole);
};

// Get all role names for easy access
export const getRoleNames = (roles: Role[]): string[] => {
  return roles.map((role) => role.name);
};

// Check if user has a specific permission
export const hasPermission = (
  userRole: string,
  permission: string,
  roles: Role[]
): boolean => {
  const role = roles.find((r) => r.name === userRole);
  return role ? role.permissions.includes(permission) : false;
};

// Check if user is admin
export const isAdmin = (userRole: string): boolean => {
  return userRole === "Admin" || userRole === "admin";
};

// Check if user is shop owner
export const isShopOwner = (userRole: string): boolean => {
  return userRole === "Shop_Owner" || userRole === "Shop Owner";
};
