import { addCategories, getCategories } from "@/apis/categoryapi";
import { addFlavours, getFlavours } from "@/apis/flavourapis";
import {
  addProduct,
  getProductsById,
  editProduct as updateProduct,
} from "@/apis/productapis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useToast from "@/hooks/use-toast";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import CategoriesSelect from "./components/CategoriesSelect";
import FlavorSelect from "./components/FlavourSelect";
import PackagingTypeSelect from "./components/PackagingTypeSelect";
import { getPackagingTypes, addPackagingType } from "@/apis/packagingTypeApi";
import LoadingSpinner from "@/components/ui/Loader";

const packagingTypes = [
  { value: "cup", label: "Cup" },
  { value: "cone", label: "Cone" },
  { value: "tub", label: "Tub" },
  { value: "brick", label: "Brick" },
];

const unitMeasurements = [
  { value: "liter", label: "Liter" },
  { value: "ml", label: "ml" },
  { value: "scoop", label: "Scoop" },
  { value: "tub", label: "Tub" },
];

const InventoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [IsdataLoading, setIsdataLoading] = useState(false);
  const [flavours, setFlavours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packagingTypesList, setPackagingTypesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const { toast } = useToast();
  // Form validation schema using Yup (refined messages)
  const validationSchema = Yup.object({
    sku: Yup.string()
      .trim()
      .matches(/^[A-Za-z0-9\-_.]+$/, "Use letters, numbers, - _ . only")
      .required("SKU is required"),
    name: Yup.string()
      .trim()
      .min(2, "Name is too short")
      .max(80, "Keep the name concise")
      .required("Product name is required"),
    description: Yup.string().max(500, "Keep description under 500 characters"),
    categoryId: Yup.string().required("Category is required"),
    packagingType: Yup.string().nullable(),
    quantityInLiters: Yup.number()
      .typeError("Enter a valid number")
      .positive("Must be positive")
      .max(10000, "Seems unusually large")
      .required("Total content is required"),
    unitSize: Yup.number()
      .typeError("Enter a valid number")
      .positive("Must be positive")
      .max(100000, "Check the unit size entered")
      .required("Unit size is required"),
    unitMeasurement: Yup.string().required("Unit measurement is required"),
    unitPrice: Yup.number()
      .typeError("Enter a valid price")
      .min(0, "Must be zero or positive")
      .max(1000000, "Price seems unusually high")
      .required("Unit price is required"),
    costPrice: Yup.number()
      .typeError("Enter a valid cost price")
      .min(0, "Must be zero or positive")
      .max(1000000, "Cost price seems unusually high")
      .required("Cost price is required"),
    retailPrice: Yup.number()
      .typeError("Enter a valid retail price")
      .min(0, "Must be zero or positive")
      .max(1000000, "Retail price seems unusually high")
      .required("Retail price is required"),
    totalStock: Yup.number()
      .typeError("Enter a whole number")
      .integer("Must be a whole number")
      .min(0, "Cannot be negative")
      .required("Total stock is required"),
    minStockLevel: Yup.number()
      .typeError("Enter a whole number")
      .integer("Must be a whole number")
      .min(0, "Cannot be negative"),
    barcode: Yup.string().max(64, "Barcode too long"),
    imageUrl: Yup.string().url("Must be a valid URL"),
    isActive: Yup.boolean(),
    flavorId: Yup.string().required("Flavor is required"),
  });

  // Initial form values
  const initialValues = {
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    packagingType: "",
    quantityInLiters: "",
    unitSize: "",
    unitMeasurement: "",
    unitPrice: "",
    costPrice: "",
    retailPrice: "",
    totalStock: "",
    minStockLevel: "",
    barcode: "",
    imageUrl: "",
    isActive: true,
    flavorId: "",
    packagingTypeId: "",
  };

  // Formik setup
  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true, // This will cause formik to reset when initialValues change
    onSubmit: async (values) => {
      try {
        setIsdataLoading(true);
        let response;
        const formData = { ...values } as any;

        // Guard against invalid foreign keys leaking into submission
        if (!formData.packagingTypeId) {
          delete formData.packagingTypeId;
        }

        if (isEditing) {
          const productId = id.replace("id=", "");
          // In edit mode, we might want to handle the SKU differently
          const data = {
            ...formData,
            sku: null, // Or keep the original SKU if needed
          };
          response = await updateProduct(data, productId);
          toast({
            title: "Success",
            text: "Product updated successfully",
            type: "success",
          });
        } else {
          response = await addProduct(formData);
          formik.resetForm();
          toast({
            title: "Success",
            text: "Product added successfully",
            type: "success",
          });
        }

        console.log("Product operation successful:", response);

        // Optional: Navigate back to inventory list after success
        // navigate("/inventory");
      } catch (e) {
        console.log("error", e);
        toast({
          title: "Something went wrong",
          text: `${
            e?.response?.data?.error || "Please wait for a moment and try again"
          }`,
          type: "error",
        });
      } finally {
        setIsdataLoading(false);
      }
    },
  });

  useEffect(() => {
    // Fetch categories and flavors on component mount
    Promise.all([fetchCategories(), fetchFlavours(), fetchPackagingTypes()])
      .then(() => {
        if (isEditing) {
          fetchProductData();
        }
      })
      .catch((error) => {
        console.error("Error initializing form data:", error);
        setIsLoading(false);
      });
  }, []);

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const productId = id.replace("id=", "");
      const product: any = await getProductsById(productId);

      if (product) {
        // Update formik values with fetched product data
        formik.setValues({
          sku: product.sku || "",
          name: product.name || "",
          description: product.description || "",
          categoryId: product.categoryId || "",
          packagingType: product.packagingType || "",
          quantityInLiters: product.quantityInLiters || "",
          unitSize: product.unitSize || "",
          unitMeasurement: product.unitMeasurement || "",
          unitPrice: product.unitPrice || "",
          costPrice: product.costPrice || "",
          retailPrice: product.retailPrice || "",
          totalStock: product.totalStock || "",
          minStockLevel: product.minStockLevel || "",
          barcode: product.barcode || "",
          imageUrl: product.imageUrl || "",
          isActive: product.isActive !== undefined ? product.isActive : true,
          flavorId: product.flavorId || "",
          packagingTypeId: product.packagingTypeId || "",
        });
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      toast({
        title: "Error",
        text: "Failed to load product data",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlavours = async () => {
    try {
      const response: any = await getFlavours();
      const parsedData = response.map((item) => ({
        id: item.id,
        name: item.name,
      }));
      setFlavours(parsedData);
      return parsedData;
    } catch (error) {
      console.error("Error fetching flavours:", error);
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const response: any = await getCategories();
      const parsedData = response.map((item) => ({
        id: item.id,
        name: item.name,
      }));
      setCategories(parsedData);
      return parsedData;
    } catch (error) {
      console.error("Error fetching Categories:", error);
      return [];
    }
  };

  const fetchPackagingTypes = async () => {
    try {
      const list: any = await getPackagingTypes();
      setPackagingTypesList(list);
      return list;
    } catch (error) {
      return [];
    }
  };

  const handleGenerateSku = () => {
    const randomString = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    formik.setFieldValue("sku", `SKU-${randomString}`);
  };

  // Auto-fill SKU when product name changes
  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const productName = e.target.value;
    formik.setFieldValue("name", productName);
    
    // Auto-generate SKU based on product name if SKU is empty
    if (!formik.values.sku && productName) {
      const skuPrefix = productName
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 3)
        .toUpperCase();
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      formik.setFieldValue("sku", `${skuPrefix}-${randomSuffix}`);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex justify-center items-center min-h-screen">
          <p>Loading product data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "✏️ Edit Product" : "🍦 Add New Product"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Tweak the scoops — update product details and keep things fresh."
            : "Create a delightful product with clear details for smooth operations."}
        </p>
      </div>

      <Separator className="my-6" />

      <form onSubmit={formik.handleSubmit} className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="grid gap-6 basic-info section-card">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <p className="text-xs text-muted-foreground">
                Name, category, and flavor define how your product appears
                across the app.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    name="sku"
                    {...formik.getFieldProps("sku")}
                    placeholder="e.g. SKU-001 or VAN-150-ML"
                    contentRight={
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        onClick={handleGenerateSku}
                      >
                        Generate SKU
                      </Button>
                    }
                  />
                  {formik.touched.sku && formik.errors.sku && (
                    <p className="text-sm text-red-500">{formik.errors.sku}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    {...formik.getFieldProps("name")}
                    onChange={handleProductNameChange}
                    placeholder="e.g. Choco Chip Cone"
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-sm text-red-500">{formik.errors.name}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 description">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  {...formik.getFieldProps("description")}
                  placeholder="Short, helpful note about the product (ingredients, highlights, etc.)"
                  rows={3}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-sm text-red-500">
                    {formik.errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional, but recommended: helps staff quickly recognize the
                  item.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <CategoriesSelect
                    formik={formik}
                    categories={categories}
                    addCategories={addCategories}
                    fetchCategories={fetchCategories}
                  />
                  <p className="text-xs text-muted-foreground">
                    Grouping like "Ice Cream", "Toppings", etc.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="flavorId">Flavor *</Label>
                  <FlavorSelect
                    formik={formik}
                    flavours={flavours}
                    addFlavours={addFlavours}
                    fetchFlavours={fetchFlavours}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose the flavor profile customers will see.
                  </p>
                </div>
              </div>
            </div>

            {/* Packaging and Measurements */}
            <div className="flex flex-col gap-6 packaging-info section-card">
              <h2 className="text-lg font-semibold">
                Packaging and Measurements
              </h2>
              <p className="text-xs text-muted-foreground">
                Tell us the form and size you sell — e.g., 150 ml cup, cone, or
                1L tub.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="packagingTypeId">Packaging Type</Label>
                  <PackagingTypeSelect
                    formik={formik}
                    items={packagingTypesList}
                    addItem={addPackagingType}
                    fetchItems={fetchPackagingTypes}
                  />
                  {(formik.touched as any).packagingTypeId &&
                    (formik.errors as any).packagingTypeId && (
                      <p className="text-sm text-red-500">
                        {(formik.errors as any).packagingTypeId}
                      </p>
                    )}
                  <p className="text-xs text-muted-foreground">
                    This is the sellable form factor (Cup, Cone, Tub, Brick).
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quantityInLiters">
                    Total Content (Liters) *
                  </Label>
                  <Input
                    id="quantityInLiters"
                    name="quantityInLiters"
                    type="number"
                    step="0.01"
                    {...formik.getFieldProps("quantityInLiters")}
                    placeholder="1.0"
                  />
                  {formik.touched.quantityInLiters &&
                    formik.errors.quantityInLiters && (
                      <p className="text-sm text-red-500">
                        {formik.errors.quantityInLiters}
                      </p>
                    )}
                  <p className="text-xs text-muted-foreground">
                    Bulk content produced per product batch (optional in
                    retail-first setups).
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="unitSize">Unit Size *</Label>
                  <Input
                    id="unitSize"
                    name="unitSize"
                    type="number"
                    step="0.01"
                    {...formik.getFieldProps("unitSize")}
                    placeholder="150.0"
                  />
                  {formik.touched.unitSize && formik.errors.unitSize && (
                    <p className="text-sm text-red-500">
                      {formik.errors.unitSize}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter numeric size, e.g., 150 for 150 ml.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unitMeasurement">Unit Measurement *</Label>
                  <Select
                    value={formik.values.unitMeasurement}
                    onValueChange={(value) =>
                      formik.setFieldValue("unitMeasurement", value)
                    }
                  >
                    <SelectTrigger id="unitMeasurement">
                      <SelectValue placeholder="Select measurement" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitMeasurements.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.unitMeasurement &&
                    formik.errors.unitMeasurement && (
                      <p className="text-sm text-red-500">
                        {formik.errors.unitMeasurement}
                      </p>
                    )}
                  <p className="text-xs text-muted-foreground">
                    Usually ml, scoop, or tub.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="grid gap-6 price-stock section-card">
              <h2 className="text-lg font-semibold">Pricing and Stock</h2>
              <p className="text-xs text-muted-foreground">
                Set a fair price and keep stock accurate to avoid outages.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">MRP/Unit Price (₹) *</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    {...formik.getFieldProps("unitPrice")}
                    placeholder="150.00"
                  />
                  {formik.touched.unitPrice && formik.errors.unitPrice && (
                    <p className="text-sm text-red-500">
                      {formik.errors.unitPrice}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum Retail Price (MRP) - the selling price for individual products.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="costPrice">Cost Price (₹) *</Label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    {...formik.getFieldProps("costPrice")}
                    placeholder="80.00"
                  />
                  {formik.touched.costPrice && formik.errors.costPrice && (
                    <p className="text-sm text-red-500">
                      {formik.errors.costPrice}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Manufacturing cost per unit - what it costs to make this product.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="retailPrice">Retail Price (₹) *</Label>
                  <Input
                    id="retailPrice"
                    name="retailPrice"
                    type="number"
                    step="0.01"
                    {...formik.getFieldProps("retailPrice")}
                    placeholder="120.00"
                  />
                  {formik.touched.retailPrice && formik.errors.retailPrice && (
                    <p className="text-sm text-red-500">
                      {formik.errors.retailPrice}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Actual selling price to customers (usually same as MRP).
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">

                <div className="grid gap-2">
                  <Label htmlFor="totalStock">Total Stock *</Label>
                  <Input
                    id="totalStock"
                    name="totalStock"
                    type="number"
                    {...formik.getFieldProps("totalStock")}
                    placeholder="50"
                  />
                  {formik.touched.totalStock && formik.errors.totalStock && (
                    <p className="text-sm text-red-500">
                      {formik.errors.totalStock}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Factory-level quantity currently available.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    name="minStockLevel"
                    type="number"
                    {...formik.getFieldProps("minStockLevel")}
                    placeholder="10"
                  />
                  {formik.touched.minStockLevel &&
                    formik.errors.minStockLevel && (
                      <p className="text-sm text-red-500">
                        {formik.errors.minStockLevel}
                      </p>
                    )}
                  <p className="text-xs text-muted-foreground">
                    Trigger alerts when the shop stock reaches this threshold.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid gap-6 additional-info section-card">
              <h2 className="text-lg font-semibold">Additional Information</h2>
              <p className="text-xs text-muted-foreground">
                Barcodes and images help scanning and identification.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    {...formik.getFieldProps("barcode")}
                    placeholder="8901234567890"
                  />
                  {formik.touched.barcode && formik.errors.barcode && (
                    <p className="text-sm text-red-500">
                      {formik.errors.barcode}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Optional — useful for faster billing.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    {...formik.getFieldProps("imageUrl")}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formik.touched.imageUrl && formik.errors.imageUrl && (
                    <p className="text-sm text-red-500">
                      {formik.errors.imageUrl}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paste a shareable URL to show product visuals.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formik.values.isActive}
                  onChange={formik.handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Product
                </Label>
              </div>
            </div>

            <div className="flex justify-end section-card">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/inventory")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || IsdataLoading}
                  className="flex items-center justify-center"
                  loading={IsdataLoading}
                >
                  {isEditing ? "Save Changes" : "Create Product"}{" "}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Product Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{formik.values.name || "—"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground">Category</div>
                    <div className="font-medium">
                      {categories.find(
                        (c: any) => c.id === formik.values.categoryId
                      )?.name || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Flavor</div>
                    <div className="font-medium">
                      {flavours.find(
                        (f: any) => f.id === formik.values.flavorId
                      )?.name || "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground">Packaging</div>
                    <div className="font-medium">
                      {packagingTypesList.find(
                        (p: any) => p.id === formik.values.packagingTypeId
                      )?.name || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Unit</div>
                    <div className="font-medium">
                      {formik.values.unitSize || "—"}{" "}
                      {formik.values.unitMeasurement || ""}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground">MRP</div>
                    <div className="font-medium">
                      ₹{formik.values.unitPrice || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Factory Stock</div>
                    <Badge variant="secondary">
                      {formik.values.totalStock || 0}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground">Cost Price</div>
                    <div className="font-medium">
                      ₹{formik.values.costPrice || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Retail Price</div>
                    <div className="font-medium">
                      ₹{formik.values.retailPrice || "—"}
                    </div>
                  </div>
                </div>
                {formik.values.costPrice && formik.values.retailPrice && (
                  <div>
                    <div className="text-muted-foreground">Profit per Unit</div>
                    <div className="font-medium text-green-600">
                      ₹{(Number(formik.values.retailPrice) - Number(formik.values.costPrice)).toFixed(2)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
};

export default InventoryForm;
