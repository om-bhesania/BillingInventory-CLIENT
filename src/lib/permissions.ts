type Permission = {
  resource: string;
  action: string;
};

type User = {
  id: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
};

/**
 * Check if a user has the required permissions for given roles
 */
export const checkPermissions = (user: User, allowedRoles: string[]): boolean => {
  if (!user || !user.permissions) {
    return false;
  }

  // Role-based permissions mapping
  const rolePermissions: Record<string, string[]> = {
    'Admin': ['*:*'], // Admin has all permissions
    'Shop Owner': [
      'inventory:read',
      'inventory:write',
      'invoice:read',
      'invoice:write',
      'shop:read'
    ],
  };

  // Get required permissions for the allowed roles
  const requiredPermissions = allowedRoles.flatMap(role => rolePermissions[role] || []);

  // If no specific permissions are required, just check the role
  if (requiredPermissions.length === 0) {
    return allowedRoles.includes(user.role);
  }

  // Check if user has all required permissions
  return requiredPermissions.every(permission => {
    if (permission === '*:*') {
      return user.role === 'Admin';
    }
    return user.permissions[permission];
  });
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user: User, resource: string, action: string): boolean => {
  if (!user || !user.permissions) {
    return false;
  }

  // Admin has all permissions
  if (user.role === 'Admin') {
    return true;
  }

  return user.permissions[`${resource}:${action}`] || false;
};
