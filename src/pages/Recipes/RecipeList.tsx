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
import { getRecipes, deleteRecipe, setDefaultRecipe } from "@/apis/recipeApi";
import { getProducts } from "@/apis/productapis";
import LoadingSpinner from "@/components/ui/Loader";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChefHat,
  Star,
  SortAsc,
  SortDesc,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";

interface Recipe {
  id: string;
  productId: string;
  name?: string;
  description?: string;
  duration?: number;
  yield?: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    rawMaterial: {
      name: string;
      unit: string;
    };
    quantity: number;
  }>;
  _count?: {
    productions: number;
  };
}

interface Product {
  id: string;
  name: string;
}

const RecipeList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortRecipes();
  }, [recipes, searchTerm, productFilter, statusFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [recipesData, productsData] = await Promise.all([
        getRecipes(),
        getProducts(),
      ]);
      setRecipes(recipesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        text: "Failed to fetch recipes",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortRecipes = () => {
    let filtered = [...recipes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply product filter
    if (productFilter !== "all") {
      filtered = filtered.filter((recipe) => recipe.productId === productFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (recipe) =>
          statusFilter === "active" ? recipe.isActive : !recipe.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = (a.name || a.product.name).toLowerCase();
          bValue = (b.name || b.product.name).toLowerCase();
          break;
        case "product":
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "usage":
          aValue = a._count?.productions || 0;
          bValue = b._count?.productions || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecipes(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Delete Recipe?",
      text: `Are you sure you want to delete "${name}"? This will soft delete the recipe.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteRecipe(id);
        toast({
          title: "Success",
          text: "Recipe deleted successfully",
          type: "success",
        });
        fetchData();
      } catch (error) {
        toast({
          title: "Error",
          text: "Failed to delete recipe",
          type: "error",
        });
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultRecipe(id);
      toast({
        title: "Success",
        text: "Default recipe set successfully",
        type: "success",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        text: "Failed to set default recipe",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipes / BOM</h1>
          <p className="text-gray-600 mt-1">
            Manage recipes and bill of materials for products
          </p>
        </div>
        {hasPermission("Raw Materials", "write") && (
          <Button onClick={() => navigate("/recipes/add")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        )}
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search recipes..."
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="usage">Usage Count</SelectItem>
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

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recipes List</CardTitle>
          <CardDescription>
            {filteredRecipes.length} of {recipes.length} recipes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {recipes.length === 0 ? "No recipes found" : "No matching recipes"}
              </p>
              <p className="text-gray-500">
                {recipes.length === 0
                  ? "Add your first recipe to get started."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe Name</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Ingredients</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {recipe.name || recipe.product.name}
                          {recipe.isDefault && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          {recipe.product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {recipe.items.slice(0, 3).map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {item.rawMaterial.name} ({item.quantity} {item.rawMaterial.unit})
                            </Badge>
                          ))}
                          {recipe.items.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.items.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {recipe.duration ? `${recipe.duration} min` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {recipe._count?.productions || 0} times
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={recipe.isActive ? "default" : "secondary"}
                          >
                            {recipe.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {recipe.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {hasPermission("Raw Materials", "read") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/recipes/edit/${recipe.id}`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {!recipe.isDefault && hasPermission("Raw Materials", "update") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefault(recipe.id)}
                              title="Set as default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission("Raw Materials", "delete") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  recipe.id,
                                  recipe.name || recipe.product.name
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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

export default RecipeList;

