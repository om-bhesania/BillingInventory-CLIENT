import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  BarChart3,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  globalSearch, 
  getSearchStats,
  SearchResult,
  SearchResponse,
  SearchModule,
  SEARCH_MODULES,
  SEARCH_RESULT_TYPES
} from '@/apis/searchApi';
import { FadeIn } from '@/components/ui/animations/FadeIn';
import { StaggerContainer } from '@/components/ui/animations/StaggerContainer';
import { useLoading } from '@/contexts/LoadingContext';
import { LOADING_KEYS } from '@/contexts/LoadingContext';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [selectedModules, setSelectedModules] = useState<SearchModule[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load search statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getSearchStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load search stats:', error);
      }
    };
    loadStats();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Perform search
  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Searching...');
    try {
      const searchResults = await globalSearch({
        query: searchQuery,
        modules: selectedModules.length > 0 ? selectedModules : undefined,
        limit: 50,
        includeInactive
      });
      setResults(searchResults);
      
      // Save to recent searches
      const newRecentSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSearchParams({ q: searchQuery });
    performSearch(searchQuery);
  };

  // Handle module toggle
  const toggleModule = (module: SearchModule) => {
    const newModules = selectedModules.includes(module)
      ? selectedModules.filter(m => m !== module)
      : [...selectedModules, module];
    setSelectedModules(newModules);
  };

  // Get result icon
  const getResultIcon = (type: string) => {
    switch (type) {
      case SEARCH_RESULT_TYPES.PRODUCT:
        return '📦';
      case SEARCH_RESULT_TYPES.SHOP:
        return '🏪';
      case SEARCH_RESULT_TYPES.EMPLOYEE:
        return '👤';
      case SEARCH_RESULT_TYPES.INVENTORY:
        return '📋';
      case SEARCH_RESULT_TYPES.BILLING:
        return '🧾';
      case SEARCH_RESULT_TYPES.RESTOCK:
        return '📦';
      case SEARCH_RESULT_TYPES.CATEGORY:
        return '🏷️';
      case SEARCH_RESULT_TYPES.FLAVOR:
        return '🍦';
      default:
        return '📄';
    }
  };

  // Get result type label
  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case SEARCH_RESULT_TYPES.PRODUCT:
        return 'Product';
      case SEARCH_RESULT_TYPES.SHOP:
        return 'Shop';
      case SEARCH_RESULT_TYPES.EMPLOYEE:
        return 'Employee';
      case SEARCH_RESULT_TYPES.INVENTORY:
        return 'Inventory';
      case SEARCH_RESULT_TYPES.BILLING:
        return 'Invoice';
      case SEARCH_RESULT_TYPES.RESTOCK:
        return 'Restock Request';
      case SEARCH_RESULT_TYPES.CATEGORY:
        return 'Category';
      case SEARCH_RESULT_TYPES.FLAVOR:
        return 'Flavor';
      default:
        return 'Item';
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  // Get grouped results
  const getGroupedResults = () => {
    if (!results) return {};
    
    return results.results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <StaggerContainer>
        {/* Header */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Global Search</h1>
            <p className="text-muted-foreground">
              Search across all modules in your Bliss Ice Cream Management System
            </p>
          </div>
        </FadeIn>

        {/* Search Input */}
        <FadeIn delay={0.1}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search across all modules..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <Button onClick={() => handleSearch(query)}>
                  Search
                </Button>
              </div>

              {/* Filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filter by module:</span>
                </div>
                {Object.entries(SEARCH_MODULES).map(([key, value]) => (
                  <Button
                    key={value}
                    variant={selectedModules.includes(value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleModule(value)}
                  >
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                    {stats[value] && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {stats[value]}
                      </Badge>
                    )}
                  </Button>
                ))}
                <Button
                  variant={includeInactive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIncludeInactive(!includeInactive)}
                >
                  Include Inactive
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !results && (
          <FadeIn delay={0.2}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(search)}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Search Results */}
        {results && (
          <FadeIn delay={0.3}>
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {results.totalResults} results for "{results.query}"
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedModules.length > 0 && `Filtered by: ${selectedModules.join(', ')}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Sorted by relevance
                  </span>
                </div>
              </div>

              {/* Grouped Results */}
              {Object.entries(getGroupedResults()).map(([type, typeResults]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getResultIcon(type)}</span>
                        {getResultTypeLabel(type)}
                        <Badge variant="secondary" className="ml-2">
                          {typeResults.length}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navigate to module page
                          const moduleRoutes: Record<string, string> = {
                            [SEARCH_RESULT_TYPES.PRODUCT]: '/inventory/products',
                            [SEARCH_RESULT_TYPES.SHOP]: '/shops',
                            [SEARCH_RESULT_TYPES.EMPLOYEE]: '/employees',
                            [SEARCH_RESULT_TYPES.INVENTORY]: '/shop-inventory',
                            [SEARCH_RESULT_TYPES.BILLING]: '/invoices',
                            [SEARCH_RESULT_TYPES.RESTOCK]: '/restock-requests',
                            [SEARCH_RESULT_TYPES.CATEGORY]: '/inventory/categories',
                            [SEARCH_RESULT_TYPES.FLAVOR]: '/inventory/flavors'
                          };
                          navigate(moduleRoutes[type] || '/');
                        }}
                      >
                        View All
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {typeResults.map((result, index) => (
                        <div
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => handleResultClick(result)}
                          className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm mb-1">
                                {result.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {result.description}
                              </p>
                              {result.metadata && (
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  {result.metadata.sku && (
                                    <span>SKU: {result.metadata.sku}</span>
                                  )}
                                  {result.metadata.category && (
                                    <span>Category: {result.metadata.category}</span>
                                  )}
                                  {result.metadata.shopName && (
                                    <span>Shop: {result.metadata.shopName}</span>
                                  )}
                                  {result.metadata.unitPrice && (
                                    <span>Price: ₹{result.metadata.unitPrice}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-muted-foreground">
                                {Math.round(result.relevanceScore)}%
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* No Results */}
              {results.results.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search terms or filters
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery('');
                        setSelectedModules([]);
                        setIncludeInactive(false);
                        setResults(null);
                      }}
                    >
                      Clear Search
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </FadeIn>
        )}

        {/* Search Statistics */}
        {!results && (
          <FadeIn delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Search Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats).map(([module, count]) => (
                    <div key={module} className="text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {module}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </StaggerContainer>
    </div>
  );
};

export default SearchPage;
