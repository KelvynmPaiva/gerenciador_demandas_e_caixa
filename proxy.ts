import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// No Next.js 16 o antigo "middleware.ts" passou a se chamar "proxy.ts".
// Ele roda antes de cada tela: renova a sessão e redireciona para /login.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Todas as rotas, menos arquivos estáticos e imagens
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
