import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useToast from "@/hooks/use-toast";
import { getRawMaterials, deleteRawMaterial } from "@/apis/rawMaterialApi";
import { getRawMaterialInventories } from "@/apis/rawMaterialInventoryApi";
import LoadingSpinner from "@/components/ui/Loader";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  SortAsc,
  SortDesc,
} from "lucide-react";
import Swal from "sweetalert2";

interface RawMaterial {
  id: string;
  name: string;
  description?: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
  inventory?: RawMaterialInventory[];
}

interface RawMaterialInventory {
  id: string;
  rawMaterialId: string;
  quantity: number;
  minStockLevel: number;
  location: string;
}

const RawMaterialList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  useEffect(() => {
    filterAndSortMaterials();
  }, [rawMaterials, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchRawMaterials = async () => {
    try {
      setIsLoading(true);
      const materials = await getRawMaterials();
      setRawMaterials(materials || []);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      toast({
        title: "Error",
        text: "Failed to fetch raw materials",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortMaterials = () => {
    let filtered = [...rawMaterials];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (material) =>
          statusFilter === "active" ? material.isActive : !material.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "unit":
          aValue = a.unit.toLowerCase();
          bValue = b.unit.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredMaterials(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Delete Raw Material?",
      text: `Are you sure you want to delete "${name}"? This will soft delete the material.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteRawMaterial(id);
        toast({
          title: "Success",
          text: "Raw material deleted successfully",
          type: "success",
        });
        fetchRawMaterials();
      } catch (error) {
        toast({
          title: "Error",
          text: "Failed to delete raw material",
          type: "error",
        });
      }
    }
  };

  const getStockLevel = (material: RawMaterial) => {
    const inventory = material.inventory?.[0];
    if (!inventory) return { quantity: 0, isLow: false };
    const isLow = inventory.quantity <= inventory.minStockLevel;
    return { quantity: inventory.quantity, isLow };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-600 mt-1">
            Manage raw materials for your production system
          </p>
        </div>
        {hasPermission("Raw Materials", "write") && (
          <Button onClick={() => navigate("/raw-materials/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Raw Material
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, description, unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="unit">Unit</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Raw Materials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw Materials List</CardTitle>
          <CardDescription>
            {filteredMaterials.length} of {rawMaterials.length} raw materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {rawMaterials.length === 0
                  ? "No raw materials found"
                  : "No matching materials"}
              </p>
              <p className="text-gray-500">
                {rawMaterials.length === 0
                  ? "Add your first raw material to get started."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const stock = getStockLevel(material);
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {material.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{material.unit}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={stock.isLow ? "text-orange-600 font-medium" : ""}>
                              {stock.quantity} {material.unit}
                            </span>
                            {stock.isLow && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={material.isActive ? "default" : "secondary"}
                          >
                            {material.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(material.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {hasPermission("Raw Materials", "read") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(`/raw-materials/edit/${material.id}`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("Raw Materials", "delete") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleDelete(material.id, material.name)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RawMaterialList;

