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
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
} from "lucide-react";
import AddRawMaterialDialog from "@/components/inventory/AddRawMaterialDialog";

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
  description?: string;
  isActive?: boolean;
}

const RawMaterials = () => {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [inventories, setInventories] = useState<RawMaterialInventory[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInitDialogOpen, setIsInitDialogOpen] = useState(false);
  const [initFormData, setInitFormData] = useState({
    rawMaterialId: "",
    quantity: "",
    minStockLevel: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [rawMaterials, searchTerm]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [inventoriesData, materialsData] = await Promise.all([
        getRawMaterialInventories(),
        getRawMaterials(),
      ]);
      setInventories((inventoriesData as RawMaterialInventory[]) || []);
      setRawMaterials((materialsData as RawMaterial[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        text: "Failed to fetch data",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = [...rawMaterials];

    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (material.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredMaterials(filtered);
  };

  const handleAddMaterialSuccess = (newMaterial: {
    id: string;
    name: string;
    unit: string;
  }) => {
    // Add the new material to the list immediately
    setRawMaterials((prev) => [...prev, newMaterial as RawMaterial]);
    // Refresh to get full data
    fetchData();
  };

  const handleInitializeInventory = async () => {
    try {
      if (!initFormData.rawMaterialId) {
        toast({
          title: "Error",
          text: "Please select a raw material",
          type: "error",
        });
        return;
      }

      setIsSubmitting(true);
      await initializeInventory({
        rawMaterialId: initFormData.rawMaterialId,
        quantity: parseFloat(initFormData.quantity),
        minStockLevel: parseFloat(initFormData.minStockLevel) || 0,
      });
      toast({
        title: "Success",
        text: "Inventory initialized successfully",
        type: "success",
      });
      setIsInitDialogOpen(false);
      setInitFormData({
        rawMaterialId: "",
        quantity: "",
        minStockLevel: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        text: error?.response?.data?.error || "Failed to initialize inventory",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
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

  // Get inventory for a specific raw material
  const getMaterialInventory = (materialId: string) => {
    return inventories.filter((inv) => inv.rawMaterialId === materialId);
  };

  // Get materials that don't have inventory initialized
  const materialsWithoutInventory = rawMaterials.filter(
    (material) => !inventories.some((inv) => inv.rawMaterialId === material.id)
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-600 mt-1">
            Manage raw materials and track inventory levels
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("Raw Materials", "write") && (
            <>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Raw Material
              </Button>
              <Dialog open={isInitDialogOpen} onOpenChange={setIsInitDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
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
                    value={initFormData.rawMaterialId}
                    onValueChange={(value) =>
                      setInitFormData({ ...initFormData, rawMaterialId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select raw material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialsWithoutInventory.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Initial Quantity</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={initFormData.quantity}
                    onChange={(e) =>
                      setInitFormData({
                        ...initFormData,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="0.000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock Level</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={initFormData.minStockLevel}
                    onChange={(e) =>
                      setInitFormData({
                        ...initFormData,
                        minStockLevel: e.target.value,
                      })
                    }
                    placeholder="0.000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert threshold for low stock
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsInitDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInitializeInventory}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      "Initialize"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search raw materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Raw Materials List with Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Raw Materials</CardTitle>
          <CardDescription>
            {filteredMaterials.length} raw material{filteredMaterials.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No raw materials found
              </p>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first raw material"}
              </p>
              {hasPermission("Raw Materials", "write") && !searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Raw Material
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Raw Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock Level</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const materialInventories = getMaterialInventory(material.id);
                    const inventory = materialInventories[0]; // Single inventory per material
                    const hasLowStock = inventory ? isLowStock(inventory) : false;
                    
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{material.name}</div>
                            {material.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {material.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>
                          <Badge variant={material.isActive ? "default" : "secondary"}>
                            {material.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inventory ? (
                            <div className="flex items-center gap-2">
                              <span className={hasLowStock ? "text-orange-600 font-medium" : ""}>
                                {inventory.quantity} {material.unit}
                              </span>
                              {hasLowStock && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Not initialized
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {inventory ? (
                            <span className="text-sm">
                              {inventory.minStockLevel} {material.unit}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {inventory ? (
                            hasLowStock ? (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                In Stock
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No Inventory
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {hasPermission("Raw Materials", "update") && (
                              <>
                                {inventory && (
                                  <EditInventoryDialog
                                    inventory={inventory}
                                    onUpdate={handleUpdateInventory}
                                  />
                                )}
                                {hasPermission("Raw Materials", "write") && !inventory && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setInitFormData({
                                        rawMaterialId: material.id,
                                        quantity: "",
                                        minStockLevel: "",
                                      });
                                      setIsInitDialogOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Initialize
                                  </Button>
                                )}
                              </>
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

      {/* Add Raw Material Dialog */}
      <AddRawMaterialDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddMaterialSuccess}
      />
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RawMaterials;

