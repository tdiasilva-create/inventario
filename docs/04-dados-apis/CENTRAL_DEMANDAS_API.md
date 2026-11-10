# Contratos de operação desktop — D-071

Todas as rotas `/api/operations/*` exigem sessão válida e perfil root/admin/visualizador; negadas ao operador e ao Worker collector. POST exige root/admin e o mecanismo de origem/CSRF existente.

| Rota | Função |
|---|---|
| GET units | Cadastro no escopo, contagem de computadores, comunicação, demandas abertas, declaração explícita de ausência e versão. Não entrega snapshots técnicos. |
| GET computers | `unitId` obrigatório; `environmentId`, `q`, `offset` opcionais. Até 60 fichas, total, próxima página, ambientes/classificação. `allEquipment=1` para selecionar impressora/outros ao abrir atendimento. |
| GET queue-summary | Contagens por situação e total pendente; não soma notificações automáticas. |
| GET requests | Filtros `unitId`, `status` (pending/all ou situação exata), `q`, `offset`. Até 50 demandas. `id` obtém demanda e histórico. |
| POST request-save | `id`, `operationId` UUIDs, `version` esperada, `unitId`, `equipmentId` opcional, `description`, `kind`, `source`, `requester`, `status`, `responsible`, `scheduledDate`, `note`. Criação usa versão 0; atualização preserva alvo/contexto. |
| POST context | `targetId`, `unitId`, `kind` unit/environment, `value`, `version`. Unidade: unknown/none; ambiente: unknown/laboratory/other. Versão 0 cria. |

Demanda: descrição 1–2000 caracteres; nota até 2000, obrigatória para Concluída; solicitante/responsável até 200; data ISO válida ou vazio. Tipo: Manutenção, Reposição de insumo, Visita técnica, Outro. Origem: Telefone, Presencial, Painel, Outro. Campos são texto, nunca HTML executável. Versão conflitante/recibo divergente retorna 409. Equipamento de outra unidade retorna 422. Sem sucesso fictício após falha.

Migração 0018 acrescenta `service_requests`, `service_request_events`, `computer_context`, `computer_context_events`. Contexto da demanda e autoria são snapshots auditáveis; referências não impedem exclusão autorizada do cadastro mestre, e histórico não é apagado em cascata. Nenhuma tabela antiga alterada. IDs e dados de exemplo não são semeados na produção.

Migração antes do novo Worker; rollback operacional permite voltar ao Worker anterior mantendo as tabelas novas e eventuais demandas recebidas. Não executar DOWN nem restaurar backup sobre novas gravações sem análise do responsável. Backup anterior fica privado; não versionar dados, tokens ou segredos.

## Extensão D-082

GET /api/operations/computers sem unitId aceita presence=online|lost|unlinked|other. Mesmo controle de sessão/perfil; operador e Worker coletor recusados. Retorna unit:null, presence, items (unit_id/unit_name + campos existentes), total, offset, nextOffset, environments:[], server_time. Presença calculada pela mesma função da lista por unidade; filtro aplicado antes da paginação de 60. Não inclui inventário técnico bruto/credenciais. Custo atual proporcional às fichas de computadores da rede; nenhum novo polling. Sem filtro válido, o contrato anterior continua exigindo unidade.

POST request-save com versão válida e conteúdo normalizado igual, sem nota, retorna request existente + unchanged:true; nenhuma atualização ou evento. Verificação de versão/recibo/permissão continua anterior a esse retorno.

Consulta oficial GET /api/inventory/equipment?unitId=…&environmentId=UUID filtra json_extract(published_json,'$.environment'). Mantém todas as categorias/quantidades/fotos publicadas e filtros anteriores; localização em edição não muda esse filtro.
