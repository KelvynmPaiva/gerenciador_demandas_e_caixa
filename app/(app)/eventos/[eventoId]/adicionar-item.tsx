"use client";

import { useState, useTransition } from "react";
import { CirclePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { criarItem } from "./actions";

// "+ Adicionar item": a pessoa digita só o nome do serviço e tecla Enter.
// O resto (fornecedor, valores, NF, prazo) ela preenche na própria linha da tabela.
export function AdicionarItem({ eventoId }: { eventoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [salvando, iniciar] = useTransition();

  function adicionar() {
    const servico = texto.trim();
    if (servico === "") {
      setAberto(false); // campo vazio = desistiu
      return;
    }
    if (salvando) return;

    iniciar(async () => {
      const resultado = await criarItem(eventoId, servico);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      setTexto(""); // continua aberto para adicionar o próximo
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <CirclePlus className="size-4" /> Adicionar item
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
            if (e.key === "Escape") {
              setTexto("");
              setAberto(false);
            }
          }}
          onBlur={() => {
            if (texto.trim() === "") setAberto(false);
          }}
          placeholder="Nome do serviço (ex.: Cenografia e stands)"
          aria-label="Nome do novo serviço"
          maxLength={200}
          autoFocus
          className="max-w-md"
        />
        <Button type="button" onClick={adicionar} disabled={salvando}>
          {salvando ? "Adicionando..." : "Adicionar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setTexto("");
            setAberto(false);
          }}
        >
          Cancelar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Digite o serviço e tecle Enter. Fornecedor, valores, NF e prazo você
        preenche direto na linha da tabela.
      </p>
    </div>
  );
}
