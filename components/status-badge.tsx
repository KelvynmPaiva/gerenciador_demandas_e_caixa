import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Tom = "danger" | "warning" | "success" | "brand" | "neutral";

// Etiqueta de status: ponto (ou check no sucesso) + texto. Nunca só cor.
//   NF pendente → <StatusBadge tone="danger">Pendente</StatusBadge>
//   NF lançada  → <StatusBadge tone="success">Lançada</StatusBadge>
export function StatusBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tom;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Badge variant={tone} className={className}>
      {tone === "success" ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </Badge>
  );
}
