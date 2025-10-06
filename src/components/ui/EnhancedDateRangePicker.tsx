import React, { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  ChevronDown, 
  Save, 
  RotateCcw, 
  Loader2, 
  Wifi, 
  WifiOff,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isSameDay, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { HolidayManager } from './HolidayManager';

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

export interface DateRangePreferences {
  defaultRange: string;
  comparisonType: 'previous' | 'year_ago';
  autoSave: boolean;
}

interface EnhancedDateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onComparisonChange?: (comparison: ComparisonPeriod) => void;
  className?: string;
  disabled?: boolean;
  maxRangeDays?: number;
  showLiveIndicator?: boolean;
  showComparisonSelector?: boolean;
  showHolidayManager?: boolean;
  onPreferencesChange?: (preferences: DateRangePreferences) => void;
}

const presets = [
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: 'This Week',
    value: 'this_week',
    getRange: () => {
      const now = new Date();
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    }
  },
  {
    label: 'Last 7 Days',
    value: 'last_7_days',
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 6), to: now };
    }
  },
  {
    label: 'This Month',
    value: 'this_month',
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  },
  {
    label: 'Last 30 Days',
    value: 'last_30_days',
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 29), to: now };
    }
  },
  {
    label: 'This Quarter',
    value: 'this_quarter',
    getRange: () => {
      const now = new Date();
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    }
  },
  {
    label: 'Last 90 Days',
    value: 'last_90_days',
    getRange: () => {
      const now = new Date();
      return { from: subDays(now, 89), to: now };
    }
  },
  {
    label: 'This Year',
    value: 'this_year',
    getRange: () => {
      const now = new Date();
      return { from: startOfYear(now), to: endOfYear(now) };
    }
  }
];

const comparisonTypes = [
  { label: 'Previous Period', value: 'previous' },
  { label: 'Same Period Last Year', value: 'year_ago' }
];

export const EnhancedDateRangePicker: React.FC<EnhancedDateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  onComparisonChange,
  className,
  disabled = false,
  maxRangeDays = 365,
  showLiveIndicator = true,
  showComparisonSelector = true,
  showHolidayManager = false,
  onPreferencesChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [tempDateRange, setTempDateRange] = useState<DateRange | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [comparisonType, setComparisonType] = useState<'previous' | 'year_ago'>('previous');
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod | null>(null);
  const [preferences, setPreferences] = useState<DateRangePreferences>({
    defaultRange: 'last_30_days',
    comparisonType: 'previous',
    autoSave: false
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { toast } = useToast();
  const { socket, isConnected: wsConnected } = useWebSocket();

  // Update connection status
  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  // Initialize with default preferences
  useEffect(() => {
    const defaultPreset = presets.find(p => p.value === preferences.defaultRange);
    if (defaultPreset && !dateRange) {
      const defaultRange = defaultPreset.getRange();
      setTempDateRange(defaultRange);
      onDateRangeChange(defaultRange);
    }
  }, [preferences.defaultRange, dateRange, onDateRangeChange]);

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
    setSelectedPreset(matchingPreset?.value || '');
  }, [dateRange]);

  // Calculate comparison period
  const calculateComparisonPeriod = useCallback((range: DateRange, type: 'previous' | 'year_ago'): ComparisonPeriod => {
    const { from, to } = range;
    const duration = differenceInDays(to, from);
    
    if (type === 'previous') {
      const prevFrom = subDays(from, duration + 1);
      const prevTo = subDays(to, duration + 1);
      return {
        from: prevFrom,
        to: prevTo,
        label: 'Previous Period',
        type: 'previous'
      };
    } else {
      const yearAgoFrom = new Date(from);
      yearAgoFrom.setFullYear(yearAgoFrom.getFullYear() - 1);
      const yearAgoTo = new Date(to);
      yearAgoTo.setFullYear(yearAgoTo.getFullYear() - 1);
      return {
        from: yearAgoFrom,
        to: yearAgoTo,
        label: 'Same Period Last Year',
        type: 'year_ago'
      };
    }
  }, []);

  // Validate date range
  const validateDateRange = useCallback((range: DateRange): { isValid: boolean; error?: string } => {
    if (!range.from || !range.to) {
      return { isValid: false, error: 'Please select both start and end dates' };
    }

    if (range.from > range.to) {
      return { isValid: false, error: 'Start date cannot be after end date' };
    }

    const daysDiff = differenceInDays(range.to, range.from);
    if (daysDiff > maxRangeDays) {
      return { isValid: false, error: `Date range cannot exceed ${maxRangeDays} days` };
    }

    const today = new Date();
    if (range.from > today) {
      return { isValid: false, error: 'Start date cannot be in the future' };
    }

    return { isValid: true };
  }, [maxRangeDays]);

  // Handle preset selection
  const handlePresetClick = (preset: typeof presets[0]) => {
    const newRange = preset.getRange();
    const validation = validateDateRange(newRange);
    
    if (!validation.isValid) {
      toast({
        type: 'error',
        title: 'Invalid Date Range',
        text: validation.error || 'Please select a valid date range'
      });
      return;
    }

    setTempDateRange(newRange);
    setSelectedPreset(preset.value);
    setHasUnsavedChanges(true);
  };

  // Handle custom range change
  const handleCustomRangeChange = (newRange: DateRange | undefined) => {
    if (!newRange?.from || !newRange?.to) return;
    
    const validation = validateDateRange(newRange);
    if (!validation.isValid) {
      toast({
        type: 'error',
        title: 'Invalid Date Range',
        text: validation.error || 'Please select a valid date range'
      });
      return;
    }

    setTempDateRange(newRange);
    setSelectedPreset('');
    setHasUnsavedChanges(true);
  };

  // Save date range changes
  const handleSave = async () => {
    if (!tempDateRange) return;

    setIsSaving(true);
    try {
      // Emit WebSocket event for real-time update
      if (socket && isConnected) {
        socket.emit('dashboard:dateRange:change', {
          dateRange: tempDateRange,
          comparisonType,
          timestamp: new Date().toISOString()
        });
      }

      // Calculate comparison period
      const comparison = calculateComparisonPeriod(tempDateRange, comparisonType);
      setComparisonPeriod(comparison);

      // Update the actual date range
      onDateRangeChange(tempDateRange);
      onComparisonChange?.(comparison);

      // Update preferences if changed
      if (selectedPreset && selectedPreset !== preferences.defaultRange) {
        const newPreferences = { ...preferences, defaultRange: selectedPreset };
        setPreferences(newPreferences);
        onPreferencesChange?.(newPreferences);
      }

      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      toast({
        type: 'success',
        title: 'Date Range Updated',
        text: 'Dashboard data has been refreshed with the new date range'
      });

    } catch (error) {
      toast({
        type: 'error',
        title: 'Save Failed',
        text: 'Failed to update date range. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    const defaultPreset = presets.find(p => p.value === preferences.defaultRange);
    if (defaultPreset) {
      const defaultRange = defaultPreset.getRange();
      setTempDateRange(defaultRange);
      setSelectedPreset(defaultPreset.value);
      setHasUnsavedChanges(true);
    }
  };

  // Handle comparison type change
  const handleComparisonTypeChange = (type: 'previous' | 'year_ago') => {
    setComparisonType(type);
    if (tempDateRange) {
      const comparison = calculateComparisonPeriod(tempDateRange, type);
      setComparisonPeriod(comparison);
    }
  };

  const formatDateRange = (range: DateRange) => {
    if (isSameDay(range.from, range.to)) {
      return format(range.from, 'MMM d, yyyy');
    }
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  const currentRange = tempDateRange || dateRange;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Date Range Picker */}
      <div className="flex items-center space-x-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-[300px] justify-start text-left font-normal',
                !currentRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentRange?.from ? (
                currentRange.to ? (
                  formatDateRange(currentRange)
                ) : (
                  format(currentRange.from, 'LLL dd, y')
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
                      key={preset.value}
                      variant={selectedPreset === preset.value ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handlePresetClick(preset)}
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
                  defaultMonth={currentRange?.from}
                  selected={currentRange}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      handleCustomRangeChange(range);
                    }
                  }}
                  numberOfMonths={2}
                  className="rounded-md border-0"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving || !currentRange}
            className="h-8"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            <span className="ml-1">Save</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="ml-1">Reset</span>
          </Button>
        </div>

        {/* Live Indicator */}
        {showLiveIndicator && (
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Comparison Period Selector */}
      {showComparisonSelector && (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Compare with:</span>
            <Select value={comparisonType} onValueChange={handleComparisonTypeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {comparisonTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {comparisonPeriod && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatDateRange(comparisonPeriod)} ({comparisonPeriod.label})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <span className="text-amber-600">• Unsaved changes</span>
          )}
          {lastSaved && (
            <span className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3" />
              <span>Saved {format(lastSaved, 'MMM d, HH:mm')}</span>
            </span>
          )}
        </div>
        
        {currentRange && (
          <span>
            {differenceInDays(currentRange.to, currentRange.from) + 1} days selected
          </span>
        )}
      </div>

      {/* Holiday Manager */}
      {showHolidayManager && (
        <div className="mt-6">
          <HolidayManager
            onHolidaySelect={(holiday) => {
              if (holiday) {
                const holidayDate = new Date(holiday.date);
                setTempDateRange({ from: holidayDate, to: holidayDate });
                setHasUnsavedChanges(true);
              }
            }}
            selectedDate={currentRange?.from}
          />
        </div>
      )}
    </div>
  );
};