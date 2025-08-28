import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
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

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

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

  const handlePresetClick = (preset: typeof presets[0]) => {
    const newRange = preset.getRange();
    onDateRangeChange(newRange);
    setSelectedPreset(preset.label);
    setIsOpen(false);
  };

  const handleCustomRangeChange = (newRange: DateRange) => {
    onDateRangeChange(newRange);
    setSelectedPreset('');
  };

  const formatDateRange = (range: DateRange) => {
    if (isSameDay(range.from, range.to)) {
      return format(range.from, 'MMM d, yyyy');
    }
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                formatDateRange(dateRange)
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
                onSelect={(range:any) => {
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
    </div>
  );
};
