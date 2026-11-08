"use server";

import { revalidatePath } from "next/cache";
import { dataValida } from "@/lib/datas";
import { lerLink } from "@/lib/links";
import type { Resultado } from "@/lib/resultado";
import { createClientAutenticado } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

// Ações da aba Demandas: seções, tarefas e subtarefas.

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NAO_ENCONTRADO = "Item não encontrado. Atualize a página.";
const ERRO_ORDEM = "Não foi possível salvar a nova ordem. A tela foi atualizada.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function listaDeIds(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.every((id) => typeof id === "string" && UUID.test(id));
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

// ---------- SEÇÕES ----------

export async function criarSecao(eventoId: string, nome: string): Promise<Resultado> {
  const texto = nome.trim();
  if (texto.length === 0 || texto.length > 120) {
    return { erro: "Informe o nome da seção (até 120 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  // A seção nova entra no fim da lista
  const { data: ultima } = await supabase
    .from("secoes")
    .select("ordem")
    .eq("evento_id", eventoId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultima?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("secoes")
    .insert({ evento_id: eventoId, nome: texto, ordem });
  if (error) {
    console.error("criarSecao:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export async function renomearSecao(id: string, nome: string): Promise<Resultado> {
  const texto = nome.trim();
  if (texto.length === 0 || texto.length > 120) {
    return { erro: "Informe o nome da seção (até 120 caracteres)." };
  }

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("secoes")
    .update({ nome: texto })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("renomearSecao:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Excluir a seção exclui também as tarefas e subtarefas dela (on delete cascade)
export async function excluirSecao(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("secoes")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("excluirSecao:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Recebe os ids das seções na nova ordem e grava 1, 2, 3...
export async function reordenarSecoes(
  eventoId: string,
  ids: string[],
): Promise<Resultado> {
  if (!listaDeIds(ids)) return { erro: ERRO_ORDEM };

  const supabase = await createClientAutenticado();
  const respostas = await Promise.all(
    ids.map((id, posicao) =>
      supabase
        .from("secoes")
        .update({ ordem: posicao + 1 })
        .eq("id", id)
        .eq("evento_id", eventoId),
    ),
  );
  const falha = respostas.find((resposta) => resposta.error);
  if (falha?.error) {
    console.error("reordenarSecoes:", falha.error.message);
    return { erro: ERRO_ORDEM };
  }

  atualizarTelas();
  return { erro: null };
}

// ---------- TAREFAS ----------

// Cria a tarefa só com a descrição; prazo, link e observação ficam no painel lateral.
export async function criarTarefa(
  secaoId: string,
  descricao: string,
): Promise<Resultado> {
  const texto = descricao.trim();
  if (texto.length === 0 || texto.length > 300) {
    return { erro: "Informe a tarefa (até 300 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  const { data: ultima } = await supabase
    .from("tarefas")
    .select("ordem")
    .eq("secao_id", secaoId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultima?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("tarefas")
    .insert({ secao_id: secaoId, descricao: texto, ordem });
  if (error) {
    console.error("criarTarefa:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export type CamposTarefa = {
  descricao?: string;
  prazo?: string | null; // "AAAA-MM-DD"
  concluida?: boolean;
  observacao?: string | null;
  linkExterno?: string | null;
};

// Altera só os campos enviados, só daquela tarefa.
export async function atualizarTarefa(
  id: string,
  campos: CamposTarefa,
): Promise<Resultado> {
  const mudancas: TablesUpdate<"tarefas"> = {};

  if (campos.descricao !== undefined) {
    const descricao = campos.descricao.trim();
    if (descricao.length === 0 || descricao.length > 300) {
      return { erro: "Informe a tarefa (até 300 caracteres)." };
    }
    mudancas.descricao = descricao;
  }
  if (campos.prazo !== undefined) {
    if (campos.prazo !== null && !dataValida(campos.prazo)) {
      return { erro: "Data inválida." };
    }
    mudancas.prazo = campos.prazo;
  }
  if (campos.concluida !== undefined) {
    if (typeof campos.concluida !== "boolean") return { erro: ERRO_GENERICO };
    mudancas.concluida = campos.concluida;
    mudancas.concluida_em = campos.concluida ? new Date().toISOString() : null;
  }
  if (campos.observacao !== undefined) {
    const observacao = campos.observacao?.trim() ?? "";
    if (observacao.length > 2000) return { erro: "Observação muito longa." };
    mudancas.observacao = observacao || null;
  }
  if (campos.linkExterno !== undefined) {
    const link = lerLink(campos.linkExterno ?? "");
    if (!link.valido) {
      return { erro: "Link inválido. Use um endereço como https://drive.google.com/..." };
    }
    mudancas.link_externo = link.link;
  }

  if (Object.keys(mudancas).length === 0) return { erro: null };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("tarefas")
    .update(mudancas)
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("atualizarTarefa:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Exclui a tarefa e as subtarefas dela (on delete cascade)
export async function excluirTarefa(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("tarefas")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("excluirTarefa:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Grava a ordem das tarefas de uma ou mais seções (1, 2, 3...). Como cada tarefa
// também grava a seção, isso serve tanto para reordenar quanto para mover entre seções.
export async function reordenarTarefas(
  secoes: { secaoId: string; tarefaIds: string[] }[],
): Promise<Resultado> {
  const valido =
    Array.isArray(secoes) &&
    secoes.every(
      (secao) =>
        typeof secao.secaoId === "string" &&
        UUID.test(secao.secaoId) &&
        listaDeIds(secao.tarefaIds),
    );
  if (!valido) return { erro: ERRO_ORDEM };

  const supabase = await createClientAutenticado();
  const respostas = await Promise.all(
    secoes.flatMap((secao) =>
      secao.tarefaIds.map((tarefaId, posicao) =>
        supabase
          .from("tarefas")
          .update({ secao_id: secao.secaoId, ordem: posicao + 1 })
          .eq("id", tarefaId),
      ),
    ),
  );
  const falha = respostas.find((resposta) => resposta.error);
  if (falha?.error) {
    console.error("reordenarTarefas:", falha.error.message);
    return { erro: ERRO_ORDEM };
  }

  atualizarTelas();
  return { erro: null };
}

// ---------- SUBTAREFAS ----------

export async function criarSubtarefa(
  tarefaId: string,
  descricao: string,
): Promise<Resultado> {
  const texto = descricao.trim();
  if (texto.length === 0 || texto.length > 300) {
    return { erro: "Informe a subtarefa (até 300 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  const { data: ultima } = await supabase
    .from("subtarefas")
    .select("ordem")
    .eq("tarefa_id", tarefaId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultima?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("subtarefas")
    .insert({ tarefa_id: tarefaId, descricao: texto, ordem });
  if (error) {
    console.error("criarSubtarefa:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export type CamposSubtarefa = {
  descricao?: string;
  prazo?: string | null; // "AAAA-MM-DD"
  concluida?: boolean;
  observacao?: string | null;
};

export async function atualizarSubtarefa(
  id: string,
  campos: CamposSubtarefa,
): Promise<Resultado> {
  const mudancas: TablesUpdate<"subtarefas"> = {};

  if (campos.descricao !== undefined) {
    const descricao = campos.descricao.trim();
    if (descricao.length === 0 || descricao.length > 300) {
      return { erro: "Informe a subtarefa (até 300 caracteres)." };
    }
    mudancas.descricao = descricao;
  }
  if (campos.prazo !== undefined) {
    if (campos.prazo !== null && !dataValida(campos.prazo)) {
      return { erro: "Data inválida." };
    }
    mudancas.prazo = campos.prazo;
  }
  if (campos.concluida !== undefined) {
    if (typeof campos.concluida !== "boolean") return { erro: ERRO_GENERICO };
    mudancas.concluida = campos.concluida;
    mudancas.concluida_em = campos.concluida ? new Date().toISOString() : null;
  }
  if (campos.observacao !== undefined) {
    const observacao = campos.observacao?.trim() ?? "";
    if (observacao.length > 1000) return { erro: "Observação muito longa." };
    mudancas.observacao = observacao || null;
  }

  if (Object.keys(mudancas).length === 0) return { erro: null };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("subtarefas")
    .update(mudancas)
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("atualizarSubtarefa:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

export async function excluirSubtarefa(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("subtarefas")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("excluirSubtarefa:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

export async function reordenarSubtarefas(
  tarefaId: string,
  ids: string[],
): Promise<Resultado> {
  if (!listaDeIds(ids)) return { erro: ERRO_ORDEM };

  const supabase = await createClientAutenticado();
  const respostas = await Promise.all(
    ids.map((id, posicao) =>
      supabase
        .from("subtarefas")
        .update({ ordem: posicao + 1 })
        .eq("id", id)
        .eq("tarefa_id", tarefaId),
    ),
  );
  const falha = respostas.find((resposta) => resposta.error);
  if (falha?.error) {
    console.error("reordenarSubtarefas:", falha.error.message);
    return { erro: ERRO_ORDEM };
  }

  atualizarTelas();
  return { erro: null };
}
