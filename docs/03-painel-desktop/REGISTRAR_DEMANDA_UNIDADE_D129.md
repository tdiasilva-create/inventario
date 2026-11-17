# D129 — Registrar nova demanda na página da unidade

Pedido esclarecido pelo responsável em 17/11/2026: **clique no mapa → página da unidade → Registrar nova demanda ao lado do nome → modal para descrever a necessidade e escolher o técnico**. Implementado e testado localmente; publicação ainda depende de aprovação específica. [Verificações](../05-qualidade/DEMANDA_UNIDADE_D129_2026-11-17.md).

## Comportamento

1. Na página de uma unidade ativa, o root vê **Registrar nova demanda** junto ao nome. Em telas estreitas o botão passa à linha seguinte, sem cortar o texto.
2. O modal mantém a unidade selecionada pelo ID, sem permitir trocá-la. Solicita **O que a unidade precisa?** (obrigatório, até 2.000 caracteres), tipo e técnico responsável.
3. Tipos existentes: Manutenção, Reposição de insumo, Visita técnica e Outro. Manutenção é o valor inicial. O responsável é escolhido explicitamente entre contas ativas e habilitadas como técnico.
4. **Registrar e designar** cria uma demanda Aberta, origem Painel, no final da fila existente, já atribuída ao técnico. O aviso entra no mecanismo atual do aplicativo.
5. Depois da confirmação, o modal fecha, o foco volta ao botão e a página informa o número da demanda. Não navega para a Central nem reabre formulário automaticamente. A Central continua disponível para consultar, ordenar, trocar responsáveis ou incluir um segundo técnico conforme D105.

O atalho aparece apenas para root; a API também exige root e CSRF. Admin mantém as ações já permitidas na Central. Visualizador habilitado individualmente como técnico pode receber um atendimento geral sem ganhar acesso à coleta.

O comportamento anterior do mapa D095 permanece: unidade com demanda aberta leva à Central filtrada; as demais abrem a página da unidade. D129 adiciona o botão nessa página, sem abrir o modal automaticamente pelo mapa. Também funciona ao acessar a unidade pela lista ou URL.

## Diferença para Designar coleta D128

Este é um atendimento geral para uma unidade, inclusive com agente vinculado; podem existir necessidades diferentes na mesma unidade. Não se aplica a exclusividade de uma designação aberta de coleta. O contexto usa `purpose=unit_request`; D128 conserva `collection_agent_link`, sua restrição de papéis, ausência de vínculo e prevenção de designação duplicada.

Unidades inativas ou conveniadas são rejeitadas. Obras podem receber atendimento geral, conforme a Central, mas continuam fora da coleta. Demandas não são concluídas por reconexão, vínculo do agente ou alteração da classificação da coleta.

## API e persistência

| Operação | Entrada e resultado |
| --- | --- |
| GET `/api/dispatch/unit-request-options?unitId=UUID` | Unidade ativa e técnicos habilitados; consulta somente ao abrir o modal. |
| POST `/api/dispatch/unit-request-create` | `operationId`, `unitId`, `technicianId`, `description`, `kind`; confirmação com ID, número e status. |

Reutiliza `server/collection-dispatch.mjs` e o modal de `web/collection-designation.js`. Nenhuma migração: tabelas existentes de demandas, eventos, atribuições, notificações e auditoria. Demanda, atribuição, histórico, aviso e auditoria são gravados numa transação; a escrita revalida unidade, root e técnico. Falha reverte tudo. Recibo vincula autor/conteúdo à operação e nonce interno impede efeitos duplicados quando a mesma requisição chega simultaneamente.

Em resposta perdida, o formulário mantém o mesmo envio e oferece **Conferir envio / tentar novamente**. Erro de validação conhecido permite corrigir os campos. Uma nova operação explícita pode criar outra necessidade; não há deduplicação por texto. Exclusão posterior mantém o arquivo D126, e reenvio de operação arquivada não recria a demanda.

## Consumo e preservações

- Nenhuma consulta extra ao entrar na página, nenhum polling novo. Opções são lidas ao abrir; escrita apenas ao confirmar. Não consulta inventário nem varre vínculos de agentes para esta ação.
- Após salvar, usa a atualização compartilhada dos indicadores já existente.
- Atribuir não inicia localização. Aceite, fila contínua, encerramento e revogação seguem D105/D114; sem mudança de GPS, permissões Android, APK, coletor ou agente.
- Fotos, fichas, históricos e classificação das coletas permanecem intactos. Gratuito e alertas preservados.

Documentos consultados: entrada do repositório, precedência, decisões, pendências, conflitos, Central de demandas, D105, D114 e D128, modelo de dados e referências desktop previamente abertas nesta conversa. Critérios: posição do botão, unidade fixa, atribuição atômica, permissões, reenvio sem duplicação, encerramento do modal e layout a 390 px. Não resolve pendências da auditoria nem muda a ordem das demandas.
