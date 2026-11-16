import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, FolderOpen, ListChecks, Receipt } from "lucide-react";
import { Pagina } from "@/components/pagina";
import { ResumoEvento } from "@/components/resumo-evento";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hojeSaoPaulo } from "@/lib/datas";
import { formatarIntervalo, somarValores } from "@/lib/formato";
import { linkSeguro } from "@/lib/links";
import { contagemDeDias } from "@/lib/prazo";
import { createClient } from "@/lib/supabase/server";
import { AcoesDoEvento } from "./acoes-do-evento";
import type { Secao } from "./demandas-tipos";
import { PainelDemandas } from "./painel-demandas";
import { PainelOrcamento, type ItemOrcamento } from "./painel-orcamento";

export default async function EventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventoId: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { eventoId } = await params;
  const { aba: abaDaUrl } = await searchParams;

  // A aba ativa fica na URL (?aba=orcamento ou ?aba=demandas). O padrão é Orçamento.
  const aba = abaDaUrl === "demandas" ? "demandas" : "orcamento";

  const supabase = await createClient();

  // Evento inexistente (ou id inválido na URL) → página "não encontrada"
  const { data: evento } = await supabase
    .from("eventos")
    .select("*, marcas(id, nome)")
    .eq("id", eventoId)
    .maybeSingle();
  if (!evento) notFound();

  const [itens, tarefasPendentes, tarefasTotal] = await Promise.all([
    supabase
      .from("itens_orcamento")
      .select("*")
      .eq("evento_id", eventoId)
      .order("ordem")
      .order("criado_em"),
    supabase
      .from("tarefas")
      .select("id, secoes!inner(evento_id)", { count: "exact", head: true })
      .eq("secoes.evento_id", eventoId)
      .eq("concluida", false),
    supabase
      .from("tarefas")
      .select("id, secoes!inner(evento_id)", { count: "exact", head: true })
      .eq("secoes.evento_id", eventoId),
  ]);
  if (itens.error) throw new Error(itens.error.message);

  const itensDoOrcamento: ItemOrcamento[] = itens.data.map((item) => ({
    id: item.id,
    servico: item.servico,
    fornecedor: item.fornecedor,
    valorReal: item.valor_real,
    statusNf: item.status_nf === "lancada" ? "lancada" : "pendente",
    prazoNf: item.prazo_nf,
    linkExterno: item.link_externo,
    observacao: item.observacao,
  }));

  // Seções, tarefas e subtarefas só são buscadas quando a aba Demandas está aberta
  let secoesDasDemandas: Secao[] = [];
  if (aba === "demandas") {
    const { data, error } = await supabase
      .from("secoes")
      .select(
        "id, nome, tarefas(id, descricao, prazo, concluida, observacao, link_externo, subtarefas(id, descricao, prazo, concluida, observacao, ordem), ordem)",
      )
      .eq("evento_id", eventoId)
      .order("ordem")
      .order("criado_em")
      .order("ordem", { referencedTable: "tarefas" })
      .order("criado_em", { referencedTable: "tarefas" })
      .order("ordem", { referencedTable: "tarefas.subtarefas" })
      .order("criado_em", { referencedTable: "tarefas.subtarefas" });
    if (error) throw new Error(error.message);

    secoesDasDemandas = data.map((secao) => ({
      id: secao.id,
      nome: secao.nome,
      tarefas: secao.tarefas.map((tarefa) => ({
        id: tarefa.id,
        descricao: tarefa.descricao,
        prazo: tarefa.prazo,
        concluida: tarefa.concluida,
        observacao: tarefa.observacao,
        linkExterno: tarefa.link_externo,
        subtarefas: tarefa.subtarefas.map((subtarefa) => ({
          id: subtarefa.id,
          descricao: subtarefa.descricao,
          prazo: subtarefa.prazo,
          concluida: subtarefa.concluida,
          observacao: subtarefa.observacao,
        })),
      })),
    }));
  }

  const linkDoEvento = linkSeguro(evento.link_externo);
  const qtdTarefas = tarefasPendentes.count ?? 0;
  const totalTarefas = tarefasTotal.count ?? 0;
  const hoje = hojeSaoPaulo();

  // Números da faixa de resumo (só existe valor real; não há orçado)
  const totalReal = somarValores(itensDoOrcamento.map((i) => i.valorReal));
  const nfsAbertas = itensDoOrcamento.filter((i) => i.statusNf === "pendente");
  const nfsVencidas = nfsAbertas.filter((i) => i.prazoNf !== null && i.prazoNf < hoje).length;

  // "em 5 dias" conta a partir do começo; durante o evento mostra "em andamento"
  const inicio = evento.data_inicio;
  const fim = evento.data_fim ?? inicio;
  const contagem = !inicio
    ? null
    : hoje < inicio
      ? contagemDeDias(inicio, hoje)
      : fim && hoje <= fim
        ? "em andamento"
        : contagemDeDias(fim ?? inicio, hoje);

  return (
    <Pagina
      breadcrumb={[
        { rotulo: "Marcas", href: "/marcas" },
        { rotulo: evento.marcas.nome, href: `/marcas/${evento.marcas.id}` },
        { rotulo: evento.nome },
      ]}
      acoes={
        <AcoesDoEvento
          arquivado={evento.arquivado}
          evento={{
            id: evento.id,
            nome: evento.nome,
            tipo: evento.tipo,
            dataInicio: evento.data_inicio,
            dataFim: evento.data_fim,
            linkExterno: evento.link_externo,
            observacao: evento.observacao,
          }}
        />
      }
    >
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <FolderOpen className="size-3" aria-hidden />
          <span>
            {evento.tipo === "acao" ? "Ação" : "Evento"} ·{" "}
            <Link href={`/marcas/${evento.marcas.id}`} className="hover:text-foreground hover:underline">
              {evento.marcas.nome}
            </Link>
          </span>
          {evento.arquivado && <Badge variant="warning">Arquivado</Badge>}
        </div>
        <h1 className="text-display mt-1.5">{evento.nome}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden />
            <strong className="num font-medium text-foreground">
              {formatarIntervalo(evento.data_inicio, evento.data_fim)}
            </strong>
            {contagem && <>· {contagem}</>}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-3.5" aria-hidden />
            <strong className="num font-medium text-foreground">
              {totalTarefas - qtdTarefas} de {totalTarefas}
            </strong>
            tarefas concluídas
          </span>
          {linkDoEvento && (
            <a
              href={linkDoEvento}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
            >
              Abrir link do evento <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>

        {evento.observacao && (
          <p className="mt-3 max-w-3xl text-[13px] text-muted-foreground">
            {evento.observacao}
          </p>
        )}
      </header>

      <ResumoEvento
        totalReal={totalReal}
        nfsTotal={itensDoOrcamento.length}
        nfsPendentes={nfsAbertas.length}
        nfsVencidas={nfsVencidas}
        tarefasPendentes={qtdTarefas}
      />

      {/* Abas: cada uma é um link (a aba escolhida fica na URL) */}
      <Tabs value={aba} className="mt-7 mb-5">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="orcamento" asChild>
            <Link href={`/eventos/${eventoId}?aba=orcamento`}>
              <Receipt />
              Orçamento e NFs
              <Badge variant="neutral" className="num ml-1 h-5 px-1.5">
                {itensDoOrcamento.length}
              </Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="demandas" asChild>
            <Link href={`/eventos/${eventoId}?aba=demandas`}>
              <ListChecks />
              Demandas
              <Badge variant={qtdTarefas > 0 ? "danger" : "neutral"} className="num ml-1 h-5 px-1.5">
                {qtdTarefas}
              </Badge>
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {aba === "orcamento" ? (
        <PainelOrcamento itens={itensDoOrcamento} eventoId={eventoId} hoje={hoje} />
      ) : (
        <PainelDemandas
          secoes={secoesDasDemandas}
          eventoId={eventoId}
          marcaNome={evento.marcas.nome}
          eventoNome={evento.nome}
          hoje={hoje}
        />
      )}
    </Pagina>
  );
}
