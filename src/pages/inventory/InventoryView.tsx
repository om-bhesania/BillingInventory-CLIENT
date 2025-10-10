import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePingUser } from "@/hooks/use-pingUser";
import { getWebSocketService } from "@/services/websocketService";
import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/Loader";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Package,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  X,
  Store,
  BarChart3,
  Activity,
} from "lucide-react";
import useToast from "@/hooks/use-toast";

interface ShopInventoryItem {
  id: string;
  shopId: string;
  productId: string;
  currentStock: number;
  minStockPerItem?: number;
  lowStockAlertsEnabled: boolean;
  lastRestockDate?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: {
      name: string;
    };
    flavor: {
      name: string;
    };
  };
  shop: {
    id: string;
    name: string;
  };
}

interface Shop {
  id: string;
  name: string;
}

const InventoryView: React.FC = () => {
  const { user } = useAuth();
  const { user: pingUser } = usePingUser();
  const { toast } = useToast();
  const wsService = getWebSocketService();

  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<ShopInventoryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Get user's shop IDs from ping data
  const userShopIds = pingUser?.managedShops?.map((shop) => shop.id) || [];

  useEffect(() => {
    fetchShops();
  }, [pingUser]);

  useEffect(() => {
    if (selectedShopId) {
      fetchInventory();
    }
  }, [selectedShopId]);

  useEffect(() => {
    filterAndSortInventory();
  }, [inventory, searchTerm, categoryFilter, stockStatusFilter, sortBy, sortOrder]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    const handleRestockRequestApproved = (data: any) => {
      console.log('Restock request approved - updating inventory:', data);
      if (data.notification?.data?.shopId && userShopIds.includes(data.notification.data.shopId)) {
        // Refresh inventory when restock is approved
        fetchInventory();
      }
    };

    const handleRestockRequestFulfilled = (data: any) => {
      console.log('Restock request fulfilled - updating inventory:', data);
      if (data.notification?.data?.shopId && userShopIds.includes(data.notification.data.shopId)) {
        // Refresh inventory when restock is fulfilled
        fetchInventory();
      }
    };

    const handleInventoryUpdate = (data: any) => {
      console.log('Inventory update received:', data);
      if (data.shopId && userShopIds.includes(data.shopId)) {
        // Update specific inventory item
        setInventory(prev => prev.map(item => 
          item.id === data.inventoryId 
            ? { ...item, currentStock: data.newStock, updatedAt: new Date().toISOString() }
            : item
        ));
      }
    };

    // Subscribe to websocket events
    wsService.on('restock_request_approved', handleRestockRequestApproved);
    wsService.on('restock_request_fulfilled', handleRestockRequestFulfilled);
    wsService.on('inventory:update', handleInventoryUpdate);

    return () => {
      // Cleanup listeners
      wsService.off('restock_request_approved', handleRestockRequestApproved);
      wsService.off('restock_request_fulfilled', handleRestockRequestFulfilled);
      wsService.off('inventory:update', handleInventoryUpdate);
    };
  }, [wsService, userShopIds, selectedShopId]);

  const fetchShops = async () => {
    try {
      if (pingUser?.role === "Shop_Owner") {
        const userShops = pingUser.managedShops || [];
        setShops(userShops as Shop[]);
        if (userShops.length > 0) {
          setSelectedShopId(userShops[0].id);
        }
      } else {
        const shopsData: any = await service({
          url: API_URL.shop.getAll,
          method: "GET",
        });
        setShops(shopsData as Shop[]);
        if (shopsData && shopsData.length > 0) {
          setSelectedShopId(shopsData[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast({
        title: "Error",
        description: "Failed to fetch shops",
        variant: "destructive"
      });
    }
  };

  const fetchInventory = async () => {
    if (!selectedShopId) return;

    setLoading(true);
    try {
      const inventoryData = await service({
        url: API_URL.shopInventory.getByShopId(selectedShopId),
        method: "GET",
      });
      setInventory(inventoryData as ShopInventoryItem[]);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortInventory = () => {
    let filtered = [...inventory];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.flavor.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.product.category.name === categoryFilter);
    }

    // Apply stock status filter
    if (stockStatusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getStockStatus(item.currentStock, item.minStockPerItem);
        return status === stockStatusFilter;
      });
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
        case "currentStock":
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case "category":
          aValue = a.product.category.name;
          bValue = b.product.category.name;
          break;
        case "lastRestock":
          aValue = new Date(a.lastRestockDate || a.createdAt);
          bValue = new Date(b.lastRestockDate || b.createdAt);
          break;
        default:
          aValue = a.product.name;
          bValue = b.product.name;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInventory(filtered);
  };

  const getStockStatus = (currentStock: number, minStockLevel?: number) => {
    switch (true) {
      case currentStock === 0:
        return "out-of-stock";
      case minStockLevel && currentStock <= minStockLevel:
        return "low-stock";
      default:
        return "normal";
    }
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

  const getUniqueCategories = () => {
    const categories = inventory.map((item) => item.product.category.name);
    return Array.from(new Set(categories));
  };

  const handleRefresh = async () => {
    if (selectedShopId) {
      await fetchInventory();
    }
  };

  const getInventoryStats = () => {
    const totalItems = inventory.length;
    const outOfStock = inventory.filter(item => getStockStatus(item.currentStock, item.minStockPerItem) === "out-of-stock").length;
    const lowStock = inventory.filter(item => getStockStatus(item.currentStock, item.minStockPerItem) === "low-stock").length;
    const inStock = inventory.filter(item => getStockStatus(item.currentStock, item.minStockPerItem) === "normal").length;
    const totalStockValue = inventory.reduce((sum, item) => sum + item.currentStock, 0);

    return { totalItems, outOfStock, lowStock, inStock, totalStockValue };
  };

  const stats = getInventoryStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory View</h1>
          <p className="text-gray-600 mt-1">
            Monitor your current stock levels and inventory status
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Badge variant="secondary" className="text-sm">
            {filteredInventory.length} of {inventory.length} items
          </Badge>
        </div>
      </div>

      {/* Shop Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shop Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Store className="h-5 w-5 text-gray-500" />
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalStockValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
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

            {/* Stock Status Filter */}
            <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="normal">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
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
                  <SelectItem value="currentStock">Current Stock</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="lastRestock">Last Restock</SelectItem>
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

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {inventory.length === 0 ? "No inventory items found" : "No matching items"}
              </p>
              <p className="text-gray-500">
                {inventory.length === 0
                  ? "Add products to your inventory to get started."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Current Stock</th>
                    <th className="text-left p-3 font-medium">Min Stock</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Last Restock</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item.currentStock, item.minStockPerItem);
                    const statusColor = getStockStatusColor(stockStatus);
                    const statusText = getStockStatusText(stockStatus);

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-gray-500">
                              {item.product.sku} • {item.product.flavor.name}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{item.product.category.name}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-lg">{item.currentStock}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {item.minStockPerItem || "Not set"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusColor} text-white`}>
                              {statusText}
                            </Badge>
                            {stockStatus === "low-stock" && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                            {stockStatus === "out-of-stock" && (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {item.lastRestockDate
                              ? new Date(item.lastRestockDate).toLocaleDateString()
                              : "Never"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // View details - could open a modal or navigate to details page
                                console.log("View details for:", item.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
};

export default InventoryView;
