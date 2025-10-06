import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  TrendingUp, 
  Store, 
  DollarSign, 
  BarChart3,
  RefreshCw,
  Search,
  Lightbulb,
  Target
} from 'lucide-react';
import { areaAnalyticsService, AreaInfo, AreaAnalytics, FlavorPerformance } from '@/services/areaAnalyticsService';
import { cn } from '@/lib/utils';

interface AreaAnalyticsCardProps {
  className?: string;
}

export const AreaAnalyticsCard: React.FC<AreaAnalyticsCardProps> = ({ className }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [areaAnalytics, setAreaAnalytics] = useState<AreaAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'zipcode' | 'dropdown'>('zipcode');

  const states = areaAnalyticsService.getIndianStates();
  const cities = selectedState ? areaAnalyticsService.getCitiesByState(selectedState) : [];
  const areas = selectedCity ? areaAnalyticsService.getAreasByCity(selectedCity) : [];

  useEffect(() => {
    if (searchMode === 'zipcode' && zipCode.length === 6) {
      const area = areaAnalyticsService.getAreaByZipCode(zipCode);
      if (area) {
        setAreaInfo(area);
        loadAreaAnalytics(area);
      }
    }
  }, [zipCode, searchMode]);

  useEffect(() => {
    if (searchMode === 'dropdown' && selectedArea && selectedCity && selectedState) {
      const area: AreaInfo = {
        areaName: selectedArea,
        city: selectedCity,
        state: states.find(s => s.id === selectedState)?.name || selectedState,
        zipCode: undefined
      };
      setAreaInfo(area);
      loadAreaAnalytics(area);
    }
  }, [selectedArea, selectedCity, selectedState, searchMode]);

  const loadAreaAnalytics = async (area: AreaInfo) => {
    setIsLoading(true);
    try {
      // In a real application, this would fetch data from your backend
      // For now, we'll generate mock data
      const mockSalesData = generateMockSalesData(area);
      const analytics = areaAnalyticsService.generateAreaAnalytics(area, mockSalesData);
      setAreaAnalytics(analytics);
    } catch (error) {
      console.error('Error loading area analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSalesData = (area: AreaInfo) => {
    const flavors = [
      { id: '1', name: 'Vanilla' },
      { id: '2', name: 'Chocolate' },
      { id: '3', name: 'Strawberry' },
      { id: '4', name: 'Mint' },
      { id: '5', name: 'Butterscotch' },
      { id: '6', name: 'Pista' },
      { id: '7', name: 'Kesar' },
      { id: '8', name: 'Mango' }
    ];

    return flavors.map((flavor, index) => ({
      flavorId: flavor.id,
      flavorName: flavor.name,
      quantity: 50 + (index * 15), // More realistic progression
      amount: 2000 + (index * 500), // More realistic progression
      shopCount: Math.min(3 + index, 8) // More realistic shop count
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRecommendations = () => {
    if (!areaInfo || !areaAnalytics) return null;
    
    // In a real application, this would fetch data from your backend
    const mockAllAreas = [areaAnalytics];
    return areaAnalyticsService.getAreaRecommendations(areaInfo, mockAllAreas);
  };

  const recommendations = getRecommendations();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Area Analytics & Insights
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Options */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={searchMode === 'zipcode' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('zipcode')}
            >
              <Search className="h-4 w-4 mr-2" />
              Zip Code
            </Button>
            <Button
              variant={searchMode === 'dropdown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('dropdown')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Location
            </Button>
          </div>

          {searchMode === 'zipcode' ? (
            <div className="space-y-2">
              <Label>Enter Zip Code</Label>
              <Input
                placeholder="Enter 6-digit zip code (e.g., 390001)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                maxLength={6}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>City</Label>
                <Select 
                  value={selectedCity} 
                  onValueChange={setSelectedCity}
                  disabled={!selectedState}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Area</Label>
                <Select 
                  value={selectedArea} 
                  onValueChange={setSelectedArea}
                  disabled={!selectedCity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Area Info */}
        {areaInfo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{areaInfo.areaName}</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>{areaInfo.city}, {areaInfo.state}</p>
              {areaInfo.zipCode && <p>Zip Code: {areaInfo.zipCode}</p>}
            </div>
          </div>
        )}

        {/* Analytics Data */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        ) : areaAnalytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Store className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Total Shops</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{areaAnalytics.totalShops}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(areaAnalytics.totalRevenue)}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Top Flavors</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{areaAnalytics.topFlavors.length}</p>
              </div>
            </div>

            {/* Top Performing Flavors */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Top Performing Flavors
              </h4>
              <div className="space-y-2">
                {areaAnalytics.topFlavors.slice(0, 5).map((flavor, index) => (
                  <div key={flavor.flavorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{flavor.flavorName}</span>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatCurrency(flavor.totalRevenue)}</p>
                      <p className="text-gray-500">{flavor.totalSales} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Insights */}
            {recommendations && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Market Insights
                </h4>
                <div className="space-y-2">
                  {recommendations.marketInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                      <Target className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span className="text-sm text-yellow-800">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select an area to view analytics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AreaAnalyticsCard;
