import React from "react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className,
  size = "sm",
  showNumber = false
}) => {
  if (count === 0) return null;

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3"
  };

  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 rounded-full bg-black animate-pulse",
        sizeClasses[size],
        className
      )}
    >
      {showNumber && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
};
