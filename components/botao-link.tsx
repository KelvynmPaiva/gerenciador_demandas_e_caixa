"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { lerLink, linkSeguro } from "@/lib/links";
import { cn } from "@/lib/utils";

// Ícone de link que abre uma janelinha para colar/editar o endereço
// (Drive, Figma, NF...). O app não guarda arquivos, só o link.
export function BotaoLink({
  valor,
  onSalvar,
  rotulo,
}: {
  valor: string | null;
  onSalvar: (novoLink: string | null) => void;
  rotulo: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState(valor ?? "");
  const linkParaAbrir = linkSeguro(valor);

  function aoAbrirOuFechar(novoEstado: boolean) {
    setAberto(novoEstado);
    if (novoEstado) setTexto(valor ?? ""); // sempre começa com o link salvo
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    const lido = lerLink(texto);
    if (!lido.valido) {
      toast.error("Link inválido. Use um endereço como https://drive.google.com/...");
      return;
    }
    if (lido.link !== (valor ?? null)) onSalvar(lido.link);
    setAberto(false);
  }

  return (
    <Popover open={aberto} onOpenChange={aoAbrirOuFechar}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={rotulo}
          title={valor ? "Link salvo. Clique para ver ou editar" : "Adicionar link"}
          className={cn(valor ? "text-primary" : "text-muted-foreground/60")}
        >
          <Link2 />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={salvar} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="campo-link">Link externo</Label>
            <Input
              id="campo-link"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="https://..."
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Deixe vazio para remover o link.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            {linkParaAbrir ? (
              <Button asChild variant="outline" size="sm">
                <a href={linkParaAbrir} target="_blank" rel="noopener noreferrer">
                  Abrir link <ExternalLink />
                </a>
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm">
              Salvar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
