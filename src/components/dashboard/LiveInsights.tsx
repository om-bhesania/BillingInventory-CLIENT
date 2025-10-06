import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  X,
  ExternalLink,
  Clock,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { cn } from '@/lib/utils';

interface LiveInsight {
  id: string;
  type: 'growth' | 'decline' | 'opportunity' | 'warning';
  category: 'financial' | 'product' | 'customer' | 'operational' | 'strategic';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  timestamp: Date;
  data: any;
}

const insightIcons = {
  growth: TrendingUp,
  decline: TrendingDown,
  opportunity: Lightbulb,
  warning: AlertTriangle
};

const insightColors = {
  growth: 'text-green-600 bg-green-50 border-green-200',
  decline: 'text-red-600 bg-red-50 border-red-200',
  opportunity: 'text-blue-600 bg-blue-50 border-blue-200',
  warning: 'text-orange-600 bg-orange-50 border-orange-200'
};

const categoryColors = {
  financial: 'bg-green-100 text-green-800',
  product: 'bg-blue-100 text-blue-800',
  customer: 'bg-purple-100 text-purple-800',
  operational: 'bg-orange-100 text-orange-800',
  strategic: 'bg-indigo-100 text-indigo-800'
};

const impactColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800'
};

interface LiveInsightsProps {
  className?: string;
  maxInsights?: number;
  showCategories?: boolean;
  showImpactLevels?: boolean;
  autoRefresh?: boolean;
}

export const LiveInsights: React.FC<LiveInsightsProps> = ({
  className,
  maxInsights = 10,
  showCategories = true,
  showImpactLevels = true,
  autoRefresh = true
}) => {
  const {
    isConnected,
    insights,
    subscribeToInsights,
    unsubscribeFromInsights,
    clearInsights
  } = useDashboardWebSocket();

  const [filteredInsights, setFilteredInsights] = useState<LiveInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter insights based on selected filters
  React.useEffect(() => {
    let filtered = insights;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category === selectedCategory);
    }

    if (selectedImpact !== 'all') {
      filtered = filtered.filter(insight => insight.impact === selectedImpact);
    }

    setFilteredInsights(filtered.slice(0, maxInsights));
  }, [insights, selectedCategory, selectedImpact, maxInsights]);

  // Auto-subscribe to insights
  React.useEffect(() => {
    if (isConnected && autoRefresh) {
      subscribeToInsights();
      return () => unsubscribeFromInsights();
    }
  }, [isConnected, autoRefresh, subscribeToInsights, unsubscribeFromInsights]);

  const getCategories = () => {
    const categories = Array.from(new Set(insights.map(insight => insight.category)));
    return categories;
  };

  const getImpactLevels = () => {
    const impacts = Array.from(new Set(insights.map(insight => insight.impact)));
    return impacts;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleActionClick = (insight: LiveInsight) => {
    if (insight.actionUrl) {
      window.open(insight.actionUrl, '_blank');
    }
  };

  const handleDismissInsight = (insightId: string) => {
    // In a real implementation, you might want to mark this as dismissed in the backend
    console.log('Dismissing insight:', insightId);
  };

  if (!isConnected) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Connect to WebSocket to receive live insights
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Insights
            <Badge variant="secondary" className="text-xs">
              {insights.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearInsights}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Filters */}
        {insights.length > 0 && (
          <div className="space-y-3 pt-2">
            {showCategories && getCategories().length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs"
                >
                  All Categories
                </Button>
                {getCategories().map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn("text-xs capitalize", categoryColors[category as keyof typeof categoryColors])}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}

            {showImpactLevels && getImpactLevels().length > 1 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedImpact === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedImpact('all')}
                  className="text-xs"
                >
                  All Impact
                </Button>
                {getImpactLevels().map(impact => (
                  <Button
                    key={impact}
                    variant={selectedImpact === impact ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedImpact(impact)}
                    className={cn("text-xs capitalize", impactColors[impact as keyof typeof impactColors])}
                  >
                    {impact}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {insights.length === 0 ? 'No insights available' : 'No insights match your filters'}
            </p>
            <p className="text-xs text-muted-foreground">
              {insights.length === 0 
                ? 'AI is analyzing your data to generate insights...' 
                : 'Try adjusting your filters to see more insights'
              }
            </p>
          </div>
        ) : (
          <ScrollArea className={cn("h-full", isExpanded ? "max-h-96" : "max-h-64")}>
            <div className="space-y-3">
              {filteredInsights.map((insight) => {
                const IconComponent = insightIcons[insight.type];
                const colorClass = insightColors[insight.type];
                
                return (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md",
                      colorClass
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", categoryColors[insight.category])}
                            >
                              {insight.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", impactColors[insight.impact])}
                            >
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(insight.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {insight.actionable && insight.actionText && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(insight)}
                            className="text-xs h-7"
                          >
                            {insight.actionText}
                            {insight.actionUrl && (
                              <ExternalLink className="h-3 w-3 ml-1" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissInsight(insight.id)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
