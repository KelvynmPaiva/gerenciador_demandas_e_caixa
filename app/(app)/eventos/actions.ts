"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dataValida } from "@/lib/datas";
import { lerLink } from "@/lib/links";
import type { Resultado } from "@/lib/resultado";
import { createClient } from "@/lib/supabase/server";

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NAO_ENCONTRADO = "Evento não encontrado. Atualize a página.";

function atualizarTelas() {
  revalidatePath("/", "layout");
}

export type DadosEvento = {
  nome: string;
  tipo: string; // "evento" ou "acao"
  dataInicio: string | null; // "AAAA-MM-DD"
  dataFim: string | null;
  linkExterno: string;
  observacao: string;
};

// Confere os dados e devolve já prontos para gravar no banco (ou a mensagem de erro).
function prepararEvento(dados: DadosEvento) {
  const nome = dados.nome.trim();
  if (nome.length === 0 || nome.length > 120) {
    return { erro: "Informe o nome (até 120 caracteres)." } as const;
  }
  if (dados.tipo !== "evento" && dados.tipo !== "acao") {
    return { erro: "Escolha o tipo: Evento ou Ação." } as const;
  }
  for (const data of [dados.dataInicio, dados.dataFim]) {
    if (data !== null && !dataValida(data)) {
      return { erro: "Data inválida." } as const;
    }
  }
  // As datas são opcionais, mas a data final só faz sentido com a inicial
  if (dados.dataFim && !dados.dataInicio) {
    return { erro: "Informe a data de início." } as const;
  }
  if (dados.dataInicio && dados.dataFim && dados.dataFim < dados.dataInicio) {
    return { erro: "A data final não pode ser antes da data de início." } as const;
  }

  const link = lerLink(dados.linkExterno);
  if (!link.valido) {
    return {
      erro: "Link inválido. Use um endereço como https://drive.google.com/...",
    } as const;
  }

  const observacao = dados.observacao.trim();
  if (observacao.length > 2000) {
    return { erro: "A observação é muito longa (máximo 2000 caracteres)." } as const;
  }

  return {
    erro: null,
    campos: {
      nome,
      tipo: dados.tipo,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim,
      link_externo: link.link,
      observacao: observacao || null,
    },
  } as const;
}

export async function criarEvento(
  marcaId: string,
  dados: DadosEvento,
): Promise<Resultado> {
  const preparado = prepararEvento(dados);
  if (preparado.erro) return { erro: preparado.erro };

  const supabase = await createClient();
  const { error } = await supabase
    .from("eventos")
    .insert({ marca_id: marcaId, ...preparado.campos });

  if (error) {
    console.error("criarEvento:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export async function editarEvento(
  id: string,
  dados: DadosEvento,
): Promise<Resultado> {
  const preparado = prepararEvento(dados);
  if (preparado.erro) return { erro: preparado.erro };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .update(preparado.campos)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("editarEvento:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Arquivar não apaga nada: o evento só sai da lista de "Ativos" da marca e
// passa a aparecer no filtro "Arquivados". Dá para desarquivar quando quiser.
export async function arquivarEvento(
  id: string,
  arquivado: boolean,
): Promise<Resultado> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("eventos")
    .update({ arquivado })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("arquivarEvento:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// Exclui o evento e, em cascata, seu orçamento, seções, tarefas e subtarefas.
// A tela sempre pede confirmação antes de chamar esta ação.
// Na página do próprio evento (irParaMarca = true) volta para a tela da marca,
// já que a página do evento deixa de existir.
export async function excluirEvento(
  id: string,
  irParaMarca: boolean,
): Promise<Resultado> {
  const supabase = await createClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("marca_id")
    .eq("id", id)
    .maybeSingle();
  if (!evento) return { erro: ERRO_NAO_ENCONTRADO };

  const { data, error } = await supabase
    .from("eventos")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("excluirEvento:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  if (irParaMarca) redirect(`/marcas/${evento.marca_id}`);
  return { erro: null };
}
