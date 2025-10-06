import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Search,
  Activity,
  Zap,
  Key,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  getCacheStats,
  testCacheConnection,
  warmCache,
  clearAllCache,
  clearCacheByPattern,
  clearUserCache,
  clearShopCache,
  getCacheKeys,
  getCacheValue,
  setCacheValue,
  deleteCacheValue,
  CacheStats,
  CacheKey,
  CacheKeysResponse
} from '@/apis/cacheApi';
import { FadeIn } from '@/components/ui/animations/FadeIn';
import { StaggerContainer } from '@/components/ui/animations/StaggerContainer';
import { useLoading } from '@/contexts/LoadingContext';
import { LOADING_KEYS } from '@/contexts/LoadingContext';

const CacheManagement: React.FC = () => {
  const { setLoading } = useLoading();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [cacheKeys, setCacheKeys] = useState<CacheKeysResponse | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [keyValue, setKeyValue] = useState<CacheKey | null>(null);
  const [pattern, setPattern] = useState('*');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newTtl, setNewTtl] = useState('');

  // Load cache statistics
  const loadStats = async () => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Loading cache statistics...');
    try {
      const [statsData, connection] = await Promise.all([
        getCacheStats(),
        testCacheConnection()
      ]);
      setStats(statsData);
      setConnectionStatus(connection.connected);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Load cache keys
  const loadCacheKeys = async (searchPattern: string = '*') => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Loading cache keys...');
    try {
      const keysData = await getCacheKeys(searchPattern);
      setCacheKeys(keysData);
    } catch (error) {
      console.error('Failed to load cache keys:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadStats();
    loadCacheKeys();
  }, []);

  // Handle cache operations
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all cache? This action cannot be undone.')) {
      return;
    }

    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Clearing all cache...');
    try {
      await clearAllCache();
      await loadStats();
      await loadCacheKeys();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  const handleClearPattern = async () => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Clearing cache by pattern...');
    try {
      await clearCacheByPattern(pattern);
      await loadStats();
      await loadCacheKeys();
    } catch (error) {
      console.error('Failed to clear cache by pattern:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  const handleWarmCache = async () => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Warming cache...');
    try {
      await warmCache();
    } catch (error) {
      console.error('Failed to warm cache:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  const handleGetKeyValue = async (key: string) => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Loading key value...');
    try {
      const value = await getCacheValue(key);
      setKeyValue(value);
      setSelectedKey(key);
    } catch (error) {
      console.error('Failed to get key value:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  const handleSetKeyValue = async () => {
    if (!newKey || !newValue) return;

    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Setting key value...');
    try {
      const value = newValue.startsWith('{') ? JSON.parse(newValue) : newValue;
      const ttl = newTtl ? parseInt(newTtl) : undefined;
      await setCacheValue(newKey, value, ttl);
      setNewKey('');
      setNewValue('');
      setNewTtl('');
      await loadCacheKeys();
    } catch (error) {
      console.error('Failed to set key value:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm(`Are you sure you want to delete key "${key}"?`)) {
      return;
    }

    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Deleting key...');
    try {
      await deleteCacheValue(key);
      await loadCacheKeys();
      if (selectedKey === key) {
        setKeyValue(null);
        setSelectedKey('');
      }
    } catch (error) {
      console.error('Failed to delete key:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Calculate hit rate
  const hitRate = stats ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) : '0';

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <StaggerContainer>
        {/* Header */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Database className="h-8 w-8 mr-3" />
              Cache Management
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage Redis cache performance and data
            </p>
          </div>
        </FadeIn>

        {/* Action Buttons */}
        <FadeIn delay={0.1}>
          <div className="flex gap-4 mb-6">
            <Button onClick={loadStats} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
            <Button onClick={handleWarmCache} variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Warm Cache
            </Button>
            <Button onClick={handleClearAll} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
          </div>
        </FadeIn>

        {/* Cache Statistics */}
        {stats && (
          <FadeIn delay={0.2}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Cache Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.hits.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Cache Hits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {stats.misses.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Cache Misses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {hitRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.keys.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Keys</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.memory}
                    </div>
                    <div className="text-sm text-muted-foreground">Memory Used</div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    {connectionStatus === true ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : connectionStatus === false ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                      Redis Connection: {connectionStatus === true ? 'Connected' : connectionStatus === false ? 'Disconnected' : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Main Content Tabs */}
        <FadeIn delay={0.3}>
          <Tabs defaultValue="keys" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="keys">Cache Keys</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Cache Keys Tab */}
            <TabsContent value="keys">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Keys List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      Cache Keys
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          value={pattern}
                          onChange={(e) => setPattern(e.target.value)}
                          placeholder="Search pattern (e.g., user:*, products:*)"
                          className="flex-1"
                        />
                        <Button onClick={() => loadCacheKeys(pattern)}>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </Button>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {cacheKeys?.keys.map((key, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                          >
                            <span className="text-sm font-mono truncate flex-1 mr-2">
                              {key}
                            </span>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGetKeyValue(key)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteKey(key)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {cacheKeys && (
                        <div className="text-sm text-muted-foreground text-center">
                          Showing {cacheKeys.keys.length} of {cacheKeys.count} keys
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Value Viewer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Key Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {keyValue ? (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Key:</Label>
                          <div className="text-sm font-mono bg-muted p-2 rounded">
                            {selectedKey}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Value:</Label>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-64">
                            {JSON.stringify(keyValue.value, null, 2)}
                          </pre>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={keyValue.exists ? "default" : "secondary"}>
                            {keyValue.exists ? "Exists" : "Not Found"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Select a key to view its value
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Operations Tab */}
            <TabsContent value="operations">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clear Cache Operations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trash2 className="h-5 w-5 mr-2" />
                      Clear Cache
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="pattern">Clear by Pattern</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          id="pattern"
                          value={pattern}
                          onChange={(e) => setPattern(e.target.value)}
                          placeholder="e.g., user:*, products:*"
                        />
                        <Button onClick={handleClearPattern}>
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={handleClearAll}
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Set Key Value */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Edit className="h-5 w-5 mr-2" />
                      Set Key Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newKey">Key</Label>
                      <Input
                        id="newKey"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="e.g., test:key"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newValue">Value (JSON or string)</Label>
                      <textarea
                        id="newValue"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder='{"name": "test"} or simple string'
                        className="w-full h-20 p-2 border rounded mt-1 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newTtl">TTL (seconds, optional)</Label>
                      <Input
                        id="newTtl"
                        type="number"
                        value={newTtl}
                        onChange={(e) => setNewTtl(e.target.value)}
                        placeholder="3600"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      onClick={handleSetKeyValue}
                      disabled={!newKey || !newValue}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Set Value
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-8">
                      Cache settings and configuration options will be available here.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </StaggerContainer>
    </div>
  );
};

export default CacheManagement;
