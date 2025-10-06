import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/use-responsive';

interface MobileGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

export const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  responsive = true
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCols = () => {
    if (!responsive) return cols.desktop || 3;
    if (isMobile) return cols.mobile || 1;
    if (isTablet) return cols.tablet || 2;
    return cols.desktop || 3;
  };

  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-2';
      case 'md': return 'gap-4';
      case 'lg': return 'gap-6';
      default: return 'gap-4';
    }
  };

  const gridCols = getCols();
  const gapClass = getGapClass();

  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${gridCols}`,
        gapClass,
        className
      )}
    >
      {children}
    </div>
  );
};

export default MobileGrid;
