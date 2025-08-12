import { useMemo } from "react";
import { Box, Package, Users, ShoppingCart, ClipboardList } from "lucide-react";
import usePermissions from "@/hooks/use-checkPerms";

// Define the navigation structure with required permissions
const navItems = [
  {
    title: "Dashboard",
    icon: Box,
    href: "/",
    module: "Home",
    requiredPermissions: ["Read"], // Dashboard typically needs Read access
  },
  {
    title: "Inventory",
    icon: Package,
    module: "Inventory",
    requiredPermissions: ["Read"], // Parent needs at least Read to be visible
    children: [
      {
        title: "View Inventory",
        href: "/inventory",
        icon: Package,
        module: "Inventory",
        requiredPermissions: ["Read"],
      },
      {
        title: "Add Inventory",
        href: "/inventory/add",
        icon: Package,
        module: "Inventory",
        requiredPermissions: ["Write", "Update", "Delete"],
      },
    ],
  },
  {
    title: "Employee Management",
    icon: Users,
    module: "Employee",
    requiredPermissions: ["Read"],
    children: [
      {
        title: "View Employees",
        href: "/employees",
        icon: Users,
        module: "Employee",
        requiredPermissions: ["Read"],
      },
      {
        title: "Add Employee",
        href: "/employees/add",
        icon: Users,
        module: "Employee",
        requiredPermissions: ["Write", "Update", "Delete"],
      },
    ],
  },
  {
    title: "Shop Management",
    icon: ShoppingCart,
    module: "Shop",
    requiredPermissions: ["Read"],
    children: [
      {
        title: "View Shops",
        href: "/shops",
        icon: ShoppingCart,
        module: "Shop",
        requiredPermissions: ["Read"],
      },
      {
        title: "Add Shop",
        href: "/shops/add",
        icon: ShoppingCart,
        module: "Shop",
        requiredPermissions: ["Write", "Update", "Delete"],
      },
    ],
  },
  {
    title: "Invoice Management",
    icon: ClipboardList,
    module: "Billing",
    requiredPermissions: ["Read"],
    children: [
      {
        title: "View Invoices",
        href: "/invoices",
        icon: ClipboardList,
        module: "Billing",
        requiredPermissions: ["Read"],
      },
      {
        title: "Write Invoice",
        href: "/invoices/add",
        icon: ClipboardList,
        module: "Billing",
        requiredPermissions: ["Write", "Update", "Delete"],
      },
    ],
  },
];

/**
 * Custom hook to filter navigation items based on user permissions
 * @returns {Array} Filtered navigation items that the user has access to
 */
const useFilteredNavItems = () => {
  // Get permissions for all modules at once for efficiency
  const hasHomeAccess = usePermissions("Home", ["Read"]);
  const hasInventoryAccess = usePermissions("Inventory", ["Read"]);
  const hasEmployeeAccess = usePermissions("Employee", ["Read"]);
  const hasShopAccess = usePermissions("Shop", ["Read"]);
  const hasBillingAccess = usePermissions("Billing", ["Read"]);

  // Write permission lookup for efficiency
  const modulePermissions = {
    Home: hasHomeAccess,
    Inventory: hasInventoryAccess,
    Employee: hasEmployeeAccess,
    Shop: hasShopAccess,
    Billing: hasBillingAccess,
  };

  const filteredNavItems = useMemo(() => {
    const filterNavItem = (item) => {
      // Check if user has required permissions for this item
      const hasPermission = usePermissions(
        item.module,
        item.requiredPermissions || ["Read"]
      );

      if (!hasPermission) {
        return null; // User doesn't have access to this item
      }

      // If item has children, filter them too
      if (item.children) {
        const filteredChildren = item.children
          .map(filterNavItem)
          .filter(Boolean); // Remove null items

        // Only show parent if it has accessible children or if it has its own href
        return filteredChildren.length > 0 || item.href
          ? { ...item, children: filteredChildren }
          : null;
      }

      return item;
    };

    return navItems.map(filterNavItem).filter(Boolean);
  }, [
    hasHomeAccess,
    hasInventoryAccess,
    hasEmployeeAccess,
    hasShopAccess,
    hasBillingAccess,
  ]); 
  return filteredNavItems;
};

/**
 * Alternative approach: Direct filtering function
 * Use this if you prefer a more explicit approach
 */
const FilteredPermissionsBasedNavItems = () => {
  const filteredItems = useMemo(() => {
    return navItems
      .filter((item) => {
        // Check parent permission
        const hasParentPermission = usePermissions(
          item.module,
          item.requiredPermissions || ["Read"]
        );

        if (!hasParentPermission) {
          return false;
        }

        // If has children, filter children based on permissions
        if (item.children) {
          const filteredChildren = item.children.filter((child) => {
            return usePermissions(
              child.module,
              child.requiredPermissions || ["Read"]
            );
          });

          // Only include parent if it has accessible children or its own href
          return filteredChildren.length > 0 || item.href;
        }

        return true;
      })
      .map((item) => {
        // Filter children if they exist
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((child) =>
              usePermissions(
                child.module,
                child.requiredPermissions || ["Read"]
              )
            ),
          };
        }
        return item;
      });
  }, []);

  return filteredItems;
};

// Usage in component:
const NavigationComponent = () => {
  const filteredNavItems = useFilteredNavItems();

  return (
    <nav>
      {filteredNavItems.map((item, index) => (
        <div key={index}>
          <div className="nav-item">
            <item.icon />
            <span>{item.title}</span>
          </div>
          {item.children && (
            <div className="nav-children">
              {item.children.map((child, childIndex) => (
                <div key={childIndex} className="nav-child">
                  <child.icon />
                  <span>{child.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export {
  useFilteredNavItems,
  FilteredPermissionsBasedNavItems,
  NavigationComponent,
};
