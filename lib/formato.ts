// Formatação para a tela: moeda em reais e datas dd/mm/aaaa.

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatoNumero = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NOMES_DOS_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// 1234.5 → "R$ 1.234,50". Sem valor → "—"
export function formatarMoeda(valor: number | null | undefined): string {
  return valor == null ? "—" : formatoMoeda.format(valor);
}

// 1234.5 → "1.234,50" (sem o "R$", para usar dentro de campos de edição)
export function formatarNumero(valor: number | null | undefined): string {
  return valor == null ? "" : formatoNumero.format(valor);
}

// "2026-11-10" → "10/11/2026". Trabalha com o texto para não ter erro de fuso.
export function formatarData(data: string | null | undefined): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

// Soma valores ignorando os vazios, sem acumular erro de centavos (0,1 + 0,2 etc.)
export function somarValores(valores: (number | null)[]): number {
  const total = valores.reduce<number>((soma, valor) => soma + (valor ?? 0), 0);
  return Math.round(total * 100) / 100;
}

// "15/11/2026 a 18/11/2026"; se começa e termina no mesmo dia (ou só tem início),
// mostra uma data só; sem datas → "Sem data definida".
export function formatarIntervalo(
  inicio: string | null | undefined,
  fim: string | null | undefined,
): string {
  if (!inicio) return "Sem data definida";
  if (!fim || fim === inicio) return formatarData(inicio);
  return `${formatarData(inicio)} a ${formatarData(fim)}`;
}

// plural(1, "evento", "eventos") → "1 evento"; plural(3, ...) → "3 eventos"
export function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

// "2026-11" → "Novembro 2026"
export function nomeDoMes(mes: string): string {
  const [ano, numeroDoMes] = mes.split("-").map(Number);
  return `${NOMES_DOS_MESES[numeroDoMes - 1]} ${ano}`;
}

// Lê o que a pessoa digitou num campo de valor. Aceita "1234,5", "1.234,50",
// "R$ 1.234,50" e "1234.5". Campo vazio é válido e significa "sem valor".
export function lerValor(texto: string): { valido: boolean; valor: number | null } {
  let limpo = texto.replace(/R\$/g, "").replace(/\s/g, "");
  if (limpo === "") return { valido: true, valor: null };

  if (limpo.includes(",")) {
    // Formato brasileiro: ponto separa milhar e vírgula separa centavos
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // "18.500" só com pontos de milhar
    limpo = limpo.replace(/\./g, "");
  }

  if (!/^\d+(\.\d+)?$/.test(limpo)) return { valido: false, valor: null };

  const valor = Math.round(Number(limpo) * 100) / 100;
  // O banco guarda até 10 dígitos antes da vírgula (numeric(12,2))
  if (valor >= 1e10) return { valido: false, valor: null };

  return { valido: true, valor };
}
