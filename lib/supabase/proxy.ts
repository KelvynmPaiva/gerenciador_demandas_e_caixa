import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// Renova a sessão do Supabase e protege as telas:
// - sem sessão → manda para /login
// - com sessão e abrindo /login → manda para o painel
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Cabeçalhos que impedem o cache de guardar a sessão de alguém
          Object.entries(headers).forEach(([chave, valor]) =>
            response.headers.set(chave, valor),
          );
        },
      },
    },
  );

  // Importante: não coloque código entre o createServerClient e o getClaims,
  // senão o usuário pode ser deslogado "do nada". O getClaims valida o token.
  const { data } = await supabase.auth.getClaims();
  const logado = !!data?.claims;
  const naTelaDeLogin = request.nextUrl.pathname === "/login";

  if (!logado && !naTelaDeLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (logado && naTelaDeLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
