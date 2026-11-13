import { describe, expect, it } from "vitest";
import {
  classificar,
  dataValida,
  domingoDaSemana,
  fimDaProximaSemana,
  lerMes,
  somarDias,
  somarMeses,
} from "@/lib/datas";

describe("datas", () => {
  it("valida datas reais e rejeita inexistentes", () => {
    expect(dataValida("2026-02-28")).toBe(true);
    expect(dataValida("2028-02-29")).toBe(true); // bissexto
    expect(dataValida("2026-02-29")).toBe(false);
    expect(dataValida("2026-02-30")).toBe(false);
    expect(dataValida("26-02-01")).toBe(false);
    expect(dataValida("")).toBe(false);
  });

  it("soma dias atravessando mês e ano", () => {
    expect(somarDias("2026-12-30", 3)).toBe("2027-01-02");
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("soma meses atravessando o ano", () => {
    expect(somarMeses("2026-12", 1)).toBe("2027-01");
    expect(somarMeses("2026-01", -1)).toBe("2025-12");
  });

  it("lê o mês da URL só se for válido", () => {
    expect(lerMes("2026-11")).toBe("2026-11");
    expect(lerMes("2026-13")).toBeNull();
    expect(lerMes("2026-1")).toBeNull();
    expect(lerMes(undefined)).toBeNull();
  });

  it("a semana vai de segunda a domingo", () => {
    // 2026-11-09 é segunda, 2026-11-15 é domingo
    expect(domingoDaSemana("2026-11-09")).toBe("2026-11-15");
    expect(domingoDaSemana("2026-11-13")).toBe("2026-11-15");
    expect(domingoDaSemana("2026-11-15")).toBe("2026-11-15");
    expect(fimDaProximaSemana("2026-11-13")).toBe("2026-11-22");
  });

  it("classifica pelo período do painel", () => {
    const hoje = "2026-11-13"; // sexta
    expect(classificar("2026-11-12", hoje)).toBe("atrasada");
    expect(classificar("2026-11-13", hoje)).toBe("esta_semana");
    expect(classificar("2026-11-15", hoje)).toBe("esta_semana");
    expect(classificar("2026-11-16", hoje)).toBe("proxima_semana");
    expect(classificar("2026-11-22", hoje)).toBe("proxima_semana");
    expect(classificar("2026-11-23", hoje)).toBe("depois");
  });
});
