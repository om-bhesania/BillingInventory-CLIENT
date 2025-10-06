import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  groupedResults: Record<string, SearchResult[]>;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SearchOptions {
  query: string;
  modules?: string[];
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
}

export interface SearchStats {
  products: number;
  shops: number;
  employees: number;
  inventory: number;
  billing: number;
  categories: number;
  flavors: number;
}

// Global search
export const globalSearch = async (options: SearchOptions): Promise<SearchResponse> => {
  const params = new URLSearchParams();
  
  params.append('query', options.query);
  
  if (options.modules && options.modules.length > 0) {
    options.modules.forEach(module => params.append('modules', module));
  }
  
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options.offset) {
    params.append('offset', options.offset.toString());
  }
  
  if (options.includeInactive) {
    params.append('includeInactive', 'true');
  }

  const response = await service({
    url: `${API_URL.base}/search?${params.toString()}`,
    method: "GET",
  });
  
  return response;
};

// Get search suggestions
export const getSearchSuggestions = async (query: string): Promise<string[]> => {
  const response = await service({
    url: `${API_URL.base}/search/suggestions?query=${encodeURIComponent(query)}`,
    method: "GET",
  });
  
  return response.suggestions || [];
};

// Get search statistics
export const getSearchStats = async (): Promise<SearchStats> => {
  const response = await service({
    url: `${API_URL.base}/search/stats`,
    method: "GET",
  });
  
  return response;
};

// Search modules enum
export const SEARCH_MODULES = {
  PRODUCTS: 'products',
  SHOPS: 'shops',
  EMPLOYEES: 'employees',
  INVENTORY: 'inventory',
  BILLING: 'billing',
  RESTOCK: 'restock',
  CATEGORIES: 'categories',
  FLAVORS: 'flavors'
} as const;

export type SearchModule = typeof SEARCH_MODULES[keyof typeof SEARCH_MODULES];

// Search result types
export const SEARCH_RESULT_TYPES = {
  PRODUCT: 'product',
  SHOP: 'shop',
  EMPLOYEE: 'employee',
  INVENTORY: 'inventory',
  BILLING: 'billing',
  RESTOCK: 'restock',
  CATEGORY: 'category',
  FLAVOR: 'flavor'
} as const;

export type SearchResultType = typeof SEARCH_RESULT_TYPES[keyof typeof SEARCH_RESULT_TYPES];
