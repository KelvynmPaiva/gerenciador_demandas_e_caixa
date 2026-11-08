"use client";

import { Button } from "@/components/ui/button";

// Tela de erro mostrada dentro do layout (o menu lateral continua visível).
export default function ErroDaTela({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-xs">
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar esta tela. Confira sua conexão e tente de
          novo.
        </p>
        <Button className="mt-5" onClick={() => reset()}>
          Tentar de novo
        </Button>
      </div>
    </div>
  );
}
