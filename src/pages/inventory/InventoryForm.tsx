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
import { toast } from "@/hooks/use-toast";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import CategoriesSelect from "./components/CategoriesSelect";
import FlavorSelect from "./components/FlavourSelect";

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
  const [flavours, setFlavours] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditing);

  // Form validation schema using Yup
  const validationSchema = Yup.object({
    sku: Yup.string().required("SKU is required"),
    name: Yup.string().required("Product name is required"),
    description: Yup.string(),
    categoryId: Yup.string().required("Category is required"),
    packagingType: Yup.string(),
    quantityInLiters: Yup.number()
      .positive("Must be a positive number")
      .required("Total content is required"),
    unitSize: Yup.number()
      .positive("Must be a positive number")
      .required("Unit size is required"),
    unitMeasurement: Yup.string().required("Unit measurement is required"),
    unitPrice: Yup.number()
      .positive("Must be a positive number")
      .required("Unit price is required"),
    totalStock: Yup.number()
      .integer("Must be a whole number")
      .min(0, "Cannot be negative")
      .required("Total stock is required"),
    minStockLevel: Yup.number()
      .integer("Must be a whole number")
      .min(0, "Cannot be negative"),
    barcode: Yup.string(),
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
    totalStock: "",
    minStockLevel: "",
    barcode: "",
    imageUrl: "",
    isActive: true,
    flavorId: "",
  };

  // Formik setup
  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true, // This will cause formik to reset when initialValues change
    onSubmit: async (values) => {
      try {
        let response;
        const formData = { ...values };

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
          text: `${e?.response?.data?.error || "Please wait for a moment and try again"
            }`,
          type: "error",
        });
      }
    },
  });

  useEffect(() => {
    // Fetch categories and flavors on component mount
    Promise.all([fetchCategories(), fetchFlavours()])
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
          totalStock: product.totalStock || "",
          minStockLevel: product.minStockLevel || "",
          barcode: product.barcode || "",
          imageUrl: product.imageUrl || "",
          isActive: product.isActive !== undefined ? product.isActive : true,
          flavorId: product.flavorId || "",
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

  const handleGenerateSku = () => {
    const randomString = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    formik.setFieldValue("sku", `SKU-${randomString}`);
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
          {isEditing ? "Edit Product" : "Add New Product"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the details of an existing product"
            : "Add a new product to your inventory"}
        </p>
      </div>

      <Separator className="my-6" />

      <form onSubmit={formik.handleSubmit} className="">
        <div className="grid grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="grid gap-6 basic-info section-card">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  name="sku"
                  {...formik.getFieldProps("sku")}
                  placeholder="SKU-001"
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
                  placeholder="Vanilla Ice Cream"
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
                placeholder="Enter product description"
                rows={3}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-sm text-red-500">
                  {formik.errors.description}
                </p>
              )}
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
              </div>

              <div className="grid gap-2">
                <Label htmlFor="flavorId">Flavor *</Label>
                <FlavorSelect
                  formik={formik}
                  flavours={flavours}
                  addFlavours={addFlavours}
                  fetchFlavours={fetchFlavours}
                />
              </div>
            </div>
          </div>

          {/* Packaging and Measurements */}
          <div className="flex flex-col gap-6 packaging-info section-card">
            <h2 className="text-lg font-semibold">
              Packaging and Measurements
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="packagingType">Packaging Type</Label>
                <Select
                  value={formik.values.packagingType}
                  onValueChange={(value) =>
                    formik.setFieldValue("packagingType", value)
                  }
                >
                  <SelectTrigger id="packagingType">
                    <SelectValue placeholder="Select packaging" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.packagingType &&
                  formik.errors.packagingType && (
                    <p className="text-sm text-red-500">
                      {formik.errors.packagingType}
                    </p>
                  )}
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
              </div>
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="grid gap-6 price-stock section-card">
            <h2 className="text-lg font-semibold">Pricing and Stock</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="unitPrice">Unit Price (₹) *</Label>
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
              </div>

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
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid gap-6 additional-info section-card">
            <h2 className="text-lg font-semibold">Additional Information</h2>

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

          <div className="col-span-2 flex justify-end section-card">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEditing ? "Update Product" : "Add Product"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default InventoryForm;
