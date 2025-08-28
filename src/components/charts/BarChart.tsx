import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BaseChart } from './BaseChart';
import { TrendingUp, TrendingDown } from 'lucide-react';
import '@/lib/chartjs';

interface BarChartData {
  label: string;
  value: number;
  previousValue: number;
  growth: number;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
  subtitle?: string;
  valueLabel?: string;
  className?: string;
  maxItems?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  valueLabel = 'Quantity',
  className = "",
  maxItems = 10
}) => {
  // Debug logging
  console.log('BarChart - Received data:', { data: data.length, title, dataSample: data.slice(0, 2) });
  
  // Validate data structure
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('BarChart - Invalid or empty data:', data);
    return (
      <BaseChart title={title} subtitle={subtitle} className={className}>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No data available for chart
        </div>
      </BaseChart>
    );
  }
  
  // Sort data by value and take top items
  const sortedData = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxItems);

  const chartData = {
    labels: sortedData.map(item => item.label),
    datasets: [
      {
        label: 'Current Period',
        data: sortedData.map(item => item.value),
        backgroundColor: sortedData.map(item => 
          item.growth >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: sortedData.map(item => 
          item.growth >= 0 ? '#10b981' : '#ef4444'
        ),
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Previous Period',
        data: sortedData.map(item => item.previousValue),
        backgroundColor: 'rgba(107, 114, 128, 0.6)',
        borderColor: '#6b7280',
        borderWidth: 1,
        borderRadius: 4,
        borderDash: [5, 5],
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          },
          afterLabel: function(context: any) {
            const index = context.dataIndex;
            const item = sortedData[index];
            if (item && typeof item.growth === 'number') {
              const growthText = item.growth >= 0 ? '+' : '';
              return `Growth: ${growthText}${item.growth.toFixed(1)}%`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Categories'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: valueLabel
        },
        beginAtZero: true
      }
    }
  };

  return (
    <BaseChart title={title} subtitle={subtitle} className={className}>
      <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {sortedData.slice(0, 6).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.value.toLocaleString()}</p>
            </div>
            <div className={`flex items-center gap-1 ${(item.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(item.growth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-xs font-medium">
                {(item.growth || 0) >= 0 ? '+' : ''}{(item.growth || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      {sortedData.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No data available for chart
        </div>
      )}
    </BaseChart>
  );
};
