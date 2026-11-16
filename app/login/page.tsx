import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Gerenciador de tarefas" };

export default function LoginPage() {
  return (
    // Fundo pontilhado que funciona nos dois temas (segue o tema do sistema)
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_1px)] bg-[size:20px_20px] px-4 py-12 sm:px-6">
      <div className="w-full max-w-[420px] rounded-xl border bg-card p-6 shadow-overlay sm:p-8">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CircleCheck className="size-5" aria-hidden />
          </div>
          <h1 className="text-title">Gerenciador de tarefas</h1>
          <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">
            Entre com o e-mail e a senha da equipe.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
