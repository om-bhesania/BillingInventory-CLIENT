import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  createShopInventory,
  updateShopInventoryStock,
  ShopInventoryItem,
  CreateShopInventoryRequest,
  UpdateStockRequest,
  bulkCreateShopInventory,
} from "@/apis/shopInventoryApi";
import { getProducts } from "@/apis/productapis";
import useToast from "@/hooks/use-toast";
import { getShop } from "@/apis/shopapi";
import { useAuth } from "@/contexts/AuthContext";
import { createRestockRequest } from "@/apis/restockRequestApi";
import { paymentApi } from "@/apis/paymentApi";
import { service } from "@/services/service";
import { API_URL } from "@/services/apiuri";
import {
  Plus,
  Trash2,
  Package,
  Store,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Zap,
  Sparkles,
  Upload,
  FileText,
  CreditCard,
  Receipt,
  Percent,
  Calculator,
  DollarSign,
  X,
} from "lucide-react";
import { usePingUser } from "@/hooks/use-pingUser";

const inventoryItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  currentStock: z.number().min(1, "Stock must be at least 1"),
  minStockPerItem: z
    .number({ invalid_type_error: "Enter a valid number" })
    .optional(),
  lowStockAlertsEnabled: z.boolean().default(true),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["upfront", "credit"]).default("upfront"),
  receiptFile: z.any().optional(),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

const bulkInventorySchema = z.object({
  items: z.array(inventoryItemSchema).min(1, "At least one item is required"),
  payment: paymentSchema.optional(),
});

type InventoryItem = z.infer<typeof inventoryItemSchema>;
type PaymentData = z.infer<typeof paymentSchema>;
type BulkInventoryFormData = z.infer<typeof bulkInventorySchema>;

interface ShopInventoryFormProps {
  inventoryItem?: ShopInventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
}

interface Shop {
  id: string;
  name: string;
}

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  validUntil: string;
}

function ShopInventoryForm({
  inventoryItem,
  onSuccess,
  onCancel,
}: ShopInventoryFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDiscountCode, setSelectedDiscountCode] =
    useState<DiscountCode | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upfront" | "credit">(
    "upfront"
  );
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { user: pingUser } = usePingUser();

  // Get user's shop IDs from ping data
  const userShopIds =
    user?.managedShops?.map((shop) => shop.id) ||
    pingUser?.managedShops?.map((shop) => shop.id) ||
    [];
  // For Shop Owner role, automatically use their assigned shop
  const isShopOwner =
    user?.role === "Shop_Owner" || user?.role === "Shop Owner";
  const autoSelectedShopId =
    isShopOwner && userShopIds.length > 0 ? userShopIds[0] : "";

  // Get itemId from URL params
  const itemId = searchParams.get('itemId');
  const prefilledProduct = itemId ? products.find(p => p.id === itemId) : null;
console.log("userShopIds", pingUser);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InventoryItem>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      productId: inventoryItem?.productId || prefilledProduct?.id || "",
      currentStock: inventoryItem?.currentStock || (prefilledProduct ? 50 : 1),
      minStockPerItem: inventoryItem?.minStockPerItem || 0,
      lowStockAlertsEnabled: inventoryItem?.lowStockAlertsEnabled ?? true,
    },
  });

  // Reset form to default values
  const resetForm = () => {
    reset({
      productId: prefilledProduct?.id || "",
      currentStock: prefilledProduct ? 50 : 1,
      minStockPerItem: 0,
      lowStockAlertsEnabled: true,
    });
  };

  const watchedProductId = watch("productId");
  const watchedCurrentStock = watch("currentStock");
  const watchedMinStockPerItem = watch("minStockPerItem");
  const watchedAlertsEnabled = watch("lowStockAlertsEnabled");

  /** Same stock for several products — selection + one shared quantity */
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkStock, setBulkStock] = useState(1);

  // Auto-calculate min stock as 20% of current stock, but allow 0
  const calculateMinStock = (stock: number) => {
    return Math.max(0, Math.round(stock * 0.2));
  };

  // Calculate total amount and apply discount
  useEffect(() => {
    if (!inventoryItems || !Array.isArray(inventoryItems)) return;
    
    const total = inventoryItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.unitPrice * item.currentStock : 0);
    }, 0);

    setTotalAmount(total);

    if (selectedDiscountCode) {
      let discount = 0;
      switch (selectedDiscountCode.discountType) {
        case "percentage":
          discount = total * (selectedDiscountCode.discountValue / 100);
          break;
        case "flat":
          discount = selectedDiscountCode.discountValue;
          break;
        default:
          discount = 0;
      }

      setDiscountAmount(Math.min(discount, total));
      setFinalAmount(Math.max(0, total - discount));
    } else {
      setDiscountAmount(0);
      setFinalAmount(total);
    }
  }, [inventoryItems, products, selectedDiscountCode]);

  // Handle URL parameters for prefilling - set form values when products are loaded
  useEffect(() => {
    if (prefilledProduct && !inventoryItem) {
      setValue("productId", prefilledProduct.id);
      setValue("currentStock", 50); // Prefill stock amount to 50
    }
  }, [prefilledProduct, inventoryItem, setValue]);

  // Auto-fill product details when product is selected
  useEffect(() => {
    if (watchedProductId) {
      const selectedProduct = products.find((p) => p.id === watchedProductId);
      if (selectedProduct) {
        // Auto-fill SKU and unit price in the form (for display purposes)
        // The form will show this information to the user
        console.log("Selected product:", selectedProduct);
      }
    }
  }, [watchedProductId, products]);
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const productsData = await getProducts();
      setProducts(productsData as Product[]);

      // For non-Shop Owner roles, fetch shops
      if (!isShopOwner) {
        const shopsData = await getShop();
        setShops(shopsData as Shop[]);
      }
    } catch (error) {
      toast({
        title: "Oops! 🚨",
        text: "Failed to fetch data. Our data elves are on strike!",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Add item to inventory list
  const addItemToList = () => {
    if (!watchedProductId) {
      toast({
        title: "Hold up! 🛑",
        text: "Please select a product first",
        type: "error",
      });
      return;
    }

    const stockAmount = Number(watchedCurrentStock) || 0;
    if (stockAmount <= 0) {
      toast({
        title: "Invalid Stock! ⚠️",
        text: "Please enter a valid stock amount greater than 0",
        type: "error",
      });
      return;
    }

    const newItem: InventoryItem = {
      productId: watchedProductId,
      currentStock: stockAmount,
      minStockPerItem:
        typeof watchedMinStockPerItem === "number" &&
        watchedMinStockPerItem >= 0
          ? watchedMinStockPerItem
          : calculateMinStock(stockAmount), // Auto-calculate 20% if not specified
      lowStockAlertsEnabled: watchedAlertsEnabled ?? true,
    };

    // Always add new item to the list (no replacement)
    setInventoryItems((prev) => [...prev, newItem]);

    toast({
      title: "Added! 🎉",
      text: "Product added to your inventory list",
      type: "success",
    });

    // Reset form to default values
    resetForm();
  };

  const toggleBulkProduct = (productId: string, checked: boolean) => {
    setBulkSelectedIds((prev) => {
      if (checked) {
        return prev.includes(productId) ? prev : [...prev, productId];
      }
      return prev.filter((id) => id !== productId);
    });
  };

  const addBulkToList = () => {
    if (bulkSelectedIds.length === 0) {
      toast({
        title: "Hold up! 🛑",
        text: "Select at least one product",
        type: "error",
      });
      return;
    }

    const stockAmount = Number(bulkStock) || 0;
    if (stockAmount <= 0) {
      toast({
        title: "Invalid Stock! ⚠️",
        text: "Please enter a valid stock amount greater than 0",
        type: "error",
      });
      return;
    }

    const minStock = calculateMinStock(stockAmount);

    const newItems: InventoryItem[] = bulkSelectedIds.map((productId) => ({
      productId,
      currentStock: stockAmount,
      minStockPerItem: minStock,
      lowStockAlertsEnabled: true,
    }));

    setInventoryItems((prev) => [...prev, ...newItems]);

    toast({
      title: "Added! 🎉",
      text: `${newItems.length} product(s) added with stock ${stockAmount}`,
      type: "success",
    });

    setBulkSelectedIds([]);
    setBulkStock(1);
  };

  // Remove item from inventory list
  const removeItemFromList = (index: number) => {
    setInventoryItems((prev) => prev.filter((_, i) => i !== index));
    toast({
      title: "Removed! 🗑️",
      text: "Product removed from your list",
      type: "success",
    });
  };

  // Clear all items from inventory list
  const clearAllItems = () => {
    setInventoryItems([]);
    toast({
      title: "Cleared! 🧹",
      text: "All items removed from your list",
      type: "success",
    });
  };
  // Submit all items
  const onSubmit = async () => {
    if (!inventoryItems || inventoryItems.length === 0) {
      toast({
        title: "Empty cart! 🛒",
        text: "Add some products to your inventory list first",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const targetShopId = autoSelectedShopId || userShopIds[0];
      console.log("targetShopId", targetShopId);
      if (!targetShopId) {
        toast({
          title: "Shop missing! 🏪",
          text: "Unable to determine which shop to add inventory to",
          type: "error",
        });
        return;
      }

      // Create restock requests with payment data
      const restockRequestIds: string[] = [];

      for (const item of inventoryItems) {
        const product = products.find((p) => p.id === item.productId);
        const itemTotal = product ? product.unitPrice * item.currentStock : 0;

        const restockRequest = await createRestockRequest({
          shopId: targetShopId,
          productId: item.productId,
          requestedAmount: item.currentStock,
          requestType: "INVENTORY_ADD",
          paymentMethod,
          discountCode: selectedDiscountCode?.code,
          totalAmount: itemTotal,
          discountAmount: selectedDiscountCode
            ? selectedDiscountCode.discountType === "percentage"
              ? itemTotal * (selectedDiscountCode.discountValue / 100)
              : selectedDiscountCode.discountValue
            : 0,
          finalAmount: finalAmount / (inventoryItems?.length || 1), // Distribute total amount
          notes: `Min: ${item.minStockPerItem || 0}, Alerts: ${
            item.lowStockAlertsEnabled ? "Enabled" : "Disabled"
          }${
            selectedDiscountCode
              ? `, Discount: ${selectedDiscountCode.code}`
              : ""
          }`,
        });

        restockRequestIds.push(restockRequest.id);
      }

      // Upload receipt if credit payment method
      if (paymentMethod === "credit" && receiptFile) {
        for (const requestId of restockRequestIds) {
          try {
            await paymentApi.uploadReceipt({
              restockRequestId: requestId,
              receiptFile: receiptFile,
            });
          } catch (error) {
            console.error("Error uploading receipt:", error);
            toast({
              title: "Warning",
              description: "Receipt upload failed, but request was created",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Request sent! 📋",
        text: `Sent ${inventoryItems?.length || 0} item(s) for approval. ${
          paymentMethod === "credit"
            ? "Receipt uploaded for verification."
            : "Payment will be processed upon approval."
        }`,
        type: "success",
      });

      // Clear the list and reset
      setInventoryItems([]);
      setReceiptFile(null);
      setSelectedDiscountCode(null);
      setPaymentMethod("upfront");
      onSuccess?.();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Oops! 😅",
        text: "Failed to save inventory. Our servers are having a coffee break!",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing inventory item
  const onUpdateSingle = async (data: InventoryItem) => {
    if (!inventoryItem) return;
    console.log("data", data);
    setIsSubmitting(true);
    try {
      const updateData: UpdateStockRequest = {
        currentStock: data.currentStock,
      };

      await updateShopInventoryStock(inventoryItem.id, updateData);

      toast({
        title: "Updated! ✨",
        text: "Inventory stock updated successfully",
        type: "success",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Update failed! 😔",
        text: "Failed to update inventory stock",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === watchedProductId);
  const selectedShop = shops.find((s) => s.id === autoSelectedShopId);

  if (isLoading || authLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Package className="h-8 w-8 text-blue-600 mr-2" />
            <CardTitle className="text-2xl font-bold text-blue-900">
              {inventoryItem
                ? "Update Inventory Stock"
                : prefilledProduct
                ? "Add Product to Inventory"
                : "Add Products to Inventory"}
            </CardTitle>
            <Sparkles className="h-6 w-6 text-yellow-500 ml-2" />
          </div>
          <CardDescription className="text-blue-700">
            {inventoryItem
              ? "Update the current stock level for this product"
              : prefilledProduct
              ? "Product pre-selected from URL parameter"
              : "Request inventory additions! Add multiple products and send them for admin approval. 🚀"}
          </CardDescription>
          {prefilledProduct && (
            <div className="mt-2 p-2 bg-green-100 rounded-lg border border-green-200">
              <div className="flex items-center justify-center text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  Pre-selected: {prefilledProduct.name} ({prefilledProduct.sku}) - Stock: 50
                </span>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Shop Info */}
      {autoSelectedShopId && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Store className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">
                Target Shop: {selectedShop?.name || "Your Shop"}
              </span>
              <Badge variant="secondary" className="ml-2">
                Shop Owner
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {inventoryItem ? (
        /* Single Item Update Form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Update Stock Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onUpdateSingle)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <span className="font-medium">
                      {selectedProduct?.name} ({selectedProduct?.sku})
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="1"
                    {...register("currentStock", { valueAsNumber: true })}
                    placeholder="Enter current stock level"
                  />
                  {errors.currentStock && (
                    <p className="text-sm text-red-500">
                      {errors.currentStock.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Stock"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Multi-Item Form */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Item Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 text-green-600 mr-2" />
                Add New Item
              </CardTitle>
              <CardDescription>
                Add one product at a time, or use &quot;Same quantity for
                multiple&quot; below when several products share one stock
                amount.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(addItemToList)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="productId">Product</Label>
                  <Select
                    value={watchedProductId}
                    onValueChange={(value) => setValue("productId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({product.sku})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productId && (
                    <p className="text-sm text-red-500">
                      {errors.productId.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Stock Amount</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="1"
                      {...register("currentStock", { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {errors.currentStock && (
                      <p className="text-sm text-red-500">
                        {errors.currentStock.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStockPerItem">
                      Min Stock (Optional)
                    </Label>
                    <Input
                      id="minStockPerItem"
                      type="number"
                      min="0"
                      {...register("minStockPerItem", { valueAsNumber: true })}
                      placeholder={`Auto: ${
                        watchedCurrentStock
                          ? calculateMinStock(watchedCurrentStock)
                          : 0
                      }`}
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty or set to 0 for auto-calculation (20% of
                      stock)
                    </p>
                    {errors.minStockPerItem && (
                      <p className="text-sm text-red-500">
                        {errors.minStockPerItem.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="lowStockAlertsEnabled"
                    type="checkbox"
                    className="h-4 w-4"
                    {...register("lowStockAlertsEnabled")}
                    defaultChecked
                  />
                  <Label htmlFor="lowStockAlertsEnabled">
                    Enable low stock alerts
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!watchedProductId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to List
                </Button>
              </form>

              <Separator className="my-6" />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Same quantity for multiple products
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use when every product below should get the same stock. Min
                    stock uses the same 20% rule as a single add with optional
                    min left empty.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Products</Label>
                  <div className="max-h-44 overflow-y-auto rounded-md border p-2 space-y-2">
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-1 py-2">
                        No products loaded
                      </p>
                    ) : (
                      products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 py-0.5"
                        >
                          <Checkbox
                            id={`bulk-product-${product.id}`}
                            checked={bulkSelectedIds.includes(product.id)}
                            onCheckedChange={(state) =>
                              toggleBulkProduct(product.id, state === true)
                            }
                          />
                          <label
                            htmlFor={`bulk-product-${product.id}`}
                            className="text-sm leading-none cursor-pointer flex-1"
                          >
                            {product.name}
                            <span className="text-muted-foreground ml-1">
                              ({product.sku})
                            </span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkStock">Stock amount (all selected)</Label>
                  <Input
                    id="bulkStock"
                    type="number"
                    min={1}
                    value={bulkStock}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setBulkStock(Number.isFinite(n) ? n : 1);
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={bulkSelectedIds.length === 0}
                  onClick={addBulkToList}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add selected to list ({bulkSelectedIds.length})
                </Button>
              </div>

              {/* Selected Product Info */}
              {selectedProduct && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-sm text-blue-700">
                        SKU: {selectedProduct.sku}
                      </p>
                      <p className="text-sm text-blue-600">
                        Price: ₹{selectedProduct.unitPrice}
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-purple-600 mr-2" />
                  Inventory List
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800"
                  >
                    {inventoryItems?.length || 0} item
                    {(inventoryItems?.length || 0) !== 1 ? "s" : ""}
                  </Badge>
                  {(inventoryItems?.length || 0) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllItems}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Review and manage your inventory items before submitting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(inventoryItems?.length || 0) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Your inventory list is empty</p>
                  <p className="text-sm">Add some products to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryItems.map((item, index) => {
                    const product = products.find(
                      (p) => p.id === item.productId
                    );
                    return (
                      <div
                        key={`${item.productId}-${index}`}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{product?.name}</h4>
                            <p className="text-sm text-gray-600">
                              SKU: {product?.sku}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Stock: {item.currentStock}
                              </span>
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Min: {item.minStockPerItem || 0}
                              </span>
                              <span
                                className={`px-2 py-1 rounded ${
                                  item.lowStockAlertsEnabled
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                Alerts:{" "}
                                {item.lowStockAlertsEnabled ? "On" : "Off"}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItemFromList(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator className="my-4" />

              {/* Payment and Discount Section */}
              {(inventoryItems?.length || 0) > 0 && (
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment & Discount Details
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Configure payment method and apply discount codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="upfront"
                            checked={paymentMethod === "upfront"}
                            onChange={(e) =>
                              setPaymentMethod(
                                e.target.value as "upfront" | "credit"
                              )
                            }
                            className="h-4 w-4"
                          />
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Upfront Payment
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            value="credit"
                            checked={paymentMethod === "credit"}
                            onChange={(e) =>
                              setPaymentMethod(
                                e.target.value as "upfront" | "credit"
                              )
                            }
                            className="h-4 w-4"
                          />
                          <span className="flex items-center">
                            <Receipt className="h-4 w-4 mr-1" />
                            Credit (Receipt Upload)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Receipt Upload for Credit Payment */}
                    {paymentMethod === "credit" && (
                      <div className="space-y-2">
                        <Label>Receipt Upload</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <input
                            type="file"
                            id="receipt-upload"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              setReceiptFile(e.target.files?.[0] || null)
                            }
                            className="hidden"
                          />
                          <label
                            htmlFor="receipt-upload"
                            className="cursor-pointer flex flex-col items-center space-y-2"
                          >
                            <Upload className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {receiptFile
                                ? receiptFile.name
                                : "Click to upload receipt"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Max 5MB (JPG, PNG, PDF)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Discount Code */}
                    <div className="space-y-2">
                      <Label>Discount Code (Optional)</Label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter discount code"
                          value={selectedDiscountCode?.code || ""}
                          onChange={(e) => {
                            const code = e.target.value;
                            const discount = discountCodes.find(
                              (d) => d.code === code
                            );
                            setSelectedDiscountCode(discount || null);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedDiscountCode(null)}
                          disabled={!selectedDiscountCode}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {selectedDiscountCode && (
                        <div className="p-2 bg-green-100 rounded text-sm text-green-800">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {selectedDiscountCode.name} -{" "}
                            {selectedDiscountCode.discountType === "percentage"
                              ? `${selectedDiscountCode.discountValue}%`
                              : `₹${selectedDiscountCode.discountValue}`}{" "}
                            off
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cost Summary */}
                    <div className="bg-white p-4 rounded-lg border space-y-2">
                      <h4 className="font-medium text-gray-900">
                        Cost Summary
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{totalAmount.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-₹{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-medium text-lg">
                          <span>Total:</span>
                          <span>₹{finalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <Button
                  onClick={onSubmit}
                  disabled={(inventoryItems?.length || 0) === 0 || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Send {inventoryItems?.length || 0} Item
                      {(inventoryItems?.length || 0) !== 1 ? "s" : ""} for Approval
                    </>
                  )}
                </Button>

                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ShopInventoryForm;
