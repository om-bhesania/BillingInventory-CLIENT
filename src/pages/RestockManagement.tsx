import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/Loader";
import { Trash2, Eye, Edit, Search, Filter, SortAsc, SortDesc, EyeOff } from "lucide-react";
import Swal from "sweetalert2";

interface RestockRequest {
  id: string;
  shopId: string;
  productId: string;
  requestedAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shop: {
    id: string;
    name: string;
    managerId?: string;
  };
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
}

const RestockManagement: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Check if user is Admin
  if (!user || user.role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-gray-600">You need Admin privileges to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, statusFilter, shopFilter, sortBy, sortOrder]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await service({
        url: API_URL.restockRequest.getAll,
        method: "GET",
      });
      setRequests(response as RestockRequest[]);
    } catch (error) {
      console.error("Error fetching restock requests:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch restock requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    // Apply shop filter
    if (shopFilter !== "all") {
      filtered = filtered.filter((request) => request.shop.id === shopFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case "productName":
          aValue = a.product.name;
          bValue = b.product.name;
          break;
        case "shopName":
          aValue = a.shop.name;
          bValue = b.shop.name;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "amount":
          aValue = a.requestedAmount;
          bValue = b.requestedAmount;
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

  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    try {
      await service({
        url: API_URL.restockRequest.updateStatus(requestId),
        method: "PATCH",
        data: {
          status: newStatus,
          notes,
        },
      });

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Restock request status updated to ${newStatus}`,
      });

      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status",
      });
    }
  };

  const handleSoftDelete = async (requestId: string) => {
    const result = await Swal.fire({
      title: "Hide Request?",
      text: "This will hide the restock request from the list. It won't be visible anymore but will be preserved in the database.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, hide it!",
    });

    if (result.isConfirmed) {
      try {
        await service({
          url: API_URL.restockRequest.hide(requestId),
          method: "DELETE",
        });

        // Remove from frontend state immediately (like notifications do)
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        setFilteredRequests(prevFiltered => prevFiltered.filter(req => req.id !== requestId));

        Swal.fire({
          icon: "success",
          title: "Hidden!",
          text: "Restock request has been hidden from the list.",
        });
      } catch (error) {
        console.error("Error hiding request:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to hide request",
        });
      }
    }
  };

  const viewRequestDetails = (request: RestockRequest) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      in_transit: "bg-purple-100 text-purple-800",
      fulfilled: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

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
              <h3 class="font-semibold text-gray-700">Shop Information</h3>
              <p><strong>Shop Name:</strong> ${request.shop.name}</p>
              <p><strong>Requested Amount:</strong> ${request.requestedAmount} units</p>
              <p><strong>Status:</strong> <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}">${request.status}</span></p>
            </div>
          </div>
          <div>
            <h3 class="font-semibold text-gray-700">Timeline</h3>
            <p><strong>Created:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> ${new Date(request.updatedAt).toLocaleString()}</p>
          </div>
          ${request.notes ? `<div><h3 class="font-semibold text-gray-700">Notes</h3><p>${request.notes}</p></div>` : ''}
        </div>
      `,
      width: "600px",
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: "swal2-custom-container",
        popup: "swal2-custom-popup",
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      accepted: "bg-blue-500",
      in_transit: "bg-purple-500",
      fulfilled: "bg-green-500",
      rejected: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getUniqueShops = () => {
    const shops = requests.map((request) => request.shop);
    return Array.from(new Map(shops.map((shop) => [shop.id, shop])).values());
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Restock Request Management
        </h1>
        <Badge variant="secondary" className="text-sm">
          {filteredRequests.length} of {requests.length} requests
        </Badge>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, shops, SKU..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Shop Filter */}
            <Select value={shopFilter} onValueChange={setShopFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by shop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shops</SelectItem>
                {getUniqueShops().map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
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
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="productName">Product Name</SelectItem>
                  <SelectItem value="shopName">Shop Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
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

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Restock Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Shop</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">
                          {request.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.product.sku} •{" "}
                          {request.product.category.name} •{" "}
                          {request.product.flavor.name}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{request.shop.name}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {request.requestedAmount} units
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`${getStatusColor(
                          request.status
                        )} text-white`}
                      >
                        {request.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            Swal.fire({
                              title: "Update Status",
                              html: `
                                <div class="space-y-4">
                                  <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                                    <select id="status-select" class="w-full p-2 border border-gray-300 rounded-md">
                                      <option value="pending">Pending</option>
                                      <option value="accepted">Accepted</option>
                                      <option value="in_transit">In Transit</option>
                                      <option value="fulfilled">Fulfilled</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                    <textarea id="status-notes" class="w-full p-2 border border-gray-300 rounded-md" rows="3" placeholder="Add any notes about this status change..."></textarea>
                                  </div>
                                </div>
                              `,
                              showCancelButton: true,
                              confirmButtonText: "Update Status",
                              preConfirm: () => {
                                const status = (
                                  document.getElementById(
                                    "status-select"
                                  ) as HTMLSelectElement
                                ).value;
                                const notes = (
                                  document.getElementById(
                                    "status-notes"
                                  ) as HTMLTextAreaElement
                                ).value;
                                return { status, notes };
                              },
                            }).then((result) => {
                              if (result.isConfirmed) {
                                handleStatusUpdate(
                                  request.id,
                                  result.value.status,
                                  result.value.notes
                                );
                              }
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSoftDelete(request.id)}
                          className="text-orange-600 hover:text-orange-700"
                          title="Hide Request"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No restock requests found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestockManagement;
