import { deleteProduct, getProducts } from "@/apis/productapis";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Table from "@/components/ui/table";
import useToast  from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { InvoiceColumns } from "./Columns";

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventory, setInventory] = useState([]);
  const { toast } = useToast();
  const fetchProductsData = async () => {
    try {
      const response: any = await getProducts();
      console.log("product Data", response);
      setInventory(response);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      const res: any = await deleteProduct(id);
      console.log("res", res);
      toast({
        title: "Product Deleted",
        text: `Product ${res.message} has been deleted successfully.`,
        type: "success",
      });
      fetchProductsData();
    } catch (error) {
      toast({
        title: "Something went wrong",
        text: "Please wait for sometimes and try again",
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your ice cream inventory across all shops
          </p>
        </div>
        <Button asChild>
          <Link to="/inventory/add">
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />
      {/* 
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto flex">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              Category
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2">
              Fruit Flavored
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
              Status
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-2">
              In Stock
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Low Stock
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              Out of Stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}

      <div className="mt-6">
        <Table
          columns={InvoiceColumns(handleDelete)}
          data={filteredInventory}
        />
        {/* <Table column={columns} data={}/> */}
        {/* <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Flavour</TableHead>
              <TableHead className="text-center">Total Stock</TableHead>
              <TableHead className="text-center">Min Stock</TableHead>
              <TableHead className="text-center">Unit Price (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {filteredInventory.indexOf(item) + 1}
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.category.name}</TableCell>
                  <TableCell>{item.flavor.name}</TableCell>
                  <TableCell className="text-center">
                    {item.totalStock}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.minStockLevel}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.totalStock < item.minStockLevel
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {item.totalStock < item.minStockLevel
                        ? "Low Stock"
                        : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/inventory/edit/id=${item.id}`}>
                          <span className="sr-only">Edit</span>
                          <PencilIcon />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <span className="sr-only">Delete</span>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody> */}
      </div>
    </>
  );
};

export default InventoryList;
