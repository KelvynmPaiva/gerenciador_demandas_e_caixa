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
app/(app)/page.tsx       Painel (vw_pendencias + bloco "No Radar" com itens sem prazo)
app/(app)/marcas/        lista de marcas; [marcaId]/ = notas recorrentes do mês + No Radar + eventos do mês
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
lib/status.ts            fonte única do texto/tom de status de NFs e despesas: só "Pendente" e "Lançado"
lib/listas.ts            pendentesPrimeiro (concluídos no fim) e temConteudo (colunas Observação/Link)
lib/pendencias.ts        tipos do Painel (TIPOS_DE_PENDENCIA, inclui radar/subitem_radar), endereços, ordem
supabase/migrations/     SQL (aplicado conforme "Acesso ao Supabase")
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
`marcas` → `notas_recorrentes` → `ocorrencias_mensais`; `marcas` → `eventos` → `itens_orcamento` e `secoes` → `tarefas` → `subtarefas`; `marcas` → `itens_radar` → `subitens_radar`; view `vw_pendencias` (security_invoker; tipos `tarefa`, `subtarefa`, `nf`, `recorrente`, `radar`, `subitem_radar`). Schema completo em `supabase/migrations/` (0001 inicial + 0002 despesas manuais + 0003 No Radar + 0004 data de início obrigatória, todas aplicadas).
- **No Radar (desde a 0003):** `itens_radar` espelha `tarefas` mas pendura na marca (sem evento/seção); `subitens_radar` espelha `subtarefas`. Só itens/subitens **com prazo**, pendentes e com `promovido_em` nulo entram na `vw_pendencias`; os sem prazo o Painel busca à parte. `promovido_para_tarefa_id`/`promovido_em` são da segunda etapa (promover para tarefa de evento), ainda sem tela. Quem conta linhas da view filtra por `TIPOS_DE_PENDENCIA` (`lib/pendencias.ts`) para bater com o Painel.
- **Data de início do evento** é obrigatória no app (formulário e action). A 0004 só põe `not null` no banco se nenhum evento estiver sem data: hoje 2 eventos antigos ("Demandas Gerais" e "Campanha de Natal Instituto Eurobike") seguem sem `data_inicio`, então a coluna continua anulável; a tela da marca os mostra no mês de criação. Depois de preencher as datas, rodar a 0004 de novo.
- Migrations novas: `supabase/migrations/NNNN_nome.sql`; depois de aplicar, regenerar `types/database.ts`. Como aplicar: seção "Acesso ao Supabase" abaixo. Sem o arquivo `.env.supabase`, **avisar que precisam ser rodadas à mão** no SQL Editor.
- **Despesas recorrentes (desde a 0002):** `notas_recorrentes` = só o nome (e observação) da despesa, **fonte única do nome** (tela e `vw_pendencias` leem dela). Cada mês é uma linha em `ocorrencias_mensais` criada à mão (`criarOcorrencia`), com data (`vencimento`) livre; `unique (nota_recorrente_id, mes_referencia)` impede duplicar no mês. Não há geração automática. Excluir a nota (`excluirNota`) apaga todos os meses (cascade); `excluirOcorrencia` apaga só um mês e mantém a nota (volta como sugestão). Nome de nota não se repete na marca (`notaComMesmoNome`, sem diferenciar maiúsculas/espaços), na criação e ao renomear.
- Só **valor real** em itens de evento e despesas: não existem mais valor orçado/previsto.
- `ocorrencias_mensais.concluida` é coluna gerada (check **e** valor real) — nunca enviar no update.

## Acesso ao Supabase (migrations e tipos)
Credenciais de administração ficam em `.env.supabase` (raiz, **fora do git**: o `.gitignore` já ignora `.env*`) com `SUPABASE_ACCESS_TOKEN` (token pessoal, começa com `sbp_`) e `SUPABASE_PROJECT_REF` (o trecho antes de `.supabase.co` na URL do projeto). Nunca ler esse arquivo para exibi-lo, nunca imprimir o token, nunca copiá-lo para `.env.local`, código, docs ou commit, e nunca usar `service_role` no app.

Como aplicar uma migration (API de gerenciamento, não precisa de senha do banco nem de `supabase link`):
```bash
set -a; . ./.env.supabase; set +a
curl -sS -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data @<(node -e 'console.log(JSON.stringify({query: require("fs").readFileSync(process.argv[1],"utf8")}))' supabase/migrations/NNNN_nome.sql)
```
Regenerar tipos: `set -a; . ./.env.supabase; set +a; npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" > types/database.ts` (único jeito aceito de alterar `types/database.ts`; conferir o `git diff` depois).

Regras de segurança (o banco é o de produção, sem ambiente de teste):
- **Antes de aplicar**: mostrar o SQL resumido e **pedir confirmação do usuário, a cada migration**. Autorização para uma não vale para a próxima.
- Migration só aditiva por padrão (criar tabela/coluna/índice/policy, de preferência idempotente com `if not exists`). `drop`, `truncate`, `delete` sem `where` ou `alter ... type` que perca dado exigem pedido explícito do usuário naquela tarefa.
- Toda tabela nova precisa de RLS ligada e da policy `autenticados_acesso_total`, igual à 0001.
- Depois de aplicar: conferir que as tabelas/colunas existem (consulta de leitura), regenerar os tipos, rodar `npm run typecheck`, e registrar no `docs/CHANGELOG.md`. Se a chamada falhar, parar e relatar o erro; não tentar contornar com outras credenciais.
- Sem `.env.supabase`, não tentar acessar o banco: avisar que a migration precisa ser rodada à mão.

## Decisões importantes
- **RLS aberta a qualquer usuário autenticado** (equipe de 2 pessoas, tudo compartilhado) → o cadastro público deve ficar **desligado** no Supabase; é a única barreira.
- **Datas como texto `AAAA-MM-DD` em `America/Sao_Paulo`**: evita bugs de fuso entre servidor (Vercel/UTC) e usuário.
- **Auth em duas camadas** (`proxy.ts` + layout `(app)`) e `createClientAutenticado()` em toda action: defesa em profundidade.
- **Helpers de actions centralizados em `lib/acoes.ts`** e consultas deduplicadas com `React.cache` (commits `6f54ee6`, `aa11830`) para evitar duplicação e cascatas.
- **Testes só em `lib/`** (lógica pura, sem rede); telas e actions não têm teste automatizado.
- **Migrations aplicadas pelo Claude, com confirmação** (ver "Acesso ao Supabase"). O app em si continua só com a chave pública; o acesso de administração vive fora do app e fora do git.

## Pendências conhecidas
- Sem testes de Server Actions nem E2E; só `lib/` é coberto.
- Não há histórico de migrations no banco (0001 e 0002 foram rodadas à mão; 0003 e 0004, em 16/11/2026, também fora do CLI): por isso não usar `supabase db push`, que tentaria rodar tudo de novo. Risco de o banco divergir de `supabase/migrations/` e de `types/database.ts`.
- Qualquer usuário autenticado vê e edita tudo (sem papéis/permissões por marca).
- `npm test` falha com `Cannot read properties of undefined (reading 'config')` quando rodado no Git Bash da ferramenta Bash do Claude Code, mas passa (9 arquivos, 50 testes em 16/11/2026) no PowerShell. Rode os testes pelo PowerShell; causa no Bash ainda não identificada (não é `NODE_OPTIONS`).
- 2 eventos antigos sem `data_inicio` (ver Banco de dados): preencher pela tela e rodar a 0004 de novo.
- No Radar: promoção de item para tarefa de evento ainda não existe (segunda etapa).

## Regra permanente de documentação
Ao terminar qualquer funcionalidade ou mudança relevante, **antes de dizer que terminou**:
1. Atualize `docs/CHANGELOG.md` (data, o que foi feito, arquivos alterados).
2. Atualize este `CLAUDE.md` se algo estrutural mudou (pastas, stack, comandos, convenções, tabelas, decisões, pendências — inclusive removendo pendências resolvidas).
Mantenha o CLAUDE.md enxuto: detalhes longos vão para `docs/` e aqui fica só o ponteiro.
