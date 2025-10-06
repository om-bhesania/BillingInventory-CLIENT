import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  Zap,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { cn } from '@/lib/utils';

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  timestamp: Date;
  metrics: {
    database: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      connections: number;
      errors: number;
    };
    websocket: {
      status: 'healthy' | 'warning' | 'critical';
      connectedUsers: number;
      messageRate: number;
      errors: number;
    };
    api: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: number;
      errorRate: number;
      requestsPerMinute: number;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      status: 'healthy' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  recommendations: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
  }>;
}

interface SystemHealthDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  className,
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const {
    isConnected,
    liveData,
    subscribeToLiveData,
    unsubscribeFromLiveData
  } = useDashboardWebSocket();

  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Auto-subscribe to system health data
  useEffect(() => {
    if (isConnected && autoRefresh) {
      subscribeToLiveData('system_health');
      return () => unsubscribeFromLiveData('system_health');
    }
  }, [isConnected, autoRefresh, subscribeToLiveData, unsubscribeFromLiveData]);

  // Process live data updates
  useEffect(() => {
    if (liveData.length > 0) {
      const healthData = liveData.find(data => data.type === 'system_health');
      if (healthData) {
        setSystemHealth(healthData.data);
        setLastUpdate(new Date(healthData.timestamp));
      }
    }
  }, [liveData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // In a real implementation, this would call the API
      // await fetchSystemHealth();
    } catch (error) {
      console.error('Error refreshing system health:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <XCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Connect to WebSocket to view system health
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Loading system health data...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health Dashboard</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge 
              variant="outline" 
              className={cn("text-sm", getStatusColor(systemHealth.status))}
            >
              {getStatusIcon(systemHealth.status)}
              <span className="ml-1 capitalize">{systemHealth.status}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">
              Score: {systemHealth.score}/100
            </span>
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Updated: {formatTime(lastUpdate)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Health</span>
              <span className="text-sm text-muted-foreground">{systemHealth.score}/100</span>
            </div>
            <Progress value={systemHealth.score} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Database */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(systemHealth.metrics.database.status))}>
                      {getStatusIcon(systemHealth.metrics.database.status)}
                      <span className="ml-1 capitalize">{systemHealth.metrics.database.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Response Time</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.database.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Connections</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.database.connections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WebSocket */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  WebSocket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(systemHealth.metrics.websocket.status))}>
                      {getStatusIcon(systemHealth.metrics.websocket.status)}
                      <span className="ml-1 capitalize">{systemHealth.metrics.websocket.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Connected Users</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.websocket.connectedUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Message Rate</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.websocket.messageRate}/min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(systemHealth.metrics.api.status))}>
                      {getStatusIcon(systemHealth.metrics.api.status)}
                      <span className="ml-1 capitalize">{systemHealth.metrics.api.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Response Time</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.api.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Error Rate</span>
                    <span className="text-xs font-medium">{(systemHealth.metrics.api.errorRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(systemHealth.metrics.memory.status))}>
                      {getStatusIcon(systemHealth.metrics.memory.status)}
                      <span className="ml-1 capitalize">{systemHealth.metrics.memory.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Usage</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.memory.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Used</span>
                    <span className="text-xs font-medium">{formatBytes(systemHealth.metrics.memory.used)}</span>
                  </div>
                  <Progress value={systemHealth.metrics.memory.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Disk */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Disk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(systemHealth.metrics.disk.status))}>
                      {getStatusIcon(systemHealth.metrics.disk.status)}
                      <span className="ml-1 capitalize">{systemHealth.metrics.disk.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Usage</span>
                    <span className="text-xs font-medium">{systemHealth.metrics.disk.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Used</span>
                    <span className="text-xs font-medium">{formatBytes(systemHealth.metrics.disk.used)}</span>
                  </div>
                  <Progress value={systemHealth.metrics.disk.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Alerts</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolvedAlerts(!showResolvedAlerts)}
            >
              {showResolvedAlerts ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showResolvedAlerts ? 'Hide Resolved' : 'Show Resolved'}
            </Button>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {systemHealth.alerts
                .filter(alert => showResolvedAlerts || !alert.resolved)
                .map((alert) => (
                  <Card key={alert.id} className={cn("border-l-4", getStatusColor(alert.type))}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{alert.message}</h4>
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="secondary" className="text-xs">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {systemHealth.alerts.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center space-y-2">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                      <p className="text-sm text-muted-foreground">
                        No active alerts
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <h3 className="text-lg font-semibold">Recommendations</h3>
          
          <div className="space-y-4">
            {systemHealth.recommendations.map((rec) => (
              <Card key={rec.id} className={cn(
                "border-l-4",
                rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              )}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        )}
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <p className="text-xs font-medium text-blue-600">{rec.action}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {systemHealth.recommendations.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                    <p className="text-sm text-muted-foreground">
                      No recommendations at this time
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <h3 className="text-lg font-semibold">Detailed Metrics</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raw System Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(systemHealth, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
