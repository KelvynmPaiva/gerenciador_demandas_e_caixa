import Link from "next/link";
import { Tag } from "lucide-react";
import { DateChip } from "@/components/date-chip";
import { EmptyState } from "@/components/empty-state";
import { Pagina } from "@/components/pagina";
import { StatusBadge } from "@/components/status-badge";
import { fimDaProximaSemana, hojeSaoPaulo } from "@/lib/datas";
import { plural } from "@/lib/formato";
import { listarMarcasAtivas } from "@/lib/marcas";
import { TIPOS_DE_PENDENCIA } from "@/lib/pendencias";
import { createClient } from "@/lib/supabase/server";
import { MenuMarca } from "./menu-marca";
import { NovaMarca } from "./nova-marca";

// Colunas da lista (desktop). No celular cada marca vira um bloco empilhado.
const COLUNAS = "md:grid-cols-[minmax(0,1fr)_110px_140px_150px_40px]";

// Conta quantas linhas existem para cada marca → { id da marca: quantidade }
function contarPorMarca(linhas: { marca_id: string | null }[] | null) {
  const contagem = new Map<string, number>();
  for (const linha of linhas ?? []) {
    if (linha.marca_id) {
      contagem.set(linha.marca_id, (contagem.get(linha.marca_id) ?? 0) + 1);
    }
  }
  return contagem;
}

export default async function MarcasPage() {
  const supabase = await createClient();
  const hoje = hojeSaoPaulo();
  const limiteDoPainel = fimDaProximaSemana(hoje);

  const [marcas, eventos, pendencias] = await Promise.all([
    listarMarcasAtivas(), // já buscada pelo layout nesta requisição (cache)
    supabase.from("eventos").select("marca_id").eq("arquivado", false),
    // Pendências = o mesmo que aparece no Painel: itens atrasados ou
    // com data até o domingo da próxima semana (inclui o Radar com prazo).
    // Só os tipos que o Painel mostra, para os números baterem com ele.
    supabase
      .from("vw_pendencias")
      .select("marca_id, data")
      .in("tipo", [...TIPOS_DE_PENDENCIA])
      .lte("data", limiteDoPainel),
  ]);

  const erro = marcas.error ?? eventos.error ?? pendencias.error;
  if (erro) throw new Error(erro.message);

  const listaDeMarcas = marcas.data ?? [];
  const eventosPorMarca = contarPorMarca(eventos.data);
  const pendenciasPorMarca = contarPorMarca(pendencias.data);
  // Próximo prazo de cada marca (o mais antigo ainda pendente)
  const proximoPrazo = new Map<string, string>();
  for (const linha of pendencias.data ?? []) {
    if (!linha.marca_id || !linha.data) continue;
    const atual = proximoPrazo.get(linha.marca_id);
    if (!atual || linha.data < atual) proximoPrazo.set(linha.marca_id, linha.data);
  }

  return (
    <Pagina breadcrumb={[{ rotulo: "Marcas" }]}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display">Marcas</h1>
          <p className="mt-1.5 text-muted-foreground">
            Gestão das marcas e visão geral das demandas.
          </p>
        </div>
        <NovaMarca />
      </div>

      {listaDeMarcas.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card">
          <EmptyState
            icon={Tag}
            title="Nenhuma marca ativa"
            text="Use “Nova marca” para criar a primeira."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
          <div
            className={`hidden h-[34px] items-center gap-4 bg-muted px-4 text-xs font-medium text-muted-foreground md:grid ${COLUNAS}`}
          >
            <span>Marca</span>
            <span className="text-right">Eventos ativos</span>
            <span>Pendências</span>
            <span>Próximo prazo</span>
            <span className="sr-only">Ações</span>
          </div>
          <ul>
            {listaDeMarcas.map((marca, indice) => {
              const qtdEventos = eventosPorMarca.get(marca.id) ?? 0;
              const qtdPendencias = pendenciasPorMarca.get(marca.id) ?? 0;
              const proximo = proximoPrazo.get(marca.id) ?? null;

              return (
                <li
                  key={marca.id}
                  className={`relative grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-t border-border-subtle px-4 py-3 transition-colors first:border-t-0 hover:bg-row-hover md:py-0 ${COLUNAS}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted text-[11px] font-bold">
                      {marca.nome.trim().slice(0, 3).toUpperCase()}
                    </div>
                    {/* O link cobre a linha toda; o menu "…" fica por cima (z-10) */}
                    <Link
                      href={`/marcas/${marca.id}`}
                      className="truncate text-[13.5px] font-semibold after:absolute after:inset-0 hover:underline hover:underline-offset-3"
                    >
                      {marca.nome}
                    </Link>
                  </div>

                  <div className="relative z-10 row-start-1 justify-self-end md:order-last md:row-auto">
                    <MenuMarca
                      id={marca.id}
                      nome={marca.nome}
                      podeSubir={indice > 0}
                      podeDescer={indice < listaDeMarcas.length - 1}
                    />
                  </div>

                  <span className="num text-[13px] text-muted-foreground md:text-right md:text-foreground">
                    <span className="md:hidden">Eventos ativos: </span>
                    {qtdEventos}
                  </span>
                  <span>
                    {qtdPendencias > 0 ? (
                      <StatusBadge tone="danger">
                        {plural(qtdPendencias, "pendência", "pendências")}
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Em dia</StatusBadge>
                    )}
                  </span>
                  <span>
                    {proximo ? (
                      <DateChip data={proximo} hoje={hoje} />
                    ) : (
                      <span className="text-[12.5px] text-subtle-foreground">Nada pendente</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Pagina>
  );
}
