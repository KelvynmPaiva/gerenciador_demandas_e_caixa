import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[34px] w-full max-md:h-10 min-w-0 rounded-md border border-input bg-card px-3 py-1 text-[13.5px] shadow-xs transition-colors outline-none hover:border-control-border file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
