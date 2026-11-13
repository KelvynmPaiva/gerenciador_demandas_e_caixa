import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types/database";

// Cliente do Supabase para páginas (Server Components) e Server Actions.
// Um cliente por requisição (React.cache): layout e página reaproveitam o mesmo,
// porque ele depende dos cookies da requisição e nunca é compartilhado entre pessoas.
export const createClient = cache(async function createClient() {
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
});

// Claims da sessão, validados uma única vez por requisição (layout, páginas e actions).
export const obterClaims = cache(async function obterClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});

// Cliente para Server Actions: recusa a chamada se não houver sessão válida.
// Server Actions são endpoints POST públicos; a RLS já barra anônimos, mas esta
// checagem evita depender só dela.
export async function createClientAutenticado() {
  if (!(await obterClaims())) {
    throw new Error("Não autenticado.");
  }
  return createClient();
}
