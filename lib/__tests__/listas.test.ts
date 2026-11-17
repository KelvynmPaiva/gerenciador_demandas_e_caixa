import { describe, expect, it } from "vitest";
import { pendentesPrimeiro, temConteudo } from "@/lib/listas";

type Item = { id: string; feito: boolean; obs: string | null };

const lista: Item[] = [
  { id: "1", feito: true, obs: null },
  { id: "2", feito: false, obs: "  " },
  { id: "3", feito: true, obs: null },
  { id: "4", feito: false, obs: null },
];

describe("listas", () => {
  it("põe pendentes em cima e concluídos embaixo, mantendo a ordem de cada grupo", () => {
    expect(pendentesPrimeiro(lista, (i) => i.feito).map((i) => i.id)).toEqual([
      "2",
      "4",
      "1",
      "3",
    ]);
    expect(lista[0].id).toBe("1"); // não altera a lista original
  });

  it("marcar um item o leva para o fim; desmarcar o devolve ao grupo de cima", () => {
    const marcado = lista.map((i) => (i.id === "2" ? { ...i, feito: true } : i));
    expect(pendentesPrimeiro(marcado, (i) => i.feito).map((i) => i.id)).toEqual([
      "4",
      "1",
      "2",
      "3",
    ]);
    const desmarcado = lista.map((i) => (i.id === "3" ? { ...i, feito: false } : i));
    expect(pendentesPrimeiro(desmarcado, (i) => i.feito).map((i) => i.id)).toEqual([
      "2",
      "3",
      "4",
      "1",
    ]);
  });

  it("lista vazia continua vazia", () => {
    expect(pendentesPrimeiro([] as Item[], (i) => i.feito)).toEqual([]);
  });

  it("coluna só aparece se algum item tiver conteúdo (espaços não contam)", () => {
    expect(temConteudo(lista, (i) => i.obs)).toBe(false);
    expect(temConteudo([...lista, { id: "5", feito: false, obs: "nota" }], (i) => i.obs)).toBe(
      true,
    );
    expect(temConteudo([] as Item[], (i) => i.obs)).toBe(false);
  });
});
