import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { EnhancedTrend, AnomalyDetection } from '@/lib/enhancedAnalytics';
import { cn } from '@/lib/utils';

interface EnhancedKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: EnhancedTrend;
  anomaly?: AnomalyDetection;
  icon?: React.ReactNode;
  className?: string;
  formatValue?: (value: number) => string;
  showConfidence?: boolean;
  showAnomaly?: boolean;
}

export const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  anomaly,
  icon,
  className = "",
  formatValue,
  showConfidence = true,
  showAnomaly = true
}) => {
  const getTrendIcon = (trend: EnhancedTrend) => {
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (trend: EnhancedTrend) => {
    if (trend.direction === 'up') {
      return trend.strength === 'strong' ? 'text-green-600' : 'text-green-500';
    }
    if (trend.direction === 'down') {
      return trend.strength === 'strong' ? 'text-red-600' : 'text-red-500';
    }
    return 'text-gray-500';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAnomalyIcon = (anomaly: AnomalyDetection) => {
    switch (anomaly.severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-600" />;
      case 'low': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAnomalyColor = (anomaly: AnomalyDetection) => {
    switch (anomaly.severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTrendValue = (trend: EnhancedTrend) => {
    const sign = trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : '';
    return `${sign}${trend.percentage.toFixed(1)}%`;
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Anomaly indicator */}
      {anomaly && showAnomaly && (
        <div className={cn('absolute top-0 right-0 p-2', getAnomalyColor(anomaly))}>
          {getAnomalyIcon(anomaly)}
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue ? formatValue(Number(value)) : value}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        
        {/* Trend indicator */}
        {trend && (
          <div className="mt-3 space-y-2">
            <div className={cn('flex items-center gap-2', getTrendColor(trend))}>
              {getTrendIcon(trend)}
              <span className="text-sm font-medium">
                {formatTrendValue(trend)}
              </span>
              <Badge 
                variant="outline" 
                className={cn('text-xs', getConfidenceColor(trend.confidence))}
              >
                {trend.strength}
              </Badge>
            </div>
            
            {/* Confidence indicator */}
            {/* {showConfidence && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className={cn('w-2 h-2 rounded-full', {
                    'bg-green-500': trend.confidence === 'high',
                    'bg-yellow-500': trend.confidence === 'medium',
                    'bg-red-500': trend.confidence === 'low'
                  })} />
                  <span>Confidence: {trend.confidence}</span>
                </div>
                
                {trend.isSignificant && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Significant
                  </Badge>
                )}
              </div>
            )} */}
          </div>
        )}
        
        {/* Anomaly details */}
        {anomaly && showAnomaly && (
          <div className="mt-3 p-2 rounded-md border text-xs">
            <div className="font-medium text-gray-900 mb-1">
              {anomaly.type === 'spike' ? 'Unusual Activity' : 'Anomaly Detected'}
            </div>
            <div className="text-gray-600 mb-2">{anomaly.description}</div>
            <div className="text-gray-500">
              <strong>Action:</strong> {anomaly.suggestedAction}
            </div>
            <div className="mt-1 text-gray-400">
              Confidence: {anomaly.confidence.toFixed(0)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
