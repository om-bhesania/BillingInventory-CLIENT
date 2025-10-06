import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Package, 
  Store, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { stockAdjustmentApi, StockAdjustmentRequest } from '@/apis/stockAdjustmentApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StockAdjustmentAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustmentAdminPanel: React.FC<StockAdjustmentAdminPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentRequest[]>([]);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustmentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingNotes, setProcessingNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadStockAdjustments();
    }
  }, [isOpen]);

  const loadStockAdjustments = async () => {
    try {
      setIsLoading(true);
      const response = await stockAdjustmentApi.getStockAdjustments();
      setStockAdjustments(response.data);
    } catch (error) {
      console.error('Error loading stock adjustments:', error);
      toast({
        title: "Error",
        description: "Failed to load stock adjustments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessAdjustment = async (status: 'approved' | 'rejected') => {
    if (!selectedAdjustment) return;

    try {
      setIsProcessing(true);
      await stockAdjustmentApi.updateStockAdjustmentStatus(selectedAdjustment.id, {
        status,
        notes: processingNotes
      });

      toast({
        title: "Success",
        description: `Stock adjustment ${status} successfully`
      });

      // Remove from list
      setStockAdjustments(prev => prev.filter(adj => adj.id !== selectedAdjustment.id));
      setSelectedAdjustment(null);
      setProcessingNotes('');
    } catch (error: any) {
      console.error('Error processing stock adjustment:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to process stock adjustment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1002] flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex">
        {/* Stock Adjustments List */}
        <div className="w-1/2 border-r flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Stock Adjustment Requests</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadStockAdjustments}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {stockAdjustments.length} request{stockAdjustments.length !== 1 ? 's' : ''} pending
            </p>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : stockAdjustments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
                <p>No stock adjustments pending</p>
              </div>
            ) : (
              <div className="space-y-2 p-2 max-h-full overflow-y-auto">
                {stockAdjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    onClick={() => setSelectedAdjustment(adjustment)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors border",
                      selectedAdjustment?.id === adjustment.id
                        ? "bg-blue-100 border-blue-200"
                        : "hover:bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Store className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">{adjustment.shop.name}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(adjustment.status))}>
                        {getStatusIcon(adjustment.status)}
                        <span className="ml-1">{adjustment.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{adjustment.product.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {adjustment.currentStock} → {adjustment.adjustedStock}
                        </span>
                        <span className="font-medium">
                          {formatDate(adjustment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>

        {/* Adjustment Details */}
        <div className="w-1/2 flex flex-col">
          {selectedAdjustment ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Adjustment Details
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                {/* Shop and Product Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{selectedAdjustment.shop.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{selectedAdjustment.product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {selectedAdjustment.product.sku}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stock Change Details */}
                <div className="space-y-3">
                  <h4 className="font-medium">Stock Change</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="font-medium">{selectedAdjustment.currentStock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Adjusted Stock:</span>
                      <span className="font-medium">{selectedAdjustment.adjustedStock} units</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Difference:</span>
                      <span className={cn(
                        "font-medium",
                        selectedAdjustment.adjustedStock > selectedAdjustment.currentStock ? "text-green-600" : 
                        selectedAdjustment.adjustedStock < selectedAdjustment.currentStock ? "text-red-600" : "text-gray-600"
                      )}>
                        {selectedAdjustment.adjustedStock > selectedAdjustment.currentStock ? "+" : ""}
                        {selectedAdjustment.adjustedStock - selectedAdjustment.currentStock} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Value Impact:</span>
                      <span className={cn(
                        "font-medium",
                        selectedAdjustment.adjustedStock > selectedAdjustment.currentStock ? "text-green-600" : 
                        selectedAdjustment.adjustedStock < selectedAdjustment.currentStock ? "text-red-600" : "text-gray-600"
                      )}>
                        {selectedAdjustment.adjustedStock > selectedAdjustment.currentStock ? "+" : ""}
                        {formatCurrency(Math.abs(selectedAdjustment.adjustedStock - selectedAdjustment.currentStock) * selectedAdjustment.product.unitPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Reason and Notes */}
                <div className="space-y-3">
                  <h4 className="font-medium">Reason & Notes</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Reason:</span>
                      <p className="text-sm">{selectedAdjustment.reason}</p>
                    </div>
                    {selectedAdjustment.customReason && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Custom Reason:</span>
                        <p className="text-sm">{selectedAdjustment.customReason}</p>
                      </div>
                    )}
                    {selectedAdjustment.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Notes:</span>
                        <p className="text-sm">{selectedAdjustment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Processing Notes */}
                <div className="space-y-2">
                  <Label htmlFor="processing-notes">Processing Notes</Label>
                  <Textarea
                    id="processing-notes"
                    placeholder="Add notes for your decision..."
                    value={processingNotes}
                    onChange={(e) => setProcessingNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => handleProcessAdjustment('approved')}
                    disabled={isProcessing || selectedAdjustment.status !== 'pending'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleProcessAdjustment('rejected')}
                    disabled={isProcessing || selectedAdjustment.status !== 'pending'}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an adjustment to view details</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StockAdjustmentAdminPanel;
