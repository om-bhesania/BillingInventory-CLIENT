import { getEmployee } from "@/apis/employeeapi";
import { addShop, getShopById, updateShop, deleteShop } from "@/apis/shopapi";
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
import useToast from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import * as Yup from "yup";

// Validation Schema
const shopValidationSchema = Yup.object({
  name: Yup.string()
    .required("Shop name is required")
    .min(2, "Shop name must be at least 2 characters")
    .max(100, "Shop name must be less than 100 characters"),

  address: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .max(500, "Address must be less than 500 characters"),

  contactNumber: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid contact number")
    .max(20, "Contact number must be less than 20 characters"),

  email: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),

  operatingHours: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .max(100, "Operating hours must be less than 100 characters"),

  managerName: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .max(100, "Manager name must be less than 100 characters"),

  maxCapacity: Yup.number()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .positive("Maximum capacity must be a positive number")
    .integer("Maximum capacity must be a whole number")
    .max(10000, "Maximum capacity cannot exceed 10,000"),

  description: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .max(1000, "Description must be less than 1000 characters"),

  logoUrl: Yup.string()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .url("Please enter a valid URL")
    .max(500, "Logo URL must be less than 500 characters"),

  openingDate: Yup.date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : value;
    })
    .max(new Date(), "Opening date cannot be in the future"),

  isActive: Yup.boolean(),

  publicId: Yup.string()
    .required("Shop Owner/Manager is required")
    .max(100, "Public ID must be less than 100 characters"),
});

interface ShopFormValues {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  operatingHours: string;
  managerName: string;
  maxCapacity: number | "";
  description: string;
  logoUrl: string;
  openingDate: string;
  isActive: boolean;
  //ownerId: string; // New field for shop owner
  publicId: string; // New field for shop manager (publicId is always a string)
}

const ShopForm = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const idRaw = params.id || searchParams.get("id") || "";
  const id = idRaw ? idRaw.replace("id=", "") : "";
  const isEditing = !!id;
  const [EmployeeData, setEmployeeData] = useState<any>([]);
  const [loadedShop, setLoadedShop] = useState<any | null>(null);
  const { toast } = useToast();
  // const v4 = uuidv4()
  // console.log('first',v4)

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        logger.data.fetch("employees", "Fetching employee data for shop form");
        const response: any = await getEmployee();
        // Handle both direct array response and response.data structure
        const employees = Array.isArray(response) ? response : (response?.data || []);
        
        logger.data.success(
          "employees",
          `Loaded ${employees.length} employees`
        );
        if (employees.length > 0) {
          logger.debug("Employee data sample", employees[0]);
        }
        console.log("response for employee get api =====>", response);
        setEmployeeData(employees);
      } catch (error) {
        logger.data.error("employees", error);
        return false;
      }
    };
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isEditing || !id) return;
      try {
        const data: any = await getShopById(id);
        setLoadedShop(data);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [isEditing, id]);

  // Initial form values
  const initialValues: ShopFormValues = useMemo(
    () => ({
      name: loadedShop?.name || "",
      address: loadedShop?.address || "",
      contactNumber: loadedShop?.contactNumber || "",
      email: loadedShop?.email || "",
      operatingHours: loadedShop?.operatingHours || "",
      managerName: loadedShop?.managerName || "",
      maxCapacity: loadedShop?.maxCapacity ?? "",
      description: loadedShop?.description || "",
      logoUrl: loadedShop?.logoUrl || "",
      openingDate: loadedShop?.openingDate
        ? String(loadedShop.openingDate).slice(0, 10)
        : "",
      isActive: loadedShop?.isActive ?? true,
      publicId: loadedShop?.publicId || "",
    }),
    [loadedShop]
  );

  const handleSubmit = async (
    values: ShopFormValues,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Form values received:", values);
      console.log("publicId value:", values.publicId);
      console.log("managerName value:", values.managerName);
      console.log("EmployeeData available:", EmployeeData.length, "employees");
      
      // Check if publicId is empty
      if (!values.publicId || values.publicId === "") {
        console.error("Form submission blocked: publicId is required but empty");
        toast({
          title: "Validation Error",
          description: "Please select a Shop Owner/Manager before submitting.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Convert empty string to null for optional fields
      const submitData = {
        ...values,
        maxCapacity: values.maxCapacity === "" ? null : values.maxCapacity,
        // location: values.location || undefined,
        address: values.address || undefined,
        contactNumber: values.contactNumber || undefined,
        email: values.email || undefined,
        operatingHours: values.operatingHours || undefined,
        managerName: values.managerName || undefined,
        description: values.description || undefined,
        logoUrl: values.logoUrl || undefined,
        openingDate: values.openingDate
          ? new Date(values.openingDate)
          : undefined,
      };

      // Ensure managerName is set based on selected manager/owner
      let finalManagerName = values.managerName;
      console.log("Form submission - values.publicId:", values.publicId);
      console.log("Form submission - values.managerName:", values.managerName);
      console.log("Form submission - finalManagerName:", finalManagerName);
      if (!finalManagerName && values.publicId) {
        const selectedPublicId = values.publicId;
        const selectedEmployee = EmployeeData.find(
          (emp: any) => (emp.publicId || emp.id) === selectedPublicId
        );
        console.log("selectedEmployee", selectedEmployee);
        if (selectedEmployee) {
          finalManagerName = selectedEmployee.name;
        }
      }
console.log("submitData", submitData);
console.log("values.publicId", values.publicId);
      logger.form.submit("ShopForm", {
        ...submitData,
        // ownerId: values.ownerId || undefined,
        managerId: values.publicId || undefined,
        managerName: values.managerName || undefined,
      });

      const res =
        isEditing && id
          ? await updateShop(id, {
              ...submitData,
              managerId: values.publicId || undefined,
              managerName: values.managerName || undefined,
            })
          : await addShop({
              ...submitData,
              managerId: values.publicId || undefined,
              managerName: values.managerName || undefined,
            });
      logger.form.success(
        "ShopForm",
        `Shop "${values.name}" created successfully`
      );
      console.log("res", res);
      if (res) {
        toast({
          title: `Shop ${isEditing ? "Updated" : "Created"}`,
          text: `${values.name} has been ${
            isEditing ? "updated" : "created"
          } successfully.`,
          type: "success",
        });
      }

      setSubmitting(false);
      resetForm();
      navigate("/shops");
    } catch (error: any) {
      console.log("error",);
      toast({
        title: "Error While Creating Shop",
        text: `${error?.response?.data?.error || "something went wrong"}`,
        type: "error",
        // Duration will be automatically set to 8 seconds for error type
        // Pause on hover is automatically enabled
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !id) return;
    try {
      await deleteShop(id);
      toast({
        title: "Shop deleted",
        text: "Shop removed successfully.",
        type: "success",
      });
      navigate("/shops");
    } catch (error) {
      toast({
        title: "Error",
        text: `Failed to delete shop. ${error.message}`,
        type: "error",
        // Duration will be automatically set to 8 seconds for error type
        // Pause on hover is automatically enabled
      });
    }
  };
  console.log("selectedManager", EmployeeData);
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit Shop" : "Add New Shop"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the details of an existing shop"
            : "Add a new shop to your business"}
        </p>
      </div>

      <Separator className="my-6" />

      <Formik
        initialValues={initialValues}
        validationSchema={shopValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting, errors, touched, isValid }) => (
          <Form className="space-y-8">
            {/* Basic Information */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4  section-card">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Shop Name *</Label>
                    <Field
                      as={Input}
                      id="name"
                      name="name"
                      placeholder="Enter shop name"
                      className={
                        errors.name && touched.name ? "border-red-500" : ""
                      }
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Field
                      as={Textarea}
                      id="address"
                      name="address"
                      placeholder="Enter complete address"
                      rows={3}
                      className={
                        errors.address && touched.address
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <ErrorMessage
                      name="address"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4  section-card">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Field
                      as={Input}
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="+91 8800000000"
                      className={
                        errors.contactNumber && touched.contactNumber
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <ErrorMessage
                      name="contactNumber"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Field
                      as={Input}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="shop@example.com"
                      className={
                        errors.email && touched.email ? "border-red-500" : ""
                      }
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Operational Details */}
              <div className="space-y-4  section-card">
                <h3 className="text-lg font-medium">Operational Details</h3>

                {/* User Selection Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong>
                    {EmployeeData.filter((i: any) => i.role === "Shop_Owner")
                      .length || 0}{" "}
                    user(s) available for selection. Users must be created first
                    in the Employees section before they can be assigned as shop
                    owners or managers.
                  </p>
                  {EmployeeData.filter((i: any) => i.role === "Shop_Owner" && i.managedShops?.length > 0).length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      <strong>Currently managing shops:</strong>{" "}
                      {EmployeeData
                        .filter((i: any) => i.role === "Shop_Owner" && i.managedShops?.length > 0)
                        .map((emp: any) => `${emp.name} (${emp.managedShops.length})`)
                        .join(", ")}
                    </p>
                  )}
                  {/* Debug info */}
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <strong>Debug:</strong> publicId = "{values.publicId}", managerName = "{values.managerName}"
                    <br />
                    <strong>Form Status:</strong> isValid = {isValid ? "true" : "false"}, errors = {JSON.stringify(errors)}
                    <br />
                    <strong>Available Employees:</strong> {EmployeeData.filter((i: any) => i.role === "Shop_Owner" || i.role === "Shop Owner").length}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="publicId">
                      Shop Owner/Manager{" "}
                      <span className="text-xs text-gray-500">
                        (only users with Role "Shop Owner" are visible here)
                      </span>{" "}
                    </Label>
                    <Field name="publicId">
                      {({ field, form }: any) => (
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => {
                            console.log("Select onValueChange called with value:", value);
                            console.log("Current field.value:", field.value);
                            console.log("Form values before update:", form.values);
                            
                            // Set the publicId field
                            form.setFieldValue("publicId", value);
                            
                            // Auto-populate managerName when manager is selected
                            if (value && value !== "no-employees") {
                              const selectedManager = EmployeeData.find(
                                (emp: any) => (emp.publicId || emp.id) === value
                              );
                              console.log("Selected manager:", selectedManager);

                              if (selectedManager) {
                                form.setFieldValue("managerName", selectedManager.name);
                                console.log("Set managerName to:", selectedManager.name);
                              }
                            } else {
                              form.setFieldValue("managerName", "");
                            }
                            
                            // Force form validation
                            form.validateField("publicId");
                            console.log("Form values after update:", form.values);
                            console.log("Form errors after update:", form.errors);
                          }}
                        >
                          <SelectTrigger id="publicId">
                            <SelectValue placeholder="Select Shop Owner" />
                          </SelectTrigger>
                          <SelectContent>
                            {EmployeeData && EmployeeData.length > 0 ? (
                              EmployeeData.filter(
                                (i) => i.role === "Shop_Owner" || i.role === "Shop Owner"
                              )                              .map((employee) => (
                                <SelectItem
                                  key={employee.id}
                                  value={employee.publicId || employee.id}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{employee.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {employee.email} • {employee.role} • {employee.managedShops?.length || 0} shops
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-employees" disabled>
                                No Shop Owner users available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                    <ErrorMessage
                      name="publicId"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="operatingHours">Operating Hours</Label>
                    <Field
                      as={Input}
                      id="operatingHours"
                      name="operatingHours"
                      placeholder="e.g., 09:00 AM - 10:00 PM"
                      className={
                        errors.operatingHours && touched.operatingHours
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <ErrorMessage
                      name="operatingHours"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>
                <Field
                  type="hidden"
                  name="managerName"
                  value={values.managerName}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="maxCapacity">Maximum Capacity</Label>
                    <Field
                      as={Input}
                      id="maxCapacity"
                      name="maxCapacity"
                      type="number"
                      placeholder="e.g., 50"
                      className={
                        errors.maxCapacity && touched.maxCapacity
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <ErrorMessage
                      name="maxCapacity"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="openingDate">Opening Date</Label>
                    <Field
                      as={Input}
                      id="openingDate"
                      name="openingDate"
                      type="date"
                      className={
                        errors.openingDate && touched.openingDate
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <ErrorMessage
                      name="openingDate"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>

                {/* Hidden field to track managerName */}
              </div>

              {/* Additional Information */}
              <div className="space-y-4  section-card">
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="grid gap-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Field
                    as={Input}
                    id="logoUrl"
                    name="logoUrl"
                    placeholder="https://example.com/logo.png"
                    className={
                      errors.logoUrl && touched.logoUrl ? "border-red-500" : ""
                    }
                  />
                  <ErrorMessage
                    name="logoUrl"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Field
                    as={Textarea}
                    id="description"
                    name="description"
                    placeholder="Enter shop description"
                    rows={4}
                    className={
                      errors.description && touched.description
                        ? "border-red-500"
                        : ""
                    }
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Field
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive">Shop is Active</Label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 items-end justify-end section-card">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Update Shop"
                  : "Create Shop"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default ShopForm;
