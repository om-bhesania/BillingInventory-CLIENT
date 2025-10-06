import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from '@/components/ui/Loader';
import { FadeIn } from '@/components/ui/animations/FadeIn';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <FadeIn>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </FadeIn>
  </div>
);

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyLoadingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <FadeIn>
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Failed to Load Component</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading this component. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </FadeIn>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyLoadingErrorBoundary>
        <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
          <Component {...props} />
        </Suspense>
      </LazyLoadingErrorBoundary>
    );
  };
}

// Lazy loading wrapper with custom fallback
export function LazyWrapper({ 
  children, 
  fallback, 
  errorFallback 
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}) {
  return (
    <LazyLoadingErrorBoundary>
      <Suspense fallback={fallback || <LoadingFallback />}>
        {children}
      </Suspense>
    </LazyLoadingErrorBoundary>
  );
}

// Preload function for critical components
export function preloadComponent(importFn: () => Promise<any>) {
  return () => {
    try {
      const componentPromise = importFn();
      if (componentPromise && typeof componentPromise.catch === 'function') {
        componentPromise.catch((error) => {
          console.error('Failed to preload component:', error);
        });
      }
      return componentPromise;
    } catch (error) {
      console.error('Failed to preload component:', error);
      return Promise.reject(error);
    }
  };
}

// Lazy load with preloading
export function lazyWithPreload<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  preloadFn?: () => Promise<any>
) {
  const LazyComponent = lazy(importFn);
  
  if (preloadFn) {
    // Preload the component
    preloadFn();
  }
  
  return LazyComponent;
}

// Route-based code splitting utilities
export const createLazyRoute = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loadingMessage?: string
) => {
  const LazyComponent = lazy(importFn);
  
  return function LazyRoute(props: P) {
    return (
      <LazyLoadingErrorBoundary>
        <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyLoadingErrorBoundary>
    );
  };
};

// Performance monitoring for lazy loading
export const lazyLoadingMetrics = {
  loadTimes: new Map<string, number>(),
  errors: new Map<string, number>(),
  
  recordLoadTime(componentName: string, loadTime: number) {
    this.loadTimes.set(componentName, loadTime);
  },
  
  recordError(componentName: string) {
    const current = this.errors.get(componentName) || 0;
    this.errors.set(componentName, current + 1);
  },
  
  getMetrics() {
    return {
      loadTimes: Object.fromEntries(this.loadTimes),
      errors: Object.fromEntries(this.errors)
    };
  }
};

// Enhanced lazy loading with metrics
export function lazyWithMetrics<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  componentName: string,
  loadingMessage?: string
) {
  const LazyComponent = lazy(() => {
    const startTime = performance.now();
    
    return importFn().then((module) => {
      const endTime = performance.now();
      lazyLoadingMetrics.recordLoadTime(componentName, endTime - startTime);
      return module;
    }).catch((error) => {
      lazyLoadingMetrics.recordError(componentName);
      throw error;
    });
  });
  
  return function LazyComponentWithMetrics(props: P) {
    return (
      <LazyLoadingErrorBoundary>
        <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyLoadingErrorBoundary>
    );
  };
}

// Bundle analyzer utility
export function getBundleInfo() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    return {
      navigation: {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart
      },
      resources: {
        js: jsResources.length,
        css: cssResources.length,
        total: resources.length
      },
      lazyLoading: lazyLoadingMetrics.getMetrics()
    };
  }
  
  return null;
}

export default {
  withLazyLoading,
  LazyWrapper,
  preloadComponent,
  lazyWithPreload,
  createLazyRoute,
  lazyWithMetrics,
  getBundleInfo
};
