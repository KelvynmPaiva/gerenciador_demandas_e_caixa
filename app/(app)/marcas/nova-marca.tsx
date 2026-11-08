"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CirclePlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarMarca } from "./actions";

// Botão (ou cartão tracejado) que abre a janela "Nova marca".
export function NovaMarca({
  variante = "botao",
}: {
  variante?: "botao" | "cartao";
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {variante === "botao" ? (
          <Button>
            <Plus /> Nova marca
          </Button>
        ) : (
          <button
            type="button"
            className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-transparent p-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
              <CirclePlus className="size-6" />
            </span>
            <span className="text-lg font-semibold">Cadastrar nova marca</span>
            <span className="max-w-[220px] text-sm text-muted-foreground">
              Ela aparece nesta lista e no menu lateral.
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {/* O formulário só existe enquanto a janela está aberta: ao fechar, o campo zera sozinho */}
        <FormularioNovaMarca aoFechar={() => setAberto(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FormularioNovaMarca({ aoFechar }: { aoFechar: () => void }) {
  const [nome, setNome] = useState("");
  const [salvando, iniciar] = useTransition();

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const resultado = await criarMarca(nome);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Marca criada.");
      aoFechar();
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Nova marca</DialogTitle>
        <DialogDescription>
          A marca entra no fim da lista e aparece no menu lateral.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="nome-da-marca">Nome</Label>
        <Input
          id="nome-da-marca"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={80}
          required
          autoFocus
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Criar marca"}
        </Button>
      </DialogFooter>
    </form>
  );
}
