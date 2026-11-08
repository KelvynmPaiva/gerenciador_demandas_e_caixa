"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { ptBR } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateParaTexto, textoParaDate } from "@/lib/datas";
import { formatarData } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Escolha de data com calendário em português. A data é sempre texto "AAAA-MM-DD".
// - estilo "campo": parece um campo de formulário (janelas de cadastro)
// - estilo "linha": discreto, para editar direto dentro de uma tabela
export function SeletorData({
  valor,
  onChange,
  rotulo,
  placeholder = "Definir data",
  estilo = "campo",
  destaque = false,
}: {
  valor: string | null;
  onChange: (novaData: string | null) => void;
  rotulo: string;
  placeholder?: string;
  estilo?: "campo" | "linha";
  destaque?: boolean; // texto vermelho (ex.: prazo vencido)
}) {
  const [aberto, setAberto] = useState(false);
  const data = valor ? textoParaDate(valor) : undefined;

  function escolher(novaData: string | null) {
    onChange(novaData);
    setAberto(false);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={rotulo}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border text-sm tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
            estilo === "campo"
              ? "w-full border-input bg-card px-3 hover:border-[#d1d5db]"
              : "h-8 border-transparent px-2 hover:border-input hover:bg-card",
            !valor && "text-muted-foreground/70",
            destaque && "font-medium text-perigo",
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          {valor ? formatarData(valor) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={data}
          defaultMonth={data}
          onSelect={(escolhida) =>
            escolher(escolhida ? dateParaTexto(escolhida) : null)
          }
        />
        {valor && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => escolher(null)}
            >
              Limpar data
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
