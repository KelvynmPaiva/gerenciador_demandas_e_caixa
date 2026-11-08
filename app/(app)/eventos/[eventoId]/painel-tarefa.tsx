"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CircleCheck,
  GripVertical,
  Link2,
  Trash2,
  Users,
} from "lucide-react";
import { BotaoLink } from "@/components/botao-link";
import { CampoAdicionar } from "@/components/campo-adicionar";
import { CampoAreaTexto, CampoTexto } from "@/components/campos-inline";
import { SeletorData } from "@/components/seletor-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { linkSeguro } from "@/lib/links";
import { cn } from "@/lib/utils";
import type { AcoesDemandas, Subtarefa, Tarefa } from "./demandas-tipos";

// Painel lateral com os detalhes da tarefa. Tudo salva sozinho ao sair do campo.
export function PainelTarefa({
  tarefa,
  marcaNome,
  eventoNome,
  hoje,
  acoes,
  aoFechar,
}: {
  tarefa: Tarefa | null; // null = painel fechado
  marcaNome: string;
  eventoNome: string;
  hoje: string;
  acoes: AcoesDemandas;
  aoFechar: () => void;
}) {
  // Guarda a última tarefa aberta para o conteúdo não sumir durante a animação de fechar
  const [ultima, setUltima] = useState(tarefa);
  if (tarefa && tarefa !== ultima) setUltima(tarefa);
  const exibida = tarefa ?? ultima;

  return (
    <Sheet open={tarefa !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <SheetContent className="gap-0 p-0 sm:max-w-[540px]!">
        {exibida && (
          <ConteudoDoPainel
            // Trocar de tarefa recria o conteúdo (zera campos em edição)
            key={exibida.id}
            tarefa={exibida}
            marcaNome={marcaNome}
            eventoNome={eventoNome}
            hoje={hoje}
            acoes={acoes}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConteudoDoPainel({
  tarefa,
  marcaNome,
  eventoNome,
  hoje,
  acoes,
}: {
  tarefa: Tarefa;
  marcaNome: string;
  eventoNome: string;
  hoje: string;
  acoes: AcoesDemandas;
}) {
  const [ocultarConcluidas, setOcultarConcluidas] = useState(false);

  const total = tarefa.subtarefas.length;
  const feitas = tarefa.subtarefas.filter((s) => s.concluida).length;
  const todasFeitas = total > 0 && feitas === total;
  const percentual = total === 0 ? 0 : Math.round((feitas / total) * 100);
  const visiveis = ocultarConcluidas
    ? tarefa.subtarefas.filter((s) => !s.concluida)
    : tarefa.subtarefas;

  const prazoVencido = !tarefa.concluida && tarefa.prazo !== null && tarefa.prazo < hoje;
  const linkParaAbrir = linkSeguro(tarefa.linkExterno);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function aoTerminarArrastar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    // Os ids são os de TODAS as subtarefas (inclusive as ocultas), para a ordem salva ficar certa
    const ids = tarefa.subtarefas.map((s) => s.id);
    const de = ids.indexOf(String(active.id));
    const para = ids.indexOf(String(over.id));
    if (de < 0 || para < 0) return;
    acoes.reordenarSubtarefas(tarefa.id, arrayMove(ids, de, para));
  }

  return (
    <>
      <SheetHeader className="border-b px-6 py-4 pr-14">
        <SheetTitle className="sr-only">Detalhes da tarefa</SheetTitle>
        <SheetDescription className="sr-only">
          Edite os dados da tarefa e gerencie as subtarefas. As alterações são
          salvas automaticamente.
        </SheetDescription>
        <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium">
          <Checkbox
            checked={tarefa.concluida}
            onCheckedChange={(marcado) =>
              acoes.salvarTarefa(tarefa.id, { concluida: marcado === true })
            }
          />
          Marcar como concluída
        </label>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div>
          <p className="mb-1 px-2.5 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
            Título da tarefa
          </p>
          <CampoAreaTexto
            rotulo="Título da tarefa"
            valor={tarefa.descricao}
            obrigatorio
            permitirQuebra={false}
            maxLength={300}
            onSalvar={(descricao) => descricao && acoes.salvarTarefa(tarefa.id, { descricao })}
            className={cn(
              "text-xl leading-7 font-semibold",
              tarefa.concluida && "text-muted-foreground line-through",
            )}
          />
        </div>

        <div className="space-y-4 rounded-xl border bg-muted/40 p-4">
          <LinhaDeCampo icone={<CalendarDays />} rotulo="Prazo">
            <div className="w-44">
              <SeletorData
                rotulo="Prazo da tarefa"
                placeholder="Sem prazo"
                valor={tarefa.prazo}
                destaque={prazoVencido}
                onChange={(prazo) => acoes.salvarTarefa(tarefa.id, { prazo })}
              />
            </div>
          </LinhaDeCampo>

          <LinhaDeCampo icone={<Users />} rotulo="Marca / Evento">
            <span className="text-sm">
              {marcaNome} <span className="text-muted-foreground">•</span> {eventoNome}
            </span>
          </LinhaDeCampo>

          <LinhaDeCampo icone={<Link2 />} rotulo="Link externo">
            <div className="flex min-w-0 items-center gap-1">
              <BotaoLink
                rotulo="Editar link externo da tarefa"
                valor={tarefa.linkExterno}
                onSalvar={(linkExterno) => acoes.salvarTarefa(tarefa.id, { linkExterno })}
              />
              {linkParaAbrir ? (
                <a
                  href={linkParaAbrir}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-primary hover:underline"
                >
                  {linkParaAbrir}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">Nenhum link</span>
              )}
            </div>
          </LinhaDeCampo>

          <div>
            <p className="mb-1 px-2.5 text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
              Observação / descrição
            </p>
            <CampoAreaTexto
              rotulo="Observação da tarefa"
              placeholder="Escreva uma observação..."
              valor={tarefa.observacao}
              maxLength={2000}
              onSalvar={(observacao) => acoes.salvarTarefa(tarefa.id, { observacao })}
              className="min-h-20 border-input bg-card"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Subtarefas</h3>
            {total > 0 && (
              <Badge variant="neutro" className="tabular-nums">
                {feitas}/{total} concluídas
              </Badge>
            )}
            {feitas > 0 && (
              <button
                type="button"
                onClick={() => setOcultarConcluidas((atual) => !atual)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {ocultarConcluidas ? "Mostrar concluídas" : "Ocultar concluídas"}
              </button>
            )}
            {total > 0 && (
              <span className="ml-auto text-sm font-medium text-muted-foreground tabular-nums">
                {percentual}%
              </span>
            )}
          </div>

          {total > 0 && (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Subtarefas concluídas"
              aria-valuenow={percentual}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-sucesso transition-all"
                style={{ width: `${percentual}%` }}
              />
            </div>
          )}

          {todasFeitas && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-sucesso-borda bg-sucesso-fundo px-4 py-3 text-sm font-medium text-sucesso">
              <CircleCheck className="size-4" /> Todas as subtarefas concluídas
            </div>
          )}

          <div className="mt-4 space-y-2">
            <DndContext
              id="subtarefas-dnd"
              sensors={sensores}
              collisionDetection={closestCenter}
              onDragEnd={aoTerminarArrastar}
              accessibility={{
                screenReaderInstructions: {
                  draggable:
                    "Para reordenar, aperte espaço, use as setas para mover e aperte espaço de novo para soltar.",
                },
              }}
            >
              <SortableContext
                items={visiveis.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {visiveis.map((subtarefa) => (
                  <LinhaSubtarefa
                    key={subtarefa.id}
                    subtarefa={subtarefa}
                    tarefaId={tarefa.id}
                    hoje={hoje}
                    acoes={acoes}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {total === 0 && (
              <p className="py-2 text-sm text-muted-foreground">
                Nenhuma subtarefa ainda.
              </p>
            )}
          </div>

          <div className="mt-3">
            <CampoAdicionar
              sempreAberto
              rotulo="Adicionar subtarefa"
              placeholder="Escreva uma nova subtarefa..."
              aoAdicionar={(descricao) => acoes.criarSubtarefa(tarefa.id, descricao)}
            />
          </div>
        </div>
      </div>

      <SheetFooter className="flex-row items-center justify-between border-t px-6 py-4">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-sucesso" />
          Alterações salvas automaticamente
        </span>
        <SheetClose asChild>
          <Button variant="outline">Fechar</Button>
        </SheetClose>
      </SheetFooter>
    </>
  );
}

function LinhaDeCampo({
  icone,
  rotulo,
  children,
}: {
  icone: React.ReactNode;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-36 shrink-0 items-center gap-2 text-sm text-muted-foreground [&>svg]:size-4">
        {icone}
        {rotulo}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function LinhaSubtarefa({
  subtarefa,
  tarefaId,
  hoje,
  acoes,
}: {
  subtarefa: Subtarefa;
  tarefaId: string;
  hoje: string;
  acoes: AcoesDemandas;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtarefa.id });

  const prazoVencido =
    !subtarefa.concluida && subtarefa.prazo !== null && subtarefa.prazo < hoje;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border bg-card px-2 py-2",
        isDragging && "relative z-10 opacity-60 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Arrastar a subtarefa ${subtarefa.descricao}`}
          title="Arrastar para reordenar"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground/50 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <Checkbox
          checked={subtarefa.concluida}
          onCheckedChange={(marcado) =>
            acoes.salvarSubtarefa(tarefaId, subtarefa.id, { concluida: marcado === true })
          }
          aria-label={`Concluir a subtarefa ${subtarefa.descricao}`}
        />
        <div className="min-w-0 flex-1">
          <CampoTexto
            rotulo={`Descrição da subtarefa ${subtarefa.descricao}`}
            valor={subtarefa.descricao}
            obrigatorio
            className={cn(subtarefa.concluida && "text-muted-foreground line-through")}
            onSalvar={(descricao) =>
              descricao && acoes.salvarSubtarefa(tarefaId, subtarefa.id, { descricao })
            }
          />
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir a subtarefa ${subtarefa.descricao}`}
          title="Excluir subtarefa"
          className="hover:bg-perigo-fundo hover:text-perigo"
          onClick={() => acoes.excluirSubtarefa(tarefaId, subtarefa.id)}
        >
          <Trash2 />
        </Button>
      </div>

      <div className="mt-1 flex items-center gap-2 pl-14">
        <SeletorData
          estilo="linha"
          rotulo={`Prazo da subtarefa ${subtarefa.descricao}`}
          placeholder="Sem prazo"
          valor={subtarefa.prazo}
          destaque={prazoVencido}
          onChange={(prazo) => acoes.salvarSubtarefa(tarefaId, subtarefa.id, { prazo })}
        />
        <div className="min-w-0 flex-1">
          <CampoTexto
            rotulo={`Observação da subtarefa ${subtarefa.descricao}`}
            placeholder="Observação"
            valor={subtarefa.observacao}
            onSalvar={(observacao) =>
              acoes.salvarSubtarefa(tarefaId, subtarefa.id, { observacao })
            }
            className="text-xs text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
