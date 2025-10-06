import {
  createRestockRequest,
  getRestockRequests,
  getAllRestockRequests,
  approveRestockRequest,
  rejectRestockRequest,
  RestockRequest,
} from "@/apis/restockRequestApi";
import { getShop } from "@/apis/shopapi";
import {
  getShopInventory,
  removeProductFromShop,
  ShopInventoryItem,
  updateShopInventoryStock,
} from "@/apis/shopInventoryApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/Loader";
import useToast from "@/hooks/use-toast";
import { usePingUser } from "@/hooks/use-pingUser";
import { useEffect, useState } from "react";
import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";
import { getWebSocketService } from "@/services/websocketService";
import Swal from "sweetalert2";
import { useApi } from "@/hooks/useApi";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Package,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Shop {
  id: string;
  name: string;
}

function ShopInventoryList() {
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RestockRequest[]>(
    []
  );
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<RestockRequest | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { toast } = useToast();
  const { user } = usePingUser();
  const wsService = getWebSocketService();

  // Get user's shop IDs from ping data
  const userShopIds = user?.managedShops?.map((shop) => shop.id) || [];

  // Use useApi for fetching restock requests when a shop is selected
  const {
    data: restockRequestsData,
    loading: restockRequestsLoading,
    error: restockRequestsError,
    execute: fetchRestockRequestsForShop,
  } = useApi(API_URL.restockRequest.getByShopId(selectedShopId), "GET");

  useEffect(() => {
    console.log("shopData", restockRequestsData);
    console.log("User data:", user);
    console.log("User shop IDs:", userShopIds);
    const fetchShops = async () => {
      try {
        if (user?.role === "Shop_Owner") {
          console.log("User is Shop Owner, managed shops:", user.managedShops);
          const userShops = user.managedShops || [];
          setShops(userShops as Shop[]);
          // Set the first shop as selected for Shop Owner
          if (userShops.length > 0) {
            setSelectedShopId(userShops[0].id);
            console.log(
              "Fetching restock requests for shop owner shops:",
              userShops.map((s: any) => s.id)
            );
            await fetchAllRestockRequests(userShops.map((s: any) => s.id));
          }
        } else {
          console.log("User is Admin, fetching all shops");
          const shopsData: any = await getShop();
          console.log("Fetched shops data:", shopsData);
          setShops(shopsData as Shop[]);
          // Set the first shop as selected for Admin
          if (shopsData && shopsData.length > 0) {
            setSelectedShopId(shopsData[0].id);
            const ids = shopsData.map((s: any) => s.id);
            console.log("Fetching restock requests for admin shops:", ids);
            await fetchAllRestockRequests(ids);
          }
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        toast({
          title: "Error",
          text: "Failed to fetch shops",
          type: "error",
        });
      }
    };

    if (user) {
      fetchShops();
    }
  }, [user]); // Add user as dependency

  // Fetch restock requests when selectedShopId changes (fallback)
  useEffect(() => {
    if (selectedShopId && restockRequests.length === 0) {
      console.log(
        "No restock request data, fetching for selected shop:",
        selectedShopId
      );
      fetchRestockRequests();
    }
  }, [selectedShopId]);

  useEffect(() => {
    filterAndSortRequests();
  }, [
    restockRequests,
    searchTerm,
    statusFilter,
    categoryFilter,
    sortBy,
    sortOrder,
  ]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    const handleRestockRequestCreated = (data: any) => {
      console.log('Restock request created:', data);
      console.log('Data structure:', JSON.stringify(data, null, 2));
      console.log('User shop IDs:', userShopIds);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        console.log('Shop ID from event:', shopId);
        if (userShopIds.includes(shopId)) {
          console.log('Shop ID matches, refreshing requests');
          // Refresh the requests list to get the new request
          handleRefresh();
        } else {
          console.log('Shop ID does not match user shops');
        }
      } else {
        console.warn('No requestId found in restock request created event:', data);
      }
    };

    const handleRestockRequestApproved = (data: any) => {
      console.log('Restock request approved:', data);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        if (userShopIds.includes(shopId)) {
          // Update the specific request in the list
          setRestockRequests(prev => prev.map(req => 
            req.id === data.notification.data.requestId 
              ? { ...req, status: 'pending', updatedAt: new Date().toISOString() }
              : req
          ));
        }
      }
    };

    const handleRestockRequestRejected = (data: any) => {
      console.log('Restock request rejected:', data);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        if (userShopIds.includes(shopId)) {
          // Update the specific request in the list
          setRestockRequests(prev => prev.map(req => 
            req.id === data.notification.data.requestId 
              ? { ...req, status: 'rejected', updatedAt: new Date().toISOString() }
              : req
          ));
        }
      }
    };

    const handleRestockRequestStatusUpdated = (data: any) => {
      console.log('Restock request status updated:', data);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        if (userShopIds.includes(shopId)) {
          // Update the specific request in the list
          setRestockRequests(prev => prev.map(req => 
            req.id === data.notification.data.requestId 
              ? { ...req, status: data.notification.data.status, updatedAt: new Date().toISOString() }
              : req
          ));
        }
      }
    };

    const handleRestockRequestFulfilled = (data: any) => {
      console.log('Restock request fulfilled:', data);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        if (userShopIds.includes(shopId)) {
          // Update the specific request in the list
          setRestockRequests(prev => prev.map(req => 
            req.id === data.notification.data.requestId 
              ? { ...req, status: 'fulfilled', updatedAt: new Date().toISOString() }
              : req
          ));
        }
      }
    };

    const handleRestockRequestHidden = (data: any) => {
      console.log('Restock request hidden:', data);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        if (userShopIds.includes(shopId)) {
          // Remove the hidden request from the list
          setRestockRequests(prev => prev.filter(req => req.id !== data.notification.data.requestId));
        }
      }
    };

    const handleRestockRequestAutoGenerated = (data: any) => {
      console.log('Restock request auto generated:', data);
      if (data.notification?.data?.requestId) {
        // Check if this request belongs to user's shops
        const shopId = data.notification?.data?.shopId;
        if (userShopIds.includes(shopId)) {
          // Refresh the requests list to get the new auto-generated request
          handleRefresh();
        }
      }
    };

    // Subscribe to websocket events
    wsService.on('restock_request_created', handleRestockRequestCreated);
    wsService.on('restock_request_approved', handleRestockRequestApproved);
    wsService.on('restock_request_rejected', handleRestockRequestRejected);
    wsService.on('restock_request_status_updated', handleRestockRequestStatusUpdated);
    wsService.on('restock_request_fulfilled', handleRestockRequestFulfilled);
    wsService.on('restock_request_hidden', handleRestockRequestHidden);
    wsService.on('restock_request_auto_generated', handleRestockRequestAutoGenerated);

    return () => {
      // Cleanup listeners
      wsService.off('restock_request_created', handleRestockRequestCreated);
      wsService.off('restock_request_approved', handleRestockRequestApproved);
      wsService.off('restock_request_rejected', handleRestockRequestRejected);
      wsService.off('restock_request_status_updated', handleRestockRequestStatusUpdated);
      wsService.off('restock_request_fulfilled', handleRestockRequestFulfilled);
      wsService.off('restock_request_hidden', handleRestockRequestHidden);
      wsService.off('restock_request_auto_generated', handleRestockRequestAutoGenerated);
    };
  }, [wsService, userShopIds]);

  const filterAndSortRequests = () => {
    let filtered = [...restockRequests];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.product.sku
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.product.category.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.product.flavor.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.product.category.name === categoryFilter
      );
    }
    // If a shop is selected, filter client-side to that shop while still keeping aggregated requests loaded
    if (selectedShopId) {
      filtered = filtered.filter(
        (request) => request.shopId === selectedShopId
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "productName":
          aValue = a.product.name;
          bValue = b.product.name;
          break;
        case "requestedAmount":
          aValue = a.requestedAmount;
          bValue = b.requestedAmount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "category":
          aValue = a.product.category.name;
          bValue = b.product.category.name;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRequests(filtered);
  };

  const fetchRestockRequests = async () => {
    if (!selectedShopId) return;

    setIsLoading(true);
    try {
      const requestsData = await getRestockRequests(selectedShopId);
      setRestockRequests(requestsData);
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to fetch restock requests",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRestockRequests = async (shopIds: string[]) => {
    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      console.log("No shop IDs provided for fetching restock requests");
      return;
    }

    console.log("Fetching restock requests for shops:", shopIds);
    setIsLoading(true);
    try {
      const results = await Promise.all(
        shopIds.map(async (id) => {
          try {
            console.log(`Fetching restock requests for shop ${id}`);
            const requests = await getRestockRequests(id);
            console.log(`Restock requests for shop ${id}:`, requests);
            return requests || [];
          } catch (error) {
            console.error(
              `Error fetching restock requests for shop ${id}:`,
              error
            );
            return [];
          }
        })
      );
      const merged = ([] as any[]).concat(...results);
      console.log("Merged restock requests data:", merged);
      setRestockRequests(merged as RestockRequest[]);
    } catch (error) {
      console.error("Error in fetchAllRestockRequests:", error);
      toast({
        title: "Error",
        text: "Failed to fetch restock requests",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!editingItem || newStock < 0) return;

    setIsUpdating(true);
    try {
      await updateShopInventoryStock(editingItem.id, {
        currentStock: newStock,
      });

      // Update local state
      setRestockRequests((prev) =>
        prev.map((request) =>
          request.id === editingItem.id
            ? { ...request, requestedAmount: newStock }
            : request
        )
      );

      toast({
        title: "Success",
        text: "Stock updated successfully",
        type: "success",
      });

      setEditingItem(null);
      setNewStock(0);
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to update stock",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveProduct = async (itemId: string) => {
    if (!selectedShopId) return;

    const result = await Swal.fire({
      title: "Remove Product?",
      text: "This will remove the product from shop inventory. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel",
      allowOutsideClick: true,
      allowEscapeKey: true,
      backdrop: true,
    });

    if (result.isConfirmed) {
      setIsRemoving(itemId);
      try {
        await removeProductFromShop(itemId);
        toast({
          title: "Success",
          text: "Product removed from shop inventory",
          type: "success",
        });
        fetchRestockRequests();
      } catch (error) {
        toast({
          title: "Error",
          text: "Failed to remove product from shop inventory",
          type: "error",
        });
      } finally {
        setIsRemoving(null);
      }
    }
  };

  const handleOrderReceived = async (shopId: string, productId: string) => {
    try {
      await service({
        url: API_URL.restockRequest.markFulfilled,
        method: "POST",
        data: {
          shopId,
          productId,
        },
      });

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Order Received!",
        text: "Restock request has been marked as fulfilled.",
        timer: 2000,
        showConfirmButton: false,
        allowOutsideClick: true,
        allowEscapeKey: true,
      });

      // Refresh the restock requests list
      fetchRestockRequests();
      // Also refresh restock requests so UI hides the Received button immediately
      fetchRestockRequests();
    } catch (error) {
      console.error("Error marking restock request as fulfilled:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to mark restock request as fulfilled. Please try again.",
        allowOutsideClick: true,
        allowEscapeKey: true,
      });
    }
  };

  // Function to check if there's a restock request in "pending" status for a product
  const hasPendingRequest = (productId: string) => {
    if (!restockRequestsData || !Array.isArray(restockRequestsData))
      return false;

    return restockRequestsData.some(
      (request) =>
        request.productId === productId &&
        request.status === "pending" &&
        !request.hidden // Don't show for hidden requests
    );
  };

  const getStockStatus = (currentStock: number, minStockLevel?: number) => {
    if (!minStockLevel) return "normal";
    if (currentStock === 0) return "out-of-stock";
    if (currentStock <= minStockLevel) return "low-stock";
    return "normal";
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return "bg-red-500";
      case "low-stock":
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return "Out of Stock";
      case "low-stock":
        return "Low Stock";
      default:
        return "In Stock";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting_for_approval":
        return "bg-orange-500";
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-blue-500";
      case "fulfilled":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusDisplayText = (status: string) => {
    const displayTexts = {
      waiting_for_approval: "Waiting for Approval",
      pending: "Pending",
      approved: "Approved",
      fulfilled: "Fulfilled",
      rejected: "Rejected",
    };
    return displayTexts[status as keyof typeof displayTexts] || status;
  };

  const getUniqueCategories = () => {
    const categories = restockRequests.map(
      (request) => request.product.category.name
    );
    return Array.from(new Set(categories));
  };

  const handleRefresh = async () => {
    if (user?.role === "Shop_Owner") {
      const userShops = user.managedShops || [];
      if (userShops.length > 0) {
        await fetchAllRestockRequests(userShops.map((s: any) => s.id));
      }
    } else {
      const shopsData: any = await getShop();
      if (shopsData && shopsData.length > 0) {
        const ids = shopsData.map((s: any) => s.id);
        await fetchAllRestockRequests(ids);
      }
    }
  };

  const testApiCall = async () => {
    try {
      console.log("Testing API call with shop ID:", selectedShopId);
      const result = await getRestockRequests(selectedShopId);
      console.log("API call result:", result);
      toast({
        title: "API Test",
        text: `API returned ${
          Array.isArray(result) ? result.length : "unknown"
        } restock requests`,
        type: "success",
      });
    } catch (error) {
      console.error("API test error:", error);
      toast({
        title: "API Test Failed",
        text: "Check console for details",
        type: "error",
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await approveRestockRequest(requestId);
      toast({
        title: "Success",
        text: "Restock request approved",
        type: "success",
      });
      // Refresh the list
      handleRefresh();
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to approve request",
        type: "error",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectRestockRequest(requestId, { notes: "Rejected by admin" });
      toast({
        title: "Success",
        text: "Restock request rejected",
        type: "success",
      });
      // Refresh the list
      handleRefresh();
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to reject request",
        type: "error",
      });
    }
  };

  const viewRequestDetails = (request: RestockRequest) => {
    const statusColor = getStatusColor(request.status);
    const statusText =
      request.status.charAt(0).toUpperCase() + request.status.slice(1);

    Swal.fire({
      title: "Restock Request Details",
      html: `
        <div class="text-left space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold text-gray-700">Product Information</h3>
              <p><strong>Name:</strong> ${request.product.name}</p>
              <p><strong>SKU:</strong> ${request.product.sku}</p>
              <p><strong>Category:</strong> ${request.product.category.name}</p>
              <p><strong>Flavor:</strong> ${request.product.flavor.name}</p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-700">Request Information</h3>
              <p><strong>Requested Amount:</strong> ${
                request.requestedAmount
              } units</p>
              <p><strong>Status:</strong> <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor} text-white">${statusText}</span></p>
              <p><strong>Created:</strong> ${new Date(
                request.createdAt
              ).toLocaleDateString()}</p>
              ${
                request.notes
                  ? `<p><strong>Notes:</strong> ${request.notes}</p>`
                  : ""
              }
            </div>
          </div>
        </div>
      `,
      width: "600px",
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      backdrop: true,
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === "Shop_Owner"
              ? "My Restock Requests"
              : "Restock Request Management"}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === "Shop_Owner"
              ? "View and track your restock requests"
              : "Review and manage restock requests from all shops"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          <Badge variant="secondary" className="text-sm">
            {filteredRequests.length} of {restockRequests.length} requests
          </Badge>
        </div>
      </div>

      {/* Shop Selection */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shop Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="shop-select" className="font-medium">
              Select Shop:
            </Label>
            <select
              id="shop-select"
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="border rounded-md px-3 py-2 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card> */}

      {/* Search, Filter, and Sort Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="waiting_for_approval">Waiting for Approval</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productName">Product Name</SelectItem>
                  <SelectItem value="requestedAmount">
                    Requested Amount
                  </SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restock Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Restock Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {restockRequests.length === 0
                  ? "No restock requests found"
                  : "No matching requests"}
              </p>
              <p className="text-gray-500">
                {restockRequests.length === 0
                  ? "Create restock requests to get started."
                  : "Try adjusting your search or filters."}
              </p>
              {/* {restockRequests.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Debug Info: User role: {user?.role}, Selected shop:{" "}
                    {selectedShopId}, Available shops: {shops.length}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={testApiCall}>
                      Test API
                    </Button>
                  </div>
                </div>
              )} */}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">
                      Requested Amount
                    </th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Created Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const statusColor = getStatusColor(request.status);

                    return (
                      <tr
                        key={request.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium">
                              {request.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.product.sku} •{" "}
                              {request.product.flavor.name}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {request.product.category.name}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {request.requestedAmount} units
                          </div>
                          {request.notes && (
                            <div className="text-sm text-gray-500">
                              Note: {request.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusColor} text-white`}>
                              {getStatusDisplayText(request.status)}
                            </Badge>
                            {request.status === "waiting_for_approval" && (
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-1" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewRequestDetails(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Approve Button - Admin Only */}
                            {user?.role !== "Shop_Owner" &&
                              request.status === "waiting_for_approval" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleApproveRequest(request.id)
                                  }
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}

                            {/* Reject Button - Admin Only */}
                            {user?.role !== "Shop_Owner" &&
                              request.status === "waiting_for_approval" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleRejectRequest(request.id)
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ShopInventoryList;
