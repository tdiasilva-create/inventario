# CONTRATO — vínculo por QR Code e API do agente Windows (integrado ao inventário SEMED)

Versão do contrato: **SEMED-Device v1 / protocolo 1.0** (pacote agente 0.1.6), integrado em 04/11/2026 como **proposta D-053** (ver `docs/00-governanca/DECISOES.md`), **revisado em 04/11 à tarde** após a revisão independente (REV-01 a REV-07). Situação: **implementado e testado localmente; não publicado; não homologado com o EXE real**.

Fontes de verdade, em ordem: (1) `revisoes/agente-0.1.6-fonte/contract/` (openapi.yaml, schemas, ASSINATURA.md, test-vectors); (2) o código integrado em `server/agentes/`; (3) este documento, que descreve o que o Worker **realmente** faz. Divergências entre (1) e (2) estão listadas na seção 9 e em `docs/04-dados-apis/DIGEST_AGENTE_0_1_6.md` (G.4).

## 1. Onde o contrato vive no sistema

| Componente | Arquivo | Papel |
|---|---|---|
| Despacho | `server/worker.mjs` | Rotas de **máquina** antes da sessão/Origin/CSRF (lista explícita); rotas **humanas** depois da sessão + CSRF do próprio Worker. |
| Montagem | `server/agentes/index.mjs` | Listas de rotas, configuração por variáveis, adaptação do usuário da sessão (`root/admin/operador/visualizador`) ao núcleo. |
| Núcleo | `server/agentes/nucleo/*.mjs` | Cópia do `mock-server/src` do pacote com patches marcados `[SEMED]` (R1–R5, quatro perfis, paginação). |
| Catálogo real | `server/agentes/catalogo.mjs` | Único ponto que conhece `units/environments/inspections/equipments`. A **ficha (`equipments`) é a fonte de verdade** de unidade/ambiente/posição. |
| Criptografia | `server/agent-crypto.mjs` | ECDSA P-256 / SHA-256, assinatura IEEE P1363 (r‖s, 64 bytes, base64url 86 caracteres), `key_id` = thumbprint RFC 7638 (43 caracteres). Verificado com os 15 vetores do pacote. |
| Banco | `migrations/0014_agentes.sql` | Tabelas `agent_*` + colunas novas em `equipments` (localização confirmada) e `agent_presence` (monotonia). |
| Coletor | `web/collector-qr.js`, `web/collector-v2.js` | Leitor local (BarcodeDetector ou jsQR vendorizado), prévia, confirmação, claim. |
| Painel | `web/desktop.js`, `web/desktop-inventory.js` | Estado do agente por ficha e janela "Dados do agente" (`/api/inventory/agent-status`). |

Nada do módulo cria catálogo paralelo (`ref_units`/`ref_equipment` não existem). Ficha nova pelo vínculo está **desligada** (`allowNewEquipment:false`): a ficha nasce pelo fluxo normal do coletor V2 e o claim usa `mode:'existing'`.

## 2. Autenticação

### 2.1 Máquina (agente) — assinatura por pedido, sem cookie, sem Origin, sem CSRF
Cabeçalhos obrigatórios em toda rota de máquina:

```
Authorization: SEMED-Device <device_id>            (depois do cadastro)
Authorization: SEMED-Enroll <challenge_id>         (somente POST /enrollments)
Authorization: SEMED-Install-Grant <codigo>        (somente POST /enrollment-challenge)
X-SEMED-Installation: <installation_id uuid>
X-SEMED-Key-Id: <thumbprint RFC 7638, 43 chars>
X-SEMED-Timestamp: <unix segundos>
X-SEMED-Nonce: <16–64 chars [A-Za-z0-9_-]>
X-SEMED-Signature: <base64url de r||s, 86 chars>
Content-Type: application/json; charset=utf-8   (sem BOM, sem query string)
```

String canônica assinada (sem LF final): `METHOD\nPATH\nUNIX_S\nNONCE\nSHA256HEX(corpo exato)`. Janela de relógio: ±300 s (`401 CLOCK_SKEW`). Nonce é único por `(key_id, nonce)` dentro da janela (`401 REPLAY`). Assinatura inválida: `401 AUTH_FAILED` / `401 BAD_SIGNATURE_FORMAT`. Chave revogada: `401 KEY_REVOKED`; dispositivo revogado: `403 DEVICE_REVOKED`.

### 2.2 Humano (coletor/painel) — sessão do Worker
Cookie `__Host-semed` + cabeçalho `X-CSRF-Token` + `Origin` igual ao do Worker (POST). Perfis:

| Rota humana | root | admin | operador | visualizador |
|---|---|---|---|---|
| POST `/api/root/agent-install-grants`, `/revoke`, `/api/root/agent-revoke`, `/api/root/agent-maintenance`; GET `/api/root/agent-install-grants`, `/api/root/agent-devices` | ✔ | ✖ | ✖ | ✖ |
| POST `/api/agent/v1/pairings/preview`, `/claim`; POST `/api/inventory/equipment-location` | ✔ | ✔ | ✔ | ✖ |
| GET `/api/agent/v1/pairings/catalog`, `/api/inventory/agent-status`, `/api/inventory/agent-history` | ✔ | ✔ | ✔ (consulta por ficha) | ✔ |

Unidades: por D-046 qualquer operador pode atuar em qualquer unidade ativa (`unit_ids:['*']` no adaptador). Nenhuma senha humana entra no agente; `administrador` **não** é mapeado para root.

## 3. Fluxo completo (estados)

```
root cria AUTORIZAÇÃO (grant: código mostrado 1 vez; só o hash é guardado; max_uses 1..1000; validade ≤168 h)
   └─ instalador no PC: POST enrollment-challenge (SEMED-Install-Grant)  → challenge (300 s)
        └─ POST enrollments (SEMED-Enroll, chave pública JWK + summary)  → 201 {device_id, enrollment_id, pairing_code, visual_code, expires_at(600 s)}
             agente mostra o QR {"type":"semed.agent.pairing","version":1,"enrollment_id","pairing_code","expires_at"} e o código visual XXX-XXX
             └─ operador no coletor: lê o QR → POST pairings/preview → confere summary + visual_code → POST pairings/claim (request_id, ficha existente, posição)
                  └─ servidor: 1 transação: link ativo + ficha versão+1 (ambiente/posição/location_state/registration='Agente') + histórico + recibo
                       └─ agente: POST enrollment-status (state linked) → POST pairings/confirm-device → heartbeat / inventory periódicos
```

Estados do dispositivo (`agent_devices.state`): `pending_pairing` → `linked` → (`revoked`). Estado do pedido (`agent_enrollments`): válido / `pairing_expired` / consumido (`consumed_at`) / bloqueado após 5 falhas (`429 PAIRING_LOCKED`). Renovação do QR na máquina: `POST enrollment-renew` (até 20 vezes).

## 4. Rotas de máquina (POST, JSON assinado)

| Rota | Autorização | Corpo (principais) | Resposta |
|---|---|---|---|
| `/api/agent/v1/enrollment-challenge` | `SEMED-Install-Grant` | `protocol_version, request_id, installation_id, public_key_jwk` | `201 {challenge_id, challenge, expires_at}` |
| `/api/agent/v1/enrollments` | `SEMED-Enroll <challenge_id>` | `protocol_version, request_id, installation_id, challenge_id, challenge, public_key_jwk, agent_version, summary{hostname, manufacturer, model, serial_hint, cpu_name, logical_processors, installed_memory_bytes, os_caption, os_build}` | `201 {device_id, enrollment_id, pairing_code, visual_code, expires_at, qr_payload}` |
| `/api/agent/v1/enrollment-status` | `SEMED-Device` | `protocol_version, request_id, installation_id` | `200 {state: pending_pairing|linked|pairing_expired|revoked, link?{link_id, equipment_id,…}, expires_at}` |
| `/api/agent/v1/enrollment-renew` | `SEMED-Device` | idem | `200 {pairing_code, visual_code, expires_at}` |
| `/api/agent/v1/pairings/confirm-device` | `SEMED-Device` | `…, link_id` | `200` (grava `device_confirmed_at`) |
| `/api/agent/v1/heartbeat` | `SEMED-Device` | `message_id, boot_id, sequence, collected_at, reason(periodic|startup|shutdown|suspend|resume), health{…}` (≤2 KiB) | `200 {ack, presence_updated:boolean}` — presença só avança se `(boot_id, sequence, collected_at)` for mais novo (R3). |
| `/api/agent/v1/inventory` | `SEMED-Device` | `message_id, inventory_id, boot_id, sequence, collected_at, previous_inventory_id, content_hash, sections{system,cpu,memory,storage,gpu,network,os,accounts…}` (≤64 KiB) | `200 {ack, duplicate?}` — idempotente por `(device_id, message_id)` + hash do corpo (`409 MESSAGE_ID_CONFLICT` se corpo diferente). |
| `/api/agent/v1/config` | `SEMED-Device` | — | `200 {heartbeat_interval_seconds, …}` |
| `/api/agent/v1/rotate-key` | `SEMED-Device` (chave atual) | `new_public_key_jwk, …` | `200` (sobreposição de 900 s) |

Limites por IP (R4): 600 desafios/cadastros por hora por IP (NAT de escola), além do limite por autorização (`max_uses`). Abuso continua recebendo `429 RATE_LIMITED`.

## 5. Rotas humanas

### 5.1 `POST /api/agent/v1/pairings/preview`
Corpo: `{enrollment_id, pairing_code, unit_id}`. Resposta `200`: `{enrollment_id, visual_code, expires_at, summary, equipment_suggestions:[{equipment_id, asset, environment_name, already_linked, reasons[]}], server_time}`. Sugestões são somente dicas (até 50 fichas da unidade, uma consulta — R5), nunca união automática. Erros: `404 ENROLLMENT_NOT_FOUND`, `422 PAIRING_CODE_INVALID`, `410 PAIRING_EXPIRED|PAIRING_CONSUMED`, `403 DEVICE_REVOKED` (R1), `429 PAIRING_LOCKED`.

### 5.2 `POST /api/agent/v1/pairings/claim`
Corpo enviado pelo coletor V2:
```json
{"request_id":"<uuid persistente desta tentativa>","enrollment_id":"…","pairing_code":"…","unit_id":"…",
 "environment_id":"<ambiente da ficha>","inspection_id":"<vistoria aberta>",
 "equipment":{"mode":"existing","equipment_id":"<ID permanente>","expected_version":<versão vista>},
 "position":{"label":"Bancada 2 / PC 7","description":"opcional"},
 "visual_code_confirmed":true,
 "lock_token":"<token de /api/collector/equipment-lock do PRÓPRIO usuário>",
 "location_change":{"confirmed":true,"reason":"≥5 caracteres"}}
```
**Política compartilhada com o coletor (REV-02/REV-03/R2-B):** unidade ativa, vistoria aberta da mesma unidade, trava de edição (`equipment_locks`) do próprio usuário com token válido e **assunto dos computadores não concluído** (V2: seção F; legado: F ou G) — pré-verificadas (erros legíveis) **e** verificadas dentro do batch por guardas `agent_tx_guard`. Erros: `409 LOCK_REQUIRED` (sem trava válida própria), `409 EQUIPMENT_LOCKED` (trava de outro usuário), `422 INSPECTION_CLOSED`, `422 UNIT_INACTIVE`, `422 SECTION_COMPLETED` (reabrir o assunto no coletor; nunca reaberto silenciosamente). A ficha usada pode ser um **rascunho mínimo** (`data.draft=true`, criado por `equipment-save` com `draft:true`), que continua bloqueando a conclusão do assunto F até o salvamento completo (REV-05).
(`location_change` só na segunda tentativa, após `409 LOCATION_MISMATCH`.)

Resposta `201`: `{link_id, device_id, equipment_id, equipment_created:false, equipment_status:null, equipment_version, unit_id, environment_id, position{label,description}, location_state:'confirmada_em_visita', location_change_applied, linked_by, linked_at, duplicate:false}`. Repetição do mesmo `request_id` com o mesmo corpo devolve o **mesmo recibo** com `duplicate:true` (R2: recibo gravado na mesma transação do vínculo). Mesmo `request_id` com corpo diferente: `409 REQUEST_ID_CONFLICT`.

Efeitos em uma única `db.batch()` (D1): guardas `agent_tx_guard` (dispositivo ainda `pending_pairing`, pedido não consumido, **unidade ativa, vistoria aberta, trava própria**, versão da ficha igual à esperada) → `agent_equipment_links` ativo → `UPDATE equipments` (`environment_id`, `data_json.environment`, `data_json.registration='Agente'`, `position_label/description`, `location_state`, `location_confirmed_by/at`, `version+1`) → `agent_equipment_location_history` → `collection_history(event='agent_linked')` → `agent_claim_requests` (recibo) → **`inspections.revision+1`/`updated_at`** → `agent_devices.state='linked'` → consumo do pedido → auditoria. Qualquer guarda falsa aborta tudo (`409`/`403`/`422`), sem vínculo parcial.

Erros: `422 VISUAL_CODE_NOT_CONFIRMED`, `422 EQUIPMENT_NOT_FOUND|EQUIPMENT_CATEGORY` (só desktop/notebook), `422 ENVIRONMENT_NOT_IN_UNIT`, `422 INSPECTION_CLOSED` (vistoria aberta obrigatória — `AGENTES_EXIGIR_VISTORIA`, padrão sim), `409 EQUIPMENT_VERSION_CONFLICT` (recarregar a ficha), `409 LOCATION_MISMATCH` (`details.current_location`), `409 EQUIPMENT_ALREADY_LINKED` (ficha já tem agente ativo → reconciliação root), `409 DEVICE_ALREADY_LINKED`, `409 ALREADY_LINKED` (pedido já consumido por outro claim), `409 EQUIPMENT_IN_OTHER_UNIT`/`TRANSFER_REQUIRES_ROOT`, `410 PAIRING_EXPIRED|PAIRING_CONSUMED`, `403 DEVICE_REVOKED`, `422 NEW_EQUIPMENT_DISABLED` (mode `new`).

### 5.3 Demais rotas humanas
- `GET /api/agent/v1/pairings/catalog?unit_id=&cursor=&q=` → `{items[], next_cursor}` paginado (50 por página; R5).
- `GET /api/inventory/agent-status?equipmentId=` → `{equipment_id, equipment_status, official_record{asset, category, version, location: null | {environment_id, environment_name, position_label, location_state} (ÚLTIMA PUBLICAÇÃO; null se a ficha nunca foi publicada), partial: boolean, location_history[]}, draft_location: null | {…, inspection_id, provenance:'rascunho_visita_aberta'} (alteração da visita aberta ainda não publicada — R2-C), agent:null | {device_id, device_state, agent_version, link{link_id, linked_by, linked_at, device_confirmed_at, ended_at}, presence{state, last_live_contact_at, last_observation_collected_at, last_received_at, last_boot_id, last_sequence, health, threshold_seconds, note}, current_inventory{inventory_id, collected_at, received_at, queue_gaps, quality{}, sections{}}, baseline, history_gaps}}`. Estados de presença: `communicating`, `communicating_with_failure`, `no_recent_communication`, `reported_shutdown`, `reported_suspend`, `never_communicated`, `revoked`. **Ausência de comunicação nunca é exibida como "desligado".**
- `GET /api/inventory/agent-history?equipmentId=` → histórico de vínculos/localização.
- `POST /api/inventory/equipment-location` (operador/admin/root) `{request_id, equipment_id, expected_version, environment_id, position{label,description}, reason(≥5), inspection_id, lock_token}` → mesma política do coletor (REV-02); **nunca altera `registration`**; grava `location_state='confirmada_em_visita'` com quem/quando; na mesma transação: ficha (versão+1), histórico do módulo, `collection_history(event='equipment_location_changed')`, `inspections.revision+1` e recibo idempotente (`agent_location_requests`). Resposta `200 {equipment_id, equipment_version, location, duplicate}`.
- `GET /api/agent/v1/pairings/claim-status?request_id=` e `GET /api/inventory/equipment-location-status?request_id=` (operador/admin/root) → recibo do **próprio usuário** para aquele `request_id`: `{found:false}` ou `{found:true, status, created_at, body:{…, duplicate:true}}`. Base da recuperação de resposta perdida no coletor (R2-A): o comando é congelado e o recibo é consultado antes de reenviar o mesmo corpo.
- `GET /api/inventory/equipment?unitId=` → cada item traz `data` (publicação), `position_label`/`location_state` da publicação e `partial: null | {environment, environment_name, position_label, location_state, updated_at, inspection_id}` quando a visita aberta já alterou a localização (R2-C).
- `GET /api/root/agent-devices?unit_id=&state=&q=&cursor=` (root) → `{items:[{device_id, state, hostname, agent_version, link{…, active, ended_at, end_reason} (vínculo ativo ou, na falta, o ÚLTIMO histórico), equipment{id, asset, category, unit_id, unit_name, environment_name, position_label, location_state}, presence{last_live_contact_at, last_collected_at, silent_minutes, health}, revoked_at, revoke_reason}], next_cursor}` (50 por página).
- `POST /api/root/agent-maintenance` `{}` (root) → executa a mesma manutenção do cron e devolve contagens `{nonces, receipts, rate, challenges, snapshots, at}`.
- `POST /api/root/agent-install-grants` `{expires_in_seconds≤604800, max_uses≤1000, note?}` → `201 {grant_id, grant_code (exibido uma única vez), expires_at, max_uses}`; `GET` lista sem o código; `POST …/revoke {grant_id}`; `POST /api/root/agent-revoke {device_id, reason}` encerra vínculo ativo e marca o dispositivo (futuras assinaturas → `403 DEVICE_REVOKED`; QR pendente deixa de valer — R1).

### 5.3-bis Ciclo da visita e publicação (R2-C)
Claim e `equipment-location` gravam a ficha com `inspection_id` = vistoria aberta e com ambiente/posição/estado/confirmação **também no `data_json`**; `published_json` continua sendo escrito apenas por `/api/collector/finish`. Consultas oficiais (`/api/inventory/equipment`, `agent-status.official_record`) leem a **última publicação**; a alteração da visita aberta aparece em `partial` / `draft_location` e na lista PARCIAL (`in-progress-equipment`). Telemetria do agente nunca altera a ficha nem publica.

### 5.4 Exclusão de unidade e vínculo órfão (REV-01)
`POST /api/root/unit-delete` revoga, **na mesma transação**, dispositivos/instalações/chaves dos agentes vinculados às fichas da unidade (auditoria `agent_revoked`, `revoke_reason='unit_deleted:<unidade>'`) e encerra os vínculos (`end_reason='unit_deleted'`) antes de apagar as fichas; a prévia informa `impact.agentLinks`. Heartbeat/inventário de um dispositivo cujo vínculo ativo aponta para ficha inexistente recebem `403 DEVICE_NOT_LINKED` e o vínculo é encerrado (`end_reason='equipment_missing'`); nada é recriado por telemetria. Unidade **inativa** não é exclusão: a telemetria do agente já vinculado continua aceita; vínculo novo e mudança de localização exigem unidade ativa.

### 5.5 Manutenção agendada
`server/worker.mjs` exporta `scheduled()`; `wrangler.jsonc` (painel) define `triggers.crons`. Expurga nonces/recibos/limites/desafios vencidos e aplica retenção de snapshots por máquina preservando o snapshot atual, a linha de base e todo o histórico de vínculos/localização/auditoria.

## 6. Idempotência e concorrência (demonstradas em `tests/agentes.test.mjs` e `tests/revisao-independente.test.mjs`)
- `request_id` do claim: mesmo corpo → mesmo recibo (`duplicate:true`); falha após gravar (ex.: auditoria) → `503` e a repetição devolve o recibo, sem segundo vínculo.
- Revogação durante o batch do claim: guarda `agent_tx_guard` aborta (`403`), nenhuma linha gravada.
- `message_id` do heartbeat/inventário: recibo por `(device_id, message_id)`; corpo diferente → `409`.
- Presença monotônica: `setPresenceIfNewer` em SQL (`WHERE boot diferente e coleta mais nova, ou mesmo boot e sequência maior`); heartbeat atrasado → `presence_updated:false`.
- Versão da ficha: `expected_version` + `UPDATE … WHERE version=?` dentro do batch.
- Política do coletor dentro do batch: fechar a vistoria ou perder a trava entre a pré-verificação e a gravação aborta o claim/localização sem gravar nada (REV-03).
- Mudança de ambiente pelo formulário do coletor (`equipment-save`) zera `position_label/description`, `location_state='declarada'` e a confirmação anterior (REV-04); a reconfirmação é feita pela rota de localização.

## 7. QR Code (lado do coletor)
- Conteúdo aceito: JSON ≤512 caracteres com `type="semed.agent.pairing"`, `version=1`, `enrollment_id` UUID, `pairing_code` base64url 22–64. Outros QR são recusados com mensagem legível; o conteúdo nunca é navegado nem enviado a terceiros.
- Decodificação local: `BarcodeDetector` quando disponível; senão `web/vendor/jsqr/jsQR.js` (1.4.0, Apache-2.0, sha256 `bc40c8a1…0859`, `ORIGEM.txt`). Sem câmera/permissão: "Escolher imagem do QR" (galeria), mesmo decodificador.
- A câmera do leitor é separada da fotografia de evidência; nada é gravado no envio.
- Confirmação humana obrigatória: caixa "O código de conferência é o mesmo exibido na máquina" → envia apenas `visual_code_confirmed:true` (o código visual nunca é digitado nem transmitido pelo coletor).
- Posição (`label` ≤64) é obrigatória pelo contrato; ambiente vem da ficha (etapa 2 da ficha V2).
- O coletor **não grava nada antes de abrir o leitor** (REV-05): ler → prévia (com ambiente e posição no próprio cartão) → "Confirmar vínculo" grava o rascunho mínimo (`draft:true`, mesmo ID permanente), obtém a trava e faz o claim; após `201`, atualiza `itemVersion=equipment_version` e `registration='Agente'`; o seletor de modo fica bloqueado em ficha vinculada; o rascunho só deixa de bloquear a conclusão de F após o salvamento completo.

## 8. Compatibilidade com o instalador/EXE 0.1.6
Conferido nos fontes C# (`agent/src/Semed.Agent.Core/{Signing,ApiClient,AgentEngine,Models}.cs`, `Ui/Program.cs`): mesmas rotas (`enrollment-challenge`, `enrollments`, `enrollment-status`, `enrollment-renew`, `pairings/confirm-device`, `heartbeat`, `inventory`, `config`), mesmos cabeçalhos e canônico, mesmo payload do QR, tela mostra apenas QR + "Código de conferência". **Não executado o EXE** nesta entrega; não há alteração no agente (item 18.10 não se aplica). O agente precisa apontar para o endereço do **coletor** (`inventario-semed-lumiar`) ou do painel — ambos montam as mesmas rotas de máquina sobre o mesmo D1; a URL base fica na configuração do instalador (fora deste repositório).

## 9. Divergências/ambiguidades mantidas sob registro (não inventadas)
- `inspection_id` obrigatório no schema × opcional no código do pacote: aqui é **obrigatório na prática** (`AGENTES_EXIGIR_VISTORIA=true`, padrão).
- `equipment_status`: a ficha real devolve `publicado`/`rascunho` (derivado de `published_json`), não `rascunho_parcial`.
- `serial_hint` 4 × 6 caracteres: aceito o que o agente envia (string ≤32), só exibido.
- OpenAPI do pacote não documenta `GET grants`, `revoke`, `catalog`, `max_uses`; este documento prevalece para o integrado.
- `/health` do pacote **não** é exposto.
- Admin não cria autorizações nem revoga (root-only, D-031/D-035): decisão reversível, registrada em PENDENCIAS_E_DECISOES.

## Atualização de contrato — D-058 (05/11/2026)
O cadastro de novas máquinas em produção não exige SEMED-Install-Grant. AGENTES_EXIGIR_AUTORIZACAO=nao seleciona o modo automático. POST enrollment-challenge recebe protocolo/request_id/agent_version sem Authorization e devolve o mesmo desafio temporário. POST enrollments continua assinado com SEMED-Enroll e ECDSA P1363, no mesmo formato; o marcador cadastro-aberto é interno. Nenhum campo novo precisa ser enviado pelo EXE 0.1.8.

Não misturar autorização de instalação (removida) com autenticação do agente ou do usuário (mantidas). Telemetria só após vínculo ativo com ficha existente e usuário autorizado. Revogação, idempotência, proteção contra replay/clonagem e política de localização permanecem. Sem vínculo por 30 dias: cadastro automático nunca vinculado expira por revogação auditada, sem apagar a identidade ou reutilizar seu ID. Cadastros por lote e vínculos antigos preservados. A tela do root deixa de oferecer emissão de lotes; consulta histórica por API continua disponível.

As seções anteriores que exigem grant são históricas para produção e permanecem válidas apenas quando a configuração restritiva for explicitamente selecionada. Registro completo em DECISOES.md D-058; testes/evidências em CADASTRO_AUTOMATICO_2026-11-05.md.
