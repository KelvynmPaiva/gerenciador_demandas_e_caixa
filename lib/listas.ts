// Regras de listas compartilhadas pelas tabelas (Orçamento, Notas recorrentes, subtarefas).

// Pendentes em cima, concluídos/lançados embaixo. Só o status move o item:
// dentro de cada grupo a ordem recebida é mantida (a ordenação é estável),
// então editar a data ou o texto de um item não o tira do lugar no grupo.
export function pendentesPrimeiro<T>(
  lista: T[],
  concluido: (item: T) => boolean,
): T[] {
  const pendentes: T[] = [];
  const concluidos: T[] = [];
  for (const item of lista) (concluido(item) ? concluidos : pendentes).push(item);
  return [...pendentes, ...concluidos];
}

// A coluna (Observação, Link...) só aparece se ao menos um item tiver conteúdo.
// Texto só com espaços não conta: o banco já grava vazio como null, mas a
// tela otimista pode ter o texto antes de passar pelo servidor.
export function temConteudo<T>(
  lista: T[],
  campo: (item: T) => string | null | undefined,
): boolean {
  return lista.some((item) => (campo(item) ?? "").trim() !== "");
}
