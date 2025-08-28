import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Filter,
  Search,
  FileText,
  Package,
  TrendingUp,
  User,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuditLog, getAuditLogStats, AuditLogEntry, AuditLogStats } from '@/apis/auditLogApi';
import useToast from '@/hooks/use-toast';

const AuditLog = () => {
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLog();
  }, [currentPage, filters]);

  useEffect(() => {
    fetchAuditLogStats();
  }, []);

  const fetchAuditLog = async () => {
    try {
      setIsLoading(true);
      const response = await getAuditLog({
        page: currentPage,
        limit: 20,
        type: filters.type === 'all' ? undefined : filters.type,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });

      setAuditEntries(response.entries);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError('Failed to load audit log');
      toast({
        title: "Error",
        text: "Failed to load audit log",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogStats = async () => {
    try {
      const response = await getAuditLogStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching audit log stats:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'billing':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'restock':
        return <Package className="h-4 w-4 text-orange-600" />;
      case 'inventory':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'billing':
        return 'bg-green-100 border-green-200';
      case 'restock':
        return 'bg-orange-100 border-orange-200';
      case 'inventory':
        return 'bg-blue-100 border-blue-200';
      case 'user':
        return 'bg-purple-100 border-purple-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLog();
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            System activity and audit trail
          </p>
        </div>
        <Separator className="my-6" />
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Audit Log</h3>
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
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          {user?.role === 'Admin' 
            ? 'System-wide activities and audit trail'
            : 'Your shop activity log'
          }
        </p>
      </div>

      <Separator className="my-6" />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total.billings + stats.total.restocks + stats.total.inventoryUpdates}
              </div>
              <p className="text-xs text-muted-foreground">
                All time activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recent.billings + stats.recent.restocks + stats.recent.inventoryUpdates}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Activities</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.monthly.billings + stats.monthly.restocks + stats.monthly.inventoryUpdates}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
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
              <label className="text-sm font-medium mb-2 block">Activity Type</label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Log</span>
            <span className="text-sm text-muted-foreground">
              {totalCount} total entries
            </span>
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
          ) : auditEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditEntries.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className={`rounded-full p-2 ${getActivityColor(entry.type)}`}>
                    {getActivityIcon(entry.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.action}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.type}
                      </Badge>
                      {entry.status && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      {entry.shopName && (
                        <span>Shop: {entry.shopName}</span>
                      )}
                      {entry.amount && (
                        <span className="font-medium text-green-600">
                          {formatAmount(entry.amount)}
                        </span>
                      )}
                    </div>
                  </div>
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

export default AuditLog;
