@AGENTS.md

# Gerenciador de tarefas — guia para a IA

App web privado para 2 pessoas da equipe de marketing: **Marcas** → **Notas recorrentes** (despesas mensais) e **Eventos** (Orçamento/NFs + Demandas: seções › tarefas › subtarefas), com **Painel** de pendências (atrasadas / esta semana / próxima semana). Interface e mensagens em **português do Brasil**; identificadores de domínio também em português (`marcas`, `eventos`, `tarefas`, `ocorrencias_mensais`...).

## Stack
- Next.js **16.4.5** (App Router, Turbopack, `proxy.ts` no lugar de `middleware.ts`), React 19, TypeScript estrito.
- Supabase (Postgres + Auth) via `@supabase/ssr`; só e-mail/senha, **sem cadastro** (2 usuários criados à mão).
- Tailwind 4 (`@tailwindcss/turbopack`, regra em `next.config.ts`) + shadcn/ui (`components/ui`, pacote `radix-ui`, `cn`) + `lucide-react`, `sonner` (toasts), `@dnd-kit` (arrastar/reordenar), `react-day-picker`.
- Vitest para testes unitários. Deploy: Vercel.
- **Antes de mexer em cache, `revalidate`, `proxy`, rotas ou APIs do Next, leia `node_modules/next/dist/docs/`** (esta versão tem mudanças que não estão no seu treinamento).

## Comandos
| Comando | Para quê |
|---|---|
| `npm run dev` | servidor local (http://localhost:3000) |
| `npm run build` / `npm start` | build e execução de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (só `lib/**/*.test.ts`, sem rede) |

Antes de dar uma tarefa como pronta: `npm run typecheck && npm run lint && npm test` (e `npm run build` se mexeu em rotas/config).

## Variáveis de ambiente
`.env.local` (fora do git; modelo em `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nunca commitar chaves nem usar `service_role` no app.

## Arquitetura
```
proxy.ts                 sessão + redireciona para /login (matcher exclui estáticos)
app/login/               login (Server Action) — fora do grupo (app)
app/(app)/layout.tsx     menu lateral + 2ª barreira de auth
app/(app)/page.tsx       Painel (vw_pendencias)
app/(app)/marcas/        lista de marcas; [marcaId]/ = notas recorrentes do mês + eventos
app/(app)/eventos/[eventoId]/  abas ?aba=orcamento|demandas
  actions*.ts            Server Actions ("use server") ao lado da tela que as usa
components/              componentes compartilhados; ui/ = shadcn (gerado, evitar editar à mão)
lib/                     lógica pura e utilitários (datas, formato, links, pendencias...)
lib/supabase/server.ts   createClient (1 por requisição, React.cache), obterClaims, createClientAutenticado
lib/marcas.ts            listarMarcasAtivas (cache por requisição)
lib/acoes.ts             helpers das actions: atualizarTelas, valorValido, ehUuid, listaDeIds
supabase/migrations/     SQL (rodado à mão no SQL Editor do Supabase)
types/database.ts        tipos GERADOS do Supabase — não editar à mão; regenerar se o schema mudar
spec/                    documentação funcional e design (DESIGN.md)
```
Banco: `marcas` → `notas_recorrentes` → `ocorrencias_mensais` (geradas por `gerar_ocorrencias(p_mes)`, idempotente); `marcas` → `eventos` → `itens_orcamento` e `secoes` → `tarefas` → `subtarefas`; view `vw_pendencias` (security_invoker). RLS: qualquer usuário autenticado acessa tudo (por isso o cadastro público deve ficar **desligado** no Supabase).

## Padrões de código
- **Páginas são Server Components** e buscam dados com `createClient()` (`lib/supabase/server`). Use `Promise.all` para consultas independentes; evite cascatas (`await` em sequência sem dependência). Dados compartilhados por layout+página → `React.cache`.
- **Client Components só quando há interatividade** (`"use client"`); recebem dados já mapeados (camelCase) por props. Mapeamento snake_case → camelCase acontece na página.
- **Gravações = Server Actions** em `actions*.ts`: 1) validar entrada (tamanho, UUID, datas com `dataValida`, links com `lerLink`, valores com `valorValido`); 2) `createClientAutenticado()` (recusa sem sessão); 3) `console.error` técnico + mensagem em português para a pessoa; 4) `atualizarTelas()` de `lib/acoes.ts` ao final; 5) retornar `Resultado` (`{ erro: string | null }`), nunca lançar para o cliente. Arquivos `"use server"` só podem exportar funções `async`.
- **Datas** são texto `AAAA-MM-DD`, "hoje" sempre em `America/Sao_Paulo` (`lib/datas.ts`); semana = segunda a domingo. Não usar `new Date()` direto para regras de negócio.
- **Links externos** só `http/https` (`lib/links.ts`); renderizar com `linkSeguro`.
- Dinheiro: `numeric(12,2)`; formatar com `lib/formato.ts` (`formatarMoeda`, `lerValor`).
- `ocorrencias_mensais.concluida` é coluna gerada (check **e** valor real) — nunca enviar no update.
- Estilo: componentes shadcn + tokens do Tailwind/`app/globals.css` (só tema claro); classes com `cn()`. Comentários em português, explicando o "porquê".
- Lógica nova e pura vai em `lib/` com teste em `lib/__tests__/`.

## Regras de trabalho
- Mudanças pequenas e incrementais; não reescrever o que funciona. Não decidir por suposição: verificar no código/docs.
- Não alterar `types/database.ts` nem `components/ui/*` sem necessidade; migrations novas em `supabase/migrations/NNNN_nome.sql` (e avisar que precisam ser rodadas no Supabase).
- Não commitar sem pedido. Mensagens de commit em português, no estilo `tipo(escopo): resumo`.
