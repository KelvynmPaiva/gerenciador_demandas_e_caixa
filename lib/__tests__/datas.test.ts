import { describe, expect, it } from "vitest";
import {
  classificar,
  cobreOMes,
  dataEmSaoPaulo,
  dataValida,
  diasDoPeriodo,
  domingoDaSemana,
  fimDaProximaSemana,
  lerMes,
  moverParaMes,
  somarDias,
  somarMeses,
  ultimoDiaDoMes,
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

  it("leva a data para outro mês mantendo o dia (ou o último dia)", () => {
    expect(moverParaMes("2026-11-15", "2026-12")).toBe("2026-12-15");
    expect(moverParaMes("2026-01-31", "2026-02")).toBe("2026-02-28");
    expect(moverParaMes("2026-01-31", "2028-02")).toBe("2028-02-29"); // bissexto
    expect(moverParaMes("2026-03-31", "2026-04")).toBe("2026-04-30");
    expect(moverParaMes("2026-12-05", "2025-01")).toBe("2025-01-05");
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

  it("classifica pelo período do painel (hoje não entra em Esta semana)", () => {
    const hoje = "2026-11-13"; // sexta
    expect(classificar("2026-11-12", hoje)).toBe("atrasada");
    expect(classificar("2026-11-13", hoje)).toBe("hoje");
    expect(classificar("2026-11-14", hoje)).toBe("esta_semana");
    expect(classificar("2026-11-15", hoje)).toBe("esta_semana");
    expect(classificar("2026-11-16", hoje)).toBe("proxima_semana");
    expect(classificar("2026-11-22", hoje)).toBe("proxima_semana");
    expect(classificar("2026-11-23", hoje)).toBe("depois");
  });

  it("no domingo, Esta semana fica vazia e nada se repete", () => {
    const domingo = "2026-11-15";
    expect(classificar("2026-11-14", domingo)).toBe("atrasada");
    expect(classificar("2026-11-15", domingo)).toBe("hoje");
    expect(classificar("2026-11-16", domingo)).toBe("proxima_semana");
    expect(classificar("2026-11-22", domingo)).toBe("proxima_semana");
    expect(classificar("2026-11-23", domingo)).toBe("depois");
    // intervalo seria segunda (16) a domingo (15): invertido → sem dias
    expect(diasDoPeriodo("esta_semana", domingo)).toBeNull();
    expect(diasDoPeriodo("hoje", domingo)).toEqual({
      inicio: "2026-11-15",
      fim: "2026-11-15",
    });
    expect(diasDoPeriodo("proxima_semana", domingo)).toEqual({
      inicio: "2026-11-16",
      fim: "2026-11-22",
    });
  });

  it("dias de cada grupo do painel", () => {
    const sexta = "2026-11-13";
    expect(diasDoPeriodo("esta_semana", sexta)).toEqual({
      inicio: "2026-11-14",
      fim: "2026-11-15",
    });
    // no sábado, Esta semana é só o domingo
    expect(diasDoPeriodo("esta_semana", "2026-11-14")).toEqual({
      inicio: "2026-11-15",
      fim: "2026-11-15",
    });
    // na segunda, de terça a domingo
    expect(diasDoPeriodo("esta_semana", "2026-11-09")).toEqual({
      inicio: "2026-11-10",
      fim: "2026-11-15",
    });
  });

  it("último dia do mês (com bissexto)", () => {
    expect(ultimoDiaDoMes("2026-11")).toBe("2026-11-30");
    expect(ultimoDiaDoMes("2026-12")).toBe("2026-12-31");
    expect(ultimoDiaDoMes("2026-02")).toBe("2026-02-28");
    expect(ultimoDiaDoMes("2028-02")).toBe("2028-02-29");
  });

  it("evento aparece em todos os meses que cobre e só neles", () => {
    // sem data final: só o mês de início
    expect(cobreOMes("2026-11-20", null, "2026-11")).toBe(true);
    expect(cobreOMes("2026-11-20", null, "2026-12")).toBe(false);
    expect(cobreOMes("2026-11-20", null, "2026-10")).toBe(false);
    // de outubro a dezembro: aparece em out, nov e dez
    expect(cobreOMes("2026-10-30", "2026-12-02", "2026-10")).toBe(true);
    expect(cobreOMes("2026-10-30", "2026-12-02", "2026-11")).toBe(true);
    expect(cobreOMes("2026-10-30", "2026-12-02", "2026-12")).toBe(true);
    expect(cobreOMes("2026-10-30", "2026-12-02", "2027-01")).toBe(false);
    expect(cobreOMes("2026-10-30", "2026-12-02", "2026-09")).toBe(false);
    // bordas: primeiro e último dia do mês
    expect(cobreOMes("2026-11-30", "2026-12-01", "2026-11")).toBe(true);
    expect(cobreOMes("2026-11-30", "2026-12-01", "2026-12")).toBe(true);
    // atravessando o ano
    expect(cobreOMes("2026-12-28", "2027-01-03", "2027-01")).toBe(true);
    // fim antes do início (dado inconsistente) vale como só o início
    expect(cobreOMes("2026-11-20", "2026-10-01", "2026-10")).toBe(false);
    expect(cobreOMes("2026-11-20", "2026-10-01", "2026-11")).toBe(true);
  });

  it("converte um instante do banco para o dia em São Paulo", () => {
    // 01:30 UTC do dia 17 ainda é 22:30 do dia 16 em São Paulo (UTC-3)
    expect(dataEmSaoPaulo("2026-11-17T01:30:00+00:00")).toBe("2026-11-16");
    expect(dataEmSaoPaulo("2026-11-17T03:30:00+00:00")).toBe("2026-11-17");
  });
});
