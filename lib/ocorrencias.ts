import type { createClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, somarMeses } from "@/lib/datas";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

// Gera as ocorrências mensais (despesas recorrentes) do mês atual e do próximo.
// A função do banco é idempotente: pode chamar quantas vezes quiser, não duplica.
// Chamada ao abrir o painel e a tela de uma marca.
export async function gerarOcorrenciasDoMesAtualEProximo(
  supabase: ClienteSupabase,
) {
  const mesAtual = hojeSaoPaulo().slice(0, 7);

  for (const mes of [mesAtual, somarMeses(mesAtual, 1)]) {
    const { error } = await supabase.rpc("gerar_ocorrencias", {
      p_mes: `${mes}-01`,
    });
    if (error) {
      console.error("Erro ao gerar ocorrências de", mes, error.message);
    }
  }
}
