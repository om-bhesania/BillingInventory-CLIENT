import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Target,
  DollarSign,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  ShopInsightsService, 
  ShopInsight, 
  ShopRecommendation, 
  ShopPerformanceData 
} from '@/services/shopInsightsService';
import { cn } from '@/lib/utils';

interface ShopInsightsCardProps {
  className?: string;
  performanceData?: ShopPerformanceData;
}

export const ShopInsightsCard: React.FC<ShopInsightsCardProps> = ({ 
  className, 
  performanceData 
}) => {
  const [insights, setInsights] = useState<ShopInsight[]>([]);
  const [recommendations, setRecommendations] = useState<ShopRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations'>('insights');

  const generateSampleData = (): ShopPerformanceData => {
    return {
      totalRevenue: 150000,
      totalExpenses: 100000,
      totalProfit: 50000,
      pendingPayments: 15000,
      totalOrders: 250,
      averageOrderValue: 600,
      topSellingFlavors: [
        { flavorId: '1', flavorName: 'Vanilla', totalRevenue: 25000, totalQuantity: 150, averagePrice: 167 },
        { flavorId: '2', flavorName: 'Chocolate', totalRevenue: 20000, totalQuantity: 120, averagePrice: 167 },
        { flavorId: '3', flavorName: 'Strawberry', totalRevenue: 15000, totalQuantity: 90, averagePrice: 167 }
      ],
      lowStockItems: [
        { productId: '1', productName: 'Vanilla Ice Cream', currentStock: 5, minStock: 20, percentage: 25 },
        { productId: '2', productName: 'Chocolate Syrup', currentStock: 8, minStock: 15, percentage: 53 },
        { productId: '3', productName: 'Waffle Cones', currentStock: 3, minStock: 25, percentage: 12 }
      ],
      recentTransactions: [
        { id: '1', type: 'sale', amount: 1200, date: new Date(), description: 'Large order - Vanilla & Chocolate' },
        { id: '2', type: 'restock', amount: 5000, date: new Date(), description: 'Restock - Strawberry flavor' },
        { id: '3', type: 'sale', amount: 800, date: new Date(), description: 'Regular customer order' }
      ]
    };
  };

  useEffect(() => {
    if (performanceData) {
      loadInsights(performanceData);
    } else {
      // Generate sample insights when no data is available
      loadInsights(generateSampleData());
    }
  }, [performanceData]);

  const loadInsights = async (data: ShopPerformanceData) => {
    setIsLoading(true);
    try {
      const generatedInsights = ShopInsightsService.generateInsights(data);
      const generatedRecommendations = ShopInsightsService.generateRecommendations(data);
      
      setInsights(generatedInsights);
      setRecommendations(generatedRecommendations);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: ShopInsight['type']) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'performance':
        return <BarChart3 className="h-4 w-4" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: ShopInsight['type'], priority: ShopInsight['priority']) => {
    if (type === 'alert' || priority === 'high') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (priority === 'medium') {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    if (type === 'revenue' && priority === 'low') {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getTrendIcon = (trend?: ShopInsight['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: ShopInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: ShopRecommendation['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort: ShopRecommendation['effort']) => {
    switch (effort) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value?: number, unit?: string) => {
    if (value === undefined) return '';
    
    if (unit === '₹') {
      return `₹${value.toLocaleString()}`;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading insights...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Shop Insights & Recommendations
          </div>
          <div className="flex space-x-1">
            <Button
              variant={activeTab === 'insights' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </Button>
            <Button
              variant={activeTab === 'recommendations' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'insights' ? (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No insights available</p>
                <p className="text-sm">Complete some transactions to generate insights</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    getInsightColor(insight.type, insight.priority)
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPriorityColor(insight.priority))}
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(insight.trend)}
                      {insight.value !== undefined && (
                        <span className="font-medium">
                          {formatValue(insight.value, insight.unit)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{insight.description}</p>
                  
                  {insight.actionable && insight.actionText && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        if (insight.actionUrl) {
                          // In a real app, this would navigate to the URL
                          console.log('Navigate to:', insight.actionUrl);
                        }
                      }}
                    >
                      {insight.actionText}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recommendations available</p>
                <p className="text-sm">Complete some transactions to generate recommendations</p>
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium">{recommendation.title}</h4>
                    </div>
                    <div className="flex space-x-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getImpactColor(recommendation.impact))}
                      >
                        {recommendation.impact} impact
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getEffortColor(recommendation.effort))}
                      >
                        {recommendation.effort} effort
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3">{recommendation.description}</p>
                  
                  {recommendation.estimatedBenefit && (
                    <div className="mb-3 p-2 bg-green-50 rounded text-sm text-green-800">
                      <strong>Estimated Benefit:</strong> {recommendation.estimatedBenefit}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Action Steps:</h5>
                    <ul className="space-y-1">
                      {recommendation.actionSteps.map((step, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 mt-0.5">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopInsightsCard;
