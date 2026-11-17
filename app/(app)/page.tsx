import Link from "next/link";
import { Pagina } from "@/components/pagina";
import { StatusBadge } from "@/components/status-badge";
import {
  diaDaSemanaPorExtenso,
  fimDaProximaSemana,
  hojeSaoPaulo,
  horaSaoPaulo,
} from "@/lib/datas";
import { formatarData, plural } from "@/lib/formato";
import {
  ordenarPendencias,
  ordenarSemPrazo,
  tipoValido,
  type ItemRadarSemPrazo,
  type Pendencia,
} from "@/lib/pendencias";
import { listarMarcasAtivas } from "@/lib/marcas";
import { rotuloRelativo } from "@/lib/prazo";
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

  // Despesas recorrentes entram aqui só quando cadastradas no mês (não há geração automática).
  const [pendencias, ocorrencias, marcas, radarSemPrazo, subitensSemPrazo] =
    await Promise.all([
      // Tudo que está atrasado ou vence até o fim da próxima semana
      // (inclui itens e subitens do Radar COM prazo)
      supabase.from("vw_pendencias").select("*").lte("data", limite),
      // A view não diz se o check da despesa recorrente já foi marcado: busca aqui
      supabase
        .from("ocorrencias_mensais")
        .select("id, check_marcado, valor_real")
        .eq("concluida", false)
        .lte("vencimento", limite),
      listarMarcasAtivas(), // já buscada pelo layout nesta requisição (cache)
      // Bloco "No Radar": itens sem prazo não estão na view (não têm data).
      // Mesmo critério da view para os com prazo: pendente e ainda não promovido.
      supabase
        .from("itens_radar")
        .select("id, descricao, marca_id, marcas(nome)")
        .eq("concluida", false)
        .is("prazo", null)
        .is("promovido_em", null),
      // Subitens sem prazo, só se o item principal estiver pendente e não promovido
      // (a view faz o mesmo com os subitens com prazo)
      supabase
        .from("subitens_radar")
        .select(
          "id, descricao, itens_radar!inner(descricao, marca_id, concluida, promovido_em, marcas(nome))",
        )
        .eq("concluida", false)
        .is("prazo", null)
        .eq("itens_radar.concluida", false)
        .is("itens_radar.promovido_em", null),
    ]);

  const erro =
    pendencias.error ??
    ocorrencias.error ??
    marcas.error ??
    radarSemPrazo.error ??
    subitensSemPrazo.error;
  if (erro) throw new Error(erro.message);

  const semPrazo: ItemRadarSemPrazo[] = [
    ...(radarSemPrazo.data ?? []).map((item) => ({
      chave: `radar:${item.id}`,
      id: item.id,
      tipo: "radar" as const,
      titulo: item.descricao,
      itemPai: null,
      marcaId: item.marca_id,
      marcaNome: item.marcas.nome,
    })),
    ...(subitensSemPrazo.data ?? []).map((subitem) => ({
      chave: `subitem_radar:${subitem.id}`,
      id: subitem.id,
      tipo: "subitem_radar" as const,
      titulo: subitem.descricao,
      itemPai: subitem.itens_radar.descricao,
      marcaId: subitem.itens_radar.marca_id,
      marcaNome: subitem.itens_radar.marcas.nome,
    })),
  ];

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

  // Por marca: quantas pendências, quantas atrasadas e a data da mais próxima
  // (mesma conta da tela Marcas)
  const porMarca = new Map<string, { qtd: number; atrasadas: number; proxima: string }>();
  for (const item of itens) {
    const atual = porMarca.get(item.marcaId) ?? { qtd: 0, atrasadas: 0, proxima: item.data };
    atual.qtd += 1;
    if (item.data < hoje) atual.atrasadas += 1;
    if (item.data < atual.proxima) atual.proxima = item.data;
    porMarca.set(item.marcaId, atual);
  }
  // Quem tem mais atraso aparece primeiro; depois mais pendências; depois ordem alfabética
  const marcasOrdenadas = [...listaDeMarcas].sort((a, b) => {
    const ra = porMarca.get(a.id);
    const rb = porMarca.get(b.id);
    return (
      (rb?.atrasadas ?? 0) - (ra?.atrasadas ?? 0) ||
      (rb?.qtd ?? 0) - (ra?.qtd ?? 0) ||
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  });

  const diaDaSemana = diaDaSemanaPorExtenso(hoje);

  return (
    <Pagina breadcrumb={[{ rotulo: "Painel" }]}>
      <div className="mx-auto max-w-[1080px]">
        <p className="text-xs text-muted-foreground">
          {diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1)},{" "}
          {formatarData(hoje)}
        </p>
        <h1 className="text-display mt-1">{saudacao()}, equipe</h1>

        <BlocosPainel
          pendencias={ordenarPendencias(itens)}
          radarSemPrazo={ordenarSemPrazo(semPrazo)}
          hoje={hoje}
        >
          <aside aria-labelledby="marcas-do-painel" className="rounded-lg border bg-card shadow-xs">
            <div className="flex items-center px-4 pt-3 pb-1.5">
              <h2 id="marcas-do-painel" className="text-sm font-semibold">
                Marcas
              </h2>
              <Link
                href="/marcas"
                className="ml-auto text-[12.5px] font-medium text-brand hover:underline"
              >
                Ver todas
              </Link>
            </div>
            {marcasOrdenadas.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-muted-foreground">
                Nenhuma marca ativa. Crie a primeira na tela Marcas.
              </p>
            ) : (
              <ul className="pb-1.5">
                {marcasOrdenadas.map((marca) => {
                  const resumo = porMarca.get(marca.id);
                  return (
                    <li key={marca.id}>
                      <Link
                        href={`/marcas/${marca.id}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-2 px-4 py-2 transition-colors hover:bg-row-hover"
                      >
                        <span className="truncate text-[13px] font-semibold uppercase tracking-wide">
                          {marca.nome}
                        </span>
                        {resumo && resumo.atrasadas > 0 ? (
                          <StatusBadge tone="danger" className="h-5">
                            {plural(resumo.atrasadas, "atrasada", "atrasadas")}
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="success" className="h-5">
                            Em dia
                          </StatusBadge>
                        )}
                        <span className="col-span-2 text-xs text-muted-foreground">
                          {resumo
                            ? `${plural(resumo.qtd, "pendência", "pendências")} · próx. ${rotuloRelativo(resumo.proxima, hoje).toLowerCase()}`
                            : "Nada pendente"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </BlocosPainel>
      </div>
    </Pagina>
  );
}
