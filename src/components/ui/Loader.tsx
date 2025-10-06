import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string; // extra classes applied to outer container
  containerClassName?: string; // override/extend outer container
  wrapperClassName?: string; // wrapper around rings
  trackClassName?: string; // background ring
  spinnerClassName?: string; // animated foreground ring
  messageClassName?: string; // message text styles
  isMessage?: boolean; // optional message; omit to hide
  message?: string;
}
// Loading Spinner Component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  containerClassName,
  wrapperClassName,
  trackClassName,
  spinnerClassName,
  messageClassName,
  isMessage = true,
  message = "Loading...",
}) => (
  <div
    className={cn(
      `loader-container flex ${
        isMessage && "flex-col"
      } items-center justify-center space-y-4`,
      containerClassName,
      className
    )}
  >
    <div className={cn("relative loader-wrapper", wrapperClassName)}>
      <div
        className={cn(
          "loader-outer-ring w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700",
          trackClassName
        )}
      ></div>
      <div
        className={cn(
          "loader-inner-ring absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-500 animate-spin",
          spinnerClassName
        )}
      ></div>
    </div>
    {isMessage !== undefined && (
      <p
        className={cn(
          "loader-message text-gray-600 dark:text-gray-300 text-sm font-medium text-center p-0 m-0",
          messageClassName
        )}
      >
        {isMessage=== true && message}
      </p>
    )}
  </div>
);

export default LoadingSpinner;
