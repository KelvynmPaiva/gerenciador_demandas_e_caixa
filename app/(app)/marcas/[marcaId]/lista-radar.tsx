"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  AcoesDaLinha,
  AcoesDoPainelTarefa,
  Tarefa,
} from "@/app/(app)/eventos/[eventoId]/demandas-tipos";
import { LinhaTarefaFixa } from "@/app/(app)/eventos/[eventoId]/linha-tarefa";
import { PainelTarefa } from "@/app/(app)/eventos/[eventoId]/painel-tarefa";
import { CampoAdicionar } from "@/components/campo-adicionar";
import { plural } from "@/lib/formato";
import { pendentesPrimeiro } from "@/lib/listas";
import type { Resultado } from "@/lib/resultado";
import {
  atualizarItemRadar,
  atualizarSubitemRadar,
  criarItemRadar,
  criarSubitemRadar,
  excluirItemRadar,
  excluirSubitemRadar,
  reordenarSubitensRadar,
} from "./actions-radar";

// Seção "No Radar" da marca: demandas que ainda não viraram tarefa nem evento.
// Mesma lista e mesmo painel lateral das Demandas do evento (LinhaTarefa/PainelTarefa),
// sem seções e sem arrastar os itens (v1). Pendentes em cima, concluídos no fim.
export function ListaRadar({
  itens: doServidor,
  marcaId,
  marcaNome,
  hoje,
}: {
  itens: Tarefa[]; // itens do Radar no formato de tarefa (com subitens em `subtarefas`)
  marcaId: string;
  marcaNome: string;
  hoje: string; // "AAAA-MM-DD" em São Paulo, para marcar prazos vencidos
}) {
  const router = useRouter();

  // Cópia local, igual ao PainelDemandas: a mudança aparece na hora e é gravada em
  // seguida. Se der erro, a tela é recarregada do servidor.
  const [itens, setItens] = useState(doServidor);
  const [versaoDoServidor, setVersaoDoServidor] = useState(doServidor);
  const [gravacoesPendentes, setGravacoesPendentes] = useState(0);
  const [itemAbertoId, setItemAbertoId] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  // Dados novos do servidor só substituem a cópia com a tela "parada"
  if (doServidor !== versaoDoServidor && gravacoesPendentes === 0) {
    setVersaoDoServidor(doServidor);
    setItens(doServidor);
  }

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

  function alterarItem(id: string, campos: Partial<Tarefa>) {
    setItens((atuais) => atuais.map((i) => (i.id === id ? { ...i, ...campos } : i)));
  }

  function alterarSubitens(
    itemId: string,
    mudar: (subitens: Tarefa["subtarefas"]) => Tarefa["subtarefas"],
  ) {
    setItens((atuais) =>
      atuais.map((i) => (i.id === itemId ? { ...i, subtarefas: mudar(i.subtarefas) } : i)),
    );
  }

  const acoes: AcoesDaLinha & AcoesDoPainelTarefa = {
    // Criar e excluir esperam o servidor (o id novo e a lista certa vêm de lá)
    excluirTarefa: (itemId) => excluirItemRadar(itemId),
    criarSubtarefa: (itemId, descricao) => criarSubitemRadar(itemId, descricao),

    // Editar muda a tela na hora e grava em seguida
    salvarTarefa: (itemId, campos) => {
      alterarItem(itemId, campos);
      gravar(() => atualizarItemRadar(itemId, campos));
    },
    salvarSubtarefa: (itemId, subitemId, campos) => {
      alterarSubitens(itemId, (lista) =>
        lista.map((s) => (s.id === subitemId ? { ...s, ...campos } : s)),
      );
      gravar(() => atualizarSubitemRadar(subitemId, campos));
    },
    excluirSubtarefa: (itemId, subitemId) => {
      alterarSubitens(itemId, (lista) => lista.filter((s) => s.id !== subitemId));
      gravar(() => excluirSubitemRadar(subitemId));
    },
    reordenarSubtarefas: (itemId, idsNaNovaOrdem) => {
      alterarSubitens(itemId, (lista) =>
        idsNaNovaOrdem
          .map((id) => lista.find((s) => s.id === id))
          .filter((s) => s !== undefined),
      );
      gravar(() => reordenarSubitensRadar(itemId, idsNaNovaOrdem));
    },
  };

  // Ordenado depois da cópia local: ao marcar, o item desce na hora (e volta ao desmarcar)
  const ordenados = pendentesPrimeiro(itens, (i) => i.concluida);
  const pendentes = itens.filter((i) => !i.concluida).length;
  const itemAberto = itens.find((i) => i.id === itemAbertoId) ?? null;

  return (
    <section id="radar" aria-labelledby="titulo-radar" className="mt-12 scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="titulo-radar" className="text-h2">
          No Radar
        </h2>
        {/* Conta as mesmas linhas que aparecem abaixo */}
        {itens.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {plural(pendentes, "pendente", "pendentes")} de {itens.length}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
        {itens.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-muted-foreground">
            Nada no Radar desta marca. Guarde aqui o que ainda não virou tarefa nem
            evento, para não perder de vista.
          </p>
        ) : (
          <div>
            {ordenados.map((item) => (
              <LinhaTarefaFixa
                key={item.id}
                tarefa={item}
                hoje={hoje}
                acoes={acoes}
                aoAbrir={setItemAbertoId}
              />
            ))}
          </div>
        )}

        <div className="border-t px-4 py-3">
          <CampoAdicionar
            rotulo="Adicionar ao Radar"
            placeholder="O que não pode ser esquecido (ex.: Renovar contrato do estande)"
            aoAdicionar={(descricao) => criarItemRadar(marcaId, descricao)}
          />
        </div>
      </div>

      <PainelTarefa
        tarefa={itemAberto}
        marcaNome={marcaNome}
        eventoNome={null}
        hoje={hoje}
        acoes={acoes}
        aoFechar={() => setItemAbertoId(null)}
      />
    </section>
  );
}
