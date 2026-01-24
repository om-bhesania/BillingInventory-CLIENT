import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import useToast from "@/hooks/use-toast";
import {
  createRecipe,
  getRecipeById,
  updateRecipe,
} from "@/apis/recipeApi";
import { getProducts } from "@/apis/productapis";
import { getRawMaterials, addRawMaterials } from "@/apis/rawMaterialApi";
import RawMaterialSelect from "@/components/inventory/RawMaterialSelect";
import LoadingSpinner from "@/components/ui/Loader";
import { ChefHat, Plus, Trash2, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
}

interface RecipeItem {
  rawMaterialId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

const validationSchema = Yup.object({
  productId: Yup.string().required("Product is required"),
  name: Yup.string().max(100, "Name is too long"),
  description: Yup.string().max(500, "Description is too long"),
  duration: Yup.number().min(0, "Duration must be positive").nullable(),
  yield: Yup.number().min(0, "Yield must be positive").nullable(),
  items: Yup.array()
    .of(
      Yup.object({
        rawMaterialId: Yup.string().required("Raw material is required"),
        quantity: Yup.number()
          .min(0.001, "Quantity must be greater than 0")
          .required("Quantity is required"),
        unit: Yup.string().required("Unit is required"),
        notes: Yup.string(),
      })
    )
    .min(1, "At least one ingredient is required"),
  isDefault: Yup.boolean(),
});

const RecipeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const { toast } = useToast();

  const formik = useFormik({
    initialValues: {
      productId: "",
      name: "",
      description: "",
      duration: null as number | null,
      yield: null as number | null,
      items: [] as RecipeItem[],
      isDefault: false,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        const recipeData = {
          productId: values.productId,
          name: values.name || undefined,
          description: values.description || undefined,
          duration: values.duration || undefined,
          yield: values.yield || undefined,
          isDefault: values.isDefault,
          items: values.items.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes || undefined,
          })),
        };

        if (isEditing) {
          await updateRecipe(id!, recipeData);
          toast({
            title: "Success",
            text: "Recipe updated successfully",
            type: "success",
          });
        } else {
          await createRecipe(recipeData);
          toast({
            title: "Success",
            text: "Recipe created successfully",
            type: "success",
          });
        }
        navigate("/recipes");
      } catch (error: any) {
        console.error("Error saving recipe:", error);
        toast({
          title: "Error",
          text: error?.response?.data?.error || "Failed to save recipe",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      fetchRecipe();
    }
  }, [id, isEditing]);

  const fetchData = async () => {
    try {
      const [productsData, materialsData] = await Promise.all([
        getProducts(),
        getRawMaterials(),
      ]);
      setProducts(productsData || []);
      setRawMaterials(materialsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchRecipe = async () => {
    try {
      setIsLoading(true);
      const recipe = await getRecipeById(id!);
      formik.setValues({
        productId: recipe.productId,
        name: recipe.name || "",
        description: recipe.description || "",
        duration: recipe.duration || null,
        yield: recipe.yield || null,
        isDefault: recipe.isDefault || false,
        items: recipe.items.map((item: any) => ({
          rawMaterialId: item.rawMaterialId,
          quantity: Number(item.quantity),
          unit: item.unit,
          notes: item.notes || "",
        })),
      });
    } catch (error) {
      console.error("Error fetching recipe:", error);
      toast({
        title: "Error",
        text: "Failed to load recipe data",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addIngredient = () => {
    const newItem: RecipeItem = {
      rawMaterialId: "",
      quantity: 0,
      unit: "pieces",
      notes: "",
    };
    formik.setFieldValue("items", [...formik.values.items, newItem]);
  };

  const removeIngredient = (index: number) => {
    const newItems = formik.values.items.filter((_, i) => i !== index);
    formik.setFieldValue("items", newItems);
  };

  const updateIngredient = (index: number, field: keyof RecipeItem, value: any) => {
    const items = [...formik.values.items];
    items[index] = { ...items[index], [field]: value };
    
    // If rawMaterialId changes, update the unit from the raw material
    if (field === "rawMaterialId") {
      const rawMaterial = rawMaterials.find((m) => m.id === value);
      if (rawMaterial) {
        items[index].unit = rawMaterial.unit;
      }
    }
    
    formik.setFieldValue("items", items);
  };

  const fetchRawMaterials = async () => {
    try {
      const materials = await getRawMaterials();
      setRawMaterials(materials || []);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "✏️ Edit Recipe" : "➕ Add New Recipe"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update recipe details and ingredients"
            : "Create a new recipe with ingredients and production details"}
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChefHat className="h-5 w-5 mr-2" />
              Recipe Information
            </CardTitle>
            <CardDescription>
              Enter the basic details for the recipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select
                  value={formik.values.productId}
                  onValueChange={(value) => formik.setFieldValue("productId", value)}
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
                  <p className="text-sm text-red-500">{formik.errors.productId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name (Optional)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Standard Recipe, Premium Recipe"
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-red-500">{formik.errors.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Optional description or notes about this recipe"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formik.values.duration || ""}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "duration",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield">Yield (output quantity)</Label>
                <Input
                  id="yield"
                  name="yield"
                  type="number"
                  step="0.001"
                  value={formik.values.yield || ""}
                  onChange={(e) =>
                    formik.setFieldValue(
                      "yield",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formik.values.isDefault}
                onCheckedChange={(checked) =>
                  formik.setFieldValue("isDefault", checked)
                }
              />
              <Label htmlFor="isDefault" className="text-sm font-medium">
                Set as default recipe for this product
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Ingredients
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </CardTitle>
            <CardDescription>
              Add raw materials and their quantities required for this recipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formik.values.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No ingredients added yet.</p>
                <p className="text-sm mt-2">
                  Click "Add Ingredient" to start adding raw materials.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formik.values.items.map((item, index) => {
                  const rawMaterial = rawMaterials.find(
                    (m) => m.id === item.rawMaterialId
                  );
                  return (
                    <div
                      key={index}
                      className="grid gap-4 p-4 border rounded-lg sm:grid-cols-12"
                    >
                      <div className="sm:col-span-4 space-y-2">
                        <Label>Raw Material *</Label>
                        <RawMaterialSelect
                          formik={{
                            values: { rawMaterialId: item.rawMaterialId },
                            setFieldValue: (field: string, value: any) =>
                              updateIngredient(index, "rawMaterialId", value),
                          }}
                          rawMaterials={rawMaterials}
                          addRawMaterials={addRawMaterials}
                          fetchRawMaterials={fetchRawMaterials}
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.000"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Unit</Label>
                        <Input
                          value={item.unit}
                          disabled
                          className="bg-gray-50"
                          placeholder="Unit"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Notes</Label>
                        <Input
                          value={item.notes || ""}
                          onChange={(e) =>
                            updateIngredient(index, "notes", e.target.value)
                          }
                          placeholder="Optional notes"
                        />
                      </div>
                      <div className="sm:col-span-1 space-y-2">
                        <Label>&nbsp;</Label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {formik.touched.items && formik.errors.items && (
              <p className="text-sm text-red-500 mt-2">
                {typeof formik.errors.items === "string"
                  ? formik.errors.items
                  : "At least one ingredient is required"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/recipes")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">Saving...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </>
            ) : (
              isEditing ? "Update Recipe" : "Create Recipe"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;

