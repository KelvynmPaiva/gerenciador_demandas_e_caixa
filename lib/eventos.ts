import type { createClient } from "@/lib/supabase/server";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

// Números que aparecem no cartão de cada evento
export type ResumoDoEvento = {
  totalOrcado: number; // soma do valor orçado de todos os itens do orçamento
  nfsPendentes: number; // itens com NF ainda "Lançamento pendente"
  tarefasPendentes: number; // tarefas (de qualquer seção) ainda não concluídas
};

// Calcula o resumo de vários eventos de uma vez (2 consultas, em vez de 2 por evento).
export async function resumirEventos(
  supabase: ClienteSupabase,
  eventoIds: string[],
): Promise<Map<string, ResumoDoEvento>> {
  const resumos = new Map<string, ResumoDoEvento>();
  for (const id of eventoIds) {
    resumos.set(id, { totalOrcado: 0, nfsPendentes: 0, tarefasPendentes: 0 });
  }
  if (eventoIds.length === 0) return resumos;

  const [itens, tarefas] = await Promise.all([
    supabase
      .from("itens_orcamento")
      .select("evento_id, valor_orcado, status_nf")
      .in("evento_id", eventoIds),
    supabase
      .from("tarefas")
      .select("id, secoes!inner(evento_id)")
      .eq("concluida", false)
      .in("secoes.evento_id", eventoIds),
  ]);

  const erro = itens.error ?? tarefas.error;
  if (erro) throw new Error(erro.message);

  for (const item of itens.data ?? []) {
    const resumo = resumos.get(item.evento_id);
    if (!resumo) continue;
    resumo.totalOrcado += item.valor_orcado ?? 0;
    if (item.status_nf === "pendente") resumo.nfsPendentes += 1;
  }

  for (const tarefa of tarefas.data ?? []) {
    const resumo = resumos.get(tarefa.secoes.evento_id);
    if (resumo) resumo.tarefasPendentes += 1;
  }

  // Evita sobras de centavos da soma de números decimais
  for (const resumo of resumos.values()) {
    resumo.totalOrcado = Math.round(resumo.totalOrcado * 100) / 100;
  }

  return resumos;
}
