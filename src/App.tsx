import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import EmployeeForm from "./pages/employees/EmployeeForm";
import EmployeeList from "./pages/employees/EmployeeList";
import InventoryForm from "./pages/inventory/InventoryForm";
import InventoryList from "./pages/inventory/InventoryList";
import InvoiceForm from "./pages/invoices/InvoiceForm";
import InvoiceList from "./pages/invoices/InvoiceList";
import NotFound from "./pages/NotFound";
import ShopForm from "./pages/shops/ShopForm";
import ShopList from "./pages/shops/ShopList";
import UnauthorizedAccess from "./pages/UnauthorizedAccess";
import {
  printFrontendBanner,
  printFrontendInfo,
  printRoutesInfo,
} from "@/utils/startupBanner";
import React from "react";
import ShopInventoryForm from "./pages/ShopInventory/ShopInventoryForm";
import ShopInventoryList from "./pages/ShopInventory/ShopInventoryList";
import Login from "./pages/auth/Login";
import { DashboardLayout } from "./components/ui/dashboard/layout";
import AppRoutes from "./AppRoutes";
import { PermissionProvider } from "./contexts/PermissionsContext";

const queryClient = new QueryClient();

// Print frontend startup banner
printFrontendBanner();
printFrontendInfo();
printRoutesInfo();

// Create a component to handle role-based access
const RoleBasedRoute = ({
  children,
  allowedPermissions,
}: {
  children: React.ReactNode;
  allowedPermissions: string[];
}) => {
  const { user, roles } = useAuth();

  const allowedPermissionsCheck =
    roles.find((role) => role.id === user?.roleId)?.permissions || [];
  const allowedModules = allowedPermissionsCheck.map(
    (permission: any) => permission.module
  );

  const hasAccess = allowedPermissions.every((permission) =>
    allowedModules.includes(permission)
  );

  if (!user) {
    return <NotFound />;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <UnauthorizedAccess />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
            </Routes>
            <PermissionProvider>
              <AppRoutes />
            </PermissionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
