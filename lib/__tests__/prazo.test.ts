import { describe, expect, it } from "vitest";
import { contagemDeDias, diaCurto, rotuloRelativo, urgencia } from "@/lib/prazo";

const HOJE = "2026-11-10"; // terça-feira

describe("prazo", () => {
  it("classifica a urgência (hoje e amanhã ficam em âmbar)", () => {
    expect(urgencia(null, HOJE)).toBe("sem_prazo");
    expect(urgencia("2026-11-08", HOJE)).toBe("atrasada");
    expect(urgencia("2026-11-10", HOJE)).toBe("hoje");
    expect(urgencia("2026-11-11", HOJE)).toBe("hoje");
    expect(urgencia("2026-11-12", HOJE)).toBe("semana");
    expect(urgencia("2026-11-17", HOJE)).toBe("semana");
    expect(urgencia("2026-11-18", HOJE)).toBe("depois");
  });

  it("escreve o rótulo relativo", () => {
    expect(rotuloRelativo("2026-11-10", HOJE)).toBe("Hoje");
    expect(rotuloRelativo("2026-11-11", HOJE)).toBe("Amanhã");
    expect(rotuloRelativo("2026-11-09", HOJE)).toBe("há 1 dia");
    expect(rotuloRelativo("2026-11-03", HOJE)).toBe("há 7 dias");
    expect(rotuloRelativo("2026-11-17", HOJE)).toMatch(/^ter,? 17\/11$/);
  });

  it("escreve um dia curto (subtítulo do grupo Hoje)", () => {
    expect(diaCurto("2026-11-16")).toBe("16 nov");
    expect(diaCurto("2026-12-05")).toBe("5 dez");
  });

  it("conta os dias para o cabeçalho do evento", () => {
    expect(contagemDeDias("2026-11-15", HOJE)).toBe("em 5 dias");
    expect(contagemDeDias("2026-11-10", HOJE)).toBe("hoje");
    expect(contagemDeDias("2026-11-09", HOJE)).toBe("ontem");
    expect(contagemDeDias("2026-11-07", HOJE)).toBe("há 3 dias");
  });
});
