Implemente as alterações descritas em `docs/tarefas/Ajustes de organização de tarefas e painel.md`. Esse documento é a especificação fechada com o usuário; leia-o inteiro antes de começar, e leia também o `CLAUDE.md` do projeto (convenções, estrutura e a seção "Acesso ao Supabase").

## Decisões já tomadas (valem sobre qualquer dúvida)
- **Hoje:** grupo novo antes de "Esta semana". Hoje só tem tarefas de hoje; "Esta semana" tem os outros dias da semana; nada se repete. Entra na faixa de resumo (5 células; ajustar grade e bordas do mobile). Nos domingos "Esta semana" fica vazia: tratar o intervalo invertido.
- **Pendentes primeiro** em Orçamento e Notas recorrentes: só o status move o item. Ordenar depois do `useOptimistic` para o item descer no clique.
- **Status:** só "Pendente" (vermelho) e "Lançado" (verde), em todo o software (painel, orçamento, notas, toasts, aria-label, tooltips). Fonte única do texto em `lib/status.ts`. **Manter o valor interno `lancada`**; só o texto muda. Nas Notas recorrentes, "Falta valor real" deixa de ser estado e vira aviso no campo de valor.
- **Eventos da marca:** cada mês mostra os eventos que o cobrem (início até fim; sem fim = só o mês de início). Filtrar em JS antes de buscar resumos. A data de início passa a ser obrigatória ao criar evento (formulário, action e, se couber, banco).
- **Observação e Link:** colunas só aparecem se alguma linha tiver conteúdo. Vale para Orçamento (hoje juntas, viram duas colunas), Notas recorrentes e a linha de observação das subtarefas. Cada tabela ganha menu de ações com "Adicionar observação" e "Adicionar link" para poder preencher o primeiro.
- **No Radar:** seção em cada marca, entre Notas recorrentes e Eventos e ações, e também no painel principal. Lista simples no padrão das demandas de evento (tarefas e subtarefas, observação, link, conclusão, concluídos no fim), reaproveitando `PainelTarefa`/`LinhaTarefa`. Sem categorias e sem arrastar na v1. Itens **com prazo** entram também nos grupos por data do painel (Atrasados, Hoje, Esta semana, Próxima semana) e nos contadores, via `vw_pendencias`; itens **sem prazo** aparecem no bloco "No Radar" do painel, com o nome da marca. A **promoção** para tarefa de evento fica para uma segunda etapa: não implementar, mas deixar os campos `promovido_para_tarefa_id` e `promovido_em` na tabela.

## Ordem de execução
1. `lib/` puro, com testes em `lib/__tests__/`: `Periodo` com `"hoje"` e `classificar`, `ultimoDiaDoMes` e `cobreOMes`, `lib/listas.ts` (`pendentesPrimeiro`, `temConteudo`), `lib/status.ts`, `ocorrenciaConcluida` em `lib/despesas.ts`. Atualizar o teste existente de `datas.test.ts` que esperava o comportamento antigo.
2. Itens 1 a 5 (painel com Hoje, tabelas de Orçamento e Notas, status, eventos por mês, colunas condicionais). Mesmos arquivos, então faça em sequência ou com cuidado ao paralelizar: `blocos-painel.tsx`, `painel-orcamento.tsx`, `tabela-ocorrencias.tsx`, `painel-tarefa.tsx`, `marcas/[marcaId]/page.tsx`, formulário de evento.
3. Item 6 (Radar): migration `supabase/migrations/0003_no_radar.sql` (tabelas `itens_radar` e `subitens_radar` espelhando `tarefas` e `subtarefas`, RLS e policy `autenticados_acesso_total` como na 0001, mais a extensão da `vw_pendencias` para os itens com prazo, tudo idempotente e aditivo). Depois actions em `marcas/[marcaId]/actions-radar.ts`, seção na marca e bloco no painel.

## Banco de dados
O acesso de administração já está configurado em `.env.supabase`. Siga a seção "Acesso ao Supabase" do `CLAUDE.md` à risca: **mostre o SQL e peça confirmação antes de aplicar a migration**, não exiba nem copie o token, depois confira que as tabelas existem, regenere `types/database.ts` com `supabase gen types` e rode o typecheck. Mexer na `vw_pendencias` muda contadores do painel e das marcas: confira todos os números depois.

## Regras
- Português nos nomes e comentários (explique o porquê), cores só por token, actions no padrão do projeto (validar, `createClientAutenticado`, `Resultado`, `atualizarTelas()`).
- Nada de commit sem pedido. Não altere o que não faz parte deste escopo.
- Antes de dar como pronto: `npm run typecheck && npm run lint && npm test && npm run build`. Observação do `CLAUDE.md`: o `npm test` já falhou neste ambiente com `Cannot read properties of undefined (reading 'config')`; se acontecer, diga e investigue a instalação do vitest em vez de ignorar.
- Teste ponta a ponta o que as telas gravam (criar, editar, concluir, desfazer, recarregar) e confira que Hoje + Esta semana batem com os subtítulos e que a contagem do Radar na marca bate com as linhas.
- Atualize `docs/CHANGELOG.md`. Ao terminar, resuma o que mudou, os arquivos tocados, os testes rodados e o que ficou pendente.
