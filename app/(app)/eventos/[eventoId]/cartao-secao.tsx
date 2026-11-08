"use client";

import { useState, useTransition } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CampoAdicionar } from "@/components/campo-adicionar";
import { CampoTexto } from "@/components/campos-inline";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { AcoesDemandas, Secao } from "./demandas-tipos";
import { LinhaTarefa } from "./linha-tarefa";

// Uma seção (ex.: "Pré-evento e Produção") com as tarefas dela.
// A seção inteira pode ser arrastada pela alça do cabeçalho.
export function CartaoSecao({
  secao,
  ocultarConcluidas,
  hoje,
  acoes,
  aoAbrirTarefa,
}: {
  secao: Secao;
  ocultarConcluidas: boolean;
  hoje: string;
  acoes: AcoesDemandas;
  aoAbrirTarefa: (tarefaId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: secao.id, data: { tipo: "secao" } });

  const [recolhida, setRecolhida] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const total = secao.tarefas.length;
  const concluidas = secao.tarefas.filter((t) => t.concluida).length;
  const visiveis = ocultarConcluidas
    ? secao.tarefas.filter((t) => !t.concluida)
    : secao.tarefas;

  function confirmarExclusao() {
    iniciar(async () => {
      const resultado = await acoes.excluirSecao(secao.id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Seção excluída.");
      setExcluindo(false);
    });
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-xs",
        isDragging && "opacity-40",
      )}
    >
      <header className="flex items-center gap-2 bg-[#f9fafb] px-3 py-2.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Arrastar a seção ${secao.nome}`}
          title="Arrastar para reordenar seções"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground/50 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={recolhida ? `Expandir ${secao.nome}` : `Recolher ${secao.nome}`}
          aria-expanded={!recolhida}
          onClick={() => setRecolhida((atual) => !atual)}
        >
          {recolhida ? <ChevronRight /> : <ChevronDown />}
        </Button>

        <div className="min-w-0 max-w-md flex-1">
          <CampoTexto
            rotulo={`Nome da seção ${secao.nome}`}
            valor={secao.nome}
            obrigatorio
            className="text-[15px] font-semibold"
            onSalvar={(nome) => nome && acoes.renomearSecao(secao.id, nome)}
          />
        </div>

        <Badge variant="neutro" className="tabular-nums">
          {plural(total, "tarefa", "tarefas")}
          {concluidas > 0 && ` · ${plural(concluidas, "concluída", "concluídas")}`}
        </Badge>

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Excluir a seção ${secao.nome}`}
            title="Excluir seção"
            className="hover:bg-perigo-fundo hover:text-perigo"
            onClick={() => setExcluindo(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </header>

      {!recolhida && (
        <>
          <div className="border-t">
            <SortableContext
              items={visiveis.map((tarefa) => tarefa.id)}
              strategy={verticalListSortingStrategy}
            >
              {visiveis.map((tarefa) => (
                <LinhaTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  hoje={hoje}
                  acoes={acoes}
                  aoAbrir={aoAbrirTarefa}
                />
              ))}
            </SortableContext>

            {total === 0 && (
              <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                Nenhuma tarefa nesta seção. Adicione abaixo ou arraste uma tarefa
                para cá.
              </p>
            )}
            {total > 0 && visiveis.length === 0 && (
              <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                Todas as tarefas desta seção estão concluídas e ocultas.
              </p>
            )}
          </div>

          <div className="border-t px-4 py-3">
            <CampoAdicionar
              rotulo="Adicionar tarefa"
              placeholder="Descrição da tarefa (ex.: Aprovar layout com a montadora)"
              aoAdicionar={(descricao) => acoes.criarTarefa(secao.id, descricao)}
            />
          </div>
        </>
      )}

      <DialogoConfirmar
        aberto={excluindo}
        aoMudar={setExcluindo}
        titulo={`Excluir a seção "${secao.nome}"?`}
        descricao={
          total > 0
            ? `A seção e as ${plural(total, "tarefa", "tarefas")} dela (com as subtarefas) serão excluídas. Essa ação não pode ser desfeita.`
            : "A seção será excluída. Essa ação não pode ser desfeita."
        }
        rotuloConfirmar="Excluir"
        perigo
        carregando={ocupado}
        aoConfirmar={confirmarExclusao}
      />
    </section>
  );
}

// Cópia simplificada do cabeçalho que acompanha o mouse ao arrastar a seção
export function SecaoFlutuante({ secao }: { secao: Secao }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-3 shadow-lg">
      <GripVertical className="size-4 text-muted-foreground" />
      <span className="text-[15px] font-semibold">{secao.nome}</span>
      <Badge variant="neutro">{plural(secao.tarefas.length, "tarefa", "tarefas")}</Badge>
    </div>
  );
}
