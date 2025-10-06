import React from "react";
import { useRealtimeData } from "@/contexts/RealtimeDataContext";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const ConnectionStatusBar: React.FC = () => {
  const { isConnected, connectionStatus, reconnect, refreshConnection } = useRealtimeData();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if connected or dismissed
  if (isConnected || isDismissed) {
    return null;
  }

  const { error, attempts, failed } = connectionStatus || {};

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Connection Lost
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
            {attempts > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Attempting to reconnect... ({attempts} attempts)
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reconnect}
            className="h-8 px-3 text-xs border-red-300 text-red-700 hover:bg-red-100"
          >
            Reconnect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshConnection}
            className="h-8 px-3 text-xs border-red-300 text-red-700 hover:bg-red-100"
          >
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0 text-red-500 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatusBar;
