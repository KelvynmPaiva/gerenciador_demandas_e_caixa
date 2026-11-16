"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Tag, UserRound } from "lucide-react";
import { sair } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Barra fixa de baixo no celular (< 768px): Painel, Marcas e Conta.
// A lateral some nessa largura; o alternador de tema e o "Sair" ficam na aba Conta.
export function NavegacaoMobile({ email }: { email: string }) {
  const pathname = usePathname();
  const [contaAberta, setContaAberta] = useState(false);

  const item = (ativo: boolean) =>
    cn(
      "flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
      ativo ? "text-brand" : "text-muted-foreground",
    );

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 flex h-16 border-t bg-card md:hidden"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={item(pathname === "/")}
        >
          <LayoutDashboard className="size-5" aria-hidden />
          Painel
        </Link>
        <Link
          href="/marcas"
          aria-current={pathname.startsWith("/marcas") ? "page" : undefined}
          className={item(pathname.startsWith("/marcas"))}
        >
          <Tag className="size-5" aria-hidden />
          Marcas
        </Link>
        <button
          type="button"
          onClick={() => setContaAberta(true)}
          aria-haspopup="dialog"
          className={item(contaAberta)}
        >
          <UserRound className="size-5" aria-hidden />
          Conta
        </button>
      </nav>

      <Sheet open={contaAberta} onOpenChange={setContaAberta}>
        <SheetContent side="bottom" className="rounded-t-xl pb-4">
          <SheetHeader>
            <SheetTitle>Conta</SheetTitle>
            <SheetDescription className="truncate">{email}</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <ThemeToggle />
            <form action={sair} className="mt-2">
              <Button
                type="submit"
                variant="outline"
                className="h-10 w-full justify-center text-danger-text"
              >
                <LogOut data-icon="inline-start" />
                Sair
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
