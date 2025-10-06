import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { getWebSocketService } from '@/services/websocketService';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false, 
  className 
}) => {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wsService = getWebSocketService();

  useEffect(() => {
    const handleConnectionStatus = (status: any) => {
      setConnectionStatus(status);
      setIsReconnecting(false);
    };

    wsService.on('connection:status', handleConnectionStatus);
    
    // Get initial status
    setConnectionStatus(wsService.getConnectionStatus());

    return () => {
      wsService.off('connection:status', handleConnectionStatus);
    };
  }, [wsService]);

  const handleReconnect = () => {
    setIsReconnecting(true);
    wsService.reconnect();
  };

  const handleRefresh = () => {
    setIsReconnecting(true);
    wsService.refreshConnection();
  };

  if (!connectionStatus) {
    return null;
  }

  const { connected, attempts, error, reconnecting, failed } = connectionStatus;

  const getStatusIcon = () => {
    if (connected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (reconnecting || isReconnecting) return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
    if (failed) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (connected) return 'Connected';
    if (reconnecting || isReconnecting) return 'Reconnecting...';
    if (failed) return 'Connection Failed';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (connected) return 'bg-green-100 text-green-800 border-green-200';
    if (reconnecting || isReconnecting) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (failed) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {!connected && !reconnecting && !isReconnecting && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-medium">{getStatusText()}</h3>
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
              {attempts > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Attempt {attempts} of {wsService.getConnectionStatus().maxAttempts}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor()}>
              {connected ? 'Online' : 'Offline'}
            </Badge>
            
            {!connected && !reconnecting && !isReconnecting && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isReconnecting}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Socket ID:</span>
                <span className="ml-2 font-mono text-xs">
                  {connectionStatus.socketId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Attempts:</span>
                <span className="ml-2">{attempts}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;
