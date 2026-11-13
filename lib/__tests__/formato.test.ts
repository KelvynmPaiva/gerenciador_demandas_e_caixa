import { describe, expect, it } from "vitest";
import {
  formatarData,
  formatarIntervalo,
  lerValor,
  nomeDoMes,
  plural,
  somarValores,
} from "@/lib/formato";

describe("formato", () => {
  it("formata datas sem erro de fuso", () => {
    expect(formatarData("2026-11-10")).toBe("10/11/2026");
    expect(formatarData(null)).toBe("—");
  });

  it("formata intervalos", () => {
    expect(formatarIntervalo(null, null)).toBe("Sem data definida");
    expect(formatarIntervalo("2026-11-10", "2026-11-10")).toBe("10/11/2026");
    expect(formatarIntervalo("2026-11-10", "2026-11-12")).toBe(
      "10/11/2026 a 12/11/2026",
    );
  });

  it("soma valores sem sobra de centavos", () => {
    expect(somarValores([0.1, 0.2, null])).toBe(0.3);
  });

  it("pluraliza", () => {
    expect(plural(1, "evento", "eventos")).toBe("1 evento");
    expect(plural(0, "evento", "eventos")).toBe("0 eventos");
  });

  it("nome do mês", () => {
    expect(nomeDoMes("2026-03")).toBe("Março 2026");
  });

  it("lê valores digitados", () => {
    expect(lerValor("")).toEqual({ valido: true, valor: null });
    expect(lerValor("1234,5")).toEqual({ valido: true, valor: 1234.5 });
    expect(lerValor("R$ 1.234,50")).toEqual({ valido: true, valor: 1234.5 });
    expect(lerValor("18.500")).toEqual({ valido: true, valor: 18500 });
    expect(lerValor("1234.5")).toEqual({ valido: true, valor: 1234.5 });
    expect(lerValor("abc").valido).toBe(false);
    expect(lerValor("-5").valido).toBe(false);
    expect(lerValor("99999999999").valido).toBe(false); // estoura numeric(12,2)
  });
});
