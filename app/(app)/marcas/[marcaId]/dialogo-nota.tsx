"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editarNota } from "./actions";

// Nota recorrente = o nome da despesa (ex.: "Gráfica"), comum a todos os meses.
// A data, o valor real e o check ficam em cada mês (ocorrência).
export type NotaRecorrente = {
  id: string;
  nome: string;
  observacao: string | null;
};

// Janela para renomear uma despesa recorrente (vale para todos os meses).
export function DialogoNota({
  aberto,
  aoMudar,
  nota,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  nota: NotaRecorrente;
}) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="sm:max-w-lg">
        {/* O formulário só existe com a janela aberta: ao reabrir, os campos começam do zero */}
        <FormularioNota nota={nota} aoFechar={() => aoMudar(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FormularioNota({
  nota,
  aoFechar,
}: {
  nota: NotaRecorrente;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(nota.nome);
  const [observacao, setObservacao] = useState(nota.observacao ?? "");
  const [salvando, iniciar] = useTransition();

  function enviar(evento: FormEvent) {
    evento.preventDefault();

    iniciar(async () => {
      const resultado = await editarNota(nota.id, { nome, observacao });
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Despesa atualizada. O nome vale para todos os meses.");
      aoFechar();
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Editar despesa recorrente</DialogTitle>
        <DialogDescription>
          O nome muda em todos os meses em que esta despesa aparece. Data, valor
          real e check continuam sendo de cada mês.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="nota-nome">Nome da despesa</Label>
        <Input
          id="nota-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Assessoria de imprensa"
          maxLength={120}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nota-observacao">Observação (opcional)</Label>
        <Textarea
          id="nota-observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          maxLength={1000}
          className="bg-card text-sm"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
