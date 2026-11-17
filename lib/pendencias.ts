// Itens do Painel inicial: tudo o que tem data e ainda não foi concluído
// (tarefas, subtarefas, NFs pendentes, despesas recorrentes do mês e itens do
// Radar com prazo), mais o bloco "No Radar" com os itens do Radar sem prazo.

// Todos os tipos que a vw_pendencias devolve e que o app sabe mostrar.
// Quem conta linhas da view (lista de marcas, cabeçalho da marca) filtra por esta
// mesma lista, para os números baterem com o painel, que descarta tipos desconhecidos.
export const TIPOS_DE_PENDENCIA = [
  "tarefa",
  "subtarefa",
  "nf",
  "recorrente",
  "radar",
  "subitem_radar",
] as const;

export type TipoPendencia = (typeof TIPOS_DE_PENDENCIA)[number];

// Os dois tipos que moram no Radar da marca (não têm evento)
export type TipoRadar = Extract<TipoPendencia, "radar" | "subitem_radar">;

export type Pendencia = {
  chave: string; // "tipo:id" (o id sozinho pode repetir entre tabelas diferentes)
  id: string;
  tipo: TipoPendencia;
  titulo: string;
  data: string; // "AAAA-MM-DD": prazo, prazo da NF ou vencimento
  marcaId: string;
  marcaNome: string;
  eventoId: string | null; // recorrentes e itens do Radar não têm evento
  eventoNome: string | null;
  // Só para recorrentes: o painel precisa saber se o check já foi marcado
  // e se o valor real já foi preenchido.
  checkMarcado: boolean;
  valorReal: number | null;
};

// Item do Radar sem prazo: não está na vw_pendencias (não tem data para cair num
// grupo), aparece só no bloco "No Radar" do painel.
export type ItemRadarSemPrazo = {
  chave: string; // "tipo:id", igual a Pendencia
  id: string;
  tipo: TipoRadar;
  titulo: string;
  itemPai: string | null; // para subitens: a descrição do item principal
  marcaId: string;
  marcaNome: string;
};

export const ROTULOS_DO_TIPO: Record<TipoPendencia, string> = {
  tarefa: "Tarefa",
  subtarefa: "Subtarefa",
  nf: "NF",
  recorrente: "Recorrente",
  radar: "Radar",
  subitem_radar: "Subtarefa do Radar",
};

export function tipoValido(tipo: string | null): tipo is TipoPendencia {
  return (TIPOS_DE_PENDENCIA as readonly (string | null)[]).includes(tipo);
}

export function ehDoRadar(tipo: TipoPendencia): tipo is TipoRadar {
  return tipo === "radar" || tipo === "subitem_radar";
}

// Regra do painel: dentro de cada bloco, data crescente (empate: ordem alfabética)
export function ordenarPendencias(lista: Pendencia[]): Pendencia[] {
  return [...lista].sort(
    (a, b) =>
      a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

// Bloco "No Radar" do painel: sem data para ordenar, agrupa por marca (ordem
// alfabética) e, dentro da marca, pelo título
export function ordenarSemPrazo(lista: ItemRadarSemPrazo[]): ItemRadarSemPrazo[] {
  return [...lista].sort(
    (a, b) =>
      a.marcaNome.localeCompare(b.marcaNome, "pt-BR") ||
      a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

// Seção "No Radar" na tela da marca (âncora #radar)
export function enderecoDoRadar(marcaId: string): string {
  return `/marcas/${marcaId}#radar`;
}

// Para onde o clique no item leva:
// - tarefa e subtarefa → evento, aba Demandas
// - NF → evento, aba Orçamento
// - recorrente → tela da marca, já no mês da despesa
// - item e subitem do Radar → tela da marca, na seção No Radar
export function enderecoDaPendencia(item: Pendencia): string {
  if (ehDoRadar(item.tipo)) return enderecoDoRadar(item.marcaId);
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
