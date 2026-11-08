"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleCheck, Car, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sair } from "@/app/login/actions";
import { cn } from "@/lib/utils";

type MarcaDoMenu = { id: string; nome: string };

// Estilo dos links do menu; o ativo ganha o fundo azul claro do design system
function classeLink(ativo: boolean) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    ativo
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );
}

export function MenuLateral({
  marcas,
  email,
}: {
  marcas: MarcaDoMenu[];
  email: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-5 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CircleCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">
            Gerenciador de tarefas
          </p>
          <p className="text-xs text-muted-foreground">Cockpit Operacional</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link href="/" className={classeLink(pathname === "/")}>
          <LayoutDashboard className="size-5" />
          Painel
        </Link>

        <Link href="/marcas" className={classeLink(pathname === "/marcas")}>
          <Car className="size-5" />
          Marcas
        </Link>

        {/* Lista das marcas ativas, direto no menu */}
        <ul className="ml-[22px] space-y-0.5 border-l pl-3">
          {marcas.length === 0 && (
            <li className="px-3 py-1.5 text-[13px] text-muted-foreground">
              Nenhuma marca ativa
            </li>
          )}
          {marcas.map((marca) => (
            <li key={marca.id}>
              <Link
                href={`/marcas/${marca.id}`}
                className={cn(
                  "block truncate rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  pathname === `/marcas/${marca.id}`
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {marca.nome}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Usuário logado e botão Sair */}
      <div className="space-y-1 border-t p-3">
        <p className="truncate px-3 pb-1 text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <form action={sair}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-perigo hover:bg-perigo-fundo hover:text-perigo"
          >
            <LogOut className="size-5" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  );
}
