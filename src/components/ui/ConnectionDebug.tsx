import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import { getWebSocketService } from '@/services/websocketService';
import { Wifi, WifiOff, RefreshCw, Info } from 'lucide-react';

export const ConnectionDebug: React.FC = () => {
  const { isConnected, connectionStatus, reconnectAttempts } = useRealtimeData();
  const wsService = getWebSocketService();

  const handleReconnect = () => {
    wsService.reconnect();
  };

  const handlePing = () => {
    wsService.ping();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          Connection Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Socket ID:</span>
          <span className="text-xs font-mono">
            {connectionStatus?.socketId || 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Reconnect Attempts:</span>
          <span className="text-sm">
            {reconnectAttempts}/5
          </span>
        </div>

        {connectionStatus?.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <div className="flex items-center gap-1 text-red-600 mb-1">
              <Info className="h-3 w-3" />
              Error
            </div>
            <div className="text-red-700">
              {connectionStatus.error}
            </div>
            {connectionStatus.type && (
              <div className="text-red-600 mt-1">
                Type: {connectionStatus.type}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePing}
            className="flex-1"
          >
            <Wifi className="h-3 w-3 mr-1" />
            Ping
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <div>Token: {wsService.getToken() ? 'Present' : 'Missing'}</div>
          <div>Server: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionDebug;
