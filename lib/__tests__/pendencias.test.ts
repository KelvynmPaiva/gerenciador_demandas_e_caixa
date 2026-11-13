import { describe, expect, it } from "vitest";
import {
  enderecoDaPendencia,
  faltaValorReal,
  ordenarPendencias,
  tipoValido,
  type Pendencia,
} from "@/lib/pendencias";

function item(parcial: Partial<Pendencia>): Pendencia {
  return {
    chave: "tarefa:1",
    id: "1",
    tipo: "tarefa",
    titulo: "Tarefa",
    data: "2026-11-13",
    marcaId: "m1",
    marcaNome: "BMW",
    eventoId: "e1",
    eventoNome: "Evento",
    checkMarcado: false,
    valorReal: null,
    ...parcial,
  };
}

describe("pendencias", () => {
  it("valida o tipo vindo do banco", () => {
    expect(tipoValido("nf")).toBe(true);
    expect(tipoValido("outro")).toBe(false);
    expect(tipoValido(null)).toBe(false);
  });

  it("ordena por data e, em empate, por título (pt-BR)", () => {
    const lista = [
      item({ id: "a", titulo: "Zebra", data: "2026-11-14" }),
      item({ id: "b", titulo: "Água", data: "2026-11-13" }),
      item({ id: "c", titulo: "Banco", data: "2026-11-13" }),
    ];
    expect(ordenarPendencias(lista).map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(lista[0].id).toBe("a"); // não altera a lista original
  });

  it("monta o endereço de cada tipo", () => {
    expect(enderecoDaPendencia(item({ tipo: "tarefa" }))).toBe(
      "/eventos/e1?aba=demandas",
    );
    expect(enderecoDaPendencia(item({ tipo: "subtarefa" }))).toBe(
      "/eventos/e1?aba=demandas",
    );
    expect(enderecoDaPendencia(item({ tipo: "nf" }))).toBe(
      "/eventos/e1?aba=orcamento",
    );
    expect(
      enderecoDaPendencia(
        item({ tipo: "recorrente", eventoId: null, data: "2026-12-05" }),
      ),
    ).toBe("/marcas/m1?mes=2026-12");
  });

  it("recorrente com check e sem valor real fica 'falta valor real'", () => {
    expect(
      faltaValorReal(item({ tipo: "recorrente", checkMarcado: true })),
    ).toBe(true);
    expect(
      faltaValorReal(
        item({ tipo: "recorrente", checkMarcado: true, valorReal: 10 }),
      ),
    ).toBe(false);
    expect(faltaValorReal(item({ tipo: "tarefa", checkMarcado: true }))).toBe(
      false,
    );
  });
});
