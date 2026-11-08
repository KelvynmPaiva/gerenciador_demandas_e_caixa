import type { Resultado } from "@/lib/resultado";
import type { CamposSubtarefa, CamposTarefa } from "./actions-demandas";

// Dados da aba Demandas, do jeito que a tela usa (nomes em camelCase).

export type Subtarefa = {
  id: string;
  descricao: string;
  prazo: string | null; // "AAAA-MM-DD"
  concluida: boolean;
  observacao: string | null;
};

export type Tarefa = {
  id: string;
  descricao: string;
  prazo: string | null; // "AAAA-MM-DD"
  concluida: boolean;
  observacao: string | null;
  linkExterno: string | null;
  subtarefas: Subtarefa[];
};

export type Secao = {
  id: string;
  nome: string;
  tarefas: Tarefa[];
};

// Tudo o que a tela pode pedir para mudar. Quem implementa é o PainelDemandas:
// ele atualiza a tela na hora, grava no banco e, se falhar, volta ao que estava.
export type AcoesDemandas = {
  criarSecao: (nome: string) => Promise<Resultado>;
  renomearSecao: (secaoId: string, nome: string) => void;
  excluirSecao: (secaoId: string) => Promise<Resultado>;

  criarTarefa: (secaoId: string, descricao: string) => Promise<Resultado>;
  salvarTarefa: (tarefaId: string, campos: CamposTarefa) => void;
  excluirTarefa: (tarefaId: string) => Promise<Resultado>;

  criarSubtarefa: (tarefaId: string, descricao: string) => Promise<Resultado>;
  salvarSubtarefa: (
    tarefaId: string,
    subtarefaId: string,
    campos: CamposSubtarefa,
  ) => void;
  excluirSubtarefa: (tarefaId: string, subtarefaId: string) => void;
  reordenarSubtarefas: (tarefaId: string, idsNaNovaOrdem: string[]) => void;
};
