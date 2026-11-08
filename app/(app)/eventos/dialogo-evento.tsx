"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { SeletorData } from "@/components/seletor-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { criarEvento, editarEvento } from "./actions";

// Dados de um evento já existente, para preencher a janela de edição
export type EventoParaEdicao = {
  id: string;
  nome: string;
  tipo: string;
  dataInicio: string | null;
  dataFim: string | null;
  linkExterno: string | null;
  observacao: string | null;
};

// Janela para criar (informando "marcaId") ou editar (informando "evento") um evento/ação.
export function DialogoEvento({
  aberto,
  aoMudar,
  marcaId,
  evento,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  marcaId?: string;
  evento?: EventoParaEdicao;
}) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="sm:max-w-lg">
        {/* O formulário só existe com a janela aberta: ao reabrir, os campos recomeçam */}
        <FormularioEvento
          marcaId={marcaId}
          evento={evento}
          aoFechar={() => aoMudar(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Botão "Novo evento" da tela da marca
export function BotaoNovoEvento({ marcaId }: { marcaId: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <FormularioEvento marcaId={marcaId} aoFechar={() => setAberto(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FormularioEvento({
  marcaId,
  evento,
  aoFechar,
}: {
  marcaId?: string;
  evento?: EventoParaEdicao;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(evento?.nome ?? "");
  const [tipo, setTipo] = useState(evento?.tipo ?? "evento");
  const [dataInicio, setDataInicio] = useState<string | null>(evento?.dataInicio ?? null);
  const [dataFim, setDataFim] = useState<string | null>(evento?.dataFim ?? null);
  const [link, setLink] = useState(evento?.linkExterno ?? "");
  const [observacao, setObservacao] = useState(evento?.observacao ?? "");
  const [salvando, iniciar] = useTransition();

  function enviar(e: FormEvent) {
    e.preventDefault();

    const dados = {
      nome,
      tipo,
      dataInicio,
      dataFim,
      linkExterno: link,
      observacao,
    };

    iniciar(async () => {
      let resultado;
      if (evento) {
        resultado = await editarEvento(evento.id, dados);
      } else if (marcaId) {
        resultado = await criarEvento(marcaId, dados);
      } else {
        return;
      }

      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(evento ? "Evento atualizado." : "Evento criado.");
      aoFechar();
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{evento ? "Editar evento" : "Novo evento"}</DialogTitle>
        <DialogDescription>
          Cada evento ou ação tem o seu orçamento e as suas demandas.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-[1fr_9.5rem] gap-4">
        <div className="space-y-2">
          <Label htmlFor="evento-nome">Nome</Label>
          <Input
            id="evento-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Lançamento X5"
            maxLength={120}
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="evento-tipo">Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger
              id="evento-tipo"
              className="w-full bg-card data-[size=default]:h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="acao">Ação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de início (opcional)</Label>
          <SeletorData
            rotulo="Data de início"
            valor={dataInicio}
            onChange={setDataInicio}
          />
        </div>
        <div className="space-y-2">
          <Label>Data final (opcional)</Label>
          <SeletorData rotulo="Data final" valor={dataFim} onChange={setDataFim} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evento-link">Link externo (opcional)</Label>
        <Input
          id="evento-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Pasta do Drive, Figma..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evento-observacao">Observação (opcional)</Label>
        <Textarea
          id="evento-observacao"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          className="bg-card text-sm"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : evento ? "Salvar" : "Criar evento"}
        </Button>
      </DialogFooter>
    </form>
  );
}
