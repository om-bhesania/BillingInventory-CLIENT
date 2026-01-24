import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useToast from "@/hooks/use-toast";
import { createProductionBatch } from "@/apis/productionApi";
import { getProducts } from "@/apis/productapis";
import { getRecipesByProduct } from "@/apis/recipeApi";
import { getRawMaterialInventories } from "@/apis/rawMaterialInventoryApi";
import LoadingSpinner from "@/components/ui/Loader";
import { Factory, Package, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface Recipe {
  id: string;
  name?: string;
  isDefault: boolean;
  items: Array<{
    rawMaterial: {
      id: string;
      name: string;
      unit: string;
    };
    quantity: number;
  }>;
}

interface RawMaterialInventory {
  rawMaterialId: string;
  quantity: number;
  minStockLevel: number;
  rawMaterial: {
    name: string;
    unit: string;
  };
}

const validationSchema = Yup.object({
  productId: Yup.string().required("Product is required"),
  recipeId: Yup.string().required("Recipe is required"),
  quantity: Yup.number()
    .min(0.001, "Quantity must be greater than 0")
    .required("Quantity is required"),
  notes: Yup.string(),
});

const ProductionBatchForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventories, setInventories] = useState<RawMaterialInventory[]>([]);
  const [availabilityCheck, setAvailabilityCheck] = useState<any[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const { toast } = useToast();

  const formik = useFormik({
    initialValues: {
      productId: "",
      recipeId: "",
      quantity: "",
      notes: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        await createProductionBatch({
          productId: values.productId,
          recipeId: values.recipeId,
          quantity: parseFloat(values.quantity),
          notes: values.notes || undefined,
        });
        toast({
          title: "Success",
          text: "Production batch created successfully",
          type: "success",
        });
        navigate("/production");
      } catch (error: any) {
        console.error("Error creating production batch:", error);
        if (error?.response?.data?.details) {
          setAvailabilityCheck(error.response.data.availabilityCheck || []);
        }
        toast({
          title: "Error",
          text:
            error?.response?.data?.error ||
            "Failed to create production batch",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchProducts();
    fetchInventories();
  }, []);

  useEffect(() => {
    if (formik.values.productId) {
      fetchRecipes(formik.values.productId);
    } else {
      setRecipes([]);
      formik.setFieldValue("recipeId", "");
    }
  }, [formik.values.productId]);

  useEffect(() => {
    if (formik.values.recipeId && formik.values.quantity) {
      checkAvailability();
    } else {
      setAvailabilityCheck([]);
    }
  }, [formik.values.recipeId, formik.values.quantity]);

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchRecipes = async (productId: string) => {
    try {
      const recipesData:any = await getRecipesByProduct(productId);
      setRecipes(recipesData || []);
      // Auto-select default recipe if available
      const defaultRecipe:any = recipesData?.find((r: Recipe) => r.isDefault);
      if (defaultRecipe) {
        formik.setFieldValue("recipeId", defaultRecipe.id);
      } else if (recipesData && recipesData.length === 1) {
        formik.setFieldValue("recipeId", recipesData[0].id);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  const fetchInventories = async () => {
    try {
      const inventoriesData:any = await getRawMaterialInventories();
      setInventories(inventoriesData || []);
    } catch (error) {
      console.error("Error fetching inventories:", error);
    }
  };

  const checkAvailability = async () => {
    if (!formik.values.recipeId || !formik.values.quantity) {
      setAvailabilityCheck([]);
      return;
    }

    try {
      setIsCheckingAvailability(true);
      const recipe = recipes.find((r) => r.id === formik.values.recipeId);
      if (!recipe) return;

      const quantity = parseFloat(formik.values.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        setAvailabilityCheck([]);
        return;
      }

      const check: any[] = [];
      for (const item of recipe.items) {
        const requiredQuantity = item.quantity * quantity;
        const inventory = inventories.find(
          (inv) => inv.rawMaterialId === item.rawMaterial.id
        );
        const availableQuantity = inventory ? inventory.quantity : 0;
        const isAvailable = availableQuantity >= requiredQuantity;

        check.push({
          rawMaterialId: item.rawMaterial.id,
          rawMaterialName: item.rawMaterial.name,
          required: requiredQuantity,
          available: availableQuantity,
          unit: item.rawMaterial.unit,
          isAvailable,
        });
      }

      setAvailabilityCheck(check);
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const selectedRecipe = recipes.find((r) => r.id === formik.values.recipeId);
  const allAvailable = availabilityCheck.length > 0 && availabilityCheck.every((item) => item.isAvailable);
  const hasInsufficientStock = availabilityCheck.some((item) => !item.isAvailable);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          🏭 Create Production Batch
        </h1>
        <p className="text-muted-foreground">
          Create a production batch and automatically deduct raw materials
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Production Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Factory className="h-5 w-5 mr-2" />
              Production Details
            </CardTitle>
            <CardDescription>
              Select product, recipe, and quantity to produce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select
                  value={formik.values.productId}
                  onValueChange={(value) => {
                    formik.setFieldValue("productId", value);
                    formik.setFieldValue("recipeId", "");
                    formik.setFieldValue("quantity", "");
                  }}
                >
                  <SelectTrigger id="productId">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.productId && formik.errors.productId && (
                  <p className="text-sm text-red-500">
                    {formik.errors.productId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipeId">Recipe *</Label>
                <Select
                  value={formik.values.recipeId}
                  onValueChange={(value) => formik.setFieldValue("recipeId", value)}
                  disabled={!formik.values.productId || recipes.length === 0}
                >
                  <SelectTrigger id="recipeId">
                    <SelectValue placeholder="Select recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name || "Default Recipe"}
                        {recipe.isDefault && " (Default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.recipeId && formik.errors.recipeId && (
                  <p className="text-sm text-red-500">
                    {formik.errors.recipeId}
                  </p>
                )}
                {formik.values.productId && recipes.length === 0 && (
                  <p className="text-sm text-amber-600">
                    No recipes found for this product. Create a recipe first.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Production Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.001"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g., 500"
              />
              {formik.touched.quantity && formik.errors.quantity && (
                <p className="text-sm text-red-500">
                  {formik.errors.quantity}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This quantity will be added to inventory and raw materials will be deducted automatically
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                placeholder="Production notes or comments"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Raw Material Availability Check */}
        {selectedRecipe && formik.values.quantity && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {isCheckingAvailability ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : allAvailable ? (
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                )}
                Raw Material Availability
              </CardTitle>
              <CardDescription>
                Required raw materials for this production batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCheckingAvailability ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">
                    Checking availability...
                  </p>
                </div>
              ) : availabilityCheck.length > 0 ? (
                <div className="space-y-3">
                  {hasInsufficientStock && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Some raw materials are insufficient. Please restock before proceeding.
                      </AlertDescription>
                    </Alert>
                  )}
                  {allAvailable && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        All raw materials are available. Production can proceed.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    {availabilityCheck.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          item.isAvailable
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.isAvailable ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">{item.rawMaterialName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span
                              className={
                                item.isAvailable
                                  ? "text-green-700"
                                  : "text-red-700 font-medium"
                              }
                            >
                              Required: {item.required} {item.unit}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Available: {item.available} {item.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Enter quantity to check raw material availability
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/production")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || hasInsufficientStock}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </>
            ) : (
              "Create Production Batch"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductionBatchForm;

