import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckSquare, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Store,
  Package,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  BulkOperationsService, 
  BulkOperationRequest, 
  BulkOperationResult, 
  BulkOperationSummary, 
  RestockRequestSummary 
} from '@/services/bulkOperationsService';
import { cn } from '@/lib/utils';

interface BulkOperationsPanelProps {
  className?: string;
  onOperationComplete?: (result: BulkOperationResult) => void;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  className,
  onOperationComplete
}) => {
  const [requests, setRequests] = useState<RestockRequestSummary[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);
  const [showOperationDialog, setShowOperationDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperationRequest['operation'] | null>(null);
  const [operationReason, setOperationReason] = useState('');
  const [operationNotes, setOperationNotes] = useState('');

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'priority' | 'shop'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      // In a real application, this would fetch from your backend
      const mockRequests: RestockRequestSummary[] = [
        {
          id: '1',
          shopName: 'Ice Cream Palace',
          productName: 'Vanilla Ice Cream',
          quantity: 50,
          totalAmount: 2500,
          status: 'pending',
          paymentStatus: 'verified',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          priority: 'high',
          canApprove: true,
          canReject: true,
          canFulfill: false,
          canCancel: true
        },
        {
          id: '2',
          shopName: 'Sweet Dreams',
          productName: 'Chocolate Ice Cream',
          quantity: 30,
          totalAmount: 1800,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          priority: 'medium',
          canApprove: true,
          canReject: true,
          canFulfill: false,
          canCancel: true
        },
        {
          id: '3',
          shopName: 'Frozen Delights',
          productName: 'Strawberry Ice Cream',
          quantity: 25,
          totalAmount: 1500,
          status: 'approved',
          paymentStatus: 'verified',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          priority: 'low',
          canApprove: false,
          canReject: false,
          canFulfill: true,
          canCancel: false
        },
        {
          id: '4',
          shopName: 'Ice Cream Palace',
          productName: 'Mint Ice Cream',
          quantity: 40,
          totalAmount: 2000,
          status: 'pending',
          paymentStatus: 'verified',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          priority: 'high',
          canApprove: true,
          canReject: true,
          canFulfill: false,
          canCancel: true
        }
      ];
      
      setRequests(mockRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = React.useMemo(() => {
    let filtered = [...requests];

    // Apply filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (shopFilter) {
      filtered = filtered.filter(r => 
        r.shopName.toLowerCase().includes(shopFilter.toLowerCase())
      );
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(r => r.priority === priorityFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => 
          sortOrder === 'asc' 
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime()
        );
        break;
      case 'amount':
        filtered.sort((a, b) => 
          sortOrder === 'asc' 
            ? a.totalAmount - b.totalAmount
            : b.totalAmount - a.totalAmount
        );
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => 
          sortOrder === 'asc' 
            ? priorityOrder[a.priority] - priorityOrder[b.priority]
            : priorityOrder[b.priority] - priorityOrder[a.priority]
        );
        break;
      case 'shop':
        filtered.sort((a, b) => 
          sortOrder === 'asc' 
            ? a.shopName.localeCompare(b.shopName)
            : b.shopName.localeCompare(a.shopName)
        );
        break;
    }

    return filtered;
  }, [requests, statusFilter, shopFilter, priorityFilter, sortBy, sortOrder]);

  const selectedRequestsData = React.useMemo(() => {
    return filteredRequests.filter(r => selectedRequests.has(r.id));
  }, [filteredRequests, selectedRequests]);

  const bulkSummary = React.useMemo(() => {
    return BulkOperationsService.getBulkOperationSummary(selectedRequestsData);
  }, [selectedRequestsData]);

  const handleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const handleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkOperation = (operation: BulkOperationRequest['operation']) => {
    const validation = BulkOperationsService.validateBulkOperation(operation, selectedRequestsData);
    
    if (!validation.isValid) {
      alert(validation.errors.join(', '));
      return;
    }

    setSelectedOperation(operation);
    setOperationReason('');
    setOperationNotes('');
    setShowOperationDialog(true);
  };

  const executeBulkOperation = async () => {
    if (!selectedOperation) return;

    setIsOperationInProgress(true);
    try {
      const operationRequest: BulkOperationRequest = {
        operation: selectedOperation,
        requestIds: Array.from(selectedRequests),
        reason: operationReason || undefined,
        notes: operationNotes || undefined
      };

      const result = await BulkOperationsService.executeBulkOperation(operationRequest);
      setOperationResult(result);
      
      if (result.success) {
        // Refresh requests
        await loadRequests();
        setSelectedRequests(new Set());
      }
      
      onOperationComplete?.(result);
    } catch (error) {
      console.error('Error executing bulk operation:', error);
    } finally {
      setIsOperationInProgress(false);
      setShowOperationDialog(false);
    }
  };

  const getStatusBadge = (status: RestockRequestSummary['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      fulfilled: { color: 'bg-blue-100 text-blue-800', icon: Package },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: RestockRequestSummary['priority']) => {
    const priorityConfig = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={priorityConfig[priority]} variant="outline">
        {priority}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading requests...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
            Bulk Operations
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadRequests}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary */}
        {selectedRequests.size > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">
                {selectedRequests.size} request{selectedRequests.size > 1 ? 's' : ''} selected
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRequests(new Set())}
              >
                Clear Selection
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Total Value:</span>
                <p className="font-medium">{formatCurrency(bulkSummary.totalValue)}</p>
              </div>
              <div>
                <span className="text-blue-600">Shops Affected:</span>
                <p className="font-medium">{bulkSummary.shopsAffected}</p>
              </div>
              <div>
                <span className="text-blue-600">Can Approve:</span>
                <p className="font-medium">{bulkSummary.canApprove}</p>
              </div>
              <div>
                <span className="text-blue-600">Can Reject:</span>
                <p className="font-medium">{bulkSummary.canReject}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Label>Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label>Priority:</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label>Sort by:</Label>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search shops..."
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequests.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleBulkOperation('approve')}
              disabled={bulkSummary.canApprove === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve ({bulkSummary.canApprove})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkOperation('reject')}
              disabled={bulkSummary.canReject === 0}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject ({bulkSummary.canReject})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkOperation('fulfill')}
              disabled={bulkSummary.canFulfill === 0}
            >
              <Package className="h-4 w-4 mr-2" />
              Fulfill ({bulkSummary.canFulfill})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkOperation('cancel')}
              disabled={bulkSummary.canCancel === 0}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel ({bulkSummary.canCancel})
            </Button>
          </div>
        )}

        {/* Requests Table */}
        <div className="space-y-2">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <div className="flex-1 grid grid-cols-6 gap-4 text-sm font-medium text-gray-600">
              <div>Shop</div>
              <div>Product</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Priority</div>
              <div>Date</div>
            </div>
          </div>
          
          {filteredRequests.map((request) => (
            <div key={request.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
              <Checkbox
                checked={selectedRequests.has(request.id)}
                onCheckedChange={() => handleSelectRequest(request.id)}
              />
              <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                <div className="font-medium">{request.shopName}</div>
                <div>{request.productName}</div>
                <div className="font-medium">{formatCurrency(request.totalAmount)}</div>
                <div>{getStatusBadge(request.status)}</div>
                <div>{getPriorityBadge(request.priority)}</div>
                <div className="text-gray-500">{formatDate(request.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No requests found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </CardContent>

      {/* Operation Dialog */}
      <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOperation ? `Bulk ${selectedOperation.charAt(0).toUpperCase() + selectedOperation.slice(1)}` : 'Bulk Operation'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                {selectedOperation && BulkOperationsService.getOperationConfirmationMessage(
                  selectedOperation,
                  bulkSummary
                )}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input
                placeholder="Enter reason for this operation"
                value={operationReason}
                onChange={(e) => setOperationReason(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Enter additional notes"
                value={operationNotes}
                onChange={(e) => setOperationNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowOperationDialog(false)}
                disabled={isOperationInProgress}
              >
                Cancel
              </Button>
              <Button
                onClick={executeBulkOperation}
                disabled={isOperationInProgress}
              >
                {isOperationInProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Execute ${selectedOperation}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BulkOperationsPanel;
