import { AlertTriangle, Calendar } from "lucide-react";
import { hojeSaoPaulo } from "@/lib/datas";
import { rotuloRelativo, urgencia } from "@/lib/prazo";
import { cn } from "@/lib/utils";

const tom = {
  atrasada: "text-danger-text",
  hoje: "text-warning-text",
  semana: "text-muted-foreground",
  depois: "text-muted-foreground",
  sem_prazo: "text-subtle-foreground",
};

// Prazo com cor pela urgência e sempre com texto/ícone (nunca só cor).
// `concluido` apaga a urgência; `hoje` pode vir da página para não recalcular.
export function DateChip({
  data,
  concluido,
  hoje = hojeSaoPaulo(),
  className,
}: {
  data: string | null;
  concluido?: boolean;
  hoje?: string;
  className?: string;
}) {
  const u = concluido ? "depois" : urgencia(data, hoje);
  const forte = u === "atrasada" || u === "hoje";
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1.5 text-[12.5px] whitespace-nowrap",
        tom[u],
        className,
      )}
    >
      {u === "atrasada" ? (
        <AlertTriangle className="size-3" aria-hidden />
      ) : (
        <Calendar className="size-3" aria-hidden />
      )}
      {data ? (
        <span className={forte ? "font-medium" : undefined}>
          {rotuloRelativo(data, hoje)}
        </span>
      ) : (
        "Sem prazo"
      )}
    </span>
  );
}
