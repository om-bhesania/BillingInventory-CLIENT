import { useState, useCallback } from 'react';
import { service } from '@/services/service';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (params?: any) => Promise<T | null>;
  reset: () => void;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Custom hook for making API calls with loading states and error handling
 * 
 * @param endpoint - The API endpoint (without base URL)
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param options - Additional options like immediate execution
 * @returns Object with data, loading state, error, execute function, and reset function
 * 
 * @example
 * // Basic usage
 * const { data, loading, error, execute } = useApi('/users', 'GET');
 * 
 * // Execute on mount
 * const { data, loading, error, execute } = useApi('/users', 'GET', { immediate: true });
 * 
 * // POST request
 * const { data, loading, error, execute } = useApi('/users', 'POST');
 * const handleSubmit = () => execute({ name: 'John', email: 'john@example.com' });
 * 
 * // With query parameters
 * const { data, loading, error, execute } = useApi('/users', 'GET');
 * const handleSearch = () => execute({ query: { search: 'john', limit: 10 } });
 */
export function useApi<T = any>(
  endpoint: string,
  method: HttpMethod = 'GET',
  options: {
    immediate?: boolean;
    initialData?: T;
  } = {}
): ApiResponse<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: options.initialData || null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params?: any): Promise<T | null> => {
      if (state.loading) return null; // prevent re-entry while in flight
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        let config: any = {
          url: endpoint,
          method,
        };

        // Handle different HTTP methods
        if (method === 'GET' && params?.query) {
          // GET with query parameters
          config.query = params.query;
        } else if (['POST', 'PUT', 'PATCH'].includes(method) && params) {
          // POST/PUT/PATCH with body data
          config.data = params;
        } else if (method === 'DELETE' && params?.id) {
          // DELETE with ID in URL
          config.url = `${endpoint}/${params.id}`;
        } else if (method === 'DELETE' && params) {
          // DELETE with body data
          config.data = params;
        }

        const response = await service<T>(config);
        console.log("response=============>", response);
        setState({
          data: response,
          loading: false,
          error: null,
        });

        return response;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        return null;
      }
    },
    [endpoint, method, state.loading]
  );

  const reset = useCallback(() => {
    setState({
      data: options.initialData || null,
      loading: false,
      error: null,
    });
  }, [options.initialData]);

  // Execute immediately if requested
  if (options.immediate && !state.data && !state.loading && !state.error) {
    execute();
  }

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Specialized hooks for common HTTP methods
 */

export function useGet<T = any>(endpoint: string, options?: { immediate?: boolean; initialData?: T }) {
  return useApi<T>(endpoint, 'GET', options);
}

export function usePost<T = any>(endpoint: string, options?: { immediate?: boolean; initialData?: T }) {
  return useApi<T>(endpoint, 'POST', options);
}

export function usePut<T = any>(endpoint: string, options?: { immediate?: boolean; initialData?: T }) {
  return useApi<T>(endpoint, 'PUT', options);
}

export function usePatch<T = any>(endpoint: string, options?: { immediate?: boolean; initialData?: T }) {
  return useApi<T>(endpoint, 'PATCH', options);
}

export function useDelete<T = any>(endpoint: string, options?: { immediate?: boolean; initialData?: T }) {
  return useApi<T>(endpoint, 'DELETE', options);
}

/**
 * Hook for making one-time API calls without maintaining state
 * Useful for actions like form submissions where you don't need to store the response
 */
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async <T = any>(
    endpoint: string,
    method: HttpMethod = 'GET',
    data?: any
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);

      const config: any = {
        url: endpoint,
        method,
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        config.data = data;
      }

      const response = await service<T>(config);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    call,
    loading,
    error,
    reset,
  };
}
