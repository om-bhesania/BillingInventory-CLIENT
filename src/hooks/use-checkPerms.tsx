import { useFetchRolesAndPerms } from "@/lib/perms";
import { useMemo } from "react";

/**
 * Custom hook to check user permissions for a specific module
 * @param {string} module - The module name to check permissions for
 * @param {string|string[]} permissions - Single permission or array of permissions to check
 * @param {object} options - Configuration options
 * @param {boolean} options.requireAll - If true, ALL permissions must be present. If false, ANY permission is sufficient (default: false)
 * @returns {boolean} - True if user has required permissions, false otherwise
 */
const usePermissions = (module, permissions, options:any = {}) => {
  const { requireAll = false } = options;
  const response = useFetchRolesAndPerms();

  const hasPermission = useMemo(() => {
    // Return false if data is still loading or if there's an error
    if (!response?.data || response.loading || response.error) {
      return false;
    }

    // Ensure permissions is always an array for consistent processing
    const permissionsArray = Array.isArray(permissions)
      ? permissions
      : [permissions];

    // If no permissions specified, return true
    if (permissionsArray.length === 0) {
      return true;
    }

    // Find the module in the response data
    const moduleData = response.data.find((item) => item.module === module);

    // If module not found, user doesn't have access
    if (!moduleData || !moduleData.permissions) {
      return false;
    }

    const userPermissions = moduleData.permissions;

    if (requireAll) {
      // ALL permissions must be present
      return permissionsArray.every((permission) =>
        userPermissions.includes(permission)
      );
    } else {
      // ANY permission is sufficient
      return permissionsArray.some((permission) =>
        userPermissions.includes(permission)
      );
    }
  }, [response, module, permissions, requireAll]);

  return hasPermission;
};

export default usePermissions;

// Usage Examples:

// Check for single permission
// const canRead = usePermissions('users', 'read');

// Check if user has ANY of multiple permissions
// const canModify = usePermissions('users', ['create', 'update', 'delete']);

// Check if user has ALL specified permissions
// const canFullAccess = usePermissions('users', ['read', 'create', 'update', 'delete'], { requireAll: true });

// Usage in component:
/*
function UserManagement() {
  const canRead = usePermissions('users', 'read');
  const canCreate = usePermissions('users', 'create');
  const canModify = usePermissions('users', ['update', 'delete']);
  const canFullAccess = usePermissions('users', ['read', 'create', 'update', 'delete'], { requireAll: true });

  if (!canRead) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>User Management</h1>
      {canCreate && <button>Create User</button>}
      {canModify && <button>Edit User</button>}
      {canFullAccess && <button>Admin Panel</button>}
    </div>
  );
}
*/
