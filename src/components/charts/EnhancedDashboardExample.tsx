import React, { useState } from 'react';
import { EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  BarChart3, 
  Settings,
  Lightbulb,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const EnhancedDashboardExample: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'Admin' | 'Shop_Owner'>('Shop_Owner');
  const [useMockData, setUseMockData] = useState(true);

  // Mock data for demonstration
  const mockMetrics = {
    // Admin metrics
    totalRevenue: {
      total: 2500000,
      count: 1250,
      growth: 18.5,
      previousPeriod: 2100000
    },
    totalShops: {
      total: 45,
      growth: 12.5,
      previousPeriod: 40
    },
    totalProducts: {
      total: 1200,
      previousPeriod: 1100
    },
    totalCategories: {
      total: 25,
      previousPeriod: 22
    },
    pendingRestockRequests: {
      count: 15,
      requests: [],
      previousPeriod: 12
    },
    shopPerformance: [
      {
        id: '1',
        name: 'Downtown Store',
        totalRevenue: 450000,
        orderCount: 225,
        previousRevenue: 380000,
        revenueGrowth: 18.4
      },
      {
        id: '2',
        name: 'Mall Location',
        totalRevenue: 380000,
        orderCount: 190,
        previousRevenue: 320000,
        revenueGrowth: 18.8
      },
      {
        id: '3',
        name: 'Suburban Branch',
        totalRevenue: 320000,
        orderCount: 160,
        previousRevenue: 280000,
        revenueGrowth: 14.3
      }
    ],
    systemNotifications: {
      count: 8,
      notifications: [],
      previousPeriod: 5
    },
    
    // Shop Owner metrics
    shopRevenue: {
      total: 450000,
      count: 225,
      growth: 18.4,
      previousPeriod: 380000
    },
    topSellingProducts: [
      {
        productId: '1',
        quantity: 1250,
        product: { name: 'Premium Coffee', category: { name: 'Beverages' }, flavor: { name: 'Arabica' }, price: 150 },
        previousQuantity: 1100,
        growth: 13.6
      },
      {
        productId: '2',
        quantity: 980,
        product: { name: 'Organic Tea', category: { name: 'Beverages' }, flavor: { name: 'Green' }, price: 120 },
        previousQuantity: 850,
        growth: 15.3
      },
      {
        productId: '3',
        quantity: 750,
        product: { name: 'Energy Bar', category: { name: 'Snacks' }, flavor: { name: 'Chocolate' }, price: 80 },
        previousQuantity: 680,
        growth: 10.3
      }
    ],
    currentStockLevels: {
      totalItems: 8500,
      lowStockItems: [
        {
          id: '1',
          currentStock: 15,
          minStockLevel: 50,
          stockDeficit: 35,
          urgency: 'critical',
          product: { name: 'Premium Coffee', category: { name: 'Beverages' }, flavor: { name: 'Arabica' } }
        },
        {
          id: '2',
          currentStock: 25,
          minStockLevel: 40,
          stockDeficit: 15,
          urgency: 'warning',
          product: { name: 'Organic Tea', category: { name: 'Beverages' }, flavor: { name: 'Green' } }
        }
      ],
      lowStockCount: 2,
      previousPeriod: 8200
    },
    shopNotifications: {
      count: 3,
      notifications: [],
      previousPeriod: 2
    },
    restockExpenses: {
      total: 85000,
      count: 45,
      previousPeriod: 72000,
      growth: 18.1
    },
    
    // Analytics data
    bestCategory: {
      name: 'Beverages',
      quantity: 2500,
      previousQuantity: 2200,
      growth: 13.6
    },
    bestFlavor: {
      name: 'Arabica',
      quantity: 1250,
      previousQuantity: 1100,
      growth: 13.6
    },
    categoryBreakdown: [
      { category: 'Beverages', quantity: 2500, previousQuantity: 2200, growth: 13.6 },
      { category: 'Snacks', quantity: 1800, previousQuantity: 1900, growth: -5.3 },
      { category: 'Dairy', quantity: 1200, previousQuantity: 1100, growth: 9.1 },
      { category: 'Fruits', quantity: 800, previousQuantity: 750, growth: 6.7 },
      { category: 'Vegetables', quantity: 700, previousQuantity: 650, growth: 7.7 }
    ],
    flavorBreakdown: [
      { flavor: 'Arabica', quantity: 1250, previousQuantity: 1100, growth: 13.6 },
      { flavor: 'Green Tea', quantity: 980, previousQuantity: 850, growth: 15.3 },
      { flavor: 'Chocolate', quantity: 750, previousQuantity: 680, growth: 10.3 },
      { flavor: 'Vanilla', quantity: 680, previousQuantity: 620, growth: 9.7 },
      { flavor: 'Strawberry', quantity: 520, previousQuantity: 480, growth: 8.3 }
    ],
    salesTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total: Math.floor(Math.random() * 20000) + 8000
    }))
  };

  const handleRoleSwitch = (role: 'Admin' | 'Shop_Owner') => {
    setCurrentRole(role);
  };

  const handleDataToggle = () => {
    setUseMockData(!useMockData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Enhanced Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Advanced business intelligence with role-based insights and anomaly detection
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dashboard Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Role:</span>
                <div className="flex border rounded-lg">
                  <Button
                    variant={currentRole === 'Shop_Owner' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleRoleSwitch('Shop_Owner')}
                    className="rounded-r-none"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Shop Owner
                  </Button>
                  <Button
                    variant={currentRole === 'Admin' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleRoleSwitch('Admin')}
                    className="rounded-l-none"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Data Source:</span>
                <Button
                  variant={useMockData ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleDataToggle}
                >
                  {useMockData ? 'Mock Data' : 'Real Data'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Enhanced Analytics
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  AI Insights
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Anomaly Detection
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart3 className="h-5 w-5" />
                Smart Date Ranges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 text-sm">
                Preset ranges with automatic previous period calculations for accurate comparisons
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TrendingUp className="h-5 w-5" />
                Role-Based Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 text-sm">
                Tailored analytics and recommendations based on user role and permissions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="h-5 w-5" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800 text-sm">
                Statistical analysis to identify unusual patterns and potential issues
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dashboard */}
        <EnhancedAnalyticsDashboard
          metrics={mockMetrics}
          role={currentRole}
          useMockData={useMockData}
        />

        {/* Usage Instructions */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Lightbulb className="h-5 w-5" />
              How to Use This Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-purple-800 mb-2">For Shop Owners:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Monitor daily sales and revenue trends</li>
                  <li>• Track inventory levels and restock needs</li>
                  <li>• Analyze product performance by category and flavor</li>
                  <li>• Get actionable insights for business optimization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 mb-2">For Admins:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Overview of all shop performances</li>
                  <li>• System-wide analytics and trends</li>
                  <li>• Identify high and low-performing shops</li>
                  <li>• Monitor restock requests and system health</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
