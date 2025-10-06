import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Filter,
  Search,
  FileText,
  Package,
  TrendingUp,
  User,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Bell,
  Activity,
  Store,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  getAuditLog,
  getAuditLogStats,
  AuditLogEntry,
  AuditLogStats,
} from "@/apis/auditLogApi";
import { getShop } from "@/apis/shopapi";
import useToast from "@/hooks/use-toast";

const AuditLog = () => {
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("audit");
  const [filters, setFilters] = useState({
    type: "all",
    shopId: "all",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [realtimeFilters, setRealtimeFilters] = useState({
    category: "all",
    search: "",
  });

  const { user, isAdmin, isShopOwner } = useAuth();
  const { notifications } = useNotifications();
  const { hasModuleAccess, isLoading: permissionsLoading } = usePermissions();
  const { toast } = useToast();

  // Check if user has access to audit logs
  // Shop Owners should always have access to their own shop's audit logs
  const hasAuditAccess = hasModuleAccess("Audit Logs") || isAdmin() || isShopOwner();

  useEffect(() => {
    if (hasAuditAccess) {
      fetchAuditLog();
    }
  }, [currentPage, filters, hasAuditAccess]);

  useEffect(() => {
    fetchAuditLogStats();
  }, []);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      if (user?.role === "Admin" || user?.role === "Owner") {
        const response: any = await getShop();
        const shopsList = (
          Array.isArray(response)
            ? response
            : response?.shops || response?.data || []
        )
          .map((s: any) => ({ id: s.id, name: s.name }))
          .filter((s: any) => s.id && s.name);
        setShops(shopsList);
      }
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };

  const fetchAuditLog = async () => {
    try {
      setIsLoading(true);
      const response: any = await getAuditLog({
        page: currentPage,
        limit: 20,
        type: filters.type === "all" ? undefined : filters.type,
        shopId: filters.shopId === "all" ? undefined : filters.shopId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
      });

      setAuditEntries(response.entries);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (err) {
      console.error("Error fetching audit log:", err);
      setError(err?.response?.data?.error || "Failed to load audit log");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogStats = async () => {
    try {
      const response: any = await getAuditLogStats();
      setStats(response.stats);
    } catch (err) {
      console.error("Error fetching audit log stats:", err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "billing":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "restock":
        return <Package className="h-4 w-4 text-orange-600" />;
      case "inventory":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "user":
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "billing":
        return "bg-green-100 border-green-200";
      case "restock":
        return "bg-orange-100 border-orange-200";
      case "inventory":
        return "bg-blue-100 border-blue-200";
      case "user":
        return "bg-purple-100 border-purple-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return null;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRealtimeFilterChange = (key: string, value: string) => {
    setRealtimeFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLog();
  };

  const clearFilters = () => {
    setFilters({
      type: "all",
      shopId: "all",
      startDate: "",
      endDate: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const clearRealtimeFilters = () => {
    setRealtimeFilters({
      category: "all",
      search: "",
    });
  };

  // Filter realtime notifications
  const filteredRealtimeNotifications = notifications
    .filter((notification) => {
      const matchesSearch =
        notification.message
          .toLowerCase()
          .includes(realtimeFilters.search.toLowerCase()) ||
        notification.type
          .toLowerCase()
          .includes(realtimeFilters.search.toLowerCase()) ||
        (notification.category || "SYSTEM")
          .toLowerCase()
          .includes(realtimeFilters.search.toLowerCase());

      const matchesCategory =
        realtimeFilters.category === "all" ||
        (notification.category || "SYSTEM") === realtimeFilters.category ||
        (realtimeFilters.category === "CHAT" &&
          (notification.category === "CHAT" ||
            notification.type.includes("CHAT"))) ||
        (realtimeFilters.category === "RESTOCK" &&
          (notification.category === "RESTOCK" ||
            notification.type.includes("RESTOCK"))) ||
        (realtimeFilters.category === "INVENTORY" &&
          (notification.category === "INVENTORY" ||
            notification.type.includes("LOW_STOCK") ||
            notification.type.includes("PRODUCT"))) ||
        (realtimeFilters.category === "BILLING" &&
          (notification.category === "BILLING" ||
            notification.type.includes("INVOICE"))) ||
        (realtimeFilters.category === "FACTORY" &&
          (notification.category === "FACTORY" ||
            notification.type.includes("FACTORY"))) ||
        (realtimeFilters.category === "SYSTEM" &&
          notification.category === "SYSTEM");

      return matchesSearch && matchesCategory;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // Show loading while permissions are being checked
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                Loading Permissions...
              </h3>
              <p className="text-muted-foreground">
                Checking your access to audit logs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied for users without audit log permissions
  if (!hasAuditAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Access Denied
              </h3>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view audit logs. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            System activity and audit trail
          </p>
        </div>
        <Separator className="my-6" />

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">
                Failed to Load Audit Log
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Activity & Audit Log
        </h1>
        <p className="text-muted-foreground">
          {isAdmin()
            ? "System-wide activities, audit trail, and real-time updates"
            : isShopOwner()
            ? `Your shop activity log and real-time updates${user?.managedShops?.length ? ` for ${user.managedShops.map(shop => shop.name).join(', ')}` : ''}`
            : "Activity log and real-time updates"}
        </p>
        {isShopOwner() && user?.managedShops?.length && (
          <div className="mt-2 flex items-center gap-2">
            <Store className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">
              Shop-specific audit logs for: {user.managedShops.map(shop => shop.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Realtime Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Activities
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total.billings +
                      stats.total.restocks +
                      stats.total.inventoryUpdates}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time activities
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recent Activities
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.recent.billings +
                      stats.recent.restocks +
                      stats.recent.inventoryUpdates}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Monthly Activities
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.monthly.billings +
                      stats.monthly.restocks +
                      stats.monthly.inventoryUpdates}
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Audit Log Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Activity Type
                  </label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => handleFilterChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="restock">Restock</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin() && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Shop
                    </label>
                    <Select
                      value={filters.shopId}
                      onValueChange={(value) =>
                        handleFilterChange("shopId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Shops</SelectItem>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Activity Log</span>
                <span className="text-sm text-muted-foreground">
                  {totalCount} total entries
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 animate-pulse"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : auditEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit entries found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditEntries.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div
                        className={`rounded-full p-2 ${getActivityColor(
                          entry.type
                        )}`}
                      >
                        {getActivityIcon(entry.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.action}</p>
                          <Badge variant="outline" className="text-xs">
                            {entry.type}
                          </Badge>
                          {entry.status && (
                            <Badge variant="secondary" className="text-xs">
                              {entry.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.details}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          {entry.shopName && (
                            <span>Shop: {entry.shopName}</span>
                          )}
                          {entry.amount && (
                            <span className="font-medium text-green-600">
                              {formatAmount(entry.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          {/* Realtime Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Realtime Updates Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category
                  </label>
                  <Select
                    value={realtimeFilters.category}
                    onValueChange={(value) =>
                      handleRealtimeFilterChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="CHAT">Chat</SelectItem>
                      <SelectItem value="RESTOCK">Restock</SelectItem>
                      <SelectItem value="INVENTORY">Inventory</SelectItem>
                      <SelectItem value="BILLING">Billing</SelectItem>
                      <SelectItem value="FACTORY">Factory</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search
                  </label>
                  <Input
                    placeholder="Search notifications..."
                    value={realtimeFilters.search}
                    onChange={(e) =>
                      handleRealtimeFilterChange("search", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={clearRealtimeFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Realtime Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Realtime Updates</span>
                <span className="text-sm text-muted-foreground">
                  {filteredRealtimeNotifications.length} notifications
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRealtimeNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No realtime updates found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRealtimeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="rounded-full p-2 bg-blue-100">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {notification.type.replace(/_/g, " ")}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {notification.category || "SYSTEM"}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditLog;
