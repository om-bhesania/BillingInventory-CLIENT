import React from "react";
import { Line } from "react-chartjs-2";
import { BaseChart } from "./BaseChart";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import "@/lib/chartjs";

interface SalesData {
  date: string;
  total: number;
}

interface SalesTrendChartProps {
  data: SalesData[];
  title: string;
  subtitle?: string;
  className?: string;
  currency?: string;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  title,
  subtitle,
  className = "",
  currency = "INR",
}) => {
  // Calculate trend percentage
  const calculateTrendPercentage = (): number => {
    if (data.length < 2) return 0;

    const recent = data.slice(-7); // Last 7 days
    const previous = data.slice(-14, -7); // Previous 7 days

    if (recent.length === 0 || previous.length === 0) return 0;

    const recentTotal = recent.reduce((sum, item) => sum + item.total, 0);
    const previousTotal = previous.reduce((sum, item) => sum + item.total, 0);

    if (previousTotal === 0) return recentTotal > 0 ? 100 : 0;

    return ((recentTotal - previousTotal) / previousTotal) * 100;
  };

  // Calculate moving average for trend line
  const calculateMovingAverage = (
    data: SalesData[],
    window: number
  ): number[] => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        result.push(null as any);
      } else {
        const sum = data
          .slice(i - window + 1, i + 1)
          .reduce((acc, item) => acc + item.total, 0);
        result.push(sum / window);
      }
    }
    return result;
  };

  const trendPercentage = calculateTrendPercentage();
  const isPositive = trendPercentage >= 0;
  const movingAverage = calculateMovingAverage(data, 3);

  const chartData = {
    labels: data.map((item) => item.date),
    datasets: [
      {
        label: "Daily Sales",
        data: data.map((item) => item.total),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "3-Day Moving Average",
        data: movingAverage,
        borderColor: "#10b981",
        backgroundColor: "transparent",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        borderDash: [5, 5],
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false, // allows custom height/width
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (value !== null) {
              return `${label}: ${new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `Sales (${currency})`,
        },
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  // Calculate total sales for the period
  const totalSales = data.reduce((sum, item) => sum + item.total, 0);
  const averageDailySales = data.length > 0 ? totalSales / data.length : 0;

  return (
    <BaseChart title={title} subtitle={subtitle} className={className}>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalSales)}
          </div>
          <div className="text-sm text-muted-foreground">Total Sales</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(averageDailySales)}
          </div>
          <div className="text-sm text-muted-foreground">Daily Average</div>
        </div>

        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div
            className={`flex items-center justify-center gap-1 text-2xl font-bold ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {trendPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-muted-foreground">vs Previous Week</div>
        </div>
      </div>

      <Line data={chartData} options={options} className="h-full" />
    </BaseChart>
  );
};
