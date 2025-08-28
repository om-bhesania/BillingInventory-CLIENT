// 🚀 Demo: Refactoring RestockManagement to use useApi Hook
// This shows the before/after comparison

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
import { ErrorMessage } from "formik";
import { useDelete, useGet, usePatch } from "./useApi";
import { RestockRequest } from "@/apis/restockRequestApi";

// 🎯 BEFORE: Using direct service calls with manual state management
const RestockManagementBefore = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Manual API call with state management
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

  // Manual status update with state management
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

  // Manual soft delete with state management
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

        // Remove from frontend state immediately
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

  useEffect(() => {
    fetchRequests();
  }, []);

  // ... rest of component logic
};

// 🎯 AFTER: Using useApi hook - Much cleaner and simpler!
const RestockManagementAfter = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 🚀 Clean API calls using useApi hook
  const { 
    data: requests, 
    loading, 
    error, 
    execute: fetchRequests 
  } = useGet(API_URL.restockRequest.getAll, { immediate: true });

  const { 
    data: updateResult, 
    loading: updating, 
    error: updateError, 
    execute: updateStatus 
  } = usePatch('/restock-requests');

  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteRequest 
  } = useDelete('/restock-requests');

  // 🎯 Simplified handlers - no manual state management needed
  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    const result = await updateStatus({
      url: API_URL.restockRequest.updateStatus(requestId),
      data: { status: newStatus, notes }
    });
    
    if (result) {
      fetchRequests(); // Refresh the list
    }
  };

  const handleSoftDelete = async (requestId: string) => {
    const result = await Swal.fire({
      title: "Hide Request?",
      text: "This will hide the restock request from the list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, hide it!",
    });

    if (result.isConfirmed) {
      const success = await deleteRequest({ id: requestId });
      if (success) {
        fetchRequests(); // Refresh the list
      }
    }
  };

  // ... rest of component logic (filtering, sorting, etc.)
};

// 🎯 EVEN BETTER: Using specialized hooks for specific operations
const RestockManagementOptimized = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 🚀 Specialized hooks for each operation
  const { 
    data: requests, 
    loading, 
    error, 
    execute: fetchRequests 
  } = useGet(API_URL.restockRequest.getAll, { immediate: true });

  const { 
    data: updateResult, 
    loading: updating, 
    error: updateError, 
    execute: updateStatus 
  } = usePatch('/restock-requests');

  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteRequest 
  } = useDelete('/restock-requests');

  // 🎯 Clean, focused handlers
  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    const result = await updateStatus({
      url: API_URL.restockRequest.updateStatus(requestId),
      data: { status: newStatus, notes }
    });
    
    if (result) {
      fetchRequests(); // Refresh the list
    }
  };

  const handleSoftDelete = async (requestId: string) => {
    const confirmed = await Swal.fire({
      title: "Hide Request?",
      text: "This will hide the restock request from the list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, hide it!",
    });

    if (confirmed.isConfirmed) {
      const success = await deleteRequest({ id: requestId });
      if (success) {
        fetchRequests(); // Refresh the list
      }
    }
  };

  // 🎯 Filter and sort logic (unchanged)
  const filterAndSortRequests = () => {
    if (!requests) return [];
    
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

    return filtered;
  };

  const filteredRequests = filterAndSortRequests();

  // 🎯 Render with clean state management
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage name="error" component="div" />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Restock Request Management</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredRequests.length} of {requests?.length || 0} requests
        </Badge>
      </div>

      {/* Search, Filter, and Sort Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... filter controls ... */}
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
                    {/* ... table cells ... */}
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
                          onClick={() => handleStatusUpdate(request.id, 'accepted')}
                          disabled={updating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSoftDelete(request.id)}
                          disabled={deleting}
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

// 🎯 Key Benefits Demonstrated:
// 1. ✅ No manual loading/error state management
// 2. ✅ Clean, focused API calls
// 3. ✅ Built-in TypeScript support
// 4. ✅ Consistent error handling
// 5. ✅ Easy state reset and refresh
// 6. ✅ Reduced boilerplate code
// 7. ✅ Better separation of concerns

export default RestockManagementOptimized;
