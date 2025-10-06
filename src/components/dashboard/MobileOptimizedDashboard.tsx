import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Menu, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Bell,
  Activity,
  SwipeUp,
  SwipeDown,
  Touch,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Keyboard,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getRealtimeMetricsService, RealtimeMetric, LiveInsight } from '@/services/realtimeMetricsService';
import { format } from 'date-fns';

interface MobileOptimizedDashboardProps {
  className?: string;
  enableSwipeGestures?: boolean;
  enableVoiceAnnouncements?: boolean;
  enableHighContrast?: boolean;
  enableKeyboardNavigation?: boolean;
  enableScreenReader?: boolean;
}

const metricIcons = {
  revenue: DollarSign,
  orders: ShoppingCart,
  products: Package,
  customers: Users,
  inventory: BarChart3,
  restock: RefreshCw,
  notifications: Bell
};

const metricColors = {
  revenue: 'text-green-600',
  orders: 'text-blue-600',
  products: 'text-purple-600',
  customers: 'text-orange-600',
  inventory: 'text-indigo-600',
  restock: 'text-yellow-600',
  notifications: 'text-red-600'
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-600'
};

export const MobileOptimizedDashboard: React.FC<MobileOptimizedDashboardProps> = ({
  className,
  enableSwipeGestures = true,
  enableVoiceAnnouncements = true,
  enableHighContrast = false,
  enableKeyboardNavigation = true,
  enableScreenReader = true
}) => {
  const [isMobile] = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(enableVoiceAnnouncements);
  const [highContrast, setHighContrast] = useState(enableHighContrast);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(enableScreenReader);
  const [keyboardNavEnabled, setKeyboardNavEnabled] = useState(enableKeyboardNavigation);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [state, setState] = useState(getRealtimeMetricsService().getState());

  const realtimeService = getRealtimeMetricsService();

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(setState);
    return unsubscribe;
  }, [realtimeService]);

  // Voice announcements for important updates
  useEffect(() => {
    if (!voiceEnabled || !isMobile) return;

    const speak = (text: string) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    };

    // Announce high-priority insights
    const highPriorityInsights = state.insights.filter(insight => insight.impact === 'high');
    if (highPriorityInsights.length > 0) {
      const latestInsight = highPriorityInsights[0];
      speak(`Alert: ${latestInsight.title}. ${latestInsight.description}`);
    }
  }, [state.insights, voiceEnabled, isMobile]);

  // Swipe gesture handling
  useEffect(() => {
    if (!enableSwipeGestures || !isMobile) return;

    let startY = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endY = e.changedTouches[0].clientY;
      const diff = startY - endY;
      
      if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0) {
          setSwipeDirection('up');
          // Navigate to next tab
          const tabs = ['overview', 'metrics', 'insights', 'settings'];
          const currentIndex = tabs.indexOf(currentTab);
          const nextIndex = (currentIndex + 1) % tabs.length;
          setCurrentTab(tabs[nextIndex]);
        } else {
          setSwipeDirection('down');
          // Navigate to previous tab
          const tabs = ['overview', 'metrics', 'insights', 'settings'];
          const currentIndex = tabs.indexOf(currentTab);
          const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
          setCurrentTab(tabs[prevIndex]);
        }
        
        // Reset swipe direction after animation
        setTimeout(() => setSwipeDirection(null), 300);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableSwipeGestures, isMobile, currentTab]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNavEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Handle tab navigation
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
        
        if (e.shiftKey) {
          // Shift + Tab (backward)
          const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          (focusableElements[prevIndex] as HTMLElement)?.focus();
        } else {
          // Tab (forward)
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          (focusableElements[nextIndex] as HTMLElement)?.focus();
        }
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Handle enter/space on focused elements
        const focused = document.activeElement as HTMLElement;
        if (focused && (focused.tagName === 'BUTTON' || focused.getAttribute('role') === 'button')) {
          focused.click();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavEnabled]);

  // High contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab);
    setIsMenuOpen(false);
    
    // Announce tab change for screen readers
    if (screenReaderEnabled) {
      const announcement = `Switched to ${tab} tab`;
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(announcement);
        speechSynthesis.speak(utterance);
      }
    }
  }, [screenReaderEnabled]);

  const renderMetricCard = (metric: RealtimeMetric, index: number) => {
    const Icon = metricIcons[metric.type] || Activity;
    const TrendIcon = trendIcons[metric.trend];
    const colorClass = metricColors[metric.type] || 'text-gray-600';
    const trendColorClass = trendColors[metric.trend];

    return (
      <Card 
        key={metric.id} 
        className={cn(
          "relative touch-manipulation",
          highContrast && "border-2 border-black",
          focusedElement === `metric-${index}` && "ring-2 ring-blue-500"
        )}
        tabIndex={0}
        onFocus={() => setFocusedElement(`metric-${index}`)}
        onBlur={() => setFocusedElement(null)}
        role="button"
        aria-label={`${metric.type} metric: ${metric.value}, ${metric.trend} trend, ${metric.growth}% change`}
        onClick={() => {
          // Announce metric details
          if (screenReaderEnabled) {
            const announcement = `${metric.type}: ${metric.value}, ${metric.trend} trend, ${metric.growth}% change`;
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(announcement);
              speechSynthesis.speak(utterance);
            }
          }
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Icon className={cn("h-4 w-4", colorClass)} />
            <span className="capitalize">{metric.type}</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <TrendIcon className={cn("h-4 w-4", trendColorClass)} />
            <Badge variant="outline" className="text-xs">
              {metric.confidence}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>vs {metric.previousValue.toLocaleString()}</span>
            <span className={cn("font-medium", trendColorClass)}>
              {metric.growth > 0 ? '+' : ''}{metric.growth.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {format(metric.timestamp, 'HH:mm:ss')}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsightCard = (insight: LiveInsight, index: number) => {
    const impactColor = insight.impact === 'high' ? 'bg-red-100 text-red-800' : 
                       insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                       'bg-blue-100 text-blue-800';
    
    return (
      <Card 
        key={insight.id} 
        className={cn(
          "border-l-4 touch-manipulation",
          impactColor,
          highContrast && "border-2 border-black",
          focusedElement === `insight-${index}` && "ring-2 ring-blue-500"
        )}
        tabIndex={0}
        onFocus={() => setFocusedElement(`insight-${index}`)}
        onBlur={() => setFocusedElement(null)}
        role="button"
        aria-label={`${insight.title}: ${insight.description}`}
        onClick={() => {
          // Announce insight details
          if (screenReaderEnabled) {
            const announcement = `${insight.title}: ${insight.description}`;
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(announcement);
              speechSynthesis.speak(utterance);
            }
          }
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
            <Badge variant="outline" className={cn("text-xs", impactColor)}>
              {insight.impact}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {insight.category} • {format(insight.timestamp, 'HH:mm:ss')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
          {insight.actionable && insight.actionText && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs min-h-[44px] min-w-[44px]" // Touch-friendly size
              aria-label={insight.actionText}
            >
              {insight.actionText}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const getConnectionStatus = () => {
    if (state.isConnecting) return { status: 'connecting', icon: RefreshCw, text: 'Connecting...', color: 'text-yellow-500' };
    if (state.isConnected) return { status: 'connected', icon: Wifi, text: 'Live', color: 'text-green-500' };
    return { status: 'disconnected', icon: WifiOff, text: 'Offline', color: 'text-red-500' };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon;

  const latestMetrics = Array.from(state.metrics.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  const highPriorityInsights = state.insights
    .filter(insight => insight.impact === 'high' || insight.priority > 7)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  return (
    <div className={cn(
      "min-h-screen bg-background",
      highContrast && "high-contrast",
      className
    )}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold">Dashboard</h1>
            <div className="flex items-center space-x-1">
              <StatusIcon className={cn("h-4 w-4", connectionStatus.color, state.isConnecting && "animate-spin")} />
              <span className={cn("text-xs", connectionStatus.color)}>
                {connectionStatus.text}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Accessibility Menu */}
            <Sheet open={isAccessibilityMenuOpen} onOpenChange={setIsAccessibilityMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Accessibility Settings</SheetTitle>
                  <SheetDescription>
                    Customize your dashboard experience
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <span className="text-sm">Voice Announcements</span>
                    </div>
                    <Button
                      variant={voiceEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                    >
                      {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">High Contrast</span>
                    </div>
                    <Button
                      variant={highContrast ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHighContrast(!highContrast)}
                    >
                      {highContrast ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Keyboard className="h-4 w-4" />
                      <span className="text-sm">Keyboard Navigation</span>
                    </div>
                    <Button
                      variant={keyboardNavEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setKeyboardNavEnabled(!keyboardNavEnabled)}
                    >
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Touch className="h-4 w-4" />
                      <span className="text-sm">Screen Reader</span>
                    </div>
                    <Button
                      variant={screenReaderEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
                    >
                      {screenReaderEnabled ? <Touch className="h-4 w-4" /> : <Touch className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="min-h-[44px] min-w-[44px]">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>
                    Navigate through dashboard sections
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-2 mt-6">
                  {['overview', 'metrics', 'insights', 'settings'].map((tab) => (
                    <Button
                      key={tab}
                      variant={currentTab === tab ? "default" : "ghost"}
                      className="w-full justify-start min-h-[44px]"
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Swipe Indicator */}
      {enableSwipeGestures && isMobile && (
        <div className="flex justify-center py-2">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <SwipeUp className="h-3 w-3" />
            <span>Swipe to navigate</span>
            <SwipeDown className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
            <TabsTrigger value="metrics" className="min-h-[44px]">Metrics</TabsTrigger>
            <TabsTrigger value="insights" className="min-h-[44px]">Insights</TabsTrigger>
            <TabsTrigger value="settings" className="min-h-[44px]">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {latestMetrics.slice(0, 4).map((metric, index) => renderMetricCard(metric, index))}
            </div>
            {highPriorityInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Recent Insights</h3>
                {highPriorityInsights.slice(0, 2).map((insight, index) => renderInsightCard(insight, index))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {latestMetrics.map((metric, index) => renderMetricCard(metric, index))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-4">
              {highPriorityInsights.map((insight, index) => renderInsightCard(insight, index))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Settings</CardTitle>
                <CardDescription>
                  Customize your dashboard experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice Announcements</span>
                  <Button
                    variant={voiceEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                  >
                    {voiceEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Contrast Mode</span>
                  <Button
                    variant={highContrast ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHighContrast(!highContrast)}
                  >
                    {highContrast ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Keyboard Navigation</span>
                  <Button
                    variant={keyboardNavEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setKeyboardNavEnabled(!keyboardNavEnabled)}
                  >
                    {keyboardNavEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Screen Reader Support</span>
                  <Button
                    variant={screenReaderEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScreenReaderEnabled(!screenReaderEnabled)}
                  >
                    {screenReaderEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Swipe Animation */}
      {swipeDirection && (
        <div className={cn(
          "fixed inset-0 pointer-events-none z-50 flex items-center justify-center",
          swipeDirection === 'up' ? "animate-slide-up" : "animate-slide-down"
        )}>
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
            {swipeDirection === 'up' ? 'Next Tab' : 'Previous Tab'}
          </div>
        </div>
      )}
    </div>
  );
};
