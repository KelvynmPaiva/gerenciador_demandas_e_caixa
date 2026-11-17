import { describe, expect, it } from "vitest";
import { classificar } from "@/lib/datas";
import {
  ehDoRadar,
  enderecoDaPendencia,
  enderecoDoRadar,
  faltaValorReal,
  ordenarPendencias,
  ordenarSemPrazo,
  ROTULOS_DO_TIPO,
  TIPOS_DE_PENDENCIA,
  tipoValido,
  type ItemRadarSemPrazo,
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

  it("reconhece os tipos do Radar vindos da view", () => {
    expect(tipoValido("radar")).toBe(true);
    expect(tipoValido("subitem_radar")).toBe(true);
    expect(TIPOS_DE_PENDENCIA).toHaveLength(6);
    expect(TIPOS_DE_PENDENCIA.every((tipo) => tipoValido(tipo))).toBe(true);
    expect(ehDoRadar("radar")).toBe(true);
    expect(ehDoRadar("subitem_radar")).toBe(true);
    expect(ehDoRadar("tarefa")).toBe(false);
  });

  it("todo tipo tem rótulo", () => {
    for (const tipo of TIPOS_DE_PENDENCIA) {
      expect(ROTULOS_DO_TIPO[tipo]).toBeTruthy();
    }
    expect(ROTULOS_DO_TIPO.radar).toBe("Radar");
    expect(ROTULOS_DO_TIPO.subitem_radar).toBe("Subtarefa do Radar");
  });

  it("item do Radar leva à seção No Radar da marca (mesmo com data)", () => {
    const doRadar = { eventoId: null, eventoNome: null, data: "2026-12-05" };
    expect(enderecoDaPendencia(item({ ...doRadar, tipo: "radar" }))).toBe(
      "/marcas/m1#radar",
    );
    expect(enderecoDaPendencia(item({ ...doRadar, tipo: "subitem_radar" }))).toBe(
      "/marcas/m1#radar",
    );
    expect(enderecoDoRadar("m2")).toBe("/marcas/m2#radar");
  });

  it("item do Radar com prazo cai nos mesmos grupos do painel", () => {
    // Segunda, 16/11/2026: o Radar usa a mesma régua das tarefas
    const hoje = "2026-11-16";
    expect(classificar("2026-11-13", hoje)).toBe("atrasada");
    expect(classificar("2026-11-16", hoje)).toBe("hoje");
    expect(classificar("2026-11-20", hoje)).toBe("esta_semana");
    expect(classificar("2026-11-24", hoje)).toBe("proxima_semana");
    const lista = ordenarPendencias([
      item({ id: "r", tipo: "radar", titulo: "Radar", data: "2026-11-16" }),
      item({ id: "t", tipo: "tarefa", titulo: "Tarefa", data: "2026-11-13" }),
    ]);
    expect(lista.map((i) => i.id)).toEqual(["t", "r"]);
  });

  it("ordena o bloco No Radar por marca e depois pelo título", () => {
    const semPrazo = (
      id: string,
      marcaNome: string,
      titulo: string,
    ): ItemRadarSemPrazo => ({
      chave: `radar:${id}`,
      id,
      tipo: "radar",
      titulo,
      itemPai: null,
      marcaId: marcaNome,
      marcaNome,
    });
    const lista = [
      semPrazo("a", "Volvo", "Água"),
      semPrazo("b", "BMW", "Zebra"),
      semPrazo("c", "BMW", "Ônibus"),
    ];
    expect(ordenarSemPrazo(lista).map((i) => i.id)).toEqual(["c", "b", "a"]);
    expect(lista[0].id).toBe("a"); // não altera a lista original
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
