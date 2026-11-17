// Como um prazo aparece na tela: urgência (cor) e rótulo relativo ("Hoje", "há 3 dias").
// Trabalha com texto "AAAA-MM-DD" e o "hoje" de São Paulo (nunca new Date() solto).

import { diasAte } from "@/lib/datas";

export type Urgencia = "atrasada" | "hoje" | "semana" | "depois" | "sem_prazo";

// Hoje e amanhã ficam em âmbar ("hoje"); até 7 dias é "semana".
export function urgencia(data: string | null, hoje: string): Urgencia {
  if (!data) return "sem_prazo";
  const dias = diasAte(data, hoje);
  if (dias < 0) return "atrasada";
  if (dias <= 1) return "hoje";
  if (dias <= 7) return "semana";
  return "depois";
}

const DIA_E_MES = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC", // a data já é "do dia"; em UTC ela nunca pula para o dia vizinho
});

// "Hoje", "Amanhã", "há 7 dias" ou "seg, 17/11"
export function rotuloRelativo(data: string, hoje: string): string {
  const dias = diasAte(data, hoje);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias < 0) return `há ${-dias} dia${dias === -1 ? "" : "s"}`;
  const [ano, mes, dia] = data.split("-").map(Number);
  return DIA_E_MES.format(new Date(Date.UTC(ano, mes - 1, dia))).replace(".", "");
}

// Para o cabeçalho do evento: "hoje", "amanhã", "em 5 dias", "há 2 dias"
export function contagemDeDias(data: string, hoje: string): string {
  const dias = diasAte(data, hoje);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  return dias > 0 ? `em ${dias} dias` : `há ${-dias} dias`;
}

const MES_CURTO = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

function mesCurto(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return MES_CURTO.format(new Date(Date.UTC(ano, mes - 1, dia))).replace(".", "");
}

// "2026-11-16" → "16 nov" (subtítulo do grupo Hoje no painel)
export function diaCurto(data: string): string {
  return `${Number(data.slice(8, 10))} ${mesCurto(data)}`;
}

// "2026-11-15","2026-11-22" → "15 – 22 nov"; entre meses: "30 nov – 6 dez"
export function intervaloCurto(inicio: string, fim: string): string {
  const diaInicio = Number(inicio.slice(8, 10));
  const diaFim = Number(fim.slice(8, 10));
  if (inicio.slice(0, 7) === fim.slice(0, 7)) {
    return `${diaInicio} – ${diaFim} ${mesCurto(fim)}`;
  }
  return `${diaInicio} ${mesCurto(inicio)} – ${diaFim} ${mesCurto(fim)}`;
}
