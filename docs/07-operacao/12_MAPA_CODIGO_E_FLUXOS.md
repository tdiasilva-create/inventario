# Mapa do código e dos fluxos que precisam sobreviver

Referência D-110. Este guia descreve responsabilidades; detalhes executáveis estão nas fontes e testes. Complementos: [índice de arquivos/API](gerado/CODIGO_E_ROTAS.md), [imports/exports/configuração e hashes](gerado/codigo.json), [esquema completo](gerado/schema.json). O índice de rotas é uma extração literal, não uma especificação OpenAPI completa.

## Backend por responsabilidade

| Arquivo / família em `server/` | Responsabilidade e risco de migração |
|---|---|
| `worker.mjs`, `security.mjs` | Entrada fetch/scheduled, ordem das rotas, autenticação, papéis, CSRF, mudanças de senha, assets e erros. Manter a ordem entre endpoints assinados, OAuth e humanos |
| `asset-response.mjs` | Cache de código/HTML e entrega dos builds corretos. Não colocar todos os assets diante da autorização |
| `request-timing.mjs` | Instrumenta bindings e expõe métricas agregadas; adaptador novo precisa preservar identidade do DB para cache, sem SQL/segredos em cabeçalhos |
| `units.mjs`, `unit-validation.mjs`, `unit-scope.mjs`, `import-units.mjs` | Cadastro mestre, tipos/elegibilidade, importação, INEP condicional, números escolares opcionais; NULL não é zero |
| `unit-deletion.mjs` | Exclusão privilegiada com prévia/confirmacão/auditoria; não executar como teste real |
| `collector.mjs`, `collector-v2.mjs`, `collector-v3.mjs`, `visit-routes.mjs`, `collector-access.mjs` | Compatibilidade dos questionários, visitas, estados, conflitos, dados recebidos e publicação. Não converter todas as visitas antigas ao último formulário |
| `environments.mjs` | Ambientes por ID e unidade, renomeação com histórico e recibos |
| `equipment-names.mjs`, `equipment-deletions.mjs`, `equipment-link-state.mjs` | Nome administrativo separado de hostname; arquivo de excluídos e distinção manual/vinculado/encerrado |
| `in-progress.mjs`, `in-progress-photos.mjs` | Leituras confirmadas de visitas abertas, rótulo PARCIAL, acesso desktop |
| `inventory-results.mjs`, `inventory-equipment.mjs` | Resultados oficiais/publicados e consulta paginada por ficha; fotografias do mesmo ID/unidade |
| `panel-read-cache.mjs` | Revisões D-110, ETag e catálogo estável por binding; jamais cache de autorização/GPS/presença |
| `panel-search.mjs`, `management-views.mjs` | Busca global, filtros, exportação e planejamento; não carregar a rede inteira por tecla |
| `photo-storage.mjs`, `google-auth.mjs` | Adaptadores de provedor, OAuth, renovação, criptografia e operações privadas Drive/R2 |
| `photo-read.mjs`, `photo-response.mjs`, `photo-gallery.mjs`, `photo-labels.mjs` | Leitura autenticada, ligação com alvo, status e galeria contextual |
| `photo-thumbnails.mjs` | Derivado até 320 × 320 / 64 KB no D1, somente após foto pronta; original no provedor privado |
| `agentes/index.mjs`, `agentes/nucleo/*`, `agent-crypto.mjs` | Enrollment, assinatura, chave pública, QR, claim, heartbeat, inventário, recibos e transações. Adaptador SQL faz parte da segurança |
| `agentes/connection.mjs`, `agentes/presence.mjs` | Origem confiável do IP público/provedor e presença; IP interno é dado separado do inventário |
| `agent-monitoring.mjs`, `monitoring-queries.mjs`, `communication-log.mjs` | Baseline de peças, cursor incremental, incidentes/reconexão/48 h, consulta compartilhada |
| `hardware-review.mjs`, `pending-indicators.mjs` | Decisão administrativa distinta de leitura do sino; indicadores separados e demandas no mapa |
| `provider-report.mjs`, `provider-report-history.mjs` | Escolha de uma observação completa por unidade; histórico semanal imutável |
| `service-desk.mjs` | Computadores por unidade/laboratório, demandas com contexto/histórico/versão e idempotência |
| `technical-dispatch.mjs` | Fila, atribuição até dois técnicos, capacidade individual, aceite com GPS, posição efêmera e conclusão |
| `dispatch-road-routing.mjs` | OSRM com ordem fixa do root, cache/limite global e validação geométrica; sem reta como fallback |
| `technician-avatars.mjs` | Upload/troca/exclusão apenas root; PNG derivado no Drive, versionamento e proteção de leitura |
| `d1-budget.mjs`, `d1-usage.mjs` | Erros de quota, uso oficial de Analytics, cache KV, avisos 70/85/95%; não são monitor genérico de servidor físico |

## Frontend e pontos de entrada

| Área | Arquivos principais e comportamento |
|---|---|
| Login/conta | `web/login.*`, `account.*`, versões collector; nomes reais no índice. Campos reais, senha provisória/troca no servidor |
| Shell desktop | `web/panel-shell.js`, `panel-status.js`, `painel.css`, entradas de bundle do build. Menu, pulso e indicadores compartilhados |
| Panorama/mapa | `web/desktop.js`, `desktop-map.js`, `map-geography.js`, `unit-map-palette.js`; filtros, unidade selecionada, sinais, hover, modais |
| Resultados/consulta | `desktop-results.js`, `desktop-inventory.js`, `desktop-progress.js` e auxiliares; não misturar published e parcial |
| Operações | `operations.html`, `operations.js`, auxiliares de atendimentos/rotas; `/computadores` e `/demandas` não são páginas do roteador antigo |
| Cadastro | `admin-units.js`, `unit-schema.js` e importação; root gerencia unidades/usuários, validação também no servidor |
| Coletor | `collector-v3.*`, `collector-drafts.js`, `collector-ui.js`, `collector-qr.js`, schemas; navegação por URL sem respostas/credenciais na URL |
| Técnico | `technician.html`, `technician.js`, `technician.css`; somente demandas atribuídas, aceite/andamento/impedimento/conclusão e Maps externo |

Assets locais incluem fontes, Leaflet e ícones; suas licenças precisam acompanhar o build. Imagens de referência visual não são conteúdo operacional. O build inclui listas explícitas e bundles versionados; usar `scripts/build-desktop.mjs` e `build-collector.mjs`, não copiar `web/` cru para produção.

## Fluxos e limites transacionais

1. **Login humano:** origem HTTPS → senha/PBKDF2 + pepper → sessão aleatória hash no DB → cookie `__Host-semed` → `current()` revalida sessão/usuário/credential_version em cada requisição. Escrita exige origem e CSRF; a exceção de OAuth/assinatura não pode ampliar todas as APIs.
2. **Coleta:** unidade existente → visita/assunto → trava/versão → gravação e autoria → ACK. Só após ACK o painel recebe PARCIAL. Conclusão manual valida fichas/fotos e gera o estado publicado; `data_json` e `published_json` não são sinônimos.
3. **Foto:** câmera/galeria → upload no provedor → metadados/estado ready → leitura protegida. Google e SQL não formam uma transação única: preservar reconciliação/filas de exclusão. Miniatura não substitui original.
4. **Agente:** desafio/cadastro → chave pública → QR temporário → claim humano autenticado com recibo → vínculo → mensagens assinadas. Atualização repetida/perda de ACK não pode duplicar inventário ou gerar novo vínculo.
5. **Hardware:** snapshot aceito → baseline/cursor → mudança confiável → evento → sino/mapa → parecer ou demanda. Leitura não significa aceite; demanda manual só termina por ação autorizada.
6. **Atendimento:** root ordena/atribui → técnico aceita com localização válida → posição ligada à sessão/atendimento → root vê rota pelas ruas → conclusão pela equipe remove posição. Endpoints de localização não viram rastreamento fora da demanda.
7. **Relatório:** heartbeat vivo validado registra conexão externa → seleção da observação completa mais recente por unidade → relatório atual ou snapshot da segunda-feira. Não reconstruir histórico anterior com dados atuais.
8. **Revalidação:** edição relevante + trigger incrementam revisão na mesma transação → próxima leitura invalida catálogo/ETag. Heartbeat/GPS não incrementam revisões de catálogo; são lidos frescos.

## Android e contrato de instalação

Código Java em `android/technician/src/br/gov/ma/pacodolumiar/semed/tecnico/`: `Api.java` fixa a origem HTTPS; `MainActivity.java` restringe navegação/WebView; `LocationService.java` mantém serviço de localização durante atendimento; `NoticeJob.java` usa notificações periódicas. [Guia Android](../../android/technician/README.md).

Alterar domínio exige rever origem permitida, cookies, API e distribuição. Atualização APK precisa da mesma assinatura privada; não executar build criando keystore novo por falta da cópia original. API 26+ e target 35 são configuração atual, não promessa de compatibilidade física universal.

## Ferramentas e testes de transferência

`scripts/document-schema.mjs` aplica SQL em SQLite vazio. `document-code-map.mjs` gera o inventário estático. `export-operation-manual.mjs` consolida guias em TXT. `check-doc-links.mjs` valida referências locais. `check-repository.mjs` confere índice Git; `check-outgoing-history.mjs origin/main` também procura assinaturas de segredos nas versões ainda não enviadas. Nenhum desses scripts autentica no D1 real.

Os testes usam fixtures e SQLite/workerd: segurança, domínio, publicação, Drive simulado, agentes, concorrência, presença, hardware, demandas, GPS/rotas, avatares, quotas e cache. Relação executada em `package.json`/CI. `tests/helpers` são infraestrutura de teste, não adaptador homologado de produção. Cada futura adaptação deve passar tanto os testes atuais quanto ensaios no destino com EXE/celular reais.
