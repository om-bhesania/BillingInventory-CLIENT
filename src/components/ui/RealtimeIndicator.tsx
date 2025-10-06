import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  X, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Store, 
  AlertTriangle,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    inventoryUpdates,
    restockUpdates,
    billingUpdates,
    productUpdates,
    shopUpdates,
    dashboardUpdates,
    lowStockAlerts,
    systemHealth,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    clearUpdates,
    clearAllUpdates,
    reconnect
  } = useRealtimeData();

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const totalUpdates = inventoryUpdates.length + restockUpdates.length + 
    billingUpdates.length + productUpdates.length + shopUpdates.length + 
    dashboardUpdates.length + lowStockAlerts.length;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'restock':
        return <ShoppingCart className="h-4 w-4" />;
      case 'billing':
        return <DollarSign className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'shop':
        return <Store className="h-4 w-4" />;
      case 'dashboard':
        return <BarChart3 className="h-4 w-4" />;
      case 'lowStock':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'text-blue-600 bg-blue-100';
      case 'restock':
        return 'text-orange-600 bg-orange-100';
      case 'billing':
        return 'text-green-600 bg-green-100';
      case 'product':
        return 'text-purple-600 bg-purple-100';
      case 'shop':
        return 'text-indigo-600 bg-indigo-100';
      case 'dashboard':
        return 'text-cyan-600 bg-cyan-100';
      case 'lowStock':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isConnected) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <WifiOff className="h-4 w-4 text-red-500" />
        <div className="flex flex-col">
          <span className="text-sm text-red-600">Disconnected</span>
          {reconnectAttempts > 0 && (
            <span className="text-xs text-red-500">
              Attempt {reconnectAttempts}/5
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reconnect}
          className="h-6 px-2 text-xs"
        >
          Reconnect
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("flex items-center gap-2 relative", className)}>
      <div className="flex items-center gap-1">
        <Wifi className="h-4 w-4 text-green-500" />
        <span className="text-sm text-green-600">Live</span>
      </div>
      
      {totalUpdates > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 px-2 text-xs hover:bg-gray-100 flex items-center gap-1"
        >
          <Badge variant="secondary" className="text-xs">
            {totalUpdates} updates
          </Badge>
          <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
        </Button>
      )}

      {/* Real-time updates panel */}
      {totalUpdates > 0 && isOpen && (
        <div className="relative">
          <Card className="absolute top-8 right-0 w-80 z-50 shadow-lg border max-h-96 overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-900">Real-time Updates</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllUpdates}
                    className="h-6 px-2 text-xs hover:bg-gray-100"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64 max-h-64 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {/* Inventory Updates */}
                  {inventoryUpdates.slice(0, 5).map((update, index) => (
                    <div key={`inventory-${index}`} className="flex items-center gap-2 text-xs">
                      <div className={cn("p-1 rounded flex-shrink-0", getUpdateColor('inventory'))}>
                        {getUpdateIcon('inventory')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900">Inventory {update.type}</p>
                        <p className="text-gray-500 text-xs">{formatTime(update.timestamp)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Restock Updates */}
                  {restockUpdates.slice(0, 5).map((update, index) => (
                    <div key={`restock-${index}`} className="flex items-center gap-2 text-xs">
                      <div className={cn("p-1 rounded flex-shrink-0", getUpdateColor('restock'))}>
                        {getUpdateIcon('restock')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900">Restock {update.type}</p>
                        <p className="text-gray-500 text-xs">{formatTime(update.timestamp)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Billing Updates */}
                  {billingUpdates.slice(0, 5).map((update, index) => (
                    <div key={`billing-${index}`} className="flex items-center gap-2 text-xs">
                      <div className={cn("p-1 rounded flex-shrink-0", getUpdateColor('billing'))}>
                        {getUpdateIcon('billing')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900">Billing {update.type}</p>
                        <p className="text-gray-500 text-xs">{formatTime(update.timestamp)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Low Stock Alerts */}
                  {lowStockAlerts.slice(0, 5).map((alert, index) => (
                    <div key={`lowstock-${index}`} className="flex items-center gap-2 text-xs">
                      <div className={cn("p-1 rounded flex-shrink-0", getUpdateColor('lowStock'))}>
                        {getUpdateIcon('lowStock')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-gray-900">Low Stock Alert</p>
                        <p className="text-gray-500 text-xs">{formatTime(alert.timestamp)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Show more indicator if there are more updates */}
                  {totalUpdates > 20 && (
                    <div className="text-center text-xs text-gray-500 py-2">
                      +{totalUpdates - 20} more updates
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RealtimeIndicator;

