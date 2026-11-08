"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ArrowDown, ArrowUp, EllipsisVertical, Pencil, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { desativarMarca, moverMarca, renomearMarca } from "./actions";

// Menu "⋮" do cartão da marca: renomear, mudar de posição e desativar.
export function MenuMarca({
  id,
  nome,
  podeSubir,
  podeDescer,
}: {
  id: string;
  nome: string;
  podeSubir: boolean;
  podeDescer: boolean;
}) {
  const [renomeando, setRenomeando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [ocupado, iniciar] = useTransition();

  function mover(direcao: "cima" | "baixo") {
    iniciar(async () => {
      const resultado = await moverMarca(id, direcao);
      if (resultado.erro) toast.error(resultado.erro);
    });
  }

  function confirmarDesativar() {
    iniciar(async () => {
      const resultado = await desativarMarca(id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`${nome} foi desativada.`);
      setDesativando(false);
    });
  }

  return (
    <>
      {/* modal={false}: evita que o menu trave a tela ao abrir uma janela a partir dele */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ações da marca ${nome}`}
            disabled={ocupado}
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setRenomeando(true)}>
            <Pencil /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!podeSubir} onSelect={() => mover("cima")}>
            <ArrowUp /> Mover para cima
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!podeDescer} onSelect={() => mover("baixo")}>
            <ArrowDown /> Mover para baixo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDesativando(true)}>
            <PowerOff /> Desativar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renomeando} onOpenChange={setRenomeando}>
        <DialogContent className="sm:max-w-md">
          <FormularioRenomear
            id={id}
            nomeAtual={nome}
            aoFechar={() => setRenomeando(false)}
          />
        </DialogContent>
      </Dialog>

      <DialogoConfirmar
        aberto={desativando}
        aoMudar={setDesativando}
        titulo={`Desativar ${nome}?`}
        descricao="A marca some da lista e do menu, mas eventos, tarefas e histórico continuam salvos."
        rotuloConfirmar="Desativar"
        perigo
        carregando={ocupado}
        aoConfirmar={confirmarDesativar}
      />
    </>
  );
}

function FormularioRenomear({
  id,
  nomeAtual,
  aoFechar,
}: {
  id: string;
  nomeAtual: string;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(nomeAtual);
  const [salvando, iniciar] = useTransition();

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const resultado = await renomearMarca(id, nome);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Marca renomeada.");
      aoFechar();
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Renomear marca</DialogTitle>
        <DialogDescription>
          O nome novo vale em todas as telas. O histórico não muda.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="renomear-marca">Nome</Label>
        <Input
          id="renomear-marca"
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
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
