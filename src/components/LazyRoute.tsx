import React, { Suspense } from 'react';
import { LazyWrapper } from '@/utils/lazyLoading';
import LoadingSpinner from '@/components/ui/Loader';
import { FadeIn } from '@/components/ui/animations/FadeIn';

interface LazyRouteProps {
  children: React.ReactNode;
  loadingMessage?: string;
  minHeight?: string;
}

const LazyRoute: React.FC<LazyRouteProps> = ({ 
  children, 
  loadingMessage = 'Loading page...',
  minHeight = '400px'
}) => {
  const fallback = (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <FadeIn>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">{loadingMessage}</p>
        </div>
      </FadeIn>
    </div>
  );

  return (
    <LazyWrapper fallback={fallback}>
      {children}
    </LazyWrapper>
  );
};

export default LazyRoute;
