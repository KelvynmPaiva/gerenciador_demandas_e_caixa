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
set search_path = public
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
