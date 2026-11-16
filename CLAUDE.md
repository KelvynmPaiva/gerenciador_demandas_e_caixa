@AGENTS.md

# Gerenciador de tarefas — guia para a IA

## Visão geral
App web privado para 2 pessoas da equipe de marketing: **Marcas** → **Notas recorrentes** (despesas mensais, cadastradas à mão mês a mês) e **Eventos** (Orçamento/NFs + Demandas: seções › tarefas › subtarefas), com **Painel** de pendências (atrasadas / esta semana / próxima semana). Interface e mensagens em **português do Brasil**; identificadores de domínio também em português (`marcas`, `eventos`, `tarefas`, `ocorrencias_mensais`...). Documentação funcional e design: `spec/`.

## Stack e comandos
- Next.js **16.4.5** (App Router, Turbopack, `proxy.ts` no lugar de `middleware.ts`), React 19, TypeScript estrito.
- Supabase (Postgres + Auth) via `@supabase/ssr`; só e-mail/senha, **sem cadastro** (2 usuários criados à mão).
- Tailwind 4 + shadcn/ui (`components/ui`, pacote `radix-ui`) + `lucide-react`, `sonner`, `@dnd-kit`, `react-day-picker`. Vitest para testes. Deploy: Vercel.
- **Antes de mexer em cache, `revalidate`, `proxy`, rotas ou APIs do Next, leia `node_modules/next/dist/docs/`** (esta versão tem mudanças que não estão no seu treinamento).

| Comando | Para quê |
|---|---|
| `npm run dev` | servidor local (http://localhost:3000) |
| `npm run build` / `npm start` | build e execução de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (só `lib/**/*.test.ts`, sem rede) |

Antes de dar uma tarefa como pronta: `npm run typecheck && npm run lint && npm test` (e `npm run build` se mexeu em rotas/config).
Env: `.env.local` (fora do git; modelo em `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nunca commitar chaves nem usar `service_role` no app.
Deploy: Vercel, a partir do repositório; as migrations do banco são aplicadas à mão (ver Banco de dados).

## Estrutura de pastas
```
proxy.ts                 sessão + redireciona para /login (matcher exclui estáticos)
app/login/               login (Server Action) — fora do grupo (app)
app/(app)/layout.tsx     menu lateral + 2ª barreira de auth
app/(app)/page.tsx       Painel (vw_pendencias)
app/(app)/marcas/        lista de marcas; [marcaId]/ = notas recorrentes do mês + eventos
app/(app)/eventos/[eventoId]/  abas ?aba=orcamento|demandas
  actions*.ts            Server Actions ("use server") ao lado da tela que as usa
components/              compartilhados (DateChip, StatusBadge, ResumoEvento, EmptyState, ThemeToggle, NavegacaoMobile...); ui/ = shadcn já customizado pela repaginação (rode `git diff` antes de qualquer `npx shadcn add`)
lib/                     lógica pura e utilitários (datas, formato, links, pendencias...)
lib/__tests__/           testes Vitest da lib/
lib/supabase/server.ts   createClient (1 por requisição, React.cache), obterClaims, createClientAutenticado
lib/marcas.ts            listarMarcasAtivas (cache por requisição)
lib/acoes.ts             helpers das actions: atualizarTelas, valorValido, ehUuid, listaDeIds
lib/despesas.ts          despesas recorrentes: sugestões do mês, nome repetido, ordem da tabela
lib/eventos.ts           resumo dos cartões de evento (total real, NFs e tarefas pendentes)
supabase/migrations/     SQL (rodado à mão no SQL Editor do Supabase)
types/database.ts        tipos GERADOS do Supabase — não editar à mão; regenerar se o schema mudar
spec/                    documentação funcional e design (DESIGN.md)
docs/CHANGELOG.md        histórico de funcionalidades e mudanças
```

## Convenções
- **Páginas são Server Components** e buscam dados com `createClient()` (`lib/supabase/server`). `Promise.all` para consultas independentes; evite cascatas. Dados compartilhados por layout+página → `React.cache`.
- **Client Components só quando há interatividade** (`"use client"`); recebem dados já mapeados (camelCase) por props. Mapeamento snake_case → camelCase acontece na página.
- **Gravações = Server Actions** em `actions*.ts`: 1) validar entrada (tamanho, UUID, datas com `dataValida`, links com `lerLink`, valores com `valorValido`); 2) `createClientAutenticado()` (recusa sem sessão); 3) `console.error` técnico + mensagem em português para a pessoa; 4) `atualizarTelas()` de `lib/acoes.ts` ao final; 5) retornar `Resultado` (`{ erro: string | null }`), nunca lançar para o cliente. Arquivos `"use server"` só exportam funções `async`.
- **Datas** são texto `AAAA-MM-DD`, "hoje" sempre em `America/Sao_Paulo` (`lib/datas.ts`); semana = segunda a domingo. Não usar `new Date()` direto para regras de negócio.
- **Links externos** só `http/https` (`lib/links.ts`); renderizar com `linkSeguro`.
- Dinheiro: `numeric(12,2)`; formatar com `lib/formato.ts` (`formatarMoeda`, `lerValor`).
- Estilo: componentes shadcn + tokens do Tailwind/`app/globals.css` (tema claro **e** escuro via `next-themes`); classes com `cn()`. **Nunca** cor fixa (`bg-white`, hex, `text-blue-*`) nem `dark:` para corrigir cor: use tokens (`bg-card`, `text-muted-foreground`, `bg-brand`, `text-danger-text`...) e ajuste o token se algo ficar errado no escuro. Prazo = `DateChip`, status = `StatusBadge`. Referência visual e guia: `docs/redesign/`. Comentários em português, explicando o "porquê".
- Lógica nova e pura vai em `lib/` com teste em `lib/__tests__/`.
- Mudanças pequenas e incrementais; não reescrever o que funciona; verificar no código/docs em vez de supor.
- Não alterar `types/database.ts` nem `components/ui/*` sem necessidade.
- Não commitar sem pedido. Commits em português, `tipo(escopo): resumo`.

## Banco de dados
`marcas` → `notas_recorrentes` → `ocorrencias_mensais`; `marcas` → `eventos` → `itens_orcamento` e `secoes` → `tarefas` → `subtarefas`; view `vw_pendencias` (security_invoker). Schema completo em `supabase/migrations/` (0001 inicial + 0002 despesas manuais).
- Migrations novas: `supabase/migrations/NNNN_nome.sql`, e **avisar que precisam ser rodadas no Supabase**; depois regenerar `types/database.ts`.
- **Despesas recorrentes (desde a 0002):** `notas_recorrentes` = só o nome (e observação) da despesa, **fonte única do nome** (tela e `vw_pendencias` leem dela). Cada mês é uma linha em `ocorrencias_mensais` criada à mão (`criarOcorrencia`), com data (`vencimento`) livre; `unique (nota_recorrente_id, mes_referencia)` impede duplicar no mês. Não há geração automática. Excluir a nota (`excluirNota`) apaga todos os meses (cascade); `excluirOcorrencia` apaga só um mês e mantém a nota (volta como sugestão). Nome de nota não se repete na marca (`notaComMesmoNome`, sem diferenciar maiúsculas/espaços), na criação e ao renomear.
- Só **valor real** em itens de evento e despesas: não existem mais valor orçado/previsto.
- `ocorrencias_mensais.concluida` é coluna gerada (check **e** valor real) — nunca enviar no update.

## Decisões importantes
- **RLS aberta a qualquer usuário autenticado** (equipe de 2 pessoas, tudo compartilhado) → o cadastro público deve ficar **desligado** no Supabase; é a única barreira.
- **Datas como texto `AAAA-MM-DD` em `America/Sao_Paulo`**: evita bugs de fuso entre servidor (Vercel/UTC) e usuário.
- **Auth em duas camadas** (`proxy.ts` + layout `(app)`) e `createClientAutenticado()` em toda action: defesa em profundidade.
- **Helpers de actions centralizados em `lib/acoes.ts`** e consultas deduplicadas com `React.cache` (commits `6f54ee6`, `aa11830`) para evitar duplicação e cascatas.
- **Testes só em `lib/`** (lógica pura, sem rede); telas e actions não têm teste automatizado.
- **Migrations manuais** no SQL Editor do Supabase, sem CLI/CI de banco.

## Pendências conhecidas
- Sem testes de Server Actions nem E2E; só `lib/` é coberto.
- Migrations não têm automação: risco de o banco divergir de `supabase/migrations/` e de `types/database.ts`.
- Qualquer usuário autenticado vê e edita tudo (sem papéis/permissões por marca).
- `npm test` falha neste ambiente com `Cannot read properties of undefined (reading 'config')` (também na `main`, mesmo após `npm ci`); investigar a instalação do vitest 5.1.

## Regra permanente de documentação
Ao terminar qualquer funcionalidade ou mudança relevante, **antes de dizer que terminou**:
1. Atualize `docs/CHANGELOG.md` (data, o que foi feito, arquivos alterados).
2. Atualize este `CLAUDE.md` se algo estrutural mudou (pastas, stack, comandos, convenções, tabelas, decisões, pendências — inclusive removendo pendências resolvidas).
Mantenha o CLAUDE.md enxuto: detalhes longos vão para `docs/` e aqui fica só o ponteiro.
