"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { EllipsisVertical, MessageSquareText, Pencil, Repeat, Trash2 } from "lucide-react";
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
  DropdownMenuSeparator,
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
import { ocorrenciaConcluida } from "@/lib/despesas";
import { formatarMoeda, plural, somarValores } from "@/lib/formato";
import { pendentesPrimeiro, temConteudo } from "@/lib/listas";
import { ROTULO_DO_STATUS, TOM_DO_STATUS, type StatusLancamento } from "@/lib/status";
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

// Só dois status (lib/status.ts): Lançado = check marcado E valor real (regra do banco,
// ocorrenciaConcluida). Check sem valor real continua Pendente; "Falta valor real"
// deixou de ser status e virou só um aviso no campo de valor.
function statusDaOcorrencia(linha: LinhaOcorrencia): StatusLancamento {
  return ocorrenciaConcluida(linha) ? "lancada" : "pendente";
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

  // Coluna Observação: só com conteúdo em alguma linha, ou depois de "Adicionar observação"
  // no menu (para poder digitar a primeira)
  const [observacaoAberta, setObservacaoAberta] = useState(false);
  const mostrarObservacao = observacaoAberta || temConteudo(linhas, (l) => l.observacao);
  const qtdColunas = 6 + Number(mostrarObservacao);

  // Ordenado depois do otimista: marcar o check (com valor real) já desce a linha na hora.
  // A ordem por data vem da página e é mantida dentro de cada grupo.
  const ordenadas = pendentesPrimeiro(linhas, ocorrenciaConcluida);

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
            {mostrarObservacao && <TableHead>Observação</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="max-md:block">
          {linhas.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={qtdColunas} className="h-auto p-0 whitespace-normal">
                <EmptyState
                  icon={Repeat}
                  title="Nenhuma despesa neste mês"
                  text="Use “Adicionar despesa” para cadastrar."
                />
              </TableCell>
            </TableRow>
          )}
          {ordenadas.map((linha) => (
            <LinhaDaTabela
              key={linha.id}
              linha={linha}
              hoje={hoje}
              mostrarObservacao={mostrarObservacao}
              aoAbrirObservacao={() => setObservacaoAberta(true)}
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
  mostrarObservacao,
  aoAbrirObservacao,
  aoSalvar,
}: {
  linha: LinhaOcorrencia;
  hoje: string;
  mostrarObservacao: boolean;
  aoAbrirObservacao: () => void;
  aoSalvar: (id: string, campos: CamposOcorrencia) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [excluindoMes, setExcluindoMes] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const campoObservacao = useRef<HTMLInputElement>(null);
  // "Adicionar observação" no menu: o campo só pode receber o foco depois que o menu fecha
  const focarObservacao = useRef(false);

  const nome = linha.nota.nome;
  const status = statusDaOcorrencia(linha);
  const lancado = status === "lancada";
  const faltaValorReal = linha.checkMarcado && linha.valorReal === null;
  const atrasada = !lancado && linha.vencimento < hoje;

  function aoFecharMenu(evento: Event) {
    if (!focarObservacao.current) return;
    evento.preventDefault(); // o foco vai para o campo, não de volta para o botão do menu
    focarObservacao.current = false;
    requestAnimationFrame(() => campoObservacao.current?.focus());
  }

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
          concluido={lancado}
          permitirLimpar={false}
          onChange={(vencimento) =>
            vencimento && aoSalvar(linha.id, { vencimento })
          }
        />
      </TableCell>

      <TableCell className="text-right max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        {/* Check marcado sem valor real: aviso no próprio campo (não é um status) */}
        <div className="flex flex-col items-end gap-0.5">
          <CampoValor
            rotulo={
              faltaValorReal
                ? `Valor real de ${nome} (falta preencher para ficar ${ROTULO_DO_STATUS.lancada})`
                : `Valor real de ${nome}`
            }
            valor={linha.valorReal}
            destaque={faltaValorReal}
            onSalvar={(valorReal) => aoSalvar(linha.id, { valorReal })}
          />
          {faltaValorReal && (
            <span className="pr-1 text-[11.5px] font-medium text-warning-text">
              Falta valor real
            </span>
          )}
        </div>
      </TableCell>

      {mostrarObservacao && (
        <TableCell className="min-w-[160px] max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-2">
          <CampoTexto
            ref={campoObservacao}
            rotulo={`Observação de ${nome}`}
            placeholder="Adicionar observação"
            valor={linha.observacao}
            onSalvar={(observacao) => aoSalvar(linha.id, { observacao })}
          />
        </TableCell>
      )}

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        <StatusBadge tone={TOM_DO_STATUS[status]}>{ROTULO_DO_STATUS[status]}</StatusBadge>
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
          <DropdownMenuContent align="end" className="w-52" onCloseAutoFocus={aoFecharMenu}>
            <DropdownMenuItem
              onSelect={() => {
                focarObservacao.current = true;
                aoAbrirObservacao(); // a coluna aparece para receber a primeira observação
              }}
            >
              <MessageSquareText />{" "}
              {linha.observacao ? "Editar observação" : "Adicionar observação"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
