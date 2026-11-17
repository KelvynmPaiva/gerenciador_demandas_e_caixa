// Despesas recorrentes cadastradas à mão, mês a mês.
// - A "nota recorrente" é só o nome da despesa (ex.: "Gráfica"), compartilhado
//   por todos os meses: renomear a nota renomeia a despesa em todos os meses.
// - Cada mês tem no máximo uma despesa de cada nota (unique no banco).

export type NotaComMeses = {
  id: string;
  nome: string;
  meses: string[]; // meses "AAAA-MM" em que a despesa já está cadastrada
};

// Compara nomes sem diferenciar maiúsculas e espaços sobrando
// ("  gráfica " = "Gráfica"). Acentos continuam contando.
export function normalizarNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

// Sugestões da janela "Adicionar despesa": as despesas já cadastradas que
// ainda não existem no mês escolhido, em ordem alfabética.
export function sugestoesDoMes(
  notas: NotaComMeses[],
  mes: string,
): NotaComMeses[] {
  return notas
    .filter((nota) => !nota.meses.includes(mes))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

// "Nova despesa" com um nome que já existe reaproveita a nota existente,
// para não criar duas despesas com o mesmo nome. Ao renomear, `ignorarId` é a
// própria nota: manter o nome (ou só mudar maiúsculas) não conta como repetido.
export function notaComMesmoNome<T extends { id: string; nome: string }>(
  notas: T[],
  nome: string,
  ignorarId?: string,
): T | undefined {
  const procurado = normalizarNome(nome);
  return notas.find(
    (nota) => nota.id !== ignorarId && normalizarNome(nota.nome) === procurado,
  );
}

// Regra de negócio (igual à coluna gerada ocorrencias_mensais.concluida no banco):
// a despesa do mês só está "Lançado" com o check marcado E o valor real preenchido.
// Check sem valor continua "Pendente" (com aviso no campo de valor), assim a tela
// mostra o mesmo que o painel e os contadores, que leem a coluna do banco.
export function ocorrenciaConcluida(ocorrencia: {
  checkMarcado: boolean;
  valorReal: number | null;
}): boolean {
  return ocorrencia.checkMarcado && ocorrencia.valorReal !== null;
}

// Ordem da tabela do mês: data crescente e, no empate, nome da nota (pt-BR).
// Feita aqui porque o nome mora na nota, não na despesa do mês.
export function ordenarDespesas<
  T extends { vencimento: string; nota: { nome: string } },
>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      a.vencimento.localeCompare(b.vencimento) ||
      a.nota.nome.localeCompare(b.nota.nome, "pt-BR"),
  );
}
