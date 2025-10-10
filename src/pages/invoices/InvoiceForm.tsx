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
import Table from "@/components/ui/table";
import { Minus, Plus, Trash2, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomAlert } from "@/components/ui/custom-alert";
import { invoiceColumns } from "./Columns";
import { printInvoice } from "@/lib/utils";
import { pingUser } from "@/apis/pingapi";
import { getShop } from "@/apis/shopapi";
import { getShopInventory, ShopInventoryItem } from "@/apis/shopInventoryApi";
import { createBilling } from "@/apis/billingApi";
import { getNextInvoiceNumber } from "@/apis/billingApi";
import { getProducts } from "@/apis/productapis";

type RoleString = string | null | undefined;

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [canEditInvoiceNumber, setCanEditInvoiceNumber] = useState(false);
  const [userRole, setUserRole] = useState<RoleString>(null);
  const [managedShops, setManagedShops] = useState<
    { id: string; name: string }[]
  >([]);
  const [allShops, setAllShops] = useState<{ id: string; name: string }[]>([]);
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

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

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const ping = await pingUser();
        const role = ping.user?.role || null;
        setUserRole(role);
        const userManaged = ping.user?.managedShops || [];
        setManagedShops(userManaged.map((s) => ({ id: s.id, name: s.name })));

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
            .map((s: any) => ({ id: s.id, name: s.name }))
            .filter((s: any) => s.id && s.name);
          setAllShops(shopsList);
        } else if (userManaged.length > 0) {
          const defaultShopId = userManaged[0].id;
          setFormData((prev) => ({ ...prev, shopId: defaultShopId }));
        }

        // Prefill next invoice number by looking up latest billing for selected shop once selected
        try {
          const next = await getNextInvoiceNumber();
          if (next?.invoiceNumber) {
            setFormData((prev) => ({
              ...prev,
              invoiceNumber: next.invoiceNumber,
            }));
          }
        } catch {}
      } catch (e) {
        console.error("Failed to initialize invoice form", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
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
    return calculateSubtotal() * 0.09; // 9% CGST
  };

  const calculateSGST = () => {
    return calculateSubtotal() * 0.09; // 9% SGST
  };

  const calculateTotalTax = () => {
    return calculateCGST() + calculateSGST(); // 18% Total GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const isValidIndianPhone = (val: string) => {
    const digits = (val || "").replace(/\D/g, "");
    return digits.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || formData.items.length === 0) {
      showError(
        "Validation Error",
        "Please fill all required fields and add at least one item"
      );
      return;
    }

    if (
      formData.customerContact &&
      !isValidIndianPhone(formData.customerContact)
    ) {
      showError(
        "Validation Error",
        "Please enter a valid 10-digit Indian phone number"
      );
      return;
    }

    if (formData.invoiceType === "SHOP" && !formData.shopId) {
      showError("Validation Error", "Please select a shop for shop invoices");
      return;
    }

    // Check if all items have valid selections
    const hasInvalidItems = formData.items.some(
      (item) => !item.productId || item.quantity <= 0
    );

    if (hasInvalidItems) {
      showError(
        "Validation Error",
        "Please ensure all items are properly selected and quantities are valid"
      );
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        shopId: formData.invoiceType === "SHOP" ? formData.shopId : undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
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
        discount: 0,
        total: Number(calculateTotal().toFixed(2)),
      };
      const billing = await createBilling(payload as any);
      showSuccess(
        "Invoice Created",
        `Invoice ${billing.id} created successfully`,
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

          <div className="space-y-3">
            <div className="flex items-center justify-between font-medium text-base">
              <span>Subtotal:</span>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>CGST (9%):</span>
                <span>₹ {calculateCGST().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>SGST (9%):</span>
                <span>₹ {calculateSGST().toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-medium border-t pt-1">
                <span>Total Tax (18%):</span>
                <span>₹ {calculateTotalTax().toFixed(2)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xl font-bold">
              <span>Total Amount:</span>
              <span>₹ {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit">
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => printInvoice(formData)}
          >
            <Printer className="h-4 w-4 mr-2" /> Print
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
