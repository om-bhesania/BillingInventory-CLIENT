import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  Activity,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getBundleInfo, lazyLoadingMetrics } from '@/utils/lazyLoading';
import { FadeIn } from '@/components/ui/animations/FadeIn';

interface BundleInfo {
  navigation: {
    domContentLoaded: number;
    loadComplete: number;
    total: number;
  };
  resources: {
    js: number;
    css: number;
    total: number;
  };
  lazyLoading: {
    loadTimes: Record<string, number>;
    errors: Record<string, number>;
  };
}

const BundleAnalyzer: React.FC = () => {
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeBundle = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const info = getBundleInfo();
      setBundleInfo(info);
      setIsAnalyzing(false);
    }, 1000);
  };

  useEffect(() => {
    analyzeBundle();
  }, []);

  const downloadReport = () => {
    if (!bundleInfo) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      bundleInfo,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bundle-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPerformanceScore = (loadTime: number) => {
    if (loadTime < 1000) return { score: 'Excellent', color: 'green' };
    if (loadTime < 2000) return { score: 'Good', color: 'blue' };
    if (loadTime < 3000) return { score: 'Fair', color: 'yellow' };
    return { score: 'Poor', color: 'red' };
  };

  if (!bundleInfo) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No bundle information available</p>
        </CardContent>
      </Card>
    );
  }

  const { navigation, resources, lazyLoading } = bundleInfo;
  const domScore = getPerformanceScore(navigation.domContentLoaded);
  const loadScore = getPerformanceScore(navigation.loadComplete);

  return (
    <div className="space-y-6">
      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Bundle Performance Analysis
              </div>
              <div className="flex space-x-2">
                <Button onClick={analyzeBundle} disabled={isAnalyzing} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={downloadReport} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Navigation Timing */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Navigation Timing
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">DOM Content Loaded</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">{navigation.domContentLoaded.toFixed(0)}ms</span>
                      <Badge variant={domScore.color as any}>{domScore.score}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Load Complete</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">{navigation.loadComplete.toFixed(0)}ms</span>
                      <Badge variant={loadScore.color as any}>{loadScore.score}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Load Time</span>
                    <span className="text-sm font-mono">{navigation.total.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>

              {/* Resource Count */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Resources
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">JavaScript Files</span>
                    <Badge variant="outline">{resources.js}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">CSS Files</span>
                    <Badge variant="outline">{resources.css}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Resources</span>
                    <Badge variant="outline">{resources.total}</Badge>
                  </div>
                </div>
              </div>

              {/* Lazy Loading Stats */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Lazy Loading
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Components Loaded</span>
                    <Badge variant="outline">{Object.keys(lazyLoading.loadTimes).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Load Errors</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{Object.keys(lazyLoading.errors).length}</span>
                      {Object.keys(lazyLoading.errors).length > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Component Load Times */}
      {Object.keys(lazyLoading.loadTimes).length > 0 && (
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Component Load Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(lazyLoading.loadTimes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([component, loadTime]) => {
                    const score = getPerformanceScore(loadTime);
                    return (
                      <div key={component} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm font-mono">{component}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono">{loadTime.toFixed(0)}ms</span>
                          <Badge variant={score.color as any}>{score.score}</Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Load Errors */}
      {Object.keys(lazyLoading.errors).length > 0 && (
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Load Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(lazyLoading.errors).map(([component, errorCount]) => (
                  <div key={component} className="flex justify-between items-center p-2 border border-red-200 rounded bg-red-50">
                    <span className="text-sm font-mono">{component}</span>
                    <Badge variant="destructive">{errorCount} errors</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
};

export default BundleAnalyzer;
