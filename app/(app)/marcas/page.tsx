import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pagina } from "@/components/pagina";
import { Badge } from "@/components/ui/badge";
import { fimDaProximaSemana, hojeSaoPaulo } from "@/lib/datas";
import { plural } from "@/lib/formato";
import { listarMarcasAtivas } from "@/lib/marcas";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { MenuMarca } from "./menu-marca";
import { NovaMarca } from "./nova-marca";

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
  const limiteDoPainel = fimDaProximaSemana(hojeSaoPaulo());

  const [marcas, eventos, pendencias] = await Promise.all([
    listarMarcasAtivas(), // já buscada pelo layout nesta requisição (cache)
    supabase.from("eventos").select("marca_id").eq("arquivado", false),
    // Pendências = o mesmo que aparece no Painel: itens atrasados ou
    // com data até o domingo da próxima semana.
    supabase.from("vw_pendencias").select("marca_id").lte("data", limiteDoPainel),
  ]);

  const erro = marcas.error ?? eventos.error ?? pendencias.error;
  if (erro) throw new Error(erro.message);

  const listaDeMarcas = marcas.data ?? [];
  const eventosPorMarca = contarPorMarca(eventos.data);
  const pendenciasPorMarca = contarPorMarca(pendencias.data);

  return (
    <Pagina breadcrumb={[{ rotulo: "Marcas" }]}>
      <div className="mb-6 flex items-end justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-0.02em]">
            Marcas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestão das marcas e visão geral das demandas.
          </p>
        </div>
        <NovaMarca />
      </div>

      {listaDeMarcas.length === 0 && (
        <p className="mb-4 text-muted-foreground">
          Nenhuma marca ativa. Crie a primeira no cartão abaixo.
        </p>
      )}

      <div className="grid grid-cols-3 gap-5">
        {listaDeMarcas.map((marca, indice) => {
          const qtdEventos = eventosPorMarca.get(marca.id) ?? 0;
          const qtdPendencias = pendenciasPorMarca.get(marca.id) ?? 0;

          return (
            <article
              key={marca.id}
              className="flex flex-col rounded-xl border bg-card shadow-xs"
            >
              <div className="flex items-start gap-3 p-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-bold">
                  {marca.nome.trim().slice(0, 3).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/marcas/${marca.id}`}
                    className="block truncate text-lg font-semibold tracking-[-0.015em] hover:text-primary"
                  >
                    {marca.nome}
                  </Link>
                  <div className="mt-1.5">
                    {qtdPendencias > 0 ? (
                      <Badge variant="perigo">
                        {plural(qtdPendencias, "pendência", "pendências")}
                      </Badge>
                    ) : (
                      <Badge variant="sucesso">Em dia</Badge>
                    )}
                  </div>
                </div>
                <MenuMarca
                  id={marca.id}
                  nome={marca.nome}
                  podeSubir={indice > 0}
                  podeDescer={indice < listaDeMarcas.length - 1}
                />
              </div>

              <div className="mx-5 mb-5 grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Eventos ativos</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {qtdEventos}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendências</p>
                  <p
                    className={cn(
                      "text-2xl font-semibold tabular-nums",
                      qtdPendencias > 0 ? "text-perigo" : "text-sucesso",
                    )}
                  >
                    {qtdPendencias}
                  </p>
                </div>
              </div>

              <div className="mt-auto border-t px-5 py-3">
                <Link
                  href={`/marcas/${marca.id}`}
                  className="flex items-center justify-end gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Acessar marca <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          );
        })}

        <NovaMarca variante="cartao" />
      </div>
    </Pagina>
  );
}
