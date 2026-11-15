"use server";

import { atualizarTelas, ehUuid, valorValido } from "@/lib/acoes";
import { dataValida, lerMes } from "@/lib/datas";
import { notaComMesmoNome } from "@/lib/despesas";
import type { Resultado } from "@/lib/resultado";
import { createClientAutenticado } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NAO_ENCONTRADO = "Item não encontrado. Atualize a página.";
// Código do Postgres para "valor repetido" (aqui: unique nota + mês)
const VIOLACAO_DE_UNICO = "23505";

// ---------- NOTAS RECORRENTES (o nome da despesa, comum a todos os meses) ----------

export type DadosNota = {
  nome: string;
  observacao: string;
};

function validarNome(nome: string): string | null {
  const limpo = nome.trim();
  if (limpo.length === 0 || limpo.length > 120) {
    return "Informe o nome da despesa (até 120 caracteres).";
  }
  return null;
}

// O nome mora só na nota: a tabela do mês e o Painel leem daqui,
// então renomear vale para todos os meses (passados e futuros).
export async function editarNota(
  id: string,
  dados: DadosNota,
): Promise<Resultado> {
  const erroDeValidacao = validarNome(dados.nome);
  if (erroDeValidacao) return { erro: erroDeValidacao };
  if (dados.observacao.trim().length > 1000) {
    return { erro: "Observação muito longa." };
  }

  const supabase = await createClientAutenticado();

  // Mesma regra do "Nova despesa": dois nomes iguais na mesma marca virariam
  // duas despesas indistinguíveis nas sugestões e no Painel.
  const { data: atual, error: erroAtual } = await supabase
    .from("notas_recorrentes")
    .select("marca_id")
    .eq("id", id)
    .maybeSingle();
  if (erroAtual) {
    console.error("editarNota (nota):", erroAtual.message);
    return { erro: ERRO_GENERICO };
  }
  if (!atual) return { erro: ERRO_NAO_ENCONTRADO };

  const { data: notas, error: erroNotas } = await supabase
    .from("notas_recorrentes")
    .select("id, nome")
    .eq("marca_id", atual.marca_id);
  if (erroNotas) {
    console.error("editarNota (notas):", erroNotas.message);
    return { erro: ERRO_GENERICO };
  }
  if (notaComMesmoNome(notas, dados.nome, id)) {
    return { erro: "Já existe uma despesa com esse nome." };
  }

  const { data, error } = await supabase
    .from("notas_recorrentes")
    .update({
      nome: dados.nome.trim(),
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

// Apaga a despesa recorrente e, em cascata (on delete cascade), ela em todos os meses.
export async function excluirNota(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("notas_recorrentes")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("excluirNota:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}

// ---------- OCORRÊNCIAS MENSAIS (a despesa de cada mês) ----------

export type DadosDespesa = {
  notaId: string | null; // despesa já cadastrada (sugestão)...
  nomeNovo: string; // ...ou uma despesa nova, pelo nome
  mes: string; // "AAAA-MM"
  vencimento: string; // "AAAA-MM-DD"
  valorReal: number | null;
};

// Cadastro manual de uma despesa num mês. Não existe geração automática:
// cada mês tem só o que foi adicionado aqui. A mesma despesa não entra duas
// vezes no mesmo mês (unique nota + mês no banco).
export async function criarOcorrencia(
  marcaId: string,
  dados: DadosDespesa,
): Promise<Resultado> {
  if (!ehUuid(marcaId)) return { erro: ERRO_NAO_ENCONTRADO };
  const mes = lerMes(dados.mes);
  if (!mes) return { erro: "Mês inválido." };
  if (!dataValida(dados.vencimento)) return { erro: "Data inválida." };
  if (dados.valorReal !== null && !valorValido(dados.valorReal)) {
    return { erro: "Valor real inválido." };
  }
  if (dados.notaId === null) {
    const erroDeValidacao = validarNome(dados.nomeNovo);
    if (erroDeValidacao) return { erro: erroDeValidacao };
  } else if (!ehUuid(dados.notaId)) {
    return { erro: ERRO_NAO_ENCONTRADO };
  }

  const supabase = await createClientAutenticado();

  const { data: notas, error: erroNotas } = await supabase
    .from("notas_recorrentes")
    .select("id, nome")
    .eq("marca_id", marcaId);
  if (erroNotas) {
    console.error("criarOcorrencia (notas):", erroNotas.message);
    return { erro: ERRO_GENERICO };
  }

  // Qual nota: a escolhida (precisa ser desta marca), uma com o mesmo nome
  // ou uma nova.
  let notaId: string;
  let notaCriadaAgora = false;
  if (dados.notaId !== null) {
    if (!notas.some((nota) => nota.id === dados.notaId)) {
      return { erro: ERRO_NAO_ENCONTRADO };
    }
    notaId = dados.notaId;
  } else {
    const existente = notaComMesmoNome(notas, dados.nomeNovo);
    if (existente) {
      notaId = existente.id;
    } else {
      const { data: nova, error } = await supabase
        .from("notas_recorrentes")
        .insert({ marca_id: marcaId, nome: dados.nomeNovo.trim() })
        .select("id")
        .single();
      if (error) {
        console.error("criarOcorrencia (nova nota):", error.message);
        return { erro: ERRO_GENERICO };
      }
      notaId = nova.id;
      notaCriadaAgora = true;
    }
  }

  const { error } = await supabase.from("ocorrencias_mensais").insert({
    nota_recorrente_id: notaId,
    mes_referencia: `${mes}-01`,
    vencimento: dados.vencimento,
    valor_real: dados.valorReal,
  });

  if (error) {
    // Não deixa uma nota nova "solta" se a despesa do mês não entrou
    if (notaCriadaAgora) {
      const { error: erroDesfazer } = await supabase
        .from("notas_recorrentes")
        .delete()
        .eq("id", notaId);
      if (erroDesfazer) {
        console.error(
          "criarOcorrencia (desfazer nova nota):",
          erroDesfazer.message,
        );
      }
    }
    if (error.code === VIOLACAO_DE_UNICO) {
      return { erro: "Essa despesa já existe neste mês." };
    }
    console.error("criarOcorrencia:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export type CamposOcorrencia = {
  checkMarcado?: boolean;
  vencimento?: string; // "AAAA-MM-DD"
  valorReal?: number | null;
  observacao?: string | null;
};

// Altera só os campos enviados, só daquela ocorrência: marcar o check ou mudar
// a data de um mês NÃO muda a nota-mãe nem os outros meses.
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
  if (campos.vencimento !== undefined) {
    if (!dataValida(campos.vencimento)) return { erro: "Data inválida." };
    mudancas.vencimento = campos.vencimento;
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

// Apaga a despesa só deste mês. A nota-mãe e os outros meses ficam: a despesa
// volta a aparecer como sugestão em "Adicionar despesa" para este mês.
export async function excluirOcorrencia(id: string): Promise<Resultado> {
  if (!ehUuid(id)) return { erro: ERRO_NAO_ENCONTRADO };

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("ocorrencias_mensais")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("excluirOcorrencia:", error.message);
    return { erro: "Não foi possível excluir. Tente novamente." };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADO };

  atualizarTelas();
  return { erro: null };
}
