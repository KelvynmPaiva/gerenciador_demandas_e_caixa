"use server";

import { revalidatePath } from "next/cache";
import { hojeSaoPaulo } from "@/lib/datas";
import type { Resultado } from "@/lib/resultado";
import { createClientAutenticado } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NAO_ENCONTRADO = "Item não encontrado. Atualize a página.";

// O banco guarda valores com até 10 dígitos antes da vírgula (numeric(12,2))
function valorValido(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0 && valor < 1e10;
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

// ---------- NOTAS RECORRENTES (cadastro-mãe) ----------

export type DadosNota = {
  nome: string;
  valorPrevisto: number | null;
  diaVencimento: number; // 1 a 31
  observacao: string;
};

function validarNota(dados: DadosNota): string | null {
  const nome = dados.nome.trim();
  if (nome.length === 0 || nome.length > 120) {
    return "Informe o nome da despesa (até 120 caracteres).";
  }
  if (
    !Number.isInteger(dados.diaVencimento) ||
    dados.diaVencimento < 1 ||
    dados.diaVencimento > 31
  ) {
    return "O dia do vencimento deve ser de 1 a 31.";
  }
  if (dados.valorPrevisto !== null && !valorValido(dados.valorPrevisto)) {
    return "Valor previsto inválido.";
  }
  return null;
}

export async function criarNota(
  marcaId: string,
  dados: DadosNota,
): Promise<Resultado> {
  const erroDeValidacao = validarNota(dados);
  if (erroDeValidacao) return { erro: erroDeValidacao };

  const supabase = await createClientAutenticado();

  const { error } = await supabase.from("notas_recorrentes").insert({
    marca_id: marcaId,
    nome: dados.nome.trim(),
    valor_previsto: dados.valorPrevisto,
    dia_vencimento: dados.diaVencimento,
    observacao: dados.observacao.trim() || null,
  });
  if (error) {
    console.error("criarNota:", error.message);
    return { erro: ERRO_GENERICO };
  }

  // Regra de negócio: ao criar a nota, a despesa do mês atual já é gerada na hora.
  // (A função do banco usa o último dia do mês quando o dia não existe, ex.: 31 → 28/02.)
  const mesAtual = hojeSaoPaulo().slice(0, 7);
  const { error: erroAoGerar } = await supabase.rpc("gerar_ocorrencias", {
    p_mes: `${mesAtual}-01`,
  });

  atualizarTelas();

  if (erroAoGerar) {
    console.error("criarNota (gerar_ocorrencias):", erroAoGerar.message);
    return {
      erro: "A nota foi criada, mas não foi possível gerar a despesa deste mês. Recarregue a página.",
    };
  }
  return { erro: null };
}

// Editar a nota vale para os meses que ainda vão ser gerados.
// As despesas que já existem nos meses (ocorrências) não são alteradas.
export async function editarNota(
  id: string,
  dados: DadosNota,
): Promise<Resultado> {
  const erroDeValidacao = validarNota(dados);
  if (erroDeValidacao) return { erro: erroDeValidacao };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("notas_recorrentes")
    .update({
      nome: dados.nome.trim(),
      valor_previsto: dados.valorPrevisto,
      dia_vencimento: dados.diaVencimento,
      observacao: dados.observacao.trim() || null,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("editarNota:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Desativada = para de gerar meses futuros. O histórico (meses já gerados) fica.
export async function desativarNota(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("notas_recorrentes")
    .update({ ativa: false })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("desativarNota:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// ---------- OCORRÊNCIAS MENSAIS (a despesa de cada mês) ----------

export type CamposOcorrencia = {
  checkMarcado?: boolean;
  valorPrevisto?: number | null;
  valorReal?: number | null;
  observacao?: string | null;
};

// Altera só os campos enviados, só daquela ocorrência: editar o valor previsto
// de um mês NÃO muda a nota-mãe nem os outros meses.
export async function atualizarOcorrencia(
  id: string,
  campos: CamposOcorrencia,
): Promise<Resultado> {
  // Importante: "concluida" é calculada pelo banco (check marcado E valor real
  // preenchido). Nunca enviamos esse campo.
  const mudancas: TablesUpdate<"ocorrencias_mensais"> = {};

  if (campos.checkMarcado !== undefined) {
    mudancas.check_marcado = campos.checkMarcado;
  }
  if (campos.valorPrevisto !== undefined) {
    if (campos.valorPrevisto !== null && !valorValido(campos.valorPrevisto)) {
      return { erro: "Valor previsto inválido." };
    }
    mudancas.valor_previsto = campos.valorPrevisto;
  }
  if (campos.valorReal !== undefined) {
    if (campos.valorReal !== null && !valorValido(campos.valorReal)) {
      return { erro: "Valor real inválido." };
    }
    mudancas.valor_real = campos.valorReal;
  }
  if (campos.observacao !== undefined) {
    mudancas.observacao = campos.observacao?.trim() || null;
  }

  if (Object.keys(mudancas).length === 0) return { erro: null };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("ocorrencias_mensais")
    .update(mudancas)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("atualizarOcorrencia:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}
