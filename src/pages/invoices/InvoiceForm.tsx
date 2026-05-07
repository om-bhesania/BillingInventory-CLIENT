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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Table from "@/components/ui/material-table";
import { Minus, Plus, Trash2, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { invoiceColumns } from "./Columns";
import { printInvoice } from "@/lib/utils";
import { pingUser } from "@/apis/pingapi";
import { getShop } from "@/apis/shopapi";
import { getShopInventory, ShopInventoryItem } from "@/apis/shopInventoryApi";
import {
  createBilling,
  deletePaymentMethod,
  createPaymentMethod,
  getNextInvoiceNumber,
  getPaymentMethods,
  type Billing,
  type PaymentMethod,
} from "@/apis/billingApi";
import { getProducts } from "@/apis/productapis";

type RoleString = string | null | undefined;

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
}

interface ShopSummary {
  id: string;
  name: string;
  address?: string | null;
  contactNumber?: string | null;
  managerId?: string | number | null;
}

interface PartialPaymentEntry {
  id: string;
  paymentMethodId: string;
  amount: string;
}

const ADD_NEW_PAYMENT_METHOD = "__add_new_payment_method__";

const sortShopsWithBlizzOnTop = (shops: ShopSummary[]): ShopSummary[] => {
  return [...shops].sort((a, b) => {
    const aIsBlizz = a.name?.trim().toLowerCase() === "blizz";
    const bIsBlizz = b.name?.trim().toLowerCase() === "blizz";

    if (aIsBlizz && !bIsBlizz) return -1;
    if (!aIsBlizz && bIsBlizz) return 1;

    return a.name.localeCompare(b.name);
  });
};

const DEFAULT_RECEIPT_ADDRESS =
  "Shree Foods private limited 30,\nDev industrial area, BIDC, Gorwa, Vadodara.";

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { showSuccess, showWarning, showError, showConfirm, AlertComponent } =
    useCustomAlert();

  // get all shops

  // Initial form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerName: "",
    customerEmail: "",
    customerContact: "",
    shopId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    items: [] as InvoiceItem[],
    notes: "",
    invoiceType: "SHOP", // SHOP | FACTORY
    discountPercentage: 0, // Discount percentage for factory invoices
  });

  const [isLoading, setIsLoading] = useState(false);
  const [canEditInvoiceNumber, setCanEditInvoiceNumber] = useState(false);
  const [userRole, setUserRole] = useState<RoleString>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [managedShops, setManagedShops] = useState<
    ShopSummary[]
  >([]);
  const [allShops, setAllShops] = useState<ShopSummary[]>([]);
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [partialPayments, setPartialPayments] = useState<PartialPaymentEntry[]>([
    { id: Date.now().toString(), paymentMethodId: "", amount: "" },
  ]);

  const isOwner = useMemo(() => {
    const role = (userRole || "").toLowerCase();
    return role === "owner" || role === "admin";
  }, [userRole]);

  const isShopOwner = useMemo(() => {
    const role = (userRole || "").toLowerCase();
    return (
      role === "shop owner" || role === "shop_owner" || role === "shopowner"
    );
  }, [userRole]);

  const canDeletePaymentMethods = useMemo(() => {
    return currentUserEmail.trim().toLowerCase() === "bhesaniaom@gmail.com";
  }, [currentUserEmail]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const ping = await pingUser();
        const role = ping.user?.role || null;
        setCurrentUserId(String(ping.user?.id ?? ""));
        setCurrentUserEmail(String(ping.user?.email ?? ""));
        setUserRole(role);
        const userManaged = ping.user?.managedShops || [];
        setManagedShops(
          sortShopsWithBlizzOnTop(
            userManaged.map((s) => ({
              id: s.id,
              name: s.name,
              address: s.location || "",
              contactNumber: s.contactNumber || "",
            }))
          )
        );

        if (
          role &&
          (role.toLowerCase() === "owner" || role.toLowerCase() === "admin")
        ) {
          const shopsResp: any = await getShop();
          const shopsList = (
            Array.isArray(shopsResp)
              ? shopsResp
              : shopsResp?.shops || shopsResp?.data || []
          )
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              address: s.address || s.location || "",
              contactNumber: s.contactNumber || "",
              managerId: s.managerId ?? s.manager?.id ?? null,
            }))
            .filter((s: any) => s.id && s.name);
          setAllShops(sortShopsWithBlizzOnTop(shopsList));
        } else if (userManaged.length > 0) {
          const defaultShopId = userManaged[0].id;
          setFormData((prev) => ({ ...prev, shopId: defaultShopId }));
        }
      } catch (e) {
        console.error("Failed to initialize invoice form", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isEditing) return;
    let cancelled = false;
    (async () => {
      try {
        const next = await getNextInvoiceNumber();
        if (!cancelled && next?.invoiceNumber) {
          setFormData((prev) => ({
            ...prev,
            invoiceNumber: next.invoiceNumber,
          }));
        }
      } catch {
        /* preview only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.invoiceType, isEditing]);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods || []);
        if (!selectedPaymentMethodId && methods?.length) {
          setSelectedPaymentMethodId(methods[0].id);
        }
      } catch (e) {
        console.error("Failed to load payment methods", e);
      }
    };
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    const loadInventory = async () => {
      if (!formData.shopId || formData.invoiceType !== "SHOP") {
        setInventory([]);
        return;
      }
      try {
        setIsLoading(true);
        const items = await getShopInventory(formData.shopId);
        setInventory(items || []);
      } catch (e) {
        console.error("Failed to load inventory", e);
        setInventory([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInventory();
  }, [formData.shopId, formData.invoiceType]);

  // Ensure Shop Owners can't access Factory Invoice functionality
  useEffect(() => {
    if (isShopOwner && formData.invoiceType === "FACTORY") {
      setFormData((prev) => ({ ...prev, invoiceType: "SHOP" }));
    }
  }, [isShopOwner, formData.invoiceType]);

  // Load all products for factory invoices
  useEffect(() => {
    const loadAllProducts = async () => {
      if (formData.invoiceType !== "FACTORY") {
        setAllProducts([]);
        return;
      }
      try {
        setIsLoading(true);
        const products = await getProducts();
        setAllProducts(products || []);
      } catch (e) {
        console.error("Failed to load products", e);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllProducts();
  }, [formData.invoiceType]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "customerContact") {
      // Accept only digits, max 10, format as 12345 12345
      const digits = value.replace(/\D/g, "").slice(0, 10);
      const formatted = digits.replace(/(\d{5})(\d{0,5})/, (_, a, b) =>
        b ? `${a} ${b}` : a
      );
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedPaymentMethodId) || null,
    [paymentMethods, selectedPaymentMethodId]
  );
  const isPartialPaymentSelected =
    selectedPaymentMethod?.name?.toLowerCase() === "partial payment";

  const addPartialPaymentRow = () => {
    setPartialPayments((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, paymentMethodId: "", amount: "" },
    ]);
  };

  const removePartialPaymentRow = (rowId: string) => {
    setPartialPayments((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.id !== rowId)
    );
  };

  const updatePartialPaymentRow = (
    rowId: string,
    field: "paymentMethodId" | "amount",
    value: string
  ) => {
    setPartialPayments((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const createPaymentMethodFromPrompt = async () => {
    const name = window.prompt("Enter payment method name");
    if (!name || !name.trim()) return;
    try {
      const created = await createPaymentMethod(name.trim());
      setPaymentMethods((prev) => {
        const merged = [...prev, created];
        merged.sort((a, b) => a.name.localeCompare(b.name));
        return merged;
      });
      setSelectedPaymentMethodId(created.id);
      showSuccess("Payment method added", `${created.name} is now available.`);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || "Failed to create payment method";
      showWarning("Warning", errorMessage);
    }
  };

  const deleteSelectedPaymentMethod = async () => {
    if (!canDeletePaymentMethods || !selectedPaymentMethodId) return;

    const method = paymentMethods.find((m) => m.id === selectedPaymentMethodId);
    if (!method) return;

    showConfirm(
      "Delete payment method?",
      `Delete "${method.name}" permanently from database?`,
      async () => {
        try {
          await deletePaymentMethod(method.id);
          const methods = await getPaymentMethods();
          setPaymentMethods(methods || []);
          const fallbackId =
            methods?.find((m) => m.id !== method.id)?.id || methods?.[0]?.id || "";
          setSelectedPaymentMethodId(fallbackId);
          showSuccess("Payment method deleted", `"${method.name}" removed.`);
        } catch (err: any) {
          const errorMessage =
            err?.response?.data?.error || "Failed to delete payment method";
          showError("Delete failed", errorMessage);
        }
      },
      undefined,
      "Yes, delete",
      "Cancel"
    );
  };

  const handlePaymentMethodChange = async (value: string) => {
    if (value === ADD_NEW_PAYMENT_METHOD) {
      await createPaymentMethodFromPrompt();
      return;
    }
    setSelectedPaymentMethodId(value);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productId: "",
      name: "",
      quantity: 1,
      unitPrice: 0,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const removeItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== itemId),
    });
  };

  const updateItem = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) => {
        if (item.id === id) {
          if (field === "productId") {
            if (formData.invoiceType === "SHOP") {
              const selected = inventory.find(
                (inv) => inv.product.id === value
              );
              if (selected) {
                return {
                  ...item,
                  productId: value,
                  name: selected.product.name,
                  unitPrice: selected.product.unitPrice,
                };
              }
            } else {
              // For factory invoices, use allProducts
              const selected = allProducts.find(
                (product) => product.id === value
              );
              if (selected) {
                return {
                  ...item,
                  productId: value,
                  name: selected.name,
                  unitPrice: selected.unitPrice,
                  costPrice: selected.costPrice || 0,
                };
              }
            }
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    });
  };

  const decrementQty = (id: string) => {
    const item = formData.items.find((i) => i.id === id);
    if (!item) return;
    updateItem(id, "quantity", Math.max(1, (item.quantity || 1) - 1));
  };

  const incrementQty = (id: string) => {
    const item = formData.items.find((i) => i.id === id);
    if (!item) return;
    updateItem(id, "quantity", (item.quantity || 1) + 1);
  };

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (total, item) => total + (item.unitPrice || 0) * (item.quantity || 0),
      0
    );
  };

  const calculateCGST = () => {
    return calculateSubtotal() * (2.5 / 105); // 2.5% component from GST-inclusive prices
  };

  const calculateSGST = () => {
    return calculateSubtotal() * (2.5 / 105); // 2.5% component from GST-inclusive prices
  };

  const calculateTotalTax = () => {
    return calculateCGST() + calculateSGST(); // 5% GST component already included in prices
  };

  const calculateTotalCostPrice = () => {
    // Only for factory invoices - sum up the cost price * quantity for all items
    if (formData.invoiceType !== "FACTORY") return 0;
    return formData.items.reduce(
      (total, item) => total + (item.costPrice || 0) * (item.quantity || 0),
      0
    );
  };

  const calculateDiscount = () => {
    // Only for factory invoices with discount percentage
    if (formData.invoiceType !== "FACTORY" || !formData.discountPercentage) return 0;
    
    const totalCostPrice = calculateTotalCostPrice();
    const discountDecimal = formData.discountPercentage / 100;
    
    // Apply discount twice: first on cost price, then on the result
    // Formula: (discount%)² * totalCostPrice
    const discount = discountDecimal * discountDecimal * totalCostPrice;
    
    return discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const isValidIndianPhone = (val: string) => {
    const digits = (val || "").replace(/\D/g, "");
    return digits.length === 10;
  };

  const validateForCreate = (): boolean => {
    if (!formData.customerName || formData.items.length === 0) {
      showError(
        "Validation Error",
        "Please fill all required fields and add at least one item"
      );
      return false;
    }

    if (
      formData.customerContact &&
      !isValidIndianPhone(formData.customerContact)
    ) {
      showError(
        "Validation Error",
        "Please enter a valid 10-digit Indian phone number"
      );
      return false;
    }

    if (formData.invoiceType === "SHOP" && !formData.shopId) {
      showError("Validation Error", "Please select a shop for shop invoices");
      return false;
    }

    const hasInvalidItems = formData.items.some(
      (item) => !item.productId || item.quantity <= 0
    );

    if (hasInvalidItems) {
      showError(
        "Validation Error",
        "Please ensure all items are properly selected and quantities are valid"
      );
      return false;
    }

    if (!selectedPaymentMethodId) {
      showError("Validation Error", "Please select a payment method");
      return false;
    }

    if (isPartialPaymentSelected) {
      const normalizedRows = partialPayments
        .map((row) => ({
          paymentMethodId: row.paymentMethodId,
          amount: Number(row.amount || 0),
        }))
        .filter((row) => row.paymentMethodId && row.amount > 0);

      if (normalizedRows.length === 0) {
        showError(
          "Validation Error",
          "Add at least one valid partial payment entry"
        );
        return false;
      }

      const sum = normalizedRows.reduce((acc, row) => acc + row.amount, 0);
      const totalAmount = Number(calculateTotal().toFixed(2));
      if (sum - totalAmount > 0.01) {
        showError(
          "Validation Error",
          "Partial payment total cannot exceed invoice total"
        );
        return false;
      }
    }

    return true;
  };

  const buildCreatePayload = () => ({
    shopId: formData.invoiceType === "SHOP" ? formData.shopId : undefined,
    customerName: formData.customerName,
    customerEmail: formData.customerEmail || undefined,
    customerContact: formData.customerContact
      ? formData.customerContact.replace(/\D/g, "")
      : undefined,
    invoiceType: formData.invoiceType,
    items: formData.items.map((it) => ({
      productId: it.productId,
      productName: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    subtotal: Number(calculateSubtotal().toFixed(2)),
    tax: Number(calculateTotalTax().toFixed(2)),
    discount: Number(calculateDiscount().toFixed(2)),
    total: Number(calculateTotal().toFixed(2)),
    paymentMethodId: selectedPaymentMethodId || undefined,
    paymentBreakdown: isPartialPaymentSelected
      ? partialPayments
          .map((row) => ({
            paymentMethodId: row.paymentMethodId,
            amount: Number(row.amount || 0),
          }))
          .filter((row) => row.paymentMethodId && row.amount > 0)
      : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForCreate()) return;

    try {
      setIsLoading(true);
      const billing = await createBilling(buildCreatePayload() as any);
      const invLabel = billing.invoiceNumber || billing.id;
      showSuccess(
        "Invoice Created",
        `Invoice ${invLabel} created successfully`,
        () => navigate("/invoices")
      );
    } catch (err: any) {
      console.error("Create billing failed", err);
      const errorMessage =
        err?.response?.data?.error || "Failed to create invoice";
      showWarning("Warning", errorMessage || "Failed to create invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedShopDetails = () => {
    if (formData.invoiceType !== "SHOP") return null;
    const selected = (
      allShops.find((shop) => shop.id === formData.shopId) ||
      managedShops.find((shop) => shop.id === formData.shopId) ||
      managedShops[0] ||
      null
    );
    if (!selected) return null;

    // Prefer shop details that belong to the logged-in manager/user id.
    const managerMatchedShop =
      allShops.find(
        (shop) =>
          shop.id === selected.id &&
          String(shop.managerId ?? "") === String(currentUserId || "")
      ) ||
      allShops.find(
        (shop) =>
          String(shop.managerId ?? "") === String(currentUserId || "") &&
          shop.address
      );

    return managerMatchedShop || selected;
  };

  const printFromSavedBilling = (
    billing: Billing,
    selectedShop: ReturnType<typeof getSelectedShopDetails>
  ) => {
    const shop = billing.shop;
    const outletName =
      billing.invoiceType === "FACTORY"
        ? "Factory"
        : shop?.name?.trim() ||
          selectedShop?.name?.trim() ||
          "";

    printInvoice({
      customerName: billing.customerName || formData.customerName,
      customer: billing.customerName || formData.customerName,
      customerContact: billing.customerContact || formData.customerContact,
      contactNumber: billing.customerContact || "",
      shopName: outletName,
      shop: outletName,
      invoiceNumber: billing.invoiceNumber || billing.id,
      invoiceDate: billing.createdAt,
      shopAddress:
        (shop?.address || "").trim() ||
        (selectedShop?.address || "").trim() ||
        DEFAULT_RECEIPT_ADDRESS,
      shopContact:
        shop?.contactNumber || selectedShop?.contactNumber || "",
      tax: billing.tax,
      discount: billing.discount,
      total: billing.total,
      paymentMethod: billing.paymentMethod || selectedPaymentMethod?.name || "",
      notes: formData.notes,
      items: billing.items.map((item) => ({
        name: item.productName || `Product ${item.productId}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        price: item.unitPrice,
      })),
    });
  };

  const handlePrintReceipt = async () => {
    if (!validateForCreate()) return;

    try {
      setIsLoading(true);
      const billing = await createBilling(buildCreatePayload() as any);
      const selectedShop = getSelectedShopDetails();
      printFromSavedBilling(billing, selectedShop);
      const invLabel = billing.invoiceNumber || billing.id;
      showSuccess(
        "Invoice saved",
        `Invoice ${invLabel} saved and sent to printer`,
        () => navigate("/invoices")
      );
    } catch (err: any) {
      console.error("Save and print failed", err);
      const errorMessage =
        err?.response?.data?.error || "Failed to save invoice";
      showWarning("Warning", errorMessage || "Failed to save invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? "Edit Invoice" : "Create New Invoice"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the details of an existing invoice"
            : "Create a new invoice for your customer"}
        </p>
      </div>

      <Separator className="my-6" />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Type Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-4 ${
                isOwner ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.invoiceType === "SHOP"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  setFormData({ ...formData, invoiceType: "SHOP" })
                }
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      formData.invoiceType === "SHOP"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">Shop Invoice</h3>
                    <p className="text-sm text-gray-500">
                      Create invoice for a specific shop with inventory
                      validation
                    </p>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.invoiceType === "FACTORY"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, invoiceType: "FACTORY" })
                  }
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        formData.invoiceType === "FACTORY"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Factory Invoice
                      </h3>
                      <p className="text-sm text-gray-500">
                        Create factory invoice without shop inventory validation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                onClick={() => {
                  if (canEditInvoiceNumber) return;
                  showConfirm(
                    "Edit Invoice Number?",
                    "This number is auto-generated. Do you want to edit it manually?",
                    () => setCanEditInvoiceNumber(true),
                    undefined,
                    "Yes, allow editing",
                    "No"
                  );
                }}
                disabled={!canEditInvoiceNumber}
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="Enter customer email (optional)"
              />
            </div>
            <div>
              <Label htmlFor="customerContact">Customer Contact</Label>
              <Input
                id="customerContact"
                name="customerContact"
                value={formData.customerContact}
                onChange={handleChange}
                placeholder="12345 12345"
                inputMode="numeric"
                max={10}
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.invoiceType === "SHOP" && (
              <>
                {isOwner && (
                  <div>
                    <Label htmlFor="shopId">Shop *</Label>
                    <Select
                      value={formData.shopId}
                      onValueChange={(value) =>
                        handleSelectChange("shopId", value)
                      }
                      required
                    >
                      <SelectTrigger id="shopId">
                        <SelectValue placeholder="Select shop" />
                      </SelectTrigger>
                      <SelectContent>
                        {allShops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isShopOwner && (
                  <div>
                    <Label>Shop</Label>
                    <div className="px-3 py-2 border rounded-md bg-muted/30">
                      {managedShops.find((s) => s.id === formData.shopId)
                        ?.name ||
                        managedShops[0]?.name ||
                        "Your Shop"}
                    </div>
                  </div>
                )}
              </>
            )}

            {formData.invoiceType === "FACTORY" && (
              <div>
                <Label>Invoice Type</Label>
                <div className="px-3 py-2 border rounded-md bg-blue-50 text-blue-800 font-medium">
                  🏭 Factory Invoice
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This invoice will be created without shop inventory validation
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                name="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                {canDeletePaymentMethods && selectedPaymentMethodId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelectedPaymentMethod}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Remove method
                  </Button>
                )}
              </div>
              <Select
                value={selectedPaymentMethodId}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={ADD_NEW_PAYMENT_METHOD}>
                    + Add new method
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isPartialPaymentSelected && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Partial payments</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPartialPaymentRow}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add split
                  </Button>
                </div>
                {partialPayments.map((row, idx) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                      <Select
                        value={row.paymentMethodId}
                        onValueChange={(value) =>
                          updatePartialPaymentRow(row.id, "paymentMethodId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Method ${idx + 1}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods
                            .filter(
                              (method) =>
                                method.name.toLowerCase() !== "partial payment"
                            )
                            .map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) =>
                          updatePartialPaymentRow(row.id, "amount", e.target.value)
                        }
                        placeholder="Amount"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePartialPaymentRow(row.id)}
                        disabled={partialPayments.length <= 1}
                        title="Remove split"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">
                  Paid now: ₹
                  {partialPayments
                    .reduce((sum, row) => sum + Number(row.amount || 0), 0)
                    .toFixed(2)}{" "}
                  / ₹{calculateTotal().toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Invoice Items</h2>
            <Button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            {formData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No items added yet
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Click "Add Item" to start building your invoice
                </p>
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-6 py-4 font-medium text-sm">
                        Item
                      </th>
                      <th className="text-right px-6 py-4 font-medium text-sm w-32">
                        Price (₹)
                      </th>
                      <th className="text-center px-6 py-4 font-medium text-sm w-40">
                        Quantity
                      </th>
                      <th className="text-right px-6 py-4 font-medium text-sm w-32">
                        Total (₹)
                      </th>
                      <th className="text-center px-6 py-4 font-medium text-sm w-16">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Select
                              value={item.productId}
                              onValueChange={(value) =>
                                updateItem(item.id, "productId", value)
                              }
                            >
                              <SelectTrigger className="w-full min-w-[300px]">
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.invoiceType === "SHOP"
                                  ? inventory.map((inv) => (
                                      <SelectItem
                                        key={inv.product.id}
                                        value={inv.product.id}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span>{inv.product.name}</span>
                                          <span className="text-sm text-muted-foreground ml-2">
                                            ₹{inv.product.unitPrice} • Stock:{" "}
                                            {inv.currentStock}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  : allProducts.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span>{product.name}</span>
                                          <span className="text-sm text-muted-foreground ml-2">
                                            ₹{product.unitPrice}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            disabled={formData.invoiceType !== "FACTORY"}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full text-right"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => decrementQty(item.id)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-8 w-16 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => incrementQty(item.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-lg">
                            ₹
                            {(
                              (item.unitPrice || 0) * (item.quantity || 0)
                            ).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes"
              />
            </div>

            {formData.invoiceType === "FACTORY" && (
              <div>
                <Label htmlFor="discountPercentage">
                  Discount Percentage (%)
                </Label>
                <Input
                  id="discountPercentage"
                  name="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter discount percentage"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Applied twice on total cost price: {formData.discountPercentage}% of cost, then {formData.discountPercentage}% of that result
                </p>
                {formData.discountPercentage > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Cost Price:</span>
                      <span>₹ {calculateTotalCostPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-700 font-medium mt-1">
                      <span>Discount Amount:</span>
                      <span>₹ {calculateDiscount().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between font-medium text-base">
              <span>Subtotal (GST included):</span>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>CGST (2.5%):</span>
                <span>₹ {calculateCGST().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>SGST (2.5%):</span>
                <span>₹ {calculateSGST().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-medium border-t pt-1">
                <span>Total GST Included (5%):</span>
                <span>₹ {calculateTotalTax().toFixed(2)}</span>
              </div>
              {formData.invoiceType === "FACTORY" && calculateDiscount() > 0 && (
                <div className="flex items-center justify-between text-green-600 font-medium">
                  <span>Discount:</span>
                  <span>- ₹ {calculateDiscount().toFixed(2)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span>₹ {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={handlePrintReceipt}
          >
            <Printer className="h-4 w-4 mr-2" /> Save & print receipt (3")
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/invoices")}
          >
            Cancel
          </Button>
        </div>
      </form>
      <AlertComponent />
    </>
  );
};

export default InvoiceForm;
