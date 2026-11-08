"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Janela de confirmação para ações que merecem um "tem certeza?"
// (desativar marca, excluir evento...).
export function DialogoConfirmar({
  aberto,
  aoMudar,
  titulo,
  descricao,
  rotuloConfirmar = "Confirmar",
  perigo = false,
  carregando = false,
  aoConfirmar,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  perigo?: boolean; // botão vermelho, para ações destrutivas
  carregando?: boolean;
  aoConfirmar: () => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => aoMudar(false)}
            disabled={carregando}
          >
            Cancelar
          </Button>
          <Button
            onClick={aoConfirmar}
            disabled={carregando}
            className={cn(perigo && "bg-destructive text-white hover:bg-destructive/90")}
          >
            {carregando ? "Aguarde..." : rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
