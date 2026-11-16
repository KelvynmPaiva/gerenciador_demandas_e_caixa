"use client";

import { ThemeProvider as NextThemes } from "next-themes";

// Tema claro/escuro: aplica a classe "dark" no <html>; começa pelo tema do sistema.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemes>
  );
}
