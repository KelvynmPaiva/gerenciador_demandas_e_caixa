"use server";

import { atualizarTelas, valorValido } from "@/lib/acoes";
import { dataValida } from "@/lib/datas";
import { lerLink } from "@/lib/links";
import type { Resultado } from "@/lib/resultado";
import { createClientAutenticado } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NAO_ENCONTRADO = "Item não encontrado. Atualize a página.";

// ---------- ITENS DO ORÇAMENTO (despesas / NFs do evento) ----------

// Cria o item só com o nome do serviço; o resto a pessoa preenche na própria linha.
export async function criarItem(
  eventoId: string,
  servico: string,
): Promise<Resultado> {
  const nome = servico.trim();
  if (nome.length === 0 || nome.length > 200) {
    return { erro: "Informe o serviço (até 200 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  // O item novo entra no fim da tabela
  const { data: ultimo } = await supabase
    .from("itens_orcamento")
    .select("ordem")
    .eq("evento_id", eventoId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultimo?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("itens_orcamento")
    .insert({ evento_id: eventoId, servico: nome, ordem });

  if (error) {
    console.error("criarItem:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export type CamposItem = {
  servico?: string;
  fornecedor?: string | null;
  valorOrcado?: number | null;
  valorReal?: number | null;
  statusNf?: "pendente" | "lancada";
  prazoNf?: string | null; // "AAAA-MM-DD"
  linkExterno?: string | null;
  observacao?: string | null;
};

// Altera só os campos enviados, só daquele item.
export async function atualizarItem(
  id: string,
  campos: CamposItem,
): Promise<Resultado> {
  const mudancas: TablesUpdate<"itens_orcamento"> = {};

  if (campos.servico !== undefined) {
    const servico = campos.servico.trim();
    if (servico.length === 0 || servico.length > 200) {
      return { erro: "Informe o serviço (até 200 caracteres)." };
    }
    mudancas.servico = servico;
  }
  if (campos.fornecedor !== undefined) {
    const fornecedor = campos.fornecedor?.trim() ?? "";
    if (fornecedor.length > 200) return { erro: "Fornecedor muito longo." };
    mudancas.fornecedor = fornecedor || null;
  }
  if (campos.valorOrcado !== undefined) {
    if (campos.valorOrcado !== null && !valorValido(campos.valorOrcado)) {
      return { erro: "Valor orçado inválido." };
    }
    mudancas.valor_orcado = campos.valorOrcado;
  }
  if (campos.valorReal !== undefined) {
    if (campos.valorReal !== null && !valorValido(campos.valorReal)) {
      return { erro: "Valor real inválido." };
    }
    mudancas.valor_real = campos.valorReal;
  }
  if (campos.statusNf !== undefined) {
    // O status da NF só tem duas opções
    if (campos.statusNf !== "pendente" && campos.statusNf !== "lancada") {
      return { erro: "Status da NF inválido." };
    }
    mudancas.status_nf = campos.statusNf;
  }
  if (campos.prazoNf !== undefined) {
    if (campos.prazoNf !== null && !dataValida(campos.prazoNf)) {
      return { erro: "Data inválida." };
    }
    mudancas.prazo_nf = campos.prazoNf;
  }
  if (campos.linkExterno !== undefined) {
    const link = lerLink(campos.linkExterno ?? "");
    if (!link.valido) {
      return { erro: "Link inválido. Use um endereço como https://drive.google.com/..." };
    }
    mudancas.link_externo = link.link;
  }
  if (campos.observacao !== undefined) {
    const observacao = campos.observacao?.trim() ?? "";
    if (observacao.length > 1000) return { erro: "Observação muito longa." };
    mudancas.observacao = observacao || null;
  }

  if (Object.keys(mudancas).length === 0) return { erro: null };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("itens_orcamento")
    .update(mudancas)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("atualizarItem:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

export async function excluirItem(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("itens_orcamento")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("excluirItem:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}
