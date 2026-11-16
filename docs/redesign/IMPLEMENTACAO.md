# Repaginação: guia de implementação

O que muda aqui é só a aparência. Rotas, props, handlers, queries do Supabase e a lógica de @dnd-kit continuam iguais. O trabalho é trocar `className`, ajustar as variantes do `cva` e criar 6 componentes pequenos de apresentação.

## 0. Ordem segura (um commit por passo)

1. Fontes + `globals.css` + tema claro/escuro (seção 1b). O app inteiro já muda de cara e nada quebra.
2. Componentes shadcn (seção 2). Um por vez, testando a tela que mais usa cada um.
3. Componentes novos (seção 3).
4. Telas, nesta ordem: Painel → Evento → Marca → Marcas → Login.
5. Mobile (seção 5) e estados (vazio, carregando, erro).

## 1. Fontes, em `app/layout.tsx`

```tsx
import { Geist, Geist_Mono } from "next/font/google";
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

<html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
```

Depois disso, cole o `globals.css` no lugar do atual. Ele mantém todos os nomes que o shadcn usa e só **acrescenta** tokens novos.

## 1b. Tema claro/escuro

Os tokens dos dois temas já estão no `globals.css`: `:root` é o claro e `.dark` é o escuro. Para alternar, use **next-themes** (é o padrão do shadcn):

```bash
npm i next-themes
```

`components/theme-provider.tsx`
```tsx
"use client";
import { ThemeProvider as NextThemes } from "next-themes";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>{children}</NextThemes>;
}
```

`app/layout.tsx`: coloque `suppressHydrationWarning` no `<html>` e envolva o `body` com `<ThemeProvider>`. O `<Toaster>` fica dentro dele e recebe `theme={resolvedTheme}`, ou use o `components/ui/sonner.tsx` do shadcn, que já lê o `useTheme`.

`components/theme-toggle.tsx`: fica na **sidebar**, entre a lista de marcas e o rodapé do usuário.
```tsx
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const opts = [{ v: "light", label: "Tema claro", Icon: Sun }, { v: "dark", label: "Tema escuro", Icon: Moon }] as const;
  return (
    <div className="flex items-center justify-between px-2 py-2">
      <span className="text-xs font-medium text-muted-foreground">Tema</span>
      <div role="group" aria-label="Tema" className="inline-flex rounded-lg border bg-muted p-0.5">
        {opts.map(({ v, label, Icon }) => {
          const on = mounted && resolvedTheme === v;
          return (
            <button key={v} type="button" aria-label={label} aria-pressed={on} title={label}
              onClick={() => setTheme(v)}
              className={cn("grid h-[22px] w-[26px] place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground",
                on && "bg-card text-foreground shadow-sm")}>
              <Icon className="size-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

Regras para o escuro funcionar sem retrabalho:
- **Nunca** use cor fixa (`bg-white`, `text-gray-500`, `bg-blue-600`, hex) em componente. Use só tokens (`bg-card`, `text-muted-foreground`, `bg-brand`…). Faça `grep -rnE "(bg|text|border)-(white|black|gray|slate|zinc|blue|red|green|amber)-" app components` e troque o que aparecer.
- No escuro o botão principal **inverte** (fica claro com texto grafite). Isso já vem do token `--primary`, não precisa de `dark:`.
- O check do checkbox usa `text-on-status`, que fica branco no claro e grafite no escuro.
- Não use `dark:` para corrigir cor: se algo ficou errado no escuro, o ajuste é no token.

## 2. Componentes shadcn que precisam mudar

| Componente | O que muda | Por quê |
|---|---|---|
| **button** | `default` = grafite (`bg-primary hover:bg-primary-hover`). `outline` = `bg-card border-border-strong shadow-xs hover:bg-muted`. `ghost` = `text-muted-foreground hover:bg-accent hover:text-foreground`. `link` = `text-brand`. `destructive` = `bg-danger-solid text-white hover:bg-danger-solid/90`. Tamanhos: `default h-8 px-3 text-[13px] rounded-md`, `sm h-7 px-2.5 text-[12.5px]`, `lg h-[38px] px-4 text-sm`, `icon size-8`, `icon-sm size-7`. Base: `transition-[background,box-shadow,transform] duration-150 ease-out active:translate-y-px` | O azul sai do botão e passa a marcar só foco, aba ativa e link. A ação principal fica forte sem gritar. |
| **input** | `h-[34px] rounded-md bg-card border-input shadow-xs text-[13.5px] hover:border-control-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-danger aria-invalid:ring-danger/15 placeholder:text-subtle-foreground` | Foco mais claro e erro sem precisar de toast. |
| **card** | `rounded-lg border bg-card shadow-xs gap-0 py-0`. Tire o `py-6`/`gap-6` padrão e controle o espaçamento por tela. | O padding grande deixava as telas "aéreas" demais. |
| **badge** | Novas variantes: `danger`, `warning`, `success`, `brand`, `neutral`. Base: `h-[22px] rounded-sm px-2 text-xs font-medium border gap-1.5` (veja `StatusBadge` abaixo). | Status com significado, e não decoração. |
| **table** | `TableHead`: `h-[34px] bg-muted text-xs font-medium text-muted-foreground` (**sem** `uppercase` e sem tracking). `TableRow`: `hover:bg-row-hover border-border-subtle`. `TableCell`: `h-11 px-3 text-[13px]`. Números: `text-right num`. `TableFooter`: `bg-muted font-medium`. | A caixa-alta era o principal sinal de "template". Os valores ficam alinhados para leitura em coluna. |
| **tabs** | Crie a variante `line`: `TabsList` = `bg-transparent border-b rounded-none p-0 gap-5 h-auto`. `TabsTrigger` = `h-10 px-0 rounded-none text-[13.5px] font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none relative after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full data-[state=active]:after:bg-brand` | Fica igual às abas do Evento. |
| **checkbox** | `size-4 rounded-[5px] border-[1.5px] border-control-border data-[state=checked]:bg-success data-[state=checked]:border-success data-[state=checked]:animate-check-pop`. Ícone `Check` em `size-[11px] stroke-[3] text-on-status`. | O verde confirma que a ação foi feita, e o "pop" dá o feedback ao concluir. |
| **switch** | `h-[18px] w-[30px] data-[state=checked]:bg-primary data-[state=unchecked]:bg-border-strong`. Thumb `size-3.5` | Mais discreto. |
| **dialog / alert-dialog** | Overlay: `bg-overlay` (sem blur). Content: `rounded-xl shadow-overlay p-5 max-w-[420px] data-[state=open]:zoom-in-[0.98] duration-200`. Title `text-base font-semibold tracking-tight`. Use **AlertDialog** em toda exclusão, com o nome do objeto no título e "Arquivar" como alternativa. | Confirmação clara e menos risco de apagar sem querer. |
| **dropdown-menu / popover** | Content: `rounded-[9px] shadow-overlay p-1 border-0`. Item: `h-[30px] rounded-md text-[13px]`. Item destrutivo: `text-danger-text focus:bg-danger-subtle` | Mesma família visual do diálogo. |
| **calendar** (react-day-picker) | Passe `locale={ptBR}` (date-fns). Dia selecionado: `bg-primary text-primary-foreground`. Hoje: `ring-1 ring-brand`. Botão `size-8 text-[13px] num` | Coerente com o botão grafite. |
| **sonner** | `<Toaster position="bottom-right" toastOptions={{ classNames: { toast: "bg-toast text-toast-foreground border border-toast-border shadow-overlay rounded-lg text-[13px]", actionButton: "!bg-transparent !text-toast-action font-medium" } }} />`. Ao concluir uma tarefa: `toast("Tarefa concluída", { action: { label: "Desfazer", onClick: undo } })` | Feedback + desfazer, sem modal. |
| **skeleton** | Troque `animate-pulse bg-accent` por `skeleton-shimmer rounded-sm` | O shimmer é mais leve e respeita o movimento reduzido. |
| **sidebar** (se usar a do shadcn) | `SidebarMenuButton` ativo: `data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-sm data-[active=true]:text-foreground`. Rótulos de grupo sem uppercase. Em telas `<md`, esconda a sidebar e use o `MobileNav`. | Item ativo vira uma pílula branca, no estilo do Linear. |
| **tooltip** | `bg-primary text-primary-foreground text-xs rounded-md px-2 py-1` | — |

## 3. Componentes novos (só apresentação)

### `lib/format.ts`

```ts
export const brl = (v: number | null | undefined) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type Urgency = "overdue" | "today" | "week" | "later" | "none";

export function urgency(date: Date | null, now = new Date()): Urgency {
  if (!date) return "none";
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const t = new Date(now); t.setHours(0, 0, 0, 0);
  const diff = Math.round((+d - +t) / 86_400_000);
  if (diff < 0) return "overdue";
  if (diff <= 1) return "today";       // hoje e amanhã ficam em âmbar
  if (diff <= 7) return "week";
  return "later";
}

export function relativeLabel(date: Date, now = new Date()) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const t = new Date(now); t.setHours(0,0,0,0);
  const diff = Math.round((+d - +t) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff < 0) return `há ${-diff} dia${diff === -1 ? "" : "s"}`;
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
}
```

### `components/date-chip.tsx`

```tsx
import { AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { urgency, relativeLabel } from "@/lib/format";

const tone = {
  overdue: "text-danger-text", today: "text-warning-text",
  week: "text-muted-foreground", later: "text-muted-foreground", none: "text-subtle-foreground",
};

export function DateChip({ date, done }: { date: Date | null; done?: boolean }) {
  const u = done ? "later" : urgency(date);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px] num whitespace-nowrap", tone[u])}>
      {u === "overdue" ? <AlertTriangle className="size-3" /> : <Calendar className="size-3" />}
      {date ? <span className={u === "overdue" || u === "today" ? "font-medium" : ""}>{relativeLabel(date)}</span> : "Sem prazo"}
    </span>
  );
}
```

### `components/status-badge.tsx`

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

const badge = cva(
  "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-sm border text-xs font-medium whitespace-nowrap",
  { variants: { tone: {
      danger:  "bg-danger-subtle border-danger-border text-danger-text",
      warning: "bg-warning-subtle border-warning-border text-warning-text",
      success: "bg-success-subtle border-success-border text-success-text",
      brand:   "bg-brand-subtle border-brand-border text-brand-text",
      neutral: "bg-muted border-border text-muted-foreground",
  } }, defaultVariants: { tone: "neutral" } });

export function StatusBadge({ tone, children }: VariantProps<typeof badge> & { children: React.ReactNode }) {
  return (
    <span className={badge({ tone })}>
      {tone === "success" ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// NF: status "pendente" → <StatusBadge tone="danger">Pendente</StatusBadge>
//     status "lançada"  → <StatusBadge tone="success">Lançada</StatusBadge>
```

### `components/money.tsx`

```tsx
import { brl } from "@/lib/format";

export const Money = ({ value, className = "" }: { value: number | null; className?: string }) => (
  <span className={`num ${className}`}>{value == null ? "—" : `R$ ${brl(value)}`}</span>
);
```

### `components/budget-meter.tsx`: o elemento-assinatura do Evento

Ele substitui os 4 cards (Total orçado / Total real / Diferença / NFs em aberto). Recebe exatamente os mesmos números que você já calcula.

```tsx
export function BudgetMeter({ orcado, real, nfsAbertas, nfsVencidas }: {
  orcado: number; real: number; nfsAbertas: number; nfsVencidas: number;
}) {
  const saldo = orcado - real;
  const pct = orcado > 0 ? Math.round((real / orcado) * 100) : 0;
  const over = saldo < 0;
  return (
    <div className="mt-6 grid grid-cols-2 gap-6 rounded-lg border bg-card p-4 shadow-xs lg:grid-cols-[repeat(4,auto)_1fr] lg:gap-8">
      <Kpi label="Orçado" value={`R$ ${brl(orcado)}`} />
      <Kpi label="Real lançado" value={`R$ ${brl(real)}`} />
      <Kpi label="Saldo" value={`R$ ${brl(Math.abs(saldo))}`}
           hint={over ? "acima do orçado" : "abaixo do orçado"}
           tone={over ? "text-danger-text" : "text-success-text"} />
      <Kpi label="NFs em aberto" value={String(nfsAbertas)}
           hint={nfsVencidas ? `${nfsVencidas} com prazo vencido` : undefined}
           tone={nfsAbertas ? "text-danger-text" : undefined} />
      <div className="col-span-2 self-center lg:col-span-1">
        <div role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Orçamento utilizado"
             className="relative h-2 rounded-full bg-muted ring-1 ring-inset ring-border">
          <div className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out ${over ? "bg-danger" : "bg-primary"}`}
               style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground num">
          <span>{pct}% utilizado</span><span>limite</span>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-kpi mt-1 whitespace-nowrap ${tone ?? ""}`}>{value}</div>
      {hint && <div className={`mt-0.5 text-xs ${tone ?? "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}
```

### `components/empty-state.tsx`

```tsx
export function EmptyState({ icon: Icon, title, text, action, tone = "neutral" }: {
  icon: React.ElementType; title: string; text?: string; action?: React.ReactNode;
  tone?: "neutral" | "success" | "danger";
}) {
  const c = { neutral: "text-muted-foreground", success: "text-success", danger: "text-danger" }[tone];
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center">
      <div className={`mb-2 grid size-10 place-items-center rounded-lg border bg-card shadow-xs ${c}`}><Icon className="size-4" /></div>
      <h4 className="text-sm font-semibold">{title}</h4>
      {text && <p className="max-w-[300px] text-[13px] text-muted-foreground">{text}</p>}
      {action && <div className="mt-2.5">{action}</div>}
    </div>
  );
}
```

Para o erro, use o mesmo componente com `tone="danger"`, o ícone `AlertTriangle` e um botão "Tentar de novo" chamando `router.refresh()`. Ele também serve no `error.tsx` de cada rota.

## 4. Regras por tela

**Painel.** O agrupamento passa a vir de `urgency(data)`. Hoje o item de 08/11 aparece em "Esta semana" mesmo já vencido. A ordem é Atrasadas → Esta semana → Próxima semana, tudo numa coluna só (`max-w` ~760px), com a lista de marcas à direita (`xl:grid-cols-[1fr_288px]`). A faixa de resumo no topo tem 4 links âncora para os grupos. Ao concluir um item, o título fica riscado, a linha some em ~200ms depois de 700ms e aparece o toast com "Desfazer".

**Evento.** O cabeçalho fica com eyebrow "Evento · Marca", título `text-display`, data com contagem ("em 5 dias") e progresso das tarefas, seguido do `BudgetMeter`. As ações Editar e Arquivar vão para a topbar, e Excluir vai para o menu "…". Na tabela de orçamento, os inputs ficam com `border-transparent` e a borda só aparece no hover ou no foco (`.cell-in` no HTML). Valores alinhados à direita com `num`. Na coluna de prazo, use `DateChip`. Nas Demandas, a seção ganha uma mini barra de progresso e a contagem `2/5` em mono. A alça de arrastar fica `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`. Subtarefas: `pl-[42px]` com uma linha vertical `before:` em `border`.

**Marca.** A tabela de recorrentes leva o checkbox na 1ª coluna (= NF lançada). Vencimento com `DateChip`, previsto e real alinhados à direita, e um rodapé de totais. Nota desativada: `opacity-60` + `StatusBadge neutral`. Os cards de evento mostram data relativa, barra real/orçado e badges de NF e tarefas. Se tiver NF atrasada, o card ganha `border-danger-border`.

**Marcas.** Uma tabela ordenada por pendências (desc) e depois pelo próximo vencimento.

**Login.** Sem sidebar, então o login segue o tema do sistema (`defaultTheme="system"`). Sai o `border-t-4` azul e o rodapé "Ambiente seguro…". O fundo usa um pontilhado (`bg-[radial-gradient(color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_1px)] bg-[size:20px_20px]`), que funciona nos dois temas. O erro aparece em um alert inline acima dos campos.

## 5. Mobile (<768px)

- Esconda a sidebar (`hidden md:flex`) e coloque uma barra inferior fixa `md:hidden h-16` com Painel, Marcas e Conta. O ícone ativo fica em `text-brand`. "Marcas" leva para a lista `/marcas`.
- Topbar mobile: botão voltar + título + menu "…". O `ThemeToggle` vai para a aba Conta.
- Faixa de resumo: `grid-cols-2`.
- Tabelas de orçamento e recorrentes: em `<md`, renderize a lista empilhada (nome + valor na 1ª linha, fornecedor/orçado + badge na 2ª). A edição abre em um `Sheet` (`side="bottom"`).
- Alvos de toque com no mínimo 40px de altura.

## 6. Checklist de acessibilidade

- [ ] Todos os textos ≥ 4,5:1 nos **dois temas** (já validado nos tokens; os subtle-foreground ficam só para placeholder).
- [ ] Toggle de tema com `aria-pressed` e `aria-label`.
- [ ] Status nunca só por cor: sempre com texto ("há 7 dias", "Pendente") ou ícone.
- [ ] `focus-visible` com anel cobalto em botão, link, input, checkbox, alça de arraste e aba.
- [ ] @dnd-kit: mantenha o `KeyboardSensor` com `sortableKeyboardCoordinates` e coloque `aria-label="Arrastar"` na alça.
- [ ] Botões só de ícone com `aria-label` (lixeira, link, "…", recolher seção).
- [ ] `aria-expanded` no botão de recolher seção; `role="meter"` no medidor de orçamento.
- [ ] Toasts dentro de região `aria-live` (o sonner já faz isso).
- [ ] `prefers-reduced-motion` já está tratado no `globals.css`.

## 7. Como não quebrar nada

- Não renomeie props, ids nem `data-*` que o seu código ou o dnd-kit usam. Mude só o `className`.
- Edite os componentes em `components/ui/*` direto (é o padrão do shadcn), mas rode `git diff` antes de qualquer `npx shadcn add` futuro, porque ele sobrescreve os arquivos.
- O `--accent` do shadcn continua sendo o **fundo de hover**. A cor de destaque nova se chama `brand` para não colidir com ele.
