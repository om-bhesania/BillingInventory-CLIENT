import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  className?: string;
  children: React.ReactNode;
  showProgress?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  progress,
  className,
  children,
  showProgress = false
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm',
          'flex items-center justify-center z-50',
          className
        )}>
          <LoadingSpinner
            size="lg"
            message={message}
            progress={progress}
            showProgress={showProgress}
          />
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
