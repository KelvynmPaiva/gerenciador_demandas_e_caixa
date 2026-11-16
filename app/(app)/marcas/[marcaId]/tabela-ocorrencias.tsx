"use client";

import { useOptimistic, useState, useTransition } from "react";
import { EllipsisVertical, Pencil, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CampoTexto, CampoValor } from "@/components/campos-inline";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { SeletorData } from "@/components/seletor-data";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, plural, somarValores } from "@/lib/formato";
import {
  atualizarOcorrencia,
  excluirNota,
  excluirOcorrencia,
  type CamposOcorrencia,
} from "./actions";
import { DialogoNota, type NotaRecorrente } from "./dialogo-nota";

// Uma despesa recorrente de um mês específico (ocorrência), com a nota-mãe junto.
// O nome vem da nota (nota.nome): renomear vale para todos os meses.
export type LinhaOcorrencia = {
  id: string;
  vencimento: string; // "AAAA-MM-DD"
  valorReal: number | null;
  checkMarcado: boolean;
  observacao: string | null;
  nota: NotaRecorrente;
};

type StatusOcorrencia = "concluida" | "falta_valor_real" | "pendente";

// Regra de negócio: só está concluída com check marcado E valor real preenchido.
// Check marcado sem valor real = "Falta valor real". Só o valor real não conclui.
function statusDaOcorrencia(linha: LinhaOcorrencia): StatusOcorrencia {
  if (linha.checkMarcado && linha.valorReal !== null) return "concluida";
  if (linha.checkMarcado) return "falta_valor_real";
  return "pendente";
}

export function TabelaOcorrencias({
  ocorrencias,
  hoje,
}: {
  ocorrencias: LinhaOcorrencia[];
  hoje: string; // "AAAA-MM-DD" em São Paulo, para marcar vencimentos atrasados
}) {
  // Atualização otimista: a tela muda na hora e, se o servidor falhar,
  // volta sozinha para o valor anterior.
  const [linhas, aplicarMudanca] = useOptimistic(
    ocorrencias,
    (atuais, mudanca: { id: string; campos: CamposOcorrencia }) =>
      atuais.map((linha) =>
        linha.id === mudanca.id ? { ...linha, ...mudanca.campos } : linha,
      ),
  );
  const [, iniciar] = useTransition();

  function salvar(id: string, campos: CamposOcorrencia) {
    iniciar(async () => {
      aplicarMudanca({ id, campos });
      const resultado = await atualizarOcorrencia(id, campos);
      if (resultado.erro) toast.error(resultado.erro);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <Table className="max-md:block">
        <TableHeader className="max-md:hidden">
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Feita</span>
            </TableHead>
            <TableHead>Nome da despesa</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor real</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="max-md:block">
          {linhas.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="h-auto p-0 whitespace-normal">
                <EmptyState
                  icon={Repeat}
                  title="Nenhuma despesa neste mês"
                  text="Use “Adicionar despesa” para cadastrar."
                />
              </TableCell>
            </TableRow>
          )}
          {linhas.map((linha) => (
            <LinhaDaTabela
              key={linha.id}
              linha={linha}
              hoje={hoje}
              aoSalvar={salvar}
            />
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t bg-muted px-4 py-3 text-[13px] text-muted-foreground">
        <span>
          {plural(linhas.length, "despesa recorrente", "despesas recorrentes")}{" "}
          neste mês
        </span>
        <span>
          Total real lançado:{" "}
          <strong className="num text-[15px] font-semibold text-foreground">
            {formatarMoeda(somarValores(linhas.map((l) => l.valorReal)))}
          </strong>
        </span>
      </div>
    </div>
  );
}

function LinhaDaTabela({
  linha,
  hoje,
  aoSalvar,
}: {
  linha: LinhaOcorrencia;
  hoje: string;
  aoSalvar: (id: string, campos: CamposOcorrencia) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [excluindoMes, setExcluindoMes] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const nome = linha.nota.nome;
  const status = statusDaOcorrencia(linha);
  const atrasada = status !== "concluida" && linha.vencimento < hoje;

  function confirmarExclusao() {
    iniciar(async () => {
      const resultado = await excluirNota(linha.nota.id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Despesa excluída de todos os meses.");
      setExcluindo(false);
    });
  }

  // Só a despesa deste mês: a nota-mãe e os outros meses continuam.
  function confirmarExclusaoDoMes() {
    iniciar(async () => {
      const resultado = await excluirOcorrencia(linha.id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Despesa excluída deste mês.");
      setExcluindoMes(false);
    });
  }

  return (
    <TableRow className="relative max-md:grid max-md:grid-cols-2 max-md:items-center max-md:gap-x-3 max-md:gap-y-1.5 max-md:px-4 max-md:py-3">
      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:absolute max-md:top-3.5 max-md:left-4">
        <Checkbox
          checked={linha.checkMarcado}
          onCheckedChange={(marcado) =>
            aoSalvar(linha.id, { checkMarcado: marcado === true })
          }
          aria-label={`Marcar "${nome}" como feita`}
        />
      </TableCell>

      {/* Nome longo quebra em duas linhas (como no protótipo) em vez de ser cortado */}
      <TableCell className="max-w-[260px] min-w-[180px] whitespace-normal max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-2 max-md:pr-10 max-md:pl-8">
        <span className="block py-1 leading-5 font-medium">{nome}</span>
      </TableCell>

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        <SeletorData
          estilo="linha"
          rotulo={`Data de ${nome}`}
          valor={linha.vencimento}
          destaque={atrasada}
          concluido={status === "concluida"}
          permitirLimpar={false}
          onChange={(vencimento) =>
            vencimento && aoSalvar(linha.id, { vencimento })
          }
        />
      </TableCell>

      <TableCell className="text-right max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        <div className="flex justify-end">
          <CampoValor
            rotulo={`Valor real de ${nome}`}
            valor={linha.valorReal}
            destaque={status === "falta_valor_real"}
            onSalvar={(valorReal) => aoSalvar(linha.id, { valorReal })}
          />
        </div>
      </TableCell>

      <TableCell className="min-w-[160px] max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-2">
        <CampoTexto
          rotulo={`Observação de ${nome}`}
          placeholder="Adicionar observação"
          valor={linha.observacao}
          onSalvar={(observacao) => aoSalvar(linha.id, { observacao })}
        />
      </TableCell>

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        {status === "concluida" && <StatusBadge tone="success">Concluída</StatusBadge>}
        {status === "falta_valor_real" && (
          <StatusBadge tone="warning">Falta valor real</StatusBadge>
        )}
        {status === "pendente" && <StatusBadge tone="neutral">Pendente</StatusBadge>}
      </TableCell>

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:absolute max-md:top-2 max-md:right-2">
        {/* modal={false}: evita que o menu trave a tela ao abrir uma janela a partir dele */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Ações da despesa ${nome}`}
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setEditando(true)}>
              <Pencil /> Renomear despesa
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setExcluindoMes(true)}
            >
              <Trash2 /> Excluir só este mês
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setExcluindo(true)}
            >
              <Trash2 /> Excluir de todos os meses
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogoNota aberto={editando} aoMudar={setEditando} nota={linha.nota} />
        <DialogoConfirmar
          aberto={excluindoMes}
          aoMudar={setExcluindoMes}
          titulo={`Excluir "${nome}" só deste mês?`}
          descricao="Só este mês é apagado, com o valor, o check e a observação lançados nele. Os outros meses continuam, e a despesa segue disponível nas sugestões de “Adicionar despesa”. Essa ação não pode ser desfeita."
          rotuloConfirmar="Excluir deste mês"
          perigo
          carregando={ocupado}
          aoConfirmar={confirmarExclusaoDoMes}
        />
        <DialogoConfirmar
          aberto={excluindo}
          aoMudar={setExcluindo}
          titulo={`Excluir "${nome}" de todos os meses?`}
          descricao="A despesa é apagada de todos os meses, com os valores, checks e observações já lançados, e sai das sugestões. Essa ação não pode ser desfeita."
          rotuloConfirmar="Excluir de todos"
          perigo
          carregando={ocupado}
          aoConfirmar={confirmarExclusao}
        />
      </TableCell>
    </TableRow>
  );
}
