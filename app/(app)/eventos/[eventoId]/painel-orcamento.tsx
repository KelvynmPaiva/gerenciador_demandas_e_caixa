"use client";

import { useOptimistic, useState, useTransition } from "react";
import { FileClock, Receipt, Scale, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { BotaoLink } from "@/components/botao-link";
import { CampoTexto, CampoValor } from "@/components/campos-inline";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { SeletorData } from "@/components/seletor-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, plural, somarValores } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AdicionarItem } from "./adicionar-item";
import { atualizarItem, excluirItem, type CamposItem } from "./actions";

// Uma linha do orçamento do evento (um serviço contratado / NF a lançar)
export type ItemOrcamento = {
  id: string;
  servico: string;
  fornecedor: string | null;
  valorOrcado: number | null;
  valorReal: number | null;
  statusNf: "pendente" | "lancada";
  prazoNf: string | null; // "AAAA-MM-DD"
  linkExterno: string | null;
  observacao: string | null;
};

export function PainelOrcamento({
  itens,
  eventoId,
  hoje,
}: {
  itens: ItemOrcamento[];
  eventoId: string;
  hoje: string; // "AAAA-MM-DD" em São Paulo, para marcar prazos vencidos
}) {
  // Atualização otimista: a tela muda na hora e, se o servidor falhar,
  // volta sozinha para o valor anterior.
  const [linhas, aplicarMudanca] = useOptimistic(
    itens,
    (atuais, mudanca: { id: string; campos: CamposItem }) =>
      atuais.map((item) =>
        item.id === mudanca.id ? { ...item, ...mudanca.campos } : item,
      ),
  );
  const [, iniciar] = useTransition();

  function salvar(id: string, campos: CamposItem) {
    iniciar(async () => {
      aplicarMudanca({ id, campos });
      const resultado = await atualizarItem(id, campos);
      if (resultado.erro) toast.error(resultado.erro);
    });
  }

  // Totais do evento. Diferença = real − orçado (negativo = gastou menos que o orçado).
  const totalOrcado = somarValores(linhas.map((l) => l.valorOrcado));
  const totalReal = somarValores(linhas.map((l) => l.valorReal));
  const diferenca = Math.round((totalReal - totalOrcado) * 100) / 100;
  const nfsEmAberto = linhas.filter((l) => l.statusNf === "pendente").length;

  const textoDiferenca = `${diferenca > 0 ? "+" : ""}${formatarMoeda(diferenca)}`;
  const tomDiferenca = diferenca > 0 ? "perigo" : diferenca < 0 ? "sucesso" : "neutro";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-5">
        <CartaoNumero
          titulo="Total orçado"
          valor={formatarMoeda(totalOrcado)}
          icone={<Wallet className="size-5" />}
        />
        <CartaoNumero
          titulo="Total real"
          valor={formatarMoeda(totalReal)}
          icone={<Receipt className="size-5" />}
        />
        <CartaoNumero
          titulo="Diferença (real − orçado)"
          valor={textoDiferenca}
          detalhe={
            diferenca > 0
              ? "Acima do orçado"
              : diferenca < 0
                ? "Abaixo do orçado"
                : "Igual ao orçado"
          }
          tom={tomDiferenca}
          icone={<Scale className="size-5" />}
        />
        <CartaoNumero
          titulo="NFs em aberto"
          valor={nfsEmAberto === 0 ? "Nenhuma" : plural(nfsEmAberto, "pendência", "pendências")}
          tom={nfsEmAberto > 0 ? "perigo" : "sucesso"}
          icone={<FileClock className="size-5" />}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">
            Detalhamento dos serviços contratados
          </h2>
          <span className="text-sm text-muted-foreground">
            {plural(linhas.length, "item", "itens")}
          </span>
        </div>

        <Table className="[&_td]:px-2 [&_th]:px-2">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Serviço</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Valor orçado</TableHead>
              <TableHead className="text-right">Valor real</TableHead>
              <TableHead>Status da NF</TableHead>
              <TableHead>Prazo p/ lançar</TableHead>
              <TableHead>Observação / link</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={8}
                  className="h-28 text-center text-muted-foreground"
                >
                  Nenhum item no orçamento. Use &ldquo;Adicionar item&rdquo; abaixo.
                </TableCell>
              </TableRow>
            )}
            {linhas.map((item) => (
              <LinhaDoItem
                key={item.id}
                item={item}
                hoje={hoje}
                aoSalvar={salvar}
              />
            ))}
          </TableBody>
        </Table>

        <div className="border-t px-5 py-4">
          <AdicionarItem eventoId={eventoId} />
        </div>

        <div className="flex items-center justify-end gap-8 border-t bg-[#f9fafb] px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Total orçado{" "}
            <strong className="ml-1 text-base font-semibold tabular-nums text-foreground">
              {formatarMoeda(totalOrcado)}
            </strong>
          </span>
          <span className="text-muted-foreground">
            Total real{" "}
            <strong className="ml-1 text-base font-semibold tabular-nums text-foreground">
              {formatarMoeda(totalReal)}
            </strong>
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            Diferença
            <Badge variant={tomDiferenca} className="px-2.5 text-sm tabular-nums">
              {textoDiferenca}
            </Badge>
          </span>
        </div>
      </div>
    </div>
  );
}

function CartaoNumero({
  titulo,
  valor,
  detalhe,
  icone,
  tom = "neutro",
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone: React.ReactNode;
  tom?: "neutro" | "sucesso" | "perigo";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-4 shadow-xs">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{titulo}</p>
        <p
          title={valor}
          className={cn(
            "mt-1 truncate text-xl font-semibold tabular-nums",
            tom === "perigo" && "text-perigo",
            tom === "sucesso" && "text-sucesso",
          )}
        >
          {valor}
        </p>
        {detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{detalhe}</p>}
      </div>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tom === "neutro" && "bg-muted text-muted-foreground",
          tom === "sucesso" && "bg-sucesso-fundo text-sucesso",
          tom === "perigo" && "bg-perigo-fundo text-perigo",
        )}
      >
        {icone}
      </span>
    </div>
  );
}

function LinhaDoItem({
  item,
  hoje,
  aoSalvar,
}: {
  item: ItemOrcamento;
  hoje: string;
  aoSalvar: (id: string, campos: CamposItem) => void;
}) {
  const [excluindo, setExcluindo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const lancada = item.statusNf === "lancada";
  // Prazo vencido só importa enquanto a NF ainda não foi lançada
  const prazoVencido = !lancada && item.prazoNf !== null && item.prazoNf < hoje;

  function confirmarExclusao() {
    iniciar(async () => {
      const resultado = await excluirItem(item.id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Item excluído.");
      setExcluindo(false);
    });
  }

  return (
    <TableRow>
      <TableCell className="min-w-[170px] pl-4">
        <CampoTexto
          rotulo={`Serviço ${item.servico}`}
          valor={item.servico}
          obrigatorio
          className="font-medium"
          onSalvar={(servico) => servico && aoSalvar(item.id, { servico })}
        />
      </TableCell>

      <TableCell className="min-w-[130px]">
        <CampoTexto
          rotulo={`Fornecedor de ${item.servico}`}
          placeholder="Fornecedor"
          valor={item.fornecedor}
          onSalvar={(fornecedor) => aoSalvar(item.id, { fornecedor })}
        />
      </TableCell>

      <TableCell>
        <div className="flex justify-end">
          <CampoValor
            rotulo={`Valor orçado de ${item.servico}`}
            valor={item.valorOrcado}
            onSalvar={(valorOrcado) => aoSalvar(item.id, { valorOrcado })}
          />
        </div>
      </TableCell>

      <TableCell>
        <div className="flex justify-end">
          <CampoValor
            rotulo={`Valor real de ${item.servico}`}
            valor={item.valorReal}
            onSalvar={(valorReal) => aoSalvar(item.id, { valorReal })}
          />
        </div>
      </TableCell>

      <TableCell>
        {/* Um clique alterna entre "Lançamento pendente" (vermelho) e "Lançada" (verde) */}
        <button
          type="button"
          onClick={() =>
            aoSalvar(item.id, { statusNf: lancada ? "pendente" : "lancada" })
          }
          aria-label={`NF de ${item.servico}: ${lancada ? "lançada" : "lançamento pendente"}. Clique para alternar`}
          title="Clique para alternar"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Badge
            variant={lancada ? "sucesso" : "perigo"}
            className="cursor-pointer gap-1.5"
          >
            <span className="size-1.5 rounded-full bg-current" />
            {lancada ? "Lançada" : "Lançamento pendente"}
          </Badge>
        </button>
      </TableCell>

      <TableCell>
        <SeletorData
          estilo="linha"
          rotulo={`Prazo para lançar a NF de ${item.servico}`}
          placeholder="Sem prazo"
          valor={item.prazoNf}
          destaque={prazoVencido}
          onChange={(prazoNf) => aoSalvar(item.id, { prazoNf })}
        />
      </TableCell>

      <TableCell className="min-w-[160px]">
        <div className="flex items-center gap-1">
          <CampoTexto
            rotulo={`Observação de ${item.servico}`}
            placeholder="Observação"
            valor={item.observacao}
            onSalvar={(observacao) => aoSalvar(item.id, { observacao })}
          />
          <BotaoLink
            rotulo={`Link de ${item.servico}`}
            valor={item.linkExterno}
            onSalvar={(linkExterno) => aoSalvar(item.id, { linkExterno })}
          />
        </div>
      </TableCell>

      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir ${item.servico}`}
          title="Excluir item"
          className="hover:bg-perigo-fundo hover:text-perigo"
          onClick={() => setExcluindo(true)}
        >
          <Trash2 />
        </Button>
        <DialogoConfirmar
          aberto={excluindo}
          aoMudar={setExcluindo}
          titulo={`Excluir "${item.servico}"?`}
          descricao="O item sai do orçamento e dos totais do evento. Essa ação não pode ser desfeita."
          rotuloConfirmar="Excluir"
          perigo
          carregando={ocupado}
          aoConfirmar={confirmarExclusao}
        />
      </TableCell>
    </TableRow>
  );
}
