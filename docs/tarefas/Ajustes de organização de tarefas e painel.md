# Ajustes de organização de tarefas e painel

Preciso que você faça as alterações abaixo. Antes de começar, analise como as funcionalidades atuais estão implementadas e preserve o padrão visual e a estrutura já existentes (componentes, tokens e o estilo da repaginação).

## 1. Filtro "Hoje" no painel principal

Hoje o painel principal tem os grupos **Atrasados**, **Esta semana** e **Próxima semana**.

- Adicionar um grupo/aba **Hoje**, exibindo somente as tarefas com data igual ao dia atual.
- Posicionar **Hoje** antes de **Esta semana**.
- Os grupos **não se repetem**: **Hoje** mostra apenas as tarefas de hoje; **Esta semana** mostra apenas os outros dias da semana (sem hoje); uma tarefa nunca aparece em dois grupos.
- Incluir **Hoje** na faixa de resumo, com o mesmo critério de contagem (só pendentes).
- Manter o comportamento atual de conclusão com desfazer.

## 2. Pendentes primeiro, concluídos no fim da lista

Vale para **Orçamentos** e **Notas recorrentes**.

- Reordenar as listas de tarefas e despesas para que os itens **concluídos/lançados** apareçam **abaixo** dos itens ainda pendentes.
- Dentro de cada grupo (pendentes e concluídos), manter a ordem atual (por data).
- Quando eu marcar um item como concluído, ele deve descer para o grupo de baixo; ao desmarcar, volta para cima.
- Não é preciso criar separador visual obrigatório, mas se ajudar a leitura, usar um espaçamento ou rótulo discreto.

> Critério: apenas o status move o item (pendente em cima, concluído/lançado embaixo). Editar um item não o move.

## 3. Status únicos em todo o software: Pendente e Lançado

Para todas as despesas e NFs, tanto em **Notas recorrentes** quanto em **Orçamentos**, existirão apenas dois status:

- **Pendente**
- **Lançado**

Regras:

- Remover qualquer variação de texto, como **Lançamento pendente** (painel principal) e **Lançada** (orçamento).
- Padronizar o texto em **todo o software**: painel principal, telas de evento, telas de marca, diálogos, tooltips e `aria-label`.
- Manter as cores atuais (pendente em vermelho, lançado em verde) e o clique para alternar entre os dois.
- Nas despesas de **Notas recorrentes**, que hoje têm os estados Concluída, Falta valor real e Pendente: ficam só **Pendente** (vermelho) e **Lançado** (verde). "Falta valor real" deixa de ser um estado e vira apenas um aviso no campo de valor.
- Atenção: o valor interno hoje é `pendente` / `lancada`. Só trocar o **texto exibido**, a não ser que seja simples e seguro padronizar o valor interno também. Se mexer no valor armazenado, criar migração para os dados existentes.

## 4. Eventos e ações: mostrar só os do mês

Na tela da **marca**, seção **Eventos e ações**:

- Cada mês deve mostrar **somente** os eventos que ocorrem naquele mês.
- Um evento de novembro **não** aparece em dezembro. Evento do mês 10 aparece só no mês 10; no mês 11, só os do mês 11.
- Se um evento durar mais de um mês, ele aparece em **todos os meses que o evento cobre** (do mês de início ao mês de término).
- Meses sem eventos mostram o estado vazio já existente.
- **Data de início obrigatória:** não deve ser possível criar um evento sem data de início. Verificar se já é obrigatória no formulário e no banco e, se não for, tornar. Tratar os eventos antigos que eventualmente não tenham data.

## 5. Colunas Observação e Link só quando houver conteúdo

Hoje as colunas **Observação** e **Link** aparecem sempre.

- Exibir a coluna **Observação** somente se pelo menos uma demanda da lista tiver observação preenchida.
- Aplicar a mesma regra à coluna **Link**.
- Se nenhuma demanda tiver conteúdo, a coluna não é renderizada.
- A edição não pode ficar bloqueada: manter um jeito de adicionar observação e link ao abrir a demanda (o campo existe no detalhe da demanda), de modo que, ao preencher, a coluna passe a aparecer.
- **Onde vale:** tabela de **Orçamento** (hoje "Observação / link" juntas, passam a ser duas colunas independentes), tabela de **Notas recorrentes** (coluna Observação) e a linha de observação das **subtarefas**.
- Como Orçamento e Notas não têm um detalhe que se abre, cada tabela precisa de um menu de ações com "Adicionar observação" e "Adicionar link". Ao usar, a coluna aparece para o preenchimento.

## 6. Nova seção "No Radar" dentro de cada marca

Dentro da página de cada marca, criar a seção **No Radar**:

- **Posição:** depois de **Notas recorrentes** e antes de **Eventos e ações**.
- **Função:** guardar demandas que ainda não viraram tarefa nem evento, mas que não quero perder de vista (ideias, pendências futuras, "preciso lembrar disso para essa marca").

Decisões:

- **Formato:** lista simples, igual às abas de demandas de cada evento (mesmo padrão de tarefas, subtarefas, observação, link e conclusão). Sem categorias nem etiquetas. Reutilizar os componentes existentes.
- **Onde aparece:** na página da marca **e também no painel principal**.
- **Prazo:** cada item pode ter um prazo. Itens **com prazo** entram também nos grupos por data do painel (Atrasados, Hoje, Esta semana, Próxima semana), com os mesmos contadores. Itens **sem prazo** aparecem no bloco **No Radar** do painel, indicando a marca de cada um.
- Consequência técnica: os itens do Radar com prazo precisam entrar na consulta de pendências (`vw_pendencias`), o que muda os contadores de pendências do painel e das marcas. Conferir todos os números depois.
- Itens concluídos descem para o fim da lista (mesma regra do item 2).
- **Promover** o item do Radar para demanda/tarefa de um evento fica para uma **segunda etapa**. Não implementar agora, mas não fechar a porta: a estrutura de dados não deve impedir isso depois.

## 7. Requisitos para a implementação

Antes de finalizar:

- Analise os componentes, serviços, funções e estruturas de dados envolvidos.
- Reutilize os padrões existentes sempre que possível.
- Corrija frontend, backend e banco de dados, se necessário (a nova seção No Radar exige tabela e migração).
- Preserve as demais funcionalidades que não fazem parte destas alterações.
- Teste cadastro e edição em cada item.
- Execute os testes disponíveis e corrija regressões. Adicione testes para as regras novas (agrupamento "Hoje", ordenação pendentes primeiro, filtro por mês).

**Importante:** não faça apenas alterações visuais. As funcionalidades precisam funcionar de ponta a ponta, com os dados sendo salvos e recuperados corretamente.

Ao concluir, apresente um resumo das alterações, dos arquivos modificados e dos testes executados. Informe também se alguma parte ficou pendente.
