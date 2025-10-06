// Bundle optimization utilities
import { lazyLoadingMetrics } from './lazyLoading';

export interface BundleMetrics {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  fontSize: number;
  chunkCount: number;
  loadTime: number;
  compressionRatio: number;
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  modules: string[];
  isVendor: boolean;
  isLazy: boolean;
}

export class BundleOptimizer {
  private static metrics: BundleMetrics | null = null;
  private static chunks: ChunkInfo[] = [];

  /**
   * Analyze current bundle performance
   */
  static analyzeBundle(): BundleMetrics {
    if (typeof window === 'undefined') {
      return this.getDefaultMetrics();
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let fontSize = 0;
    let chunkCount = 0;

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      totalSize += size;

      if (resource.name.endsWith('.js')) {
        jsSize += size;
        chunkCount++;
      } else if (resource.name.endsWith('.css')) {
        cssSize += size;
      } else if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(resource.name)) {
        imageSize += size;
      } else if (/\.(woff2?|eot|ttf|otf)$/i.test(resource.name)) {
        fontSize += size;
      }
    });

    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const compressionRatio = totalSize > 0 ? (totalSize - (jsSize + cssSize)) / totalSize : 0;

    this.metrics = {
      totalSize,
      jsSize,
      cssSize,
      imageSize,
      fontSize,
      chunkCount,
      loadTime,
      compressionRatio,
    };

    return this.metrics;
  }

  /**
   * Get bundle optimization recommendations
   */
  static getOptimizationRecommendations(): string[] {
    const metrics = this.analyzeBundle();
    const recommendations: string[] = [];

    // Bundle size recommendations
    if (metrics.totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push('Bundle size is large (>2MB). Consider code splitting and tree shaking.');
    }

    if (metrics.jsSize > 1.5 * 1024 * 1024) { // 1.5MB
      recommendations.push('JavaScript bundle is large (>1.5MB). Consider lazy loading and vendor splitting.');
    }

    if (metrics.cssSize > 200 * 1024) { // 200KB
      recommendations.push('CSS bundle is large (>200KB). Consider CSS optimization and purging unused styles.');
    }

    if (metrics.imageSize > 500 * 1024) { // 500KB
      recommendations.push('Images are large (>500KB). Consider image optimization and WebP format.');
    }

    // Chunk count recommendations
    if (metrics.chunkCount > 50) {
      recommendations.push('Too many chunks (>50). Consider consolidating smaller chunks.');
    } else if (metrics.chunkCount < 5) {
      recommendations.push('Too few chunks (<5). Consider splitting large bundles for better caching.');
    }

    // Load time recommendations
    if (metrics.loadTime > 3000) {
      recommendations.push('Load time is slow (>3s). Consider preloading critical resources.');
    }

    // Compression recommendations
    if (metrics.compressionRatio < 0.3) {
      recommendations.push('Low compression ratio (<30%). Enable gzip/brotli compression.');
    }

    // Lazy loading recommendations
    const lazyMetrics = lazyLoadingMetrics.getMetrics();
    if (Object.keys(lazyMetrics.loadTimes).length === 0) {
      recommendations.push('No lazy loading detected. Consider implementing code splitting.');
    }

    if (Object.keys(lazyMetrics.errors).length > 0) {
      recommendations.push('Lazy loading errors detected. Check network connectivity and chunk loading.');
    }

    return recommendations;
  }

  /**
   * Get performance score
   */
  static getPerformanceScore(): { score: number; grade: string; color: string } {
    const metrics = this.analyzeBundle();
    let score = 100;

    // Deduct points for large bundle size
    if (metrics.totalSize > 2 * 1024 * 1024) score -= 20;
    else if (metrics.totalSize > 1 * 1024 * 1024) score -= 10;

    // Deduct points for slow load time
    if (metrics.loadTime > 5000) score -= 25;
    else if (metrics.loadTime > 3000) score -= 15;
    else if (metrics.loadTime > 2000) score -= 10;

    // Deduct points for too many chunks
    if (metrics.chunkCount > 50) score -= 15;
    else if (metrics.chunkCount > 30) score -= 10;

    // Deduct points for low compression
    if (metrics.compressionRatio < 0.2) score -= 10;

    // Deduct points for lazy loading errors
    const lazyMetrics = lazyLoadingMetrics.getMetrics();
    if (Object.keys(lazyMetrics.errors).length > 0) score -= 15;

    score = Math.max(0, score);

    let grade: string;
    let color: string;

    if (score >= 90) {
      grade = 'Excellent';
      color = 'green';
    } else if (score >= 80) {
      grade = 'Good';
      color = 'blue';
    } else if (score >= 70) {
      grade = 'Fair';
      color = 'yellow';
    } else if (score >= 60) {
      grade = 'Poor';
      color = 'orange';
    } else {
      grade = 'Critical';
      color = 'red';
    }

    return { score, grade, color };
  }

  /**
   * Get chunk analysis
   */
  static analyzeChunks(): ChunkInfo[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const chunks: ChunkInfo[] = [];

    resources.forEach(resource => {
      if (resource.name.endsWith('.js')) {
        const size = resource.transferSize || 0;
        const name = resource.name.split('/').pop() || 'unknown';
        
        chunks.push({
          name,
          size,
          gzipSize: size * 0.3, // Estimate gzip size
          brotliSize: size * 0.2, // Estimate brotli size
          modules: [], // Would need source map analysis
          isVendor: name.includes('vendor') || name.includes('chunk'),
          isLazy: name.includes('lazy') || name.includes('async'),
        });
      }
    });

    this.chunks = chunks.sort((a, b) => b.size - a.size);
    return this.chunks;
  }

  /**
   * Get optimization suggestions for specific chunks
   */
  static getChunkOptimizationSuggestions(chunkName: string): string[] {
    const chunk = this.chunks.find(c => c.name === chunkName);
    if (!chunk) return [];

    const suggestions: string[] = [];

    if (chunk.size > 500 * 1024) { // 500KB
      suggestions.push('Chunk is large (>500KB). Consider splitting into smaller chunks.');
    }

    if (chunk.isVendor && chunk.size > 200 * 1024) { // 200KB
      suggestions.push('Vendor chunk is large. Consider splitting vendor libraries.');
    }

    if (!chunk.isLazy && chunk.size > 100 * 1024) { // 100KB
      suggestions.push('Non-lazy chunk is large. Consider lazy loading this chunk.');
    }

    if (chunk.gzipSize / chunk.size > 0.5) {
      suggestions.push('Low compression ratio. Check for uncompressible content.');
    }

    return suggestions;
  }

  /**
   * Get bundle size breakdown
   */
  static getBundleBreakdown() {
    const metrics = this.analyzeBundle();
    
    return {
      total: metrics.totalSize,
      breakdown: {
        javascript: {
          size: metrics.jsSize,
          percentage: (metrics.jsSize / metrics.totalSize) * 100,
        },
        css: {
          size: metrics.cssSize,
          percentage: (metrics.cssSize / metrics.totalSize) * 100,
        },
        images: {
          size: metrics.imageSize,
          percentage: (metrics.imageSize / metrics.totalSize) * 100,
        },
        fonts: {
          size: metrics.fontSize,
          percentage: (metrics.fontSize / metrics.totalSize) * 100,
        },
        other: {
          size: metrics.totalSize - metrics.jsSize - metrics.cssSize - metrics.imageSize - metrics.fontSize,
          percentage: ((metrics.totalSize - metrics.jsSize - metrics.cssSize - metrics.imageSize - metrics.fontSize) / metrics.totalSize) * 100,
        },
      },
    };
  }

  /**
   * Get default metrics for SSR
   */
  private static getDefaultMetrics(): BundleMetrics {
    return {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      fontSize: 0,
      chunkCount: 0,
      loadTime: 0,
      compressionRatio: 0,
    };
  }

  /**
   * Format bytes to human readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get bundle optimization report
   */
  static getOptimizationReport() {
    const metrics = this.analyzeBundle();
    const performance = this.getPerformanceScore();
    const recommendations = this.getOptimizationRecommendations();
    const chunks = this.analyzeChunks();
    const breakdown = this.getBundleBreakdown();

    return {
      timestamp: new Date().toISOString(),
      metrics,
      performance,
      recommendations,
      chunks: chunks.slice(0, 10), // Top 10 largest chunks
      breakdown,
      lazyLoading: lazyLoadingMetrics.getMetrics(),
    };
  }
}

export default BundleOptimizer;
