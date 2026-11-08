import type { Metadata } from "next";
import { LayoutDashboard, Lock } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Gerenciador de tarefas" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-[536px] overflow-hidden rounded-xl border border-t-[3px] border-t-primary bg-card p-11 shadow-xs">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-muted text-primary">
            <LayoutDashboard className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            Gerenciador de tarefas
          </h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Acesse o cockpit operacional de marketing automotivo
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Acesso restrito
          <span className="h-px flex-1 bg-border" />
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <Lock className="size-3.5" />
          Ambiente seguro • Gestão de marcas premium
        </p>
      </div>
    </main>
  );
}
