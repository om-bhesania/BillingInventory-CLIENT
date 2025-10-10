import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";
import { getWebSocketService } from "@/services/websocketService";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Eye,
  Edit,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  EyeOff,
  CheckCircle,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

interface RestockRequest {
  id: string;
  shopId: string;
  productId: string;
  requestedAmount: number;
  status:
    | "waiting_for_approval"
    | "approved_pending"
    | "fulfilled"
    | "rejected"
    | "pending"
    | "approved";
  requestType?: "RESTOCK" | "INVENTORY_ADD";
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
  const [filteredRequests, setFilteredRequests] = useState<RestockRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const wsService = getWebSocketService();

  // Status update dialog state
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    request: RestockRequest | null;
    newStatus: string;
    notes: string;
  }>({
    open: false,
    request: null,
    newStatus: "",
    notes: "",
  });

  // Check if user is Admin
  if (!user || user.role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You need Admin privileges to access this page.
              </p>
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

  // WebSocket listeners for real-time updates
  useEffect(() => {
    const handleRestockRequestCreated = (data: any) => {
      console.log("Restock request created:", data);
      console.log("Data structure:", JSON.stringify(data, null, 2));
      if (data.notification?.data?.requestId) {
        // Refresh the requests list to get the new request
        fetchRequests();
      } else {
        console.warn(
          "No requestId found in restock request created event:",
          data
        );
      }
    };

    const handleRestockRequestApproved = (data: any) => {
      console.log("Restock request approved:", data);
      if (data.notification?.data?.requestId) {
        // Update the specific request in the list
        setRequests((prev) =>
          prev.map((req) =>
            req.id === data.notification.data.requestId
              ? {
                  ...req,
                  status: "approved",
                  updatedAt: new Date().toISOString(),
                }
              : req
          )
        );
      }
    };

    const handleRestockRequestRejected = (data: any) => {
      console.log("Restock request rejected:", data);
      if (data.notification?.data?.requestId) {
        // Update the specific request in the list
        setRequests((prev) =>
          prev.map((req) =>
            req.id === data.notification.data.requestId
              ? {
                  ...req,
                  status: "rejected",
                  updatedAt: new Date().toISOString(),
                }
              : req
          )
        );
      }
    };

    const handleRestockRequestStatusUpdated = (data: any) => {
      console.log("Restock request status updated:", data);
      if (data.notification?.data?.requestId) {
        // Update the specific request in the list
        setRequests((prev) =>
          prev.map((req) =>
            req.id === data.notification.data.requestId
              ? {
                  ...req,
                  status: data.notification.data.status,
                  updatedAt: new Date().toISOString(),
                }
              : req
          )
        );
      }
    };

    const handleRestockRequestFulfilled = (data: any) => {
      console.log("Restock request fulfilled:", data);
      if (data.notification?.data?.requestId) {
        // Update the specific request in the list
        setRequests((prev) =>
          prev.map((req) =>
            req.id === data.notification.data.requestId
              ? {
                  ...req,
                  status: "fulfilled",
                  updatedAt: new Date().toISOString(),
                }
              : req
          )
        );
      }
    };

    const handleRestockRequestHidden = (data: any) => {
      console.log("Restock request hidden:", data);
      if (data.notification?.data?.requestId) {
        // Remove the hidden request from the list
        setRequests((prev) =>
          prev.filter((req) => req.id !== data.notification.data.requestId)
        );
      }
    };

    const handleRestockRequestAutoGenerated = (data: any) => {
      console.log("Restock request auto generated:", data);
      if (data.notification?.data?.requestId) {
        // Refresh the requests list to get the new auto-generated request
        fetchRequests();
      }
    };

    // Subscribe to websocket events
    wsService.on("restock_request_created", handleRestockRequestCreated);
    wsService.on("restock_request_approved", handleRestockRequestApproved);
    wsService.on("restock_request_rejected", handleRestockRequestRejected);
    wsService.on(
      "restock_request_status_updated",
      handleRestockRequestStatusUpdated
    );
    wsService.on("restock_request_fulfilled", handleRestockRequestFulfilled);
    wsService.on("restock_request_hidden", handleRestockRequestHidden);
    wsService.on(
      "restock_request_auto_generated",
      handleRestockRequestAutoGenerated
    );

    return () => {
      // Cleanup listeners
      wsService.off("restock_request_created", handleRestockRequestCreated);
      wsService.off("restock_request_approved", handleRestockRequestApproved);
      wsService.off("restock_request_rejected", handleRestockRequestRejected);
      wsService.off(
        "restock_request_status_updated",
        handleRestockRequestStatusUpdated
      );
      wsService.off("restock_request_fulfilled", handleRestockRequestFulfilled);
      wsService.off("restock_request_hidden", handleRestockRequestHidden);
      wsService.off(
        "restock_request_auto_generated",
        handleRestockRequestAutoGenerated
      );
    };
  }, [wsService]);

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
          request.product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
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

  const openStatusUpdateDialog = (request: RestockRequest) => {
    setStatusUpdateDialog({
      open: true,
      request,
      newStatus: request.status,
      notes: "",
    });
  };

  const closeStatusUpdateDialog = () => {
    setStatusUpdateDialog({
      open: false,
      request: null,
      newStatus: "",
      notes: "",
    });
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdateDialog.request) return;

    try {
      await service({
        url: API_URL.restockRequest.updateStatus(statusUpdateDialog.request.id),
        method: "PATCH",
        data: {
          status: statusUpdateDialog.newStatus,
          notes: statusUpdateDialog.notes || undefined,
        },
      });

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Restock request status updated to ${statusUpdateDialog.newStatus}`,
      });

      closeStatusUpdateDialog();
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        text: error?.response?.data.error,
        timer: 3000,
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
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.id !== requestId)
        );
        setFilteredRequests((prevFiltered) =>
          prevFiltered.filter((req) => req.id !== requestId)
        );

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
              <p><strong>Requested Amount:</strong> ${
                request.requestedAmount
              } units</p>
              <p><strong>Status:</strong> <span class="px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[request.status as keyof typeof statusColors] ||
                "bg-gray-100 text-gray-800"
              }">${request.status}</span></p>
            </div>
          </div>
          <div>
            <h3 class="font-semibold text-gray-700">Timeline</h3>
            <p><strong>Created:</strong> ${new Date(
              request.createdAt
            ).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> ${new Date(
              request.updatedAt
            ).toLocaleString()}</p>
          </div>
          ${
            request.notes
              ? `<div><h3 class="font-semibold text-gray-700">Notes</h3><p>${request.notes}</p></div>`
              : ""
          }
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
      waiting_for_approval: "bg-orange-500",
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      in_transit: "bg-purple-500",
      fulfilled: "bg-green-500",
      rejected: "bg-red-500",
      cancelled: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusDisplayText = (status: string) => {
    const displayTexts = {
      waiting_for_approval: "Waiting for Approval",
      pending: "Pending",
      approved: "Approved",
      in_transit: "In Transit",
      fulfilled: "Fulfilled",
      rejected: "Rejected",
      cancelled: "Cancelled",
    };
    return displayTexts[status as keyof typeof displayTexts] || status;
  };

  const getUniqueShops = () => {
    const shops = requests.map((request) => request.shop);
    return Array.from(new Map(shops.map((shop) => [shop.id, shop])).values());
  };

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
                <SelectItem value="waiting_for_approval">
                  Waiting for Approval
                </SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

      {/* Search, Filter, and Sort Controls */}

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
                  <th className="text-left p-3 font-medium">Type</th>
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
                      <Badge variant="outline">
                        {(request.requestType || "RESTOCK").replace("_", " ")}
                      </Badge>
                    </td>
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
                        {getStatusDisplayText(request.status)}
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
                          onClick={() => openStatusUpdateDialog(request)}
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
            {loading ? (
              <LoadingSpinner />
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No restock requests found matching your criteria.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialog.open}
        onOpenChange={closeStatusUpdateDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusUpdateDialog.request?.status === "waiting_for_approval"
                ? "Approve or Reject Request"
                : "Update Request Status"}
            </DialogTitle>
            <DialogDescription>
              {statusUpdateDialog.request?.status === "waiting_for_approval"
                ? `Review and approve/reject the request for ${statusUpdateDialog.request?.product.name}`
                : `Update status for ${statusUpdateDialog.request?.product.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status-select">New Status</Label>
              <Select
                value={statusUpdateDialog.newStatus}
                onValueChange={(value) =>
                  setStatusUpdateDialog((prev) => ({
                    ...prev,
                    newStatus: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusUpdateDialog.request?.status ===
                  "waiting_for_approval" ? (
                    // For waiting for approval requests, show approve/reject/cancel options
                    <>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusUpdateDialog.request?.status === "pending" ? (
                    // For pending requests, show approve/reject/cancel options
                    <>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusUpdateDialog.request?.status === "approved" ? (
                    // For approved requests, show in_transit/fulfilled/cancel options
                    <>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in_transit">
                        Mark as In Transit
                      </SelectItem>
                      <SelectItem value="fulfilled">
                        Mark as Fulfilled
                      </SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : // @ts-ignore
                  statusUpdateDialog.request?.status === "in_transit" ? (
                    // For in_transit requests, show fulfilled/cancel options
                    <>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="fulfilled">
                        Mark as Fulfilled
                      </SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusUpdateDialog.request?.status === "fulfilled" ? (
                    // For fulfilled requests, show current status only
                    <>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    </>
                  ) : statusUpdateDialog.request?.status === "rejected" ? (
                    // For rejected requests, show current status only
                    <>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </>
                  ) : //@ts-ignore
                  statusUpdateDialog.request?.status === "cancelled" ? (
                    // For cancelled requests, show current status only
                    <>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </>
                  ) : (
                    // For other statuses, show current status only
                    <>
                      <SelectItem
                        value={
                          statusUpdateDialog.request?.status ||
                          "waiting_for_approval"
                        }
                      >
                        {getStatusDisplayText(
                          statusUpdateDialog.request?.status ||
                            "waiting_for_approval"
                        )}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-notes">Notes (Optional)</Label>
              <Textarea
                id="status-notes"
                placeholder="Add any notes about this status change..."
                value={statusUpdateDialog.notes}
                onChange={(e) =>
                  setStatusUpdateDialog((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeStatusUpdateDialog}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>
                {statusUpdateDialog.request?.status ===
                  "waiting_for_approval" ||
                statusUpdateDialog.request?.status === "pending"
                  ? statusUpdateDialog.newStatus === "approved"
                    ? "Approve"
                    : statusUpdateDialog.newStatus === "rejected"
                    ? "Reject"
                    : statusUpdateDialog.newStatus === "cancelled"
                    ? "Cancel"
                    : "Update Status"
                  : statusUpdateDialog.request?.status === "approved"
                  ? statusUpdateDialog.newStatus === "in_transit"
                    ? "Mark as In Transit"
                    : statusUpdateDialog.newStatus === "fulfilled"
                    ? "Mark as Fulfilled"
                    : statusUpdateDialog.newStatus === "cancelled"
                    ? "Cancel"
                    : "Update Status"
                    //@ts-ignore
                  : statusUpdateDialog.request?.status === "in_transit"
                  ? statusUpdateDialog.newStatus === "fulfilled"
                    ? "Mark as Fulfilled"
                    : statusUpdateDialog.newStatus === "cancelled"
                    ? "Cancel"
                    : "Update Status"
                  : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestockManagement;
