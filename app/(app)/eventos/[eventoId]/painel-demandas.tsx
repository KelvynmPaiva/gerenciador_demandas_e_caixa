"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { CampoAdicionar } from "@/components/campo-adicionar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { plural } from "@/lib/formato";
import type { Resultado } from "@/lib/resultado";
import {
  atualizarSubtarefa,
  atualizarTarefa,
  criarSecao,
  criarSubtarefa,
  criarTarefa,
  excluirSecao,
  excluirSubtarefa,
  excluirTarefa,
  renomearSecao,
  reordenarSecoes,
  reordenarSubtarefas,
  reordenarTarefas,
  type CamposSubtarefa,
  type CamposTarefa,
} from "./actions-demandas";
import { CartaoSecao, SecaoFlutuante } from "./cartao-secao";
import type { AcoesDemandas, Secao, Tarefa } from "./demandas-tipos";
import { TarefaFlutuante } from "./linha-tarefa";
import { PainelTarefa } from "./painel-tarefa";

type ItemArrastado = { tipo: "secao" | "tarefa"; id: string } | null;

// Decide sobre qual item o arrasto está "pousando":
// - arrastando uma seção: só vale outra seção;
// - arrastando uma tarefa: vale outra tarefa (de qualquer seção) ou a própria seção
//   (útil para soltar numa seção vazia).
const detectarColisao: CollisionDetection = (args) => {
  const tipoDoAtivo = args.active.data.current?.tipo;

  if (tipoDoAtivo === "secao") {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (c) => c.data.current?.tipo === "secao",
      ),
    });
  }

  const tipoDoAlvo = (id: string | number) =>
    args.droppableContainers.find((c) => c.id === id)?.data.current?.tipo;

  let candidatas = pointerWithin(args);
  if (candidatas.length === 0) candidatas = rectIntersection(args);

  const tarefa = candidatas.find((c) => tipoDoAlvo(c.id) === "tarefa");
  if (tarefa) return [tarefa];
  const secao = candidatas.find((c) => tipoDoAlvo(c.id) === "secao");
  return secao ? [secao] : [];
};

// Avisos para quem usa leitor de tela (o padrão do dnd-kit é em inglês)
const anuncios: Announcements = {
  onDragStart: () => "Item selecionado.",
  onDragOver: () => "Item movido.",
  onDragEnd: () => "Item solto.",
  onDragCancel: () => "Movimento cancelado.",
};

export function PainelDemandas({
  secoes: secoesDoServidor,
  eventoId,
  marcaNome,
  eventoNome,
  hoje,
}: {
  secoes: Secao[];
  eventoId: string;
  marcaNome: string;
  eventoNome: string;
  hoje: string; // "AAAA-MM-DD" em São Paulo, para marcar prazos vencidos
}) {
  const router = useRouter();

  // A tela trabalha numa cópia local dos dados: mudanças aparecem na hora e são
  // gravadas no banco em seguida. Se der erro, a tela é recarregada do servidor.
  const [secoes, setSecoes] = useState(secoesDoServidor);
  const [versaoDoServidor, setVersaoDoServidor] = useState(secoesDoServidor);
  const [gravacoesPendentes, setGravacoesPendentes] = useState(0);
  const [arrastado, setArrastado] = useState<ItemArrastado>(null);
  const [ocultarConcluidas, setOcultarConcluidas] = useState(false);
  const [tarefaAbertaId, setTarefaAbertaId] = useState<string | null>(null);
  const antesDoArrasto = useRef<Secao[]>([]);
  const [, iniciar] = useTransition();

  // Quando o servidor manda dados novos, a cópia local é substituída por eles.
  // Isso só acontece com a tela "parada": sem gravação em andamento e sem arrastar,
  // para uma resposta antiga não desfazer uma mudança que acabou de ser feita.
  if (
    secoesDoServidor !== versaoDoServidor &&
    gravacoesPendentes === 0 &&
    arrastado === null
  ) {
    setVersaoDoServidor(secoesDoServidor);
    setSecoes(secoesDoServidor);
  }

  const sensores = useSensors(
    // Só começa a arrastar depois de mover 6px, para o clique normal continuar funcionando
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Grava no banco sem travar a tela. Se falhar, avisa e busca o estado real do servidor.
  function gravar(acao: () => Promise<Resultado>) {
    setGravacoesPendentes((n) => n + 1);
    iniciar(async () => {
      try {
        const resultado = await acao();
        if (resultado.erro) {
          toast.error(resultado.erro);
          router.refresh();
        }
      } catch {
        toast.error("Não foi possível salvar. Verifique a conexão e tente de novo.");
        router.refresh();
      } finally {
        setGravacoesPendentes((n) => n - 1);
      }
    });
  }

  function alterarTarefa(id: string, campos: Partial<Tarefa>) {
    setSecoes((atuais) =>
      atuais.map((secao) => ({
        ...secao,
        tarefas: secao.tarefas.map((t) => (t.id === id ? { ...t, ...campos } : t)),
      })),
    );
  }

  function alterarSubtarefas(
    tarefaId: string,
    mudar: (subtarefas: Tarefa["subtarefas"]) => Tarefa["subtarefas"],
  ) {
    setSecoes((atuais) =>
      atuais.map((secao) => ({
        ...secao,
        tarefas: secao.tarefas.map((t) =>
          t.id === tarefaId ? { ...t, subtarefas: mudar(t.subtarefas) } : t,
        ),
      })),
    );
  }

  const acoes: AcoesDemandas = {
    // Criar e excluir esperam o servidor (o id novo e a lista certa vêm de lá)
    criarSecao: (nome) => criarSecao(eventoId, nome),
    excluirSecao: (secaoId) => excluirSecao(secaoId),
    criarTarefa: (secaoId, descricao) => criarTarefa(secaoId, descricao),
    excluirTarefa: (tarefaId) => excluirTarefa(tarefaId),
    criarSubtarefa: (tarefaId, descricao) => criarSubtarefa(tarefaId, descricao),

    // Editar muda a tela na hora e grava em seguida
    renomearSecao: (secaoId, nome) => {
      setSecoes((atuais) =>
        atuais.map((s) => (s.id === secaoId ? { ...s, nome } : s)),
      );
      gravar(() => renomearSecao(secaoId, nome));
    },

    salvarTarefa: (tarefaId: string, campos: CamposTarefa) => {
      alterarTarefa(tarefaId, campos);
      gravar(() => atualizarTarefa(tarefaId, campos));
    },

    salvarSubtarefa: (tarefaId: string, subtarefaId: string, campos: CamposSubtarefa) => {
      alterarSubtarefas(tarefaId, (lista) =>
        lista.map((s) => (s.id === subtarefaId ? { ...s, ...campos } : s)),
      );
      gravar(() => atualizarSubtarefa(subtarefaId, campos));
    },

    excluirSubtarefa: (tarefaId, subtarefaId) => {
      alterarSubtarefas(tarefaId, (lista) => lista.filter((s) => s.id !== subtarefaId));
      gravar(() => excluirSubtarefa(subtarefaId));
    },

    reordenarSubtarefas: (tarefaId, idsNaNovaOrdem) => {
      alterarSubtarefas(tarefaId, (lista) =>
        idsNaNovaOrdem
          .map((id) => lista.find((s) => s.id === id))
          .filter((s) => s !== undefined),
      );
      gravar(() => reordenarSubtarefas(tarefaId, idsNaNovaOrdem));
    },
  };

  // ---------- Arrastar e soltar (seções e tarefas) ----------

  function aoComecarArrasto({ active }: DragStartEvent) {
    antesDoArrasto.current = secoes;
    setArrastado({
      tipo: active.data.current?.tipo === "secao" ? "secao" : "tarefa",
      id: String(active.id),
    });
  }

  // Enquanto uma tarefa passa por cima de outra seção, ela já "entra" nessa seção
  function aoPassarPor({ active, over }: DragOverEvent) {
    if (!over || arrastado?.tipo !== "tarefa") return;

    const idDaTarefa = String(active.id);
    const idDoAlvo = String(over.id);
    if (idDaTarefa === idDoAlvo) return;

    const emCimaDaSecao = over.data.current?.tipo === "secao";
    const arrastadaAbaixo =
      !!active.rect.current.translated &&
      active.rect.current.translated.top > over.rect.top + over.rect.height;

    setSecoes((atuais) => {
      const origem = atuais.find((s) => s.tarefas.some((t) => t.id === idDaTarefa));
      const destino = emCimaDaSecao
        ? atuais.find((s) => s.id === idDoAlvo)
        : atuais.find((s) => s.tarefas.some((t) => t.id === idDoAlvo));
      if (!origem || !destino || origem.id === destino.id) return atuais;

      const tarefa = origem.tarefas.find((t) => t.id === idDaTarefa);
      if (!tarefa) return atuais;

      const indiceDoAlvo = destino.tarefas.findIndex((t) => t.id === idDoAlvo);
      const novoIndice =
        indiceDoAlvo >= 0
          ? indiceDoAlvo + (arrastadaAbaixo ? 1 : 0)
          : destino.tarefas.length;

      return atuais.map((secao) => {
        if (secao.id === origem.id) {
          return { ...secao, tarefas: secao.tarefas.filter((t) => t.id !== idDaTarefa) };
        }
        if (secao.id === destino.id) {
          const tarefas = [...secao.tarefas];
          tarefas.splice(novoIndice, 0, tarefa);
          return { ...secao, tarefas };
        }
        return secao;
      });
    });
  }

  function aoTerminarArrasto({ active, over }: DragEndEvent) {
    const tipo = arrastado?.tipo;
    setArrastado(null);

    // Soltou fora de qualquer lugar válido: volta ao que estava
    if (!over) {
      setSecoes(antesDoArrasto.current);
      return;
    }

    if (tipo === "secao") {
      const ids = secoes.map((s) => s.id);
      const de = ids.indexOf(String(active.id));
      const para = ids.indexOf(String(over.id));
      if (de < 0 || para < 0 || de === para) return;

      const novas = arrayMove(secoes, de, para);
      setSecoes(novas);
      gravar(() => reordenarSecoes(eventoId, novas.map((s) => s.id)));
      return;
    }

    // Tarefa: a seção de destino já foi definida durante o arrasto
    const idDaTarefa = String(active.id);
    const destino = secoes.find((s) => s.tarefas.some((t) => t.id === idDaTarefa));
    if (!destino) return;

    let atuais = secoes;
    const de = destino.tarefas.findIndex((t) => t.id === idDaTarefa);
    const para = destino.tarefas.findIndex((t) => t.id === String(over.id));
    if (para >= 0 && de !== para) {
      atuais = secoes.map((s) =>
        s.id === destino.id ? { ...s, tarefas: arrayMove(s.tarefas, de, para) } : s,
      );
      setSecoes(atuais);
    }

    const origemId = antesDoArrasto.current.find((s) =>
      s.tarefas.some((t) => t.id === idDaTarefa),
    )?.id;
    const mudouDeSecao = origemId !== destino.id;

    const ordemAntes = antesDoArrasto.current
      .find((s) => s.id === destino.id)
      ?.tarefas.map((t) => t.id)
      .join(",");
    const destinoFinal = atuais.find((s) => s.id === destino.id);
    if (!destinoFinal) return;
    const ordemDepois = destinoFinal.tarefas.map((t) => t.id).join(",");
    if (!mudouDeSecao && ordemAntes === ordemDepois) return; // nada mudou

    // Grava a seção de destino e, se a tarefa mudou de seção, a de origem também
    const layout = [
      { secaoId: destinoFinal.id, tarefaIds: destinoFinal.tarefas.map((t) => t.id) },
    ];
    const origem = mudouDeSecao ? atuais.find((s) => s.id === origemId) : undefined;
    if (origem) {
      layout.push({ secaoId: origem.id, tarefaIds: origem.tarefas.map((t) => t.id) });
    }
    gravar(() => reordenarTarefas(layout));
  }

  function aoCancelarArrasto() {
    setArrastado(null);
    setSecoes(antesDoArrasto.current);
  }

  // ---------- Tela ----------

  const todasAsTarefas = secoes.flatMap((s) => s.tarefas);
  const pendentes = todasAsTarefas.filter((t) => !t.concluida).length;
  const tarefaAberta = todasAsTarefas.find((t) => t.id === tarefaAbertaId) ?? null;

  const tarefaArrastada =
    arrastado?.tipo === "tarefa"
      ? todasAsTarefas.find((t) => t.id === arrastado.id)
      : undefined;
  const secaoArrastada =
    arrastado?.tipo === "secao" ? secoes.find((s) => s.id === arrastado.id) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-xs">
        <Switch
          id="ocultar-concluidas"
          checked={ocultarConcluidas}
          onCheckedChange={setOcultarConcluidas}
        />
        <Label htmlFor="ocultar-concluidas" className="cursor-pointer text-sm font-medium">
          Ocultar concluídas
        </Label>
        <span className="ml-auto text-sm text-muted-foreground">
          {plural(pendentes, "tarefa pendente", "tarefas pendentes")} de{" "}
          {todasAsTarefas.length}
        </span>
      </div>

      <DndContext
        id="demandas-dnd"
        sensors={sensores}
        collisionDetection={detectarColisao}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={aoComecarArrasto}
        onDragOver={aoPassarPor}
        onDragEnd={aoTerminarArrasto}
        onDragCancel={aoCancelarArrasto}
        accessibility={{
          announcements: anuncios,
          screenReaderInstructions: {
            draggable:
              "Para reordenar, aperte espaço, use as setas para mover e aperte espaço de novo para soltar. Esc cancela.",
          },
        }}
      >
        <SortableContext
          items={secoes.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {secoes.map((secao) => (
              <CartaoSecao
                key={secao.id}
                secao={secao}
                ocultarConcluidas={ocultarConcluidas}
                hoje={hoje}
                acoes={acoes}
                aoAbrirTarefa={setTarefaAbertaId}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {tarefaArrastada && <TarefaFlutuante tarefa={tarefaArrastada} />}
          {secaoArrastada && <SecaoFlutuante secao={secaoArrastada} />}
        </DragOverlay>
      </DndContext>

      {secoes.length === 0 && (
        <p className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Este evento ainda não tem demandas. Crie a primeira seção abaixo
          (ex.: &ldquo;Pré-evento e Produção&rdquo;) e adicione as tarefas dentro dela.
        </p>
      )}

      <div className="rounded-xl border-2 border-dashed bg-card/60 px-4 py-4">
        <CampoAdicionar
          rotulo="Nova seção"
          placeholder="Nome da seção (ex.: Comunicação e Mídia)"
          maxLength={120}
          classeBotao="w-full justify-center py-1 text-muted-foreground hover:text-primary hover:no-underline"
          aoAdicionar={acoes.criarSecao}
        />
      </div>

      <PainelTarefa
        tarefa={tarefaAberta}
        marcaNome={marcaNome}
        eventoNome={eventoNome}
        hoje={hoje}
        acoes={acoes}
        aoFechar={() => setTarefaAbertaId(null)}
      />
    </div>
  );
}
