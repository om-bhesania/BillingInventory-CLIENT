import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PermissionProvider } from "./contexts/PermissionsContext";

import {
  printFrontendBanner,
  printFrontendInfo,
  printRoutesInfo,
} from "@/utils/startupBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import Login from "./pages/auth/Login";
import { usePingUser } from "@/hooks/use-pingUser";

const queryClient = new QueryClient();

// Print frontend startup banner
printFrontendBanner();
printFrontendInfo();
printRoutesInfo();

const App = () => {
  // Call ping on load to validate token and fetch user info
  usePingUser();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationsProvider>
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes with Permissions */}
              <Route
                path="/*"
                element={
                  <PermissionProvider>
                    <AppRoutes />
                  </PermissionProvider>
                }
              />
              </Routes>
            </NotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
