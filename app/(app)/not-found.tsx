import Link from "next/link";
import { Button } from "@/components/ui/button";

// "Não encontrado" dentro do layout (o menu lateral continua visível).
export default function NaoEncontrado() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-xs">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O item que você procura não existe ou foi removido.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  );
}
