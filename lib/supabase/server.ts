import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Cliente do Supabase para páginas (Server Components) e Server Actions.
// Cria um cliente novo a cada chamada, porque ele precisa dos cookies da requisição.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Páginas não conseguem gravar cookies. Pode ignorar: o proxy.ts
            // já renova a sessão a cada requisição.
          }
        },
      },
    },
  );
}
