import { getShop } from "@/apis/shopapi";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Table from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { MRT_ColumnDef } from "material-react-table";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { shopColumns } from "./Columns";

// Mock shops data
const mockShops = Array.from({ length: 8 }).map((_, i) => ({
  id: `SHP${100 + i}`,
  name: `Shop ${String.fromCharCode(65 + i)}`,
  location: `Location ${i + 1}`,
  manager: `Manager ${i + 1}`,
  contact: `+91 ${8800000000 + i * 11111111}`,
  employeeCount: 5 + Math.floor(Math.random() * 10),
  monthlyRevenue: 50000 + Math.floor(Math.random() * 50000),
  status: i % 3 === 0 ? "Closed" : "Open",
}));
interface Shop {
  id: string;
  name: string;
  location: string;
  manager: string;
  contact: string;
  employeeCount: number;
  monthlyRevenue: number;
  status: string;
}

const ShopList = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [shops, setShops] = useState(mockShops);
  const [shopData, setShopData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching shop data...");
      const response: any = await getShop();
      console.log("Shop Data Response:", response);
      setShopData(response);
    } catch (error) {
      console.error("Error fetching shop data:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      setError("Failed to load shop data. Please try again.");
      setShopData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchShopData();
    }
  }, [isAuthenticated]);

  const filteredShops = shopData.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );
console.log("shopData", shopData);
  const handleDelete = (id: string) => {
    setShops(shops.filter((shop) => shop.id !== id));
  };

  const columns = useMemo<MRT_ColumnDef<Shop>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
      },
      {
        accessorKey: "name",
        header: "Shop Name",
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "manager",
        header: "Manager",
      },
      {
        accessorKey: "contact",
        header: "Contact",
      },
      {
        accessorKey: "employeeCount",
        header: "Employees",
      },
      {
        accessorKey: "monthlyRevenue",
        header: "Monthly Revenue (₹)",
      },
    ],
    [handleDelete]
  );

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Shop Management
            </h1>
            <p className="text-muted-foreground">
              Manage all your ice cream shops
            </p>
          </div>
          <Button asChild>
            <Link to="/shops/add">
              <Plus className="mr-2 h-4 w-4" /> Add New Shop
            </Link>
          </Button>
        </div>

        <Separator className="my-6" />

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading shops...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={fetchShopData}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="mt-6">
          {!loading && !error && (
            <Table columns={shopColumns} data={filteredShops} />
          )}
        </div>
      </div>
    </>
  );
};

export default ShopList;
