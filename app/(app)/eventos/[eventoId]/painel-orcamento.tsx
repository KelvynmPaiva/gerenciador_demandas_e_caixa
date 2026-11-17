"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { EllipsisVertical, Link2, MessageSquareText, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BotaoLink } from "@/components/botao-link";
import { CampoTexto, CampoValor } from "@/components/campos-inline";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { SeletorData } from "@/components/seletor-data";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
import { formatarMoeda, plural, somarValores } from "@/lib/formato";
import { pendentesPrimeiro, temConteudo } from "@/lib/listas";
import {
  descreverAlternancia,
  ROTULO_DO_STATUS,
  statusOposto,
  TOM_DO_STATUS,
} from "@/lib/status";
import { AdicionarItem } from "./adicionar-item";
import { atualizarItem, excluirItem, type CamposItem } from "./actions";

// Uma linha do orçamento do evento (um serviço contratado / NF a lançar)
export type ItemOrcamento = {
  id: string;
  servico: string;
  fornecedor: string | null;
  valorReal: number | null;
  statusNf: "pendente" | "lancada";
  prazoNf: string | null; // "AAAA-MM-DD"
  linkExterno: string | null;
  observacao: string | null;
};

// Colunas que só aparecem quando alguma linha tem conteúdo
type ColunaOpcional = "observacao" | "link";

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

  // Colunas que a pessoa abriu pelo menu ("Adicionar observação/link") mesmo sem
  // nenhuma linha preenchida ainda, para poder digitar a primeira.
  const [colunasAbertas, setColunasAbertas] = useState<Set<ColunaOpcional>>(new Set());
  const mostrar: Record<ColunaOpcional, boolean> = {
    observacao: colunasAbertas.has("observacao") || temConteudo(linhas, (l) => l.observacao),
    link: colunasAbertas.has("link") || temConteudo(linhas, (l) => l.linkExterno),
  };

  function abrirColuna(coluna: ColunaOpcional) {
    setColunasAbertas((atuais) => (atuais.has(coluna) ? atuais : new Set(atuais).add(coluna)));
  }

  // Ordenado depois do otimista: ao clicar no status, o item já desce (ou sobe) na hora
  const ordenadas = pendentesPrimeiro(linhas, (l) => l.statusNf === "lancada");
  const qtdColunas = 5 + Number(mostrar.observacao) + Number(mostrar.link) + 1;

  // Totais do evento: só o valor real (não existe mais valor orçado)
  const totalReal = somarValores(linhas.map((l) => l.valorReal));

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-h2">
            Detalhamento dos serviços contratados
          </h2>
          <span className="num text-[13px] text-muted-foreground">
            {plural(linhas.length, "item", "itens")}
          </span>
        </div>

        <Table className="[&_td]:px-2 [&_th]:px-2 max-md:block">
          <TableHeader className="max-md:hidden">
            <TableRow>
              <TableHead className="pl-4">Serviço</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Valor real</TableHead>
              <TableHead>Status da NF</TableHead>
              <TableHead>Prazo p/ lançar</TableHead>
              {mostrar.observacao && <TableHead>Observação</TableHead>}
              {mostrar.link && <TableHead className="w-12">Link</TableHead>}
              <TableHead className="w-10">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="max-md:block">
            {linhas.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={qtdColunas} className="h-auto whitespace-normal p-0">
                  <EmptyState
                    icon={Receipt}
                    title="Nenhum item no orçamento"
                    text="Adicione os serviços contratados para acompanhar valores e NFs."
                  />
                </TableCell>
              </TableRow>
            )}
            {ordenadas.map((item) => (
              <LinhaDoItem
                key={item.id}
                item={item}
                hoje={hoje}
                mostrar={mostrar}
                aoAbrirColuna={abrirColuna}
                aoSalvar={salvar}
              />
            ))}
          </TableBody>
        </Table>

        <div className="border-t px-5 py-4">
          <AdicionarItem eventoId={eventoId} />
        </div>

        <div className="flex items-center justify-end gap-8 border-t bg-muted px-5 py-3.5 text-[13px]">
          <span className="text-muted-foreground">
            Total real{" "}
            <strong className="ml-1 text-base font-semibold tabular-nums text-foreground">
              {formatarMoeda(totalReal)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function LinhaDoItem({
  item,
  hoje,
  mostrar,
  aoAbrirColuna,
  aoSalvar,
}: {
  item: ItemOrcamento;
  hoje: string;
  mostrar: Record<ColunaOpcional, boolean>;
  aoAbrirColuna: (coluna: ColunaOpcional) => void;
  aoSalvar: (id: string, campos: CamposItem) => void;
}) {
  const [excluindo, setExcluindo] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const [linkAberto, setLinkAberto] = useState(false);
  const campoObservacao = useRef<HTMLInputElement>(null);
  // Campo pedido pelo menu: só dá para focar depois que o menu fecha
  const campoPedido = useRef<ColunaOpcional | null>(null);

  const lancada = item.statusNf === "lancada";
  // Prazo vencido só importa enquanto a NF ainda não foi lançada
  const prazoVencido = !lancada && item.prazoNf !== null && item.prazoNf < hoje;

  function pedirCampo(coluna: ColunaOpcional) {
    campoPedido.current = coluna;
    aoAbrirColuna(coluna); // a coluna aparece para receber o primeiro preenchimento
  }

  function aoFecharMenu(evento: Event) {
    const campo = campoPedido.current;
    if (!campo) return;
    evento.preventDefault(); // o foco vai para o campo, não de volta para o botão do menu
    campoPedido.current = null;
    requestAnimationFrame(() => {
      if (campo === "observacao") campoObservacao.current?.focus();
      else setLinkAberto(true);
    });
  }

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
    <TableRow className="relative max-md:grid max-md:grid-cols-2 max-md:items-center max-md:gap-x-3 max-md:gap-y-1.5 max-md:px-4 max-md:py-3">
      <TableCell className="min-w-[170px] pl-4 max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-2 max-md:pr-10">
        <CampoTexto
          rotulo={`Serviço ${item.servico}`}
          valor={item.servico}
          obrigatorio
          className="font-medium"
          onSalvar={(servico) => servico && aoSalvar(item.id, { servico })}
        />
      </TableCell>

      <TableCell className="min-w-[130px] max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        <CampoTexto
          rotulo={`Fornecedor de ${item.servico}`}
          placeholder="Fornecedor"
          valor={item.fornecedor}
          onSalvar={(fornecedor) => aoSalvar(item.id, { fornecedor })}
        />
      </TableCell>

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        <div className="flex justify-end">
          <CampoValor
            rotulo={`Valor real de ${item.servico}`}
            valor={item.valorReal}
            onSalvar={(valorReal) => aoSalvar(item.id, { valorReal })}
          />
        </div>
      </TableCell>

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        {/* Um clique alterna entre "Pendente" (vermelho) e "Lançado" (verde) */}
        <button
          type="button"
          onClick={() => aoSalvar(item.id, { statusNf: statusOposto(item.statusNf) })}
          aria-label={descreverAlternancia(`NF de ${item.servico}`, item.statusNf)}
          title={`Clique para mudar para ${ROTULO_DO_STATUS[statusOposto(item.statusNf)]}`}
          className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          <StatusBadge tone={TOM_DO_STATUS[item.statusNf]} className="cursor-pointer">
            {ROTULO_DO_STATUS[item.statusNf]}
          </StatusBadge>
        </button>
      </TableCell>

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
        <SeletorData
          estilo="linha"
          rotulo={`Prazo para lançar a NF de ${item.servico}`}
          placeholder="Sem prazo"
          valor={item.prazoNf}
          destaque={prazoVencido}
          concluido={lancada}
          onChange={(prazoNf) => aoSalvar(item.id, { prazoNf })}
        />
      </TableCell>

      {mostrar.observacao && (
        <TableCell className="min-w-[160px] max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-2">
          <CampoTexto
            ref={campoObservacao}
            rotulo={`Observação de ${item.servico}`}
            placeholder="Observação"
            valor={item.observacao}
            onSalvar={(observacao) => aoSalvar(item.id, { observacao })}
          />
        </TableCell>
      )}

      {mostrar.link && (
        <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:col-span-1">
          <BotaoLink
            rotulo={`Link de ${item.servico}`}
            valor={item.linkExterno}
            aberto={linkAberto}
            aoMudarAberto={setLinkAberto}
            onSalvar={(linkExterno) => aoSalvar(item.id, { linkExterno })}
          />
        </TableCell>
      )}

      <TableCell className="max-md:block max-md:h-auto max-md:min-w-0 max-md:p-0 max-md:absolute max-md:top-2 max-md:right-2">
        {/* modal={false}: evita que o menu trave a tela ao abrir uma janela a partir dele */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Ações do item ${item.servico}`}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52" onCloseAutoFocus={aoFecharMenu}>
            <DropdownMenuItem onSelect={() => pedirCampo("observacao")}>
              <MessageSquareText /> {item.observacao ? "Editar observação" : "Adicionar observação"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => pedirCampo("link")}>
              <Link2 /> {item.linkExterno ? "Editar link" : "Adicionar link"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setExcluindo(true)}>
              <Trash2 /> Excluir item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
