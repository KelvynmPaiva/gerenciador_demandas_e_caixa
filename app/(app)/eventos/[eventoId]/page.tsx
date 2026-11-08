import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Car, ExternalLink, ListChecks, Wallet } from "lucide-react";
import { Pagina } from "@/components/pagina";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hojeSaoPaulo } from "@/lib/datas";
import { formatarIntervalo, plural } from "@/lib/formato";
import { linkSeguro } from "@/lib/links";
import { createClient } from "@/lib/supabase/server";
import { AcoesDoEvento } from "./acoes-do-evento";
import type { Secao } from "./demandas-tipos";
import { PainelDemandas } from "./painel-demandas";
import { PainelOrcamento, type ItemOrcamento } from "./painel-orcamento";

// Estilo da aba: sublinhado azul na ativa (o sublinhado "encosta" na linha do cabeçalho)
const estiloAba =
  "h-full! flex-none rounded-none px-1 text-muted-foreground hover:text-foreground data-active:text-primary group-data-horizontal/tabs:after:bottom-[-1px]! after:bg-primary";

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

  const [itens, tarefasPendentes] = await Promise.all([
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
  ]);
  if (itens.error) throw new Error(itens.error.message);

  const itensDoOrcamento: ItemOrcamento[] = itens.data.map((item) => ({
    id: item.id,
    servico: item.servico,
    fornecedor: item.fornecedor,
    valorOrcado: item.valor_orcado,
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

  return (
    <Pagina
      breadcrumb={[
        { rotulo: "Marcas", href: "/marcas" },
        { rotulo: evento.marcas.nome, href: `/marcas/${evento.marcas.id}` },
        { rotulo: evento.nome },
      ]}
    >
      <section className="mb-6 rounded-xl border bg-card px-6 pt-6 shadow-xs">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="neutro" className="tracking-[0.05em] uppercase">
                {evento.tipo === "acao" ? "Ação" : "Evento"}
              </Badge>
              {evento.arquivado && <Badge variant="atencao">Arquivado</Badge>}
            </div>
            <h1 className="mt-2 text-[30px] font-semibold leading-[38px] tracking-[-0.02em]">
              {evento.nome}
            </h1>
          </div>
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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/marcas/${evento.marcas.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 hover:text-primary"
          >
            <Car className="size-4 text-muted-foreground" />
            {evento.marcas.nome}
          </Link>
          <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            <CalendarDays className="size-4 text-muted-foreground" />
            {formatarIntervalo(evento.data_inicio, evento.data_fim)}
          </span>
          {linkDoEvento && (
            <a
              href={linkDoEvento}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 font-medium text-primary hover:underline"
            >
              Abrir link do evento <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>

        {evento.observacao && (
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            {evento.observacao}
          </p>
        )}

        {/* Abas: cada uma é um link (a aba escolhida fica na URL) */}
        <Tabs value={aba} className="mt-5">
          <TabsList
            variant="line"
            className="w-full justify-start gap-6 rounded-none border-b p-0 group-data-horizontal/tabs:h-11!"
          >
            <TabsTrigger value="orcamento" className={estiloAba} asChild>
              <Link href={`/eventos/${eventoId}?aba=orcamento`}>
                <Wallet />
                Orçamento
                <Badge variant="secondary" className="ml-1">
                  {plural(itensDoOrcamento.length, "item", "itens")}
                </Badge>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="demandas" className={estiloAba} asChild>
              <Link href={`/eventos/${eventoId}?aba=demandas`}>
                <ListChecks />
                Demandas
                <Badge
                  variant={qtdTarefas > 0 ? "atencao" : "secondary"}
                  className="ml-1"
                >
                  {plural(qtdTarefas, "pendência", "pendências")}
                </Badge>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </section>

      {aba === "orcamento" ? (
        <PainelOrcamento
          itens={itensDoOrcamento}
          eventoId={eventoId}
          hoje={hojeSaoPaulo()}
        />
      ) : (
        <PainelDemandas
          secoes={secoesDasDemandas}
          eventoId={eventoId}
          marcaNome={evento.marcas.nome}
          eventoNome={evento.nome}
          hoje={hojeSaoPaulo()}
        />
      )}
    </Pagina>
  );
}
