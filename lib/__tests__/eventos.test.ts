import { describe, expect, it } from "vitest";
import { montarResumos } from "@/lib/eventos";

describe("eventos", () => {
  it("soma só o valor real e conta NFs e tarefas pendentes de cada evento", () => {
    const resumos = montarResumos(
      ["e1", "e2", "e3"],
      [
        { evento_id: "e1", valor_real: 0.1, status_nf: "pendente" },
        { evento_id: "e1", valor_real: 0.2, status_nf: "lancada" },
        { evento_id: "e1", valor_real: null, status_nf: "pendente" },
        { evento_id: "e2", valor_real: 1500, status_nf: "lancada" },
        { evento_id: "fora", valor_real: 999, status_nf: "pendente" }, // ignorado
      ],
      [
        { secoes: { evento_id: "e1" } },
        { secoes: { evento_id: "e3" } },
        { secoes: { evento_id: "e3" } },
      ],
    );

    expect(resumos.get("e1")).toEqual({
      totalReal: 0.3, // sem sobra de centavos (0,1 + 0,2)
      nfsPendentes: 2,
      nfsVencidas: 0,
      tarefasPendentes: 1,
    });
    expect(resumos.get("e2")).toEqual({
      totalReal: 1500,
      nfsPendentes: 0,
      nfsVencidas: 0,
      tarefasPendentes: 0,
    });
    expect(resumos.get("e3")).toEqual({
      totalReal: 0,
      nfsPendentes: 0,
      nfsVencidas: 0,
      tarefasPendentes: 2,
    });
    expect(resumos.has("fora")).toBe(false);
  });

  it("cada evento começa com um resumo próprio (sem compartilhar objeto)", () => {
    const resumos = montarResumos(
      ["e1", "e2"],
      [{ evento_id: "e1", valor_real: 10, status_nf: "pendente" }],
      [],
    );
    expect(resumos.get("e2")).toEqual({
      totalReal: 0,
      nfsPendentes: 0,
      tarefasPendentes: 0,
    });
  });
});
