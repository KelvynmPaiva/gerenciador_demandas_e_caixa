"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, ListChecks, Receipt, Repeat } from "lucide-react";
import { toast } from "sonner";
import { atualizarItem } from "@/app/(app)/eventos/[eventoId]/actions";
import {
  atualizarSubtarefa,
  atualizarTarefa,
} from "@/app/(app)/eventos/[eventoId]/actions-demandas";
import { atualizarOcorrencia } from "@/app/(app)/marcas/[marcaId]/actions";
import { CampoValor } from "@/components/campos-inline";
import { DateChip } from "@/components/date-chip";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  classificar,
  diasAte,
  domingoDaSemana,
  somarDias,
  type Periodo,
} from "@/lib/datas";
import { plural } from "@/lib/formato";
import {
  enderecoDaPendencia,
  faltaValorReal,
  ordenarPendencias,
  ROTULOS_DO_TIPO,
  type Pendencia,
  type TipoPendencia,
} from "@/lib/pendencias";
import { intervaloCurto } from "@/lib/prazo";
import type { Resultado } from "@/lib/resultado";
import { cn } from "@/lib/utils";

// Tempos da microinteração ao concluir: o título fica riscado por 700ms,
// depois a linha some em 200ms. Nesse intervalo dá para "Desfazer" pelo aviso.
const TEMPO_RISCADO = 700;
const TEMPO_SUMIR = 200;

type Fase = "riscado" | "saindo";

type Bloco = {
  periodo: Exclude<Periodo, "depois">;
  titulo: string;
  vazio: string;
  ponto: string; // cor da bolinha ao lado do título
};

const BLOCOS: Bloco[] = [
  {
    periodo: "atrasada",
    titulo: "Atrasadas",
    vazio: "Nada atrasado. Tudo em dia por aqui.",
    ponto: "bg-danger",
  },
  {
    periodo: "esta_semana",
    titulo: "Esta semana",
    vazio: "Nenhum item vence de hoje até domingo.",
    ponto: "bg-warning",
  },
  {
    periodo: "proxima_semana",
    titulo: "Próxima semana",
    vazio: "Nenhum item vence na semana que vem.",
    ponto: "bg-border-strong",
  },
];

const ICONES_DO_TIPO: Record<TipoPendencia, React.ElementType> = {
  tarefa: ListChecks,
  subtarefa: ListChecks,
  nf: Receipt,
  recorrente: Repeat,
};

const AVISO_DE_CONCLUSAO: Record<TipoPendencia, string> = {
  tarefa: "Tarefa concluída",
  subtarefa: "Subtarefa concluída",
  nf: "NF lançada",
  recorrente: "Despesa concluída",
};

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

// O contrário de gravarConclusao (botão "Desfazer" do aviso)
function reverterConclusao(item: Pendencia): Promise<Resultado> {
  switch (item.tipo) {
    case "tarefa":
      return atualizarTarefa(item.id, { concluida: false });
    case "subtarefa":
      return atualizarSubtarefa(item.id, { concluida: false });
    case "nf":
      return atualizarItem(item.id, { statusNf: "pendente" });
    default:
      return Promise.resolve({ erro: null });
  }
}

export function BlocosPainel({
  pendencias: doServidor,
  hoje,
  children,
}: {
  pendencias: Pendencia[];
  hoje: string; // "AAAA-MM-DD" em São Paulo
  children?: React.ReactNode; // coluna da direita (lista de marcas), vinda do servidor
}) {
  const router = useRouter();

  // A tela trabalha numa cópia local: o item é riscado na hora e a gravação acontece em
  // seguida. Se der erro, o item volta e a tela é recarregada do servidor.
  const [itens, setItens] = useState(doServidor);
  const [versaoDoServidor, setVersaoDoServidor] = useState(doServidor);
  const [gravacoesPendentes, setGravacoesPendentes] = useState(0);
  // Itens recém-concluídos que ainda aparecem (riscados) até a animação acabar
  const [saindo, setSaindo] = useState<Map<string, { item: Pendencia; fase: Fase }>>(
    new Map(),
  );
  const temporizadores = useRef(new Map<string, number[]>());
  const [, iniciar] = useTransition();

  // Quando o servidor manda dados novos, a cópia local é substituída por eles, mas só
  // com a tela "parada" (sem gravação em andamento). Assim uma resposta antiga não faz
  // um item que acabou de ser marcado "piscar" de volta.
  if (doServidor !== versaoDoServidor && gravacoesPendentes === 0) {
    setVersaoDoServidor(doServidor);
    setItens(doServidor);
  }

  // Ao sair da tela, cancela as animações em andamento
  useEffect(() => {
    const mapa = temporizadores.current;
    return () => {
      mapa.forEach((ids) => ids.forEach((id) => window.clearTimeout(id)));
    };
  }, []);

  function gravar(
    acao: () => Promise<Resultado>,
    desfazer: () => void,
    aoGravar?: () => void,
  ) {
    setGravacoesPendentes((n) => n + 1);
    iniciar(async () => {
      try {
        const resultado = await acao();
        if (resultado.erro) {
          toast.error(resultado.erro);
          desfazer();
          router.refresh();
        } else {
          aoGravar?.();
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
    cancelarSaida(item.chave);
    setItens((atuais) =>
      atuais.some((i) => i.chave === item.chave)
        ? atuais.map((i) => (i.chave === item.chave ? item : i))
        : ordenarPendencias([...atuais, item]),
    );
  }

  function cancelarSaida(chave: string) {
    temporizadores.current.get(chave)?.forEach((id) => window.clearTimeout(id));
    temporizadores.current.delete(chave);
    setSaindo((atuais) => {
      if (!atuais.has(chave)) return atuais;
      const novo = new Map(atuais);
      novo.delete(chave);
      return novo;
    });
  }

  // Risca o item, depois some com ele. `reverter` é o que o "Desfazer" grava no banco.
  function concluirComAnimacao(item: Pendencia, reverter: () => Promise<Resultado>) {
    aplicar(item, null);
    cancelarSaida(item.chave);
    setSaindo((atuais) => new Map(atuais).set(item.chave, { item, fase: "riscado" }));

    const t1 = window.setTimeout(() => {
      setSaindo((atuais) =>
        atuais.has(item.chave)
          ? new Map(atuais).set(item.chave, { item, fase: "saindo" })
          : atuais,
      );
    }, TEMPO_RISCADO);
    const t2 = window.setTimeout(() => {
      temporizadores.current.delete(item.chave);
      setSaindo((atuais) => {
        const novo = new Map(atuais);
        novo.delete(item.chave);
        return novo;
      });
    }, TEMPO_RISCADO + TEMPO_SUMIR);
    temporizadores.current.set(item.chave, [t1, t2]);

    toast(AVISO_DE_CONCLUSAO[item.tipo], {
      action: {
        label: "Desfazer",
        onClick: () => {
          restaurar(item);
          gravar(reverter, () => aplicar(item, null));
        },
      },
    });
  }

  function marcar(item: Pendencia, marcado: boolean) {
    if (item.tipo === "recorrente") {
      // Só conclui (e some) com check marcado E valor real preenchido.
      // Sem valor real, o item fica com o aviso "Falta valor real".
      const concluiu = marcado && item.valorReal !== null;
      if (concluiu) {
        concluirComAnimacao(item, () =>
          atualizarOcorrencia(item.id, { checkMarcado: false }),
        );
      } else {
        aplicar(item, { ...item, checkMarcado: marcado });
      }
      gravar(
        () => atualizarOcorrencia(item.id, { checkMarcado: marcado }),
        () => restaurar(item),
      );
      return;
    }

    if (!marcado) return;
    concluirComAnimacao(item, () => reverterConclusao(item));
    gravar(
      () => gravarConclusao(item),
      () => restaurar(item),
    );
  }

  function salvarValor(item: Pendencia, valorReal: number | null) {
    const concluiu = item.checkMarcado && valorReal !== null;
    if (concluiu) {
      concluirComAnimacao(item, () =>
        atualizarOcorrencia(item.id, { valorReal: item.valorReal }),
      );
    } else {
      aplicar(item, { ...item, valorReal });
    }
    gravar(
      () => atualizarOcorrencia(item.id, { valorReal }),
      () => restaurar(item),
    );
  }

  // O que aparece: os itens pendentes mais os que acabaram de ser concluídos (riscados)
  const visiveis = ordenarPendencias([
    ...itens,
    ...[...saindo.values()].map((s) => s.item),
  ]);

  const porPeriodo = new Map<Bloco["periodo"], Pendencia[]>();
  for (const bloco of BLOCOS) porPeriodo.set(bloco.periodo, []);
  for (const item of visiveis) {
    porPeriodo.get(classificar(item.data, hoje) as Bloco["periodo"])?.push(item);
  }

  // Números da faixa de resumo contam só o que ainda está pendente
  const pendentes = (periodo: Bloco["periodo"]) =>
    itens.filter((i) => classificar(i.data, hoje) === periodo);
  const atrasadas = pendentes("atrasada");
  const estaSemana = pendentes("esta_semana");
  const proximaSemana = pendentes("proxima_semana");
  const nfs = itens.filter((i) => i.tipo === "nf");
  const maisAntiga = atrasadas.length
    ? Math.max(...atrasadas.map((i) => diasAte(hoje, i.data)))
    : 0;
  const vencemHoje = estaSemana.filter((i) => i.data === hoje).length;
  const domingo = domingoDaSemana(hoje);
  const faixas: Record<Bloco["periodo"], string> = {
    atrasada: "antes de hoje",
    esta_semana: intervaloCurto(hoje, domingo),
    proxima_semana: intervaloCurto(somarDias(domingo, 1), somarDias(domingo, 7)),
  };

  return (
    <>
      <p className="mt-1.5 text-muted-foreground">
        {atrasadas.length === 0 && estaSemana.length === 0
          ? "Nada atrasado nem vencendo esta semana."
          : `${plural(atrasadas.length, "item atrasado", "itens atrasados")} e ${estaSemana.length} vencendo esta semana.`}
      </p>

      {/* Faixa de resumo: cada número leva ao grupo correspondente */}
      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border bg-card shadow-xs lg:grid-cols-4">
        <ResumoLink
          href="#grupo-atrasada"
          rotulo="Atrasadas"
          ponto="bg-danger"
          numero={atrasadas.length}
          sub={maisAntiga ? `mais antiga há ${plural(maisAntiga, "dia", "dias")}` : "nada atrasado"}
          alerta={atrasadas.length > 0}
        />
        <ResumoLink
          href="#grupo-esta_semana"
          rotulo="Esta semana"
          ponto="bg-warning"
          numero={estaSemana.length}
          sub={vencemHoje ? `${vencemHoje} ${vencemHoje === 1 ? "vence" : "vencem"} hoje` : faixas.esta_semana}
        />
        <ResumoLink
          href="#grupo-proxima_semana"
          rotulo="Próxima semana"
          ponto="bg-border-strong"
          numero={proximaSemana.length}
          sub={faixas.proxima_semana}
        />
        <ResumoLink
          href="#grupo-atrasada"
          rotulo="NFs a lançar"
          icone={Receipt}
          numero={nfs.length}
          sub={nfs.length ? `${nfs.filter((i) => i.data < hoje).length} atrasadas` : "nenhuma pendente"}
        />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_288px]">
        <div className="flex min-w-0 flex-col gap-4">
          {BLOCOS.map((bloco) => {
            const doBloco = porPeriodo.get(bloco.periodo) ?? [];
            const quantidade = pendentes(bloco.periodo).length;
            const atrasado = bloco.periodo === "atrasada" && quantidade > 0;

            return (
              <section
                key={bloco.periodo}
                id={`grupo-${bloco.periodo}`}
                aria-labelledby={`bloco-${bloco.periodo}`}
                className={cn(
                  "scroll-mt-20 overflow-hidden rounded-lg border bg-card shadow-xs",
                  atrasado && "border-danger-border",
                )}
              >
                <header
                  className={cn(
                    "flex h-10 items-center gap-2 border-b px-4 text-[13px]",
                    atrasado
                      ? "border-danger-border bg-danger-subtle text-danger-text"
                      : "bg-muted",
                  )}
                >
                  <span className={cn("size-[7px] rounded-full", bloco.ponto)} aria-hidden />
                  <h2 id={`bloco-${bloco.periodo}`} className="font-semibold">
                    {bloco.titulo}
                  </h2>
                  <span
                    className={cn(
                      "font-mono text-xs",
                      !atrasado && "text-muted-foreground",
                    )}
                  >
                    {quantidade}
                  </span>
                  <span
                    className={cn(
                      "num ml-auto text-xs",
                      !atrasado && "text-muted-foreground",
                    )}
                  >
                    {faixas[bloco.periodo]}
                  </span>
                </header>

                {doBloco.length === 0 ? (
                  <p className="flex items-center gap-2 px-4 py-3.5 text-[13px] text-muted-foreground">
                    <CircleCheck className="size-4 text-success" aria-hidden />
                    {bloco.vazio}
                  </p>
                ) : (
                  <ul>
                    {doBloco.map((item) => (
                      <LinhaPendencia
                        key={item.chave}
                        item={item}
                        hoje={hoje}
                        fase={saindo.get(item.chave)?.fase}
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

        {children}
      </div>
    </>
  );
}

function ResumoLink({
  href,
  rotulo,
  ponto,
  icone: Icone,
  numero,
  sub,
  alerta = false,
}: {
  href: string;
  rotulo: string;
  ponto?: string;
  icone?: React.ElementType;
  numero: number;
  sub: string;
  alerta?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "block border-l px-4 py-3.5 transition-colors first:border-l-0 hover:bg-muted max-lg:nth-[n+3]:border-t max-lg:nth-[3]:border-l-0",
        alerta && "bg-danger-subtle text-danger-text hover:bg-danger-subtle/70",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-[12.5px]",
          !alerta && "text-muted-foreground",
        )}
      >
        {ponto && <span className={cn("size-[7px] rounded-full", ponto)} aria-hidden />}
        {Icone && <Icone className="size-3" aria-hidden />}
        {rotulo}
      </div>
      <div className="num mt-1.5 text-[28px] leading-[1.1] font-semibold tracking-[-0.04em]">
        {numero}
      </div>
      <div className={cn("mt-0.5 text-xs", !alerta && "text-muted-foreground")}>{sub}</div>
    </a>
  );
}

function LinhaPendencia({
  item,
  hoje,
  fase,
  aoMarcar,
  aoSalvarValor,
}: {
  item: Pendencia;
  hoje: string;
  fase?: Fase; // definida quando o item acabou de ser concluído
  aoMarcar: (item: Pendencia, marcado: boolean) => void;
  aoSalvarValor: (item: Pendencia, valor: number | null) => void;
}) {
  const faltaValor = !fase && faltaValorReal(item);
  const concluido = fase !== undefined;
  const Icone = ICONES_DO_TIPO[item.tipo];

  return (
    <li
      className={cn(
        "relative grid min-h-[52px] grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-border-subtle px-4 py-2 transition-[background,opacity] duration-200 ease-out first:border-t-0",
        faltaValor ? "bg-warning-subtle/60 hover:bg-warning-subtle" : "hover:bg-row-hover",
        fase === "saindo" && "opacity-0",
      )}
    >
      {/* z-10: o check fica por cima do link que cobre a linha inteira */}
      <div className="relative z-10">
        <Checkbox
          checked={concluido || (item.tipo === "recorrente" && item.checkMarcado)}
          disabled={concluido}
          onCheckedChange={(marcado) => aoMarcar(item, marcado === true)}
          aria-label={`Concluir "${item.titulo}"`}
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {/* O link cobre a linha toda (after:inset-0): clicar em qualquer ponto abre o item */}
          <Link
            href={enderecoDaPendencia(item)}
            className={cn(
              "truncate text-[13.5px] font-medium after:absolute after:inset-0 hover:underline hover:underline-offset-3",
              concluido && "text-muted-foreground line-through decoration-border-strong",
            )}
          >
            {item.titulo}
          </Link>
          {item.tipo === "nf" && !concluido && (
            <StatusBadge tone="danger" className="h-5 text-[11.5px]">
              Lançamento pendente
            </StatusBadge>
          )}
          {faltaValor && (
            <StatusBadge tone="warning" className="h-5 text-[11.5px]">
              Falta valor real
            </StatusBadge>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.marcaNome}
          {item.eventoNome && ` · ${item.eventoNome}`}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icone className="size-3" aria-hidden />
          {ROTULOS_DO_TIPO[item.tipo]}
        </span>
        {item.valorReal !== null && (
          <Money value={item.valorReal} className="text-[13px] text-muted-foreground" />
        )}
        <DateChip data={item.data} concluido={concluido} hoje={hoje} />
      </div>

      {faltaValor && (
        <div className="relative z-10 col-start-2 col-end-4 flex items-center gap-2">
          <span className="text-xs font-medium text-warning-text">Inserir valor:</span>
          <CampoValor
            rotulo={`Valor real de ${item.titulo}`}
            valor={item.valorReal}
            destaque
            onSalvar={(valor) => aoSalvarValor(item, valor)}
          />
        </div>
      )}
    </li>
  );
}
