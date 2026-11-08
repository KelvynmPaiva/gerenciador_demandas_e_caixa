import Link from "next/link";
import { ArrowRight, CalendarDays, CircleCheck, Folder } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResumoDoEvento } from "@/lib/eventos";
import { formatarIntervalo, formatarMoeda, plural } from "@/lib/formato";

// Cartão ("pasta") de um evento ou ação na tela da marca.
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

  return (
    <article className="flex flex-col rounded-xl border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">
          <Folder className="size-4 text-primary" />
          {evento.tipo === "acao" ? "Ação" : "Evento"}
        </span>
        <Badge variant={resumo.nfsPendentes > 0 ? "perigo" : "sucesso"}>
          {plural(resumo.nfsPendentes, "NF pendente", "NFs pendentes")}
        </Badge>
      </div>

      <div className="px-5 pt-3">
        <Link
          href={link}
          className="block text-lg font-semibold tracking-[-0.015em] hover:text-primary"
        >
          {evento.nome}
        </Link>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" />
          {formatarIntervalo(evento.data_inicio, evento.data_fim)}
        </p>
      </div>

      <div className="mx-5 mt-4 rounded-lg border bg-muted/50 px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
          Total orçado
        </p>
        <p className="text-2xl font-semibold tabular-nums">
          {formatarMoeda(resumo.totalOrcado)}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t px-5 py-3">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck className="size-4" />
          {plural(resumo.tarefasPendentes, "tarefa pendente", "tarefas pendentes")}
        </span>
        <Button asChild variant="outline" size="sm" className="text-primary">
          <Link href={link}>
            Detalhes <ArrowRight />
          </Link>
        </Button>
      </div>
    </article>
  );
}
