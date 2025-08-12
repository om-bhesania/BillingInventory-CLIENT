
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

const shops = [
  { value: "shop-a", label: "Shop A" },
  { value: "shop-b", label: "Shop B" },
  { value: "shop-c", label: "Shop C" },
  { value: "shop-d", label: "Shop D" },
  { value: "shop-e", label: "Shop E" },
];

// Mock inventory items
const inventoryItems = [
  { id: "item1", name: "Vanilla Flavor", price: 150 },
  { id: "item2", name: "Chocolate Flavor", price: 180 },
  { id: "item3", name: "Strawberry Flavor", price: 170 },
  { id: "item4", name: "Butter Scotch", price: 200 },
  { id: "item5", name: "Chocolate Chips", price: 50 },
  { id: "item6", name: "Waffle Cone", price: 30 },
];

interface InvoiceItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Initial form state
  const [formData, setFormData] = useState({
    customer: isEditing ? "Customer 1" : "",
    contactNumber: isEditing ? "+91 9876543210" : "",
    shop: isEditing ? "shop-a" : "",
    invoiceDate: isEditing
      ? new Date().toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    items: isEditing
      ? [
        { id: "1", itemId: "item1", name: "Vanilla Flavor", quantity: 2, price: 150 },
        { id: "2", itemId: "item3", name: "Strawberry Flavor", quantity: 1, price: 170 },
      ] as InvoiceItem[]
      : [] as InvoiceItem[],
    notes: isEditing ? "Thank you for your purchase!" : "",
  });

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
      itemId: "",
      name: "",
      quantity: 1,
      price: 0,
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
          if (field === "itemId") {
            const selectedItem = inventoryItems.find((invItem) => invItem.id === value);
            if (selectedItem) {
              return {
                ...item,
                itemId: value,
                name: selectedItem.name,
                price: selectedItem.price,
              };
            }
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18; // 18% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customer || !formData.shop || formData.items.length === 0) {
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
      (item) => !item.itemId || item.quantity <= 0
    );

    if (hasInvalidItems) {
       Swal.fire({
         title: "Validation Error",
         text:
           "Please ensure all items are properly selected and quantities are valid",
         icon: "error",
         confirmButtonText: "OK",
       });
      return;
    }

    // Submit logic would go here
    console.log("Form submitted:", formData);

     Swal.fire({
       title: `Invoice ${isEditing ? "Updated" : "Created"}`,
       text: `Invoice has been ${
         isEditing ? "updated" : "created"
       } successfully.`,
       icon: "success", 
     });

    navigate("/invoices");
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
              <Label htmlFor="customer">Customer Name *</Label>
              <Input
                id="customer"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Enter contact number"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="shop">Shop *</Label>
              <Select
                value={formData.shop}
                onValueChange={(value) => handleSelectChange("shop", value)}
                required
              >
                <SelectTrigger id="shop">
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.value} value={shop.value}>
                      {shop.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

          <div className="rounded-md border">
            {/* <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right w-[150px]">Price (₹)</TableHead>
                  <TableHead className="text-right w-[100px]">Quantity</TableHead>
                  <TableHead className="text-right w-[150px]">Total (₹)</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No items added. Click "Add Item" to add invoice items.
                    </TableCell>
                  </TableRow>
                ) : (
                  formData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.itemId}
                          onValueChange={(value) =>
                            updateItem(item.id, "itemId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((invItem) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                {invItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateItem(
                                item.id,
                                "quantity",
                                Math.max(1, item.quantity - 1)
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease</span>
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
                            className="h-8 w-14 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateItem(
                                item.id,
                                "quantity",
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase</span>
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table> */}
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
