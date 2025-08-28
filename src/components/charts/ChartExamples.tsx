import React from 'react';
import { 
  TrendChart, 
  BarChart, 
  DoughnutChart, 
  SalesTrendChart,
  BaseChart 
} from './index';
import { CHART_COLORS } from '@/lib/analytics';

export const ChartExamples: React.FC = () => {
  // Sample data for examples
  const trendData = [
    { date: '2024-01-01', value: 1000, previousValue: 800 },
    { date: '2024-01-02', value: 1200, previousValue: 900 },
    { date: '2024-01-03', value: 1100, previousValue: 1000 },
    { date: '2024-01-04', value: 1400, previousValue: 1100 },
    { date: '2024-01-05', value: 1300, previousValue: 1200 },
  ];

  const barData = [
    { label: 'Beverages', value: 1250, previousValue: 1100, growth: 13.6 },
    { label: 'Snacks', value: 890, previousValue: 950, growth: -6.3 },
    { label: 'Dairy', value: 650, previousValue: 600, growth: 8.3 },
    { label: 'Fruits', value: 420, previousValue: 380, growth: 10.5 },
    { label: 'Vegetables', value: 380, previousValue: 400, growth: -5.0 },
  ];

  const doughnutData = [
    { label: 'Beverages', value: 1250, color: CHART_COLORS.primary },
    { label: 'Snacks', value: 890, color: CHART_COLORS.secondary },
    { label: 'Dairy', value: 650, color: CHART_COLORS.accent },
    { label: 'Fruits', value: 420, color: CHART_COLORS.success },
    { label: 'Vegetables', value: 380, color: CHART_COLORS.warning },
  ];

  const salesData = [
    { date: '2024-01-01', total: 15000 },
    { date: '2024-01-02', total: 18000 },
    { date: '2024-01-03', total: 16000 },
    { date: '2024-01-04', total: 22000 },
    { date: '2024-01-05', total: 19000 },
    { date: '2024-01-06', total: 25000 },
    { date: '2024-01-07', total: 21000 },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Chart Component Examples</h1>
        <p className="text-muted-foreground">
          Examples of how to use the reusable chart components
        </p>
      </div>

      {/* Trend Chart Example */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Trend Chart</h2>
        <TrendChart
          data={trendData}
          title="Revenue Trend Example"
          subtitle="Showing daily revenue with previous period comparison"
          valueLabel="Revenue (₹)"
        />
      </div>

      {/* Bar Chart Examples */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Category Performance</h2>
          <BarChart
            data={barData}
            title="Category Performance"
            subtitle="Top performing categories with growth indicators"
            valueLabel="Units Sold"
            maxItems={5}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Custom Bar Chart</h2>
          <BaseChart 
            title="Custom Styled Chart"
            subtitle="Example of custom styling with BaseChart"
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">Custom</div>
                <div className="text-lg text-blue-500">Chart Example</div>
                <div className="text-sm text-muted-foreground mt-2">
                  You can wrap any content in BaseChart
                </div>
              </div>
            </div>
          </BaseChart>
        </div>
      </div>

      {/* Doughnut Chart Examples */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Category Distribution</h2>
          <DoughnutChart
            data={doughnutData}
            title="Category Distribution"
            subtitle="Product category breakdown by sales volume"
            showLegend={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Compact Doughnut</h2>
          <DoughnutChart
            data={doughnutData.slice(0, 3)}
            title="Top 3 Categories"
            subtitle="Compact view without legend"
            showLegend={false}
          />
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sales Trend Analysis</h2>
        <SalesTrendChart
          data={salesData}
          title="Weekly Sales Performance"
          subtitle="Daily sales with trend analysis and moving averages"
          currency="INR"
        />
      </div>

      {/* Usage Instructions */}
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How to Use These Components</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium">1. Import the components:</h3>
            <code className="block bg-background p-2 rounded mt-1">
              {`import { TrendChart, BarChart, DoughnutChart, SalesTrendChart } from '@/components/charts';`}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium">2. Prepare your data:</h3>
            <code className="block bg-background p-2 rounded mt-1">
              {`const data = [
  { label: 'Category A', value: 100, previousValue: 80, growth: 25 },
  { label: 'Category B', value: 80, previousValue: 100, growth: -20 }
];`}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium">3. Use the component:</h3>
            <code className="block bg-background p-2 rounded mt-1">
              {`<BarChart
  data={data}
  title="Performance"
  subtitle="Category performance"
  valueLabel="Units"
/>`}
            </code>
          </div>
          
          <div>
            <h3 className="font-medium">4. For the complete dashboard:</h3>
            <code className="block bg-background p-2 rounded mt-1">
              {`import { AnalyticsDashboard } from '@/components/charts';

<AnalyticsDashboard 
  metrics={yourMetrics}
  useMockData={true} // For development
/>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
