# Changelog

Registro de funcionalidades e mudanças relevantes, da mais recente para a mais antiga.
Formato: data · o que foi feito · arquivos alterados. Atualizar a cada entrega (regra no `CLAUDE.md`).

## 2026-11-16
- **Ajustes de organização de tarefas e painel** (especificação em `docs/tarefas/Ajustes de organização de tarefas e painel.md`).
  - **Painel com grupo "Hoje"** antes de "Esta semana": Hoje só tem o que vence hoje e Esta semana vai de amanhã a domingo, sem repetir item (no domingo, Esta semana fica vazia com aviso). Faixa de resumo com 5 células (Atrasadas, Hoje, Esta semana, Próxima semana, NFs a lançar), contando só pendentes. `Periodo` ganhou `"hoje"`; `classificar` e `diasDoPeriodo` em `lib/datas.ts`, `diaCurto` em `lib/prazo.ts`.
  - **Pendentes primeiro** no Orçamento e nas Notas recorrentes (`pendentesPrimeiro` em `lib/listas.ts`): só o status move a linha; dentro de cada grupo a ordem por data continua. Ordenado depois da cópia otimista, então a linha desce no clique.
  - **Status únicos "Pendente" (vermelho) e "Lançado" (verde)** em todo o app, com texto vindo de `lib/status.ts` (painel, orçamento, notas, avisos, `aria-label`, tooltips). Valor gravado continua `pendente`/`lancada` (sem migração de dados). Nas Notas recorrentes, "Falta valor real" deixou de ser estado e virou aviso no campo de valor; a regra de "Lançado" (check **e** valor real) está em `ocorrenciaConcluida` (`lib/despesas.ts`), igual à coluna gerada do banco.
  - **Eventos da marca por mês:** cada mês mostra só os eventos que o cobrem, do início ao fim (sem fim = só o mês de início), filtrados antes de buscar os resumos (`cobreOMes`, `ultimoDiaDoMes`, `dataEmSaoPaulo` em `lib/datas.ts`). **Data de início obrigatória** no formulário e na action (criar e editar). Eventos antigos sem data aparecem no mês em que foram criados.
  - **Colunas Observação e Link só com conteúdo** (`temConteudo` em `lib/listas.ts`): Orçamento (Observação e Link viraram colunas separadas), Notas recorrentes (Observação) e linha de observação das subtarefas. Menu de ações de cada linha com "Adicionar observação"/"Adicionar link" para preencher a primeira; `BotaoLink` pode ser aberto por fora e `CampoTexto` aceita `ref`.
  - **No Radar** (nova seção em cada marca, entre Notas recorrentes e Eventos e ações): lista de tarefas e subtarefas no padrão das Demandas do evento (mesmas `LinhaTarefa`/`PainelTarefa`; agora existe `LinhaTarefaFixa`, sem arrastar), com prazo, observação, link, conclusão e concluídos no fim. Sem categorias e sem arrastar os itens (v1); os subitens mantêm o arrastar do painel lateral. Ações em `marcas/[marcaId]/actions-radar.ts`. No Painel, itens com prazo entram nos grupos por data e nos contadores (tipos `radar` e `subitem_radar` na `vw_pendencias`), com conclusão e "Desfazer"; itens sem prazo aparecem no bloco **"No Radar"**, com o nome da marca. A promoção para tarefa de evento fica para a segunda etapa (campos `promovido_para_tarefa_id`/`promovido_em` já existem e nenhuma tela os grava).
  - **Números que batem:** lista de Marcas e cabeçalho da marca contam só os tipos que o Painel mostra (`TIPOS_DE_PENDENCIA` em `lib/pendencias.ts`).
  - **Migrations aplicadas no Supabase em 16/11/2026:** `0003_no_radar.sql` (tabelas `itens_radar` e `subitens_radar` com RLS e policy `autenticados_acesso_total`, índices, `vw_pendencias` com os tipos `radar` e `subitem_radar` só para itens/subitens com prazo, pendentes e não promovidos) e `0004_evento_data_inicio_obrigatoria.sql` (sem efeito por enquanto: 2 eventos antigos, "Demandas Gerais" e "Campanha de Natal Instituto Eurobike", seguem sem `data_inicio`, então a coluna continua anulável; rodar de novo depois de preencher as datas). `types/database.ts` regenerado.
  - Testes: `lib/__tests__/{listas,status}.test.ts` (novos), `datas.test.ts` (Hoje, domingo, `cobreOMes`), `pendencias.test.ts` (tipos do Radar, endereço, ordem do bloco No Radar), `prazo.test.ts`, `eventos.test.ts`.
  - Arquivos: `supabase/migrations/{0003_no_radar,0004_evento_data_inicio_obrigatoria}.sql` (novos), `types/database.ts`, `lib/{status,listas}.ts` (novos), `lib/{datas,despesas,eventos,prazo,pendencias}.ts`, `lib/__tests__/*`, `app/(app)/{page,blocos-painel}.tsx`, `app/(app)/marcas/page.tsx`, `app/(app)/marcas/[marcaId]/{page.tsx,tabela-ocorrencias.tsx,actions-radar.ts (novo),lista-radar.tsx (novo)}`, `app/(app)/eventos/{actions.ts,dialogo-evento.tsx}`, `app/(app)/eventos/[eventoId]/{painel-orcamento,painel-tarefa,linha-tarefa}.tsx`, `app/(app)/eventos/[eventoId]/demandas-tipos.ts`, `components/{botao-link,campos-inline,status-badge}.tsx`, `CLAUDE.md`
- **Repaginação visual** (guia em `docs/redesign/`; só aparência, rotas/props/actions/dnd-kit iguais). Branch `feat/redesign`, um commit por passo.
  - Tema: fontes Geist, tokens novos em `app/globals.css` (brand cobalto, danger/warning/success, sombras) e **tema claro/escuro** com `next-themes` (`ThemeProvider`, `ThemeToggle` na lateral e na aba Conta do celular). Toaster acompanha o tema.
  - shadcn: botão grafite (no escuro inverte), input/select/textarea, tabela sem caixa-alta, abas `line`, checkbox verde, switch, diálogos/menus com `shadow-overlay`, `Badge` com tons `danger/warning/success/brand/neutral`, `AlertDialog` novo (`DialogoConfirmar` passou a usá-lo) e `Skeleton` com shimmer.
  - Novos: `DateChip`, `StatusBadge`, `Money`, `EmptyState`, `ResumoEvento`, `NavegacaoMobile`; `lib/prazo.ts` (urgência e rótulo relativo em datas texto/São Paulo, com teste) e `diasAte` em `lib/datas.ts`; `ResumoDoEvento` ganhou `nfsVencidas`.
  - Telas: Painel (coluna única Atrasadas → Esta semana → Próxima semana, faixa de resumo, lista de marcas à direita, conclusão com risco 700ms + saída 200ms + "Desfazer" que reverte no banco), Evento (cabeçalho com contagem e progresso, ações Editar/Arquivar no topo e Excluir no menu "…", `ResumoEvento`, células sem borda, progresso por seção, alça de arrastar só no hover), Marca, Marcas (lista com pendências e próximo prazo, mantém a ordem manual) e Login (pontilhado, erro acima dos campos).
  - Mobile (< 768px): lateral some, barra inferior Painel/Marcas/Conta, topo com voltar + título, tabelas empilhadas (mesmos campos editáveis, sem Sheet) e alvos de toque de 40px.
  - Nomes antigos `perigo/sucesso/atencao/neutro`, hex fixos e `text-primary` (link) trocados pelos tokens novos.
  - Arquivos: `app/globals.css`, `app/layout.tsx`, `app/login/*`, `app/(app)/{layout,page,blocos-painel}.tsx`, `app/(app)/marcas/**`, `app/(app)/eventos/**`, `components/**`, `components/ui/**`, `lib/{prazo,datas,eventos}.ts`, `lib/__tests__/{prazo,eventos}.test.ts`, `package.json`

## 2026-11-15
- **Despesas: excluir só um mês e nome sem repetição.** Menu da linha ganhou "Excluir só este mês" (`excluirOcorrencia`: apaga a despesa daquele mês e mantém a nota, que volta como sugestão); o antigo "Excluir despesa" virou "Excluir de todos os meses". Renomear (`editarNota`) recusa nome já usado por outra despesa da marca ("Já existe uma despesa com esse nome."); `notaComMesmoNome` ganhou `ignorarId`. Falha ao desfazer a nota nova em `criarOcorrencia` agora vai para o `console.error`.
  - Arquivos: `app/(app)/marcas/[marcaId]/{actions.ts,tabela-ocorrencias.tsx}`, `lib/despesas.ts`, `lib/__tests__/despesas.test.ts`, `CLAUDE.md`
- **Módulo de despesas: cadastro manual mês a mês** (tarefa em `docs/tarefas/Ajustes e melhorias no módulo de despesas.md`). A migration `0002_despesas_manuais.sql` já foi aplicada no Supabase (15/11/2026).
  - Só valor real: saíram o valor orçado (itens de evento: coluna, cartões "Total orçado"/"Diferença", rodapé) e o valor previsto (despesas recorrentes). O cartão do evento na tela da marca mostra o **Total real**.
  - Fim da geração automática (`gerar_ocorrencias`, `lib/ocorrencias.ts`): botão **"Adicionar despesa"** com mês, data, valor real e sugestões das despesas já cadastradas que ainda não estão no mês (ou "Nova despesa"). A mesma despesa não entra duas vezes no mês (unique + aviso). "Nova despesa" com nome já existente reaproveita a despesa.
  - "Desativar nota" virou **"Excluir despesa"** (com confirmação; apaga a despesa de todos os meses).
  - **Correção do renomear:** o nome era copiado em `ocorrencias_mensais.nome` na geração e a tela lia a cópia; agora o nome mora só na nota e a tabela e o `vw_pendencias` leem dela (vale para todos os meses).
  - **Data livre** na linha da despesa (mesmo `SeletorData` do prazo da NF); saiu o "dia do vencimento". `SeletorData` ganhou `permitirLimpar`.
  - `types/database.ts` ajustado à mão para a 0002; conferido contra o schema gerado pelo banco depois da migration (estrutura idêntica).
  - Testes: `lib/__tests__/despesas.test.ts` e `lib/__tests__/eventos.test.ts` (novos), `moverParaMes` em `datas.test.ts`.
  - Arquivos: `supabase/migrations/0002_despesas_manuais.sql` (novo), `types/database.ts`, `lib/despesas.ts` (novo), `lib/eventos.ts`, `lib/datas.ts`, `lib/ocorrencias.ts` (removido), `components/seletor-data.tsx`, `app/(app)/page.tsx`, `app/(app)/marcas/[marcaId]/{actions.ts,page.tsx,tabela-ocorrencias.tsx,dialogo-nota.tsx,dialogo-despesa.tsx (novo),cartao-evento.tsx}`, `app/(app)/eventos/[eventoId]/{actions.ts,page.tsx,painel-orcamento.tsx}`, `spec/gerenciador-tarefas-documentacao.md`, `spec/kickoff-claude-code.md`, `CLAUDE.md`
- **Documentação reorganizada**: `CLAUDE.md` reestruturado em Visão geral, Stack e comandos, Estrutura de pastas, Convenções, Banco de dados, Decisões importantes, Pendências conhecidas e regra permanente de documentação; criado este changelog.
  - Arquivos: `CLAUDE.md`, `docs/CHANGELOG.md`

## 2026-11-13
- **Testes unitários com Vitest** para `lib/` (datas, formato, links, pendências).
  - Arquivos: `lib/__tests__/datas.test.ts`, `lib/__tests__/formato.test.ts`, `lib/__tests__/links.test.ts`, `lib/__tests__/pendencias.test.ts`, `vitest.config.mts`, `package.json`, `package-lock.json`
- **Remoção de código sem uso** (client do Supabase no navegador e componente `separator`).
  - Arquivos: `lib/supabase/client.ts` (removido), `components/ui/separator.tsx` (removido)
- **Performance**: menos consultas repetidas e cascatas no servidor (`React.cache` para marcas e cliente Supabase).
  - Arquivos: `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/marcas/page.tsx`, `app/(app)/marcas/[marcaId]/page.tsx`, `lib/marcas.ts`, `lib/ocorrencias.ts`, `lib/supabase/server.ts`
- **Refactor**: helpers duplicados das Server Actions centralizados em `lib/acoes.ts`.
  - Arquivos: `lib/acoes.ts`, `app/(app)/eventos/actions.ts`, `app/(app)/eventos/[eventoId]/actions.ts`, `app/(app)/eventos/[eventoId]/actions-demandas.ts`, `app/(app)/marcas/actions.ts`, `app/(app)/marcas/[marcaId]/actions.ts`
- **Docs**: criação do `CLAUDE.md` com arquitetura, padrões e comandos.
  - Arquivos: `CLAUDE.md`

## 2026-11-12
- **Skills do projeto** consolidadas em `.claude/skills` (find-skills, vercel-react-best-practices, systematic-debugging).
- Ajustes em imagens dos protótipos (`spec/`).

## 2026-11-08
- **Versão inicial**: marcas, notas recorrentes, eventos (orçamento e demandas), painel de pendências, login Supabase, schema `0001_inicial.sql`.
- **Alterações de segurança** (RLS/autenticação).
  - Arquivos principais: `supabase/migrations/0001_inicial.sql`, `proxy.ts`, `app/`
