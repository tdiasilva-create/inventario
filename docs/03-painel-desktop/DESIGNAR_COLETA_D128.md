# D128 — designar coleta pela lista Sem agente vinculado

Escolha do responsável em 17/11/2026: opção 1, usar a Central de demandas para encaminhar uma visita de coleta e vinculação de agentes. Implementação local; publicação depende de autorização específica. [Testes e estado](../05-qualidade/DESIGNAR_COLETA_D128_2026-11-17.md).

## Uso

1. Root abre Panorama → **Sem agente vinculado** e pesquisa a unidade.
2. **Designar coleta** abre a escolha de um técnico responsável e orientação opcional de até 1.000 caracteres.
3. **Criar demanda e designar** cria uma Visita técnica, origem Painel, no final da fila existente. A descrição identifica coleta de inventário e vinculação dos agentes.
4. A linha passa a mostrar **Coleta designada — nome do responsável** e **Ver demanda #número**. A Central permite reorganizar, trocar responsáveis, atribuir até dois técnicos e acompanhar o atendimento conforme D105.
5. O técnico encontra a demanda e o aviso no aplicativo atual; usa Atendimento técnico para aceitar e acompanhar, e Coleta para registrar os dados, conforme suas permissões.

Somente contas ativas, habilitadas como técnico e com papel root/admin/operador podem receber esta designação. Visualizador continua com consulta à lista, sem botão de designação. Root pode habilitar técnicos em Organizar atendimentos → Técnicos; o modal informa quando não há conta elegível. Obras e conveniadas não recebem coleta.

## Regras preservadas

- Atribuição é organização do trabalho; não concede acesso exclusivo nem retira o direito D046 de outros operadores contribuírem na mesma unidade.
- Uma designação aberta deste fluxo por ID da unidade. Duas janelas ou pedidos simultâneos não criam duas tarefas. Reabertura de uma designação antiga é recusada se outra já estiver aberta.
- Demandas manuais anteriores não são identificadas automaticamente pela descrição nem fundidas. O marcador explícito `context_json.purpose=collection_agent_link` distingue as novas designações.
- Quando surgir o primeiro vínculo válido, o grupo Com agente vinculado se atualiza pelo mecanismo D127. Isso não conclui automaticamente a demanda, a visita ou a classificação do Controle das coletas.
- Atribuir não ativa GPS. Aceite com localização disponível inicia o acompanhamento existente. D114 mantém a localização durante a fila; nova tarefa amplia uma fila já ativa e última conclusão/retirada encerra o acompanhamento. Sem mudança no APK, permissões Android, frequência ou retenção.
- Avisos usam o mecanismo periódico existente do aplicativo. Não é uma nova integração de push instantâneo.
- Exclusão root continua arquivando a demanda e preservando histórico. Uma operação antiga não recria a tarefa excluída.

## API e persistência

Somente no Worker do painel, root autenticado; POST exige CSRF.

| Operação | Contrato |
| --- | --- |
| GET `/api/dispatch/collection-tasks?unitIds=JSON` | Até 200 UUIDs distintos por lote; retorna designações abertas e responsáveis atuais. |
| GET `/api/dispatch/collection-options?unitId=UUID` | Revalida unidade, vínculo atual, tarefa existente e técnicos elegíveis ao abrir o formulário. |
| POST `/api/dispatch/collection-designate` | `operationId`, `unitId`, `technicianId`, `notes`; operação idempotente. |

Reutiliza tabelas de demandas, eventos, fila, atribuições, notificações e auditoria. Sem migração (continuam 37). A inserção inicial verifica novamente, dentro da transação, unidade ativa/elegível, ausência de agente vinculado, ausência de designação aberta, root ativo e técnico elegível. Demanda, histórico, atribuição, evento, aviso e auditoria são confirmados na mesma transação; erro reverte tudo. Nonce interno por tentativa impede efeitos duplicados de reenvios simultâneos. O recibo associa autor e conteúdo normalizado ao operationId.

Reatribuição pela Central revalida a permissão de coleta também na escrita transacional. Atualizações da ficha preservam o contexto; cliente não injeta o propósito pela API comum de criação.

## Consumo e falhas

Contagem de vínculos mantém a consulta compartilhada D127. Consulta de designações ocorre apenas ao abrir a lista como root, em **Atualizar designações** e após confirmação de criação. Busca local e polling existente não consultam este endpoint. Uma consulta por lote de até 200 IDs usa os índices existentes de demandas por unidade; autorização continua fresca em cada chamada.

Falha de leitura é explícita; **Verificar designação** consulta novamente antes de oferecer o formulário. Falha incerta de envio conserva operationId e dados; **Conferir envio / tentar novamente** recupera a operação sem duplicar. Sucesso libera o modal imediatamente e atualiza a listagem separadamente. Nenhum cache de autorização, plano pago, cron novo ou polling adicional.

## Arquivos

`server/collection-dispatch.mjs`, integrações em `technical-dispatch.mjs`/`service-desk.mjs`; `web/collection-designation.js`, `unit-agent-overview.js`, `dispatch.js`, `desktop.js`, `painel.css`; build desktop; testes de servidor e navegador integrados à regressão/CI.
