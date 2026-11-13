import type { createClient } from "@/lib/supabase/server";
import { hojeSaoPaulo, somarMeses } from "@/lib/datas";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

// Gera as ocorrências mensais (despesas recorrentes) do mês atual e do próximo.
// A função do banco é idempotente: pode chamar quantas vezes quiser, não duplica.
// Chamada ao abrir o painel e a tela de uma marca. Os dois meses vão em paralelo.
export async function gerarOcorrenciasDoMesAtualEProximo(
  supabase: ClienteSupabase,
) {
  const mesAtual = hojeSaoPaulo().slice(0, 7);
  const meses = [mesAtual, somarMeses(mesAtual, 1)];

  const respostas = await Promise.all(
    meses.map((mes) => supabase.rpc("gerar_ocorrencias", { p_mes: `${mes}-01` })),
  );
  respostas.forEach(({ error }, i) => {
    if (error) {
      console.error("Erro ao gerar ocorrências de", meses[i], error.message);
    }
  });
}
