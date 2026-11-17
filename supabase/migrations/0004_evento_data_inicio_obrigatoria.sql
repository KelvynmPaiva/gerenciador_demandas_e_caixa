-- =========================================================
-- 0004 — Data de início obrigatória nos eventos
-- Aplicar conforme "Acesso ao Supabase" no CLAUDE.md, depois da 0003.
--
-- O app já exige a data de início ao criar e ao editar um evento (formulário e
-- action). Aqui o banco passa a garantir a mesma regra (eventos.data_inicio not null).
--
-- Seguro com os dados existentes: NÃO altera nem apaga nenhuma linha.
-- - Se nenhum evento estiver sem data de início, aplica o NOT NULL.
-- - Se houver algum, não faz nada e só avisa quantos são (NOTICE). Nesse caso,
--   defina a data deles pela tela (Editar evento exige a data) e rode de novo.
--   Enquanto isso, a tela da marca mostra esses eventos no mês em que foram criados.
-- Pode rodar mais de uma vez: "set not null" numa coluna que já é NOT NULL não dá erro.
-- =========================================================

do $$
declare sem_data int;
begin
  select count(*) into sem_data from eventos where data_inicio is null;
  if sem_data > 0 then
    raise notice 'eventos sem data de início: %. NOT NULL não aplicado; preencha as datas e rode de novo.', sem_data;
  else
    alter table eventos alter column data_inicio set not null;
  end if;
end $$;
