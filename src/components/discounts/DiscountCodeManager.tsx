import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock,
  Percent,
  DollarSign,
  Package,
  Receipt,
  Factory,
  Store,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { 
  DiscountService, 
  DiscountCode, 
  CreateDiscountCodeRequest 
} from '@/services/discountService';
import { cn } from '@/lib/utils';

interface DiscountCodeManagerProps {
  className?: string;
  isFactoryWide?: boolean;
  onCodeCreated?: (code: DiscountCode) => void;
  onCodeUpdated?: (code: DiscountCode) => void;
  onCodeDeleted?: (codeId: string) => void;
}

export const DiscountCodeManager: React.FC<DiscountCodeManagerProps> = ({
  className,
  isFactoryWide = false,
  onCodeCreated,
  onCodeUpdated,
  onCodeDeleted
}) => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateDiscountCodeRequest>({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscount: undefined,
    usageLimit: undefined,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isFactoryWide: isFactoryWide
  });

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call when discount API is available
      // const response = await getDiscountCodes();
      // setDiscountCodes(response);
      
      // For now, using mock data as fallback
      const mockCodes: DiscountCode[] = [
        {
          id: '1',
          code: 'WELCOME10',
          name: 'Welcome Discount',
          description: '10% off for new customers',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 500,
          maxDiscount: 1000,
          usageLimit: 100,
          usedCount: 25,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          isFactoryWide: isFactoryWide,
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          code: 'FLAT50',
          name: 'Flat ₹50 Off',
          description: 'Flat ₹50 discount on orders above ₹1000',
          discountType: 'flat',
          discountValue: 50,
          minOrderAmount: 1000,
          usageLimit: 50,
          usedCount: 12,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true,
          isFactoryWide: isFactoryWide,
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setDiscountCodes(mockCodes);
    } catch (error) {
      console.error('Error loading discount codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async () => {
    try {
      // Validate form data
      const validation = DiscountService.validateDiscountCode(formData.code);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      // In a real application, this would create the code via API
      const newCode: DiscountCode = {
        id: Date.now().toString(),
        ...formData,
        usedCount: 0,
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setDiscountCodes(prev => [...prev, newCode]);
      setIsCreateDialogOpen(false);
      resetForm();
      onCodeCreated?.(newCode);
    } catch (error) {
      console.error('Error creating discount code:', error);
    }
  };

  const handleEditCode = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || '',
      discountType: code.discountType,
      discountValue: code.discountValue,
      minOrderAmount: code.minOrderAmount,
      maxDiscount: code.maxDiscount,
      usageLimit: code.usageLimit,
      validFrom: code.validFrom,
      validUntil: code.validUntil,
      isFactoryWide: code.isFactoryWide
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCode = async () => {
    if (!editingCode) return;

    try {
      // In a real application, this would update the code via API
      const updatedCode: DiscountCode = {
        ...editingCode,
        ...formData,
        updatedAt: new Date()
      };

      setDiscountCodes(prev => 
        prev.map(code => code.id === editingCode.id ? updatedCode : code)
      );
      setIsEditDialogOpen(false);
      setEditingCode(null);
      resetForm();
      onCodeUpdated?.(updatedCode);
    } catch (error) {
      console.error('Error updating discount code:', error);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      // In a real application, this would delete the code via API
      setDiscountCodes(prev => prev.filter(code => code.id !== codeId));
      onCodeDeleted?.(codeId);
    } catch (error) {
      console.error('Error deleting discount code:', error);
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      // In a real application, this would update the code via API
      const updatedCode: DiscountCode = {
        ...code,
        isActive: !code.isActive,
        updatedAt: new Date()
      };

      setDiscountCodes(prev => 
        prev.map(c => c.id === code.id ? updatedCode : c)
      );
      onCodeUpdated?.(updatedCode);
    } catch (error) {
      console.error('Error toggling discount code:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: undefined,
      maxDiscount: undefined,
      usageLimit: undefined,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isFactoryWide: isFactoryWide
    });
  };

  const getDiscountTypeIcon = (type: DiscountCode['discountType']) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'flat':
        return <DollarSign className="h-4 w-4" />;
      case 'per_item':
        return <Package className="h-4 w-4" />;
      case 'on_bill':
        return <Receipt className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (code: DiscountCode) => {
    const status = DiscountService.getDiscountStatus(code);
    
    switch (status.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'limit_reached':
        return <Badge className="bg-yellow-100 text-yellow-800">Limit Reached</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading discount codes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {isFactoryWide ? (
              <Factory className="h-5 w-5 mr-2 text-blue-600" />
            ) : (
              <Store className="h-5 w-5 mr-2 text-green-600" />
            )}
            {isFactoryWide ? 'Factory Discount Codes' : 'Shop Discount Codes'}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Discount Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input
                      placeholder="Enter discount code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="Enter code name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter code description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, discountType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat">Flat Amount</SelectItem>
                        <SelectItem value="per_item">Per Item</SelectItem>
                        <SelectItem value="on_bill">On Bill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Value *</Label>
                    <Input
                      type="number"
                      placeholder="Enter discount value"
                      value={formData.discountValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Order Amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter minimum order amount"
                      value={formData.minOrderAmount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Discount</Label>
                    <Input
                      type="number"
                      placeholder="Enter maximum discount"
                      value={formData.maxDiscount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: parseFloat(e.target.value) || undefined }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usage Limit</Label>
                    <Input
                      type="number"
                      placeholder="Enter usage limit"
                      value={formData.usageLimit || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || undefined }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formData.validUntil.toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFactoryWide"
                    checked={formData.isFactoryWide}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFactoryWide: !!checked }))}
                  />
                  <Label htmlFor="isFactoryWide">Factory-wide discount</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCode}>
                    Create Code
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {discountCodes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No discount codes created yet</p>
            <p className="text-sm">Create your first discount code to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discountCodes.map((code) => (
              <div key={code.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getDiscountTypeIcon(code.discountType)}
                    <div>
                      <h4 className="font-medium">{code.name}</h4>
                      <p className="text-sm text-gray-600">{code.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(code)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCode(code.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCode(code)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCode(code.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium">{DiscountService.getDiscountTypeDisplayName(code.discountType)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <p className="font-medium">
                      {code.discountType === 'percentage' 
                        ? `${code.discountValue}%` 
                        : `₹${code.discountValue}`
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Usage:</span>
                    <p className="font-medium">
                      {code.usedCount}{code.usageLimit ? ` / ${code.usageLimit}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Valid Until:</span>
                    <p className="font-medium">{formatDate(code.validUntil)}</p>
                  </div>
                </div>
                
                {code.description && (
                  <p className="text-sm text-gray-600 mt-2">{code.description}</p>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {code.minOrderAmount && (
                      <span>Min: ₹{code.minOrderAmount}</span>
                    )}
                    {code.maxDiscount && (
                      <span>Max: ₹{code.maxDiscount}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={code.isActive ? "destructive" : "default"}
                    onClick={() => handleToggleActive(code)}
                  >
                    {code.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountCodeManager;
