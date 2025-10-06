import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  CreditCard,
  Receipt
} from 'lucide-react';
import { paymentApi, ShopFinancials } from '@/apis/paymentApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ShopFinancialsCardProps {
  shopId: string;
  className?: string;
}

export const ShopFinancialsCard: React.FC<ShopFinancialsCardProps> = ({
  shopId,
  className
}) => {
  const [financials, setFinancials] = useState<ShopFinancials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadFinancials = async () => {
    try {
      setIsLoading(true);
      const response = await paymentApi.getShopFinancials(shopId);
      setFinancials(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading financials:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, [shopId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  const getProfitTrend = () => {
    if (!financials) return 'neutral';
    if (financials.totalProfit > 0) return 'positive';
    if (financials.totalProfit < 0) return 'negative';
    return 'neutral';
  };

  const getProfitColor = () => {
    const trend = getProfitTrend();
    switch (trend) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProfitIcon = () => {
    const trend = getProfitTrend();
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading financial data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financials) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Unable to load financial data</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFinancials}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Financial Overview
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadFinancials}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {formatDate(lastUpdated.toISOString())}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {financials.shop.name} - {financials.shop.address}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(financials.totalRevenue)}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Expenses</span>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(financials.totalExpenses)}
            </p>
          </div>
        </div>

        {/* Profit Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Net Profit</span>
            {getProfitIcon()}
          </div>
          <p className={cn("text-3xl font-bold", getProfitColor())}>
            {formatCurrency(financials.totalProfit)}
          </p>
          <Badge 
            variant={getProfitTrend() === 'positive' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {getProfitTrend() === 'positive' ? 'Profitable' : 
             getProfitTrend() === 'negative' ? 'Loss' : 'Break Even'}
          </Badge>
        </div>

        {/* Pending Payments */}
        {financials.pendingPayments > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Pending Payments</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(financials.pendingPayments)}
            </p>
            <p className="text-xs text-gray-500">
              Awaiting verification
            </p>
          </div>
        )}

        {/* Financial Health Indicator */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-600">Financial Health</span>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  getProfitTrend() === 'positive' ? "bg-green-500" :
                  getProfitTrend() === 'negative' ? "bg-red-500" : "bg-gray-500"
                )}
                style={{ 
                  width: `${Math.min(100, Math.max(0, (financials.totalProfit / Math.max(financials.totalRevenue, 1)) * 100))}%` 
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round((financials.totalProfit / Math.max(financials.totalRevenue, 1)) * 100)}%
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Receipt className="h-4 w-4 mr-2" />
            Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopFinancialsCard;
