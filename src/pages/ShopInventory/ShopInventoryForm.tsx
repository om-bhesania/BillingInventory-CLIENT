import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { usePingUser } from "@/hooks/use-pingUser";

const shopInventorySchema = z.object({
  shopId: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  currentStock: z.number().min(0, "Stock must be non-negative"),
  minStockPerItem: z
    .number({ invalid_type_error: "Enter a valid number" })
    .min(0, "Min stock must be >= 0")
    .optional(),
  lowStockAlertsEnabled: z.boolean().optional(),
});

const bulkItemSchema = z.object({
  productId: z.string().min(1),
  currentStock: z.number().min(0).default(0),
  minStockPerItem: z.number().min(0).optional(),
  lowStockAlertsEnabled: z.boolean().optional(),
});

type ShopInventoryFormData = z.infer<typeof shopInventorySchema>;

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

function ShopInventoryForm({
  inventoryItem,
  onSuccess,
  onCancel,
}: ShopInventoryFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [itemRows, setItemRows] = useState<Array<{
    productId: string;
    currentStock: number;
    minStockPerItem?: number;
    lowStockAlertsEnabled?: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = usePingUser();

  // Get user's shop IDs from ping data
  const userShopIds = user?.managedShops?.map((shop) => shop.id) || [];

  // For Shop Owner role, automatically use their assigned shop
  const isShopOwner = user?.role === "Shop_Owner" || user?.role === "Shop Owner";
  const autoSelectedShopId =
    isShopOwner && userShopIds.length > 0 ? userShopIds[0] : "";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ShopInventoryFormData>({
    resolver: zodResolver(shopInventorySchema),
    defaultValues: {
      shopId: inventoryItem?.shopId || autoSelectedShopId || "",
      productId: inventoryItem?.productId || "",
      currentStock: inventoryItem?.currentStock || 0,
      minStockPerItem: undefined,
      lowStockAlertsEnabled: true,
    },
  });

  const watchedShopId = watch("shopId");
  const watchedProductId = watch("productId");
  const fetchData = async () => {
    try {
      // Only fetch products - shops are not needed for Shop Owner role
      const productsData = await getProducts();
      console.log("productsData", productsData);
      setProducts(productsData as Product[]);

      // For Shop Owner role, we don't need to fetch all shops
      if (user?.role !== "Shop_Owner") {
        const shopsData = await getShop();
        console.log("shopsData", shopsData);
        setShops(shopsData as Shop[]);
      }
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to fetch data",
        type: "error",
      });
    }
  };
  useEffect(() => {
    fetchData();
  }, [user]); // Only depend on user, not toast
  const onSubmit = async (data: ShopInventoryFormData) => {
    setIsLoading(true);
    try {
      // If user added multiple items rows, call bulk create
      const targetShopId = isShopOwner ? (autoSelectedShopId || userShopIds[0]) : (data.shopId || watchedShopId);
      console.log("Target shop ID:", targetShopId, "Item rows:", itemRows.length);
      if (!inventoryItem && itemRows.length > 0) {
        const cleaned = itemRows
          .filter((r) => r.productId)
          .map((r) => ({
            productId: r.productId,
            currentStock: Number(r.currentStock) || 0,
            minStockPerItem: typeof r.minStockPerItem === "number" ? r.minStockPerItem : undefined,
            lowStockAlertsEnabled: typeof r.lowStockAlertsEnabled === "boolean" ? r.lowStockAlertsEnabled : true,
          }));
        console.log("Cleaned items:", cleaned);
        if (cleaned.length > 0 && targetShopId) {
          console.log("Calling bulk create with:", { shopId: targetShopId, items: cleaned });
          await bulkCreateShopInventory({ shopId: targetShopId as string, items: cleaned });
          toast({ title: "Success", text: `Added ${cleaned.length} items to inventory`, type: "success" });
          onSuccess?.();
          return;
        }
      }
      if (inventoryItem) {
        // Update existing inventory
        const updateData: UpdateStockRequest = {
          currentStock: data.currentStock,
        };
        await updateShopInventoryStock(inventoryItem.id, updateData);
        toast({
          title: "Success",
          text: "Inventory stock updated successfully",
          type: "success",
        });
      } else {
        // Create new inventory
        const createData: CreateShopInventoryRequest = {
          shopId: targetShopId as string,
          productId: data.productId,
          currentStock: data.currentStock,
          minStockPerItem:
            typeof data.minStockPerItem === "number" ? data.minStockPerItem : undefined,
          lowStockAlertsEnabled:
            typeof data.lowStockAlertsEnabled === "boolean"
              ? data.lowStockAlertsEnabled
              : true,
        };
        await createShopInventory(createData);
        toast({
          title: "Success",
          text: "Product added to shop inventory successfully",
          type: "success",
        });
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to save inventory",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === watchedProductId);
  // const selectedShop = shops.find((s) => s.id === watchedShopId);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {inventoryItem
            ? "Update Inventory Stock"
            : "Add Product to Shop Inventory"}
        </CardTitle>
        <CardDescription>
          {inventoryItem
            ? "Update the current stock level for this product"
            : "Add a new product to the shop's inventory with initial stock"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shop selection for Admin / non-shop-owner */}
            {!isShopOwner && (
              <div className="space-y-2">
                <Label htmlFor="shopId">Shop</Label>
                <Select
                  value={watchedShopId}
                  onValueChange={(value) => setValue("shopId", value)}
                  disabled={!!inventoryItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.shopId && (
                  <p className="text-sm text-red-500">{errors.shopId.message as any}</p>
                )}
              </div>
            )}
            {/* <div className="space-y-2">
              <Label htmlFor="shopId">Shop</Label>
              {isShopOwner && autoSelectedShopId ? (
                // For Shop Owner, show the auto-selected shop as read-only
                <div className="p-3 bg-gray-50 border rounded-md">
                  <span className="font-medium">
                    {shops.find((s) => s.id === autoSelectedShopId)?.name ||
                      "Your Shop"}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically selected based on your role
                  </p>
                </div>
              ) : (
                // For other roles, show shop selection dropdown
                <Select
                  value={watchedShopId}
                  onValueChange={(value) => setValue("shopId", value)}
                  disabled={!!inventoryItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.shopId && (
                <p className="text-sm text-red-500">{errors.shopId.message}</p>
              )}
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Select
                value={watchedProductId}
                onValueChange={(value) => setValue("productId", value)}
                disabled={!!inventoryItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
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

            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
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

          {/* Min stock and alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minStockPerItem">Min stock per item (shop)</Label>
              <Input
                id="minStockPerItem"
                type="number"
                min="0"
                {...register("minStockPerItem", { valueAsNumber: true })}
                placeholder="e.g., 20"
              />
              {errors.minStockPerItem && (
                <p className="text-sm text-red-500">{errors.minStockPerItem.message as any}</p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input
                id="lowStockAlertsEnabled"
                type="checkbox"
                className="h-4 w-4"
                {...register("lowStockAlertsEnabled")}
                defaultChecked
              />
              <Label htmlFor="lowStockAlertsEnabled">Enable low stock alerts</Label>
            </div>
          </div>

          {/* Add New Items (multi-add like billing) */}
          {!inventoryItem && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add New Items</h4>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItemRows((rows) => [
                      ...rows,
                      {
                        productId: "",
                        currentStock: 0,
                        minStockPerItem: undefined,
                        lowStockAlertsEnabled: true,
                      },
                    ])
                  }
                >
                  Add Item
                </Button>
              </div>
              {itemRows.length > 0 && (
                <div className="space-y-3">
                  {itemRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                      <div>
                        <Label>Product</Label>
                        <Select
                          value={row.productId}
                          onValueChange={(value) =>
                            setItemRows((rows) => rows.map((r, i) => (i === idx ? { ...r, productId: value } : r)))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.currentStock}
                          onChange={(e) =>
                            setItemRows((rows) => rows.map((r, i) => (i === idx ? { ...r, currentStock: Number(e.target.value) || 0 } : r)))
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>Min stock</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.minStockPerItem ?? ""}
                          onChange={(e) =>
                            setItemRows((rows) => rows.map((r, i) => (i === idx ? { ...r, minStockPerItem: e.target.value === "" ? undefined : Number(e.target.value) } : r)))
                          }
                          placeholder="optional"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={row.lowStockAlertsEnabled !== false}
                          onChange={(e) =>
                            setItemRows((rows) => rows.map((r, i) => (i === idx ? { ...r, lowStockAlertsEnabled: e.target.checked } : r)))
                          }
                        />
                        <Label>Alerts</Label>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setItemRows((rows) => rows.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Display selected product and shop info */}
          {selectedProduct && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              {/* {selectedShop && (
                <div>
                  <span className="font-medium">Shop:</span> {selectedShop.name}
                </div>
              )} */}
              {selectedProduct && (
                <div>
                  <span className="font-medium">Product:</span>{" "}
                  {selectedProduct.name} ({selectedProduct.sku})
                  <br />
                  <span className="text-sm text-gray-600">
                    Unit Price: ₹{selectedProduct.unitPrice}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : inventoryItem
                ? "Update Stock"
                : "Add to Inventory"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ShopInventoryForm;
