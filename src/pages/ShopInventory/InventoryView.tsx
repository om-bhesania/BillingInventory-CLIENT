import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  SortAsc,
  SortDesc,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { getShopInventory, ShopInventoryItem } from '@/apis/shopInventoryApi';
import { getShop } from '@/apis/shopapi';
import useToast from '@/hooks/use-toast';
import { usePingUser } from '@/hooks/use-pingUser';
import { cn } from '@/lib/utils';

interface Shop {
  id: string;
  name: string;
}

interface InventoryItem extends ShopInventoryItem {
  stockStatus: 'normal' | 'low-stock' | 'out-of-stock';
  stockTrend: 'up' | 'down' | 'stable';
}

function InventoryView() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('currentStock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { toast } = useToast();
  const { user } = usePingUser();

  // Get user's shop IDs from ping data
  const userShopIds = user?.managedShops?.map((shop) => shop.id) || [];

  useEffect(() => {
    const fetchShops = async () => {
      try {
        if (user?.role === 'Shop_Owner') {
          const userShops = user.managedShops || [];
          setShops(userShops as Shop[]);
          if (userShops.length > 0) {
            setSelectedShopId(userShops[0].id);
          }
        } else if (user?.role === 'Admin') {
          const response = await getShop();
          setShops(response as Shop[]);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
        toast({
          title: 'Error',
          text: 'Failed to fetch shops',
          type: 'error',
        });
      }
    };

    fetchShops();
  }, [user, toast]);

  useEffect(() => {
    if (selectedShopId) {
      fetchInventoryItems();
    }
  }, [selectedShopId]);

  useEffect(() => {
    filterAndSortItems();
  }, [inventoryItems, searchTerm, categoryFilter, stockStatusFilter, sortBy, sortOrder]);

  const fetchInventoryItems = async () => {
    if (!selectedShopId) return;

    setIsLoading(true);
    try {
      const response = await getShopInventory(selectedShopId);
      const itemsWithStatus = (response as ShopInventoryItem[]).map(item => ({
        ...item,
        stockStatus: getStockStatus(item.currentStock, item.minStockPerItem),
        stockTrend: getStockTrend(item.currentStock, item.minStockPerItem),
      }));
      setInventoryItems(itemsWithStatus);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: 'Error',
        text: 'Failed to fetch inventory items',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (currentStock: number, minStockLevel?: number): 'normal' | 'low-stock' | 'out-of-stock' => {
    if (currentStock === 0) return 'out-of-stock';
    if (minStockLevel && currentStock <= minStockLevel) return 'low-stock';
    return 'normal';
  };

  const getStockTrend = (currentStock: number, minStockLevel?: number): 'up' | 'down' | 'stable' => {
    // This is a simplified trend calculation
    // In a real app, you'd compare with historical data
    if (minStockLevel) {
      if (currentStock > minStockLevel * 1.5) return 'up';
      if (currentStock < minStockLevel * 0.8) return 'down';
    }
    return 'stable';
  };

  const filterAndSortItems = () => {
    let filtered = [...inventoryItems];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product.flavor.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.product.category.id === categoryFilter);
    }

    // Apply stock status filter
    if (stockStatusFilter !== 'all') {
      filtered = filtered.filter((item) => item.stockStatus === stockStatusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'currentStock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'productName':
          aValue = a.product.name;
          bValue = b.product.name;
          break;
        case 'category':
          aValue = a.product.category.name;
          bValue = b.product.category.name;
          break;
        case 'flavor':
          aValue = a.product.flavor.name;
          bValue = b.product.flavor.name;
          break;
        case 'unitPrice':
          aValue = a.product.unitPrice;
          bValue = b.product.unitPrice;
          break;
        case 'lastRestock':
          aValue = a.lastRestockDate ? new Date(a.lastRestockDate) : new Date(0);
          bValue = b.lastRestockDate ? new Date(b.lastRestockDate) : new Date(0);
          break;
        default:
          aValue = a.currentStock;
          bValue = b.currentStock;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'out-of-stock':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStockTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const getUniqueCategories = () => {
    const categories = inventoryItems.map((item) => item.product.category);
    return Array.from(new Map(categories.map((cat) => [cat.id, cat])).values());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredItems.length} of {inventoryItems.length} items
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, SKU, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Shop Selection */}
            <Select value={selectedShopId} onValueChange={setSelectedShopId}>
              <SelectTrigger>
                <SelectValue placeholder="Select shop" />
              </SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Status Filter */}
            <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="normal">Normal Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currentStock">Current Stock</SelectItem>
                  <SelectItem value="productName">Product Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="flavor">Flavor</SelectItem>
                  <SelectItem value="unitPrice">Unit Price</SelectItem>
                  <SelectItem value="lastRestock">Last Restock</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Last Restock</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.product.sku} • {item.product.flavor.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.product.category.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-lg">{item.currentStock}</div>
                      <div className="text-sm text-gray-500">units</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.minStockPerItem || item.product.minStockLevel || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStockStatusIcon(item.stockStatus)}
                        <Badge className={getStockStatusColor(item.stockStatus)}>
                          {item.stockStatus.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ₹{item.product.unitPrice.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {item.lastRestockDate
                          ? new Date(item.lastRestockDate).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStockTrendIcon(item.stockTrend)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No inventory items found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InventoryView;
