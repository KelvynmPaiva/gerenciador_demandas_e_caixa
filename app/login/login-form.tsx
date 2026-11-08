"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = { erro: null };

export function LoginForm() {
  const [estado, acao, enviando] = useActionState(entrar, estadoInicial);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <form action={acao} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail profissional</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="exemplo@empresa.com.br"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <div className="relative">
          <Input
            id="senha"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((valor) => !valor)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {mostrarSenha ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {estado.erro && (
        <p
          role="alert"
          className="rounded-lg border border-perigo-borda bg-perigo-fundo px-3 py-2 text-sm text-perigo"
        >
          {estado.erro}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="animate-spin" /> Entrando...
          </>
        ) : (
          <>
            Entrar <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
