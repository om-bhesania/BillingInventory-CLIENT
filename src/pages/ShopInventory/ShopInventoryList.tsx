import {
  createRestockRequest,
  getRestockRequests,
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
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Shop {
  id: string;
  name: string;
}

function ShopInventoryList() {
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<
    ShopInventoryItem[]
  >([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopInventoryItem | null>(
    null
  );
  const [newStock, setNewStock] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [requestingItem, setRequestingItem] =
    useState<ShopInventoryItem | null>(null);
  const [requestQuantity, setRequestQuantity] = useState<number>(0);
  const [requestNotes, setRequestNotes] = useState<string>("");
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { toast } = useToast();
  const { user } = usePingUser();

  // Get user's shop IDs from ping data
  const userShopIds = user?.managedShops?.map((shop) => shop.id) || [];

  // Use useApi for fetching restock requests when a shop is selected
  const {
    data: restockRequestsData,
    loading: restockRequestsLoading,
    error: restockRequestsError,
    execute: fetchRestockRequests,
  } = useApi(API_URL.restockRequest.getByShopId(selectedShopId), "GET");

  useEffect(() => {
    console.log("shopData", restockRequestsData);
    const fetchShops = async () => {
      try {
        if (user?.role === "Shop_Owner") {
          const userShops = user.managedShops || [];
          setShops(userShops as Shop[]);
          if (userShops.length > 0) {
            setSelectedShopId(userShops[0].id);
          }
        } else {
          const shopsData: any = await getShop();
          setShops(shopsData as Shop[]);

          if (userShopIds.length > 0) {
            setSelectedShopId(userShopIds[0]);
          } else if (shopsData.length > 0) {
            setSelectedShopId(shopsData[0].id);
          }
        }
      } catch (error) {
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
  }, [user]); // Depend on user and userShopIds

  useEffect(() => {
    if (selectedShopId) {
      fetchInventory();
      // Fetch restock requests for the selected shop
      fetchRestockRequests();
    }
  }, [selectedShopId, fetchRestockRequests]);

  useEffect(() => {
    filterAndSortInventory();
  }, [inventory, searchTerm, stockFilter, categoryFilter, sortBy, sortOrder]);

  const filterAndSortInventory = () => {
    let filtered = [...inventory];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.category.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.product.flavor.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply stock filter
    if (stockFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getStockStatus(
          item.currentStock,
          item.product.minStockLevel
        );
        return status === stockFilter;
      });
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.product.category.name === categoryFilter
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
        case "currentStock":
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case "unitPrice":
          aValue = a.product.unitPrice;
          bValue = b.product.unitPrice;
          break;
        case "category":
          aValue = a.product.category.name;
          bValue = b.product.category.name;
          break;
        case "lastRestockDate":
          aValue = a.lastRestockDate
            ? new Date(a.lastRestockDate)
            : new Date(0);
          bValue = b.lastRestockDate
            ? new Date(b.lastRestockDate)
            : new Date(0);
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

  const fetchInventory = async () => {
    if (!selectedShopId) return;

    setIsLoading(true);
    try {
      const inventoryData = await getShopInventory(selectedShopId);
      setInventory(inventoryData);
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to fetch inventory",
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
      setInventory((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, currentStock: newStock }
            : item
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
        fetchInventory();
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

      // Refresh the inventory list
      fetchInventory();
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

  // Function to check if there's a restock request in "in_transit" status for a product
  const hasInTransitRequest = (productId: string) => {
    if (!restockRequestsData || !Array.isArray(restockRequestsData))
      return false;

    return restockRequestsData.some(
      (request) =>
        request.productId === productId &&
        request.status === "in_transit" &&
        !request.hidden // Don't show for hidden requests
    );
  };

  const openRequestModal = (item: ShopInventoryItem) => {
    setRequestingItem(item);
    const defaultQty = Math.max((item.product.minStockLevel || 10) * 2, 1);
    setRequestQuantity(defaultQty);
    setRequestNotes("");
  };

  const submitRestockRequest = async () => {
    if (!requestingItem || requestQuantity <= 0) return;
    setIsRequesting(true);
    try {
      await createRestockRequest({
        shopId: requestingItem.shopId,
        productId: requestingItem.productId,
        requestedAmount: requestQuantity,
        notes: requestNotes?.trim() || undefined,
      });
      toast({
        title: "Request submitted",
        text: `Requested ${requestQuantity} units of ${requestingItem.product.name}`,
        type: "success",
      });
      setRequestingItem(null);
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to create restock request",
        type: "error",
      });
    } finally {
      setIsRequesting(false);
    }
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

  const getUniqueCategories = () => {
    const categories = inventory.map((item) => item.product.category.name);
    return Array.from(new Set(categories));
  };

  const viewProductDetails = (item: ShopInventoryItem) => {
    const stockStatus = getStockStatus(
      item.currentStock,
      item.product.minStockLevel
    );

    Swal.fire({
      title: "Product Details",
      html: `
        <div class="text-left space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold text-gray-700">Product Information</h3>
              <p><strong>Name:</strong> ${item.product.name}</p>
              <p><strong>SKU:</strong> ${item.product.sku}</p>
              <p><strong>Category:</strong> ${item.product.category.name}</p>
              <p><strong>Flavor:</strong> ${item.product.flavor.name}</p>
              <p><strong>Unit Price:</strong> ₹${item.product.unitPrice}</p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-700">Stock Information</h3>
              <p><strong>Current Stock:</strong> ${item.currentStock} units</p>
              <p><strong>Min Stock Level:</strong> ${
                item.product.minStockLevel || "Not set"
              }</p>
              <p><strong>Status:</strong> <span class="px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(
                stockStatus
              )} text-white">${getStockStatusText(stockStatus)}</span></p>
              ${
                item.lastRestockDate
                  ? `<p><strong>Last Restock:</strong> ${new Date(
                      item.lastRestockDate
                    ).toLocaleDateString()}</p>`
                  : ""
              }
            </div>
          </div>
          ${
            hasInTransitRequest(item.product.id)
              ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex items-center gap-2 text-blue-800">
                <Package className="h-4 w-4" />
                <span class="text-sm font-medium">Restock Request In Transit</span>
              </div>
              <p class="text-xs text-blue-600 mt-1">This product has a restock request that is currently being fulfilled.</p>
            </div>
          `
              : ""
          }
        </div>
      `,
      width: "600px",
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      backdrop: true,
      customClass: {
        container: "swal2-custom-container",
        popup: "swal2-custom-popup",
      },
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
            Shop Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage product inventory across different shops
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredInventory.length} of {inventory.length} products
        </Badge>
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

            {/* Stock Status Filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="normal">Normal Stock</SelectItem>
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
                  <SelectItem value="currentStock">Current Stock</SelectItem>
                  <SelectItem value="unitPrice">Unit Price</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="lastRestockDate">Last Restock</SelectItem>
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
          <CardTitle className="text-lg">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {inventory.length === 0
                  ? "No inventory found"
                  : "No matching products"}
              </p>
              <p className="text-gray-500">
                {inventory.length === 0
                  ? "Add products to this shop to get started."
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
                    <th className="text-left p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Price</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(
                      item.currentStock,
                      item.product.minStockLevel
                    );

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">
                              {item.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product.sku} • {item.product.flavor.name}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {item.product.category.name}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {item.currentStock} units
                          </div>
                          {item.product.minStockLevel && (
                            <div className="text-sm text-gray-500">
                              Min: {item.product.minStockLevel}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            ₹{item.product.unitPrice}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className=" flex items-center gap-2">
                            <Badge
                              className={`${getStockStatusColor(
                                stockStatus
                              )} text-white`}
                            >
                              {getStockStatusText(stockStatus)}
                            </Badge>
                            {stockStatus === "low-stock" && (
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-1" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewProductDetails(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Update Stock Dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setNewStock(item.currentStock);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Update Stock for {item.product.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Enter the new stock level for this product.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="new-stock">
                                      New Stock Level
                                    </Label>
                                    <Input
                                      id="new-stock"
                                      type="number"
                                      min="0"
                                      value={newStock}
                                      onChange={(e) =>
                                        setNewStock(Number(e.target.value))
                                      }
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingItem(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleUpdateStock}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating
                                        ? "Updating..."
                                        : "Update Stock"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Restock Request Button */}
                            {(stockStatus === "low-stock" ||
                              stockStatus === "out-of-stock") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRequestModal(item)}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <TrendingDown className="h-4 w-4 mr-1" />
                                Request Restock
                              </Button>
                            )}

                            {/* Order Received Button */}
                            {hasInTransitRequest(item.product.id) && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleOrderReceived(
                                    selectedShopId,
                                    item.product.id
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Received
                              </Button>
                            )}

                            {/* Remove Product Button */}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveProduct(item.id)}
                              disabled={isRemoving === item.id}
                            >
                              {isRemoving === item.id
                                ? "Removing..."
                                : "Remove"}
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
      {/* Create Restock Request Modal */}
      <Dialog
        open={!!requestingItem}
        onOpenChange={(open) => !open && setRequestingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Request</DialogTitle>
            <DialogDescription>
              {requestingItem
                ? `Request additional units for ${requestingItem.product.name}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {requestingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Current Stock</Label>
                  <div className="mt-1 p-2 border rounded-md bg-gray-50">
                    {requestingItem.currentStock}
                  </div>
                </div>
                <div>
                  <Label>Min Stock Level</Label>
                  <div className="mt-1 p-2 border rounded-md bg-gray-50">
                    {requestingItem.product.minStockLevel ?? "Not set"}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="request-qty">Requested Quantity</Label>
                <Input
                  id="request-qty"
                  type="number"
                  min={1}
                  value={requestQuantity}
                  onChange={(e) =>
                    setRequestQuantity(Math.max(Number(e.target.value || 0), 1))
                  }
                />
              </div>
              <div>
                <Label htmlFor="request-notes">Notes (optional)</Label>
                <Textarea
                  id="request-notes"
                  placeholder="Add any instructions or context"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRequestingItem(null)}
                >
                  Cancel
                </Button>
                <Button onClick={submitRestockRequest} disabled={isRequesting}>
                  {isRequesting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ShopInventoryList;
