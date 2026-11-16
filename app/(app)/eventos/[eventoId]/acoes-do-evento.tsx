"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { arquivarEvento, excluirEvento } from "../actions";
import { DialogoEvento, type EventoParaEdicao } from "../dialogo-evento";

// Botões da barra do topo do evento: Editar e Arquivar/Desarquivar; Excluir fica no menu "…".
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
    <>
      <Button variant="outline" size="sm" className="max-md:hidden" onClick={() => setEditando(true)}>
        <Pencil data-icon="inline-start" /> Editar
      </Button>
      <Button variant="outline" size="sm" className="max-md:hidden" onClick={alternarArquivo} disabled={ocupado}>
        {arquivado ? <ArchiveRestore data-icon="inline-start" /> : <Archive data-icon="inline-start" />}
        {arquivado ? "Desarquivar" : "Arquivar"}
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Mais ações do evento" title="Mais ações">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {/* No celular os botões do topo somem; as ações vêm para o menu */}
          <DropdownMenuItem className="md:hidden" onSelect={() => setEditando(true)}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem className="md:hidden" disabled={ocupado} onSelect={alternarArquivo}>
            {arquivado ? <ArchiveRestore /> : <Archive />}
            {arquivado ? "Desarquivar" : "Arquivar"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setExcluindo(true)}>
            <Trash2 /> Excluir evento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
