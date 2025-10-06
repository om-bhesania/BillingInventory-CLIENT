import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';

interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  actions,
  className,
  onClick,
  hoverable = false
}) => {
  const { isMobile } = useResponsive();

  return (
    <Card 
      className={cn(
        'w-full transition-all duration-200',
        hoverable && 'hover:shadow-md hover:scale-[1.02]',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      {(title || subtitle || badge || actions) && (
        <CardHeader className={cn(
          'pb-3',
          isMobile ? 'px-4 py-3' : 'px-6 py-4'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <CardTitle className={cn(
                  'text-base font-semibold truncate',
                  isMobile && 'text-sm'
                )}>
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <p className={cn(
                  'text-sm text-muted-foreground mt-1',
                  isMobile && 'text-xs'
                )}>
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-2">
              {badge && (
                <Badge variant={badgeVariant} className={cn(
                  'text-xs',
                  isMobile && 'text-xs px-2 py-1'
                )}>
                  {badge}
                </Badge>
              )}
              {actions && (
                <div className="flex items-center space-x-1">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(
        isMobile ? 'px-4 py-3' : 'px-6 py-4'
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

export default MobileCard;
