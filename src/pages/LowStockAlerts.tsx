import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Filter,
  Search,
  Package,
  TrendingDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLowStockAlerts, getLowStockStats, getLowStockFilters, LowStockItem, LowStockStats, LowStockFilters } from '@/apis/lowStockApi';
import useToast from '@/hooks/use-toast';

const LowStockAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [stats, setStats] = useState<LowStockStats | null>(null);
  const [filters, setFilters] = useState<LowStockFilters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({
    category: 'all',
    flavor: 'all',
    shopId: 'all'
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchLowStockData();
  }, []);

  useEffect(() => {
    fetchLowStockAlerts();
  }, [currentPage, appliedFilters]);

  const fetchLowStockData = async () => {
    try {
      setIsLoading(true);
      const [{ stats }, { filters }] = await Promise.all([
        getLowStockStats(),
        getLowStockFilters()
      ]);

      setStats(stats);
      setFilters(filters);
    } catch (err) {
      console.error('Error fetching low stock data:', err);
      setError('Failed to load low stock data');
      toast({
        title: "Error",
        text: "Failed to load low stock data",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const { items, pagination } = await getLowStockAlerts({
        page: currentPage,
        limit: 20,
        category: appliedFilters.category === 'all' ? undefined : appliedFilters.category,
        flavor: appliedFilters.flavor === 'all' ? undefined : appliedFilters.flavor,
        shopId: appliedFilters.shopId === 'all' ? undefined : appliedFilters.shopId
      });

      setLowStockItems(items);
      setTotalPages(pagination.totalPages);
      setTotalCount(pagination.totalCount);
    } catch (err) {
      console.error('Error fetching low stock alerts:', err);
      toast({
        title: "Error",
        text: "Failed to load low stock alerts",
        type: "error",
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setAppliedFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setAppliedFilters({
      category: 'all',
      flavor: 'all',
      shopId: 'all'
    });
    setCurrentPage(1);
  };

  const handleRestockManagement = () => {
    // Navigate to restock management page
    window.location.href = '/restock-management';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Low Stock Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage low stock items
          </p>
        </div>
        <Separator className="my-6" />
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Low Stock Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Low Stock Alerts</h1>
        <p className="text-muted-foreground">
          {user?.role === 'Admin' 
            ? 'Monitor low stock items across all shops'
            : 'Monitor low stock items in your shop'
          }
        </p>
      </div>

      <Separator className="my-6" />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalLowStockItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Items below minimum stock level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.criticalStockItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Items with very low stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Shops</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.affectedShops || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Shops with low stock items
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {filters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={appliedFilters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filters.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Flavor</label>
                <Select value={appliedFilters.flavor} onValueChange={(value) => handleFilterChange('flavor', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flavor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flavors</SelectItem>
                    {filters.flavors.map((flavor) => (
                      <SelectItem key={flavor} value={flavor}>
                        {flavor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {user?.role === 'Admin' && filters.shops && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Shop</label>
                  <Select value={appliedFilters.shopId} onValueChange={(value) => handleFilterChange('shopId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shops</SelectItem>
                      {filters.shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-end gap-2">
                <Button onClick={clearFilters} variant="outline" className="flex-1">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Low Stock Items</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalCount} total items
              </span>
              <Button onClick={handleRestockManagement} size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Restock Management
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No low stock items found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50">
                  <div className={`rounded-full p-2 ${getUrgencyColor(item.urgency)}`}>
                    {getUrgencyIcon(item.urgency)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.productName}</p>
                      <Badge variant="outline" className={getUrgencyColor(item.urgency)}>
                        {item.urgency}
                      </Badge>
                      {item.shopName && (
                        <Badge variant="secondary" className="text-xs">
                          {item.shopName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.category} - {item.flavor}
                    </p>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Stock</p>
                        <p className="font-medium">{item.currentStock}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min Level</p>
                        <p className="font-medium">{item.minStockLevel}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deficit</p>
                        <p className="font-medium text-red-600">{item.stockDeficit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Restock</p>
                        <p className="font-medium">{formatDate(item.lastRestockDate)}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRestockManagement}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockAlerts;
