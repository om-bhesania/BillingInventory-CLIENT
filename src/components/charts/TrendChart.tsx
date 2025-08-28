import React from 'react';
import { Line } from 'react-chartjs-2';
import { BaseChart } from './BaseChart';
import { TrendingUp, TrendingDown } from 'lucide-react';
import '@/lib/chartjs';

interface TrendData {
  date: string;
  value: number;
  previousValue: number;
}

interface TrendChartProps {
  data: TrendData[];
  title: string;
  subtitle?: string;
  valueLabel?: string;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  subtitle,
  valueLabel = 'Value',
  className = ""
}) => {
  // Calculate trend percentage
  const calculateTrendPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get the latest trend
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  const trendPercentage = latestData && previousData 
    ? calculateTrendPercentage(latestData.value, previousData.value)
    : 0;

  const isPositive = trendPercentage >= 0;

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Current Period',
        data: data.map(item => item.value),
        borderColor: isPositive ? '#10b981' : '#ef4444',
        backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Previous Period',
        data: data.map(item => item.previousValue),
        borderColor: '#6b7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
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
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
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
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <BaseChart title={title} subtitle={subtitle} className={className}>
      <div className="mb-4 flex items-center gap-2">
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{trendPercentage.toFixed(1)}%
          </span>
        </div>
        <span className="text-sm text-muted-foreground">vs previous period</span>
      </div>
      <Line data={chartData} options={options} />
    </BaseChart>
  );
};
