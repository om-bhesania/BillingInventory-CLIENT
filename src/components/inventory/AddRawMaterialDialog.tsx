import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import useToast from "@/hooks/use-toast";
import { addRawMaterials } from "@/apis/rawMaterialApi";
import { initializeInventory } from "@/apis/rawMaterialInventoryApi";
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
  initializeInventory: Yup.boolean(),
  quantity: Yup.number()
    .when("initializeInventory", {
      is: true,
      then: (schema) => schema.required("Quantity is required").min(0, "Quantity must be 0 or greater"),
      otherwise: (schema) => schema.notRequired(),
    }),
  minStockLevel: Yup.number()
    .when("initializeInventory", {
      is: true,
      then: (schema) => schema.required("Min stock level is required").min(0, "Min stock level must be 0 or greater"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

interface AddRawMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newMaterial: { id: string; name: string; unit: string }) => void;
}

const AddRawMaterialDialog: React.FC<AddRawMaterialDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [units, setUnits] = useState<any[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUnits();
    }
  }, [open]);

  const fetchUnits = async () => {
    try {
      setIsLoadingUnits(true);
      const unitsData = await getUnits();
      const unitsArray = (unitsData as any[]) || [];
      setUnits(unitsArray);
      // Set default unit if formik unit is empty
      if (unitsArray.length > 0 && !formik.values.unit) {
        const defaultUnit = unitsArray.find((u: any) => u.symbol === "pieces" || u.name.toLowerCase() === "pieces");
        if (defaultUnit) {
          formik.setFieldValue("unit", defaultUnit.symbol || defaultUnit.name);
        } else {
          formik.setFieldValue("unit", unitsArray[0].symbol || unitsArray[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      unit: "",
      isActive: true,
      initializeInventory: true, // Checked by default
      quantity: "",
      minStockLevel: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        
        // Step 1: Create raw material
        const newMaterial: any = await addRawMaterials({
          name: values.name,
          description: values.description || undefined,
          unit: values.unit,
          isActive: values.isActive,
        });

        // Step 2: Initialize inventory if checked
        if (values.initializeInventory && newMaterial?.id) {
          await initializeInventory({
            rawMaterialId: newMaterial.id,
            quantity: parseFloat(values.quantity),
            minStockLevel: parseFloat(values.minStockLevel) || 0,
          });
        }

        toast({
          title: "Success",
          text: values.initializeInventory
            ? "Raw material created and inventory initialized successfully"
            : "Raw material created successfully",
          type: "success",
        });
        
        formik.resetForm();
        setCurrentStep(1);
        onOpenChange(false);
        onSuccess(newMaterial);
      } catch (error: any) {
        console.error("Error creating raw material:", error);
        toast({
          title: "Error",
          text: error?.response?.data?.error || "Failed to create raw material",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (!isSubmitting) {
      formik.resetForm();
      setCurrentStep(1);
      onOpenChange(false);
    }
  };

  const handleNext = () => {
    // Validate step 1 before proceeding
    if (currentStep === 1) {
      formik.setTouched({
        name: true,
        unit: true,
      });
      if (formik.values.name && formik.values.unit) {
        setCurrentStep(2);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const canProceedToStep2 = formik.values.name && formik.values.unit;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Raw Material</DialogTitle>
          <DialogDescription>
            {currentStep === 1
              ? "Step 1 of 2: Enter raw material details"
              : "Step 2 of 2: Initialize inventory (optional)"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span
              className={`text-sm ${
                currentStep >= 1 ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Material Details
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-muted mx-4">
            <div
              className={`h-full transition-all ${
                currentStep >= 2 ? "bg-primary w-full" : "bg-muted w-0"
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span
              className={`text-sm ${
                currentStep >= 2 ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Inventory
            </span>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Step 1: Raw Material Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Cups, Sugar, Milk"
                  className={
                    formik.touched.name && formik.errors.name
                      ? "border-red-500"
                      : ""
                  }
                  disabled={isSubmitting}
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Optional description or notes"
                  rows={3}
                  disabled={isSubmitting}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-sm text-red-500">
                    {formik.errors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formik.values.isActive}
                  onCheckedChange={(checked) =>
                    formik.setFieldValue("isActive", checked)
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Raw Material
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Inventory Initialization */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Switch
                  id="initializeInventory"
                  checked={formik.values.initializeInventory}
                  onCheckedChange={(checked) => {
                    formik.setFieldValue("initializeInventory", checked);
                    if (!checked) {
                      formik.setFieldValue("quantity", "");
                      formik.setFieldValue("minStockLevel", "");
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Label htmlFor="initializeInventory" className="text-sm font-medium">
                  Initialize inventory now
                </Label>
              </div>

              {formik.values.initializeInventory && (
                <div className="space-y-4 pl-6 border-l-2 border-primary">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Initial Quantity ({formik.values.unit}) *
                    </Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="0.001"
                      value={formik.values.quantity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="0.000"
                      className={
                        formik.touched.quantity && formik.errors.quantity
                          ? "border-red-500"
                          : ""
                      }
                      disabled={isSubmitting}
                    />
                    {formik.touched.quantity && formik.errors.quantity && (
                      <p className="text-sm text-red-500">
                        {formik.errors.quantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">
                      Min Stock Level ({formik.values.unit}) *
                    </Label>
                    <Input
                      id="minStockLevel"
                      name="minStockLevel"
                      type="number"
                      step="0.001"
                      value={formik.values.minStockLevel}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="0.000"
                      className={
                        formik.touched.minStockLevel && formik.errors.minStockLevel
                          ? "border-red-500"
                          : ""
                      }
                      disabled={isSubmitting}
                    />
                    {formik.touched.minStockLevel && formik.errors.minStockLevel && (
                      <p className="text-sm text-red-500">
                        {formik.errors.minStockLevel}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Alert threshold for low stock
                    </p>
                  </div>
                </div>
              )}

              {!formik.values.initializeInventory && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                  You can initialize inventory later using the "Initialize" button in the materials list.
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between space-x-2 pt-4 border-t">
            <div>
              {currentStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {currentStep === 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || !canProceedToStep2}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Raw Material"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRawMaterialDialog;
