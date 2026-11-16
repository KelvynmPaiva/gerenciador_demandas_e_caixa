import { formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Valor em reais com algarismos tabulares (colunas alinham); sem valor → "—"
export function Money({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  return <span className={cn("num", className)}>{formatarMoeda(value)}</span>;
}
