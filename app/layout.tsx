import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gerenciador de tarefas",
  description:
    "Marcas, eventos, orçamento, NFs, despesas recorrentes e tarefas num só lugar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        {/* Avisos rápidos (toast) usados em todas as telas */}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
