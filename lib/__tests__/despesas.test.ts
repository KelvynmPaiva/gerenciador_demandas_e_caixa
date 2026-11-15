import { describe, expect, it } from "vitest";
import {
  normalizarNome,
  notaComMesmoNome,
  ordenarDespesas,
  sugestoesDoMes,
  type NotaComMeses,
} from "@/lib/despesas";

const notas: NotaComMeses[] = [
  { id: "g", nome: "Gráfica", meses: ["2026-10", "2026-11"] },
  { id: "a", nome: "Assessoria", meses: ["2026-11"] },
  { id: "c", nome: "Café de sábado", meses: [] },
];

describe("despesas", () => {
  it("sugere só as despesas que ainda não estão no mês, em ordem alfabética", () => {
    expect(sugestoesDoMes(notas, "2026-11").map((n) => n.id)).toEqual(["c"]);
    expect(sugestoesDoMes(notas, "2026-12").map((n) => n.id)).toEqual([
      "a",
      "c",
      "g",
    ]);
    expect(sugestoesDoMes(notas, "2026-10").map((n) => n.id)).toEqual([
      "a",
      "c",
    ]);
    expect(notas[0].id).toBe("g"); // não altera a lista original
  });

  it("sem despesas cadastradas, não há sugestão", () => {
    expect(sugestoesDoMes([], "2026-11")).toEqual([]);
  });

  it("compara nomes sem maiúsculas nem espaços sobrando", () => {
    expect(normalizarNome("  Gráfica   do  centro ")).toBe("gráfica do centro");
    expect(notaComMesmoNome(notas, " gráfica ")?.id).toBe("g");
    expect(notaComMesmoNome(notas, "Grafica")).toBeUndefined(); // acento conta
    expect(notaComMesmoNome(notas, "Outra")).toBeUndefined();
  });

  it("ao renomear, ignora a própria nota mas acusa o nome de outra", () => {
    // manter o nome ou só mudar maiúsculas/espaços não é repetição
    expect(notaComMesmoNome(notas, "Gráfica", "g")).toBeUndefined();
    expect(notaComMesmoNome(notas, " GRÁFICA ", "g")).toBeUndefined();
    // renomear "Assessoria" para "gráfica" bate com outra nota
    expect(notaComMesmoNome(notas, "gráfica", "a")?.id).toBe("g");
  });

  it("ordena a tabela do mês por data e, no empate, pelo nome da nota", () => {
    const lista = [
      { id: "1", vencimento: "2026-11-20", nota: { nome: "Água" } },
      { id: "2", vencimento: "2026-11-05", nota: { nome: "Zebra" } },
      { id: "3", vencimento: "2026-11-20", nota: { nome: "Ônibus" } },
      { id: "4", vencimento: "2026-11-20", nota: { nome: "banco" } },
    ];
    expect(ordenarDespesas(lista).map((d) => d.id)).toEqual(["2", "1", "4", "3"]);
    expect(lista[0].id).toBe("1");
  });
});
