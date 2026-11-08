Você é um desenvolvedor sênior. Implemente o sistema "Gerenciador de tarefas" do zero.
Stack: Next.js (versão estável mais recente, App Router, TypeScript) + Tailwind + shadcn/ui + Supabase. Deploy na Vercel.
Quem vai manter o projeto não é sênior: escreva código simples, legível, sem abstrações desnecessárias e com comentários curtos em português nos pontos de regra de negócio.

## Sistema
App web para desktop que reúne, num só lugar, o acompanhamento de marcas, eventos/ações, orçamento, NFs a lançar, despesas recorrentes mensais e tarefas. Duas pessoas de uma equipe de marketing usam o app, com as mesmas permissões. O painel inicial mostra o que está atrasado, o que vence nesta semana e o que vence na próxima, para que o usuário saiba o que fazer sem abrir WhatsApp, e-mail ou planilhas.

Navegação: Painel → Marcas → Marca (notas recorrentes do mês + eventos) → Evento (abas Orçamento e Demandas).

Fora do escopo da v1: perfis/permissões diferentes, fluxo de aprovação, upload de anexos (só links), notificações, integrações, relatórios, layout mobile.

## Estrutura de pastas
```
/app
  /login/page.tsx
  /(app)/layout.tsx              -- menu lateral + breadcrumb, exige sessão
  /(app)/page.tsx                -- Painel inicial
  /(app)/marcas/page.tsx
  /(app)/marcas/[marcaId]/page.tsx
  /(app)/eventos/[eventoId]/page.tsx   -- ?aba=orcamento | demandas
/components                      -- componentes de UI (shadcn em /components/ui)
/lib
  /supabase/client.ts            -- cliente browser (@supabase/ssr)
  /supabase/server.ts            -- cliente server (@supabase/ssr)
  /datas.ts                      -- hoje em America/Sao_Paulo, semana seg–dom, classificação do painel
  /formato.ts                    -- moeda BRL e datas dd/mm/aaaa
/types/database.ts               -- tipos gerados do Supabase
/supabase/migrations/0001_inicial.sql
middleware.ts                    -- renova sessão e redireciona para /login
.env.example                     -- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Banco de Dados (Supabase)
Crie exatamente este arquivo em `supabase/migrations/0001_inicial.sql`:

```sql
-- =========================================================
-- Gerenciador de tarefas — schema inicial (Supabase / PostgreSQL)
-- Arquivo sugerido: supabase/migrations/0001_inicial.sql
-- =========================================================

-- ---------- MARCAS ----------
create table marcas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  ordem       int  not null default 0,
  ativa       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- ---------- NOTAS RECORRENTES (cadastro-mãe) ----------
create table notas_recorrentes (
  id              uuid primary key default gen_random_uuid(),
  marca_id        uuid not null references marcas(id) on delete cascade,
  nome            text not null,                       -- ex.: "Café de sábado", "Gráfica"
  valor_previsto  numeric(12,2),                       -- valor padrão copiado para cada mês
  dia_vencimento  smallint not null check (dia_vencimento between 1 and 31),
  ativa           boolean not null default true,       -- desativada = para de gerar meses futuros
  observacao      text,
  criado_em       timestamptz not null default now()
);

-- ---------- OCORRÊNCIAS MENSAIS ----------
create table ocorrencias_mensais (
  id                  uuid primary key default gen_random_uuid(),
  nota_recorrente_id  uuid not null references notas_recorrentes(id) on delete cascade,
  mes_referencia      date not null check (extract(day from mes_referencia) = 1), -- sempre dia 1 do mês
  nome                text not null,                   -- copiado da nota no momento da geração
  vencimento          date not null,
  valor_previsto      numeric(12,2),
  valor_real          numeric(12,2),
  check_marcado       boolean not null default false,
  -- regra de negócio: só está concluída com check E valor real preenchido
  concluida           boolean generated always as (check_marcado and valor_real is not null) stored,
  observacao          text,
  criado_em           timestamptz not null default now(),
  unique (nota_recorrente_id, mes_referencia)
);

-- ---------- EVENTOS / AÇÕES ----------
create table eventos (
  id            uuid primary key default gen_random_uuid(),
  marca_id      uuid not null references marcas(id) on delete cascade,
  nome          text not null,
  tipo          text not null default 'evento' check (tipo in ('evento','acao')),
  data_inicio   date,
  data_fim      date,
  link_externo  text,
  observacao    text,
  arquivado     boolean not null default false,
  criado_em     timestamptz not null default now()
);

-- ---------- ITENS DE ORÇAMENTO (despesas / NFs) ----------
create table itens_orcamento (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null references eventos(id) on delete cascade,
  servico       text not null,
  fornecedor    text,
  valor_orcado  numeric(12,2),
  valor_real    numeric(12,2),
  status_nf     text not null default 'pendente' check (status_nf in ('pendente','lancada')),
  prazo_nf      date,                                  -- prazo para lançar a NF
  link_externo  text,
  observacao    text,
  ordem         int not null default 0,
  criado_em     timestamptz not null default now()
);

-- ---------- DEMANDAS: SEÇÕES, TAREFAS, SUBTAREFAS ----------
create table secoes (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references eventos(id) on delete cascade,
  nome        text not null,
  ordem       int not null default 0,
  criado_em   timestamptz not null default now()
);

create table tarefas (
  id            uuid primary key default gen_random_uuid(),
  secao_id      uuid not null references secoes(id) on delete cascade,
  descricao     text not null,
  prazo         date,
  concluida     boolean not null default false,
  concluida_em  timestamptz,
  observacao    text,
  link_externo  text,
  ordem         int not null default 0,
  criado_em     timestamptz not null default now()
);

create table subtarefas (
  id            uuid primary key default gen_random_uuid(),
  tarefa_id     uuid not null references tarefas(id) on delete cascade,
  descricao     text not null,
  prazo         date,
  concluida     boolean not null default false,
  concluida_em  timestamptz,
  observacao    text,
  ordem         int not null default 0,
  criado_em     timestamptz not null default now()
);

-- ---------- ÍNDICES ----------
create index on notas_recorrentes (marca_id);
create index on ocorrencias_mensais (vencimento) where not concluida;
create index on eventos (marca_id);
create index on itens_orcamento (evento_id);
create index on itens_orcamento (prazo_nf) where status_nf = 'pendente';
create index on secoes (evento_id);
create index on tarefas (secao_id);
create index on tarefas (prazo) where not concluida;
create index on subtarefas (tarefa_id);
create index on subtarefas (prazo) where not concluida;

-- ---------- FUNÇÃO: gerar ocorrências de um mês (idempotente) ----------
-- Chamada ao abrir o painel para o mês atual e o próximo,
-- e ao criar uma nota recorrente nova (mês atual).
-- Dia de vencimento maior que o último dia do mês vira o último dia (ex.: 31 → 28/02).
create or replace function gerar_ocorrencias(p_mes date)
returns void
language sql
as $$
  insert into ocorrencias_mensais (nota_recorrente_id, mes_referencia, nome, vencimento, valor_previsto)
  select
    n.id,
    date_trunc('month', p_mes)::date,
    n.nome,
    least(
      date_trunc('month', p_mes)::date + (n.dia_vencimento - 1),
      (date_trunc('month', p_mes) + interval '1 month - 1 day')::date
    ),
    n.valor_previsto
  from notas_recorrentes n
  where n.ativa
    and date_trunc('month', n.criado_em at time zone 'America/Sao_Paulo') <= date_trunc('month', p_mes)
  on conflict (nota_recorrente_id, mes_referencia) do nothing;
$$;

-- ---------- VIEW: pendências do painel ----------
-- O app filtra por data e classifica em Atrasadas / Esta semana / Próxima semana.
create or replace view vw_pendencias with (security_invoker = true) as
  -- tarefas
  select 'tarefa'::text as tipo, t.id, t.descricao as titulo, s.nome as detalhe,
         t.prazo as data, m.id as marca_id, m.nome as marca_nome,
         e.id as evento_id, e.nome as evento_nome, false as falta_valor_real
  from tarefas t
  join secoes  s on s.id = t.secao_id
  join eventos e on e.id = s.evento_id
  join marcas  m on m.id = e.marca_id
  where not t.concluida and t.prazo is not null
union all
  -- subtarefas (só se a tarefa principal não estiver concluída)
  select 'subtarefa', st.id, st.descricao, t.descricao,
         st.prazo, m.id, m.nome, e.id, e.nome, false
  from subtarefas st
  join tarefas t on t.id = st.tarefa_id
  join secoes  s on s.id = t.secao_id
  join eventos e on e.id = s.evento_id
  join marcas  m on m.id = e.marca_id
  where not st.concluida and not t.concluida and st.prazo is not null
union all
  -- NFs com lançamento pendente
  select 'nf', i.id, i.servico, i.fornecedor,
         i.prazo_nf, m.id, m.nome, e.id, e.nome, false
  from itens_orcamento i
  join eventos e on e.id = i.evento_id
  join marcas  m on m.id = e.marca_id
  where i.status_nf = 'pendente' and i.prazo_nf is not null
union all
  -- ocorrências mensais não concluídas
  select 'recorrente', o.id, o.nome, to_char(o.mes_referencia, 'MM/YYYY'),
         o.vencimento, m.id, m.nome, null::uuid, null::text, (o.valor_real is null)
  from ocorrencias_mensais o
  join notas_recorrentes n on n.id = o.nota_recorrente_id
  join marcas m on m.id = n.marca_id
  where not o.concluida;

-- ---------- RLS: usuário logado acessa tudo (2 usuários, mesmas permissões) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'marcas','notas_recorrentes','ocorrencias_mensais','eventos',
    'itens_orcamento','secoes','tarefas','subtarefas'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "autenticados_acesso_total" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

grant execute on function gerar_ocorrencias(date) to authenticated;

-- ---------- DADOS INICIAIS ----------
insert into marcas (nome, ordem) values
  ('BMW', 1), ('MINI', 2), ('BMW MOTORRAD', 3), ('PORSCHE', 4), ('ZEEKR/PARTAGE', 5);
```

## Requisitos Funcionais
**Módulo: Acesso**
1. O sistema deve ter login com e-mail e senha (Supabase Auth), sem cadastro público. Os 2 usuários são criados manualmente no painel do Supabase.
2. Todas as telas, exceto /login, devem exigir login. Sem sessão, redirecionar para /login.
3. Os dois usuários devem ter as mesmas permissões: ver, criar, editar e excluir tudo.
4. O sistema deve ter a opção "Sair" no menu.

**Módulo: Painel inicial**
5. O painel deve exibir três blocos: Atrasadas, Esta semana e Próxima semana, cada um com contador de itens.
6. Atrasada = data anterior a hoje e item não concluído.
7. Esta semana = de hoje até o domingo da semana atual (semanas de segunda a domingo). Próxima semana = segunda a domingo seguintes.
8. As datas devem ser calculadas no fuso America/Sao_Paulo.
9. Devem entrar no painel: tarefas com prazo, subtarefas com prazo (se a tarefa principal não estiver concluída), NFs com lançamento pendente e prazo definido, e ocorrências mensais não concluídas. Itens sem data ou com data depois da próxima semana não aparecem.
10. Cada item deve mostrar: tipo (etiqueta: Tarefa, Subtarefa, NF, Recorrente), descrição, data, marca e evento (quando houver) e um check.
11. Dentro de cada bloco, os itens devem ser ordenados por data crescente.
12. O check no painel deve: concluir a tarefa/subtarefa; mudar a NF para "Lançada"; marcar o check da ocorrência mensal.
13. Item concluído deve sumir do painel na hora, sem recarregar a página.
14. Ocorrência com check marcado mas sem valor real deve continuar no painel com o aviso "Falta valor real" e um campo para preencher o valor ali mesmo.
15. Clicar em um item deve abrir o evento na aba correspondente (Orçamento ou Demandas) ou a marca, no caso das recorrentes.
16. Cada bloco deve ter um estado vazio amigável (ex.: "Nada atrasado 🎉").
17. Abaixo dos blocos deve haver acesso à área Marcas (também disponível no menu lateral).
18. Ao abrir o painel, o sistema deve gerar as ocorrências do mês atual e do próximo mês (função gerar_ocorrencias, sem duplicar).

**Módulo: Marcas**
19. O sistema deve listar as marcas ativas com nº de eventos e nº de pendências.
20. O usuário deve poder criar, renomear, reordenar e desativar marcas. Uma marca desativada some da lista sem apagar o histórico.
21. O banco deve iniciar com as marcas BMW, MINI, BMW MOTORRAD, PORSCHE e ZEEKR/PARTAGE.

**Módulo: Notas recorrentes**
22. Na tela da marca, o usuário deve poder cadastrar notas recorrentes com nome, valor previsto, dia de vencimento (1–31) e observação.
23. O usuário deve poder editar e desativar uma nota recorrente. Desativada, ela para de gerar meses futuros e mantém o histórico.
24. Cada nota recorrente ativa deve gerar uma ocorrência por mês, copiando nome, valor previsto e vencimento.
25. Se o dia de vencimento não existir no mês (ex.: 31 em fevereiro), usar o último dia do mês.
26. Ao criar uma nota recorrente, a ocorrência do mês atual deve ser gerada na hora.
27. A tela da marca deve listar as ocorrências do mês selecionado (seletor de mês) com: nome, vencimento, valor previsto, valor real (editável na linha), check, observação e status (Pendente / Falta valor real / Concluída).
28. Uma ocorrência só é concluída com check marcado E valor real preenchido. Preencher só o valor real não conclui.
29. Editar o valor previsto de uma ocorrência não altera a nota-mãe nem os outros meses.

**Módulo: Eventos e ações**
30. Na tela da marca, o usuário deve poder criar eventos/ações com nome, tipo (Evento ou Ação), datas (opcionais), link externo e observação.
31. O usuário deve poder editar, arquivar e excluir eventos (exclusão pede confirmação).
32. Os eventos devem aparecer como cards/pastas com nome, data, total orçado, nº de NFs pendentes e nº de tarefas pendentes. Arquivados ficam num filtro separado.
33. A página do evento deve ter duas abas, Orçamento e Demandas, com a aba ativa refletida na URL.

**Módulo: Orçamento**
34. A aba Orçamento deve exibir uma tabela com: serviço, fornecedor, valor orçado, valor real, status da NF, prazo para lançar a NF e observação/link.
35. O usuário deve poder adicionar, editar na própria linha e excluir itens.
36. O status da NF deve ter só duas opções: "Lançamento pendente" (indicador vermelho) e "Lançada" (indicador verde), alternáveis com um clique.
37. A tabela deve exibir os totais do evento: soma orçada, soma real e diferença (real − orçado).
38. Valores devem ser exibidos em R$ no formato brasileiro (1.234,56) e datas em dd/mm/aaaa.

**Módulo: Demandas**
39. O usuário deve poder criar, renomear, excluir e reordenar seções (arrastar e soltar).
40. O usuário deve poder criar tarefas dentro de uma seção com descrição, prazo, observação e link.
41. O usuário deve poder reordenar tarefas e movê-las entre seções arrastando.
42. O usuário deve poder criar, editar, reordenar e concluir subtarefas dentro de uma tarefa, com descrição, prazo, check e observação.
43. Tarefas e subtarefas concluídas ficam riscadas na lista, com opção "ocultar concluídas".
44. Quando todas as subtarefas estiverem concluídas, a tarefa deve exibir um sinal ("Todas as subtarefas concluídas"). Não há conclusão automática nem bloqueio.
45. Marca e evento das tarefas vêm do contexto, sem o usuário precisar preencher.
46. Clicar numa tarefa deve abrir um painel lateral de detalhes para editar campos e subtarefas.

**Geral**
47. Valores previstos e reais (ocorrências e orçamento) devem ficar armazenados para o relatório previsto × real da v2.
48. A interface deve ser pensada para computador (a partir de 1280 px de largura). Sem layout mobile na v1.
49. Sem upload de anexos: apenas campos de link externo.
50. Sem notificações externas: os avisos aparecem só no painel inicial.

## Configuração Supabase
- Auth: só e-mail + senha. Desativar "Allow new users to sign up". Os 2 usuários são criados em Authentication → Users.
- RLS: ativado em todas as tabelas. Usuário autenticado acessa todos os dados (já está na migration).
- Sem Edge Functions. Mutações via Server Actions do Next.js usando o cliente server do Supabase.
- Gerar tipos com `supabase gen types typescript` em `/types/database.ts`.

## Regras de implementação
- Painel: ler `vw_pendencias` com `data <= domingo da próxima semana` e classificar no app com `/lib/datas.ts` (fuso America/Sao_Paulo, semana de segunda a domingo). Antes de ler, chamar `rpc('gerar_ocorrencias', { p_mes })` para o mês atual e o próximo.
- Checks com atualização otimista: o item some da lista na hora e volta se der erro.
- Arrastar e soltar (seções, tarefas entre seções, subtarefas) com `@dnd-kit`. Salvar o campo `ordem` como inteiros sequenciais.
- Edição inline nas tabelas (orçamento e ocorrências): salvar ao sair do campo (blur) ou com Enter.
- Componentes shadcn/ui: Button, Input, Checkbox, Table, Tabs, Dialog, Sheet (painel lateral da tarefa), Badge, DropdownMenu, Select, Calendar/DatePicker, Toast.
- Interface em português do Brasil. Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Visual fiel ao protótipo do Google Stitch, com o design system: primária #2F5BEA, fundo #F6F7F9, cards #FFFFFF, borda #E5E7EB, texto #111827 / #6B7280, vermelho #DC2626, verde #16A34A, âmbar #D97706, fonte Inter, cantos 10px, sombras suaves. Se eu colar telas ou código do Stitch, siga o layout delas.

## Ordem de trabalho
Implemente por fases. No fim de cada fase, pare e me diga em até 5 linhas o que testar e como.
1. Setup: projeto Next.js + Tailwind + shadcn/ui, clientes Supabase, middleware, tela de login, layout com menu lateral, `.env.example` e a migration.
2. Marcas e notas recorrentes (tela Marcas e tela Marca com ocorrências do mês).
3. Eventos e aba Orçamento (com totais e status da NF).
4. Aba Demandas (seções, tarefas, subtarefas, arrastar e soltar, painel lateral).
5. Painel inicial (três blocos, checks, aviso "Falta valor real").
6. README em português com o passo a passo para: criar o projeto no Supabase, rodar a migration, criar os 2 usuários, rodar localmente e publicar na Vercel com as variáveis de ambiente.

Comece pela fase 1: crie o projeto Next.js, instale as dependências e configure o cliente Supabase.
