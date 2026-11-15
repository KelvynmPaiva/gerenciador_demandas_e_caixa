-- =========================================================
-- 0002 — Despesas manuais mês a mês
-- Rodar à mão no SQL Editor do Supabase, depois da 0001.
--
-- O que muda:
-- - Fica só o valor real: sai o valor orçado (itens de evento) e o valor
--   previsto (notas recorrentes e despesas do mês).
-- - Fim da geração automática: as despesas de cada mês passam a ser cadastradas
--   à mão. A nota recorrente vira só o nome da despesa (usado como sugestão).
--   Saem dia_vencimento, ativa e a função gerar_ocorrencias.
-- - O nome da despesa do mês passa a vir da nota (antes era uma cópia congelada
--   em ocorrencias_mensais.nome, por isso renomear não aparecia na tela).
-- - A data (vencimento) de cada mês já é uma coluna comum: o app passa a editá-la.
--
-- ATENÇÃO — perda de dados:
-- - Os valores orçados e previstos são apagados.
-- - Notas que estavam desativadas (ativa = false) voltam a aparecer como
--   sugestão; as despesas já geradas delas continuam nos meses em que estão.
-- Faça um backup (ou exporte as colunas) antes de rodar.
-- =========================================================

begin;

-- 1) O painel passa a ler o nome da nota. Precisa vir antes de apagar
--    ocorrencias_mensais.nome, porque a view dependia dessa coluna.
--    As colunas da view continuam as mesmas (nome e tipo), então o
--    "create or replace" mantém as permissões.
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
  where not o.concluida;

-- 2) Sem geração automática
drop function if exists gerar_ocorrencias(date);

-- 3) Só valor real nos itens de evento
alter table itens_orcamento drop column if exists valor_orcado;

-- 4) A nota recorrente vira só o nome (e a observação) da despesa
alter table notas_recorrentes
  drop column if exists valor_previsto,
  drop column if exists dia_vencimento,
  drop column if exists ativa;

-- 5) A despesa do mês: sem valor previsto e sem cópia do nome.
--    Continuam: unique (nota_recorrente_id, mes_referencia), que impede a mesma
--    despesa duas vezes no mês; "concluida" gerada (check E valor real) e o
--    índice parcial de vencimento.
alter table ocorrencias_mensais
  drop column if exists valor_previsto,
  drop column if exists nome;

commit;
