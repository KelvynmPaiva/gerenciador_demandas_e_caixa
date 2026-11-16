"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Janela de confirmação para ações que merecem um "tem certeza?"
// (desativar marca, excluir evento...). É um AlertDialog: não fecha ao clicar fora
// e leva o foco para "Cancelar".
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
    <AlertDialog open={aberto} onOpenChange={aoMudar}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={carregando}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={perigo ? "destructive" : "default"}
            disabled={carregando}
            // Sem isto o Radix fecharia o diálogo antes de a ação terminar
            onClick={(e) => {
              e.preventDefault();
              aoConfirmar();
            }}
          >
            {carregando ? "Aguarde..." : rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
