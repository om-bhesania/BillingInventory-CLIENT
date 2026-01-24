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
import useToast from "@/hooks/use-toast";
import { addRawMaterials, getRawMaterialById, updateRawMaterial } from "@/apis/rawMaterialApi";
import LoadingSpinner from "@/components/ui/Loader";
import { Package, Loader2 } from "lucide-react";
import UnitsSelect from "@/components/inventory/UnitsSelect";
import { getUnits, addUnits } from "@/apis/unitApi";

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Name is too short")
    .max(100, "Name is too long")
    .required("Raw material name is required"),
  description: Yup.string().max(500, "Description is too long"),
  unit: Yup.string().required("Unit is required"),
  isActive: Yup.boolean(),
});

const RawMaterialForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);
  const { toast } = useToast();

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      unit: "pieces",
      isActive: true,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        if (isEditing) {
          await updateRawMaterial(id!, values);
          toast({
            title: "Success",
            text: "Raw material updated successfully",
            type: "success",
          });
        } else {
          await addRawMaterials(values);
          toast({
            title: "Success",
            text: "Raw material created successfully",
            type: "success",
          });
        }
        navigate("/raw-materials");
      } catch (error: any) {
        console.error("Error saving raw material:", error);
        toast({
          title: "Error",
          text: error?.response?.data?.error || "Failed to save raw material",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      const fetchRawMaterial = async () => {
        try {
          setIsLoading(true);
          const rawMaterial = await getRawMaterialById(id);
          formik.setValues({
            name: rawMaterial.name || "",
            description: rawMaterial.description || "",
            unit: rawMaterial.unit || "",
            isActive: rawMaterial.isActive !== undefined ? rawMaterial.isActive : true,
          });
        } catch (error) {
          console.error("Error fetching raw material:", error);
          toast({
            title: "Error",
            text: "Failed to load raw material data",
            type: "error",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchRawMaterial();
    }
  }, [id, isEditing]);

  const fetchUnits = async () => {
    try {
      setIsLoadingUnits(true);
      const unitsData = await getUnits();
      setUnits(unitsData || []);
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setIsLoadingUnits(false);
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "✏️ Edit Raw Material" : "➕ Add New Raw Material"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update raw material details"
            : "Create a new raw material for your inventory system"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Raw Material Information
          </CardTitle>
          <CardDescription>
            Enter the details for the raw material
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Cups, Sugar, Milk"
                  className={formik.touched.name && formik.errors.name ? "border-red-500" : ""}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-sm text-red-500">{formik.errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                {isLoadingUnits ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading units...</span>
                  </div>
                ) : (
                  <UnitsSelect
                    formik={formik}
                    units={units}
                    addUnits={addUnits}
                    fetchUnits={fetchUnits}
                  />
                )}
                {formik.touched.unit && formik.errors.unit && (
                  <p className="text-sm text-red-500">{formik.errors.unit}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Standardized unit for this raw material
                </p>
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
                placeholder="Optional description or notes about this raw material"
                rows={3}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-sm text-red-500">{formik.errors.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formik.values.isActive}
                onCheckedChange={(checked) => formik.setFieldValue("isActive", checked)}
              />
              <Label htmlFor="isActive" className="text-sm font-medium">
                Active Raw Material
              </Label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/raw-materials")}
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
                  isEditing ? "Update Raw Material" : "Create Raw Material"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RawMaterialForm;

