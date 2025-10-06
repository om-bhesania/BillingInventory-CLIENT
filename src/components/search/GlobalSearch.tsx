import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  globalSearch, 
  getSearchSuggestions, 
  getSearchStats,
  SearchResult,
  SearchResponse,
  SearchModule,
  SEARCH_MODULES,
  SEARCH_RESULT_TYPES
} from '@/apis/searchApi';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/ui/animations/FadeIn';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className,
  placeholder = "Search across all modules...",
  showFilters = true,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedModules, setSelectedModules] = useState<SearchModule[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  // Handle search suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const loadSuggestions = async () => {
        try {
          const suggestionsData = await getSearchSuggestions(debouncedQuery);
          setSuggestions(suggestionsData);
        } catch (error) {
          console.error('Failed to load suggestions:', error);
        }
      };
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Handle search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await globalSearch({
        query: searchQuery,
        modules: selectedModules.length > 0 ? selectedModules : undefined,
        limit: 20,
        includeInactive
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModules, includeInactive]);

  // Debounced search
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
    }
  }, [debouncedQuery, performSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowResults(true);
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setShowResults(false);
    setQuery('');
  };

  // Handle module toggle
  const toggleModule = (module: SearchModule) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
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

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="pl-10 pr-20"
          autoFocus={autoFocus}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery('')}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {showFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">Search Modules</div>
                <Separator />
                {Object.entries(SEARCH_MODULES).map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={selectedModules.includes(value)}
                    onCheckedChange={() => toggleModule(value)}
                  >
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                    {stats[value] && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {stats[value]}
                      </span>
                    )}
                  </DropdownMenuCheckboxItem>
                ))}
                <Separator />
                <DropdownMenuCheckboxItem
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                >
                  Include Inactive Items
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <FadeIn className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {/* Suggestions */}
              {suggestions.length > 0 && !results && (
                <div className="p-2">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4 mr-1" />
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded-sm text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              )}

              {/* Search Results */}
              {results && !isLoading && (
                <div className="p-2">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {results.totalResults} results for "{results.query}"
                    </div>
                    {selectedModules.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {selectedModules.map(module => (
                          <Badge key={module} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* No Results */}
                  {results.results.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No results found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  )}

                  {/* Results List */}
                  {results.results.length > 0 && (
                    <div className="space-y-1">
                      {results.results.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 hover:bg-muted rounded-sm transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-lg">{getResultIcon(result.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {result.title}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {getResultTypeLabel(result.type)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {result.description}
                              </p>
                              {result.metadata && (
                                <div className="flex items-center space-x-2 mt-1">
                                  {result.metadata.sku && (
                                    <span className="text-xs text-blue-600">
                                      SKU: {result.metadata.sku}
                                    </span>
                                  )}
                                  {result.metadata.category && (
                                    <span className="text-xs text-green-600">
                                      {result.metadata.category}
                                    </span>
                                  )}
                                  {result.metadata.shopName && (
                                    <span className="text-xs text-purple-600">
                                      {result.metadata.shopName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(result.relevanceScore)}%
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Load More */}
                  {results.pagination.hasMore && (
                    <div className="p-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // Implement load more functionality
                          console.log('Load more results');
                        }}
                      >
                        Load More Results
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
};

export default GlobalSearch;
