"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatarNumero, lerValor } from "@/lib/formato";

// Campos para editar direto na linha de uma tabela (ocorrências, orçamento).
// Regra: salva ao sair do campo (blur) ou ao apertar Enter. Esc cancela.

// Campo de valor em reais. Mostra "18.500,00" e aceita "18500", "18.500,00", "R$ 18.500,00".
export function CampoValor({
  valor,
  onSalvar,
  rotulo,
  destaque = false,
}: {
  valor: number | null;
  onSalvar: (novoValor: number | null) => void;
  rotulo: string; // leitura em voz alta para quem usa leitor de tela
  destaque?: boolean; // fundo âmbar, para chamar atenção (ex.: falta valor real)
}) {
  const [texto, setTexto] = useState(formatarNumero(valor));
  const [valorAnterior, setValorAnterior] = useState(valor);
  const cancelou = useRef(false);

  // Se o valor mudar por fora (ex.: depois de salvar ou desfazer), atualiza o texto
  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    setTexto(formatarNumero(valor));
  }

  function salvar() {
    if (cancelou.current) {
      cancelou.current = false;
      setTexto(formatarNumero(valor));
      return;
    }

    const lido = lerValor(texto);
    if (!lido.valido) {
      toast.error("Valor inválido. Digite algo como 1.234,56");
      setTexto(formatarNumero(valor));
      return;
    }

    setTexto(formatarNumero(lido.valor));
    if (lido.valor !== valor) onSalvar(lido.valor);
  }

  return (
    <div className="relative w-32">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground">
        R$
      </span>
      <input
        aria-label={rotulo}
        inputMode="decimal"
        placeholder="0,00"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelou.current = true;
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "h-8 w-full rounded-lg border pr-2.5 pl-8 text-right text-sm tabular-nums outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-[#d1d5db] focus:border-ring focus:bg-card focus:ring-1 focus:ring-ring",
          destaque
            ? "border-atencao-borda bg-atencao-fundo"
            : "border-input bg-[#f9fafb]",
        )}
      />
    </div>
  );
}

// Campo de texto de várias linhas (título e observação no painel da tarefa).
// Salva ao sair do campo. Esc cancela. Com `permitirQuebra` falso, Enter também salva.
export function CampoAreaTexto({
  valor,
  onSalvar,
  rotulo,
  placeholder,
  className,
  obrigatorio = false,
  permitirQuebra = true,
  maxLength,
}: {
  valor: string | null;
  onSalvar: (novoTexto: string | null) => void;
  rotulo: string;
  placeholder?: string;
  className?: string;
  obrigatorio?: boolean;
  permitirQuebra?: boolean;
  maxLength?: number;
}) {
  const [texto, setTexto] = useState(valor ?? "");
  const [valorAnterior, setValorAnterior] = useState(valor);
  const cancelou = useRef(false);

  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    setTexto(valor ?? "");
  }

  function salvar() {
    if (cancelou.current) {
      cancelou.current = false;
      setTexto(valor ?? "");
      return;
    }

    const novo = texto.trim() === "" ? null : texto.trim();
    if (novo === null && obrigatorio) {
      toast.error("Este campo não pode ficar vazio.");
      setTexto(valor ?? "");
      return;
    }
    setTexto(novo ?? "");
    if (novo !== (valor ?? null)) onSalvar(novo);
  }

  return (
    <textarea
      aria-label={rotulo}
      placeholder={placeholder}
      value={texto}
      maxLength={maxLength}
      rows={1}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={salvar}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !permitirQuebra) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          cancelou.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(
        "block field-sizing-content w-full resize-none rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-input focus:border-ring focus:bg-card focus:ring-1 focus:ring-ring",
        className,
      )}
    />
  );
}

// Campo de texto simples (observação, fornecedor...). Texto vazio vira "sem valor" (null).
export function CampoTexto({
  valor,
  onSalvar,
  rotulo,
  placeholder,
  className,
  obrigatorio = false,
}: {
  valor: string | null;
  onSalvar: (novoTexto: string | null) => void;
  rotulo: string;
  placeholder?: string;
  className?: string;
  obrigatorio?: boolean; // não deixa apagar tudo (ex.: nome do serviço)
}) {
  const [texto, setTexto] = useState(valor ?? "");
  const [valorAnterior, setValorAnterior] = useState(valor);
  const cancelou = useRef(false);

  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    setTexto(valor ?? "");
  }

  function salvar() {
    if (cancelou.current) {
      cancelou.current = false;
      setTexto(valor ?? "");
      return;
    }

    const novo = texto.trim() === "" ? null : texto.trim();
    if (novo === null && obrigatorio) {
      toast.error("Este campo não pode ficar vazio.");
      setTexto(valor ?? "");
      return;
    }
    setTexto(novo ?? "");
    if (novo !== (valor ?? null)) onSalvar(novo);
  }

  return (
    <input
      aria-label={rotulo}
      title={texto || undefined} // texto completo ao passar o mouse, quando o campo corta
      placeholder={placeholder}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={salvar}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          cancelou.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(
        "h-8 w-full rounded-lg border border-transparent bg-transparent px-2.5 text-sm text-ellipsis outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-input focus:border-ring focus:bg-card focus:ring-1 focus:ring-ring",
        className,
      )}
    />
  );
}
