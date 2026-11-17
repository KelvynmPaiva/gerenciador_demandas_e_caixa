// Status de despesas e NFs: só dois em todo o app, "Pendente" e "Lançado".
// Fonte única do texto: painel, orçamento, notas recorrentes, avisos e leitores de tela
// leem daqui, para não voltar a existir "Lançamento pendente", "Lançada" ou "Concluída".
//
// O valor gravado no banco continua "pendente" / "lancada" (check de itens_orcamento.status_nf):
// só o texto exibido mudou, então não há migração de dados.

export type StatusLancamento = "pendente" | "lancada";

export const ROTULO_DO_STATUS: Record<StatusLancamento, string> = {
  pendente: "Pendente",
  lancada: "Lançado",
};

// Cores do StatusBadge: pendente em vermelho, lançado em verde
export const TOM_DO_STATUS: Record<StatusLancamento, "danger" | "success"> = {
  pendente: "danger",
  lancada: "success",
};

export function statusOposto(status: StatusLancamento): StatusLancamento {
  return status === "lancada" ? "pendente" : "lancada";
}

// Texto do botão que alterna o status, para leitor de tela.
// Ex.: "NF de Gráfica: Pendente. Clique para mudar para Lançado"
export function descreverAlternancia(alvo: string, status: StatusLancamento): string {
  return `${alvo}: ${ROTULO_DO_STATUS[status]}. Clique para mudar para ${ROTULO_DO_STATUS[statusOposto(status)]}`;
}
