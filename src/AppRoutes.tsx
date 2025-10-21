import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/ui/dashboard/layout";
import { useAuth } from "./contexts/AuthContext";
import LazyRoute from "./components/LazyRoute";
import { usePermissions } from "./contexts/PermissionsContext";
import LoadingSpinner from "./components/ui/Loader";

// Lazy-loaded components
import {
  Dashboard,
  EmployeeForm,
  EmployeeList,
  InventoryForm,
  InventoryList,
  InventoryView,
  InvoiceForm,
  InvoiceList,
  NotFound,
  Tickets,
  ShopInventoryForm,
  ShopInventoryList,
  ShopForm,
  ShopList,
  UnauthorizedAccess,
  RestockManagement,
  Notifications,
  AuditLog,
  LowStockAlerts,
  SearchPage,
  DatabaseMonitoring,
  CacheManagement,
  EnhancedDatePickerDemo
} from "./pages/lazy";

// Import new raw material pages
import RawMaterialManagement from "./pages/RawMaterialManagement";
import Suppliers from "./pages/Suppliers";

 
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

  // Enhanced debugging - disabled for production
  // console.log("=== RoleBasedRoute Debug Info ===");
  // console.log("Required permissions:", requiredPermissions);
  // console.log("Auth loading:", authLoading);
  // console.log("Auth initialized:", isInitialized);
  // console.log("Permissions loading:", permissionsLoading);
  // console.log("User:", user);
  // console.log("User permissions:", userPermissions);
  // console.log("RequireAll:", requireAll);

  // Show loading while authentication or permissions are being fetched
  if (authLoading || permissionsLoading || !isInitialized) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <LoadingSpinner />
      </div>
    );
  }

  // If auth is complete but no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Special handling for Dashboard route - if user is authenticated, allow access
  // This prevents the "Access Denied" issue for the main dashboard
  const isDashboardRoute = requiredPermissions.some(perm => 
    perm.module === "Dashboard" && perm.action === "read"
  );

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  // Test the permission functions
  const hasAccessAny = hasAnyPermission(requiredPermissions);
  const hasAccessAll = hasAllPermissions(requiredPermissions);
  const hasAccess = requireAll ? hasAccessAll : hasAccessAny;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show UnauthorizedAccess page instead of redirecting
  // This prevents unwanted redirects on refresh
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
      path: "/inventory-view",
      element: <InventoryView />,
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
    {
      path: "/inventory/view",
      element: <InventoryView />,
      permissions: [{ module: "Shop Inventory", action: "read" }],
    },
    {
      path: "/tickets",
      element: <Tickets />,
      permissions: [{ module: "Support", action: "read" }],
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

    // Global Search Route
    {
      path: "/search",
      element: <SearchPage />,
      permissions: [{ module: "Search", action: "read" }],
    },

    // Database Monitoring Route (Admin Only)
    {
      path: "/database-monitoring",
      element: <DatabaseMonitoring />,
      permissions: [{ module: "Database Monitoring", action: "read" }],
    },

    // Cache Management Route (Admin Only)
    {
      path: "/cache-management",
      element: <CacheManagement />,
      permissions: [{ module: "Cache Management", action: "read" }],
    },

    // Raw Material Management Routes
    {
      path: "/raw-materials",
      element: <RawMaterialManagement />,
      permissions: [{ module: "Raw Materials", action: "read" }],
    },
    {
      path: "/suppliers",
      element: <Suppliers />,
      permissions: [{ module: "Raw Materials", action: "read" }],
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
                <DashboardLayout>
                  <LazyRoute loadingMessage={`Loading ${route.path.replace('/', '')}...`}>
                    {route.element}
                  </LazyRoute>
                </DashboardLayout>
              </RoleBasedRoute>
            }
          />
        ))}
      </Route>

      {/* Demo Routes */}
      <Route 
        path="/demo/enhanced-date-picker" 
        element={
          <DashboardLayout>
            <EnhancedDatePickerDemo />
          </DashboardLayout>
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
