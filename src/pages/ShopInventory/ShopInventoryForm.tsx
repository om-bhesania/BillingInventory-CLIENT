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
} from "@/apis/shopInventoryApi";
import { getProducts } from "@/apis/productapis";
import useToast from "@/hooks/use-toast";
import { getShop } from "@/apis/shopapi";
import { usePingUser } from "@/hooks/use-pingUser";

const shopInventorySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  currentStock: z.number().min(0, "Stock must be non-negative"),
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = usePingUser();

  // Get user's shop IDs from ping data
  const userShopIds = user?.managedShops?.map((shop) => shop.id) || [];

  // For Shop Owner role, automatically use their assigned shop
  const isShopOwner = user?.role === "Shop Owner";
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
      // shopId:
      //   inventoryItem?.shopId ||
      //   autoSelectedShopId ||
      //   user?.managedShops.map((shop) => shop.id)[0],
      productId: inventoryItem?.productId || "",
      currentStock: inventoryItem?.currentStock || 0,
    },
  });

  // const watchedShopId = watch("shopId");
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
          shopId: user?.managedShops.map((shop) => shop.id)[0],
          productId: data.productId,
          currentStock: data.currentStock,
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
