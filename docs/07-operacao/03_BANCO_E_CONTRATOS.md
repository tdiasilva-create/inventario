# Banco, contratos e compatibilidade

## Esquema físico verificável

[Catálogo completo de tabelas/colunas](gerado/DICIONARIO_DADOS.md) e [JSON com SQL, índices, triggers e hashes](gerado/schema.json), gerados aplicando as 19 migrações locais num SQLite vazio em memória. Resultado: **64 tabelas, 42 índices explícitos, uma view e 10 triggers**. Não inclui dados de produção nem tabelas internas criadas pelo serviço D1.

Regenerar com `pnpm docs:schema`. As migrações 0001–0019 são a fonte física, não os antigos modelos conceituais propostos. Não modificar migração já aplicada; criar a próxima incremental e testar upgrade.

| Família | O que preservar |
|---|---|
| Contas e acesso | Usuários, IDs, papéis, hashes/salt, versão da credencial, configurações, tentativas e auditoria |
| Unidades | Identidade, coordenadas, situação e relacionamentos; INEP opcional em núcleos/unidades administrativas |
| Visitas | Visita, versão do questionário, seções, autor, versões de edição e estados |
| Ambientes | IDs, unidade, associação à visita e nome informado |
| Equipamentos | IDs permanentes, ambiente/posição, JSON atual e publicado, origem manual/agente |
| Outros equipamentos | Tabela aditiva `miscellaneous_equipments` e view `inventory_equipment_all` |
| Históricos e conferências | Autores, revisões, verificações, ocorrências e travas |
| Fotografias | ID, visita/alvo, estado, provedor, referência do arquivo e fila de exclusão |
| Publicação | Snapshots e totais derivados das visitas publicadas |
| Google | Tokens criptografados, pastas, estados OAuth e eventos |
| Agentes | Instalações, chaves públicas, vínculos, QR/recibos, nonces, inventários, presença e retenção |
| Monitoramento | Referência confiável, cursor transacional, incidentes, leitura individual e saúde do cron (0017) |
| Demandas e laboratórios | Demanda, contexto original, eventos/recibos e classificação explícita versionada (0018) |

Nomes exatos e FKs estão no catálogo; a tabela acima descreve responsabilidades.

**09/11/2026:** 0019 contém apenas dois índices de fotos, testados localmente e aplicados no D1 real. A conferência remota confirmou 19 migrações e os dois índices adicionais (42 no catálogo físico). Ver [publicação e backup](../05-qualidade/PUBLICACAO_FASE_1_2026-11-09.md).

## Invariantes para restaurar

- Não gerar novos UUIDs ao importar: fotos, telemetria, históricos e QR referenciam os IDs existentes.
- Manter diferença entre `data_json` e `published_json`. Rascunhos não devem se tornar inventário oficial por transformação do dump.
- Preservar campos históricos removidos da interface e versão da visita. Formulário atual não é esquema universal de todas as visitas antigas.
- INEP ausente continua NULL; nunca criar código provisório para contornar importação.
- ID AnyDesk/RustDesk é texto numérico opcional, preservando zeros iniciais; não é inteiro nem senha.
- A view unifica equipamentos de origens distintas; não duplicar registros copiando a view para uma tabela adicional.
- Foreign keys, índices únicos, triggers, JSON do SQLite, transações/batches e idempotência fazem parte do contrato, não são otimizações descartáveis.
- Ao restaurar SQL com triggers e totais materializados, conferir a ordem de carga e os agregados. Não assumir que uma segunda execução do mesmo dump seja idempotente.

## Contratos HTTP por família

| Família | Código de referência | Regras |
|---|---|---|
| `/api/auth/*` | `server/worker.mjs` | Login, sessão, mudança/revogação; humano |
| `/api/root/*`, `/api/admin/*` | Worker, units, google-auth, agentes | Permissão específica no servidor |
| `/api/collector/*` | collector, collector-v2/v3, visit-routes | Unidade/visita/versão, autoria, travas e validação |
| Consulta desktop | in-progress, in-progress-photos, inventory-results | Perfis desktop e separação parcial/publicado |
| `/api/inventory/equipment` | `server/inventory-equipment.mjs`, `server/collector.mjs` | GET com unidade, filtros, paginação e fotos por ID; dados publicados |
| `/api/inventory/monitoring`, `/api/inventory/notifications/read` | `server/agent-monitoring.mjs` | Consulta/leitura individual, sem liberar operador |
| `/api/operations/*` | `server/service-desk.mjs` | Consulta root/admin/visualizador; escrita root/admin; proibido no coletor |
| Fotos | collector + photo-storage | Upload e leitura autenticados; contexto/alvo obrigatório |
| Galeria desktop `/api/inventory/photos`, `/api/inventory/photo` | photo-gallery + photo-storage | GET, root/admin/visualizador; filtros e cursor; `ready`; histórico pausado identificado PARCIAL |
| `/api/agent/v1/*` | agentes/index + nucleo | Algumas rotas são de máquina assinada; outras exigem usuário |
| `/api/inventory/*` | agentes/index | Localização/status/histórico conforme perfil |

Não usar a tabela como OpenAPI completa. Implementação e testes especificam parâmetros, respostas, limites e erros. Contratos propostos antigos em `docs/04-dados-apis/` devem ser lidos com seu status. O [mapeamento desktop](../06-entregas/MAPEAMENTO_COLETOR_PARA_PAINEL_DESKTOP_2026-11-05.txt) identifica os destinos visuais.

### Agentes: rotas que precisam continuar disponíveis

POST de máquina em `/api/agent/v1/`: `enrollment-challenge`, `enrollments`, `enrollment-status`, `enrollment-renew`, `pairings/confirm-device`, `heartbeat`, `inventory`, `config`, `rotate-key`.

Rotas humanas de pareamento: POST `pairings/preview`, `pairings/claim`; GET `pairings/catalog`, `pairings/claim-status`. Localização: POST `/api/inventory/equipment-location` e consulta do recibo em `equipment-location-status`. Não liberar rotas humanas anonimamente só porque compartilham o prefixo do agente.

Preservar corpo bruto, método, caminho, headers assinados, relógio, nonce, hashes e recibos de idempotência. Um proxy que reescreve corpo/caminho pode quebrar assinatura mesmo retornando HTTP 200 na raiz.

## Alteração de banco/provedor

SQLite/D1 usa recursos que não traduzem literalmente para MySQL/PostgreSQL. Uma mudança exige adaptador de persistência e migração validada de tipos, consultas JSON, triggers, índices parciais, transações e resultados retornados por `prepare/bind/first/all/run/batch`. Não há adaptador genérico pronto neste repositório.

A migração 0016 do cadastro ampliado foi aplicada ao D1 real em 06/11/2026 após backup e autorização do responsável. Conferência remota: nenhuma migração pendente, 32 colunas em units e registros anteriores preservados. Ver [publicação D-068](../05-qualidade/PUBLICACAO_D068_2026-11-06.md). O catálogo gerado continua sendo reproduzido das migrações versionadas; não contém dados de produção.

As migrações 0017 e 0018 foram aplicadas posteriormente, em 08/11/2026: [monitoramento](../05-qualidade/MONITORAMENTO_2026-11-08.md) e [demandas](../05-qualidade/CENTRAL_DEMANDAS_2026-11-08.md). As três publicações são registros distintos; a conferência da 0016 não comprova, sozinha, o estado posterior.

## Estado físico após D-078 — 09/11/2026

A descrição histórica de 19 migrações acima foi superada. Aplicar todas as **23 migrações** versionadas: catálogo regenerado com 68 tabelas, 47 índices explícitos, uma view e 14 triggers. A 0023 cria equipment_deletions, conserva a cópia dos cadastros retirados, bloqueia reutilização dos IDs e mantém contagens ao retirar fichas ativas. Fotografias não são removidas por essa ação. Não ignorar o arquivo histórico numa migração/restauração. A edição de nomes (0021/0022) também faz parte do conjunto atual. [Publicação e aceite D-078](../05-qualidade/EXCLUSAO_EQUIPAMENTOS_2026-11-09.md).
