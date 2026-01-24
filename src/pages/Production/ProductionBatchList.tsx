import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useToast from "@/hooks/use-toast";
import { getProductionBatches } from "@/apis/productionApi";
import { getProducts } from "@/apis/productapis";
import LoadingSpinner from "@/components/ui/Loader";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  Plus,
  Search,
  Factory,
  Package,
  Calendar,
  SortAsc,
  SortDesc,
  Eye,
} from "lucide-react";

interface ProductionBatch {
  id: string;
  recipeId: string;
  productId: string;
  quantity: number;
  producedAt: string;
  notes?: string;
  recipe: {
    id: string;
    name?: string;
    product: {
      name: string;
    };
  };
  product: {
    id: string;
    name: string;
  };
  _count?: {
    transactions: number;
  };
}

interface Product {
  id: string;
  name: string;
}

const ProductionBatchList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("producedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortBatches();
  }, [batches, searchTerm, productFilter, startDate, endDate, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [batchesData, productsData] = await Promise.all([
        getProductionBatches(),
        getProducts(),
      ]);
      setBatches(batchesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        text: "Failed to fetch production batches",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortBatches = () => {
    let filtered = [...batches];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (batch) =>
          batch.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.recipe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply product filter
    if (productFilter !== "all") {
      filtered = filtered.filter((batch) => batch.productId === productFilter);
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(
        (batch) => new Date(batch.producedAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (batch) => new Date(batch.producedAt) <= new Date(endDate)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "producedAt":
          aValue = new Date(a.producedAt);
          bValue = new Date(b.producedAt);
          break;
        case "product":
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          aValue = new Date(a.producedAt);
          bValue = new Date(b.producedAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBatches(filtered);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Batches</h1>
          <p className="text-gray-600 mt-1">
            Track production history and raw material consumption
          </p>
        </div>
        {hasPermission("Raw Materials", "write") && (
          <Button onClick={() => navigate("/production/add")}>
            <Plus className="h-4 w-4 mr-2" />
            New Production
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search productions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="producedAt">Date</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Production Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Production History</CardTitle>
          <CardDescription>
            {filteredBatches.length} of {batches.length} production batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {batches.length === 0
                  ? "No production batches found"
                  : "No matching batches"}
              </p>
              <p className="text-gray-500">
                {batches.length === 0
                  ? "Create your first production batch to get started."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Recipe</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Raw Materials Used</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(batch.producedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          {batch.product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {batch.recipe.name || "Default Recipe"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {batch.quantity} units
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {batch._count?.transactions || 0} materials
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {batch.notes || "—"}
                      </TableCell>
                      <TableCell>
                        {hasPermission("Raw Materials", "read") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/production/${batch.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionBatchList;

