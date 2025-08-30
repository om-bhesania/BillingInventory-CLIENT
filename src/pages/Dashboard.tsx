import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useToast from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { DateRangePicker, DateRange } from "@/components/ui/DateRangePicker";
import {
  Calendar,
  ClipboardList,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  AlertTriangle,
  Bell,
  BarChart3,
  Clock,
  RefreshCw,
  Info
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardMetrics, getRecentActivities, refreshDashboardData, DashboardMetrics, RecentActivity } from "@/apis/dashboardApi";
import { getLowStockAlerts } from "@/apis/lowStockApi";
import { EnhancedAnalyticsDashboard } from "@/components/charts/EnhancedAnalyticsDashboard";
import RecentActivities from "@/components/dashboard/RecentActivities";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
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
  
  // Use ref to track if component is mounted and prevent memory leaks
  const isMounted = useRef(true);
  const lastApiCall = useRef<number>(0);
  const lastRefreshAttempt = useRef<number>(0);
  const REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds
  const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous API calls
    if (isRefreshing) return;
    
    const now = Date.now();
    
    // Check if we need to refresh (either forced or after 60 minutes)
    if (!forceRefresh && 
        lastApiCall.current > 0 && 
        (now - lastApiCall.current) < REFRESH_INTERVAL) {
      return; // Data is still fresh
    }

    try {
      setIsRefreshing(true);
      setError(null);
      
      // Update last API call timestamp
      lastApiCall.current = now;

      const [metricsResponse, activitiesResponse, lowStockResponse] = await Promise.all([
        getDashboardMetrics(dateRange),
        getRecentActivities(dateRange),
        getLowStockAlerts({ page: 1, limit: 5 })
      ]);

      // Update state with dashboard data
      setDashboardData(metricsResponse as any);
      setRecentActivities(activitiesResponse.activities);
      setLastRefresh(new Date());
      setLowStock(lowStockResponse.items || []);
      setIsLoading(false);
      
      // Debug logging to understand API response structure
      console.log('Dashboard - API Response Debug:', {
        metricsResponse: metricsResponse,
        hasMetrics: !!metricsResponse?.metrics,
        metricsKeys: metricsResponse?.metrics ? Object.keys(metricsResponse.metrics) : [],
        categoryBreakdown: metricsResponse?.metrics?.categoryBreakdown?.slice(0, 2),
        flavorBreakdown: metricsResponse?.metrics?.flavorBreakdown?.slice(0, 2),
        shopRevenue: {
          total: metricsResponse?.metrics?.shopRevenue?.total,
          type: typeof metricsResponse?.metrics?.shopRevenue?.total,
          count: metricsResponse?.metrics?.shopRevenue?.count
        },
        restockExpenses: {
          total: metricsResponse?.metrics?.restockExpenses?.total,
          type: typeof metricsResponse?.metrics?.restockExpenses?.total,
          count: metricsResponse?.metrics?.restockExpenses?.count
        }
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast({
        title: "Error",
        text: "Failed to load dashboard data",
        type: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [dateRange, toast]); // Add dateRange to dependencies

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
      const remainingTime = Math.ceil((REFRESH_COOLDOWN - (now - lastRefreshAttempt.current)) / 1000 / 60);
      toast({
        title: "Refresh Rate Limited",
        text: `You can refresh once every 5 minutes. Please wait ${remainingTime} minute${remainingTime > 1 ? 's' : ''}.`,
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
      const [metricsResponse, activitiesResponse, lowStockResponse] = await Promise.all([
        refreshDashboardData(dateRange),
        getRecentActivities(dateRange),
        getLowStockAlerts({ page: 1, limit: 5 })
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
      console.error('Error refreshing dashboard data:', err);
      
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
  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange);
    // Automatically fetch new data when date range changes
    setTimeout(() => fetchDashboardData(true), 100);
  }, [fetchDashboardData]);

  // Function to handle quick actions
  const handleQuickAction = useCallback((action: string) => {
    toast({
      title: "Action triggered",
      text: `You clicked on ${action}`,
      type: "info",
    });
  }, [toast]);

  // Format last refresh time
  const formatLastRefresh = () => {
    if (!lastRefresh) return "Never";
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Loading your dashboard...
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        
        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Error loading dashboard
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleManualRefresh} disabled={isRefreshing}>
                {isRefreshing ? "Retrying..." : "Try Again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user?.role === 'Admin';
  const welcomeMessage = isAdmin 
    ? "Welcome back, Admin! Here's an overview of your ice cream business."
    : "Welcome back! Here's an overview of your shop performance.";
    
  // Debug logging
  console.log('Dashboard - State:', {
    dashboardData: !!dashboardData,
    isLoading,
    error,
    userRole: user?.role,
    isAdmin
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">{welcomeMessage}</p>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {formatLastRefresh()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleManualRefresh} 
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => handleQuickAction("Generate Report")}>
            Generate Report
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Date Range Picker */}
      <div className="mb-6">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Data Update Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Data Update Information</p>
            <p>Dashboard data is not real-time and is updated hourly. For the latest data, click the refresh button above.</p>
            <p className="mt-1 text-xs">Note: Refresh is limited to once every 5 minutes to ensure optimal performance.</p>
          </div>
        </div>
      </div>

      {/* Role-based Dashboard */}
      {dashboardData ? (
        <EnhancedAnalyticsDashboard
          metrics={dashboardData.metrics}
          role={isAdmin ? 'Admin' : 'Shop_Owner'}
        />
      ) : (
        <div className="p-6 bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      )}

      {/* Recent Activities Section */}
      <div className="mt-6">
        <RecentActivities activities={recentActivities} />
      </div>

      {/* Low Stock Alerts - Admin only on main dashboard */}
      {/* {isAdmin && (
        <div className="mt-6">
          <Card className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5" /> Low Stock Alerts
            </h2>

            <div className="space-y-4">
              {lowStock.length === 0 && (
                <p className="text-sm text-muted-foreground">No low stock items right now.</p>
              )}
              {lowStock.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="rounded-full p-1.5 bg-red-100">
                    <Package className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs font-medium text-red-600">Only {item.currentStock} left</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Reorder point: {item.minStockLevel ?? 0} units</p>
                    {item.shopName && (
                      <p className="text-xs text-muted-foreground">Shop {item.shopName}</p>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleQuickAction("View all low stock items")}
              >
                View all low stock items
              </Button>
            </div>
          </Card>
        </div>
      )} */}
    </>
  );
};

export default Dashboard;
