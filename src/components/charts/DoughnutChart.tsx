import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { BaseChart } from './BaseChart';
import '@/lib/chartjs';

interface DoughnutChartData {
  label: string;
  value: number;
  color: string;
}

interface DoughnutChartProps {
  data: DoughnutChartData[];
  title: string;
  subtitle?: string;
  className?: string;
  showLegend?: boolean;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  title,
  subtitle,
  className = "",
  showLegend = true
}) => {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <BaseChart title={title} subtitle={subtitle} className={className}>
      <div className="flex items-center justify-center h-full">
        <div className="relative w-48 h-48">
          <Doughnut data={chartData} options={options} />
          {!showLegend && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {!showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.value.toLocaleString()} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseChart>
  );
};
