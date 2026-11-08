import { redirect } from "next/navigation";
import { MenuLateral } from "@/components/menu-lateral";
import { createClient } from "@/lib/supabase/server";

// Layout de todas as telas logadas: menu lateral + conteúdo.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Segunda barreira de segurança (a primeira é o proxy.ts): sem sessão, volta para o login.
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/login");
  }

  // Marcas ativas para a lista do menu. Se o banco ainda não tiver as tabelas
  // (migration não rodada), o menu simplesmente aparece sem marcas.
  const { data: marcas } = await supabase
    .from("marcas")
    .select("id, nome")
    .eq("ativa", true)
    .order("ordem")
    .order("nome");

  return (
    <div className="flex min-h-screen">
      <MenuLateral marcas={marcas ?? []} email={data.claims.email ?? ""} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
