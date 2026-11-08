"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { atualizarItem } from "@/app/(app)/eventos/[eventoId]/actions";
import {
  atualizarSubtarefa,
  atualizarTarefa,
} from "@/app/(app)/eventos/[eventoId]/actions-demandas";
import { atualizarOcorrencia } from "@/app/(app)/marcas/[marcaId]/actions";
import { CampoValor } from "@/components/campos-inline";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { classificar, type Periodo } from "@/lib/datas";
import { formatarData, plural } from "@/lib/formato";
import {
  enderecoDaPendencia,
  faltaValorReal,
  ordenarPendencias,
  ROTULOS_DO_TIPO,
  type Pendencia,
} from "@/lib/pendencias";
import type { Resultado } from "@/lib/resultado";
import { cn } from "@/lib/utils";

type Bloco = {
  periodo: Exclude<Periodo, "depois">;
  titulo: string;
  vazioTitulo: string;
  vazioTexto: string;
  cabecalho: string; // estilo do cabeçalho do bloco
  ponto: string; // cor da bolinha ao lado do título
};

const BLOCOS: Bloco[] = [
  {
    periodo: "atrasada",
    titulo: "Atrasadas",
    vazioTitulo: "Nada atrasado 🎉",
    vazioTexto: "Nenhum item com a data vencida.",
    cabecalho: "border-b border-perigo-borda bg-perigo-fundo/60",
    ponto: "bg-perigo",
  },
  {
    periodo: "esta_semana",
    titulo: "Esta semana",
    vazioTitulo: "Nada para esta semana",
    vazioTexto: "Nenhum item vence de hoje até domingo.",
    cabecalho: "border-b bg-muted/60",
    ponto: "bg-primary",
  },
  {
    periodo: "proxima_semana",
    titulo: "Próxima semana",
    vazioTitulo: "Nada para a próxima semana",
    vazioTexto: "Nenhum item vence de segunda a domingo da semana que vem.",
    cabecalho: "border-b bg-muted/60",
    ponto: "bg-neutro",
  },
];

// Grava o que a pessoa acabou de marcar. Cada tipo de item é salvo na sua tabela.
function gravarConclusao(item: Pendencia): Promise<Resultado> {
  switch (item.tipo) {
    case "tarefa":
      return atualizarTarefa(item.id, { concluida: true });
    case "subtarefa":
      return atualizarSubtarefa(item.id, { concluida: true });
    case "nf":
      return atualizarItem(item.id, { statusNf: "lancada" });
    default:
      return Promise.resolve({ erro: null });
  }
}

export function BlocosPainel({
  pendencias: doServidor,
  hoje,
}: {
  pendencias: Pendencia[];
  hoje: string; // "AAAA-MM-DD" em São Paulo
}) {
  const router = useRouter();

  // A tela trabalha numa cópia local: o item some na hora e a gravação acontece em
  // seguida. Se der erro, o item volta e a tela é recarregada do servidor.
  const [itens, setItens] = useState(doServidor);
  const [versaoDoServidor, setVersaoDoServidor] = useState(doServidor);
  const [gravacoesPendentes, setGravacoesPendentes] = useState(0);
  const [, iniciar] = useTransition();

  // Quando o servidor manda dados novos, a cópia local é substituída por eles, mas só
  // com a tela "parada" (sem gravação em andamento). Assim uma resposta antiga não faz
  // um item que acabou de ser marcado "piscar" de volta.
  if (doServidor !== versaoDoServidor && gravacoesPendentes === 0) {
    setVersaoDoServidor(doServidor);
    setItens(doServidor);
  }

  function gravar(acao: () => Promise<Resultado>, desfazer: () => void) {
    setGravacoesPendentes((n) => n + 1);
    iniciar(async () => {
      try {
        const resultado = await acao();
        if (resultado.erro) {
          toast.error(resultado.erro);
          desfazer();
          router.refresh();
        }
      } catch {
        toast.error("Não foi possível salvar. Verifique a conexão e tente de novo.");
        desfazer();
        router.refresh();
      } finally {
        setGravacoesPendentes((n) => n - 1);
      }
    });
  }

  // Troca o item por uma versão nova (ou remove, com null)
  function aplicar(item: Pendencia, novo: Pendencia | null) {
    setItens((atuais) =>
      novo
        ? atuais.map((i) => (i.chave === item.chave ? novo : i))
        : atuais.filter((i) => i.chave !== item.chave),
    );
  }

  // Devolve o item ao estado de antes (se ele tinha sumido, volta no lugar certo)
  function restaurar(item: Pendencia) {
    setItens((atuais) =>
      atuais.some((i) => i.chave === item.chave)
        ? atuais.map((i) => (i.chave === item.chave ? item : i))
        : ordenarPendencias([...atuais, item]),
    );
  }

  function marcar(item: Pendencia, marcado: boolean) {
    if (item.tipo === "recorrente") {
      // Só conclui (e some) com check marcado E valor real preenchido.
      // Sem valor real, o item fica com o aviso "Falta valor real".
      const concluiu = marcado && item.valorReal !== null;
      aplicar(item, concluiu ? null : { ...item, checkMarcado: marcado });
      gravar(
        () => atualizarOcorrencia(item.id, { checkMarcado: marcado }),
        () => restaurar(item),
      );
      return;
    }

    if (!marcado) return;
    aplicar(item, null);
    gravar(
      () => gravarConclusao(item),
      () => restaurar(item),
    );
  }

  function salvarValor(item: Pendencia, valorReal: number | null) {
    const concluiu = item.checkMarcado && valorReal !== null;
    aplicar(item, concluiu ? null : { ...item, valorReal });
    gravar(
      () => atualizarOcorrencia(item.id, { valorReal }),
      () => restaurar(item),
    );
  }

  return (
    <div className="grid grid-cols-3 items-start gap-5">
      {BLOCOS.map((bloco) => {
        const doBloco = itens.filter(
          (item) => classificar(item.data, hoje) === bloco.periodo,
        );

        return (
          <section
            key={bloco.periodo}
            aria-labelledby={`bloco-${bloco.periodo}`}
            className={cn(
              "overflow-hidden rounded-xl border bg-card shadow-xs",
              bloco.periodo === "atrasada" && doBloco.length > 0 && "border-perigo-borda",
            )}
          >
            <header
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3",
                bloco.cabecalho,
              )}
            >
              <h2
                id={`bloco-${bloco.periodo}`}
                className="flex items-center gap-2 text-lg font-semibold tracking-[-0.015em]"
              >
                <span className={cn("size-2.5 rounded-full", bloco.ponto)} aria-hidden />
                {bloco.titulo}
              </h2>
              <Badge variant={bloco.periodo === "atrasada" && doBloco.length > 0 ? "perigo" : "neutro"}>
                {plural(doBloco.length, "item", "itens")}
              </Badge>
            </header>

            {doBloco.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
                <CircleCheck className="mb-1 size-8 text-sucesso" aria-hidden />
                <p className="font-medium">{bloco.vazioTitulo}</p>
                <p className="text-sm text-muted-foreground">{bloco.vazioTexto}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {doBloco.map((item) => (
                  <LinhaPendencia
                    key={item.chave}
                    item={item}
                    atrasada={bloco.periodo === "atrasada"}
                    aoMarcar={marcar}
                    aoSalvarValor={salvarValor}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function LinhaPendencia({
  item,
  atrasada,
  aoMarcar,
  aoSalvarValor,
}: {
  item: Pendencia;
  atrasada: boolean;
  aoMarcar: (item: Pendencia, marcado: boolean) => void;
  aoSalvarValor: (item: Pendencia, valor: number | null) => void;
}) {
  const faltaValor = faltaValorReal(item);

  return (
    <li
      className={cn(
        "relative flex gap-3 px-4 py-3 transition-colors",
        faltaValor
          ? "bg-atencao-fundo/50 hover:bg-atencao-fundo/70"
          : "hover:bg-muted/40",
      )}
    >
      {/* z-10: o check fica por cima do link que cobre a linha inteira */}
      <div className="relative z-10 pt-0.5">
        <Checkbox
          checked={item.tipo === "recorrente" && item.checkMarcado}
          onCheckedChange={(marcado) => aoMarcar(item, marcado === true)}
          aria-label={`Concluir "${item.titulo}"`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="neutro">{ROTULOS_DO_TIPO[item.tipo]}</Badge>
          {item.tipo === "nf" && (
            <Badge variant="perigo">
              <span className="size-1.5 rounded-full bg-perigo" aria-hidden />
              Lançamento pendente
            </Badge>
          )}
          {faltaValor && <Badge variant="atencao">Falta valor real</Badge>}
        </div>

        {/* O link cobre a linha toda (after:inset-0): clicar em qualquer ponto abre o item */}
        <Link
          href={enderecoDaPendencia(item)}
          className="mt-1.5 block leading-5 font-medium hover:text-primary after:absolute after:inset-0"
        >
          {item.titulo}
        </Link>

        <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 tabular-nums",
              atrasada && "font-medium text-perigo",
            )}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {atrasada ? "Venceu em " : ""}
            {formatarData(item.data)}
          </span>
          <span>
            {item.marcaNome}
            {item.eventoNome && ` • ${item.eventoNome}`}
          </span>
        </div>

        {faltaValor && (
          <div className="relative z-10 mt-2.5 flex items-center gap-2">
            <span className="text-xs font-medium text-atencao">Inserir valor:</span>
            <CampoValor
              rotulo={`Valor real de ${item.titulo}`}
              valor={item.valorReal}
              destaque
              onSalvar={(valor) => aoSalvarValor(item, valor)}
            />
          </div>
        )}
      </div>
    </li>
  );
}
