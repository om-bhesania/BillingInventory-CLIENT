import React from 'react';
import { BarChart } from './BarChart';
import { DoughnutChart } from './DoughnutChart';
import { SalesTrendChart } from './SalesTrendChart';

export const ChartTest: React.FC = () => {
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Chart Test Page</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <BarChart
          data={testCategoryData}
          title="Test Category Chart"
          subtitle="Testing category performance"
        />
        
        <DoughnutChart
          data={testFlavorData.map(item => ({
            label: item.flavor,
            value: item.quantity,
            color: item.color
          }))}
          title="Test Flavor Chart"
          subtitle="Testing flavor distribution"
        />
      </div>
      
      <div className="md:col-span-2">
        <SalesTrendChart
          data={testSalesData}
          title="Test Sales Trend"
          subtitle="Testing sales trend chart"
        />
      </div>
    </div>
  );
};
