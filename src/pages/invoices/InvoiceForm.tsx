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
import Table from "@/components/ui/table";
import { Minus, Plus, Trash2, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { invoiceColumns } from "./Columns";
import { printInvoice } from "@/lib/utils";
import { pingUser } from "@/apis/pingapi";
import { getShop } from "@/apis/shopapi";
import { getShopInventory, ShopInventoryItem } from "@/apis/shopInventoryApi";
import { createBilling } from "@/apis/billingApi";
 

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

  // get all shops

  // Initial form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerName: "",
    customerEmail: "",
    shopId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    items: [] as InvoiceItem[],
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<RoleString>(null);
  const [managedShops, setManagedShops] = useState<{ id: string; name: string }[]>([]);
  const [allShops, setAllShops] = useState<{ id: string; name: string }[]>([]);
  const [inventory, setInventory] = useState<ShopInventoryItem[]>([]);

  const isOwner = useMemo(() => {
    const role = (userRole || "").toLowerCase();
    return role === "owner" || role === "admin";
  }, [userRole]);

  const isShopOwner = useMemo(() => {
    const role = (userRole || "").toLowerCase();
    return role === "shop owner" || role === "shop_owner" || role === "shopowner";
  }, [userRole]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const ping = await pingUser();
        const role = ping.user?.role || null;
        setUserRole(role);
        const userManaged = ping.user?.managedShops || [];
        setManagedShops(userManaged.map(s => ({ id: s.id, name: s.name })));

        if (role && (role.toLowerCase() === "owner" || role.toLowerCase() === "admin")) {
          const shopsResp: any = await getShop();
          const shopsList = (Array.isArray(shopsResp) ? shopsResp : shopsResp?.shops || shopsResp?.data || [])
            .map((s: any) => ({ id: s.id, name: s.name }))
            .filter((s: any) => s.id && s.name);
          setAllShops(shopsList);
        } else if (userManaged.length > 0) {
          const defaultShopId = userManaged[0].id;
          setFormData(prev => ({ ...prev, shopId: defaultShopId }));
        }

        // Prefill next invoice number by looking up latest billing for selected shop once selected
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
      if (!formData.shopId) {
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
  }, [formData.shopId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
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
            const selected = inventory.find((inv) => inv.product.id === value);
            if (selected) {
              return {
                ...item,
                productId: value,
                name: selected.product.name,
                unitPrice: selected.product.unitPrice,
              };
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

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.shopId || formData.items.length === 0) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill all required fields and add at least one item",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    // Check if all items have valid selections
    const hasInvalidItems = formData.items.some(
      (item) => !item.productId || item.quantity <= 0
    );

    if (hasInvalidItems) {
      Swal.fire({
        title: "Validation Error",
        text: "Please ensure all items are properly selected and quantities are valid",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        shopId: formData.shopId,
        invoiceNumber: formData.invoiceNumber || undefined,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || undefined,
        items: formData.items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        subtotal: Number(calculateSubtotal().toFixed(2)),
        tax: Number(calculateTax().toFixed(2)),
        discount: 0,
        total: Number(calculateTotal().toFixed(2)),
      };
      const billing = await createBilling(payload as any);
      Swal.fire({
        title: `Invoice Created`,
        text: `Invoice ${billing.id} created successfully`,
        icon: "success",
      });
      navigate("/invoices");
    } catch (err: any) {
      console.error("Create billing failed", err);
      Swal.fire({
        title: "Error",
        text: err?.message || "Failed to create invoice",
        icon: "error",
      });
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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="e.g., 0004"
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
          </div>

          <div className="space-y-4">
            {isOwner && (
              <div>
                <Label htmlFor="shopId">Shop *</Label>
                <Select
                  value={formData.shopId}
                  onValueChange={(value) => handleSelectChange("shopId", value)}
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
                  {managedShops.find(s => s.id === formData.shopId)?.name || managedShops[0]?.name || "Your Shop"}
                </div>
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Invoice Items</h2>
            <Button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div>
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-3 py-2">Item</th>
                  <th className="text-right px-3 py-2 w-[150px]">Price (₹)</th>
                  <th className="text-right px-3 py-2 w-[160px]">Quantity</th>
                  <th className="text-right px-3 py-2 w-[150px]">Total (₹)</th>
                  <th className="px-3 py-2 w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      No items added. Click "Add Item" to add invoice items.
                    </td>
                  </tr>
                ) : (
                  formData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateItem(item.id, "productId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((inv) => (
                              <SelectItem key={inv.product.id} value={inv.product.id}>
                                {inv.product.name} (₹{inv.product.unitPrice}) — Stock: {inv.currentStock}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="h-8 w-[120px] ml-auto text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => decrementQty(item.id)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                            className="h-8 w-14 text-center"
                          />
                          <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => incrementQty(item.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </div>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between font-medium">
              <span>Subtotal:</span>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax (18% GST):</span>
              <span>₹ {calculateTax().toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹ {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit">
            {isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => printInvoice(formData)}>
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
    </>
  );
};

export default InvoiceForm;
