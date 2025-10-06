import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Package, 
  Minus, 
  Plus, 
  Calculator,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { stockAdjustmentApi, CreateStockAdjustmentRequest } from '@/apis/stockAdjustmentApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StockAdjustmentRequestProps {
  shopId: string;
  productId: string;
  currentStock: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export const StockAdjustmentRequest: React.FC<StockAdjustmentRequestProps> = ({
  shopId,
  productId,
  currentStock,
  productName,
  productSku,
  unitPrice,
  onSuccess,
  onCancel,
  isOpen
}) => {
  const [adjustedStock, setAdjustedStock] = useState(currentStock);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [defaultReasons, setDefaultReasons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadDefaultReasons();
    }
  }, [isOpen]);

  const loadDefaultReasons = async () => {
    try {
      const response = await stockAdjustmentApi.getDefaultReasons();
      setDefaultReasons(response.data);
    } catch (error) {
      console.error('Error loading default reasons:', error);
    }
  };

  const handleStockChange = (newStock: number) => {
    if (newStock >= 0) {
      setAdjustedStock(newStock);
    }
  };

  const handleReasonChange = (selectedReason: string) => {
    setReason(selectedReason);
    if (selectedReason !== 'Other') {
      setCustomReason('');
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for the stock adjustment",
        variant: "destructive"
      });
      return;
    }

    if (reason === 'Other' && !customReason.trim()) {
      toast({
        title: "Custom Reason Required",
        description: "Please provide a custom reason",
        variant: "destructive"
      });
      return;
    }

    if (adjustedStock === currentStock) {
      toast({
        title: "No Change",
        description: "Adjusted stock must be different from current stock",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const requestData: CreateStockAdjustmentRequest = {
        shopId,
        productId,
        currentStock,
        adjustedStock,
        reason: reason === 'Other' ? customReason : reason,
        customReason: reason === 'Other' ? customReason : undefined,
        notes
      };

      await stockAdjustmentApi.createStockAdjustment(requestData);

      toast({
        title: "Request Submitted",
        description: "Stock adjustment request has been submitted for admin approval"
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating stock adjustment request:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to submit stock adjustment request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stockDifference = adjustedStock - currentStock;
  const valueDifference = stockDifference * unitPrice;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1002] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Stock Adjustment Request
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{productName}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>SKU: {productSku}</p>
              <p>Unit Price: ₹{unitPrice}</p>
              <p>Current Stock: {currentStock} units</p>
            </div>
          </div>

          {/* Stock Adjustment */}
          <div className="space-y-4">
            <div>
              <Label>Adjust Stock To</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStockChange(adjustedStock - 1)}
                  disabled={adjustedStock <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={adjustedStock}
                  onChange={(e) => handleStockChange(parseInt(e.target.value) || 0)}
                  className="text-center font-medium"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStockChange(adjustedStock + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stock Change Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Change Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span>{currentStock} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjusted Stock:</span>
                  <span>{adjustedStock} units</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Difference:</span>
                  <span className={cn(
                    stockDifference > 0 ? "text-green-600" : 
                    stockDifference < 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {stockDifference > 0 ? "+" : ""}{stockDifference} units
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Value Impact:</span>
                  <span className={cn(
                    valueDifference > 0 ? "text-green-600" : 
                    valueDifference < 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {valueDifference > 0 ? "+" : ""}₹{Math.abs(valueDifference).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>Reason for Adjustment</Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {defaultReasons.map((defaultReason) => (
                  <SelectItem key={defaultReason} value={defaultReason}>
                    {defaultReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason */}
          {reason === 'Other' && (
            <div className="space-y-2">
              <Label>Custom Reason</Label>
              <Input
                placeholder="Please specify the reason for adjustment"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional information about this adjustment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || adjustedStock === currentStock || !reason}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockAdjustmentRequest;
