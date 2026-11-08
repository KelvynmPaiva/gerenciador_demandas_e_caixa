// Itens do Painel inicial: tudo o que tem data e ainda não foi concluído
// (tarefas, subtarefas, NFs pendentes e despesas recorrentes do mês).

export type TipoPendencia = "tarefa" | "subtarefa" | "nf" | "recorrente";

export type Pendencia = {
  chave: string; // "tipo:id" (o id sozinho pode repetir entre tabelas diferentes)
  id: string;
  tipo: TipoPendencia;
  titulo: string;
  data: string; // "AAAA-MM-DD": prazo, prazo da NF ou vencimento
  marcaId: string;
  marcaNome: string;
  eventoId: string | null; // recorrentes não têm evento
  eventoNome: string | null;
  // Só para recorrentes: o painel precisa saber se o check já foi marcado
  // e se o valor real já foi preenchido.
  checkMarcado: boolean;
  valorReal: number | null;
};

export const ROTULOS_DO_TIPO: Record<TipoPendencia, string> = {
  tarefa: "Tarefa",
  subtarefa: "Subtarefa",
  nf: "NF",
  recorrente: "Recorrente",
};

export function tipoValido(tipo: string | null): tipo is TipoPendencia {
  return (
    tipo === "tarefa" ||
    tipo === "subtarefa" ||
    tipo === "nf" ||
    tipo === "recorrente"
  );
}

// Regra do painel: dentro de cada bloco, data crescente (empate: ordem alfabética)
export function ordenarPendencias(lista: Pendencia[]): Pendencia[] {
  return [...lista].sort(
    (a, b) =>
      a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

// Para onde o clique no item leva:
// - tarefa e subtarefa → evento, aba Demandas
// - NF → evento, aba Orçamento
// - recorrente → tela da marca, já no mês da despesa
export function enderecoDaPendencia(item: Pendencia): string {
  if (item.tipo === "recorrente" || !item.eventoId) {
    return `/marcas/${item.marcaId}?mes=${item.data.slice(0, 7)}`;
  }
  const aba = item.tipo === "nf" ? "orcamento" : "demandas";
  return `/eventos/${item.eventoId}?aba=${aba}`;
}

// Recorrente com check marcado e sem valor real: continua no painel,
// com o aviso "Falta valor real" e um campo para preencher o valor.
export function faltaValorReal(item: Pendencia): boolean {
  return (
    item.tipo === "recorrente" && item.checkMarcado && item.valorReal === null
  );
}
