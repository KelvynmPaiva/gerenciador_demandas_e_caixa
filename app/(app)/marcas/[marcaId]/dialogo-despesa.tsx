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
import { moverParaMes, somarMeses } from "@/lib/datas";
import { sugestoesDoMes, type NotaComMeses } from "@/lib/despesas";
import { lerValor, nomeDoMes } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { criarOcorrencia } from "./actions";

// Quantos meses antes e depois do mês visto aparecem na escolha do mês
const MESES_NA_LISTA = 12;
const NOVA = "nova";

// Botão "Adicionar despesa" do cabeçalho do mês, na tela da marca
export function BotaoAdicionarDespesa({
  marcaId,
  mes,
  hoje,
  notas,
}: {
  marcaId: string;
  mes: string; // "AAAA-MM" do mês que está na tela (vem pré-selecionado)
  hoje: string; // "AAAA-MM-DD" em São Paulo
  notas: NotaComMeses[]; // despesas já cadastradas na marca (para as sugestões)
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus /> Adicionar despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {/* O formulário só existe com a janela aberta: ao reabrir, os campos começam do zero */}
        <FormularioDespesa
          marcaId={marcaId}
          mesInicial={mes}
          hoje={hoje}
          notas={notas}
          aoFechar={() => setAberto(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormularioDespesa({
  marcaId,
  mesInicial,
  hoje,
  notas,
  aoFechar,
}: {
  marcaId: string;
  mesInicial: string;
  hoje: string;
  notas: NotaComMeses[];
  aoFechar: () => void;
}) {
  const [mes, setMes] = useState(mesInicial);
  // Começa em hoje se o mês visto é o atual; senão, no dia 1 do mês visto
  const [vencimento, setVencimento] = useState(
    hoje.startsWith(mesInicial) ? hoje : `${mesInicial}-01`,
  );
  const sugestoes = sugestoesDoMes(notas, mes);
  // id da nota escolhida, "nova" (digitar o nome) ou null (nada escolhido ainda)
  const [escolha, setEscolha] = useState<string | null>(
    sugestoes.length === 0 ? NOVA : null,
  );
  const [nomeNovo, setNomeNovo] = useState("");
  const [valor, setValor] = useState("");
  const [salvando, iniciar] = useTransition();

  const meses = Array.from({ length: MESES_NA_LISTA * 2 + 1 }, (_, i) =>
    somarMeses(mesInicial, i - MESES_NA_LISTA),
  );

  function trocarMes(novoMes: string) {
    setMes(novoMes);
    // A data acompanha o mês (mesmo dia; se não existir, o último dia do mês)
    setVencimento((atual) => moverParaMes(atual, novoMes));
    // A despesa escolhida pode já existir no mês novo: aí não serve mais
    const novasSugestoes = sugestoesDoMes(notas, novoMes);
    if (escolha !== NOVA && !novasSugestoes.some((n) => n.id === escolha)) {
      setEscolha(novasSugestoes.length === 0 ? NOVA : null);
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();

    if (escolha === null) {
      toast.error("Escolha uma despesa da lista ou “Nova despesa”.");
      return;
    }
    const valorLido = lerValor(valor);
    if (!valorLido.valido) {
      toast.error("Valor real inválido. Digite algo como 1.234,56");
      return;
    }

    iniciar(async () => {
      const resultado = await criarOcorrencia(marcaId, {
        notaId: escolha === NOVA ? null : escolha,
        nomeNovo,
        mes,
        vencimento,
        valorReal: valorLido.valor,
      });
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(`Despesa adicionada em ${nomeDoMes(mes)}.`);
      aoFechar();
    });
  }

  const estiloOpcao = (ativa: boolean) =>
    cn(
      "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
      ativa
        ? "border-primary bg-accent font-medium text-primary"
        : "border-input bg-card text-foreground hover:border-[#d1d5db] hover:bg-muted/40",
    );

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Adicionar despesa</DialogTitle>
        <DialogDescription>
          A despesa entra só no mês escolhido. Marque o check quando ela for paga.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="despesa-mes">Mês</Label>
          <Select value={mes} onValueChange={trocarMes}>
            <SelectTrigger
              id="despesa-mes"
              className="w-full bg-card data-[size=default]:h-9"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {meses.map((m) => (
                <SelectItem key={m} value={m}>
                  {nomeDoMes(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <SeletorData
            rotulo="Data da despesa"
            valor={vencimento}
            permitirLimpar={false}
            onChange={(data) => data && setVencimento(data)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label id="despesa-qual">Despesa</Label>
        <div
          role="radiogroup"
          aria-labelledby="despesa-qual"
          className="flex flex-wrap gap-2"
        >
          {sugestoes.map((nota) => (
            <button
              key={nota.id}
              type="button"
              role="radio"
              aria-checked={escolha === nota.id}
              className={estiloOpcao(escolha === nota.id)}
              onClick={() => setEscolha(nota.id)}
            >
              {nota.nome}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={escolha === NOVA}
            className={estiloOpcao(escolha === NOVA)}
            onClick={() => setEscolha(NOVA)}
          >
            <Plus className="size-3.5" /> Nova despesa
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {notas.length === 0
            ? "Nenhuma despesa cadastrada ainda nesta marca."
            : sugestoes.length === 0
              ? `Todas as despesas já cadastradas estão em ${nomeDoMes(mes)}.`
              : `Sugestões: despesas já cadastradas que ainda não estão em ${nomeDoMes(mes)}.`}
        </p>
      </div>

      {escolha === NOVA && (
        <div className="space-y-2">
          <Label htmlFor="despesa-nome">Nome da despesa</Label>
          <Input
            id="despesa-nome"
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Ex.: Assessoria de imprensa"
            maxLength={120}
            required
            autoFocus
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="despesa-valor">Valor real (opcional)</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            R$
          </span>
          <Input
            id="despesa-valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="pl-9 text-right tabular-nums"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Adicionar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
