import { cn } from "cn"

// Placeholder de carregamento com brilho suave (respeita "movimento reduzido" no globals.css)
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer rounded-sm", className)}
      {...props}
    />
  )
}

export { Skeleton }
