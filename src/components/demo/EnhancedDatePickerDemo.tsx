import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EnhancedDateRangePicker, DateRange, ComparisonPeriod } from '@/components/ui/EnhancedDateRangePicker';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';

export const EnhancedDatePickerDemo: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod | null>(null);
  const [preferences, setPreferences] = useState({
    defaultRange: 'last_30_days',
    comparisonType: 'previous' as const,
    autoSave: false
  });
  const [showHolidayManager, setShowHolidayManager] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    console.log('Date range changed:', range);
  };

  const handleComparisonChange = (comparison: ComparisonPeriod) => {
    setComparisonPeriod(comparison);
    console.log('Comparison period changed:', comparison);
  };

  const handlePreferencesChange = (newPreferences: any) => {
    setPreferences(newPreferences);
    console.log('Preferences changed:', newPreferences);
  };

  // Mock metrics data
  const mockMetrics = {
    revenue: {
      current: 125000,
      previous: 110000,
      growth: 13.6,
      trend: 'up' as const
    },
    orders: {
      current: 450,
      previous: 380,
      growth: 18.4,
      trend: 'up' as const
    },
    products: {
      current: 25,
      previous: 22,
      growth: 13.6,
      trend: 'up' as const
    },
    customers: {
      current: 180,
      previous: 150,
      growth: 20.0,
      trend: 'up' as const
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Date Range Picker Demo</h1>
        <p className="text-muted-foreground">
          WebSocket-powered date filtering with real-time updates, comparison periods, and holiday management
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Real-time updates active" : "Offline mode"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConnected(!isConnected)}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Enhanced Date Range Picker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnhancedDateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onComparisonChange={handleComparisonChange}
            onPreferencesChange={handlePreferencesChange}
            showLiveIndicator={true}
            showComparisonSelector={true}
            showHolidayManager={showHolidayManager}
            maxRangeDays={365}
            className="w-full"
          />

          <Separator />

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="holiday-manager"
                checked={showHolidayManager}
                onCheckedChange={setShowHolidayManager}
              />
              <Label htmlFor="holiday-manager">Show Holiday Manager</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Selection Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Selected Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            {dateRange ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days selected
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No date range selected</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparison Period</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonPeriod ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{comparisonPeriod.label}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {comparisonPeriod.from.toLocaleDateString()} - {comparisonPeriod.to.toLocaleDateString()}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No comparison period selected</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mock Metrics Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Sample Metrics (Mock Data)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mockMetrics).map(([key, metric]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">{key}</h3>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {metric.current.toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">
                      vs {metric.previous.toLocaleString()}
                    </span>
                    <Badge 
                      variant={metric.growth > 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {metric.growth > 0 ? "+" : ""}{metric.growth}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>User Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Default Range</Label>
              <p className="text-sm text-muted-foreground">{preferences.defaultRange}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Comparison Type</Label>
              <p className="text-sm text-muted-foreground capitalize">{preferences.comparisonType}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Auto Save</Label>
              <p className="text-sm text-muted-foreground">{preferences.autoSave ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Implemented Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Completed Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• WebSocket-powered real-time updates</li>
                <li>• Smart date range validation (max 365 days)</li>
                <li>• Comparison period calculation (previous/year ago)</li>
                <li>• User preferences with WebSocket sync</li>
                <li>• Holiday management system</li>
                <li>• Live connection status indicator</li>
                <li>• Save/Reset functionality with loading states</li>
                <li>• Professional Shadcn UI components</li>
                <li>• Error handling with toast notifications</li>
                <li>• Mobile-responsive design</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🔄 Real-time Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Live data updates via WebSocket</li>
                <li>• Automatic reconnection with exponential backoff</li>
                <li>• Connection status monitoring</li>
                <li>• Real-time validation feedback</li>
                <li>• Live comparison period calculation</li>
                <li>• Instant preference synchronization</li>
                <li>• Holiday-aware date selection</li>
                <li>• Optimistic UI updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
