import { revalidatePath } from "next/cache";

// Utilidades compartilhadas pelas Server Actions (arquivos "actions*.ts").
// Este arquivo NÃO é "use server": ele só tem funções auxiliares, não endpoints.

// Depois de qualquer gravação, atualiza o menu lateral e todas as telas.
// Intencionalmente amplo: uma mudança numa tarefa também altera o Painel, a tela
// da marca e os contadores do menu. Na Server Action o Next já devolve só a tela
// atual pronta, então restringir o caminho não economizaria nada.
export function atualizarTelas() {
  revalidatePath("/", "layout");
}

// O banco guarda valores com até 10 dígitos antes da vírgula (numeric(12,2))
export function valorValido(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0 && valor < 1e10;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}

export function listaDeIds(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.every(ehUuid);
}
