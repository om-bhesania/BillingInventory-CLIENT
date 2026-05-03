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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  submissionBatchId?: string | null;
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

type DisplayRow =
  | { type: "single"; request: RestockRequest }
  | { type: "batch"; batchId: string; requests: RestockRequest[] };

function buildPooledRequests(
  all: RestockRequest[],
  searchTerm: string,
  statusFilter: string,
  shopFilter: string
): RestockRequest[] {
  let pool = [...all];
  if (statusFilter !== "all") {
    pool = pool.filter((r) => r.status === statusFilter);
  }
  if (shopFilter !== "all") {
    pool = pool.filter((r) => r.shop.id === shopFilter);
  }
  const st = searchTerm.trim().toLowerCase();
  if (st) {
    const match = (r: RestockRequest) =>
      r.product.name.toLowerCase().includes(st) ||
      r.shop.name.toLowerCase().includes(st) ||
      r.product.sku.toLowerCase().includes(st);
    const batchIds = new Set<string>();
    for (const r of pool) {
      if (r.submissionBatchId && match(r)) {
        batchIds.add(r.submissionBatchId);
      }
    }
    pool = pool.filter(
      (r) =>
        match(r) ||
        (!!r.submissionBatchId && batchIds.has(r.submissionBatchId))
    );
  }
  return pool;
}

function buildDisplayRows(pool: RestockRequest[]): DisplayRow[] {
  const batchGroups = new Map<string, RestockRequest[]>();
  for (const r of pool) {
    if (r.submissionBatchId) {
      const g = batchGroups.get(r.submissionBatchId) ?? [];
      g.push(r);
      batchGroups.set(r.submissionBatchId, g);
    }
  }
  const used = new Set<string>();
  const rows: DisplayRow[] = [];
  for (const [, group] of batchGroups) {
    if (group.length > 1) {
      rows.push({
        type: "batch",
        batchId: group[0].submissionBatchId!,
        requests: group,
      });
      group.forEach((r) => used.add(r.id));
    }
  }
  for (const r of pool) {
    if (!used.has(r.id)) {
      rows.push({ type: "single", request: r });
    }
  }
  return rows;
}

function sortDisplayRows(
  rows: DisplayRow[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): DisplayRow[] {
  const getCreated = (row: DisplayRow) =>
    row.type === "batch"
      ? Math.max(...row.requests.map((x) => new Date(x.createdAt).getTime()))
      : new Date(row.request.createdAt).getTime();
  const getUpdated = (row: DisplayRow) =>
    row.type === "batch"
      ? Math.max(...row.requests.map((x) => new Date(x.updatedAt).getTime()))
      : new Date(row.request.updatedAt).getTime();
  const getProductName = (row: DisplayRow) =>
    row.type === "batch"
      ? row.requests[0]?.product.name ?? ""
      : row.request.product.name;
  const getShopName = (row: DisplayRow) =>
    row.type === "batch"
      ? row.requests[0]?.shop.name ?? ""
      : row.request.shop.name;
  const getStatus = (row: DisplayRow) =>
    row.type === "batch"
      ? row.requests[0]?.status ?? ""
      : row.request.status;
  const getAmount = (row: DisplayRow) =>
    row.type === "batch"
      ? row.requests.reduce((s, x) => s + x.requestedAmount, 0)
      : row.request.requestedAmount;

  return [...rows].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;
    switch (sortBy) {
      case "updatedAt":
        aValue = getUpdated(a);
        bValue = getUpdated(b);
        break;
      case "productName":
        aValue = getProductName(a);
        bValue = getProductName(b);
        break;
      case "shopName":
        aValue = getShopName(a);
        bValue = getShopName(b);
        break;
      case "status":
        aValue = getStatus(a);
        bValue = getStatus(b);
        break;
      case "amount":
        aValue = getAmount(a);
        bValue = getAmount(b);
        break;
      default:
        aValue = getCreated(a);
        bValue = getCreated(b);
    }
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });
}

const RestockManagement: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const wsService = getWebSocketService();

  // Status update dialog — one or many line items (same batch) updated together
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    targets: RestockRequest[];
    newStatus: string;
    notes: string;
  }>({
    open: false,
    targets: [],
    newStatus: "",
    notes: "",
  });

  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    targets: RestockRequest[];
  }>({ open: false, targets: [] });

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
    const pool = buildPooledRequests(
      requests,
      searchTerm,
      statusFilter,
      shopFilter
    );
    const rows = buildDisplayRows(pool);
    setDisplayRows(sortDisplayRows(rows, sortBy, sortOrder));
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

  const openStatusUpdateDialog = (targets: RestockRequest[]) => {
    if (targets.length === 0) return;
    const primary = targets[0];
    setStatusUpdateDialog({
      open: true,
      targets,
      newStatus: primary.status,
      notes: "",
    });
  };

  const closeStatusUpdateDialog = () => {
    setStatusUpdateDialog({
      open: false,
      targets: [],
      newStatus: "",
      notes: "",
    });
  };

  const openDetailsDialog = (targets: RestockRequest[]) => {
    if (targets.length === 0) return;
    setDetailsDialog({ open: true, targets });
  };

  const closeDetailsDialog = () => {
    setDetailsDialog({ open: false, targets: [] });
  };

  const handleStatusUpdate = async () => {
    const { targets, newStatus, notes } = statusUpdateDialog;
    if (targets.length === 0) return;

    try {
      for (const req of targets) {
        await service({
          url: API_URL.restockRequest.updateStatus(req.id),
          method: "PATCH",
          data: {
            status: newStatus,
            notes: notes || undefined,
          },
        });
      }

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text:
          targets.length > 1
            ? `Updated ${targets.length} line items to ${newStatus}`
            : `Restock request status updated to ${newStatus}`,
      });

      closeStatusUpdateDialog();
      fetchRequests();
    } catch (error: any) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        text: error?.response?.data?.error ?? "Update failed",
        timer: 3000,
      });
    }
  };

  const handleSoftDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const result = await Swal.fire({
      title: ids.length > 1 ? "Hide requests?" : "Hide Request?",
      text:
        ids.length > 1
          ? `This will hide ${ids.length} restock line items from the list. They remain in the database.`
          : "This will hide the restock request from the list. It won't be visible anymore but will be preserved in the database.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, hide",
    });

    if (result.isConfirmed) {
      try {
        for (const requestId of ids) {
          await service({
            url: API_URL.restockRequest.hide(requestId),
            method: "DELETE",
          });
        }

        setRequests((prevRequests) =>
          prevRequests.filter((req) => !ids.includes(req.id))
        );

        Swal.fire({
          icon: "success",
          title: "Hidden!",
          text:
            ids.length > 1
              ? `${ids.length} requests hidden from the list.`
              : "Restock request has been hidden from the list.",
        });
      } catch (error) {
        console.error("Error hiding request:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to hide request(s)",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      waiting_for_approval: "bg-orange-500",
      pending: "bg-yellow-500",
      approved: "bg-blue-500",
      approved_pending: "bg-cyan-600",
      in_transit: "bg-purple-500",
      fulfilled: "bg-green-500",
      rejected: "bg-red-500",
      cancelled: "bg-gray-500",
      mixed: "bg-amber-600",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusDisplayText = (status: string) => {
    const displayTexts = {
      waiting_for_approval: "Waiting for Approval",
      pending: "Pending",
      approved: "Approved",
      approved_pending: "Approved (pending)",
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

  const statusPrimary = statusUpdateDialog.targets[0];
  const statusBatchCount = statusUpdateDialog.targets.length;
  const statusBatchMixed =
    statusBatchCount > 1 &&
    new Set(statusUpdateDialog.targets.map((t) => t.status)).size > 1;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Restock Request Management
        </h1>
        <Badge variant="secondary" className="text-sm">
          {displayRows.length} row{displayRows.length !== 1 ? "s" : ""} ·{" "}
          {requests.length} line item{requests.length !== 1 ? "s" : ""}
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
                <SelectItem value="approved_pending">
                  Approved (pending)
                </SelectItem>
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
                {displayRows.map((row) => {
                  const isBatch = row.type === "batch";
                  const targets = isBatch ? row.requests : [row.request];
                  const primary = targets[0];
                  const typeLabel = (primary.requestType || "RESTOCK").replace(
                    "_",
                    " "
                  );
                  const totalUnits = targets.reduce(
                    (s, r) => s + r.requestedAmount,
                    0
                  );
                  const statuses = new Set(targets.map((r) => r.status));
                  const rowStatus =
                    statuses.size === 1 ? primary.status : "mixed";
                  const createdLabel = new Date(
                    Math.max(...targets.map((r) => new Date(r.createdAt).getTime()))
                  ).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  });

                  return (
                    <tr
                      key={isBatch ? `batch-${row.batchId}` : primary.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">{typeLabel}</Badge>
                          {isBatch && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              {targets.length} items · one submission
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {isBatch ? (
                          <div>
                            <div className="font-medium">
                              Multiple products
                            </div>
                            <div className="text-sm text-gray-500">
                              Open details to see each line
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {primary.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {primary.product.sku} •{" "}
                              {primary.product.category.name} •{" "}
                              {primary.product.flavor.name}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{primary.shop.name}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {isBatch
                            ? `${totalUnits} units (${targets.length} lines)`
                            : `${primary.requestedAmount} units`}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`${getStatusColor(rowStatus)} text-white`}
                        >
                          {rowStatus === "mixed"
                            ? "Mixed statuses"
                            : getStatusDisplayText(primary.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-500">
                          {createdLabel}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsDialog(targets)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStatusUpdateDialog(targets)}
                            title="Update status for all lines in this row"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSoftDelete(targets.map((r) => r.id))
                            }
                            className="text-orange-600 hover:text-orange-700"
                            title="Hide request(s)"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading ? (
              <LoadingSpinner />
            ) : displayRows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No restock requests found matching your criteria.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Request line item(s) details */}
      <Dialog
        open={detailsDialog.open}
        onOpenChange={(open) => {
          if (!open) closeDetailsDialog();
        }}
      >
        <DialogContent
          className={
            detailsDialog.targets.length > 1
              ? "sm:max-w-2xl max-h-[85vh] flex flex-col"
              : "sm:max-w-lg"
          }
        >
          <DialogHeader>
            <DialogTitle>
              {detailsDialog.targets.length > 1
                ? `Submission · ${detailsDialog.targets.length} line items`
                : "Restock request details"}
            </DialogTitle>
            <DialogDescription>
              {detailsDialog.targets[0]?.shop.name}
              {detailsDialog.targets.length > 1
                ? " — same batch submitted together from inventory."
                : ""}
            </DialogDescription>
          </DialogHeader>
          {detailsDialog.targets.length === 1 ? (
            (() => {
              const request = detailsDialog.targets[0];
              return (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">
                        Product
                      </h3>
                      <p>
                        <strong>Name:</strong> {request.product.name}
                      </p>
                      <p>
                        <strong>SKU:</strong> {request.product.sku}
                      </p>
                      <p>
                        <strong>Category:</strong>{" "}
                        {request.product.category.name}
                      </p>
                      <p>
                        <strong>Flavor:</strong> {request.product.flavor.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Shop</h3>
                      <p>
                        <strong>Amount:</strong> {request.requestedAmount} units
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {getStatusDisplayText(request.status)}
                      </p>
                      <p>
                        <strong>Type:</strong>{" "}
                        {(request.requestType || "RESTOCK").replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">
                      Timeline
                    </h3>
                    <p>
                      Created:{" "}
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <p>
                      Updated:{" "}
                      {new Date(request.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {request.notes ? (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1">Notes</h3>
                      <p className="whitespace-pre-wrap">{request.notes}</p>
                    </div>
                  ) : null}
                </div>
              );
            })()
          ) : (
            <ScrollArea className="max-h-[50vh] pr-3 border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-2 font-medium">Product</th>
                    <th className="p-2 font-medium">SKU</th>
                    <th className="p-2 font-medium">Units</th>
                    <th className="p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsDialog.targets.map((request) => (
                    <tr key={request.id} className="border-b">
                      <td className="p-2 align-top">{request.product.name}</td>
                      <td className="p-2 align-top text-muted-foreground">
                        {request.product.sku}
                      </td>
                      <td className="p-2 align-top">{request.requestedAmount}</td>
                      <td className="p-2 align-top">
                        {getStatusDisplayText(request.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDetailsDialog}>
              Close
            </Button>
            <Button
              onClick={() => {
                const t = [...detailsDialog.targets];
                closeDetailsDialog();
                openStatusUpdateDialog(t);
              }}
            >
              Update status…
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialog.open}
        onOpenChange={(open) => {
          if (!open) closeStatusUpdateDialog();
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {statusPrimary?.status === "waiting_for_approval"
                ? statusBatchCount > 1
                  ? "Approve or reject batch"
                  : "Approve or Reject Request"
                : "Update Request Status"}
            </DialogTitle>
            <DialogDescription>
              {statusBatchCount > 1 ? (
                <>
                  This action applies to{" "}
                  <strong>{statusBatchCount} line items</strong> from{" "}
                  {statusPrimary?.shop.name}.
                  {statusBatchMixed ? (
                    <span className="block mt-2 text-amber-700">
                      Warning: not all lines share the same current status.
                      The same new status will be sent for each id; invalid
                      transitions may fail partway through.
                    </span>
                  ) : null}
                </>
              ) : statusPrimary?.status === "waiting_for_approval" ? (
                `Review and approve/reject the request for ${statusPrimary?.product.name}`
              ) : (
                `Update status for ${statusPrimary?.product.name}`
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {statusBatchCount > 1 && (
              <ScrollArea className="max-h-32 rounded-md border p-2 text-xs text-muted-foreground">
                <ul className="space-y-1">
                  {statusUpdateDialog.targets.map((r) => (
                    <li key={r.id}>
                      {r.product.name} · {r.requestedAmount} units ·{" "}
                      {getStatusDisplayText(r.status)}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
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
                  {statusPrimary?.status === "waiting_for_approval" ? (
                    <>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusPrimary?.status === "pending" ? (
                    <>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusPrimary?.status === "approved_pending" ? (
                    <>
                      <SelectItem value="approved_pending">
                        Approved (pending fulfillment)
                      </SelectItem>
                      <SelectItem value="fulfilled">Mark as Fulfilled</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusPrimary?.status === "approved" ? (
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
                  ) : // @ts-ignore legacy
                  statusPrimary?.status === "in_transit" ? (
                    <>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="fulfilled">
                        Mark as Fulfilled
                      </SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </>
                  ) : statusPrimary?.status === "fulfilled" ? (
                    <>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    </>
                  ) : statusPrimary?.status === "rejected" ? (
                    <>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </>
                  ) : //@ts-ignore
                  statusPrimary?.status === "cancelled" ? (
                    <>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem
                        value={
                          statusPrimary?.status || "waiting_for_approval"
                        }
                      >
                        {getStatusDisplayText(
                          statusPrimary?.status || "waiting_for_approval"
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
                {statusPrimary?.status === "waiting_for_approval" ||
                statusPrimary?.status === "pending"
                  ? statusUpdateDialog.newStatus === "approved"
                    ? statusBatchCount > 1
                      ? `Approve all (${statusBatchCount})`
                      : "Approve"
                    : statusUpdateDialog.newStatus === "rejected"
                    ? statusBatchCount > 1
                      ? `Reject all (${statusBatchCount})`
                      : "Reject"
                    : statusUpdateDialog.newStatus === "cancelled"
                    ? "Cancel"
                    : "Update Status"
                  : statusPrimary?.status === "approved"
                  ? statusUpdateDialog.newStatus === "in_transit"
                    ? "Mark as In Transit"
                    : statusUpdateDialog.newStatus === "fulfilled"
                    ? statusBatchCount > 1
                      ? `Fulfill all (${statusBatchCount})`
                      : "Mark as Fulfilled"
                    : statusUpdateDialog.newStatus === "cancelled"
                    ? "Cancel"
                    : "Update Status"
                  : statusPrimary?.status === "approved_pending"
                  ? statusUpdateDialog.newStatus === "fulfilled"
                    ? statusBatchCount > 1
                      ? `Fulfill all (${statusBatchCount})`
                      : "Mark as Fulfilled"
                    : statusUpdateDialog.newStatus === "rejected"
                    ? "Reject"
                    : statusUpdateDialog.newStatus === "cancelled"
                    ? "Cancel"
                    : "Update Status"
                  : // @ts-ignore
                  statusPrimary?.status === "in_transit"
                  ? statusUpdateDialog.newStatus === "fulfilled"
                    ? statusBatchCount > 1
                      ? `Fulfill all (${statusBatchCount})`
                      : "Mark as Fulfilled"
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
