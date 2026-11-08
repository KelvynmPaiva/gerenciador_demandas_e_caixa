"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Resultado } from "@/lib/resultado";
import { cn } from "@/lib/utils";

// "+ Adicionar ...": a pessoa digita só o nome e tecla Enter; o resto ela preenche depois.
// Continua aberto depois de adicionar, para cadastrar vários em sequência.
// Com `sempreAberto`, o campo já aparece na tela (usado nas subtarefas do painel lateral).
export function CampoAdicionar({
  rotulo,
  placeholder,
  aoAdicionar,
  sempreAberto = false,
  classeBotao,
  maxLength = 300,
}: {
  rotulo: string; // texto do botão e leitura em voz alta
  placeholder: string;
  aoAdicionar: (texto: string) => Promise<Resultado>;
  sempreAberto?: boolean;
  classeBotao?: string;
  maxLength?: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [salvando, iniciar] = useTransition();
  const campo = useRef<HTMLInputElement>(null);

  const mostrarCampo = sempreAberto || aberto;

  function fechar() {
    setTexto("");
    setAberto(false);
  }

  function adicionar() {
    const limpo = texto.trim();
    if (limpo === "") {
      if (!sempreAberto) setAberto(false); // campo vazio = desistiu
      return;
    }
    if (salvando) return;

    iniciar(async () => {
      const resultado = await aoAdicionar(limpo);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      setTexto("");
      campo.current?.focus();
    });
  }

  if (!mostrarCampo) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={cn(
          "flex items-center gap-2 text-sm font-medium text-primary hover:underline",
          classeBotao,
        )}
      >
        <Plus className="size-4" /> {rotulo}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={campo}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            adicionar();
          }
          if (e.key === "Escape" && !sempreAberto) fechar();
        }}
        onBlur={() => {
          if (!sempreAberto && texto.trim() === "") setAberto(false);
        }}
        placeholder={placeholder}
        aria-label={rotulo}
        maxLength={maxLength}
        autoFocus={!sempreAberto}
      />
      <Button type="button" onClick={adicionar} disabled={salvando}>
        {salvando ? "Adicionando..." : "Adicionar"}
      </Button>
      {!sempreAberto && (
        <Button type="button" variant="ghost" onClick={fechar}>
          Cancelar
        </Button>
      )}
    </div>
  );
}
