# Enhanced Analytics Dashboard

A comprehensive, role-based analytics dashboard with advanced business intelligence, anomaly detection, and actionable insights for the Bliss application.

## 🚀 Features

### 1. Smart Date Range Filtering
- **Preset Ranges**: Today, This Week, This Month, This Quarter, This Year, Last 7/30/90 Days
- **Custom Ranges**: Flexible date selection with dual-month calendar view
- **Automatic Comparisons**: Automatically calculates equivalent previous periods for accurate trend analysis
- **Real-time Updates**: Dashboard refreshes with new date ranges

### 2. Role-Based Dashboards

#### Shop Owner Dashboard
- **KPIs**: Revenue, Invoices, Restock Expenses, Current Stock, Low Stock Alerts
- **Analytics**: Top-selling products, sales growth %, average order value, product contribution share
- **Insights**: Stock optimization recommendations, declining sales alerts, stockout forecasting
- **Charts**: Sales trends, category performance, flavor breakdowns

#### Admin Dashboard
- **KPIs**: Total Revenue (all shops), Top Revenue Shops, Total Products, Categories, Restock Requests
- **Analytics**: Shop performance ranking, product category contribution, factory workload analysis
- **Insights**: Restock priorities, underperforming shop identification, scaling recommendations
- **System Health**: Overall performance metrics and alerts

### 3. Advanced Analytics Engine

#### Enhanced Trend Analysis
- **Confidence Levels**: High, Medium, Low based on sample size and magnitude
- **Strength Indicators**: Strong, Moderate, Weak based on percentage change
- **Statistical Significance**: Flags meaningful changes vs. noise
- **Multi-period Comparisons**: Week-over-week, month-over-month, quarter-over-quarter

#### Anomaly Detection
- **Statistical Methods**: Z-score based detection with configurable thresholds
- **Severity Levels**: Critical, High, Medium, Low
- **Pattern Recognition**: Spikes, drops, trend changes, seasonal variations
- **Actionable Insights**: Suggested actions for each detected anomaly

#### Business Intelligence
- **Opportunity Detection**: High-growth products, expanding categories
- **Warning Systems**: Declining performance, stockout risks
- **Recommendations**: Inventory optimization, pricing strategies
- **Trend Analysis**: Seasonal patterns, market shifts

### 4. Interactive Components

#### Enhanced KPI Cards
- **Trend Indicators**: Visual up/down arrows with percentage changes
- **Confidence Badges**: Color-coded confidence levels
- **Anomaly Alerts**: Real-time anomaly detection with severity indicators
- **Interactive Elements**: Hover effects, click actions

#### Business Insights Panel
- **Priority-based Sorting**: High, Medium, Low priority insights
- **Action Buttons**: View Details, Dismiss, Take Action
- **Category Filtering**: Opportunities, Warnings, Recommendations, Trends
- **Impact Assessment**: Business impact and suggested actions

#### Advanced Charts
- **Chart.js Integration**: Professional-grade visualizations
- **Responsive Design**: Mobile-first, adaptive layouts
- **Interactive Tooltips**: Rich data display on hover
- **Export Capabilities**: Chart and data export options

## 🏗️ Architecture

### Component Structure
```
EnhancedAnalyticsDashboard/
├── DateRangePicker/          # Smart date selection
├── EnhancedKPICard/          # Advanced KPI display
├── BusinessInsights/         # AI-powered insights
├── ChartComponents/          # Reusable chart library
├── AnalyticsEngine/          # Business logic & calculations
└── RoleBasedViews/           # Admin vs Shop Owner layouts
```

### Data Flow
```
User Input → Date Range → Data Fetch → Analytics Processing → Insights Generation → UI Rendering
     ↓              ↓           ↓              ↓                    ↓              ↓
Role Selection → Period Calc → API Calls → Trend Analysis → Business Logic → Interactive Charts
```

### Business Logic Layers
1. **Data Transformation**: Convert API data to chart-friendly formats
2. **Comparison Engine**: Calculate period-over-period changes
3. **Analytics Processing**: Generate trends, anomalies, and insights
4. **Role-based Filtering**: Apply user-specific logic and permissions
5. **Insight Generation**: AI-powered recommendations and alerts

## 📊 Key Metrics & Calculations

### Revenue Analytics
- **Total Revenue**: Sum of all invoices in selected period
- **Revenue Growth**: Percentage change vs. previous equivalent period
- **Average Order Value**: Revenue per transaction with trend analysis
- **Revenue per Shop**: Performance comparison across locations

### Product Performance
- **Top Sellers**: Ranked by quantity sold with growth indicators
- **Category Contribution**: Market share and performance by product category
- **Flavor Analysis**: Best-performing flavors and trends
- **Stockout Forecasting**: Predictive analysis based on sales velocity

### Inventory Management
- **Current Stock Levels**: Real-time inventory counts
- **Low Stock Alerts**: Items below minimum thresholds
- **Restock Efficiency**: Cost analysis and optimization
- **Demand Forecasting**: Predictive inventory planning

### Operational Metrics
- **Order Processing**: Invoice counts and processing times
- **Restock Requests**: Pending vs. fulfilled requests
- **System Notifications**: Alert counts and priorities
- **Performance Rankings**: Shop and product leaderboards

## 🎯 Business Insights

### Revenue Optimization
- **Growth Opportunities**: Identify high-performing products and categories
- **Declining Trends**: Flag products needing attention or discontinuation
- **Pricing Strategies**: Analyze price sensitivity and margin optimization
- **Market Expansion**: Identify underserved categories and flavors

### Inventory Management
- **Stockout Prevention**: Predictive alerts for low inventory
- **Overstock Avoidance**: Identify slow-moving products
- **Restock Timing**: Optimize order quantities and frequencies
- **Supplier Performance**: Track fulfillment efficiency and costs

### Operational Efficiency
- **Shop Performance**: Rank locations by revenue and growth
- **Resource Allocation**: Identify high-impact improvement areas
- **Process Optimization**: Streamline restock and fulfillment workflows
- **Quality Control**: Monitor product performance and customer satisfaction

## 🔧 Technical Implementation

### Dependencies
```json
{
  "chart.js": "^4.0.0",
  "react-chartjs-2": "^5.0.0",
  "date-fns": "^2.30.0",
  "lucide-react": "^0.263.0"
}
```

### Performance Optimizations
- **Lazy Loading**: Charts render only when visible
- **Data Caching**: Memoized calculations and transformations
- **Responsive Design**: Adaptive layouts for all screen sizes
- **Efficient Rendering**: Optimized re-renders and state management

### Accessibility Features
- **Screen Reader Support**: ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes
- **Responsive Text**: Scalable typography and layouts

## 📱 Usage Examples

### Basic Implementation
```tsx
import { EnhancedAnalyticsDashboard } from '@/components/charts';

const Dashboard = () => {
  const metrics = {
    // Your dashboard metrics data
  };

  return (
    <EnhancedAnalyticsDashboard
      metrics={metrics}
      role="Shop_Owner"
      useMockData={false}
    />
  );
};
```

### Role Switching
```tsx
const [role, setRole] = useState<'Admin' | 'Shop_Owner'>('Shop_Owner');

<EnhancedAnalyticsDashboard
  metrics={metrics}
  role={role}
  useMockData={false}
/>
```

### Custom Date Ranges
```tsx
const [dateRange, setDateRange] = useState<DateRange>({
  from: new Date('2024-01-01'),
  to: new Date('2024-01-31')
});

// The dashboard automatically calculates previous period
// Jan 1-31, 2024 → compares with Jan 1-31, 2023
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install chart.js react-chartjs-2 date-fns lucide-react
```

### 2. Import Components
```tsx
import { 
  EnhancedAnalyticsDashboard,
  EnhancedKPICard,
  BusinessInsights 
} from '@/components/charts';
```

### 3. Set Up Data Structure
Ensure your metrics data follows the `DashboardMetrics` interface structure.

### 4. Configure Role-based Access
Set the appropriate role ('Admin' or 'Shop_Owner') based on user permissions.

### 5. Customize Insights
Modify the business logic in `enhancedAnalytics.ts` to match your specific business rules.

## 🔍 Advanced Configuration

### Anomaly Detection Thresholds
```tsx
// Adjust sensitivity in enhancedAnalytics.ts
export const detectAnomalies = (
  data: number[],
  threshold: number = 2.5  // Lower = more sensitive
): AnomalyDetection[] => {
  // Implementation
};
```

### Custom Business Rules
```tsx
// Add custom insights in enhancedAnalytics.ts
export const generateCustomInsights = (metrics, businessRules) => {
  // Your custom business logic
};
```

### Chart Customization
```tsx
// Modify chart options in individual chart components
const chartOptions = {
  // Your custom Chart.js options
};
```

## 📈 Future Enhancements

### Planned Features
- **Machine Learning**: Predictive analytics and forecasting
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: Multi-dimensional data slicing
- **Custom Dashboards**: User-configurable layouts
- **Mobile App**: Native mobile dashboard experience

### Integration Opportunities
- **ERP Systems**: SAP, Oracle, Microsoft Dynamics
- **CRM Platforms**: Salesforce, HubSpot, Pipedrive
- **Accounting Software**: QuickBooks, Xero, FreshBooks
- **E-commerce Platforms**: Shopify, WooCommerce, Magento

## 🤝 Contributing

### Development Guidelines
1. **TypeScript**: Strict typing for all components
2. **Testing**: Unit tests for business logic functions
3. **Documentation**: Comprehensive JSDoc comments
4. **Performance**: Monitor bundle size and rendering performance
5. **Accessibility**: Ensure WCAG compliance

### Code Standards
- **ESLint**: Consistent code formatting
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Conventional Commits**: Standardized commit messages

## 📄 License

This enhanced analytics dashboard is part of the Bliss application and follows the same licensing terms.

---

**Built with ❤️ for the Bliss team**
*Advanced business intelligence for modern retail operations*
