import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table,
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  TrendingDown,
  Clock
} from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

// API imports
import {
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  RawMaterial,
  CreateRawMaterialRequest
} from "@/apis/rawMaterialApi";
import {
  getRawMaterialCategories,
  createRawMaterialCategory,
  RawMaterialCategory
} from "@/apis/rawMaterialCategoryApi";
import {
  getSuppliers,
  createSupplier,
  Supplier
} from "@/apis/supplierApi";
import {
  getRawMaterialInventories,
  RawMaterialInventory
} from "@/apis/rawMaterialInventoryApi";

// Components
import RawMaterialCategorySelect from "@/components/inventory/RawMaterialCategorySelect";
import SupplierSelect from "@/components/inventory/SupplierSelect";

const RawMaterialManagement: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("materials");
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [categories, setCategories] = useState<RawMaterialCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventories, setInventories] = useState<RawMaterialInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [lowStockItems, setLowStockItems] = useState<RawMaterialInventory[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMaterials(),
        fetchCategories(),
        fetchSuppliers(),
        fetchInventories()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await getRawMaterials();
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Failed to fetch raw materials");
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getRawMaterialCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
    }
  };

  const fetchInventories = async () => {
    try {
      const data = await getRawMaterialInventories({ lowStock: true });
      setLowStockItems(data);
    } catch (error) {
      console.error("Error fetching inventories:", error);
    }
  };

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required("Material name is required"),
    categoryId: Yup.string().required("Category is required"),
    supplierId: Yup.string().required("Supplier is required"),
    unit: Yup.string().required("Unit is required"),
    unitPrice: Yup.number().positive("Price must be positive").required("Price is required"),
    isPerishable: Yup.boolean(),
    shelfLife: Yup.number().when('isPerishable', {
      is: true,
      then: (schema) => schema.required("Shelf life is required for perishable items"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  // Formik form
  const formik = useFormik({
    initialValues: {
      name: "",
      categoryId: "",
      supplierId: "",
      unit: "",
      unitPrice: 0,
      isPerishable: false,
      shelfLife: undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (editingMaterial) {
          await updateRawMaterial(editingMaterial.id, values);
          toast.success("Raw material updated successfully");
        } else {
          await createRawMaterial(values as CreateRawMaterialRequest);
          toast.success("Raw material created successfully");
        }
        await fetchMaterials();
        setIsDialogOpen(false);
        formik.resetForm();
        setEditingMaterial(null);
      } catch (error) {
        console.error("Error saving material:", error);
        toast.error("Failed to save raw material");
      }
    },
  });

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    formik.setValues({
      name: material.name,
      categoryId: material.categoryId,
      supplierId: material.supplierId,
      unit: material.unit,
      unitPrice: material.unitPrice,
      isPerishable: material.isPerishable,
      shelfLife: material.shelfLife,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this raw material?")) {
      try {
        await deleteRawMaterial(id);
        toast.success("Raw material deleted successfully");
        await fetchMaterials();
      } catch (error) {
        console.error("Error deleting material:", error);
        toast.error("Failed to delete raw material");
      }
    }
  };

  const handleAddCategory = async (categoryData: any) => {
    return await createRawMaterialCategory(categoryData);
  };

  const handleAddSupplier = async (supplierData: any) => {
    return await createSupplier(supplierData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading raw materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Raw Material Management</h1>
          <p className="text-muted-foreground">
            Manage raw materials, suppliers, and inventory levels
          </p>
        </div>
        {hasPermission("Raw Materials", "write") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                formik.resetForm();
                setEditingMaterial(null);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Raw Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? "Edit Raw Material" : "Add New Raw Material"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Material Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Chocolate Chips"
                    />
                    {formik.touched.name && formik.errors.name && (
                      <p className="text-sm text-red-500">{formik.errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      name="unit"
                      value={formik.values.unit}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., kg, pieces, liters"
                    />
                    {formik.touched.unit && formik.errors.unit && (
                      <p className="text-sm text-red-500">{formik.errors.unit}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <RawMaterialCategorySelect
                    formik={formik}
                    categories={categories}
                    addCategories={handleAddCategory}
                    fetchCategories={fetchCategories}
                  />
                  {formik.touched.categoryId && formik.errors.categoryId && (
                    <p className="text-sm text-red-500">{formik.errors.categoryId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <SupplierSelect
                    formik={formik}
                    suppliers={suppliers}
                    addSuppliers={handleAddSupplier}
                    fetchSuppliers={fetchSuppliers}
                  />
                  {formik.touched.supplierId && formik.errors.supplierId && (
                    <p className="text-sm text-red-500">{formik.errors.supplierId}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                    <Input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      value={formik.values.unitPrice}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.unitPrice && formik.errors.unitPrice && (
                      <p className="text-sm text-red-500">{formik.errors.unitPrice}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isPerishable">Perishable</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPerishable"
                        checked={formik.values.isPerishable}
                        onCheckedChange={(checked) => formik.setFieldValue("isPerishable", checked)}
                      />
                      <Label htmlFor="isPerishable">Yes</Label>
                    </div>
                  </div>
                </div>

                {formik.values.isPerishable && (
                  <div className="space-y-2">
                    <Label htmlFor="shelfLife">Shelf Life (days)</Label>
                    <Input
                      id="shelfLife"
                      name="shelfLife"
                      type="number"
                      value={formik.values.shelfLife || ""}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., 7"
                    />
                    {formik.touched.shelfLife && formik.errors.shelfLife && (
                      <p className="text-sm text-red-500">{formik.errors.shelfLife}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{lowStockItems.length}</strong> raw material(s) are running low on stock.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setActiveTab("inventory")}>
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Raw Materials</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Raw Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.category?.name}</TableCell>
                        <TableCell>{material.supplier?.name}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>₹{material.unitPrice}</TableCell>
                        <TableCell>
                          <Badge variant={material.isPerishable ? "destructive" : "secondary"}>
                            {material.isPerishable ? "Perishable" : "Non-Perishable"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={material.isActive ? "default" : "secondary"}>
                            {material.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {hasPermission("Raw Materials", "read") && (
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("Raw Materials", "update") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(material)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission("Raw Materials", "delete") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(material.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Inventory Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Inventory management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Material Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="border rounded-lg p-4">
                    <h3 className="font-medium">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                    {supplier.email && (
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    )}
                    {supplier.address && (
                      <p className="text-sm text-muted-foreground">{supplier.address}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RawMaterialManagement;
