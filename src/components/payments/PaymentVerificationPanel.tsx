import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download, 
  Eye,
  Clock,
  DollarSign,
  Package,
  Store,
  AlertTriangle
} from 'lucide-react';
import { paymentApi, PaymentQueueItem } from '@/apis/paymentApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PaymentVerificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentVerificationPanel: React.FC<PaymentVerificationPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [paymentQueue, setPaymentQueue] = useState<PaymentQueueItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PaymentQueueItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPaymentQueue();
    }
  }, [isOpen]);

  const loadPaymentQueue = async () => {
    try {
      setIsLoading(true);
      const response = await paymentApi.getPaymentQueue();
      setPaymentQueue(response.data);
    } catch (error) {
      console.error('Error loading payment queue:', error);
      toast({
        title: "Error",
        description: "Failed to load payment queue",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (verified: boolean) => {
    if (!selectedItem) return;

    try {
      setIsVerifying(true);
      await paymentApi.verifyPayment(selectedItem.id, {
        restockRequestId: selectedItem.id,
        verified,
        notes: verificationNotes
      });

      toast({
        title: "Success",
        description: `Payment ${verified ? 'verified' : 'rejected'} successfully`
      });

      // Remove from queue
      setPaymentQueue(prev => prev.filter(item => item.id !== selectedItem.id));
      setSelectedItem(null);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewReceipt = async (filename: string) => {
    try {
      const blob = await paymentApi.getReceipt(filename);
      const url = URL.createObjectURL(blob);
      setReceiptUrl(url);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast({
        title: "Error",
        description: "Failed to load receipt",
        variant: "destructive"
      });
    }
  };

  const handleDownloadReceipt = async (filename: string) => {
    try {
      const blob = await paymentApi.getReceipt(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive"
      });
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
        {/* Payment Queue List */}
        <div className="w-1/2 border-r flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Payment Verification Queue</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {paymentQueue.length} payment{paymentQueue.length !== 1 ? 's' : ''} pending verification
            </p>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : paymentQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
                <p>No payments pending verification</p>
              </div>
            ) : (
              <div className="space-y-2 p-2 max-h-full overflow-y-auto">
                {paymentQueue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors border",
                      selectedItem?.id === item.id
                        ? "bg-blue-100 border-blue-200"
                        : "hover:bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Store className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">{item.shop.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(item.createdAt)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{item.product.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Qty: {item.requestedAmount}
                        </span>
                        <span className="font-medium text-sm">
                          {formatCurrency(item.finalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>

        {/* Payment Details */}
        <div className="w-1/2 flex flex-col">
          {selectedItem ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                {/* Shop and Product Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Store className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{selectedItem.shop.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{selectedItem.product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {selectedItem.product.sku}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Amount Details */}
                <div className="space-y-2">
                  <h4 className="font-medium">Amount Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>{formatCurrency(selectedItem.product.unitPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{selectedItem.requestedAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedItem.totalAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(selectedItem.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Receipt Actions */}
                <div className="space-y-2">
                  <h4 className="font-medium">Receipt</h4>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReceipt(selectedItem.receiptPath)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(selectedItem.receiptPath)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Verification Notes */}
                <div className="space-y-2">
                  <Label htmlFor="verification-notes">Verification Notes</Label>
                  <Textarea
                    id="verification-notes"
                    placeholder="Add notes for verification decision..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => handleVerifyPayment(true)}
                    disabled={isVerifying}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Payment
                  </Button>
                  <Button
                    onClick={() => handleVerifyPayment(false)}
                    disabled={isVerifying}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payment
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a payment to view details</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Receipt Viewer Modal */}
      {showReceipt && receiptUrl && (
        <div className="fixed inset-0 bg-black/80 z-[1003] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Receipt Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReceipt(false);
                  URL.revokeObjectURL(receiptUrl);
                  setReceiptUrl(null);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <iframe
                src={receiptUrl}
                className="w-full h-[70vh] border rounded"
                title="Receipt Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerificationPanel;
