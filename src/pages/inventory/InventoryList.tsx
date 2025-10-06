import { deleteProduct, getProducts } from "@/apis/productapis";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Table from "@/components/ui/table";
import useToast from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { InventoryColumns } from "./Columns";
 

const InventoryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProductsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProducts();
      console.log("product Data", response);
      setInventory(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  const filteredInventory = inventory.filter(
    (item) =>
      item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Link to="/inventory/add">
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Link>
      </div>

      <Separator className="my-6" />

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 mb-4 w-full md:w-1/3"
        />
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchProductsData} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <Table
            columns={InventoryColumns(handleDelete)}
            data={filteredInventory}
          />
        )}
      </div>
    </>
  );
};

export default InventoryList;
