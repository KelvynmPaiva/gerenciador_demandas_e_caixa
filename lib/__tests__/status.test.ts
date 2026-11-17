import { describe, expect, it } from "vitest";
import { ocorrenciaConcluida } from "@/lib/despesas";
import {
  descreverAlternancia,
  ROTULO_DO_STATUS,
  statusOposto,
  TOM_DO_STATUS,
} from "@/lib/status";

describe("status", () => {
  it("só existem Pendente (vermelho) e Lançado (verde), com o valor interno de sempre", () => {
    expect(ROTULO_DO_STATUS).toEqual({ pendente: "Pendente", lancada: "Lançado" });
    expect(TOM_DO_STATUS).toEqual({ pendente: "danger", lancada: "success" });
  });

  it("alterna entre os dois", () => {
    expect(statusOposto("pendente")).toBe("lancada");
    expect(statusOposto("lancada")).toBe("pendente");
  });

  it("descreve a alternância para leitor de tela com os mesmos textos", () => {
    expect(descreverAlternancia("NF de Gráfica", "pendente")).toBe(
      "NF de Gráfica: Pendente. Clique para mudar para Lançado",
    );
    expect(descreverAlternancia("NF de Gráfica", "lancada")).toBe(
      "NF de Gráfica: Lançado. Clique para mudar para Pendente",
    );
  });

  it("despesa do mês só é Lançado com check E valor real (igual ao banco)", () => {
    expect(ocorrenciaConcluida({ checkMarcado: true, valorReal: 10 })).toBe(true);
    expect(ocorrenciaConcluida({ checkMarcado: true, valorReal: 0 })).toBe(true);
    expect(ocorrenciaConcluida({ checkMarcado: true, valorReal: null })).toBe(false);
    expect(ocorrenciaConcluida({ checkMarcado: false, valorReal: 10 })).toBe(false);
  });
});
