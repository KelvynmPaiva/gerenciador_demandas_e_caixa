import { describe, expect, it } from "vitest";
import { lerLink, linkSeguro } from "@/lib/links";

describe("links", () => {
  it("campo vazio significa sem link", () => {
    expect(lerLink("  ")).toEqual({ valido: true, link: null });
  });

  it("assume https quando falta o esquema", () => {
    expect(lerLink("drive.google.com/x").link).toBe("https://drive.google.com/x");
  });

  it("bloqueia esquemas perigosos e domínios sem ponto", () => {
    expect(lerLink("javascript:alert(1)").valido).toBe(false);
    expect(lerLink("data:text/html,<b>x</b>").valido).toBe(false);
    expect(lerLink("ftp://exemplo.com/a").valido).toBe(false);
    expect(lerLink("https://abc").valido).toBe(false);
  });

  it("linkSeguro só devolve link válido", () => {
    expect(linkSeguro("javascript:alert(1)")).toBeNull();
    expect(linkSeguro(null)).toBeNull();
    expect(linkSeguro("https://figma.com/a")).toBe("https://figma.com/a");
  });
});
