"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const opcoes = [
  { v: "light", label: "Tema claro", Icon: Sun },
  { v: "dark", label: "Tema escuro", Icon: Moon },
] as const;

// Alternador de tema (fica na lateral, entre as marcas e o rodapé do usuário)
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Só marca o botão ativo depois de montar, para não divergir do HTML do servidor
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <span className="text-xs font-medium text-muted-foreground">Tema</span>
      <div role="group" aria-label="Tema" className="inline-flex rounded-lg border bg-muted p-0.5">
        {opcoes.map(({ v, label, Icon }) => {
          const ativo = montado && resolvedTheme === v;
          return (
            <button
              key={v}
              type="button"
              aria-label={label}
              aria-pressed={ativo}
              title={label}
              onClick={() => setTheme(v)}
              className={cn(
                "grid h-[22px] w-[26px] place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground",
                ativo && "bg-card text-foreground shadow-sm",
              )}
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
