import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  showPercentage?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const TrendIndicator = ({ 
  value, 
  previousValue, 
  showPercentage = true, 
  className,
  size = "md" 
}: TrendIndicatorProps) => {
  if (previousValue === undefined || previousValue === null) {
    return (
      <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
        <Minus className={cn(
          size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"
        )} />
        <span className={cn(
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
        )}>
          No previous data
        </span>
      </div>
    );
  }

  const change = value - previousValue;
  const percentageChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const getIcon = () => {
    if (isPositive) return TrendingUp;
    if (isNegative) return TrendingDown;
    return Minus;
  };

  const getColorClasses = () => {
    if (isPositive) return "text-green-600";
    if (isNegative) return "text-red-600";
    return "text-muted-foreground";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3";
      case "lg":
        return "h-5 w-5";
      default:
        return "h-4 w-4";
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-base";
      default:
        return "text-sm";
    }
  };

  const Icon = getIcon();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Icon className={cn(getSizeClasses(), getColorClasses())} />
      <span className={cn(getTextSizeClasses(), getColorClasses())}>
        {showPercentage ? (
          <>
            {isPositive ? "+" : ""}
            {percentageChange.toFixed(1)}%
          </>
        ) : (
          <>
            {isPositive ? "+" : ""}
            {change.toFixed(1)}
          </>
        )}
      </span>
    </div>
  );
};
