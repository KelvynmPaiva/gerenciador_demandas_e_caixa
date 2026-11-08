"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { formatarNumero, lerValor } from "@/lib/formato";
import { criarNota, editarNota } from "./actions";

// Nota recorrente = o cadastro-mãe da despesa (ex.: "Gráfica", dia 10, R$ 500).
// Todo mês ela gera uma despesa (ocorrência) copiando esses dados.
export type NotaRecorrente = {
  id: string;
  nome: string;
  valorPrevisto: number | null;
  diaVencimento: number;
  observacao: string | null;
  ativa: boolean;
};

// Janela para criar (sem "nota") ou editar (com "nota") uma nota recorrente.
export function DialogoNota({
  aberto,
  aoMudar,
  marcaId,
  nota,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  marcaId: string;
  nota?: NotaRecorrente;
}) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="sm:max-w-lg">
        {/* O formulário só existe com a janela aberta: ao reabrir, os campos começam do zero */}
        <FormularioNota
          marcaId={marcaId}
          nota={nota}
          aoFechar={() => aoMudar(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Botão "Nova nota recorrente" do topo da tela da marca
export function BotaoNovaNota({ marcaId }: { marcaId: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Nova nota recorrente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <FormularioNota marcaId={marcaId} aoFechar={() => setAberto(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FormularioNota({
  marcaId,
  nota,
  aoFechar,
}: {
  marcaId: string;
  nota?: NotaRecorrente;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(nota?.nome ?? "");
  const [valor, setValor] = useState(formatarNumero(nota?.valorPrevisto));
  const [dia, setDia] = useState(nota ? String(nota.diaVencimento) : "");
  const [observacao, setObservacao] = useState(nota?.observacao ?? "");
  const [salvando, iniciar] = useTransition();

  function enviar(evento: FormEvent) {
    evento.preventDefault();

    const valorLido = lerValor(valor);
    if (!valorLido.valido) {
      toast.error("Valor previsto inválido. Digite algo como 1.234,56");
      return;
    }

    const dados = {
      nome,
      valorPrevisto: valorLido.valor,
      diaVencimento: Number(dia),
      observacao,
    };

    iniciar(async () => {
      const resultado = nota
        ? await editarNota(nota.id, dados)
        : await criarNota(marcaId, dados);

      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(
        nota
          ? "Nota atualizada. A mudança vale para os próximos meses."
          : "Nota criada. A despesa deste mês já foi gerada.",
      );
      aoFechar();
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {nota ? "Editar nota recorrente" : "Nova nota recorrente"}
        </DialogTitle>
        <DialogDescription>
          {nota
            ? "A mudança vale para os meses que ainda vão ser gerados. As despesas que já existem não são alteradas."
            : "Todo mês, uma despesa com esses dados é criada automaticamente."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="nota-nome">Nome da despesa</Label>
        <Input
          id="nota-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Assessoria de imprensa"
          maxLength={120}
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nota-valor">Valor previsto</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="nota-valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="pl-9 text-right tabular-nums"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nota-dia">Dia do vencimento</Label>
          <Input
            id="nota-dia"
            type="number"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            placeholder="1 a 31"
            required
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Se o mês não tiver o dia escolhido (ex.: 31 em fevereiro), vale o último
        dia do mês.
      </p>

      <div className="space-y-2">
        <Label htmlFor="nota-observacao">Observação (opcional)</Label>
        <Textarea
          id="nota-observacao"
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
          {salvando ? "Salvando..." : nota ? "Salvar" : "Criar nota"}
        </Button>
      </DialogFooter>
    </form>
  );
}
