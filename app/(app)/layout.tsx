import { redirect } from "next/navigation";
import { MenuLateral } from "@/components/menu-lateral";
import { listarMarcasAtivas } from "@/lib/marcas";
import { obterClaims } from "@/lib/supabase/server";

// Layout de todas as telas logadas: menu lateral + conteúdo.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Segunda barreira de segurança (a primeira é o proxy.ts): sem sessão, volta para o login.
  // Claims e marcas em paralelo; se o banco ainda não tiver as tabelas
  // (migration não rodada), o menu simplesmente aparece sem marcas.
  const [claims, marcas] = await Promise.all([
    obterClaims(),
    listarMarcasAtivas(),
  ]);
  if (!claims) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <MenuLateral marcas={marcas.data ?? []} email={claims.email ?? ""} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
