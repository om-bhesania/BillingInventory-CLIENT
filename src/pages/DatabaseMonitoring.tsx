import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Search,
  Trash2,
  Activity,
  HardDrive,
  Zap
} from 'lucide-react';
import { 
  getDatabaseHealthReport,
  getIndexStats,
  getTableStats,
  getSlowQueries,
  getUnusedIndexes,
  getDatabaseSize,
  analyzeQuery,
  updateStatistics,
  HealthReport,
  IndexStats,
  TableStats,
  QueryStats
} from '@/apis/databaseApi';
import { FadeIn } from '@/components/ui/animations/FadeIn';
import { StaggerContainer } from '@/components/ui/animations/StaggerContainer';
import { useLoading } from '@/contexts/LoadingContext';
import { LOADING_KEYS } from '@/contexts/LoadingContext';
import BundleAnalyzer from '@/components/BundleAnalyzer';
import BundleOptimizationDashboard from '@/components/BundleOptimizationDashboard';

const DatabaseMonitoring: React.FC = () => {
  const { setLoading } = useLoading();
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [indexStats, setIndexStats] = useState<IndexStats[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [slowQueries, setSlowQueries] = useState<QueryStats[]>([]);
  const [unusedIndexes, setUnusedIndexes] = useState<IndexStats[]>([]);
  const [queryAnalysis, setQueryAnalysis] = useState<any>(null);
  const [customQuery, setCustomQuery] = useState('');

  // Load all data
  const loadData = async () => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Loading database metrics...');
    try {
      const [health, indexes, tables, slow, unused] = await Promise.all([
        getDatabaseHealthReport(),
        getIndexStats(),
        getTableStats(),
        getSlowQueries(10),
        getUnusedIndexes()
      ]);
      
      setHealthReport(health);
      setIndexStats(indexes);
      setTableStats(tables);
      setSlowQueries(slow);
      setUnusedIndexes(unused);
    } catch (error) {
      console.error('Failed to load database data:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle query analysis
  const handleAnalyzeQuery = async () => {
    if (!customQuery.trim()) return;
    
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Analyzing query...');
    try {
      const analysis = await analyzeQuery(customQuery);
      setQueryAnalysis(analysis);
    } catch (error) {
      console.error('Query analysis failed:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Handle statistics update
  const handleUpdateStatistics = async () => {
    setLoading(LOADING_KEYS.DATA_FETCH, true, 'Updating statistics...');
    try {
      await updateStatistics();
      await loadData(); // Reload data after update
    } catch (error) {
      console.error('Failed to update statistics:', error);
    } finally {
      setLoading(LOADING_KEYS.DATA_FETCH, false);
    }
  };

  // Get performance status
  const getPerformanceStatus = (scans: number, indexScans: number) => {
    const ratio = indexScans / (scans + indexScans);
    if (ratio > 0.8) return { status: 'excellent', color: 'green' };
    if (ratio > 0.6) return { status: 'good', color: 'blue' };
    if (ratio > 0.4) return { status: 'fair', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <StaggerContainer>
        {/* Header */}
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Database className="h-8 w-8 mr-3" />
              Database Monitoring
            </h1>
            <p className="text-muted-foreground">
              Monitor database performance, indexes, and query optimization
            </p>
          </div>
        </FadeIn>

        {/* Action Buttons */}
        <FadeIn delay={0.1}>
          <div className="flex gap-4 mb-6">
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={handleUpdateStatistics} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Update Statistics
            </Button>
          </div>
        </FadeIn>

        {/* Health Overview */}
        {healthReport && (
          <FadeIn delay={0.2}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Database Health Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {healthReport.databaseSize.size}
                    </div>
                    <div className="text-sm text-muted-foreground">Database Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {healthReport.databaseSize.tables}
                    </div>
                    <div className="text-sm text-muted-foreground">Tables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {healthReport.databaseSize.indexes}
                    </div>
                    <div className="text-sm text-muted-foreground">Indexes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {unusedIndexes.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Unused Indexes</div>
                  </div>
                </div>

                {/* Recommendations */}
                {healthReport.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Recommendations:</h4>
                    {healthReport.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Main Content Tabs */}
        <FadeIn delay={0.3}>
          <Tabs defaultValue="indexes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="indexes">Index Usage</TabsTrigger>
              <TabsTrigger value="tables">Table Stats</TabsTrigger>
              <TabsTrigger value="queries">Slow Queries</TabsTrigger>
              <TabsTrigger value="unused">Unused Indexes</TabsTrigger>
              <TabsTrigger value="analyzer">Query Analyzer</TabsTrigger>
              <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
              <TabsTrigger value="optimization">Bundle Optimization</TabsTrigger>
            </TabsList>

            {/* Index Usage Tab */}
            <TabsContent value="indexes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Index Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Table</th>
                          <th className="text-left p-2">Index</th>
                          <th className="text-right p-2">Scans</th>
                          <th className="text-right p-2">Tuples Read</th>
                          <th className="text-right p-2">Tuples Fetched</th>
                          <th className="text-right p-2">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indexStats.slice(0, 20).map((stat, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{stat.tableName}</td>
                            <td className="p-2 text-muted-foreground">{stat.indexName}</td>
                            <td className="p-2 text-right">{stat.scans.toLocaleString()}</td>
                            <td className="p-2 text-right">{stat.tuplesRead.toLocaleString()}</td>
                            <td className="p-2 text-right">{stat.tuplesFetched.toLocaleString()}</td>
                            <td className="p-2 text-right text-muted-foreground">{stat.size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Table Stats Tab */}
            <TabsContent value="tables">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Table Access Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Table</th>
                          <th className="text-right p-2">Seq Scans</th>
                          <th className="text-right p-2">Index Scans</th>
                          <th className="text-right p-2">Performance</th>
                          <th className="text-right p-2">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableStats.map((stat, index) => {
                          const perf = getPerformanceStatus(stat.seqScans, stat.indexScans);
                          return (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{stat.tableName}</td>
                              <td className="p-2 text-right">{stat.seqScans.toLocaleString()}</td>
                              <td className="p-2 text-right">{stat.indexScans.toLocaleString()}</td>
                              <td className="p-2 text-right">
                                <Badge variant={perf.color as any}>
                                  {perf.status}
                                </Badge>
                              </td>
                              <td className="p-2 text-right text-muted-foreground">{stat.size}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Slow Queries Tab */}
            <TabsContent value="queries">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Slow Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {slowQueries.length > 0 ? (
                      slowQueries.map((query, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex space-x-4 text-sm text-muted-foreground">
                              <span>Calls: {query.calls}</span>
                              <span>Mean Time: {query.meanTime.toFixed(2)}ms</span>
                              <span>Total Time: {query.totalTime.toFixed(2)}ms</span>
                              <span>Rows: {query.rows}</span>
                            </div>
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {query.query}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No slow queries found or pg_stat_statements extension not available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Unused Indexes Tab */}
            <TabsContent value="unused">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Unused Indexes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Table</th>
                          <th className="text-left p-2">Index</th>
                          <th className="text-right p-2">Size</th>
                          <th className="text-center p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unusedIndexes.length > 0 ? (
                          unusedIndexes.map((index, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{index.tableName}</td>
                              <td className="p-2 text-muted-foreground">{index.indexName}</td>
                              <td className="p-2 text-right text-muted-foreground">{index.size}</td>
                              <td className="p-2 text-center">
                                <Button size="sm" variant="destructive">
                                  Drop
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No unused indexes found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Query Analyzer Tab */}
            <TabsContent value="analyzer">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2" />
                    Query Performance Analyzer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Enter SQL Query to Analyze
                      </label>
                      <textarea
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder="SELECT * FROM Product WHERE categoryId = 'xxx' AND isActive = true;"
                        className="w-full h-32 p-3 border rounded-md font-mono text-sm"
                      />
                    </div>
                    <Button onClick={handleAnalyzeQuery} disabled={!customQuery.trim()}>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze Query
                    </Button>

                    {queryAnalysis && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Query Analysis Results:</h4>
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                          {JSON.stringify(queryAnalysis, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bundle Analysis Tab */}
            <TabsContent value="bundle">
              <BundleAnalyzer />
            </TabsContent>

            {/* Bundle Optimization Tab */}
            <TabsContent value="optimization">
              <BundleOptimizationDashboard />
            </TabsContent>
          </Tabs>
        </FadeIn>
      </StaggerContainer>
    </div>
  );
};

export default DatabaseMonitoring;
