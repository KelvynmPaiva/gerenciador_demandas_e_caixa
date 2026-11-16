import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-sm border border-transparent px-2 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-danger aria-invalid:ring-danger/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-danger-subtle text-danger-text focus-visible:ring-danger/20 [a]:hover:bg-danger-subtle/80",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-brand underline-offset-4 hover:underline",
        // Etiquetas de status: significado, não decoração (sempre com texto)
        danger: "border-danger-border bg-danger-subtle text-danger-text",
        warning: "border-warning-border bg-warning-subtle text-warning-text",
        success: "border-success-border bg-success-subtle text-success-text",
        brand: "border-brand-border bg-brand-subtle text-brand-text",
        neutral: "border-border bg-muted text-muted-foreground",
        // Nomes antigos em português; migrar para os de cima e remover
        perigo: "border-danger-border bg-danger-subtle text-danger-text",
        sucesso: "border-success-border bg-success-subtle text-success-text",
        atencao: "border-warning-border bg-warning-subtle text-warning-text",
        neutro: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
