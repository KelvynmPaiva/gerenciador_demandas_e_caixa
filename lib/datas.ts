// Datas do app. Regras de negócio:
// - "Hoje" é sempre calculado no fuso America/Sao_Paulo (não no do servidor).
// - A semana vai de segunda a domingo.
//
// As datas são tratadas como texto "AAAA-MM-DD" (do mesmo jeito que o banco
// devolve). Assim não existe problema de fuso horário ao comparar ou somar dias.

const FUSO = "America/Sao_Paulo";

// Hoje em São Paulo, ex.: "2026-11-08"
export function hojeSaoPaulo(): string {
  // O formato "en-CA" já sai como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Hora de agora em São Paulo (0 a 23). Usada na saudação do painel.
export function horaSaoPaulo(): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: FUSO,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
}

function paraDate(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function paraTexto(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Confere se o texto é uma data real no formato AAAA-MM-DD (rejeita 2026-02-30)
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  return paraTexto(paraDate(texto)) === texto;
}

// Ponte com o calendário da tela, que trabalha com Date.
// "2026-11-10" → Date local (meio-dia, para o fuso nunca virar o dia) e vice-versa.
export function textoParaDate(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia, 12);
}

export function dateParaTexto(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// "2026-11-08" → "domingo"
export function diaDaSemanaPorExtenso(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "UTC", // a data já é "do dia"; em UTC ela nunca pula para o dia vizinho
  }).format(paraDate(data));
}

export function somarDias(data: string, dias: number): string {
  const date = paraDate(data);
  date.setUTCDate(date.getUTCDate() + dias);
  return paraTexto(date);
}

// Meses no formato "AAAA-MM". Ex.: somarMeses("2026-12", 1) = "2027-01"
export function somarMeses(mes: string, meses: number): string {
  const [ano, numeroDoMes] = mes.split("-").map(Number);
  const date = new Date(Date.UTC(ano, numeroDoMes - 1 + meses, 1));
  return paraTexto(date).slice(0, 7);
}

// Aceita só "AAAA-MM" válido (usado no ?mes= da URL). Devolve null se for inválido.
export function lerMes(texto: string | undefined): string | null {
  return texto && /^\d{4}-(0[1-9]|1[0-2])$/.test(texto) ? texto : null;
}

// Domingo da semana da data informada (semana segunda a domingo).
// Se a data já é domingo, devolve ela mesma.
export function domingoDaSemana(data: string): string {
  const diaDaSemana = paraDate(data).getUTCDay(); // 0 = domingo, 1 = segunda ... 6 = sábado
  return somarDias(data, diaDaSemana === 0 ? 0 : 7 - diaDaSemana);
}

// Último dia que aparece no painel: domingo da próxima semana
export function fimDaProximaSemana(hoje: string): string {
  return somarDias(domingoDaSemana(hoje), 7);
}

export type Periodo = "atrasada" | "esta_semana" | "proxima_semana" | "depois";

// Classificação do painel:
// - Atrasada: data anterior a hoje
// - Esta semana: de hoje até o domingo da semana atual
// - Próxima semana: segunda a domingo seguintes
// - Depois: mais longe que isso (não aparece no painel)
export function classificar(data: string, hoje: string): Periodo {
  if (data < hoje) return "atrasada";
  const domingoAtual = domingoDaSemana(hoje);
  if (data <= domingoAtual) return "esta_semana";
  if (data <= somarDias(domingoAtual, 7)) return "proxima_semana";
  return "depois";
}
