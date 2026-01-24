import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useToast from "@/hooks/use-toast";
import {
  getRawMaterialInventories,
  getLowStockItems,
  updateRawMaterialInventory,
  initializeInventory,
} from "@/apis/rawMaterialInventoryApi";
import { getRawMaterials } from "@/apis/rawMaterialApi";
import LoadingSpinner from "@/components/ui/Loader";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  Search,
  Package,
  AlertTriangle,
  Edit,
  Plus,
  TrendingDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface RawMaterialInventory {
  id: string;
  rawMaterialId: string;
  quantity: number;
  minStockLevel: number;
  location: string;
  lastUpdated: string;
  rawMaterial: {
    id: string;
    name: string;
    unit: string;
  };
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
}

const RawMaterialInventoryView = () => {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [inventories, setInventories] = useState<RawMaterialInventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<RawMaterialInventory[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<RawMaterialInventory | null>(null);
  const [formData, setFormData] = useState({
    rawMaterialId: "",
    quantity: "",
    minStockLevel: "",
    location: "Factory",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterInventories();
  }, [inventories, locationFilter, searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [inventoriesData, materialsData] = await Promise.all([
        getRawMaterialInventories(),
        getRawMaterials(),
      ]);
      setInventories(inventoriesData || []);
      setRawMaterials(materialsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        text: "Failed to fetch inventory data",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterInventories = () => {
    let filtered = [...inventories];

    if (locationFilter !== "all") {
      filtered = filtered.filter((inv) => inv.location === locationFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.rawMaterial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.rawMaterial.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInventories(filtered);
  };

  const handleInitializeInventory = async () => {
    try {
      await initializeInventory({
        rawMaterialId: formData.rawMaterialId,
        quantity: parseFloat(formData.quantity),
        minStockLevel: parseFloat(formData.minStockLevel) || 0,
        location: formData.location,
      });
      toast({
        title: "Success",
        text: "Inventory initialized successfully",
        type: "success",
      });
      setIsDialogOpen(false);
      setFormData({
        rawMaterialId: "",
        quantity: "",
        minStockLevel: "",
        location: "Factory",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        text: error?.response?.data?.error || "Failed to initialize inventory",
        type: "error",
      });
    }
  };

  const handleUpdateInventory = async (id: string, data: any) => {
    try {
      await updateRawMaterialInventory(id, data);
      toast({
        title: "Success",
        text: "Inventory updated successfully",
        type: "success",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        text: error?.response?.data?.error || "Failed to update inventory",
        type: "error",
      });
    }
  };

  const isLowStock = (inventory: RawMaterialInventory) => {
    return inventory.quantity <= inventory.minStockLevel;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Material Inventory</h1>
          <p className="text-gray-600 mt-1">
            Track and manage raw material stock levels
          </p>
        </div>
        {hasPermission("Raw Materials", "write") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Initialize Inventory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Initialize Raw Material Inventory</DialogTitle>
                <DialogDescription>
                  Set initial stock for a raw material
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Raw Material</Label>
                  <Select
                    value={formData.rawMaterialId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rawMaterialId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select raw material" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials
                        .filter(
                          (m) =>
                            !inventories.some(
                              (inv) =>
                                inv.rawMaterialId === m.id &&
                                inv.location === formData.location
                            )
                        )
                        .map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Factory">Factory</SelectItem>
                      <SelectItem value="Storeroom">Storeroom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    placeholder="0.000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock Level</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockLevel: e.target.value })
                    }
                    placeholder="0.000"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInitializeInventory}>
                    Initialize
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search raw materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Factory">Factory</SelectItem>
                <SelectItem value="Storeroom">Storeroom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Levels</CardTitle>
          <CardDescription>
            {filteredInventories.length} inventory records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No inventory records found
              </p>
              <p className="text-gray-500">
                Initialize inventory for raw materials to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raw Material</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventories.map((inventory) => {
                    const lowStock = isLowStock(inventory);
                    return (
                      <TableRow key={inventory.id}>
                        <TableCell className="font-medium">
                          {inventory.rawMaterial.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{inventory.location}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                lowStock ? "text-orange-600 font-medium" : ""
                              }
                            >
                              {inventory.quantity} {inventory.rawMaterial.unit}
                            </span>
                            {lowStock && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {inventory.minStockLevel}{" "}
                          {inventory.rawMaterial.unit}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={lowStock ? "destructive" : "default"}
                          >
                            {lowStock ? "Low Stock" : "In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(inventory.lastUpdated).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {hasPermission("Raw Materials", "update") && (
                            <EditInventoryDialog
                              inventory={inventory}
                              onUpdate={handleUpdateInventory}
                            />
                          )}
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

// Edit Inventory Dialog Component
const EditInventoryDialog = ({
  inventory,
  onUpdate,
}: {
  inventory: RawMaterialInventory;
  onUpdate: (id: string, data: any) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(inventory.quantity.toString());
  const [minStockLevel, setMinStockLevel] = useState(
    inventory.minStockLevel.toString()
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onUpdate(inventory.id, {
        quantity: parseFloat(quantity),
        minStockLevel: parseFloat(minStockLevel),
        notes,
      });
      setIsOpen(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Inventory</DialogTitle>
          <DialogDescription>
            Adjust stock levels for {inventory.rawMaterial.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quantity ({inventory.rawMaterial.unit})</Label>
            <Input
              type="number"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Min Stock Level ({inventory.rawMaterial.unit})</Label>
            <Input
              type="number"
              step="0.001"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RawMaterialInventoryView;

