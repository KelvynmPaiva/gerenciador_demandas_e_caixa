"use client";

import { useState, useTransition } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleCheck, GripVertical, ListChecks, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { SeletorData } from "@/components/seletor-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { AcoesDemandas, Tarefa } from "./demandas-tipos";

// Uma tarefa na lista da seção. Clicar no texto abre o painel lateral de detalhes.
export function LinhaTarefa({
  tarefa,
  hoje,
  acoes,
  aoAbrir,
}: {
  tarefa: Tarefa;
  hoje: string;
  acoes: AcoesDemandas;
  aoAbrir: (tarefaId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id, data: { tipo: "tarefa" } });

  const [excluindo, setExcluindo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const total = tarefa.subtarefas.length;
  const feitas = tarefa.subtarefas.filter((s) => s.concluida).length;
  const todasFeitas = total > 0 && feitas === total;
  const prazoVencido = !tarefa.concluida && tarefa.prazo !== null && tarefa.prazo < hoje;

  function confirmarExclusao() {
    iniciar(async () => {
      const resultado = await acoes.excluirTarefa(tarefa.id);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success("Tarefa excluída.");
      setExcluindo(false);
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 border-t bg-card py-2 pr-3 pl-2 first:border-t-0",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Arrastar a tarefa ${tarefa.descricao}`}
        title="Arrastar para reordenar ou mover de seção"
        className="cursor-grab touch-none rounded p-1 text-muted-foreground/50 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <Checkbox
        checked={tarefa.concluida}
        onCheckedChange={(marcado) =>
          acoes.salvarTarefa(tarefa.id, { concluida: marcado === true })
        }
        aria-label={`Concluir a tarefa ${tarefa.descricao}`}
      />

      <button
        type="button"
        onClick={() => aoAbrir(tarefa.id)}
        title="Abrir detalhes"
        className={cn(
          "min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
          tarefa.concluida && "text-muted-foreground line-through",
        )}
      >
        {tarefa.descricao}
      </button>

      <div className="flex shrink-0 items-center gap-2">
        {todasFeitas && !tarefa.concluida && (
          <Badge variant="sucesso" className="gap-1">
            <CircleCheck /> Todas as subtarefas concluídas
          </Badge>
        )}
        {total > 0 && !todasFeitas && (
          <Badge
            variant="neutro"
            className="gap-1 tabular-nums"
            title={`${feitas} de ${total} subtarefas concluídas`}
          >
            <ListChecks /> {feitas}/{total}
          </Badge>
        )}
        {tarefa.linkExterno && (
          <Link2 className="size-4 text-primary" aria-label="Tem link externo" />
        )}
        <SeletorData
          estilo="linha"
          rotulo={`Prazo da tarefa ${tarefa.descricao}`}
          placeholder="Sem prazo"
          valor={tarefa.prazo}
          destaque={prazoVencido}
          onChange={(prazo) => acoes.salvarTarefa(tarefa.id, { prazo })}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir a tarefa ${tarefa.descricao}`}
          title="Excluir tarefa"
          className="hover:bg-perigo-fundo hover:text-perigo"
          onClick={() => setExcluindo(true)}
        >
          <Trash2 />
        </Button>
      </div>

      <DialogoConfirmar
        aberto={excluindo}
        aoMudar={setExcluindo}
        titulo={`Excluir "${tarefa.descricao}"?`}
        descricao={
          total > 0
            ? "A tarefa e as subtarefas dela serão excluídas. Essa ação não pode ser desfeita."
            : "A tarefa será excluída. Essa ação não pode ser desfeita."
        }
        rotuloConfirmar="Excluir"
        perigo
        carregando={ocupado}
        aoConfirmar={confirmarExclusao}
      />
    </div>
  );
}

// Cópia simplificada da linha que acompanha o mouse durante o arrastar
export function TarefaFlutuante({ tarefa }: { tarefa: Tarefa }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card py-2 pr-4 pl-2 text-sm shadow-lg">
      <GripVertical className="size-4 text-muted-foreground" />
      <span
        className={cn(
          "truncate",
          tarefa.concluida && "text-muted-foreground line-through",
        )}
      >
        {tarefa.descricao}
      </span>
    </div>
  );
}
