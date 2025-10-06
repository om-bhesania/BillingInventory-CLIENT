import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Download,
  RefreshCw,
  Zap,
  FileText,
  Image,
  Type,
  Code
} from 'lucide-react';
import { BundleOptimizer, BundleMetrics, ChunkInfo } from '@/utils/bundleOptimizer';
import { FadeIn } from '@/components/ui/animations/FadeIn';
import { StaggerContainer } from '@/components/ui/animations/StaggerContainer';

const BundleOptimizationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BundleMetrics | null>(null);
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [performance, setPerformance] = useState<{ score: number; grade: string; color: string } | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeBundle = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const bundleMetrics = BundleOptimizer.analyzeBundle();
      const bundleChunks = BundleOptimizer.analyzeChunks();
      const bundleRecommendations = BundleOptimizer.getOptimizationRecommendations();
      const bundlePerformance = BundleOptimizer.getPerformanceScore();
      const bundleBreakdown = BundleOptimizer.getBundleBreakdown();

      setMetrics(bundleMetrics);
      setChunks(bundleChunks);
      setRecommendations(bundleRecommendations);
      setPerformance(bundlePerformance);
      setBreakdown(bundleBreakdown);
      setIsAnalyzing(false);
    }, 1000);
  };

  useEffect(() => {
    analyzeBundle();
  }, []);

  const downloadReport = () => {
    const report = BundleOptimizer.getOptimizationReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bundle-optimization-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSizeColor = (size: number, threshold: number) => {
    if (size > threshold * 1.5) return 'text-red-600';
    if (size > threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <StaggerContainer>
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <Package className="h-6 w-6 mr-2" />
                Bundle Optimization Dashboard
              </h2>
              <p className="text-muted-foreground">
                Monitor and optimize your application bundle performance
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={analyzeBundle} disabled={isAnalyzing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={downloadReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Performance Overview */}
        {performance && (
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getPerformanceColor(performance.score)}`}>
                      {performance.score}
                    </div>
                    <div className="text-sm text-muted-foreground">Performance Score</div>
                    <Badge variant={performance.color as any} className="mt-2">
                      {performance.grade}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {BundleOptimizer.formatBytes(metrics?.totalSize || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Bundle Size</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {metrics?.chunkCount || 0} chunks
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {(metrics?.loadTime || 0).toFixed(0)}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Load Time</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {metrics?.compressionRatio ? `${(metrics.compressionRatio * 100).toFixed(1)}% compressed` : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Bundle Breakdown */}
        {breakdown && (
          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Bundle Size Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(breakdown.breakdown).map(([type, data]: [string, any]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {type === 'javascript' && <Code className="h-4 w-4" />}
                          {type === 'css' && <FileText className="h-4 w-4" />}
                          {type === 'images' && <Image className="h-4 w-4" />}
                          {type === 'fonts' && <Type className="h-4 w-4" />}
                          {type === 'other' && <Package className="h-4 w-4" />}
                          <span className="font-medium capitalize">{type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-mono ${getSizeColor(data.size, 500 * 1024)}`}>
                            {BundleOptimizer.formatBytes(data.size)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({data.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={data.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* Main Content Tabs */}
        <FadeIn delay={0.3}>
          <Tabs defaultValue="chunks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chunks">Chunk Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="optimization">Optimization Tips</TabsTrigger>
            </TabsList>

            {/* Chunk Analysis Tab */}
            <TabsContent value="chunks">
              <Card>
                <CardHeader>
                  <CardTitle>Chunk Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chunks.slice(0, 10).map((chunk, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{chunk.name}</span>
                            {chunk.isVendor && <Badge variant="outline">Vendor</Badge>}
                            {chunk.isLazy && <Badge variant="secondary">Lazy</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {chunk.modules.length} modules
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-mono">
                              {BundleOptimizer.formatBytes(chunk.size)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              gzip: {BundleOptimizer.formatBytes(chunk.gzipSize)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono">
                              {BundleOptimizer.formatBytes(chunk.brotliSize)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              brotli
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Optimization Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.length > 0 ? (
                      recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{recommendation}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p className="text-muted-foreground">No optimization recommendations at this time.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Optimization Tips Tab */}
            <TabsContent value="optimization">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Code Splitting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Route-based splitting:</strong> Split by pages/routes
                    </div>
                    <div className="text-sm">
                      <strong>Component splitting:</strong> Split large components
                    </div>
                    <div className="text-sm">
                      <strong>Vendor splitting:</strong> Separate vendor libraries
                    </div>
                    <div className="text-sm">
                      <strong>Lazy loading:</strong> Load components on demand
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Bundle Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Tree shaking:</strong> Remove unused code
                    </div>
                    <div className="text-sm">
                      <strong>Minification:</strong> Compress JavaScript/CSS
                    </div>
                    <div className="text-sm">
                      <strong>Compression:</strong> Enable gzip/brotli
                    </div>
                    <div className="text-sm">
                      <strong>Asset optimization:</strong> Optimize images/fonts
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Preloading:</strong> Preload critical resources
                    </div>
                    <div className="text-sm">
                      <strong>Caching:</strong> Implement proper caching
                    </div>
                    <div className="text-sm">
                      <strong>CDN:</strong> Use CDN for static assets
                    </div>
                    <div className="text-sm">
                      <strong>Monitoring:</strong> Track performance metrics
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <strong>Import optimization:</strong> Use specific imports
                    </div>
                    <div className="text-sm">
                      <strong>Dependency analysis:</strong> Remove unused deps
                    </div>
                    <div className="text-sm">
                      <strong>Bundle analysis:</strong> Regular bundle audits
                    </div>
                    <div className="text-sm">
                      <strong>Performance budgets:</strong> Set size limits
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </StaggerContainer>
    </div>
  );
};

export default BundleOptimizationDashboard;
