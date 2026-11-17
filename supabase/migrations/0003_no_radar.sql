-- =========================================================
-- 0003 — No Radar (demandas de cada marca que ainda não viraram tarefa nem evento)
-- Aplicar conforme "Acesso ao Supabase" no CLAUDE.md, depois da 0002.
--
-- O que muda (só adições; pode rodar mais de uma vez sem erro):
-- - itens_radar: espelho de "tarefas", mas pendurado direto na marca (sem evento/seção).
--   Prazo opcional. Ganha promovido_para_tarefa_id e promovido_em para a segunda etapa
--   (promover o item para tarefa de um evento), que ainda não existe no app.
-- - subitens_radar: espelho de "subtarefas" (sem link, igual às subtarefas).
-- - RLS ligada + policy "autenticados_acesso_total", igual às tabelas da 0001.
-- - vw_pendencias passa a incluir itens e subitens do Radar COM prazo
--   (tipos 'radar' e 'subitem_radar'). As colunas da view continuam as mesmas
--   (nome, tipo e ordem), então o "create or replace" mantém as permissões, e as
--   linhas que já existiam (tarefa, subtarefa, nf, recorrente) não mudam.
--
-- Efeito nos números: os contadores que leem vw_pendencias (painel, lista de marcas,
-- cabeçalho da marca) passam a contar itens do Radar com prazo. Enquanto não houver
-- itens no Radar, nada muda.
-- =========================================================

begin;

-- ---------- ITENS DO RADAR ----------
create table if not exists itens_radar (
  id                        uuid primary key default gen_random_uuid(),
  marca_id                  uuid not null references marcas(id) on delete cascade,
  descricao                 text not null,
  prazo                     date,                    -- opcional: com prazo, entra no painel por data
  concluida                 boolean not null default false,
  concluida_em              timestamptz,
  observacao                text,
  link_externo              text,
  ordem                     int not null default 0,
  -- Segunda etapa (promover para tarefa de evento). Se a tarefa for apagada, o item
  -- não some: só perde o vínculo.
  promovido_para_tarefa_id  uuid references tarefas(id) on delete set null,
  promovido_em              timestamptz,
  criado_em                 timestamptz not null default now()
);

-- ---------- SUBITENS DO RADAR ----------
create table if not exists subitens_radar (
  id             uuid primary key default gen_random_uuid(),
  item_radar_id  uuid not null references itens_radar(id) on delete cascade,
  descricao      text not null,
  prazo          date,
  concluida      boolean not null default false,
  concluida_em   timestamptz,
  observacao     text,
  ordem          int not null default 0,
  criado_em      timestamptz not null default now()
);

-- ---------- ÍNDICES ----------
-- FKs usadas nos joins/filtros (lista da marca, view, cascade) e prazo dos pendentes
-- (mesmo padrão dos índices parciais de tarefas/subtarefas na 0001).
create index if not exists itens_radar_marca_id_idx
  on itens_radar (marca_id);
create index if not exists itens_radar_prazo_pendente_idx
  on itens_radar (prazo) where not concluida;
create index if not exists itens_radar_promovido_para_tarefa_id_idx
  on itens_radar (promovido_para_tarefa_id) where promovido_para_tarefa_id is not null;
create index if not exists subitens_radar_item_radar_id_idx
  on subitens_radar (item_radar_id);
create index if not exists subitens_radar_prazo_pendente_idx
  on subitens_radar (prazo) where not concluida;

-- ---------- RLS: usuário logado acessa tudo (igual à 0001) ----------
-- "create policy" não tem "if not exists": confere em pg_policies para poder rodar de novo.
do $$
declare t text;
begin
  foreach t in array array['itens_radar', 'subitens_radar'] loop
    execute format('alter table %I enable row level security', t);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t
        and policyname = 'autenticados_acesso_total'
    ) then
      execute format(
        'create policy "autenticados_acesso_total" on %I for all to authenticated using (true) with check (true)', t);
    end if;
  end loop;
end $$;

-- ---------- VIEW: pendências do painel ----------
-- Mesmas 4 partes da 0002, sem nenhuma alteração, mais as 2 do Radar no fim.
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
  -- despesas do mês não concluídas (nome vem da nota: renomear vale para todos os meses)
  select 'recorrente', o.id, n.nome, to_char(o.mes_referencia, 'MM/YYYY'),
         o.vencimento, m.id, m.nome, null::uuid, null::text, (o.valor_real is null)
  from ocorrencias_mensais o
  join notas_recorrentes n on n.id = o.nota_recorrente_id
  join marcas m on m.id = n.marca_id
  where not o.concluida
union all
  -- itens do Radar com prazo (sem prazo não entram aqui: o painel lista à parte).
  -- Item já promovido para tarefa sai daqui, para não contar duas vezes (a tarefa já conta).
  select 'radar', r.id, r.descricao, null::text,
         r.prazo, m.id, m.nome, null::uuid, null::text, false
  from itens_radar r
  join marcas m on m.id = r.marca_id
  where not r.concluida and r.prazo is not null and r.promovido_em is null
union all
  -- subitens do Radar com prazo (só se o item principal não estiver concluído nem promovido)
  select 'subitem_radar', sr.id, sr.descricao, r.descricao,
         sr.prazo, m.id, m.nome, null::uuid, null::text, false
  from subitens_radar sr
  join itens_radar r on r.id = sr.item_radar_id
  join marcas m on m.id = r.marca_id
  where not sr.concluida and not r.concluida and sr.prazo is not null
    and r.promovido_em is null;

commit;
