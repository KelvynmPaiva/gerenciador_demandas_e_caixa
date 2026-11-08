import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pagina } from "@/components/pagina";
import { Badge } from "@/components/ui/badge";
import {
  diaDaSemanaPorExtenso,
  fimDaProximaSemana,
  hojeSaoPaulo,
  horaSaoPaulo,
} from "@/lib/datas";
import { formatarData, plural } from "@/lib/formato";
import { gerarOcorrenciasDoMesAtualEProximo } from "@/lib/ocorrencias";
import {
  ordenarPendencias,
  tipoValido,
  type Pendencia,
} from "@/lib/pendencias";
import { createClient } from "@/lib/supabase/server";
import { BlocosPainel } from "./blocos-painel";

function saudacao(): string {
  const hora = horaSaoPaulo();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function PainelPage() {
  const supabase = await createClient();
  const hoje = hojeSaoPaulo();
  const limite = fimDaProximaSemana(hoje); // domingo da próxima semana

  // Ao abrir o painel, as despesas recorrentes do mês atual e do próximo já existem
  // (a função do banco não duplica).
  await gerarOcorrenciasDoMesAtualEProximo(supabase);

  const [pendencias, ocorrencias, marcas] = await Promise.all([
    // Tudo que está atrasado ou vence até o fim da próxima semana
    supabase.from("vw_pendencias").select("*").lte("data", limite),
    // A view não diz se o check da despesa recorrente já foi marcado: busca aqui
    supabase
      .from("ocorrencias_mensais")
      .select("id, check_marcado, valor_real")
      .eq("concluida", false)
      .lte("vencimento", limite),
    supabase
      .from("marcas")
      .select("id, nome")
      .eq("ativa", true)
      .order("ordem")
      .order("nome"),
  ]);

  const erro = pendencias.error ?? ocorrencias.error ?? marcas.error;
  if (erro) throw new Error(erro.message);

  const listaDeMarcas = marcas.data ?? [];
  const situacaoDasOcorrencias = new Map(
    (ocorrencias.data ?? []).map((o) => [o.id, o] as const),
  );

  const itens: Pendencia[] = [];
  for (const linha of pendencias.data ?? []) {
    if (
      !linha.id ||
      !linha.titulo ||
      !linha.data ||
      !linha.marca_id ||
      !linha.marca_nome ||
      !tipoValido(linha.tipo)
    ) {
      continue;
    }
    const ocorrencia =
      linha.tipo === "recorrente" ? situacaoDasOcorrencias.get(linha.id) : null;

    itens.push({
      chave: `${linha.tipo}:${linha.id}`,
      id: linha.id,
      tipo: linha.tipo,
      titulo: linha.titulo,
      data: linha.data,
      marcaId: linha.marca_id,
      marcaNome: linha.marca_nome,
      eventoId: linha.evento_id,
      eventoNome: linha.evento_nome,
      checkMarcado: ocorrencia?.check_marcado ?? false,
      valorReal: ocorrencia?.valor_real ?? null,
    });
  }

  // Quantas pendências cada marca tem (mesma conta da tela Marcas)
  const pendenciasPorMarca = new Map<string, number>();
  for (const item of itens) {
    pendenciasPorMarca.set(
      item.marcaId,
      (pendenciasPorMarca.get(item.marcaId) ?? 0) + 1,
    );
  }

  const diaDaSemana = diaDaSemanaPorExtenso(hoje);

  return (
    <Pagina breadcrumb={[{ rotulo: "Painel" }]}>
      <div className="mb-6 border-b pb-5">
        <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-0.02em]">
          {saudacao()}, equipe
        </h1>
        <p className="mt-1 text-muted-foreground">
          {diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1)},{" "}
          {formatarData(hoje)}
        </p>
      </div>

      <BlocosPainel pendencias={ordenarPendencias(itens)} hoje={hoje} />

      <section className="mt-12" aria-labelledby="atalho-marcas">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2
            id="atalho-marcas"
            className="text-2xl font-semibold leading-8 tracking-[-0.02em]"
          >
            Atalho para Marcas
          </h2>
          <Link
            href="/marcas"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver todas as marcas <ArrowRight className="size-4" />
          </Link>
        </div>

        {listaDeMarcas.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma marca ativa. Crie a primeira na tela Marcas.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
            {listaDeMarcas.map((marca) => {
              const qtd = pendenciasPorMarca.get(marca.id) ?? 0;
              return (
                <Link
                  key={marca.id}
                  href={`/marcas/${marca.id}`}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <span className="truncate text-lg font-semibold tracking-[-0.015em]">
                    {marca.nome}
                  </span>
                  {qtd > 0 ? (
                    <Badge variant="perigo">
                      {plural(qtd, "pendência", "pendências")}
                    </Badge>
                  ) : (
                    <Badge variant="sucesso">Em dia</Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </Pagina>
  );
}
