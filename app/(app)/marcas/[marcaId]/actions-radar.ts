"use server";

import { atualizarTelas, ehUuid, listaDeIds } from "@/lib/acoes";
import { dataValida } from "@/lib/datas";
import { lerLink } from "@/lib/links";
import type { Resultado } from "@/lib/resultado";
import { createClientAutenticado } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

// Ações da seção "No Radar" da marca: itens (espelho das tarefas) e subitens
// (espelho das subtarefas). Mesmas regras e limites das ações de Demandas
// (actions-demandas.ts), para o Radar se comportar igual às listas de evento.
// Itens não têm arrastar na v1, por isso não há reordenar itens; os subitens
// mantêm o arrastar do painel lateral, que é o mesmo das subtarefas.
// A promoção para tarefa de evento (promovido_para_tarefa_id/promovido_em) fica
// para a segunda etapa: nenhuma ação aqui grava esses campos.

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NAO_ENCONTRADO = "Item não encontrado. Atualize a página.";
const ERRO_EXCLUIR = "Não foi possível excluir. Tente novamente.";
const ERRO_ORDEM = "Não foi possível salvar a nova ordem. A tela foi atualizada.";

// ---------- ITENS ----------

// Cria o item só com a descrição; prazo, link e observação ficam no painel lateral
// (igual a criarTarefa). O item novo entra no fim da lista.
export async function criarItemRadar(
  marcaId: string,
  descricao: string,
): Promise<Resultado> {
  if (!ehUuid(marcaId)) return { erro: "Marca não encontrada. Atualize a página." };
  const texto = descricao.trim();
  if (texto.length === 0 || texto.length > 300) {
    return { erro: "Informe a tarefa (até 300 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  const { data: ultimo } = await supabase
    .from("itens_radar")
    .select("ordem")
    .eq("marca_id", marcaId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultimo?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("itens_radar")
    .insert({ marca_id: marcaId, descricao: texto, ordem });
  if (error) {
    console.error("criarItemRadar:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

// Mesmo formato de CamposTarefa: a tela do Radar reaproveita LinhaTarefa/PainelTarefa
export type CamposItemRadar = {
  descricao?: string;
  prazo?: string | null; // "AAAA-MM-DD"
  concluida?: boolean;
  observacao?: string | null;
  linkExterno?: string | null;
};

// Altera só os campos enviados, só daquele item.
export async function atualizarItemRadar(
  id: string,
  campos: CamposItemRadar,
): Promise<Resultado> {
  if (!ehUuid(id)) return { erro: ERRO_NAO_ENCONTRADO };
  const mudancas: TablesUpdate<"itens_radar"> = {};

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
    // Igual às tarefas: concluir não mexe nos subitens; desfazer limpa a data
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
    .from("itens_radar")
    .update(mudancas)
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("atualizarItemRadar:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Exclui o item e os subitens dele (on delete cascade)
export async function excluirItemRadar(id: string): Promise<Resultado> {
  if (!ehUuid(id)) return { erro: ERRO_NAO_ENCONTRADO };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("itens_radar")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("excluirItemRadar:", error.message);
    return { erro: ERRO_EXCLUIR };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// ---------- SUBITENS ----------

export async function criarSubitemRadar(
  itemId: string,
  descricao: string,
): Promise<Resultado> {
  if (!ehUuid(itemId)) return { erro: ERRO_NAO_ENCONTRADO };
  const texto = descricao.trim();
  if (texto.length === 0 || texto.length > 300) {
    return { erro: "Informe a subtarefa (até 300 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  const { data: ultimo } = await supabase
    .from("subitens_radar")
    .select("ordem")
    .eq("item_radar_id", itemId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultimo?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("subitens_radar")
    .insert({ item_radar_id: itemId, descricao: texto, ordem });
  if (error) {
    console.error("criarSubitemRadar:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

// Mesmo formato de CamposSubtarefa (subitens não têm link, igual às subtarefas)
export type CamposSubitemRadar = {
  descricao?: string;
  prazo?: string | null; // "AAAA-MM-DD"
  concluida?: boolean;
  observacao?: string | null;
};

export async function atualizarSubitemRadar(
  id: string,
  campos: CamposSubitemRadar,
): Promise<Resultado> {
  if (!ehUuid(id)) return { erro: ERRO_NAO_ENCONTRADO };
  const mudancas: TablesUpdate<"subitens_radar"> = {};

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
    .from("subitens_radar")
    .update(mudancas)
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("atualizarSubitemRadar:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

export async function excluirSubitemRadar(id: string): Promise<Resultado> {
  if (!ehUuid(id)) return { erro: ERRO_NAO_ENCONTRADO };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("subitens_radar")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("excluirSubitemRadar:", error.message);
    return { erro: ERRO_EXCLUIR };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Recebe os ids dos subitens na nova ordem e grava 1, 2, 3...
export async function reordenarSubitensRadar(
  itemId: string,
  ids: string[],
): Promise<Resultado> {
  if (!ehUuid(itemId) || !listaDeIds(ids)) return { erro: ERRO_ORDEM };

  const supabase = await createClientAutenticado();
  const respostas = await Promise.all(
    ids.map((id, posicao) =>
      supabase
        .from("subitens_radar")
        .update({ ordem: posicao + 1 })
        .eq("id", id)
        .eq("item_radar_id", itemId),
    ),
  );
  const falha = respostas.find((resposta) => resposta.error);
  if (falha?.error) {
    console.error("reordenarSubitensRadar:", falha.error.message);
    return { erro: ERRO_ORDEM };
  }

  atualizarTelas();
  return { erro: null };
}
