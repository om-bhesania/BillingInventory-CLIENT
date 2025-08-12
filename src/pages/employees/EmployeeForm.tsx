import { registerApi } from "@/apis/auth";
import { getRole } from "@/apis/employeeapi";
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
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@mui/material";
import { useFormik } from "formik";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import * as Yup from "yup";

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  contact: Yup.string()
    .required("Contact is required")
    .min(10, "Contact must be at least 10 characters")
    .max(15, "Contact must be at most 15 characters"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  roleId: Yup.string().required("Role is required"),
});

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [showPassword, setShowPassword] = useState(false);

  // Generate random password function
  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  const [roleData, setRoleData] = useState<any>([]);
  const fetchRoleData = async () => {
    try {
      const response: any = await getRole();
      setRoleData(response);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);
  const formatedRoles = roleData.map((role: any) => ({
    id: role.id,
    name:
      role.name === "Show_Owner" ? "Show Owner" : role.name.replace(/_/g, " "),
  }));
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: isEditing ? "John Doe" : "",
      email: isEditing ? "john.doe@iceberg.com" : "",
      contact: isEditing ? "+91 9876543210" : "",
      password: isEditing ? "existingpassword" : "",
      roleId: isEditing ? "1" : "",
      role: isEditing ? [] : [],
      roleName: isEditing ? "Show Owner" : "",
      isActive: isEditing ? true : true,
    },
    validationSchema,
    onSubmit: async (values) => {
      // Create payload matching User model
      const payload = {
        name: values.name,
        email: values.email,
        contact: values.contact,
        password: values.password,
        roleId: values.roleId,
        role: values.roleName,
        isActive: values.isActive,
      };

      await registerApi(payload);
      handleAccountCreated(payload, values.roleName);
      formik.resetForm();
      toast({
        title: `Employee ${isEditing ? "Updated" : "Added"}`,
        text: `${values.name} has been ${
          isEditing ? "updated" : "added"
        } successfully.`,
        type: "success",
      });
    },
  });
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show mini toast notification
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `${label} copied!`,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `${label} copied!`,
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Function to copy all account details as formatted text
  const copyAllDetails = (accountData: UserAccountData) => {
    const allDetails = `
  Account Details:
  ================
  Name: ${accountData.name}
  Email: ${accountData.email}
  Contact: ${accountData.contact}
  Password: ${accountData.password}
  Role: ${accountData.roleName}
  ${accountData.createdAt ? `Created: ${accountData.createdAt}` : ""}
  
  Please keep this information secure and share only with the designated person.
    `.trim();

    copyToClipboard(allDetails, "All account details");
  };

  // Main function to show account details modal
  const showAccountDetailsModal = (accountData: UserAccountData) => {
    const modalContent = `
      <div style="text-align: left; font-family: 'Inter', sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 30px; height: 30px; color: white;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">Account Created Successfully!</h3>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Share these details with the designated person</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 16px; height: 16px; color: #6b7280;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                  <path d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span style="font-weight: 500; color: #374151;">Name</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #1f2937; font-family: monospace;">${accountData.name}</span>
                <button onclick="copyToClipboard('${accountData.name}', 'Name')" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;" title="Copy Name">
                  <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
            </div>
  
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 16px; height: 16px; color: #6b7280;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span style="font-weight: 500; color: #374151;">Email</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #1f2937; font-family: monospace;">${accountData.email}</span>
                <button onclick="copyToClipboard('${accountData.email}', 'Email')" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;" title="Copy Email">
                  <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
            </div>
  
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 16px; height: 16px; color: #6b7280;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span style="font-weight: 500; color: #374151;">Contact</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #1f2937; font-family: monospace;">${accountData.contact}</span>
                <button onclick="copyToClipboard('${accountData.contact}', 'Contact')" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;" title="Copy Contact">
                  <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
            </div>
  
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 16px; height: 16px; color: #6b7280;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span style="font-weight: 500; color: #374151;">Password</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #dc2626; font-family: monospace; font-weight: 600;">${accountData.password}</span>
                <button onclick="copyToClipboard('${accountData.password}', 'Password')" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;" title="Copy Password">
                  <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
            </div>
  
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg style="width: 16px; height: 16px; color: #6b7280;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <span style="font-weight: 500; color: #374151;">Role</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #1f2937; font-family: monospace;">${accountData.roleName}</span>
                <button onclick="copyToClipboard('${accountData.roleName}', 'Role')" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 4px;" title="Copy Role">
                  <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <svg style="width: 16px; height: 16px; color: #d97706;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span style="font-weight: 600; color: #92400e; font-size: 14px;">Security Notice</span>
          </div>
          <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.4;">
            Please share these credentials securely with the designated person. Ask them to change the password on first login for better security.
          </p>
        </div>
      </div>
    `;

    // Make copyToClipboard function available globally for the modal
    (window as any).copyToClipboard = copyToClipboard;

    Swal.fire({
      title: "",
      html: modalContent,
      width: 600,
      showCancelButton: true,
      confirmButtonText:
        '<svg style="width: 16px; height: 16px; margin-right: 8px;" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>Copy All Details',
      cancelButtonText: "Close",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "swal-account-details",
        confirmButton: "swal-copy-all-btn",
        cancelButton: "swal-close-btn",
      },
      didOpen: () => {
        // Add custom styles
        const style = document.createElement("style");
        style.textContent = `
          .swal-account-details {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          .swal-copy-all-btn, .swal-close-btn {
            display: inline-flex !important;
            align-items: center !important;
            font-weight: 500 !important;
            border-radius: 6px !important;
            padding: 8px 16px !important;
            font-size: 14px !important;
          }
          .swal-copy-all-btn:hover {
            background-color: #059669 !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed) {
        copyAllDetails(accountData);
      }
      // Clean up the global function
      delete (window as any).copyToClipboard;
    });
  };
  interface UserAccountData {
    name: string;
    email: string;
    contact: string;
    password: string;
    roleName: string;
    createdAt?: string;
  }
  // Usage example function - call this after successful account creation
  const handleAccountCreated = (userData: any, roleName: string) => {
    const accountData: UserAccountData = {
      name: userData.name,
      email: userData.email,
      contact: userData.contact,
      password: userData.password, // This should be the plain text password before hashing
      roleName: roleName,
      createdAt: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    showAccountDetailsModal(accountData);
  };
  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    formik.setFieldValue("password", newPassword);
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit Employee" : "Add New Employee"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the details of an existing employee"
            : "Add a new employee to your system"}
        </p>
      </div>

      <Separator className="my-6" />

      <div className="section-card">
        <form onSubmit={formik.handleSubmit} className="space-y-6 max-w-2xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="John Doe"
                className={
                  formik.touched.name && formik.errors.name
                    ? "border-red-500"
                    : ""
                }
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-sm text-red-500">{formik.errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="john.doe@iceberg.com"
                className={
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : ""
                }
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-sm text-red-500">{formik.errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Number *</Label>
              <Input
                id="contact"
                name="contact"
                value={formik.values.contact}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="+91 9876543210"
                className={
                  formik.touched.contact && formik.errors.contact
                    ? "border-red-500"
                    : ""
                }
              />
              {formik.touched.contact && formik.errors.contact && (
                <p className="text-sm text-red-500">{formik.errors.contact}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="roleId">Role *</Label>
              <Select
                value={formik.values.roleId}
                onValueChange={(value: string) => {
                  const selectedRole = formatedRoles.find(
                    (role: any) => role.id === value
                  );
                  console.log("first", selectedRole);
                  formik.setFieldValue("roleId", value);
                  formik.setFieldValue("roleName", selectedRole?.name);
                }}
              >
                <SelectTrigger
                  id="roleId"
                  className={
                    formik.touched.roleId && formik.errors.roleId
                      ? "border-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {formatedRoles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formik.touched.roleId && formik.errors.roleId && (
                <p className="text-sm text-red-500">{formik.errors.roleId}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter password"
                className={`pr-20 ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : ""
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleGeneratePassword}
                  title="Generate random password"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-sm text-red-500">{formik.errors.password}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="isActive">Is Active</Label>
            <Checkbox
              id="isActive"
              name="isActive"
              value={formik.values.isActive}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              classes={{
                indeterminate: "bg-blue-500 border-blue-500",
              }}
              className={
                formik.touched.isActive && formik.errors.isActive
                  ? "border-red-500"
                  : ""
              }
            />
            {formik.touched.isActive && formik.errors.isActive && (
              <p className="text-sm text-red-500">{formik.errors.isActive}</p>
            )}
          </div>
          <div className="flex gap-4">
            <Button type="submit">
              {isEditing ? "Update Employee" : "Add Employee"}
            </Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EmployeeForm;
