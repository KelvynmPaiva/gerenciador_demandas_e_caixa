import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks } from "lucide-react";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { hojeSaoPaulo } from "@/lib/datas";
import type { ResumoDoEvento } from "@/lib/eventos";
import { formatarIntervalo, plural } from "@/lib/formato";
import { contagemDeDias } from "@/lib/prazo";
import { cn } from "@/lib/utils";

// Cartão de um evento ou ação na tela da marca. Com NF vencida, a borda avisa.
export function CartaoEvento({
  evento,
  resumo,
}: {
  evento: {
    id: string;
    nome: string;
    tipo: string;
    data_inicio: string | null;
    data_fim: string | null;
  };
  resumo: ResumoDoEvento;
}) {
  const link = `/eventos/${evento.id}`;
  const hoje = hojeSaoPaulo();
  // "em 5 dias" até o começo; depois disso só o intervalo de datas
  const contagem =
    evento.data_inicio && evento.data_inicio >= hoje
      ? contagemDeDias(evento.data_inicio, hoje)
      : null;

  return (
    <article
      className={cn(
        "flex flex-col rounded-lg border bg-card shadow-xs transition-colors hover:border-border-strong",
        resumo.nfsVencidas > 0 && "border-danger-border hover:border-danger-border",
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="text-xs font-medium text-muted-foreground">
          {evento.tipo === "acao" ? "Ação" : "Evento"}
        </span>
        {resumo.nfsPendentes > 0 ? (
          <StatusBadge tone="danger">
            {plural(resumo.nfsPendentes, "NF pendente", "NFs pendentes")}
          </StatusBadge>
        ) : (
          <StatusBadge tone="success">NFs em dia</StatusBadge>
        )}
      </div>

      <div className="px-4 pt-2">
        <Link href={link} className="text-h2 block hover:text-brand">
          {evento.nome}
        </Link>
        <p className="num mt-1 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden />
          {formatarIntervalo(evento.data_inicio, evento.data_fim)}
          {contagem && <span>· {contagem}</span>}
        </p>
        {resumo.nfsVencidas > 0 && (
          <p className="mt-1 text-xs font-medium text-danger-text">
            {plural(resumo.nfsVencidas, "NF com prazo vencido", "NFs com prazo vencido")}
          </p>
        )}
      </div>

      <div className="mx-4 mt-4 border-t border-border-subtle pt-3">
        <p className="text-xs text-muted-foreground">Total real</p>
        <Money value={resumo.totalReal} className="text-kpi" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <ListChecks className="size-3.5" aria-hidden />
          {plural(resumo.tarefasPendentes, "tarefa pendente", "tarefas pendentes")}
        </span>
        <Button asChild variant="ghost" size="sm" className="text-brand hover:text-brand">
          <Link href={link}>
            Detalhes <ArrowRight />
          </Link>
        </Button>
      </div>
    </article>
  );
}
