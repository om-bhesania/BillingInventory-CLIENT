import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ChevronDown, Wifi, WifiOff, RefreshCw, RotateCcw } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isSameDay, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDashboardWebSocket } from '@/hooks/useDashboardWebSocket';
import { useToast } from '@/hooks/use-toast';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ComparisonPeriod {
  from: Date;
  to: Date;
  label: string;
  type: 'previous' | 'year_ago' | 'custom';
}

interface WebSocketDateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onComparisonPeriodChange?: (period: ComparisonPeriod) => void;
  className?: string;
  showComparisonOptions?: boolean;
  enableRealTimeUpdates?: boolean;
  showConnectionStatus?: boolean;
}

const presets = [
  {
    label: 'Today',
    getRange: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: 'This Week',
    getRange: () => {
      const now = new Date();
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    }
  },
  {
    label: 'This Month',
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  },
  {
    label: 'This Quarter',
    getRange: () => {
      const now = new Date();
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    }
  },
  {
    label: 'This Year',
    getRange: () => {
      const now = new Date();
      return { from: startOfYear(now), to: endOfYear(now) };
    }
  },
  {
    label: 'Last 7 Days',
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 6), to: now };
    }
  },
  {
    label: 'Last 30 Days',
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 29), to: now };
    }
  },
  {
    label: 'Last 90 Days',
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 89), to: now };
    }
  }
];

const comparisonTypes = [
  { value: 'previous', label: 'Previous Period', description: 'Same duration before selected range' },
  { value: 'year_ago', label: 'Same Period Last Year', description: 'Same dates from previous year' },
  { value: 'custom', label: 'Custom Comparison', description: 'Manually select comparison period' }
];

export const WebSocketDateRangePicker: React.FC<WebSocketDateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  onComparisonPeriodChange,
  className,
  showComparisonOptions = true,
  enableRealTimeUpdates = true,
  showConnectionStatus = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [selectedComparisonType, setSelectedComparisonType] = useState<string>('previous');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod | null>(null);

  const {
    isConnected,
    isConnecting,
    changeDateRange,
    resetToDefault,
    dateRange: wsDateRange,
    comparisonPeriod: wsComparisonPeriod,
    preferences
  } = useDashboardWebSocket();

  const { toast } = useToast();

  // Sync with WebSocket state
  useEffect(() => {
    if (wsDateRange && enableRealTimeUpdates) {
      onDateRangeChange(wsDateRange);
    }
  }, [wsDateRange, enableRealTimeUpdates, onDateRangeChange]);

  useEffect(() => {
    if (wsComparisonPeriod && onComparisonPeriodChange) {
      setComparisonPeriod(wsComparisonPeriod);
      onComparisonPeriodChange(wsComparisonPeriod);
    }
  }, [wsComparisonPeriod, onComparisonPeriodChange]);

  // Check if current range matches any preset
  useEffect(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      setSelectedPreset('');
      return;
    }
    
    const matchingPreset = presets.find(preset => {
      const presetRange = preset.getRange();
      return isSameDay(presetRange.from, dateRange.from) && isSameDay(presetRange.to, dateRange.to);
    });
    setSelectedPreset(matchingPreset?.label || '');
  }, [dateRange]);

  const handlePresetClick = useCallback(async (preset: typeof presets[0]) => {
    const newRange = preset.getRange();
    setIsUpdating(true);
    
    try {
      if (enableRealTimeUpdates && isConnected) {
        // Use WebSocket for real-time updates
        changeDateRange(newRange, selectedComparisonType);
        toast({
          title: "Date Range Updated",
          description: `Switched to ${preset.label} with real-time updates`,
          duration: 2000,
        });
      } else {
        // Fallback to local update
        onDateRangeChange(newRange);
      }
      
      setSelectedPreset(preset.label);
      setLastUpdateTime(new Date());
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating date range:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update date range. Using local update.",
        variant: "destructive",
        duration: 3000,
      });
      // Fallback to local update
      onDateRangeChange(newRange);
      setSelectedPreset(preset.label);
    } finally {
      setIsUpdating(false);
    }
  }, [enableRealTimeUpdates, isConnected, changeDateRange, selectedComparisonType, onDateRangeChange, toast]);

  const handleCustomRangeChange = useCallback(async (newRange: DateRange) => {
    setIsUpdating(true);
    
    try {
      if (enableRealTimeUpdates && isConnected) {
        // Use WebSocket for real-time updates
        changeDateRange(newRange, selectedComparisonType);
        toast({
          title: "Custom Range Updated",
          description: "Custom date range applied with real-time updates",
          duration: 2000,
        });
      } else {
        // Fallback to local update
        onDateRangeChange(newRange);
      }
      
      setSelectedPreset('');
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error updating custom range:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update custom range. Using local update.",
        variant: "destructive",
        duration: 3000,
      });
      // Fallback to local update
      onDateRangeChange(newRange);
      setSelectedPreset('');
    } finally {
      setIsUpdating(false);
    }
  }, [enableRealTimeUpdates, isConnected, changeDateRange, selectedComparisonType, onDateRangeChange, toast]);

  const handleComparisonTypeChange = useCallback(async (type: string) => {
    setSelectedComparisonType(type);
    
    if (dateRange && enableRealTimeUpdates && isConnected) {
      try {
        changeDateRange(dateRange, type);
        toast({
          title: "Comparison Updated",
          description: `Switched to ${comparisonTypes.find(t => t.value === type)?.label}`,
          duration: 2000,
        });
      } catch (error) {
        console.error('Error updating comparison type:', error);
      }
    }
  }, [dateRange, enableRealTimeUpdates, isConnected, changeDateRange, toast]);

  const handleResetToDefault = useCallback(async () => {
    setIsUpdating(true);
    
    try {
      if (enableRealTimeUpdates && isConnected) {
        resetToDefault();
        toast({
          title: "Reset to Default",
          description: "Dashboard reset to default settings with real-time updates",
          duration: 3000,
        });
      } else {
        // Fallback to local reset
        const defaultRange = presets[5].getRange(); // Last 7 Days
        onDateRangeChange(defaultRange);
        setSelectedPreset('Last 7 Days');
        setSelectedComparisonType('previous');
      }
    } catch (error) {
      console.error('Error resetting to default:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset to default. Using local reset.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [enableRealTimeUpdates, isConnected, resetToDefault, onDateRangeChange, toast]);

  const formatDateRange = (range: DateRange) => {
    if (isSameDay(range.from, range.to)) {
      return format(range.from, 'MMM d, yyyy');
    }
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  const getRangeDuration = (range: DateRange) => {
    const days = differenceInDays(range.to, range.from) + 1;
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const getConnectionStatus = () => {
    if (isConnecting) return { status: 'connecting', icon: RefreshCw, text: 'Connecting...', color: 'text-yellow-500' };
    if (isConnected) return { status: 'connected', icon: Wifi, text: 'Live Updates', color: 'text-green-500' };
    return { status: 'disconnected', icon: WifiOff, text: 'Offline', color: 'text-red-500' };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      {/* Main Date Range Picker */}
      <div className="flex items-center space-x-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground',
                isUpdating && 'opacity-50'
              )}
              disabled={isUpdating}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <div className="flex flex-col items-start">
                    <span>{formatDateRange(dateRange)}</span>
                    <span className="text-xs text-muted-foreground">
                      {getRangeDuration(dateRange)}
                    </span>
                  </div>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              {/* Presets */}
              <div className="border-r p-3">
                <div className="text-sm font-medium mb-3">Quick Select</div>
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant={selectedPreset === preset.label ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handlePresetClick(preset)}
                      disabled={isUpdating}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Calendar */}
              <div className="p-3">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      handleCustomRangeChange(range);
                    }
                  }}
                  numberOfMonths={2}
                  className="rounded-md border-0"
                  disabled={isUpdating}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetToDefault}
          disabled={isUpdating}
          className="flex items-center space-x-1"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </Button>

        {/* Connection Status */}
        {showConnectionStatus && (
          <div className="flex items-center space-x-1">
            <StatusIcon className={cn("h-4 w-4", connectionStatus.color, isConnecting && "animate-spin")} />
            <span className={cn("text-xs", connectionStatus.color)}>
              {connectionStatus.text}
            </span>
          </div>
        )}
      </div>

      {/* Comparison Options */}
      {showComparisonOptions && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Compare with:</span>
          <div className="flex space-x-1">
            {comparisonTypes.map((type) => (
              <Button
                key={type.value}
                variant={selectedComparisonType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleComparisonTypeChange(type.value)}
                disabled={isUpdating}
                className="text-xs"
                title={type.description}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Live Indicators */}
      {enableRealTimeUpdates && isConnected && (
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates enabled</span>
          </div>
          {lastUpdateTime && (
            <span>Last updated: {format(lastUpdateTime, 'HH:mm:ss')}</span>
          )}
        </div>
      )}

      {/* Comparison Period Display */}
      {comparisonPeriod && (
        <div className="mt-2 p-2 bg-muted rounded-md">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            {comparisonPeriod.label}
          </div>
          <div className="text-sm">
            {format(comparisonPeriod.from, 'MMM d, yyyy')} - {format(comparisonPeriod.to, 'MMM d, yyyy')}
          </div>
        </div>
      )}

      {/* Real-time Status Badge */}
      {enableRealTimeUpdates && (
        <div className="flex items-center space-x-2">
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={cn(
              "text-xs",
              isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            )}
          >
            {isConnected ? "Real-time Active" : "Offline Mode"}
          </Badge>
          {isUpdating && (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
