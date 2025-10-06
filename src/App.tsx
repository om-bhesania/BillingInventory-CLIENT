import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { PermissionProvider } from "./contexts/PermissionsContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { RealtimeDataProvider } from "./contexts/RealtimeDataContext";
import { usePingUser } from "@/hooks/use-pingUser";

import {
  printFrontendBanner,
  printFrontendInfo,
  printRoutesInfo,
} from "@/utils/startupBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import LazyRoute from "./components/LazyRoute";
import { ApiActivityProvider } from "./contexts/ApiActivityContext";
import { TopLoader } from "./components/layout/TopLoader";
import { ConnectionStatusBar } from "./components/layout/ConnectionStatusBar";
import { lazy } from "react";
import { initializePreloading } from "./utils/componentPreloader";
import { Toaster } from "sonner";
import ConditionalFloatingChat from "./components/chat/ConditionalFloatingChat";

// Lazy load login page
const Login = lazy(() => import("./pages/auth/Login"));

const queryClient = new QueryClient();

// Print frontend startup banner
printFrontendBanner();
printFrontendInfo();
printRoutesInfo();

// Component that calls usePingUser to fetch user data on app load
const AppContent = () => {
  // Call ping on load to validate token and fetch user info
  usePingUser();

  // Initialize component preloading
  React.useEffect(() => {
    initializePreloading();
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <LazyRoute loadingMessage="Loading login page...">
            <Login />
          </LazyRoute>
        }
      />

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
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <Toaster />
        <BrowserRouter>
                 <AuthProvider>
                   <NotificationsProvider>
                     <LoadingProvider>
                       <RealtimeDataProvider>
                         <ApiActivityProvider>
                           <TopLoader />
                           <ConnectionStatusBar />
                           <AppContent />
                           <ConditionalFloatingChat />
                         </ApiActivityProvider>
                       </RealtimeDataProvider>
                     </LoadingProvider>
                   </NotificationsProvider>
                 </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
