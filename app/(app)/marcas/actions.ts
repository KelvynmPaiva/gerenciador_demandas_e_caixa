"use server";

import { atualizarTelas } from "@/lib/acoes";
import { createClientAutenticado } from "@/lib/supabase/server";
import type { Resultado } from "@/lib/resultado";

const ERRO_GENERICO = "Não foi possível salvar. Tente novamente.";
const ERRO_NOME_REPETIDO =
  "Já existe uma marca com esse nome (ela pode estar desativada).";
const ERRO_NAO_ENCONTRADA = "Marca não encontrada.";

// Nome da marca: obrigatório, até 80 caracteres
function limparNome(nome: string): string | null {
  const limpo = nome.trim();
  return limpo.length > 0 && limpo.length <= 80 ? limpo : null;
}

export async function criarMarca(nome: string): Promise<Resultado> {
  const nomeLimpo = limparNome(nome);
  if (!nomeLimpo) {
    return { erro: "Informe o nome da marca (até 80 caracteres)." };
  }

  const supabase = await createClientAutenticado();

  // A marca nova entra no fim da lista
  const { data: ultima } = await supabase
    .from("marcas")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (ultima?.[0]?.ordem ?? 0) + 1;

  const { error } = await supabase
    .from("marcas")
    .insert({ nome: nomeLimpo, ordem });

  if (error) {
    if (error.code === "23505") return { erro: ERRO_NOME_REPETIDO }; // nome é único
    console.error("criarMarca:", error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}

export async function renomearMarca(
  id: string,
  nome: string,
): Promise<Resultado> {
  const nomeLimpo = limparNome(nome);
  if (!nomeLimpo) {
    return { erro: "Informe o nome da marca (até 80 caracteres)." };
  }

  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("marcas")
    .update({ nome: nomeLimpo })
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === "23505") return { erro: ERRO_NOME_REPETIDO };
    console.error("renomearMarca:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADA };

  atualizarTelas();
  return { erro: null };
}

// Desativar NÃO apaga nada: a marca só some da lista e do menu.
// Eventos, tarefas e histórico continuam salvos no banco.
export async function desativarMarca(id: string): Promise<Resultado> {
  const supabase = await createClientAutenticado();
  const { data, error } = await supabase
    .from("marcas")
    .update({ ativa: false })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("desativarMarca:", error.message);
    return { erro: ERRO_GENERICO };
  }
  if (data.length === 0) return { erro: ERRO_NAO_ENCONTRADA };

  atualizarTelas();
  return { erro: null };
}

// Sobe ou desce uma marca na lista. Depois da troca, a coluna "ordem" das
// marcas ativas é regravada como 1, 2, 3... (números sequenciais).
export async function moverMarca(
  id: string,
  direcao: "cima" | "baixo",
): Promise<Resultado> {
  const supabase = await createClientAutenticado();

  const { data: marcas, error } = await supabase
    .from("marcas")
    .select("id")
    .eq("ativa", true)
    .order("ordem")
    .order("nome");

  if (error || !marcas) {
    console.error("moverMarca:", error?.message);
    return { erro: ERRO_GENERICO };
  }

  const posicao = marcas.findIndex((marca) => marca.id === id);
  const destino = direcao === "cima" ? posicao - 1 : posicao + 1;
  if (posicao < 0 || destino < 0 || destino >= marcas.length) {
    return { erro: null }; // já está na ponta da lista, nada a fazer
  }

  [marcas[posicao], marcas[destino]] = [marcas[destino], marcas[posicao]];

  const resultados = await Promise.all(
    marcas.map((marca, indice) =>
      supabase.from("marcas").update({ ordem: indice + 1 }).eq("id", marca.id),
    ),
  );
  const falhou = resultados.find((resultado) => resultado.error);
  if (falhou?.error) {
    console.error("moverMarca:", falhou.error.message);
    return { erro: ERRO_GENERICO };
  }

  atualizarTelas();
  return { erro: null };
}
