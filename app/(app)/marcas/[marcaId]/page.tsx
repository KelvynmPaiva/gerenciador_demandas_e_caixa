import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoNovoEvento } from "@/app/(app)/eventos/dialogo-evento";
import { Pagina } from "@/components/pagina";
import { Badge } from "@/components/ui/badge";
import { fimDaProximaSemana, hojeSaoPaulo, lerMes } from "@/lib/datas";
import { resumirEventos } from "@/lib/eventos";
import { plural } from "@/lib/formato";
import { gerarOcorrenciasDoMesAtualEProximo } from "@/lib/ocorrencias";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { CartaoEvento } from "./cartao-evento";
import { BotaoNovaNota } from "./dialogo-nota";
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

  // Garante que as despesas do mês atual e do próximo já existem (não duplica).
  // Começa já, mas só a tabela do mês e a contagem de pendências precisam esperar:
  // o resto das consultas roda enquanto o banco gera as despesas.
  const geradas = gerarOcorrenciasDoMesAtualEProximo(supabase);

  const [
    { data: marca },
    notasAtivas,
    eventosAtivos,
    eventos,
  ] = await Promise.all([
    // Marca inexistente (ou id inválido na URL) → página "não encontrada"
    supabase
      .from("marcas")
      .select("id, nome, ativa")
      .eq("id", marcaId)
      .maybeSingle(),
    supabase
      .from("notas_recorrentes")
      .select("id", { count: "exact", head: true })
      .eq("marca_id", marcaId)
      .eq("ativa", true),
    supabase
      .from("eventos")
      .select("id", { count: "exact", head: true })
      .eq("marca_id", marcaId)
      .eq("arquivado", false),
    // Eventos da lista (ativos ou arquivados, conforme o filtro). Os mais próximos primeiro.
    supabase
      .from("eventos")
      .select("id, nome, tipo, data_inicio, data_fim")
      .eq("marca_id", marcaId)
      .eq("arquivado", verArquivados)
      .order("data_inicio", { ascending: true, nullsFirst: false })
      .order("criado_em", { ascending: false }),
  ]);
  if (!marca) {
    await geradas;
    notFound();
  }
  if (eventos.error) throw new Error(eventos.error.message);

  await geradas;

  const [ocorrencias, pendencias, resumos] = await Promise.all([
    supabase
      .from("ocorrencias_mensais")
      .select(
        "id, nome, vencimento, valor_previsto, valor_real, check_marcado, observacao, notas_recorrentes!inner(id, nome, valor_previsto, dia_vencimento, observacao, ativa, marca_id)",
      )
      .eq("notas_recorrentes.marca_id", marcaId)
      .eq("mes_referencia", `${mes}-01`)
      .order("vencimento")
      .order("nome"),
    // Pendências = o mesmo que aparece no Painel: atrasado ou até o domingo da próxima semana
    supabase
      .from("vw_pendencias")
      .select("id", { count: "exact", head: true })
      .eq("marca_id", marcaId)
      .lte("data", fimDaProximaSemana(hoje)),
    resumirEventos(
      supabase,
      eventos.data.map((evento) => evento.id),
    ),
  ]);

  if (ocorrencias.error) throw new Error(ocorrencias.error.message);

  const linhas: LinhaOcorrencia[] = ocorrencias.data.map((o) => ({
    id: o.id,
    nome: o.nome,
    vencimento: o.vencimento,
    valorPrevisto: o.valor_previsto,
    valorReal: o.valor_real,
    checkMarcado: o.check_marcado,
    observacao: o.observacao,
    nota: {
      id: o.notas_recorrentes.id,
      nome: o.notas_recorrentes.nome,
      valorPrevisto: o.notas_recorrentes.valor_previsto,
      diaVencimento: o.notas_recorrentes.dia_vencimento,
      observacao: o.notas_recorrentes.observacao,
      ativa: o.notas_recorrentes.ativa,
    },
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
      "rounded-md px-3 py-1 text-sm transition-colors",
      ativa
        ? "bg-card font-medium text-foreground shadow-xs"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <Pagina
      breadcrumb={[{ rotulo: "Marcas", href: "/marcas" }, { rotulo: marca.nome }]}
    >
      <div className="mb-8 border-b pb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-0.02em]">
            {marca.nome}
          </h1>
          {!marca.ativa && <Badge variant="neutro">Desativada</Badge>}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
          <span>
            {plural(eventosAtivos.count ?? 0, "evento ativo", "eventos ativos")}
          </span>
          <span aria-hidden>•</span>
          <span>
            {plural(
              notasAtivas.count ?? 0,
              "nota recorrente",
              "notas recorrentes",
            )}
          </span>
          <span aria-hidden>•</span>
          <span className={cn(qtdPendencias > 0 && "font-medium text-perigo")}>
            {plural(qtdPendencias, "pendência", "pendências")}
          </span>
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-semibold leading-8 tracking-[-0.02em]">
              Notas recorrentes do mês
            </h2>
            <SeletorMes
              marcaId={marcaId}
              mes={mes}
              mesAtual={mesAtual}
              eventosArquivados={verArquivados}
            />
          </div>
          <BotaoNovaNota marcaId={marcaId} />
        </div>

        {/* "key" faz a tabela recomeçar ao trocar de mês */}
        <TabelaOcorrencias
          key={mes}
          ocorrencias={linhas}
          marcaId={marcaId}
          hoje={hoje}
        />
      </section>

      <section id="eventos" className="mt-12 scroll-mt-20">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-semibold leading-8 tracking-[-0.02em]">
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

        {eventos.data.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center text-muted-foreground">
            {verArquivados
              ? "Nenhum evento arquivado."
              : "Nenhum evento ativo. Use “Novo evento” para criar o primeiro."}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {eventos.data.map((evento) => (
              <CartaoEvento
                key={evento.id}
                evento={evento}
                resumo={
                  resumos.get(evento.id) ?? {
                    totalOrcado: 0,
                    nfsPendentes: 0,
                    tarefasPendentes: 0,
                  }
                }
              />
            ))}
          </div>
        )}
      </section>
    </Pagina>
  );
}
