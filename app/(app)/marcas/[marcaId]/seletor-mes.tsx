import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { somarMeses } from "@/lib/datas";
import { nomeDoMes } from "@/lib/formato";

// Seletor de mês: setas para ir ao mês anterior/seguinte (o mês fica na URL: ?mes=2026-11).
export function SeletorMes({
  marcaId,
  mes,
  mesAtual,
  eventosArquivados = false,
}: {
  marcaId: string;
  mes: string; // "AAAA-MM"
  mesAtual: string;
  eventosArquivados?: boolean; // mantém o filtro de eventos ao trocar de mês
}) {
  const base = `/marcas/${marcaId}`;
  const filtro = eventosArquivados ? "&eventos=arquivados" : "";
  const estiloSeta =
    "flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-primary";

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center overflow-hidden rounded-lg border bg-card">
        <Link
          href={`${base}?mes=${somarMeses(mes, -1)}${filtro}`}
          className={estiloSeta}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <span className="min-w-36 px-3 text-center text-sm font-medium">
          {nomeDoMes(mes)}
        </span>
        <Link
          href={`${base}?mes=${somarMeses(mes, 1)}${filtro}`}
          className={estiloSeta}
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {mes !== mesAtual && (
        <Link
          href={eventosArquivados ? `${base}?eventos=arquivados` : base}
          className="text-sm font-medium text-primary hover:underline"
        >
          Voltar ao mês atual
        </Link>
      )}
    </div>
  );
}
