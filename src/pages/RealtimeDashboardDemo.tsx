import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Play,
  Pause,
  Settings,
  HelpCircle,
  Smartphone,
  Monitor,
  Zap,
  BarChart3,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Bell,
  Activity,
  Building2,
  TestTube,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WebSocketDateRangePicker, DateRange } from '@/components/ui/WebSocketDateRangePicker';
import { RealtimeMetricsDashboard } from '@/components/dashboard/RealtimeMetricsDashboard';
import { MobileOptimizedDashboard } from '@/components/dashboard/MobileOptimizedDashboard';
import { AdminRealtimeDashboard } from '@/components/admin/AdminRealtimeDashboard';
import { UserHelpSystem } from '@/components/help/UserHelpSystem';
import { getRealtimeMetricsService } from '@/services/realtimeMetricsService';
import { getSmartWebSocketService } from '@/services/smartWebSocketService';
import { getRealtimeTestingFramework } from '@/utils/realtimeTestingUtils';

interface RealtimeDashboardDemoProps {
  className?: string;
}

export const RealtimeDashboardDemo: React.FC<RealtimeDashboardDemoProps> = ({
  className
}) => {
  const [currentDemo, setCurrentDemo] = useState('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStats, setDemoStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    insightsGenerated: 0,
    metricsUpdated: 0
  });

  const realtimeService = getRealtimeMetricsService();
  const smartWsService = getSmartWebSocketService();
  const testingFramework = getRealtimeTestingFramework();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Monitor connection status
  useEffect(() => {
    const unsubscribe = smartWsService.subscribe((state) => {
      setIsConnected(state.connectionStatus.isConnected);
      setIsConnecting(state.connectionStatus.isConnecting);
      setDemoStats({
        messagesSent: state.stats.messagesSent,
        messagesReceived: state.stats.messagesReceived,
        insightsGenerated: realtimeService.getState().insights.length,
        metricsUpdated: realtimeService.getState().metrics.size
      });
    });

    return unsubscribe;
  }, [smartWsService, realtimeService]);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    console.log('Date range changed:', newRange);
  };

  const handleComparisonPeriodChange = (period: any) => {
    setComparisonPeriod(period);
    console.log('Comparison period changed:', period);
  };

  const startDemo = () => {
    setIsDemoRunning(true);
    
    // Start real-time services
    realtimeService.startStreaming('revenue');
    realtimeService.startStreaming('orders');
    realtimeService.startStreaming('products');
    realtimeService.startInsightsStreaming();
    
    // Generate initial mock data
    realtimeService.generateMockData('revenue', 10);
    realtimeService.generateMockData('orders', 10);
    realtimeService.generateMockData('products', 10);
    realtimeService.generateMockInsights(5);
    
    // Start periodic data generation
    const interval = setInterval(() => {
      if (isDemoRunning) {
        realtimeService.generateMockData('revenue', 1);
        realtimeService.generateMockData('orders', 1);
        realtimeService.generateMockInsights(1);
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const stopDemo = () => {
    setIsDemoRunning(false);
    realtimeService.stopStreaming('revenue');
    realtimeService.stopStreaming('orders');
    realtimeService.stopStreaming('products');
    realtimeService.stopInsightsStreaming();
  };

  const runTests = async () => {
    const scenarios = testingFramework.getPredefinedScenarios();
    const results = await testingFramework.runTestSuite({
      id: 'demo-test-suite',
      name: 'Demo Test Suite',
      description: 'Comprehensive test of all real-time features',
      scenarios: scenarios.slice(0, 3), // Run first 3 scenarios
      parallel: false,
      timeout: 30000
    });
    
    console.log('Test results:', results);
    alert(`Tests completed! Check console for results.`);
  };

  const getConnectionStatus = () => {
    if (isConnecting) return { status: 'connecting', icon: RefreshCw, text: 'Connecting...', color: 'text-yellow-500' };
    if (isConnected) return { status: 'connected', icon: Wifi, text: 'Live', color: 'text-green-500' };
    return { status: 'disconnected', icon: WifiOff, text: 'Offline', color: 'text-red-500' };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  const demoSections = [
    {
      id: 'overview',
      name: 'Overview',
      description: 'Dashboard overview and key features',
      icon: BarChart3,
      color: 'text-blue-600'
    },
    {
      id: 'websocket-date-picker',
      name: 'WebSocket Date Picker',
      description: 'Real-time date range selection with live updates',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      id: 'realtime-metrics',
      name: 'Real-time Metrics',
      description: 'Live metrics streaming and monitoring',
      icon: Activity,
      color: 'text-purple-600'
    },
    {
      id: 'mobile-optimized',
      name: 'Mobile Optimized',
      description: 'Touch-friendly mobile dashboard with accessibility',
      icon: Smartphone,
      color: 'text-orange-600'
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      description: 'Multi-shop monitoring and system health',
      icon: Building2,
      color: 'text-red-600'
    },
    {
      id: 'testing-framework',
      name: 'Testing Framework',
      description: 'Comprehensive testing for real-time features',
      icon: TestTube,
      color: 'text-yellow-600'
    },
    {
      id: 'help-system',
      name: 'Help System',
      description: 'User-friendly documentation and support',
      icon: BookOpen,
      color: 'text-indigo-600'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Real-time Dashboard Demo</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Experience the power of real-time data, WebSocket integration, mobile optimization, 
          and AI-powered insights in a comprehensive dashboard solution.
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StatusIcon className={cn("h-5 w-5", connectionStatus.color, isConnecting && "animate-spin")} />
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn("text-2xl font-bold", connectionStatus.color)}>
                {connectionStatus.text}
              </div>
              <div className="text-xs text-muted-foreground">WebSocket Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{demoStats.messagesSent}</div>
              <div className="text-xs text-muted-foreground">Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoStats.messagesReceived}</div>
              <div className="text-xs text-muted-foreground">Messages Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{demoStats.insightsGenerated}</div>
              <div className="text-xs text-muted-foreground">Insights Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
          <CardDescription>
            Start or stop the real-time demo to see live data updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={isDemoRunning ? stopDemo : startDemo}
              variant={isDemoRunning ? "destructive" : "default"}
              size="lg"
              className="flex items-center space-x-2"
            >
              {isDemoRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Stop Demo</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Demo</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={runTests}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4" />
              <span>Run Tests</span>
            </Button>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The demo generates mock data to simulate real-time updates. 
              In production, this would connect to your actual data sources.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoSections.slice(1).map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className={cn("h-5 w-5", section.color)} />
                  <span>{section.name}</span>
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setCurrentDemo(section.id)}
                >
                  View Demo
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderWebSocketDatePicker = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">WebSocket Date Range Picker</h2>
        <p className="text-muted-foreground">
          Real-time date range selection with live updates, comparison periods, and WebSocket integration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Date Range Picker</CardTitle>
          <CardDescription>
            Select date ranges and see real-time updates with comparison periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WebSocketDateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onComparisonPeriodChange={handleComparisonPeriodChange}
            showComparisonOptions={true}
            enableRealTimeUpdates={true}
            showConnectionStatus={true}
            className="w-full"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <div><strong>From:</strong> {dateRange.from.toLocaleDateString()}</div>
                  <div><strong>To:</strong> {dateRange.to.toLocaleDateString()}</div>
                  <div><strong>Duration:</strong> {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days</div>
                </div>
              </CardContent>
            </Card>
            
            {comparisonPeriod && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Comparison Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div><strong>Type:</strong> {comparisonPeriod.type}</div>
                    <div><strong>From:</strong> {comparisonPeriod.from.toLocaleDateString()}</div>
                    <div><strong>To:</strong> {comparisonPeriod.to.toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRealtimeMetrics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Real-time Metrics Dashboard</h2>
        <p className="text-muted-foreground">
          Live metrics streaming with WebSocket integration, smart batching, and real-time insights.
        </p>
      </div>

      <RealtimeMetricsDashboard
        showInsights={true}
        showControls={true}
        autoRefresh={true}
        refreshInterval={5000}
      />
    </div>
  );

  const renderMobileOptimized = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mobile Optimized Dashboard</h2>
        <p className="text-muted-foreground">
          Touch-friendly interface with accessibility features, swipe gestures, and voice announcements.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This demo shows the mobile-optimized version. Try resizing your browser window or 
          using mobile device simulation in developer tools to see the mobile experience.
        </AlertDescription>
      </Alert>

      <MobileOptimizedDashboard
        enableSwipeGestures={true}
        enableVoiceAnnouncements={true}
        enableHighContrast={false}
        enableKeyboardNavigation={true}
        enableScreenReader={true}
      />
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Real-time Dashboard</h2>
        <p className="text-muted-foreground">
          Multi-shop monitoring, system health tracking, and franchise management with real-time updates.
        </p>
      </div>

      <AdminRealtimeDashboard
        enableMultiShopView={true}
        enableSystemMonitoring={true}
        enableFranchiseMetrics={true}
        refreshInterval={5000}
      />
    </div>
  );

  const renderTestingFramework = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Real-time Testing Framework</h2>
        <p className="text-muted-foreground">
          Comprehensive testing suite for WebSocket connections, real-time features, and performance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Test Scenarios</CardTitle>
          <CardDescription>
            Run automated tests to verify real-time functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testingFramework.getPredefinedScenarios().map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{scenario.name}</CardTitle>
                  <CardDescription className="text-xs">{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {scenario.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {scenario.duration / 1000}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button onClick={runTests} className="w-full">
            <TestTube className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderHelpSystem = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">User Help System</h2>
        <p className="text-muted-foreground">
          Comprehensive help system with documentation, tutorials, FAQs, and support options.
        </p>
      </div>

      <UserHelpSystem
        showSearch={true}
        showCategories={true}
        showTutorials={true}
        showFAQ={true}
        showContact={true}
      />
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Real-time Dashboard Demo</h1>
            <Badge variant="outline" className="flex items-center space-x-1">
              <StatusIcon className={cn("h-3 w-3", connectionStatus.color, isConnecting && "animate-spin")} />
              <span>{connectionStatus.text}</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDemo('overview')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDemo('help-system')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {currentDemo === 'overview' && renderOverview()}
        {currentDemo === 'websocket-date-picker' && renderWebSocketDatePicker()}
        {currentDemo === 'realtime-metrics' && renderRealtimeMetrics()}
        {currentDemo === 'mobile-optimized' && renderMobileOptimized()}
        {currentDemo === 'admin-dashboard' && renderAdminDashboard()}
        {currentDemo === 'testing-framework' && renderTestingFramework()}
        {currentDemo === 'help-system' && renderHelpSystem()}
      </div>
    </div>
  );
};
