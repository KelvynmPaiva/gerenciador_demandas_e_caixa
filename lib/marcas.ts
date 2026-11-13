import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Marcas ativas, na ordem do menu. Layout, Painel e tela Marcas usam a mesma lista:
// com React.cache a consulta roda uma vez por requisição, não uma por componente.
export const listarMarcasAtivas = cache(async () => {
  const supabase = await createClient();
  return supabase
    .from("marcas")
    .select("id, nome")
    .eq("ativa", true)
    .order("ordem")
    .order("nome");
});
