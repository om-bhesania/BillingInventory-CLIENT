import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

interface SimpleDateRangePickerProps {
  onDateRangeChange?: (dateRange: DateRange) => void;
  initialDateRange?: DateRange;
  className?: string;
  defaultDateRange?: DateRange;
}

const quickRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 }
];

export const SimpleDateRangePicker: React.FC<SimpleDateRangePickerProps> = ({
  onDateRangeChange,
  initialDateRange,
  className,
  defaultDateRange
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(
    initialDateRange
  );
  const [isOpen, setIsOpen] = useState(false);

  // Sync with initial date range
  useEffect(() => {
    if (initialDateRange && !selectedDateRange) {
      setSelectedDateRange(initialDateRange);
    }
  }, [initialDateRange, selectedDateRange]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setSelectedDateRange(newDateRange);
    onDateRangeChange?.(newDateRange);
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    const newDateRange = { from: start, to: end };
    handleDateRangeChange(newDateRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetDateRange = defaultDateRange || { from: subDays(new Date(), 30), to: new Date() };
    handleDateRangeChange(resetDateRange);
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range Selection
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDateRange && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDateRange ? (
                  `${format(selectedDateRange.from, "MMM dd, yyyy")} - ${format(selectedDateRange.to, "MMM dd, yyyy")}`
                ) : (
                  "Select date range"
                )}
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <CalendarComponent
                  mode="range"
                  selected={selectedDateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      handleDateRangeChange({
                        from: startOfDay(range.from),
                        to: endOfDay(range.to)
                      });
                    }
                  }}
                  numberOfMonths={2}
                  className="rounded-md border"
                />
                <div className="border-l p-4 space-y-2 min-w-[200px]">
                  <h4 className="font-medium text-sm mb-3">Quick Ranges</h4>
                  {quickRanges.map((range) => (
                    <Button
                      key={range.days}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickRange(range.days)}
                      className="w-full justify-start text-xs"
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    </div>
  );
};
