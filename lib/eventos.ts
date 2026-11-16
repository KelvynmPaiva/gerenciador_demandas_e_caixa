import type { createClient } from "@/lib/supabase/server";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

// Números que aparecem no cartão de cada evento
export type ResumoDoEvento = {
  totalReal: number; // soma do valor real de todos os itens do orçamento
  nfsPendentes: number; // itens com NF ainda "Lançamento pendente"
  nfsVencidas: number; // dessas, as que já passaram do prazo para lançar (só conta se "hoje" for informado)
  tarefasPendentes: number; // tarefas (de qualquer seção) ainda não concluídas
};

export const RESUMO_VAZIO: ResumoDoEvento = {
  totalReal: 0,
  nfsPendentes: 0,
  nfsVencidas: 0,
  tarefasPendentes: 0,
};

// Conta pura (sem banco), separada para poder ser testada.
export function montarResumos(
  eventoIds: string[],
  itens: {
    evento_id: string;
    valor_real: number | null;
    status_nf: string;
    prazo_nf?: string | null;
  }[],
  tarefas: { secoes: { evento_id: string } }[],
  hoje?: string, // "AAAA-MM-DD" em São Paulo
): Map<string, ResumoDoEvento> {
  const resumos = new Map<string, ResumoDoEvento>();
  for (const id of eventoIds) resumos.set(id, { ...RESUMO_VAZIO });

  for (const item of itens) {
    const resumo = resumos.get(item.evento_id);
    if (!resumo) continue;
    resumo.totalReal += item.valor_real ?? 0;
    if (item.status_nf === "pendente") {
      resumo.nfsPendentes += 1;
      if (hoje && item.prazo_nf && item.prazo_nf < hoje) resumo.nfsVencidas += 1;
    }
  }

  for (const tarefa of tarefas) {
    const resumo = resumos.get(tarefa.secoes.evento_id);
    if (resumo) resumo.tarefasPendentes += 1;
  }

  // Evita sobras de centavos da soma de números decimais
  for (const resumo of resumos.values()) {
    resumo.totalReal = Math.round(resumo.totalReal * 100) / 100;
  }

  return resumos;
}

// Calcula o resumo de vários eventos de uma vez (2 consultas, em vez de 2 por evento).
export async function resumirEventos(
  supabase: ClienteSupabase,
  eventoIds: string[],
  hoje?: string,
): Promise<Map<string, ResumoDoEvento>> {
  if (eventoIds.length === 0) return new Map();

  const [itens, tarefas] = await Promise.all([
    supabase
      .from("itens_orcamento")
      .select("evento_id, valor_real, status_nf, prazo_nf")
      .in("evento_id", eventoIds),
    supabase
      .from("tarefas")
      .select("id, secoes!inner(evento_id)")
      .eq("concluida", false)
      .in("secoes.evento_id", eventoIds),
  ]);

  const erro = itens.error ?? tarefas.error;
  if (erro) throw new Error(erro.message);

  return montarResumos(eventoIds, itens.data ?? [], tarefas.data ?? [], hoje);
}
