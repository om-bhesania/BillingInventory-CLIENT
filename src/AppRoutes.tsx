import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/ui/dashboard/layout";
import { useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import EmployeeForm from "./pages/employees/EmployeeForm";
import EmployeeList from "./pages/employees/EmployeeList";
import InventoryForm from "./pages/inventory/InventoryForm";
import InventoryList from "./pages/inventory/InventoryList";
import InvoiceForm from "./pages/invoices/InvoiceForm";
import InvoiceList from "./pages/invoices/InvoiceList";
import NotFound from "./pages/NotFound";
import ShopInventoryForm from "./pages/ShopInventory/ShopInventoryForm";
import ShopInventoryList from "./pages/ShopInventory/ShopInventoryList";
import ShopForm from "./pages/shops/ShopForm";
import ShopList from "./pages/shops/ShopList";
import UnauthorizedAccess from "./pages/UnauthorizedAccess";
import RestockManagement from "./pages/RestockManagement";
import Notifications from "./pages/Notifications";
import AuditLog from "./pages/AuditLog";
import LowStockAlerts from "./pages/LowStockAlerts";
import { usePermissions } from "./contexts/PermissionsContext";

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Types
interface RoutePermission {
  module: string;
  action: string;
}

interface RouteConfig {
  path: string;
  element: React.ReactElement;
  permissions: RoutePermission[];
  requireAll?: boolean; // Whether to require ALL permissions or ANY permission (default: false = ANY)
}

// Enhanced Role-Based Route Component
interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredPermissions: RoutePermission[];
  requireAll?: boolean; 
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredPermissions,
  requireAll = false,
}) => {
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const {
    hasAnyPermission,
    hasAllPermissions,
    isLoading: permissionsLoading,
    userPermissions,
  } = usePermissions();

  // Enhanced debugging
  console.log("=== RoleBasedRoute Debug Info ===");
  console.log("Required permissions:", requiredPermissions);
  console.log("Auth loading:", authLoading);
  console.log("Auth initialized:", isInitialized);
  console.log("Permissions loading:", permissionsLoading);
  console.log("User:", user);
  console.log("User permissions:", userPermissions);
  console.log("RequireAll:", requireAll);

  // Show loading while authentication or permissions are being fetched
  if (authLoading || permissionsLoading || !isInitialized) {
    console.log("Still loading - showing spinner");
    return <LoadingSpinner />;
  }

  // If auth is complete but no user, redirect to login
  if (!user) {
    console.log("No user found after auth loading complete - redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Test the permission functions
  const hasAccessAny = hasAnyPermission(requiredPermissions);
  const hasAccessAll = hasAllPermissions(requiredPermissions);
  const hasAccess = requireAll ? hasAccessAll : hasAccessAny;

  console.log("hasAnyPermission result:", hasAccessAny);
  console.log("hasAllPermissions result:", hasAccessAll);
  console.log("Final hasAccess:", hasAccess);
  console.log("=== End Debug Info ===");

  if (hasAccess) {
    return <>{children}</>;
  }

  return <UnauthorizedAccess />;
};

const AppRoutes: React.FC = () => {
  // Define routes with specific action requirements
  const routes: RouteConfig[] = [
    {
      path: "/",
      element: <Dashboard />,
      permissions: [{ module: "Dashboard", action: "read" }],
    },

    // Inventory Routes
    {
      path: "/inventory",
      element: <InventoryList />,
      permissions: [{ module: "Inventory", action: "read" }],
    },
    {
      path: "/inventory/add",
      element: <InventoryForm />,
      permissions: [{ module: "Inventory", action: "write" }],
    },
    {
      path: "/inventory/edit/:id",
      element: <InventoryForm />,
      permissions: [
        { module: "Inventory", action: "read" },
        { module: "Inventory", action: "update" },
      ],
      requireAll: true, // Need both read and update permissions
    },

    // Billing Routes
    {
      path: "/invoices",
      element: <InvoiceList />,
      permissions: [{ module: "Billing", action: "read" }],
    },
    {
      path: "/invoices/add",
      element: <InvoiceForm />,
      permissions: [{ module: "Billing", action: "write" }],
    },
    {
      path: "/invoices/edit/:id",
      element: <InvoiceForm />,
      permissions: [
        { module: "Billing", action: "read" },
        { module: "Billing", action: "update" },
      ],
      requireAll: true,
    },

    // Employee Routes
    {
      path: "/employees",
      element: <EmployeeList />,
      permissions: [{ module: "Employee", action: "read" }],
    },
    {
      path: "/employees/add",
      element: <EmployeeForm />,
      permissions: [{ module: "Employee", action: "write" }],
    },
    {
      path: "/employees/edit/:id",
      element: <EmployeeForm />,
      permissions: [
        { module: "Employee", action: "read" },
        { module: "Employee", action: "update" },
      ],
      requireAll: true,
    },

    // Shop Routes
    {
      path: "/shops",
      element: <ShopList />,
      permissions: [{ module: "Shop", action: "read" }],
    },
    {
      path: "/shops/add",
      element: <ShopForm />,
      permissions: [{ module: "Shop", action: "write" }],
    },
    {
      path: "/shops/edit/:id",
      element: <ShopForm />,
      permissions: [
        { module: "Shop", action: "read" },
        { module: "Shop", action: "update" },
      ],
      requireAll: true,
    },

    // Shop Inventory Routes
    {
      path: "/shop-inventory",
      element: <ShopInventoryList />,
      permissions: [{ module: "Shop Inventory", action: "read" }],
    },
    {
      path: "/shop-inventory/add",
      element: <ShopInventoryForm />,
      permissions: [{ module: "Shop Inventory", action: "write" }],
    },
    {
      path: "/shop-inventory/edit/:id",
      element: <ShopInventoryForm />,
      permissions: [
        { module: "Shop Inventory", action: "read" },
        { module: "Shop Inventory", action: "update" },
      ],
      requireAll: true,
    },

    // Restock Management Routes (Admin Only)
    {
      path: "/restock-management",
      element: <RestockManagement />,
      permissions: [{ module: "Restock Management", action: "read" }],
    },

    // Notifications Route
    {
      path: "/notifications",
      element: <Notifications />,
      permissions: [{ module: "Notifications", action: "read" }],
    },

    // Audit Log Route
    {
      path: "/audit-log",
      element: <AuditLog />,
      permissions: [{ module: "Audit Log", action: "read" }],
    },

    // Low Stock Alerts Route
    {
      path: "/low-stock",
      element: <LowStockAlerts />,
      permissions: [{ module: "Low Stock Alerts", action: "read" }],
    },
  ];

  return (
    <Routes>
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <RoleBasedRoute
                requiredPermissions={route.permissions}
                requireAll={route.requireAll}
              >
                <DashboardLayout>{route.element}</DashboardLayout>
              </RoleBasedRoute>
            }
          />
        ))}
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
