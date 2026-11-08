"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { Button } from "@/components/ui/button";
import { arquivarEvento, excluirEvento } from "../actions";
import { DialogoEvento, type EventoParaEdicao } from "../dialogo-evento";

// Botões do topo da página do evento: Editar, Arquivar/Desarquivar e Excluir.
export function AcoesDoEvento({
  evento,
  arquivado,
}: {
  evento: EventoParaEdicao;
  arquivado: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  function alternarArquivo() {
    iniciar(async () => {
      const resultado = await arquivarEvento(evento.id, !arquivado);
      if (resultado.erro) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(
        arquivado
          ? "Evento desarquivado. Ele voltou para a lista de ativos."
          : "Evento arquivado. Ele saiu da lista de ativos da marca.",
      );
    });
  }

  function confirmarExclusao() {
    iniciar(async () => {
      // Se deu certo, o servidor redireciona para a tela da marca
      const resultado = await excluirEvento(evento.id, true);
      if (resultado?.erro) {
        toast.error(resultado.erro);
        setExcluindo(false);
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="outline" onClick={() => setEditando(true)}>
        <Pencil /> Editar evento
      </Button>
      <Button variant="outline" onClick={alternarArquivo} disabled={ocupado}>
        {arquivado ? <ArchiveRestore /> : <Archive />}
        {arquivado ? "Desarquivar" : "Arquivar"}
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Excluir evento"
        title="Excluir evento"
        className="text-perigo hover:bg-perigo-fundo hover:text-perigo"
        onClick={() => setExcluindo(true)}
      >
        <Trash2 />
      </Button>

      <DialogoEvento aberto={editando} aoMudar={setEditando} evento={evento} />
      <DialogoConfirmar
        aberto={excluindo}
        aoMudar={setExcluindo}
        titulo={`Excluir "${evento.nome}"?`}
        descricao="O orçamento, as seções, as tarefas e as subtarefas deste evento também serão apagados, e isso não pode ser desfeito. Se só quer tirar da lista, use Arquivar."
        rotuloConfirmar="Excluir evento"
        perigo
        carregando={ocupado}
        aoConfirmar={confirmarExclusao}
      />
    </div>
  );
}
