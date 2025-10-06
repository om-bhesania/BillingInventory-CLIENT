import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileTableColumn {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  className?: string;
}

interface MobileTableProps {
  data: any[];
  columns: MobileTableColumn[];
  title?: string;
  className?: string;
  onRowClick?: (item: any) => void;
  expandable?: boolean;
  renderExpandedContent?: (item: any) => React.ReactNode;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  data,
  columns,
  title,
  className,
  onRowClick,
  expandable = false,
  renderExpandedContent
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    if (!expandable) return;
    
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  if (!data || data.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      
      {data.map((item, index) => {
        const itemId = item.id || index.toString();
        const isExpanded = expandedRows.has(itemId);
        
        return (
          <Card 
            key={itemId} 
            className={cn(
              'w-full transition-all duration-200 hover:shadow-md',
              onRowClick && 'cursor-pointer hover:bg-muted/50'
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {item.name || item.title || `Item ${index + 1}`}
                </CardTitle>
                {expandable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(itemId);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                {columns.map((column) => {
                  const value = item[column.key];
                  const renderedValue = column.render ? column.render(value, item) : value;
                  
                  return (
                    <div 
                      key={column.key}
                      className={cn(
                        'flex justify-between items-center py-1',
                        column.className
                      )}
                    >
                      <span className="text-sm font-medium text-muted-foreground">
                        {column.label}:
                      </span>
                      <span className="text-sm text-foreground text-right">
                        {renderedValue}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {expandable && isExpanded && renderExpandedContent && (
                <div className="mt-4 pt-4 border-t">
                  {renderExpandedContent(item)}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MobileTable;
