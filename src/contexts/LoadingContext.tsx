import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

interface LoadingContextType {
  loadingStates: Record<string, LoadingState>;
  setLoading: (key: string, loading: boolean, message?: string, progress?: number) => void;
  isLoading: (key: string) => boolean;
  getLoadingMessage: (key: string) => string | undefined;
  getProgress: (key: string) => number | undefined;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((
    key: string, 
    loading: boolean, 
    message?: string, 
    progress?: number
  ) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: loading,
        loadingMessage: message,
        progress: progress
      }
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const getLoadingMessage = useCallback((key: string) => {
    return loadingStates[key]?.loadingMessage;
  }, [loadingStates]);

  const getProgress = useCallback((key: string) => {
    return loadingStates[key]?.progress;
  }, [loadingStates]);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    isLoading,
    getLoadingMessage,
    getProgress,
    clearLoading,
    clearAllLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (key?: string) => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  if (key) {
    return {
      isLoading: context.isLoading(key),
      loadingMessage: context.getLoadingMessage(key),
      progress: context.getProgress(key),
      setLoading: (loading: boolean, message?: string, progress?: number) => 
        context.setLoading(key, loading, message, progress),
      clearLoading: () => context.clearLoading(key)
    };
  }

  return context;
};

// Predefined loading keys for common operations
export const LOADING_KEYS = {
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products',
  SHOPS: 'shops',
  INVENTORY: 'inventory',
  BILLING: 'billing',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOG: 'audit_log',
  LOW_STOCK: 'low_stock',
  RESTOCK: 'restock',
  EMPLOYEES: 'employees',
  CATEGORIES: 'categories',
  FLAVORS: 'flavors',
  PACKAGING_TYPES: 'packaging_types',
  SHOP_INVENTORY: 'shop_inventory',
  FORM_SUBMIT: 'form_submit',
  DATA_FETCH: 'data_fetch',
  FILE_UPLOAD: 'file_upload',
  EXPORT: 'export',
  IMPORT: 'import'
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS];
