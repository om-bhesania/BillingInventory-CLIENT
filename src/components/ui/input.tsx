import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & {
  contentLeft?: React.ReactNode
  contentRight?: React.ReactNode
}>(({ className, type, contentLeft, contentRight, ...props }, ref) => {
  return (
    <div className="relative">
      {contentLeft && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {contentLeft}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
      {contentRight && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {contentRight}
        </div>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }

