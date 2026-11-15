# Ajustes e melhorias no módulo de despesas

Preciso que você faça as seguintes alterações no módulo de despesas do projeto. Antes de começar, analise como as funcionalidades atuais estão implementadas e preserve o padrão visual e a estrutura já existentes.

## 1. Remover o valor orçado das despesas

Em todos os tipos de despesas do sistema, temos atualmente os campos **Valor orçado** e **Valor real**.

Quero remover o campo **Valor orçado** e manter somente o **Valor real**.

- Remover o campo de valor orçado dos formulários de despesas.
- Ajustar as telas de visualização e edição para exibir apenas o valor real.
- Adaptar os cálculos, totais e resumos financeiros que dependam desses campos.
- Garantir que essa alteração seja aplicada a todos os tipos de despesas, sem deixar campos ou referências desnecessárias no sistema.

## 2. Alterar a opção das despesas recorrentes

Atualmente, nas despesas recorrentes, existe uma opção para desativar a despesa.

Quero substituir essa opção por **Excluir despesa**.

- Permitir excluir uma despesa recorrente diretamente pela interface.
- Solicitar uma confirmação antes de excluir, para evitar exclusões acidentais.
- Garantir que a exclusão funcione corretamente e que a despesa não continue aparecendo indevidamente na lista.

## 3. Permitir cadastrar despesas manualmente todos os meses

Quero ter controle total sobre as despesas de cada mês, podendo cadastrar manualmente as despesas e marcar cada uma como concluída.

O comportamento desejado é:

- Permitir adicionar despesas para cada mês, mesmo quando elas forem recorrentes.
- Permitir selecionar o mês e definir a data da despesa.
- Exibir as despesas cadastradas no mês correspondente.
- Permitir marcar e desmarcar cada despesa usando um checkbox ou o mecanismo visual de conclusão já utilizado no projeto.
- Manter o status de cada despesa salvo, mesmo depois de atualizar ou fechar a página.
- Garantir que marcar uma despesa como concluída em um mês não marque automaticamente as despesas dos outros meses.
- Evitar duplicações automáticas caso eu já tenha cadastrado manualmente uma despesa para aquele mês.

O objetivo é que eu possa organizar todas as despesas mês a mês e controlar manualmente quais já foram pagas ou concluídas.

## 4. Corrigir a funcionalidade de renomear despesas recorrentes

Atualmente, a funcionalidade de renomear despesas recorrentes não está funcionando corretamente.

Corrija esse problema para que seja possível:

- Alterar o nome de uma despesa recorrente.
- Salvar o novo nome corretamente.
- Exibir o nome atualizado imediatamente na interface.
- Manter o nome atualizado após recarregar a página.
- Garantir que a alteração seja persistida corretamente no banco de dados ou na fonte de armazenamento utilizada pelo projeto.

Verifique a causa do problema e corrija a implementação, em vez de apenas alterar a aparência do botão ou do campo.

## 5. Permitir escolher livremente a data das despesas recorrentes

Quero poder definir manualmente a data de uma despesa recorrente, da mesma forma que já consigo fazer nas outras despesas de eventos do sistema.

- Permitir selecionar a data desejada, sem ficar limitado a uma data fixa ou predefinida.
- Utilizar o mesmo padrão de seleção de datas já existente nas despesas de eventos.
- Garantir que a data selecionada seja salva corretamente e exibida na interface.
- Permitir editar a data posteriormente.

## 6. Requisitos para a implementação

Antes de finalizar:

- Analise os componentes, serviços, funções e estruturas de dados envolvidos.
- Reutilize os padrões existentes no projeto sempre que possível.
- Corrija os problemas de funcionamento no código, incluindo frontend, backend e banco de dados, se necessário.
- Preserve as demais funcionalidades que não fazem parte destas alterações.
- Verifique se as mudanças funcionam tanto ao cadastrar quanto ao editar despesas.
- Execute os testes disponíveis e corrija eventuais erros ou regressões.

**Importante:** não faça apenas alterações visuais. As funcionalidades precisam funcionar de ponta a ponta, com os dados sendo salvos e recuperados corretamente.

Ao concluir, apresente um resumo das alterações realizadas, dos arquivos modificados e dos testes executados. Informe também se alguma parte ficou pendente.