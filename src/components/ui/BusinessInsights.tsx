import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Info,
  ArrowRight,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { BusinessInsight } from '@/lib/enhancedAnalytics';
import { cn } from '@/lib/utils';

interface BusinessInsightsProps {
  insights: BusinessInsight[];
  title?: string;
  className?: string;
  maxInsights?: number;
  showActions?: boolean;
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({
  insights,
  title = "Business Insights",
  className = "",
  maxInsights = 5,
  showActions = true
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-blue-600" />;
      case 'trend': return <Info className="h-5 w-5 text-purple-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-l-green-500';
      case 'warning': return 'border-l-orange-500';
      case 'recommendation': return 'border-l-blue-500';
      case 'trend': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-50';
      case 'warning': return 'bg-orange-50';
      case 'recommendation': return 'bg-blue-50';
      case 'trend': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  const sortedInsights = insights
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, maxInsights);

  if (sortedInsights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg font-medium">All Good!</p>
            <p className="text-sm">No immediate actions required at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          {title}
          <Badge variant="outline" className="ml-auto">
            {sortedInsights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {sortedInsights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md',
                getInsightBorderColor(insight.type),
                getInsightBgColor(insight.type)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', getPriorityColor(insight.priority))}
                    >
                      {insight.priority} priority
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  
                  <div className="grid gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-gray-500" />
                      <span className="font-medium text-gray-700">Impact:</span>
                      <span className="text-gray-600">{insight.impact}</span>
                    </div>
                    
                    {showActions && (
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-gray-500" />
                        <span className="font-medium text-gray-700">Action:</span>
                        <span className="text-gray-600">{insight.action}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              {showActions && (
                <div className="mt-3 flex items-center gap-2">
                  <button className="text-xs bg-white px-3 py-1 rounded border hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                  <button className="text-xs bg-white px-3 py-1 rounded border hover:bg-gray-50 transition-colors">
                    Dismiss
                  </button>
                  {insight.priority === 'high' && (
                    <button className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded border border-orange-200 hover:bg-orange-200 transition-colors">
                      Take Action
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* View all insights link */}
        {insights.length > maxInsights && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All {insights.length} Insights
              <ArrowRight className="h-4 w-4 inline ml-1" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
