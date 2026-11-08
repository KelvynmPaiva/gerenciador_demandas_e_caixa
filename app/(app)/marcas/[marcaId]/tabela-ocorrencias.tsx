"use client";

import { useOptimistic, useState, useTransition } from "react";
import { EllipsisVertical, Pencil, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { CampoTexto, CampoValor } from "@/components/campos-inline";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { Badge } from "@/components/ui/badge";
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
import { formatarData, formatarMoeda, plural, somarValores } from "@/lib/formato";
import { cn } from "@/lib/utils";
import {
  atualizarOcorrencia,
  desativarNota,
  type CamposOcorrencia,
} from "./actions";
import { DialogoNota, type NotaRecorrente } from "./dialogo-nota";

// Uma despesa recorrente de um mês específico (ocorrência), com a nota-mãe junto.
export type LinhaOcorrencia = {
  id: string;
  nome: string;
  vencimento: string; // "AAAA-MM-DD"
  valorPrevisto: number | null;
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
  marcaId,
  hoje,
}: {
  ocorrencias: LinhaOcorrencia[];
  marcaId: string;
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
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">Feita</span>
            </TableHead>
            <TableHead>Nome da despesa</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor previsto</TableHead>
            <TableHead className="text-right">Valor real</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
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
                Nenhuma despesa recorrente neste mês. Use &ldquo;Nova nota
                recorrente&rdquo; para cadastrar.
              </TableCell>
            </TableRow>
          )}
          {linhas.map((linha) => (
            <LinhaDaTabela
              key={linha.id}
              linha={linha}
              marcaId={marcaId}
              hoje={hoje}
              aoSalvar={salvar}
            />
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t bg-[#f9fafb] px-4 py-3 text-sm text-muted-foreground">
        <span>
          {plural(linhas.length, "despesa recorrente", "despesas recorrentes")}{" "}
          neste mês
        </span>
        <div className="flex gap-6">
          <span>
            Total previsto:{" "}
            <strong className="font-semibold tabular-nums text-foreground">
              {formatarMoeda(somarValores(linhas.map((l) => l.valorPrevisto)))}
            </strong>
          </span>
          <span>
            Total real lançado:{" "}
            <strong className="font-semibold tabular-nums text-primary">
              {formatarMoeda(somarValores(linhas.map((l) => l.valorReal)))}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function LinhaDaTabela({
  linha,
  marcaId,
  hoje,
  aoSalvar,
}: {
  linha: LinhaOcorrencia;
  marcaId: string;
  hoje: string;
  aoSalvar: (id: string, campos: CamposOcorrencia) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const status = statusDaOcorrencia(linha);
  const atrasada = status !== "concluida" && linha.vencimento < hoje;

  function confirmarDesativar() {
    iniciar(async () => {
      const resultado = await desativarNota(linha.nota.id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(
        "Nota desativada. Ela não gera mais meses novos; os meses já gerados continuam na lista.",
      );
      setDesativando(false);
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={linha.checkMarcado}
          onCheckedChange={(marcado) =>
            aoSalvar(linha.id, { checkMarcado: marcado === true })
          }
          aria-label={`Marcar "${linha.nome}" como feita`}
        />
      </TableCell>

      {/* Nome longo quebra em duas linhas (como no protótipo) em vez de ser cortado */}
      <TableCell className="max-w-[260px] min-w-[180px] whitespace-normal">
        <div className="flex flex-col items-start gap-1 py-1">
          <span className="leading-5 font-medium">{linha.nome}</span>
          {!linha.nota.ativa && <Badge variant="neutro">Nota desativada</Badge>}
        </div>
      </TableCell>

      <TableCell>
        <span
          className={cn(
            "tabular-nums",
            atrasada && "font-medium text-perigo",
          )}
        >
          {formatarData(linha.vencimento)}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex justify-end">
          <CampoValor
            rotulo={`Valor previsto de ${linha.nome}`}
            valor={linha.valorPrevisto}
            onSalvar={(valorPrevisto) => aoSalvar(linha.id, { valorPrevisto })}
          />
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex justify-end">
          <CampoValor
            rotulo={`Valor real de ${linha.nome}`}
            valor={linha.valorReal}
            destaque={status === "falta_valor_real"}
            onSalvar={(valorReal) => aoSalvar(linha.id, { valorReal })}
          />
        </div>
      </TableCell>

      <TableCell className="min-w-[160px]">
        <CampoTexto
          rotulo={`Observação de ${linha.nome}`}
          placeholder="Adicionar observação"
          valor={linha.observacao}
          onSalvar={(observacao) => aoSalvar(linha.id, { observacao })}
        />
      </TableCell>

      <TableCell>
        {status === "concluida" && <Badge variant="sucesso">Concluída</Badge>}
        {status === "falta_valor_real" && (
          <Badge variant="atencao">Falta valor real</Badge>
        )}
        {status === "pendente" && <Badge variant="neutro">Pendente</Badge>}
      </TableCell>

      <TableCell>
        {/* modal={false}: evita que o menu trave a tela ao abrir uma janela a partir dele */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Ações da nota ${linha.nota.nome}`}
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setEditando(true)}>
              <Pencil /> Editar nota recorrente
            </DropdownMenuItem>
            {linha.nota.ativa && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDesativando(true)}
              >
                <PowerOff /> Desativar nota
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogoNota
          aberto={editando}
          aoMudar={setEditando}
          marcaId={marcaId}
          nota={linha.nota}
        />
        <DialogoConfirmar
          aberto={desativando}
          aoMudar={setDesativando}
          titulo={`Desativar "${linha.nota.nome}"?`}
          descricao="A nota para de gerar despesas nos meses seguintes. Os meses que já foram gerados e o histórico continuam salvos."
          rotuloConfirmar="Desativar"
          perigo
          carregando={ocupado}
          aoConfirmar={confirmarDesativar}
        />
      </TableCell>
    </TableRow>
  );
}
