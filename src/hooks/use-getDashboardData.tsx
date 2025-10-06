import { useState, useCallback, useEffect, useRef } from "react";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDashboardMetrics,
  getRecentActivities,
  refreshDashboardData,
  DashboardMetrics,
  RecentActivity,
} from "@/apis/dashboardApi";
import { getLowStockAlerts } from "@/apis/lowStockApi";
import { DateRange } from "@/components/ui/DateRangePicker";

// Types - using the imported types from your API

interface UseDashboardReturn {
  // State
  dashboardData: DashboardMetrics | null;
  recentActivities: RecentActivity[];
  lowStock: any[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  isRefreshing: boolean;
  dateRange: DateRange;

  // Computed values
  isAdmin: boolean;
  welcomeMessage: string;

  // Functions
  fetchDashboardData: (forceRefresh?: boolean) => Promise<void>;
  handleManualRefresh: () => Promise<void>;
  handleDateRangeChange: (newDateRange: DateRange) => void;
  handleQuickAction: (action: string) => void;
  formatLastRefresh: () => string;
}

export const useDashboard = (): UseDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(
    null
  );
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    // Default to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return { from: start, to: end };
  });

  const { toast } = useToast();
  const { user } = useAuth();

  // Computed values
  const isAdmin = user?.role === "Admin";
  const welcomeMessage = isAdmin
    ? "Welcome back, Admin! Here's an overview of your ice cream business."
    : "Welcome back! Here's an overview of your shop performance.";

  // Use ref to track if component is mounted and prevent memory leaks
  const isMounted = useRef(true);
  const lastApiCall = useRef<number>(0);
  const lastRefreshAttempt = useRef<number>(0);
  const REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds
  const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchDashboardData = useCallback(
    async (forceRefresh = false) => {
      // Prevent multiple simultaneous API calls
      if (isRefreshing) return;

      const now = Date.now();

      // Check if we need to refresh (either forced or after 60 minutes)
      if (
        !forceRefresh &&
        lastApiCall.current > 0 &&
        now - lastApiCall.current < REFRESH_INTERVAL
      ) {
        return; // Data is still fresh
      }

      try {
        setIsRefreshing(true);
        setError(null);

        // Update last API call timestamp
        lastApiCall.current = now;

        const [metricsResponse, activitiesResponse, lowStockResponse] =
          await Promise.all([
            getDashboardMetrics(dateRange),
            getRecentActivities(dateRange),
            getLowStockAlerts({ page: 1, limit: 5 }),
          ]);

        // Update state with dashboard data
        setDashboardData(metricsResponse as any);
        setRecentActivities(activitiesResponse.activities);
        setLastRefresh(new Date());
        setLowStock(lowStockResponse.items || []);
        setIsLoading(false);

        // Debug logging to understand API response structure
        console.log("Dashboard - API Response Debug:", {
          metricsResponse: metricsResponse,
          hasMetrics: !!metricsResponse?.metrics,
          metricsKeys: metricsResponse?.metrics
            ? Object.keys(metricsResponse.metrics)
            : [],
          categoryBreakdown: metricsResponse?.metrics?.categoryBreakdown?.slice(
            0,
            2
          ),
          flavorBreakdown: metricsResponse?.metrics?.flavorBreakdown?.slice(
            0,
            2
          ),
          shopRevenue: {
            total: metricsResponse?.metrics?.shopRevenue?.total,
            type: typeof metricsResponse?.metrics?.shopRevenue?.total,
            count: metricsResponse?.metrics?.shopRevenue?.count,
          },
          restockExpenses: {
            total: metricsResponse?.metrics?.restockExpenses?.total,
            type: typeof metricsResponse?.metrics?.restockExpenses?.total,
            count: metricsResponse?.metrics?.restockExpenses?.count,
          },
        });

        // Additional debug logging for dashboard state
        console.log("Dashboard - State:", {
          dashboardData: !!metricsResponse,
          isLoading: false,
          error: null,
          userRole: user?.role,
          isAdmin: user?.role === "Admin",
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setIsLoading(false); // Set loading to false on error too
        toast({
          title: "Error",
          text: "Failed to load dashboard data",
          type: "error",
        });
      } finally {
        setIsRefreshing(false);
      }
    },
    [dateRange, toast, user?.role]
  ); // Add user role to dependencies

  // Initial data fetch - only runs once
  useEffect(() => {
    fetchDashboardData();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [fetchDashboardData, dateRange]); // Only depend on the memoized function

  // Function to handle manual refresh with rate limiting
  const handleManualRefresh = useCallback(async () => {
    const now = Date.now();

    // Check if enough time has passed since last refresh attempt
    if (now - lastRefreshAttempt.current < REFRESH_COOLDOWN) {
      const remainingTime = Math.ceil(
        (REFRESH_COOLDOWN - (now - lastRefreshAttempt.current)) / 1000 / 60
      );
      toast({
        title: "Refresh Rate Limited",
        text: `You can refresh once every 5 minutes. Please wait ${remainingTime} minute${
          remainingTime > 1 ? "s" : ""
        }.`,
        type: "warning",
      });
      return;
    }

    try {
      setIsRefreshing(true);
      setError(null);

      // Update last refresh attempt timestamp
      lastRefreshAttempt.current = now;

      // Use the refresh endpoint with rate limiting
      const [metricsResponse, activitiesResponse, lowStockResponse] =
        await Promise.all([
          refreshDashboardData(dateRange),
          getRecentActivities(dateRange),
          getLowStockAlerts({ page: 1, limit: 5 }),
        ]);

      setDashboardData(metricsResponse as any);
      setRecentActivities(activitiesResponse.activities);
      setLastRefresh(new Date());
      setLowStock(lowStockResponse.items || []);

      toast({
        title: "Success",
        text: "Dashboard data refreshed successfully",
        type: "success",
      });
    } catch (err: any) {
      console.error("Error refreshing dashboard data:", err);

      if (err.response?.status === 429) {
        // Rate limit exceeded
        toast({
          title: "Refresh Rate Limited",
          text: "You can refresh once every 5 minutes. Please wait before trying again.",
          type: "warning",
        });
      } else {
        toast({
          title: "Error",
          text: "Failed to refresh dashboard data",
          type: "error",
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange, toast]);

  // Function to handle date range changes
  const handleDateRangeChange = useCallback(
    (newDateRange: DateRange) => {
      setDateRange(newDateRange);
      // Automatically fetch new data when date range changes
      setTimeout(() => fetchDashboardData(true), 100);
    },
    [fetchDashboardData]
  );

  // Function to handle quick actions
  const handleQuickAction = useCallback(
    (action: string) => {
      toast({
        title: "Action triggered",
        text: `You clicked on ${action}`,
        type: "info",
      });
    },
    [toast]
  );

  // Format last refresh time
  const formatLastRefresh = useCallback(() => {
    if (!lastRefresh) return "Never";
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastRefresh.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }, [lastRefresh]);

  return {
    // State
    dashboardData,
    recentActivities,
    lowStock,
    isLoading,
    error,
    lastRefresh,
    isRefreshing,
    dateRange,

    // Computed values
    isAdmin,
    welcomeMessage,

    // Functions
    fetchDashboardData,
    handleManualRefresh,
    handleDateRangeChange,
    handleQuickAction,
    formatLastRefresh,
  };
};

export default useDashboard;
