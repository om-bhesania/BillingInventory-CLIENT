# Chart Components

This directory contains reusable Chart.js chart components for the Bliss application. All components are built using Chart.js and are designed to be easily integrated into any dashboard or analytics view.

## Components Overview

### BaseChart
A wrapper component that provides consistent styling and layout for all charts.

**Props:**
- `title`: Chart title
- `children`: Chart content
- `className`: Additional CSS classes
- `subtitle`: Optional subtitle

### TrendChart
Displays trend data over time with percentage change indicators.

**Props:**
- `data`: Array of trend data with date, value, and previousValue
- `title`: Chart title
- `subtitle`: Optional subtitle
- `valueLabel`: Label for the Y-axis
- `className`: Additional CSS classes

**Features:**
- Automatic trend percentage calculation
- Color-coded positive/negative trends
- Previous period comparison line

### BarChart
Displays categorical data with growth indicators and rankings.

**Props:**
- `data`: Array of bar data with label, value, previousValue, and growth
- `title`: Chart title
- `subtitle`: Optional subtitle
- `valueLabel`: Label for the Y-axis
- `className`: Additional CSS classes
- `maxItems`: Maximum number of items to display

**Features:**
- Automatic sorting by value
- Growth percentage indicators
- Color-coded positive/negative growth
- Top performers summary cards

### DoughnutChart
Displays proportional data with percentage breakdowns.

**Props:**
- `data`: Array of doughnut data with label, value, and color
- `title`: Chart title
- `subtitle`: Optional subtitle
- `className`: Additional CSS classes
- `showLegend`: Whether to show the legend

**Features:**
- Automatic percentage calculations
- Customizable legend display
- Color-coded segments
- Total value display in center

### SalesTrendChart
Specialized chart for sales data with moving averages and trend analysis.

**Props:**
- `data`: Array of sales data with date and total
- `title`: Chart title
- `subtitle`: Optional subtitle
- `className`: Additional CSS classes
- `currency`: Currency code for formatting

**Features:**
- Daily sales tracking
- 3-day moving average trend line
- Week-over-week growth calculation
- Summary cards for total, average, and trend

### AnalyticsDashboard
A comprehensive dashboard that combines all chart components with business logic.

**Props:**
- `metrics`: Dashboard metrics data
- `useMockData`: Whether to use mock data for development

**Features:**
- Summary cards for key metrics
- All chart types in a responsive grid
- Top products table
- Automatic data transformation

## Business Logic

The `analytics.ts` file contains utility functions for:

- **Trend Calculations**: Percentage changes, growth rates, moving averages
- **Data Transformation**: Converting API data to chart-friendly formats
- **Performance Analysis**: Best categories, flavors, and products
- **Mock Data Generation**: Development and testing data

### Key Functions

- `calculatePercentageChange()`: Calculate percentage change between values
- `calculateTrend()`: Determine trend direction and strength
- `getBestCategories()`: Get top-performing product categories
- `getBestFlavors()`: Get top-selling flavors
- `transformCategoryData()`: Convert category data for charts

## Usage Examples

### Basic Chart Usage

```tsx
import { BarChart } from '@/components/charts';

const MyComponent = () => {
  const data = [
    { label: 'Category A', value: 100, previousValue: 80, growth: 25 },
    { label: 'Category B', value: 80, previousValue: 100, growth: -20 }
  ];

  return (
    <BarChart
      data={data}
      title="Category Performance"
      subtitle="Sales by category"
      valueLabel="Units Sold"
    />
  );
};
```

### Using the Analytics Dashboard

```tsx
import { AnalyticsDashboard } from '@/components/charts';

const Dashboard = () => {
  const metrics = {
    // Your dashboard metrics data
  };

  return (
    <AnalyticsDashboard 
      metrics={metrics}
      useMockData={false} // Set to true for development
    />
  );
};
```

### Custom Chart Styling

```tsx
import { BaseChart } from '@/components/charts';

const CustomChart = () => {
  return (
    <BaseChart 
      title="Custom Chart"
      subtitle="With custom styling"
      className="bg-gradient-to-r from-blue-50 to-indigo-50"
    >
      {/* Your custom chart content */}
    </BaseChart>
  );
};
```

## Color Scheme

The components use a consistent color palette defined in `CHART_COLORS`:

- **Primary**: Blue (#3b82f6)
- **Secondary**: Green (#10b981)
- **Accent**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)
- **Warning**: Orange (#f97316)
- **Success**: Green (#22c55e)

## Responsive Design

All charts are responsive and will automatically adjust to their container size. The `BaseChart` wrapper provides a consistent height (h-64) that can be customized through CSS classes.

## Data Format Requirements

### Trend Data
```typescript
interface TrendData {
  date: string;
  value: number;
  previousValue: number;
}
```

### Bar Chart Data
```typescript
interface BarChartData {
  label: string;
  value: number;
  previousValue: number;
  growth: number;
}
```

### Doughnut Chart Data
```typescript
interface DoughnutChartData {
  label: string;
  value: number;
  color: string;
}
```

## Dependencies

- Chart.js
- react-chartjs-2
- Lucide React (for icons)
- Tailwind CSS (for styling)

## Installation

The chart components are already installed with the project. If you need to install Chart.js separately:

```bash
npm install chart.js react-chartjs-2
```

## Performance Considerations

- Charts automatically handle data updates
- Large datasets are automatically limited (configurable)
- Responsive design prevents unnecessary re-renders
- Mock data generation is optimized for development use
