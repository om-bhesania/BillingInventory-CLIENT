import React, { useState, useEffect } from 'react';
import { BarChart } from './BarChart';
import { DoughnutChart } from './DoughnutChart';
import { SalesTrendChart } from './SalesTrendChart';
import { getChartData } from '@/apis/dashboardApi';

export const ChartTest: React.FC = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback test data
  const testCategoryData = [
    { category: 'Vanilla', quantity: 150, previousQuantity: 120, growth: 25.0, color: '#3b82f6' },
    { category: 'Chocolate', quantity: 180, previousQuantity: 160, growth: 12.5, color: '#8b5cf6' },
    { category: 'Strawberry', quantity: 120, previousQuantity: 140, growth: -14.3, color: '#ec4899' },
  ];

  const testFlavorData = [
    { flavor: 'Classic Vanilla', quantity: 80, previousQuantity: 65, growth: 23.1, color: '#3b82f6' },
    { flavor: 'Dark Chocolate', quantity: 95, previousQuantity: 85, growth: 11.8, color: '#8b5cf6' },
    { flavor: 'Fresh Strawberry', quantity: 65, previousQuantity: 75, growth: -13.3, color: '#ec4899' },
  ];

  const testSalesData = [
    { date: '2024-01-01', total: 2500, orders: 25, averageOrder: 100 },
    { date: '2024-01-02', total: 3000, orders: 30, averageOrder: 100 },
    { date: '2024-01-03', total: 2800, orders: 28, averageOrder: 100 },
  ];

  useEffect(() => {
    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getChartData();
        setChartData(data);
      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Failed to load chart data. Using test data instead.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, []);

  // Use real data if available, otherwise fallback to test data
  const categoryData = chartData?.categoryBreakdown || testCategoryData;
  const flavorData = chartData?.flavorBreakdown || testFlavorData;
  const salesData = chartData?.salesTrend || testSalesData;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Chart Test Page</h1>
      
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading chart data...</span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <BarChart
          data={categoryData}
          title="Category Performance"
          subtitle={chartData ? "Real-time category data" : "Test category performance"}
        />
        
        <DoughnutChart
          data={flavorData.map(item => ({
            label: item.flavor,
            value: item.quantity,
            color: item.color
          }))}
          title="Flavor Distribution"
          subtitle={chartData ? "Real-time flavor data" : "Test flavor distribution"}
        />
      </div>
      
      <div className="md:col-span-2">
        <SalesTrendChart
          data={salesData}
          title="Sales Trend"
          subtitle={chartData ? "Real-time sales data" : "Test sales trend chart"}
        />
      </div>
    </div>
  );
};
