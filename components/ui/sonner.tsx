"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "next-themes"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Segue o tema atual (claro/escuro) via next-themes; cores vêm dos tokens --toast-*.
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--toast-bg)",
          "--normal-text": "var(--toast-fg)",
          "--normal-border": "var(--toast-border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !bg-toast !text-toast-foreground !border !border-toast-border !shadow-overlay !rounded-lg !text-[13px]",
          actionButton: "!bg-transparent !text-toast-action !font-medium",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
