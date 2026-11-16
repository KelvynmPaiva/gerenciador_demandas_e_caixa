"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { ptBR } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { DateChip } from "@/components/date-chip";
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
  concluido = false,
  permitirLimpar = true,
}: {
  valor: string | null;
  onChange: (novaData: string | null) => void;
  rotulo: string;
  placeholder?: string;
  estilo?: "campo" | "linha";
  destaque?: boolean; // texto vermelho (ex.: prazo vencido); no estilo "linha" a cor vem do DateChip
  concluido?: boolean; // estilo "linha": item já concluído, então o prazo não mostra urgência
  permitirLimpar?: boolean; // false quando a data é obrigatória (ex.: data da despesa do mês)
}) {
  const [aberto, setAberto] = useState(false);
  const data = valor ? textoParaDate(valor) : undefined;

  function escolher(novaData: string | null) {
    // Clicar de novo no dia já escolhido "desmarca" no calendário: se a data é
    // obrigatória, só fecha sem apagar.
    if (novaData !== null || permitirLimpar) onChange(novaData);
    setAberto(false);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={rotulo}
          className={cn(
            "num inline-flex h-[34px] items-center gap-2 rounded-md border text-[13.5px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
            estilo === "campo"
              ? "w-full border-input bg-card px-3 shadow-xs hover:border-control-border"
              : "h-8 border-transparent px-2 hover:border-input hover:bg-card",
            !valor && "text-subtle-foreground",
            destaque && "font-medium text-danger-text",
          )}
        >
          {estilo === "linha" && valor ? (
            <DateChip data={valor} concluido={concluido} />
          ) : (
            <>
              <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
              {valor ? formatarData(valor) : placeholder}
            </>
          )}
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
        {valor && permitirLimpar && (
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
