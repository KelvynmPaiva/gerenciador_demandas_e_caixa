import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Cliente do Supabase para usar no navegador (componentes "use client").
// Para gravar dados, prefira as Server Actions (veja lib/supabase/server.ts).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
