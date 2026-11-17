import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import type { Tarefa } from "@/app/(app)/eventos/[eventoId]/demandas-tipos";
import { BotaoNovoEvento } from "@/app/(app)/eventos/dialogo-evento";
import { EmptyState } from "@/components/empty-state";
import { Pagina } from "@/components/pagina";
import { Badge } from "@/components/ui/badge";
import {
  cobreOMes,
  dataEmSaoPaulo,
  fimDaProximaSemana,
  hojeSaoPaulo,
  lerMes,
} from "@/lib/datas";
import { ordenarDespesas, type NotaComMeses } from "@/lib/despesas";
import { RESUMO_VAZIO, resumirEventos } from "@/lib/eventos";
import { plural } from "@/lib/formato";
import { TIPOS_DE_PENDENCIA } from "@/lib/pendencias";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { CartaoEvento } from "./cartao-evento";
import { BotaoAdicionarDespesa } from "./dialogo-despesa";
import { ListaRadar } from "./lista-radar";
import { SeletorMes } from "./seletor-mes";
import { TabelaOcorrencias, type LinhaOcorrencia } from "./tabela-ocorrencias";

export default async function MarcaPage({
  params,
  searchParams,
}: {
  params: Promise<{ marcaId: string }>;
  searchParams: Promise<{ mes?: string; eventos?: string }>;
}) {
  const { marcaId } = await params;
  const { mes: mesDaUrl, eventos: filtroDaUrl } = await searchParams;

  const supabase = await createClient();
  const hoje = hojeSaoPaulo();
  const mesAtual = hoje.slice(0, 7);
  const mes = lerMes(mesDaUrl) ?? mesAtual; // "AAAA-MM"
  const verArquivados = filtroDaUrl === "arquivados";

  // As despesas de cada mês são cadastradas à mão ("Adicionar despesa"):
  // não há geração automática, então tudo pode ser buscado em paralelo.
  const [
    { data: marca },
    notas,
    eventosAtivos,
    eventos,
    ocorrencias,
    pendencias,
    radar,
  ] = await Promise.all([
    // Marca inexistente (ou id inválido na URL) → página "não encontrada"
    supabase
      .from("marcas")
      .select("id, nome, ativa")
      .eq("id", marcaId)
      .maybeSingle(),
    // Todas as despesas recorrentes da marca e os meses em que já estão
    // (para o contador do topo e as sugestões de "Adicionar despesa")
    supabase
      .from("notas_recorrentes")
      .select("id, nome, ocorrencias_mensais(mes_referencia)")
      .eq("marca_id", marcaId),
    supabase
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("marca_id", marcaId)
      .eq("arquivado", false),
    // Eventos da lista (ativos ou arquivados, conforme o filtro). Os mais próximos primeiro.
    supabase
      .from("eventos")
      .select("id, nome, tipo, data_inicio, data_fim, criado_em")
      .eq("marca_id", marcaId)
      .eq("arquivado", verArquivados)
      .order("data_inicio", { ascending: true, nullsFirst: false })
      .order("criado_em", { ascending: false }),
    // Despesas do mês. O nome vem da nota (fonte única: renomear vale para todos os meses).
    supabase
      .from("ocorrencias_mensais")
      .select(
        "id, vencimento, valor_real, check_marcado, observacao, notas_recorrentes!inner(id, nome, observacao, marca_id)",
      )
      .eq("notas_recorrentes.marca_id", marcaId)
      .eq("mes_referencia", `${mes}-01`),
    // Pendências = o mesmo que aparece no Painel: atrasado ou até o domingo da próxima semana
    // (inclui o Radar com prazo). Só os tipos que o Painel mostra, para os números baterem.
    supabase
      .from("vw_pendencias")
      .select("id", { count: "exact", head: true })
      .eq("marca_id", marcaId)
      .in("tipo", [...TIPOS_DE_PENDENCIA])
      .lte("data", fimDaProximaSemana(hoje)),
    // No Radar: todos os itens da marca (pendentes e concluídos), na ordem de criação.
    // Item já promovido para tarefa sai da lista (a promoção é da segunda etapa).
    supabase
      .from("itens_radar")
      .select(
        "id, descricao, prazo, concluida, observacao, link_externo, subitens_radar(id, descricao, prazo, concluida, observacao)",
      )
      .eq("marca_id", marcaId)
      .is("promovido_em", null)
      .order("ordem")
      .order("criado_em")
      .order("ordem", { referencedTable: "subitens_radar" })
      .order("criado_em", { referencedTable: "subitens_radar" }),
  ]);
  if (!marca) notFound();
  if (eventos.error) throw new Error(eventos.error.message);
  if (notas.error) throw new Error(notas.error.message);
  if (ocorrencias.error) throw new Error(ocorrencias.error.message);
  if (radar.error) throw new Error(radar.error.message);

  // Mesmo formato das tarefas de evento: a lista reaproveita LinhaTarefa/PainelTarefa
  const itensDoRadar: Tarefa[] = radar.data.map((item) => ({
    id: item.id,
    descricao: item.descricao,
    prazo: item.prazo,
    concluida: item.concluida,
    observacao: item.observacao,
    linkExterno: item.link_externo,
    subtarefas: item.subitens_radar.map((subitem) => ({
      id: subitem.id,
      descricao: subitem.descricao,
      prazo: subitem.prazo,
      concluida: subitem.concluida,
      observacao: subitem.observacao,
    })),
  }));

  // Só os eventos que cobrem o mês escolhido (do início ao fim; sem fim = só o mês de início).
  // Filtra aqui, antes de buscar os resumos, para não somar NFs/tarefas de eventos que não aparecem.
  // Eventos antigos sem data de início (antes de ela ser obrigatória) entram no mês em que
  // foram criados, para não sumirem da tela; ao editar, a data passa a ser exigida.
  const eventosDoMes = eventos.data.filter((evento) =>
    cobreOMes(
      evento.data_inicio ?? dataEmSaoPaulo(evento.criado_em),
      evento.data_fim,
      mes,
    ),
  );

  const resumos = await resumirEventos(
    supabase,
    eventosDoMes.map((evento) => evento.id),
    hoje,
  );

  // Ordem: data e, no empate, nome (o nome está na nota, por isso a ordem é feita aqui)
  const linhas: LinhaOcorrencia[] = ordenarDespesas(
    ocorrencias.data.map((o) => ({
      id: o.id,
      vencimento: o.vencimento,
      valorReal: o.valor_real,
      checkMarcado: o.check_marcado,
      observacao: o.observacao,
      nota: {
        id: o.notas_recorrentes.id,
        nome: o.notas_recorrentes.nome,
        observacao: o.notas_recorrentes.observacao,
      },
    })),
  );

  const notasComMeses: NotaComMeses[] = notas.data.map((nota) => ({
    id: nota.id,
    nome: nota.nome,
    meses: nota.ocorrencias_mensais.map((o) => o.mes_referencia.slice(0, 7)),
  }));

  const qtdPendencias = pendencias.count ?? 0;

  // Endereço do filtro "Ativos / Arquivados" (mantém o mês escolhido e volta para a seção)
  function enderecoDoFiltro(arquivados: boolean) {
    const partes: string[] = [];
    if (lerMes(mesDaUrl)) partes.push(`mes=${mes}`);
    if (arquivados) partes.push("eventos=arquivados");
    const consulta = partes.length > 0 ? `?${partes.join("&")}` : "";
    return `/marcas/${marcaId}${consulta}#eventos`;
  }

  const estiloOpcao = (ativa: boolean) =>
    cn(
      "rounded-md px-3 py-1 text-[13px] transition-colors",
      ativa
        ? "bg-card font-medium text-foreground shadow-xs"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <Pagina
      breadcrumb={[{ rotulo: "Marcas", href: "/marcas" }, { rotulo: marca.nome }]}
    >
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-display">{marca.nome}</h1>
          {!marca.ativa && <Badge variant="neutral">Desativada</Badge>}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
          <span>
            {plural(eventosAtivos.count ?? 0, "evento ativo", "eventos ativos")}
          </span>
          <span aria-hidden>•</span>
          <span>
            {plural(
              notasComMeses.length,
              "nota recorrente",
              "notas recorrentes",
            )}
          </span>
          <span aria-hidden>•</span>
          <span className={cn(qtdPendencias > 0 && "font-medium text-danger-text")}>
            {plural(qtdPendencias, "pendência", "pendências")}
          </span>
        </p>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <h2 className="text-h2">
              Notas recorrentes do mês
            </h2>
            <SeletorMes
              marcaId={marcaId}
              mes={mes}
              mesAtual={mesAtual}
              eventosArquivados={verArquivados}
            />
          </div>
          <BotaoAdicionarDespesa
            marcaId={marcaId}
            mes={mes}
            hoje={hoje}
            notas={notasComMeses}
          />
        </div>

        {/* "key" faz a tabela recomeçar ao trocar de mês */}
        <TabelaOcorrencias key={mes} ocorrencias={linhas} hoje={hoje} />
      </section>

      {/* Entre Notas recorrentes e Eventos. Não depende do mês: o Radar é da marca. */}
      <ListaRadar
        itens={itensDoRadar}
        marcaId={marcaId}
        marcaNome={marca.nome}
        hoje={hoje}
      />

      <section id="eventos" className="mt-12 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <h2 className="text-h2">
              Eventos e ações
            </h2>
            <div
              className="inline-flex rounded-lg border bg-muted p-0.5"
              role="group"
              aria-label="Filtro de eventos"
            >
              <Link
                href={enderecoDoFiltro(false)}
                className={estiloOpcao(!verArquivados)}
                aria-current={!verArquivados ? "page" : undefined}
              >
                Ativos
              </Link>
              <Link
                href={enderecoDoFiltro(true)}
                className={estiloOpcao(verArquivados)}
                aria-current={verArquivados ? "page" : undefined}
              >
                Arquivados
              </Link>
            </div>
          </div>
          <BotaoNovoEvento marcaId={marcaId} />
        </div>

        {eventosDoMes.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card">
            <EmptyState
              icon={FolderOpen}
              title={
                verArquivados
                  ? "Nenhum evento arquivado neste mês"
                  : "Nenhum evento ativo neste mês"
              }
              text={verArquivados ? undefined : "Use “Novo evento” para criar um."}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eventosDoMes.map((evento) => (
              <CartaoEvento
                key={evento.id}
                evento={evento}
                resumo={resumos.get(evento.id) ?? RESUMO_VAZIO}
              />
            ))}
          </div>
        )}
      </section>
    </Pagina>
  );
}
