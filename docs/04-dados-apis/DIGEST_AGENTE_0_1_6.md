# DIGEST TÉCNICO — PACOTE AGENTE SEMED 0.1.6 (contrato de máquina 1.0) PARA INTEGRAÇÃO NO WORKER/D1 DO INVENTÁRIO

Data: 2026-11-04. Base exclusiva: arquivos sob `revisoes/` (somente leitura) e `REVISAO_PACOTE_AGENTE_SEMED_0_1_6.txt`.
Tudo abaixo descreve o que ESTÁ nos arquivos; divergências entre arquivos são marcadas com **[DIVERGÊNCIA]**; decisões ainda abertas, com **[DECISÃO]**.

Abreviações de caminho (todas relativas a `/home/claude/inventario-v2/revisoes/agente-0.1.6-fonte/`):
- `OAS` = `contract/openapi.yaml`
- `ASS` = `contract/ASSINATURA.md`
- `MUD` = `contract/MUDANCAS_ROTAS_HUMANAS_0_1_6.md`
- `MSG` = `contract/schemas/messages.schema.json`; `COM` = `contract/schemas/common.schema.json`; `HB` = `contract/schemas/heartbeat.schema.json`; `INV` = `contract/schemas/inventory.schema.json`
- `IDK` = `docs/IDENTIDADE_E_CHAVES.md`; `DIC` = `docs/DICIONARIO_DE_CAMPOS.md`; `POL` = `docs/POLITICA_FILA_RETRY_RECURSOS.md`; `PEN` = `docs/PENDENCIAS.md`
- `W` = `mock-server/src/worker.mjs` (núcleo de referência; idêntico por hash a `modulo-servidor/src/nucleo/worker.mjs`, cf. REVISAO §6)
- `D1` = `mock-server/src/d1-store.mjs`; `MEM` = `mock-server/src/store.mjs`; `CAT` = `mock-server/src/catalogo.mjs`; `CRY` = `mock-server/src/crypto.mjs`; `VAL` = `mock-server/src/validate.mjs`; `RC` = `mock-server/src/reference-client.mjs`
- `IDX` = `modulo-servidor/src/index.mjs`; `SIS` = `modulo-servidor/src/sistema.mjs`; `HOM` = `modulo-servidor/src/autenticacao-homologacao.mjs`; `PAG` = `modulo-servidor/src/pagina-vincular.mjs`
- `MIG` = `modulo-servidor/migrations/0100_agentes.sql`; `MIG-P` = `migrations-proposed/0100_agentes_PROPOSTA.sql`
- `REP` = `revisoes/agente-0.1.6-analise/reproducoes.mjs`; `RES` = `revisoes/agente-0.1.6-analise/resultado-reproducoes.txt`
- `REV` = `/home/claude/inventario-v2/REVISAO_PACOTE_AGENTE_SEMED_0_1_6.txt`

Observação de versão: `OAS:4` declara `1.0.2-proposta` e `MUD:3` diz que o `openapi.yaml` descreve a 0.1.5 e que o complemento 0.1.6 só altera rotas HUMANAS; as rotas de MÁQUINA são "inalteradas, protocolo 1.0" (`MUD:1`). O código `W` é a fonte mais precisa das formas reais de requisição/resposta; o OAS omite vários campos (anotado caso a caso).

---------------------------------------------------------------------------------------------------

## A. ROTAS HTTP DO CONTRATO

### A.0 Regras transversais (valem para todas as rotas atendidas por `W`)

- Corpo: `Content-Type` obrigatório casando `^application/json(\s*;\s*charset=utf-8)?$` (case-insensitive) → senão 400 `UNSUPPORTED_CONTENT_TYPE` (`W:131-134`). Corpo vazio → 400 `EMPTY_BODY`; UTF-8 inválido → 400 `INVALID_UTF8`; BOM → 400 `BOM_NOT_ALLOWED`; JSON malformado ou não-objeto → 400 `INVALID_JSON` (`W:139-153`). `Content-Length` ou tamanho real acima do limite → 413 `PAYLOAD_TOO_LARGE` (`W:135-138`). Limites: heartbeat 2048 B, inventory 65536 B, demais 8192 B (`W:43`).
- Query string em qualquer `POST /api/agent/v1/*` → 400 `QUERY_NOT_ALLOWED` (`W:1178-1180`). GET (catálogo) aceita query.
- Campos extras em qualquer corpo → 422 `VALIDATION_FAILED` ("campo não previsto no contrato") (`VAL:83-85`); erro de validação com status 400 vira `BAD_REQUEST`, com 413 vira `PAYLOAD_TOO_LARGE` (`W:1226-1228`).
- Datas ISO 8601 UTC com `Z`, regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,7})?Z$` (`COM:11-14`); o servidor emite sem milissegundos (`W:97-99`). UUIDs minúsculos v1–v8 (`COM:6-10`, `CRY:8`).
- Envelope de erro (obrigatório): `{code:^[A-Z0-9_]{2,64}$, message≤512, retryable:boolean, correlation_id:uuid, server_time:iso, details?:object}` (`COM:186-217`, `W:118-128`). Respostas trazem `content-type: application/json; charset=utf-8` e `cache-control: no-store` (`W:111-116`). 429 e 503 trazem `retry-after` em segundos (`W:157-165`, OAS:87-94). Exceção interna → 503 `INTERNAL_UNAVAILABLE` retryable (`W:1231`), sem stack.
- Limites de taxa (janela fixa; `D1:82-90`): tabela abaixo em A.4.
- Quem chama: **MÁQUINA** = EXE assinado (SEMED-Device/Enroll/Install-Grant); **HUMANA** = navegador com sessão + CSRF + Origin (`humanSession`, `W:267-274`); **ROOT** = humana com `role==='root'` (`W:287-289`).

### A.1 Rotas de MÁQUINA (`/api/agent/v1/*`, todas `POST`)

| # | Rota | Auth | Estados aceitos |
|---|---|---|---|
| 1 | `/api/agent/v1/enrollment-challenge` | `Authorization: SEMED-Install-Grant <código>` (sem assinatura) | — |
| 2 | `/api/agent/v1/enrollments` | `Authorization: SEMED-Enroll <challenge_id>` + Key-Id/Timestamp/Nonce/Signature (chave NOVA) | — |
| 3 | `/api/agent/v1/enrollment-status` | SEMED-Device | pending_pairing, linked |
| 4 | `/api/agent/v1/enrollment-renew` | SEMED-Device | pending_pairing |
| 5 | `/api/agent/v1/pairings/confirm-device` | SEMED-Device | linked |
| 6 | `/api/agent/v1/heartbeat` | SEMED-Device | linked |
| 7 | `/api/agent/v1/inventory` | SEMED-Device | linked |
| 8 | `/api/agent/v1/config` | SEMED-Device | pending_pairing, linked |
| 9 | `/api/agent/v1/rotate-key` | SEMED-Device (chave ATUAL) + `proof` (chave NOVA) | pending_pairing, linked |

Roteamento: `W:1182-1192`. Estado fora da lista → 403 `DEVICE_NOT_LINKED` se `pending_pairing`, senão 409 `INVALID_STATE` (`W:232-235`).

**1. POST /api/agent/v1/enrollment-challenge** (`W:337-369`)
- Request: `{protocol_version:"1.0", request_id:uuid, agent_version:string≤32}` — todos obrigatórios, sem extras (`MSG:123-143`, `W:343-346`).
- Ordem no servidor: rate `challenge-ip:<ip>` 30/3600 s **antes** de qualquer validação (`W:340`); header malformado → 401 `INVALID_GRANT`; grant inexistente (hash) → 401 `INVALID_GRANT`; `revoked_at` → 403 `GRANT_REVOKED`; esgotada (`uses_count ≥ max_uses`) → 409 `GRANT_USED`; expirada → 410 `GRANT_EXPIRED`; rate `challenge-grant:<grant_id>` max(10, 3×max_uses)/3600 s (`W:353`).
- Response 200: `{challenge_id:uuid, challenge:b64url 43 chars (32 bytes), expires_at:iso (+300 s), server_time}` (`MSG:144-167`, `W:354-368`). Desafio gravado com `used_by=null`.
- IP: `cf-connecting-ip` → `x-mock-client-ip` → `'local'` (`W:167-169`).

**2. POST /api/agent/v1/enrollments** (`W:376-477`)
- Headers: `Authorization: SEMED-Enroll <challenge_id uuid>`, `X-SEMED-Key-Id` (thumbprint, 43 chars), `X-SEMED-Timestamp`, `X-SEMED-Nonce`, `X-SEMED-Signature` (assinatura com a chave nova; **não** há `X-SEMED-Installation` — `installation_id` vai no corpo; `RC:88-94`).
- Request (`MSG:168-209`): `{protocol_version:"1.0", request_id:uuid, installation_id:uuid, challenge_id:uuid, challenge:b64url≤64, public_key_jwk:{kty:"EC",crv:"P-256",x:43,y:43} (sem `d`; `alg/use/key_ops/ext` tolerados pelo validador `CRY:73-77` mas proibidos pelo schema `COM:99`), agent_version≤32, summary}`.
- `summary` (`MSG:51-122`, `VAL:236-250`): `{hostname:string 1..255 (obrig.), manufacturer?, model?, serial_hint? (≤16; schema diz "4 últimos caracteres prefixados por ••••"; validador aceita até 6 visíveis **[DIVERGÊNCIA menor]** `VAL:244-246`), cpu_name?, logical_processors?:int≤4096, installed_memory_bytes?:int, os_caption?, os_build?}` (strings ≤128, nullable).
- Ordem no servidor: rate `enroll-ip:<ip>` 30/3600 (`W:379`); header → 401 `AUTH_FAILED`; corpo/validações → 422; `challenge_id` ≠ header → 422 `CHALLENGE_MISMATCH`; thumbprint(jwk) ≠ `X-SEMED-Key-Id` → 422 `KEY_ID_MISMATCH`; desafio inexistente ou `challenge` diferente (timing-safe) → 401 `AUTH_FAILED`; desafio expirado → 410 `CHALLENGE_EXPIRED`; assinatura (timestamp/nonce/replay) conforme B; **reenvio idempotente**: se `installation_id` já existe e a chave `key_id` pertence a essa instalação → 200 `{device_id, enrollment_id, state, pairing_code:null, visual_code:null, expires_at, renew_required:(state==='pending_pairing'), server_time}` (`W:406-422`) — observe que o reenvio ainda exige desafio existente e não expirado (não exige desafio não usado: `getChallenge` não filtra `used_by`); `installation_id` existente com outra chave → 409 `IDENTITY_CONFLICT` (+ `agent_identity_conflicts`); `key_id` já registrada por outra instalação → 409 `IDENTITY_CONFLICT`; grant revogada → 403 `GRANT_REVOKED`; expirada → 410 `GRANT_EXPIRED`; transação `createEnrollmentAtomic` (consome desafio + incrementa `uses_count` + cria device/installation/key/enrollment; `D1:122-147`) falhando → 409 `CHALLENGE_USED` | 409 `GRANT_USED` | 409 `IDENTITY_CONFLICT` (`W:455-464`).
- Response 201 (`MSG:210-269`): `{device_id:uuid, enrollment_id:uuid, state:"pending_pairing", pairing_code:b64url 22 chars (16 bytes), visual_code:"XXX-XXX", expires_at:iso (+600 s), renew_required:false, poll_after_seconds:10, server_time}` (`W:466-476`). `pairing_code` é devolvido UMA vez (servidor guarda só `sha256 hex`).

**3. POST /api/agent/v1/enrollment-status** (`W:512-530`)
- Request (`MSG:270-289`): `{protocol_version:"1.0", request_id:uuid, installation_id?:uuid}`; `installation_id` presente e ≠ autenticado → 422 `INSTALLATION_MISMATCH` (`W:239-243`).
- Rate `status:<device_id>` 120/3600 s.
- Response 200 (`MSG:290-382`): `{device_id, enrollment_id, state:"pending_pairing"|"pairing_expired"|"linked", expires_at: iso|null (só quando device pendente; `W:526`), link: null | {link_id, equipment_id (string≤64), unit_name|null, environment_name|null, position_label|null, linked_at, device_confirmed_at|null}, server_time}`. `pairing_expired` é derivado (`enr.expires_at ≤ now` com device ainda `pending_pairing`; `W:521`). Os nomes de unidade/ambiente/posição vêm da FICHA (`officialLocation`, `W:480-510`), não do vínculo.

**4. POST /api/agent/v1/enrollment-renew** (`W:532-554`; `x-semed-status: adicional-proposta` OAS:141)
- Request: igual ao 3.
- `renewals ≥ 20` → 429 `RENEWAL_LIMIT` (`W:539`, cfg `maxRenewals` `W:31`); rate `renew:<device_id>` 6/600 s; pedido já consumido → 409 `ALREADY_LINKED`.
- Efeito: novo `code_hash`, novo `visual_code`, `expires_at=+600 s`, `failed_attempts=0`, `renewals+1` (`D1:185-189`). O código anterior deixa de valer.
- Response 200: `{device_id, enrollment_id, state:"pending_pairing", pairing_code, visual_code, expires_at, server_time}` (sem `renew_required`/`poll_after_seconds`; ambos opcionais no schema).

**5. POST /api/agent/v1/pairings/confirm-device** (`W:827-838`)
- Request (`MSG:607-629`): `{protocol_version:"1.0", request_id:uuid, installation_id?:uuid, link_id:uuid}`.
- `link_id` ≠ vínculo ativo do device → 409 `LINK_MISMATCH`. Grava `device_confirmed_at` uma única vez (COALESCE; `D1:255-258`).
- Response 200: `{link_id, device_confirmed_at:iso, server_time}` (OAS só diz "Confirmado").

**6. POST /api/agent/v1/heartbeat** (`W:840-884`; limite 2 KiB)
- Request (`HB:1-43`, `VAL:109-140`), sem extras: `{protocol_version:"1.0", message_id:uuid, installation_id:uuid, boot_id:uuid, sequence:int≥1, collected_at:iso, agent_version:string 1..32, uptime_seconds:int≥0, reason?: startup|periodic|resume|suspend|shutdown|network_change, health:{inventory: ok|partial|unsupported|access_denied|timeout|error|not_run, pending_messages:int 0..1e6, dropped_messages?:int≥0, last_error_code?:string|null ≤64}, latest_inventory_id?: uuid|null, performance?: null | {cpu_percent:number 0..100, sample_seconds:number 0..600, memory_total_bytes:int, memory_available_bytes:int}}`.
- Rate `hb:<device_id>` 60/600 s. Idempotência por `(device_id, message_id)` + hash do corpo (A.4/B.6).
- Response 200 ACK (`COM:219-264`): `{message_id, accepted:true, duplicate:boolean, server_received_at:iso, presence_updated:boolean, config_version:int}` (`W:874-881`). Semântica de presença em F.
- Erros: 409 `MESSAGE_ID_CONFLICT` (mesmo message_id, corpo diferente); 401/403 conforme B; 413; 422; 429; 503.

**7. POST /api/agent/v1/inventory** (`W:900-963`; limite 64 KiB)
- Request (`INV:1-289`, `VAL:193-234`), sem extras: `{protocol_version:"1.0", message_id:uuid, inventory_id:uuid, installation_id:uuid, boot_id:uuid, sequence:int≥1, collected_at:iso, previous_inventory_id: uuid|null (obrigatório, nullable), agent_version?:≤32, collector_version?:≤32, reason?: startup|periodic|change_confirmed|forced|after_link, content_hash?: ^[0-9a-f]{64}$, queue_gaps?: null | [1..16 × {gap_id:uuid (único na msg), dropped_count:int≥1, dropped_change_count:int 0..dropped_count, first_dropped_collected_at:iso, last_dropped_collected_at:iso}], sections:{system (obrig.), cpu?, memory?, storage?, gpu?, network?, os?, accounts?}}`.
- Cada seção (`COM:101-185`, `VAL:142-191`): `{quality: ok|partial|unsupported|access_denied|timeout|error (obrig.), source?:≤128, collected_at?:iso, duration_ms?:int 0..600000, error_code?:string|null ≤64, truncated?:boolean (true exige quality=partial), data: object|null (obrig.; ok/partial exigem objeto)}`. `checkDeep` (`VAL:88-107`): profundidade ≤6, strings ≤512, listas ≤64, objetos ≤64 chaves, chaves ≤64 chars (violação → 413). Checagens semânticas: `memory.installed_bytes`/`visible_bytes`/`modules[].capacity_bytes` inteiros ou null (texto "8 GB" → 422 `VALIDATION_FAILED`); `cpu.processors[].cores≤1024`, `logical_processors≤4096`, `max_clock_mhz≤100000`; `storage.physical_disks[].size_bytes` int; `accounts.data` só com `enabled_local_count, disabled_local_count, interactive_session_count, console_session_count, remote_session_count, named_accounts_collected` e `named_accounts_collected` **deve ser `false`** (`VAL:182-190`). Campos das seções detalhados em F.
- Rate `inv:<device_id>` 30/3600 s.
- Response 200 ACK: `{message_id, accepted:true, duplicate:boolean, server_received_at, stored_inventory_id:uuid, became_current:boolean, is_current:boolean, baseline_set:boolean, queue_gaps_recorded:int}` (`W:950-960`). Mesmo `inventory_id` + mesmo conteúdo (outro `message_id`) → `duplicate:true` e `server_received_at` original, sem regravar (`W:908-934`, `W:953-954`).
- Erros: 409 `INVENTORY_ID_CONFLICT` (mesmo inventory_id com `snapshot_hash` diferente ou de outro device; `details.stored_collected_at` quando mesmo device; `W:909-913`); 409 `MESSAGE_ID_CONFLICT`; demais como heartbeat.

**8. POST /api/agent/v1/config** (`W:965-978`)
- Request (`MSG:630-652`): `{protocol_version:"1.0", request_id:uuid, installation_id?:uuid, current_config_version?:int≥0}` (ignorado pelo servidor).
- Response 200 (`MSG:653-735`): `{config_version:int, policy:{config_version, heartbeat_interval_seconds (60..3600), heartbeat_jitter_percent (0..50), inventory_interval_seconds (900..604800), inventory_force_send_seconds (3600..2592000), change_confirmation_delay_seconds (30..600), performance_enabled:bool, performance_interval_seconds (300..3600), collect_named_accounts:false (const), collect_network_addresses:bool, collect_domain_name:bool}, bounds:{<param>:[min,max]} (`W:60-67`), server_time, note}`. Valores padrão: `W:44-56` (300/20/21600/86400/90/false/600/false/false/false; `config_version:1`).

**9. POST /api/agent/v1/rotate-key** (`W:980-1015`)
- Request (`MSG:736-785`): `{protocol_version:"1.0", request_id:uuid, installation_id?:uuid, new_public_key_jwk:JWK pública, new_key_id:thumbprint, proof:{timestamp:int, nonce:b64url 22..64, signature:b64url 86}}`.
- Validações: chave autenticada deve estar `active` (senão 409 `INVALID_STATE`); thumbprint(new jwk) ≠ `new_key_id` → 422 `KEY_ID_MISMATCH`; igual à atual → 422 `SAME_KEY`; `proof.timestamp` com mesma tolerância (401 `CLOCK_SKEW`); prova inválida → 401 `AUTH_FAILED`; nonce da prova (registrado sob `new_key_id`) repetido → 401 `REPLAY`; `rotateKeyAtomic` falha → 409 `IDENTITY_CONFLICT` (nova chave já existe) ou 409 `INVALID_STATE`.
- Response 200: `{new_key_id, old_key_id, old_key_valid_until:iso (+900 s), server_time}` (`W:1014`).

### A.2 Rotas HUMANAS (sessão do inventário + CSRF + Origin)

Autenticação humana: função `auth` injetada; `csrf:true` em POST (Origin ∈ `humanOrigins` → senão 403 `ORIGIN_REJECTED`; `X-CSRF-Token` timing-safe → senão 403 `CSRF_REJECTED`), `csrf:false` em GET (`W:247-261` mock; `SIS:18-39` contrato do adaptador). Usuário deve ser `{id:string, name?, role:'root'|'operador'|'visualizador', unit_ids:[...]|['*']}`; qualquer outro `role` (inclusive `admin`) → 401 `SESSION_REQUIRED` (`W:270-273`) **[DECISÃO: matriz de 4 perfis do inventário, cf. REV §7 "LOGIN E PERMISSÕES"]**. Acesso a unidade: `unit_ids` contém `'*'` ou o `unit_id` (`W:285`).

| # | Método/Rota | Perfis | Observação |
|---|---|---|---|
| 10 | `POST /api/agent/v1/pairings/preview` | root, operador, visualizador (qualquer autenticado) | HUMANA apesar do prefixo (`OAS:14-15`, `W:1194`) |
| 11 | `POST /api/agent/v1/pairings/claim` | root, operador (`W:621`) | HUMANA; consome o QR |
| 12 | `GET /api/agent/v1/pairings/catalog[?unit_id=]` | qualquer autenticado | nova em 0.1.6 (`MUD:10`); não está no OAS |
| 13 | `POST /api/inventory/equipment-location` | root, operador (`W:784`) | adicional-proposta |
| 14 | `GET /api/inventory/agent-status?equipmentId=` | qualquer autenticado com acesso à unidade | |
| 15 | `GET /api/inventory/agent-history?equipmentId=&cursor=` | idem | |
| 16 | `POST /api/root/agent-install-grants` | root | |
| 17 | `GET /api/root/agent-install-grants` | root | nova em 0.1.6 (`MUD:8`); não está no OAS |
| 18 | `POST /api/root/agent-install-grants/revoke` | root | nova em 0.1.6 (`MUD:9`); não está no OAS |
| 19 | `POST /api/root/agent-revoke` | root | corpo não descrito no OAS (`OAS:296-303`) |
| 20 | `POST /api/root/agent-reconcile` | root | sempre 501 `NOT_IMPLEMENTED` (`W:1199-1202`) |
| 21 | `POST /api/root/hardware-event-review` | root | sempre 501 `NOT_IMPLEMENTED` |

Observação: para 20/21 a sessão humana é exigida ANTES do 501 (`W:1201`).

**10. POST /api/agent/v1/pairings/preview** (`W:574-609`)
- Request (`MSG:383-403`): `{enrollment_id:uuid, pairing_code:b64url 22..64, unit_id?:string≤64}`.
- Rate `preview-user:<user.id>` 60/600 s. Checagem do código (`checkPairingCode`, `W:556-567`): pedido inexistente → 404 `ENROLLMENT_NOT_FOUND`; consumido → 410 `PAIRING_CONSUMED`; expirado → 410 `PAIRING_EXPIRED`; `failed_attempts ≥ 5` → 429 `PAIRING_LOCKED`; hash diferente → incrementa `failed_attempts` e 422 `PAIRING_CODE_INVALID`. **Não consome** o código. **Não verifica** se o device foi revogado (ver E/R1).
- Response 200 (não há schema; `W:601-608`): `{enrollment_id, visual_code:"XXX-XXX", expires_at, summary:<summary do cadastro>, equipment_suggestions:[{equipment_id, asset, category, version, location:<officialLocation>, already_linked:boolean, reasons:['final_da_serie_coincide'?]}], server_time}`. Sugestões só quando `unit_id` informado e acessível; percorre TODOS os computadores da unidade (`W:586-600`; ver R5). `officialLocation` = `{unit_id, unit_name, environment_id, environment_name, position_label, position_description, location_state, location_confirmed_by, location_confirmed_at, equipment_version, provenance:'ficha_patrimonial'}` (`W:480-496`).

**11. POST /api/agent/v1/pairings/claim** (`W:620-777`)
- Request (`MSG:404-540`), sem extras: `{request_id:uuid, enrollment_id:uuid, pairing_code:b64url 22..64, unit_id:string≤64, environment_id:string≤64, inspection_id:string≤64 (obrigatório no schema; no código obrigatório só se `requireInspection` ou se presente — `W:637`, `MUD:11` **[DIVERGÊNCIA schema×código]**), equipment: {mode:"existing", equipment_id:uuid (ou texto `^[A-Za-z0-9_.:-]{1,64}$` quando `equipmentIdFormat='texto'`, `W:277-283`), expected_version:int≥1} | {mode:"new", asset?:string|null ≤64, category?: desktop|notebook (padrão desktop `W:715`)}, position:{label:string 1..64, description?:string|null ≤280}, visual_code_confirmed:true (const), location_change?: null | {confirmed:true, reason:string 5..280}}`.
- Ordem no servidor: perfil (403 `FORBIDDEN` para visualizador); `request_id`; **idempotência por `user.id|request_id`**: pedido anterior com mesmo hash de corpo → repete status/corpo com `duplicate:true`; hash diferente → 409 `REQUEST_ID_CONFLICT` (`W:625-632`); validações de forma; `visual_code_confirmed !== true` → 422 `VISUAL_CODE_NOT_CONFIRMED`; `mode:'new'` com `allowNewEquipment=false` → 422 `NEW_EQUIPMENT_DISABLED`; rate `claim-user:<user.id>` 30/600 s; unidade inexistente → 422 `UNIT_NOT_FOUND`; sem acesso → 403 `UNIT_FORBIDDEN`; inativa → 422 `UNIT_INACTIVE`; ambiente inexistente ou de outra unidade → 422 `ENVIRONMENT_NOT_IN_UNIT`; vistoria (se informada) de outra unidade → 422 `INSPECTION_NOT_IN_UNIT`; não `open` → 422 `INSPECTION_CLOSED`; `existing`: ficha inexistente → 422 `EQUIPMENT_NOT_FOUND`; de outra unidade → 409 `EQUIPMENT_IN_OTHER_UNIT`; categoria ∉ {desktop, notebook} → 422 `EQUIPMENT_CATEGORY`; `version ≠ expected_version` → 409 `EQUIPMENT_VERSION_CONFLICT` (`details:{current_version, current_location}`); ambiente ≠ ficha ou (`position_label` da ficha não nulo e ≠ informado) sem `location_change` → 409 `LOCATION_MISMATCH` (`details:{current_location, requested}`); `new`: `asset` já existente → 409 `ASSET_EXISTS` (`details.equipment_id`); então `checkPairingCode` (404/410/429/422 como no preview); `claimAtomic` (`D1:202-237`) falha → 410 `PAIRING_CONSUMED` | 410 `PAIRING_EXPIRED` | 422 `PAIRING_CODE_INVALID` ("Código substituído por renovação") | 409 `DEVICE_ALREADY_LINKED` | 409 `EQUIPMENT_ALREADY_LINKED` | 409 `EQUIPMENT_VERSION_CONFLICT` | 422 `EQUIPMENT_NOT_FOUND` | 503 `RETRY` (colisão de id de ficha nova) | 404 `ENROLLMENT_NOT_FOUND` (`W:742-756`).
- Efeito atômico: ficha atualizada (`environment_id, position_label, position_description, location_state='confirmada_em_visita', location_confirmed_by=user.id, location_confirmed_at=now, version+1`) ou ficha nova (`status:'rascunho', version:1, created_by, inspection_id`); entrada de histórico (`kind`: `ficha_criada` | `localizacao_confirmada` | `posicao_definida_e_confirmada` | `mudanca_de_localizacao`; `source:'pairing_claim'`); enrollment `consumed_at=now, code_hash=NULL`; `agent_equipment_links` inserido; device `state='linked'` (`W:674-741`, `D1:206-224`).
- Response 201 (`MSG:541-606`, `W:759-776`): `{link_id, device_id, equipment_id, equipment_created:boolean, equipment_status:string ('rascunho_parcial' se criada — **[DIVERGÊNCIA]** a ficha é gravada com `status:'rascunho'` `W:723` mas a resposta diz `'rascunho_parcial'` `W:764`; senão `eq.status`), equipment_version:int, unit_id, environment_id, position:{label, description}, location_state: declarada|confirmada_em_visita|precisa_revisao, location_change_applied:boolean, linked_by:user.id, linked_at:iso, duplicate:false}`. O recibo humano é gravado APÓS a transação (`W:775`; ver R2).

**12. GET /api/agent/v1/pairings/catalog[?unit_id=]** (`W:1085-1103`)
- Sem `unit_id`: `{user:{id,name,role}, units:[{unit_id,name,active}] (só acessíveis), policy:{require_inspection, allow_new_equipment, max_grant_uses, max_grant_hours}, server_time}`.
- Com `unit_id` (não acessível → 403 `UNIT_FORBIDDEN`): acrescenta `unit_id, environments:[{environment_id,unit_id,name}], inspections:[{inspection_id,unit_id,state:'open'}], equipment:[{id, asset, category, version, unit_id, environment_id, position_label, already_linked}]`. Sem paginação; uma consulta de vínculo por equipamento (ver R5).

**13. POST /api/inventory/equipment-location** (`W:783-825`)
- Request (`MSG:805-859`): `{request_id:uuid, equipment_id:uuid|texto, expected_version:int≥1, environment_id:string≤64, position:{label 1..64, description?≤280}, reason:string 5..280}`.
- Idempotência `user.id|request_id` (409 `REQUEST_ID_CONFLICT`); ficha inexistente → 404 `EQUIPMENT_NOT_FOUND`; sem acesso à unidade da ficha → 403 `UNIT_FORBIDDEN`; ambiente inexistente → 422 `ENVIRONMENT_NOT_FOUND`; ambiente de outra unidade → 409 `TRANSFER_REQUIRES_ROOT`; versão → 409 `EQUIPMENT_VERSION_CONFLICT`. Grava `location_state='declarada'`, `location_confirmed_by/at=null`, `version+1`, histórico `source:'equipment_location'`, `kind:'mudanca_de_localizacao'`.
- Response 200: `{equipment_id, equipment_version, location:<officialLocation>, duplicate:false}`.

**14. GET /api/inventory/agent-status?equipmentId=** (`W:1026-1069`)
- 404 `EQUIPMENT_NOT_FOUND`; 403 `UNIT_FORBIDDEN`. Device resolvido pelo vínculo ativo ou, na falta, pelo ÚLTIMO vínculo (mesmo encerrado) (`W:1018-1024`) — só o mais recente, não toda a sucessão (REV §7 "FICHA E HISTÓRICO").
- Sem agente: `{equipment_id, official_record:{location, version}, agent:null, server_time}`.
- Com agente: `{equipment_id, equipment_status, official_record:{asset, category, version, provenance:'ficha_patrimonial', location, location_history:[≤10 × {at, by, source, inspection_id, version_before, version_after, kind, reason, before, after}]}, agent:{device_id, device_state, agent_version, link:{link_id, linked_by, linked_at, device_confirmed_at, ended_at}|null, presence:<presenceView> (ver F), current_inventory:{inventory_id, collected_at, queue_gaps, received_at, provenance:'reportado_pelo_agente', quality:{<seção>:quality}, sections}|null, baseline:{inventory_id, version, set_at}|null, history_gaps:{gap_count, dropped_count, dropped_change_count, first_dropped_collected_at, last_dropped_collected_at, note}|null}, server_time}`.

**15. GET /api/inventory/agent-history?equipmentId=&cursor=** (`W:1071-1082`)
- `cursor` = offset inteiro ≥0 (padrão 0; inválido → 400 `BAD_CURSOR`), página fixa de 20, ordem `collected_at, inventory_id` ASC (`D1:313-319`).
- Response 200: `{equipment_id, items:[{inventory_id, collected_at, received_at, reason, content_hash}], next_cursor:string|null}`.

**16. POST /api/root/agent-install-grants** (`W:1105-1130`)
- Request: `{expires_in_seconds?:int 300..maxGrantTtlSeconds (padrão 86400; teto padrão 7 d), note?:string|null ≤140, max_uses?:int 1..maxGrantUses (padrão 1; teto padrão 1000)}` — `max_uses` não está no schema `MSG:786-804` mas está em `MUD:7` e no código.
- Response 201: `{grant_id:uuid, grant_code:b64url 32 chars (24 bytes), expires_at, max_uses, single_use:boolean}`. Só o `sha256 hex` do código é gravado.

**17. GET /api/root/agent-install-grants** (`W:1140-1143`): `{items:[≤100 × {grant_id, created_by, created_at, expires_at, max_uses, uses_count, revoked_at, note, state:'ativa'|'esgotada'|'expirada'|'revogada'}], note, server_time}` (`W:1132-1138`).

**18. POST /api/root/agent-install-grants/revoke** (`W:1145-1155`): `{grant_id:uuid, reason:string 3..280}` → 200 `grantView` | 404 `GRANT_NOT_FOUND`.

**19. POST /api/root/agent-revoke** (`W:1157-1167`): `{device_id:uuid, reason:string 1..280}` → 200 `{device_id, state:'revoked', revoked_at}` | 404 `DEVICE_NOT_FOUND`. Efeitos em B.8.

### A.3 Rotas somente de desenvolvimento/homologação (NÃO portar para produção)

- `GET /health` → `{ok:true, mock:!auth, protocol_version:"1.0", server_time}` — está no roteador padrão (`W:1212`), inclusive no `export default` do Worker; decidir se mantemos (não é usada pelo agente).
- `mock-server/src/dev-routes.mjs` (só com `extensions`, fora do `export default`): `GET /dev` (página HTML simuladora), `POST /dev/login {user_id}` (cria sessão fictícia `semed_dev_session` + `csrf_token`), `GET /dev/catalog`, `POST /dev/fault {mode:'503'|'drop_after_store'|'none', count, path_suffix}` (injeção de falhas).
- Módulo (`IDX:64-83`, `MUD:13-14`): `GET /agentes` (302 → `/agentes/vincular`), `GET /agentes/vincular` (HTML com CSP e nonce), `GET /agentes/entrar` (HTML; 404 se homologação desligada), `POST /agentes/entrar {senha}` (login de homologação: cookie `semed_agentes_h` HMAC-SHA-256 com a própria senha, usuário fixo `root-homologacao`, `unit_ids:['*']`, 8 h; `HOM:23-40`), `GET /agentes/sessao` (`{user:{id,name,role,unit_ids}, csrf_token, modulo}`), `GET /agentes/saude` (`{ok, modulo, protocol_version, modo, catalogo, decisoes:{...}}`).
- `modulo-servidor/migrations/0101_catalogo_REFERENCIA_somente_homologacao.sql` e `seed.mjs`: catálogo fictício `ref_*` — **não aplicar no D1 oficial** (REV §8).

### A.4 Tabela de limites de taxa e janelas (todos em `W`, janela fixa persistida em `agent_rate_limits`)

| Chave | Limite | Janela | Onde |
|---|---|---|---|
| `challenge-ip:<ip>` | 30 | 3600 s | `W:340` (antes de validar o header) |
| `challenge-grant:<grant_id>` | max(10, 3×max_uses) | 3600 s | `W:353` |
| `enroll-ip:<ip>` | 30 | 3600 s | `W:379` |
| `status:<device_id>` | 120 | 3600 s | `W:518` |
| `renew:<device_id>` | 6 | 600 s | `W:540` |
| `preview-user:<user_id>` | 60 | 600 s | `W:580` |
| `claim-user:<user_id>` | 30 | 600 s | `W:657` |
| `hb:<device_id>` | 60 | 600 s | `W:845` |
| `inv:<device_id>` | 30 | 3600 s | `W:905` |

Outros tempos: `clockSkewSeconds 300`, `pairingTtlSeconds 600`, `challengeTtlSeconds 300`, `maxPairingFailures 5`, `maxRenewals 20`, `liveWindowSeconds 120`, `presenceToleranceSeconds 120`, `keyOverlapSeconds 900`, `receiptTtlSeconds 7 d`, `maxGrantUses 1000`, `maxGrantTtlSeconds 7 d` (`W:25-38`). O módulo permite sobrescrever `heartbeatIntervalSeconds`, `requireInspection`, `allowNewEquipment`, `maxGrantUses`, `maxGrantTtlSeconds`, `equipmentIdFormat` por variáveis de ambiente (`IDX:10-21, 56-98`).

### A.5 Códigos de erro (consolidado a partir de `W`, `VAL`, `SIS`)

- 400: `UNSUPPORTED_CONTENT_TYPE`, `EMPTY_BODY`, `INVALID_UTF8`, `BOM_NOT_ALLOWED`, `INVALID_JSON`, `QUERY_NOT_ALLOWED`, `BAD_CURSOR`, `BAD_REQUEST`.
- 401: `AUTH_FAILED`, `CLOCK_SKEW` (retryable, `details.tolerance_seconds`), `BAD_SIGNATURE_FORMAT`, `KEY_REVOKED`, `REPLAY`, `INVALID_GRANT`, `SESSION_REQUIRED`.
- 403: `REVOKED`, `DEVICE_NOT_LINKED`, `GRANT_REVOKED`, `ORIGIN_REJECTED`, `CSRF_REJECTED`, `FORBIDDEN`, `UNIT_FORBIDDEN`.
- 404: `NOT_FOUND`, `ENROLLMENT_NOT_FOUND`, `EQUIPMENT_NOT_FOUND` (status/location), `GRANT_NOT_FOUND`, `DEVICE_NOT_FOUND`.
- 409: `IDENTITY_CONFLICT`, `GRANT_USED`, `CHALLENGE_USED`, `INVALID_STATE`, `MESSAGE_ID_CONFLICT`, `INVENTORY_ID_CONFLICT`, `REQUEST_ID_CONFLICT`, `ALREADY_LINKED`, `LINK_MISMATCH`, `EQUIPMENT_IN_OTHER_UNIT`, `EQUIPMENT_VERSION_CONFLICT`, `LOCATION_MISMATCH`, `ASSET_EXISTS`, `DEVICE_ALREADY_LINKED`, `EQUIPMENT_ALREADY_LINKED`, `TRANSFER_REQUIRES_ROOT`.
- 410: `GRANT_EXPIRED`, `CHALLENGE_EXPIRED`, `PAIRING_CONSUMED`, `PAIRING_EXPIRED`.
- 413: `PAYLOAD_TOO_LARGE`.
- 422: `VALIDATION_FAILED`, `CHALLENGE_MISMATCH`, `KEY_ID_MISMATCH`, `INSTALLATION_MISMATCH`, `VISUAL_CODE_NOT_CONFIRMED`, `NEW_EQUIPMENT_DISABLED`, `PAIRING_CODE_INVALID`, `UNIT_NOT_FOUND`, `UNIT_INACTIVE`, `ENVIRONMENT_NOT_IN_UNIT`, `ENVIRONMENT_NOT_FOUND`, `INSPECTION_NOT_IN_UNIT`, `INSPECTION_CLOSED`, `EQUIPMENT_NOT_FOUND` (claim), `EQUIPMENT_CATEGORY`, `SAME_KEY`.
- 429 (retryable, `retry-after`): `RATE_LIMITED`, `PAIRING_LOCKED`, `RENEWAL_LIMIT`.
- 501: `NOT_IMPLEMENTED`; `LOGIN_NAO_INTEGRADO` (`SIS:38`, só enquanto o adaptador não existe).
- 503 (retryable): `INTERNAL_UNAVAILABLE`, `RETRY`, `INJECTED_FAULT` (dev).
- Exemplos oficiais em `contract/examples/error-*.json` (400 INVALID_JSON, 401 CLOCK_SKEW/REPLAY, 403 REVOKED, 409 MESSAGE_ID_CONFLICT, 410 PAIRING_EXPIRED, 413 PAYLOAD_TOO_LARGE, 422 VALIDATION_FAILED, 429 RATE_LIMITED, 503 INTERNAL_UNAVAILABLE).
- Reação do agente por classe (`POL:31-41`): rede/429/5xx → mantém item, backoff 15 s·2ⁿ (máx 30 min, jitter ±20 %), respeita `Retry-After` até 6 h; 401 `CLOCK_SKEW` → corrige carimbo e tenta uma vez; 401 outros → pausa 15 min·2ⁿ (máx 6 h); 403 `REVOKED` → para tudo; 403 `DEVICE_NOT_LINKED` → volta a consultar status; 400/413/422 → quarentena `rejected/`; 409 → `conflict/`. Redirecionamentos HTTP não são seguidos (`POL:42`).

---------------------------------------------------------------------------------------------------

## B. AUTENTICAÇÃO DE MÁQUINA (SEMED-Device v1) — EXATA

### B.1 Chave
- ECDSA **P-256** com SHA-256, uma chave por instalação, gerada na máquina (CNG, *Microsoft Software Key Storage Provider*, não exportável, escopo da conta virtual `NT SERVICE\SemedInventoryAgent`; nome `SEMED-Agent-<installation_id>`; TPM opcional `use_tpm`) (`ASS:6-12`, `IDK:8`, `IDK:40-43`). **Não é HMAC nem Ed25519.**
- Servidor guarda só a JWK pública `{kty:"EC",crv:"P-256",x,y}` (`agent_keys.public_jwk`, `MIG:58-66`); JWK com `d` é recusada (`CRY:75`).
- `key_id` = thumbprint RFC 7638 = base64url(SHA-256 de `{"crv":"P-256","kty":"EC","x":"…","y":"…"}`) — 43 chars (`ASS:12`, `CRY:85-90`). Servidor recalcula; divergência → 422 `KEY_ID_MISMATCH`.
- Vetores de interoperabilidade (Web Crypto ↔ .NET) em `contract/test-vectors/signatures.json`: 3 chaves de TESTE (`webcrypto-test-key`, `rfc7517-a1-public` só thumbprint, `dotnet-test-key`) e 12 casos (`webcrypto:*` 4 positivos + 3 negativos; `dotnet:*` 4 positivos + 1 negativo DER). Cada caso traz `method, path, timestamp, nonce, body, body_sha256_hex, canonical, signature, expect_valid`. `contract/tools/vectors.mjs verify` reverifica com `CRY`. Usar como teste de aceite da nossa verificação.

### B.2 Cabeçalhos (rotas SEMED-Device) (`ASS:38-48`, `W:212-219`, `RC:50-60`)
| Cabeçalho | Conteúdo | Validação no servidor |
|---|---|---|
| `Authorization` | `SEMED-Device <device_id>` (UUID; público, não é segredo) | regex `^SEMED-Device ([0-9a-f-]{36})$` + UUID_RE |
| `X-SEMED-Installation` | `installation_id` UUID | UUID_RE; `inst.device_id === device_id` |
| `X-SEMED-Key-Id` | thumbprint 43 chars | `^[A-Za-z0-9_-]{43}$`; `key.installation_id === installation_id` |
| `X-SEMED-Timestamp` | segundos Unix UTC | `^\d{9,11}$` |
| `X-SEMED-Nonce` | base64url 22–64 chars (16 bytes → 22) | `W:184-188` |
| `X-SEMED-Signature` | base64url 86 chars (P1363 r‖s 64 bytes, sem padding) | `W:190-194`; DER → 401 `BAD_SIGNATURE_FORMAT` |
| `Content-Type` | `application/json` | A.0 |

Variações: desafio → `Authorization: SEMED-Install-Grant <código>` sem assinatura; cadastro → `Authorization: SEMED-Enroll <challenge_id>` + Key-Id/Timestamp/Nonce/Signature com a chave NOVA e sem `X-SEMED-Installation` (`ASS:50-52`, `RC:92`).

### B.3 String canônica e assinatura (`ASS:14-36`, `CRY:62-68`)
Cinco linhas unidas por `\n`, **sem LF final**:
```
<MÉTODO maiúsculo>\n<caminho exato sem query, ex. /api/agent/v1/heartbeat>\n<timestamp unix s>\n<nonce>\n<sha256 hex minúsculo dos BYTES EXATOS do corpo>
```
- O hash é dos bytes enviados (espaços, ordem de campos, acentos e LF final contam; vetor `webcrypto:espacos-significativos` usa corpo `{ "a" : 1 }\n`).
- Assinatura: `ECDsa.SignData(bytes, SHA256, IeeeP1363FixedFieldConcatenation)` no .NET; `crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'})` no servidor (`CRY:98-109`); decodificação base64url canônica estrita (rejeita padding/bits sobrando, `CRY:17-27`).

### B.4 Ordem de verificação no servidor (`authDevice` `W:212-237` + `verifySigned` `W:196-209`; normativa `ASS:55-63`)
1. Formato de `Authorization`/`X-SEMED-Installation`/`X-SEMED-Key-Id` → 401 `AUTH_FAILED`.
2. Device, instalação e chave existem e são coerentes (`inst.device_id===deviceId`, `key.installation_id===installationId`) → senão 401 `AUTH_FAILED`.
3. `device.state==='revoked'` ou `inst.revoked_at` → 403 `REVOKED`; `key.status==='revoked'` → 401 `KEY_REVOKED`; `key.status==='retiring'` com `valid_until ≤ now` → 401 `KEY_REVOKED`.
4. Timestamp: formato → 401 `AUTH_FAILED`; |now − ts| > 300 s → 401 `CLOCK_SKEW` (retryable; `details.tolerance_seconds:300`; `server_time` no envelope). Nunca desligado.
5. Formato do nonce → 401 `AUTH_FAILED`; formato da assinatura → 401 `BAD_SIGNATURE_FORMAT`.
6. Assinatura sobre a string canônica recalculada (método da requisição, `url.pathname`, header ts, header nonce, sha256 do corpo lido) → 401 `AUTH_FAILED`.
7. Registro do nonce **somente após assinatura válida**, chave `(key_id, nonce)`, expiração `now + 2×300 s + 60 s` (`W:207`); já existente e não expirado → 401 `REPLAY` (`D1:93-98`: `INSERT … ON CONFLICT DO UPDATE … WHERE expires_at <= now RETURNING`).
8. Se a chave usada é `active` e é `inst.current_key_id`, as chaves `retiring` da instalação são revogadas (`retireOtherKeys`, `W:231`, `D1:155-157`) — "antiga vale até o 1º uso da nova".
9. Estado do device permitido para a rota (A.1) → 403 `DEVICE_NOT_LINKED` / 409 `INVALID_STATE`.
10. Corpo: `installation_id` opcional no corpo deve ser igual ao autenticado → 422 `INSTALLATION_MISMATCH`.

### B.5 Relógio
Agente estima diferença via `server_time`/`Date`; se > 60 s corrige **apenas** o carimbo da assinatura (não `collected_at`) e registra aviso (`ASS:68-70`, `POL:36`). O servidor não emite header `Date` explicitamente (depende da plataforma); `server_time` vai em todo erro e na maioria das respostas.

### B.6 message_id / inventory_id / sequence / boot_id
- `message_id` (uuid) imutável entre tentativas do mesmo envio; cada tentativa tem novo timestamp/nonce/assinatura, mesmos bytes (`ASS:64-66`, `POL:21`). Servidor deduplica por `(device_id, message_id)` + `body_hash` (`withReceipt`, `W:320-334`): igual → ACK anterior com `duplicate:true`; diferente → 409 `MESSAGE_ID_CONFLICT`. Recibo gravado APÓS os efeitos (`W:331-332`), TTL 7 d.
- `inventory_id` (uuid) identifica o snapshot; imutável; `snapshot_hash = sha256(canonicalJson(corpo sem message_id))` (`W:895-898`); reutilização com conteúdo diferente → 409 `INVENTORY_ID_CONFLICT`.
- `sequence`: inteiro ≥1 "monotônico por instalação (persistido), compartilhado entre heartbeat e inventário" (`HB:13`). Uso no servidor: presença (F). `boot_id`: novo a cada início do **serviço** (`HB:12`, `PEN:43`).
- `request_id` (uuid) em todas as mensagens; usado para idempotência só nas rotas humanas (`claim`, `equipment-location`) sob a chave `user.id|request_id`; nas rotas de máquina simples (status/renew/confirm/config/rotate) é apenas validado, sem recibo.

### B.7 Fluxo de autorização de instalação (grant) → desafio → cadastro → QR → vínculo
1. **Emissão (ROOT, humana)** `POST /api/root/agent-install-grants` → `grant_code` (24 bytes b64url = 32 chars) exibido UMA vez; armazenado `code_hash` (`W:1114-1129`, tabela `agent_install_grants`). `max_uses` 1..1000 (lote por pendrive), `expires_in_seconds` 300..7 d. Entrega ao instalador por arquivo protegido (`/GRANTFILE=`; `PEN:50`; REV §7 "não copiar exemplos antigos de grant na linha de comando").
2. **Desafio (máquina)**: `SEMED-Install-Grant <código>` → servidor localiza por `sha256(código)`, valida revogação/esgotamento/expiração e emite `challenge` (32 bytes aleatórios) ligado ao `grant_id`, validade 300 s, `used_by=null`.
3. **Cadastro (máquina)**: agente gera `installation_id` (UUID v4, 1ª execução, `state.json`) e a chave CNG; envia `enrollments` assinado com a chave nova; servidor consome **desafio e uso da grant atomicamente** (`createEnrollmentAtomic`, `D1:122-147`: `UPDATE challenges SET used_by … WHERE used_by IS NULL` + guard; `UPDATE grants SET uses_count+1 … WHERE revoked_at IS NULL AND uses_count < max_uses` + guard; inserts de device/installation/key/enrollment). Gera `device_id`, `enrollment_id` (servidor), `pairing_code` + `visual_code` + `expires_at` (+600 s).
4. **QR** (C) exibido na máquina; agente consulta `enrollment-status` a cada 10 s enquanto QR válido, 5 min depois (`POL:16`; `poll_after_seconds:10`). Pode renovar (`enrollment-renew`).
5. **Vínculo (humano)**: preview (não consome) → claim (consome código + cria vínculo + atualiza ficha, atômico). Device passa a `linked`.
6. **Confirmação (máquina)**: `enrollment-status` devolve `link`; agente chama `confirm-device {link_id}`; passa a enviar heartbeat/inventory (`reason:'after_link'` previsto no enum).

### B.8 Revogação (`W:1157-1167`, `D1:170-180`)
`POST /api/root/agent-revoke {device_id, reason}` em um `db.batch`: `agent_devices.state='revoked', revoked_at/by/reason`; `agent_installations.revoked_at`; todas as `agent_keys` da instalação → `status='revoked'`; vínculos ativos → `ended_at=now, end_reason='revoked'`; auditoria `agent_revoked`. Efeito: 403 `REVOKED` em TODAS as rotas de máquina (inclusive `enrollment-status`/`config`); agente "para tudo" (`IDK:35`). Histórico preservado (snapshots, vínculo encerrado). **Não** invalida um `agent_enrollments` pendente (`code_hash` continua) → defeito R1 (E). Não existe rota para revogar grant **via** device, nem reativação. Revogação de grant: `agent-install-grants/revoke` (só impede novos cadastros; cadastros já feitos continuam, cf. teste `lote-e-modulo.test.mjs:69`).

### B.9 Renovação e rotação
- Renovação de QR: `enrollment-renew` (A.1 #4). Sem renovação de grant (emitir outra).
- Rotação de chave: `rotate-key` assinado com a chave ATUAL (`active`), corpo com nova JWK e `proof` assinado com a chave NOVA sobre a string canônica `POST\n/api/agent/v1/rotate-key#proof\n<ts>\n<nonce>\n<sha256hex("<device_id>\n<installation_id>\n<key_id_atual>\n<new_key_id>")>` (`W:1000-1001`). Efeito atômico (`D1:158-169`): antiga → `retiring` com `valid_until=+900 s`; nova → `active`; `agent_installations.current_key_id` = nova. A antiga morre no 1º uso da nova (B.4 passo 8) ou aos 15 min. O agente 0.1.6 **não dispara rotação automática** (`IDK:36`, `PEN` "Rotação automática").

### B.10 Identidades e onde vivem (`IDK:3-15`)
`installation_id` (agente, UUID v4, `ProgramData\SEMED\Agent\state.json`; sobrevive a reparo/atualização; perde-se com `/PURGE`/reinstalação do SO) · chave+`key_id` (agente, CNG) · `device_id`, `enrollment_id` (servidor; copiados para `state.json`) · `equipment_id` (inventário; o agente **nunca** envia como vínculo) · `unit_id`/`environment_id`/posição (operador no claim) · `boot_id` (agente, memória) · `message_id`/`inventory_id` (agente, fila). Hostname/IP/MAC/série/UUID SMBIOS/MachineGuid são sinais, não identidade. Reinstalação do SO ⇒ nova `installation_id` ⇒ novo cadastro ⇒ claim na mesma ficha recusado com 409 `EQUIPMENT_ALREADY_LINKED` até root revogar o anterior (`IDK:31`); `agent-reconcile` é 501.

---------------------------------------------------------------------------------------------------

## C. QR DE PAREAMENTO

- Conteúdo (JSON, ≤512 bytes, `MSG:22-50`; exemplo `contract/examples/qr-pairing.json`), sem campos extras:
  `{"type":"semed.agent.pairing","version":1,"enrollment_id":"<uuid>","pairing_code":"<b64url 22..64>","expires_at":"<iso Z>"}`.
- `pairing_code`: 16 bytes aleatórios (`randomToken(16)`, `W:372`) → 22 chars; servidor guarda `sha256 hex` em `agent_enrollments.code_hash`; comparação timing-safe (`W:561-562`). Sensível durante a validade. Não aparece em logs do agente (`POL:50`).
- TTL: 600 s (`pairingTtlSeconds`, `W:28`; `IDK:22` "10 min"); `expires_at` gravado no servidor é o que vale — o `expires_at` do QR é informativo.
- Uso único: consumido atomicamente no claim (`consumed_at=now`, `code_hash=NULL`; `D1:220`); nova tentativa → 410 `PAIRING_CONSUMED`. Renovação invalida o anterior (novo hash). 5 falhas de código → 429 `PAIRING_LOCKED` até renovar (zera `failed_attempts`). Máx. 20 renovações.
- **Código visual de conferência** (`visual_code`): 6 símbolos do alfabeto `ACDEFGHJKLMNPQRTUVWXY34679` (sem 0/O, 1/I, 2/Z, 5/S, 8/B), formato `XXX-XXX` (`W:89-95`; schema `^[A-Z0-9]{3}-[A-Z0-9]{3}$` `MSG:16-21`). Mostrado na máquina (resposta de `enrollments`/`renew`) e devolvido ao humano no `preview`; o claim exige `visual_code_confirmed:true` — **o servidor não recebe nem compara o código visual**; é só uma afirmação do operador (`W:638-640`). "NÃO substitui o pairing_code" (`MSG:20`). O código visual **não** está no QR.
- O que o servidor confia/não confia: confia apenas em `enrollment_id` como chave de busca e `pairing_code` como segredo (verificado por hash). **Não** há URL/host, unidade, ambiente, permissões ou identidade de usuário no QR (REV §3: "O QR não define escola, permissões ou endereço de API confiável"); `type`/`version` são verificados no cliente (`PAG:108-109`: `type==='semed.agent.pairing' && version===1`, tamanho ≤1024, regexes de `enrollment_id` e `pairing_code`) e não são enviados ao servidor. O `summary` (hostname/modelo/CPU/RAM/série parcial) vem do cadastro, não do QR.
- Leitura no cliente de referência: `BarcodeDetector` (só Chrome/Android) com alternativa de colar JSON (`PAG:145-147`; REV §7 "LEITOR DE QR" pede alternativa compatível com Safari/iPhone). `contract/tools/verify-qr.mjs` só valida o codificador QR do .NET com jsQR.

---------------------------------------------------------------------------------------------------

## D. MODELO DE DADOS (`MIG` = `modulo-servidor/migrations/0100_agentes.sql`, versão 0.1.6) E ADAPTADOR DE CATÁLOGO

Convenções: datas em texto ISO `AAAA-MM-DDTHH:MM:SSZ` (comparáveis como texto); prazos técnicos (`expires_at` de recibos/nonces, `window_start`) em **epoch ms** (`MIG:6`). Sem chaves estrangeiras (nem entre tabelas `agent_*`). `PEN` ("Convenções do repositório oficial") registra que o inventário usa epoch ms em vários campos — padronizar na adaptação.

### D.1 Tabelas (todas `CREATE TABLE IF NOT EXISTS`)

| Tabela | Colunas (tipo, restrições) | Chaves/índices | Referências ao sistema hospedeiro |
|---|---|---|---|
| `agent_tx_guard` (`MIG:11`) | `ok INTEGER NOT NULL CHECK (ok=1)` | — | — (sempre vazia; usada como asserção de batch: `INSERT … SELECT 0 WHERE NOT (<cond>)` viola o CHECK e desfaz o batch; `D1:61`) |
| `agent_install_grants` (`MIG:14-27`) | `grant_id TEXT PK`, `code_hash TEXT NOT NULL UNIQUE`, `created_by TEXT NOT NULL`, `created_at`, `expires_at TEXT NOT NULL`, `max_uses INTEGER NOT NULL DEFAULT 1 CHECK 1..1000`, `uses_count INTEGER NOT NULL DEFAULT 0 CHECK 0..max_uses`, `used_at TEXT` (1º uso), `last_used_at TEXT`, `used_by_installation TEXT` (último), `revoked_at TEXT`, `note TEXT CHECK ≤140` | PK, UNIQUE(code_hash) | `created_by` = id de usuário do sistema |
| `agent_enrollment_challenges` (`MIG:29-37`) | `challenge_id TEXT PK`, `grant_id TEXT NOT NULL`, `challenge TEXT NOT NULL` (em claro), `created_at`, `expires_at TEXT NOT NULL`, `used_by TEXT` (installation_id) | `idx_agent_challenges_expires(expires_at)` | — |
| `agent_devices` (`MIG:39-46`) | `device_id TEXT PK`, `state TEXT NOT NULL CHECK IN ('pending_pairing','linked','revoked','identity_conflict')`, `created_at`, `revoked_at`, `revoked_by`, `revoke_reason` | PK | `revoked_by` = usuário |
| `agent_installations` (`MIG:48-56`) | `installation_id TEXT PK`, `device_id TEXT NOT NULL`, `agent_version TEXT`, `current_key_id TEXT NOT NULL`, `created_at`, `revoked_at` | `idx_agent_installations_device(device_id)` | — |
| `agent_keys` (`MIG:58-66`) | `key_id TEXT PK` (thumbprint), `installation_id TEXT NOT NULL`, `public_jwk TEXT NOT NULL` (JSON), `status TEXT NOT NULL CHECK IN ('active','retiring','revoked')`, `created_at`, `valid_until TEXT` | `idx_agent_keys_installation(installation_id)` | — |
| `agent_enrollments` (`MIG:68-80`) | `enrollment_id TEXT PK`, `device_id TEXT NOT NULL UNIQUE`, `grant_id TEXT NOT NULL`, `code_hash TEXT` (NULL após consumo), `visual_code TEXT`, `expires_at TEXT NOT NULL`, `failed_attempts INTEGER NOT NULL DEFAULT 0`, `renewals INTEGER NOT NULL DEFAULT 0`, `consumed_at TEXT`, `summary_json TEXT NOT NULL CHECK ≤4096`, `created_at` | PK, UNIQUE(device_id) → 1 pedido por device | — |
| `agent_equipment_links` (`MIG:83-96`) | `link_id TEXT PK`, `device_id TEXT NOT NULL`, `equipment_id TEXT NOT NULL`, `inspection_id TEXT`, `linked_by TEXT NOT NULL`, `linked_at TEXT NOT NULL`, `device_confirmed_at`, `ended_at`, `end_reason` | `uq_agent_link_active_device(device_id) WHERE ended_at IS NULL`; `uq_agent_link_active_equipment(equipment_id) WHERE ended_at IS NULL`; `idx_agent_link_equipment(equipment_id, linked_at)` | `equipment_id` = ficha (equipments.id); `inspection_id` = vistoria; `linked_by` = usuário. **Não guarda unidade/ambiente/posição** (ficha é a fonte de verdade, `MIG:82`) |
| `agent_equipment_location_history` (`MIG:100-114`) | `history_id TEXT PK`, `equipment_id TEXT NOT NULL`, `version_before INTEGER NOT NULL`, `version_after INTEGER NOT NULL`, `kind CHECK IN ('ficha_criada','localizacao_confirmada','posicao_definida_e_confirmada','mudanca_de_localizacao')`, `source CHECK IN ('pairing_claim','equipment_location')`, `before_json TEXT`, `after_json TEXT NOT NULL`, `reason TEXT`, `changed_by TEXT NOT NULL`, `changed_at TEXT NOT NULL`, `inspection_id TEXT` | `idx_agent_eq_loc_hist(equipment_id, version_after)` | `equipment_id`, `changed_by` (usuário), `inspection_id`; `before/after_json` contêm `environment_id`, `position_label`, `position_description`, `location_state`, `location_confirmed_by/at` |
| `agent_claim_requests` (`MIG:117-123`) | `request_key TEXT PK` (= `user_id|request_id`), `body_hash`, `status INTEGER`, `response_json`, `created_at` (todos NOT NULL) | PK | `request_key` embute id de usuário |
| `agent_location_requests` (`MIG:124-130`) | idem | PK | idem |
| `agent_presence` (`MIG:133-137`) | `device_id TEXT PK`, `data_json TEXT NOT NULL` (blob: `last_live_contact_at, last_collected_at, collected_ms, last_received_at, boot_id, sequence, agent_version, health, last_health_inventory, last_reason, last_reason_at`; `W:856-871`), `updated_at TEXT NOT NULL` | PK | — |
| `agent_heartbeats` (`MIG:140-150`) | `id INTEGER PK AUTOINCREMENT`, `device_id`, `collected_at`, `received_at`, `boot_id`, `sequence INTEGER`, `reason`, `live INTEGER` (todos NOT NULL) | `idx_agent_hb_device(device_id, id)` | — (opcional; `keepHeartbeats` 0 desliga; poda a cada 20 inserts, `D1:282-289`) |
| `agent_inventory_snapshots` (`MIG:153-169`) | `inventory_id TEXT PK`, `device_id NOT NULL`, `equipment_id TEXT` (copiado do vínculo ativo no momento), `collected_at`, `received_at`, `boot_id`, `sequence INTEGER`, `reason` (NOT NULL), `previous_inventory_id`, `content_hash` (do agente), `snapshot_hash TEXT NOT NULL` (do servidor), `queue_gaps_json`, `sections_json TEXT NOT NULL CHECK ≤65536` | `idx_agent_snap_device_time(device_id, collected_at)`; `idx_agent_snap_equipment_time(equipment_id, collected_at)` | `equipment_id` |
| `agent_current_snapshot` (`MIG:171-175`) | `device_id TEXT PK`, `inventory_id NOT NULL`, `collected_at NOT NULL` | PK | — (upsert monotônico por `collected_at`, `D1:302-307`) |
| `agent_baseline` (`MIG:176-181`) | `device_id TEXT PK`, `inventory_id NOT NULL`, `version INTEGER NOT NULL`, `set_at NOT NULL` | PK | — (`INSERT OR IGNORE`, 1ª vez que system/cpu/memory vêm `ok`) |
| `agent_queue_gaps` (`MIG:183-193`) | `device_id`, `gap_id`, `dropped_count CHECK ≥1`, `dropped_change_count CHECK ≥0`, `first_dropped_collected_at`, `last_dropped_collected_at`, `first_reported_inventory_id`, `received_at` (todos NOT NULL) | PK(device_id, gap_id) | — |
| `agent_message_receipts` (`MIG:196-204`) | `device_id`, `message_id`, `body_hash`, `ack_json`, `expires_at INTEGER` (epoch ms) | PK(device_id, message_id); `idx_agent_receipts_expires(expires_at)` | — |
| `agent_request_nonces` (`MIG:207-213`) | `key_id`, `nonce`, `expires_at INTEGER` (epoch ms) | PK(key_id, nonce); `idx_agent_nonces_expires(expires_at)` | — |
| `agent_rate_limits` (`MIG:216-220`) | `rate_key TEXT PK`, `count INTEGER`, `window_start INTEGER` (epoch ms) | PK | — |
| `agent_identity_conflicts` (`MIG:222-230`) | `conflict_id TEXT PK`, `detected_at`, `kind` (`installation_id_reused_with_other_key` \| `key_reused`), `installation_id`, `key_id`, `resolved_at`, `resolved_by` | PK | `resolved_by` (usuário; nunca escrito pelo código) |
| `agent_audit_log` (`MIG:232-240`) | `audit_id TEXT PK`, `at`, `actor NOT NULL` (user id, `device:<id>` ou `sistema`), `action NOT NULL` (ex.: `enrollment_created, pairing_claimed, equipment_location_changed, key_rotated, install_grant_created/revoked, agent_revoked, queue_gap_conflict`), `target` (device_id), `details_json` | `idx_agent_audit_at(at)` | `actor`; `details_json` traz `unit_id`, `environment_id`, `equipment_id`, `equipment_version` etc. |

Manutenção (`D1:369-383`, agendar 1×/dia): apaga nonces/recibos vencidos, `agent_rate_limits` com `window_start` > 24 h, desafios expirados há > 24 h, e snapshots além dos N=60 mais recentes por device exceto o atual e o baseline.

### D.2 Diferenças relevantes: `MIG-P` (proposta antiga, "contrato 1.0.1, protótipo 0.1.1") × `MIG` (0.1.6)
`MIG-P` é a versão ANTERIOR (cabeçalho `MIG-P:2`), não uma evolução. Diferenças (diff executado):
- `MIG-P` tinha `REFERENCES` entre tabelas `agent_*`; `MIG` removeu todas as FKs.
- Grants: `MIG-P` `created_by_user_id`, sem `max_uses/uses_count/last_used_at` (uso único); `MIG` `created_by` + lote.
- Links: `MIG-P` `linked_by_user_id`; `MIG` `linked_by`. `MIG` acrescenta `idx_agent_link_equipment`.
- Histórico: `MIG-P` `equipment_location_history_PROPOSTA`; `MIG` `agent_equipment_location_history` (mesmas colunas).
- Idempotência humana: `MIG-P` PK composta `(user_id, request_id)`; `MIG` `request_key` texto; `MIG` acrescenta `agent_location_requests`.
- Presença: `MIG-P` colunas tipadas (`last_live_contact_at, last_collected_at, last_received_at, boot_id, sequence, agent_version, health_json, last_reason, last_reason_at`); `MIG` um `data_json`. (Para corrigir R3 com UPDATE condicional, o modelo de colunas da `MIG-P` é mais adequado.)
- `MIG-P` não tinha `agent_heartbeats`, `agent_current_snapshot`, `agent_baseline`, `agent_rate_limits`, `agent_tx_guard`; usava `is_current/is_baseline/baseline_version` dentro de `agent_inventory_snapshots` com índice único parcial `uq_agent_snap_current`.
- `MIG-P` reservava `agent_hardware_events` (Fase 5: `event_id, device_id, equipment_id, baseline_version, change_type, dedup_key UNIQUE, before/after_json, confidence, state CHECK IN ('suspeito','confirmado_tecnicamente','em_analise','manutencao_reconhecida','falso_positivo','resolvido'), first_observed_at, confirmed_at, received_at, last_observed_at, reviewer_user_id, review_reason, reviewed_at`) — **ausente** em `MIG`; nenhuma rota a usa (501).
- Recibos: `MIG-P` `expires_at TEXT`; `MIG` `INTEGER` epoch ms.

### D.3 Interface do adaptador de catálogo (o que o núcleo espera do sistema hospedeiro) — `CAT:11-22`, chamadas em `D1:342-351`, verificadas por `ferramentas/verificar-adaptador.mjs:56-58`
Todas recebem `db` (binding D1) como 1º argumento. Leituras são `async` e devolvem objetos nos formatos abaixo; escritas devolvem `D1PreparedStatement` para entrar no MESMO `db.batch()` do vínculo.

| Função | Assinatura | Retorno |
|---|---|---|
| `getUnit` | `(db, unit_id)` | `{unit_id, name, active:boolean}` ou null/undefined |
| `listUnits` | `(db)` | `[{unit_id, name, active}]` (o núcleo filtra por `unit_ids` do usuário em memória, `W:1086`) |
| `getEnvironment` | `(db, environment_id)` | `{environment_id, unit_id, name}` |
| `listEnvironments` | `(db, unit_id)` | `[{environment_id, unit_id, name}]` |
| `getInspection` | `(db, inspection_id)` | `{inspection_id, unit_id, state}` com `state==='open'` = aberta |
| `listOpenInspections` | `(db, unit_id)` | `[{inspection_id, unit_id, state:'open'}]` |
| `getEquipment` | `(db, id)` | `{id, unit_id, environment_id|null, category ('desktop'|'notebook' = computador), asset|null, serial|null, status, version:int, position_label|null, position_description|null, location_state ('declarada' padrão), location_confirmed_by|null, location_confirmed_at|null}` |
| `listComputersInUnit` | `(db, unit_id)` | lista de equipamentos acima (categoria desktop/notebook); referência usa `LIMIT 2000` (`CAT:51`) — remover (REV §4 "NÃO COPIAR") |
| `findEquipmentByAsset` | `(db, asset)` | equipamento ou null (usado só no `mode:'new'`) |
| `assertEquipmentVersion` | `(db, id, version)` → stmt | `INSERT INTO agent_tx_guard(ok) SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM <fichas> WHERE id=? AND version=?)` |
| `updateEquipmentLocation` | `(db, id, expectedVersion, {environment_id, position_label, position_description, location_state, location_confirmed_by, location_confirmed_at})` → stmt | `UPDATE <fichas> SET … , version=version+1 WHERE id=? AND version=?` |
| `insertEquipment` | `(db, {id, unit_id, environment_id, category, asset, serial, status, version, position_label, position_description, location_state, location_confirmed_by, location_confirmed_at, created_by, inspection_id})` → stmt | pode lançar quando a criação de ficha é desativada (`exemplos/catalogo-EXEMPLO-adaptado.mjs:54-57`; usar `allowNewEquipment=false`) |
| `countEquipment` (opcional) | `(db)` | inteiro (diagnóstico) |
| `seed` (só testes) | `(db, SEED)` | — |
| `nome` | string | identificação exibida em `/agentes/saude` |

Pré-requisitos da FICHA do sistema (`exemplos/migracao-fichas-EXEMPLO.sql`): coluna `version INTEGER NOT NULL DEFAULT 1` incrementada por TODAS as telas que editam a ficha (controle otimista), `position_label`, `position_description`, `location_state` (`declarada`|`confirmada_em_visita`), `location_confirmed_by`, `location_confirmed_at`. **[DECISÃO]** no nosso esquema a ficha tem `data_json`, versão, vistoria, autoria e histórico próprios (REV §7 "FICHA E HISTÓRICO"); o adaptador deve mapear/derivar esses campos sem quebrar a coerência de `data_json`/`published_json`, e o histórico deve ir para o mecanismo do inventário (a tabela `agent_equipment_location_history` pode ser substituída pelo histórico existente, como a própria `MIG-P:104-105` sugere).

### D.4 Interface do adaptador de sessão (`SIS:1-45`, uso em `W:267-274`, `IDX:60-63, 71-75`)
- `autenticar(request, {csrf:boolean, ApiError, env, cfg})` → `{id, name?, role:'root'|'operador'|'visualizador', unit_ids:[...]|['*'], csrf?}`; deve lançar `ApiError(401,'SESSION_REQUIRED')`, `ApiError(403,'ORIGIN_REJECTED'|'CSRF_REJECTED'|'FORBIDDEN')`. Com `csrf:true` deve conferir Origin e `X-CSRF-Token`.
- `tokenCsrfParaPagina(request, env, usuario)` → token para a página (só usado por `/agentes/sessao`, que não portaremos).
- Exemplo `exemplos/sistema-EXEMPLO-sessao-d1.mjs` mapeia `administrador→root`, `tecnico→operador`, `consulta→visualizador` — REV §4 e §7 vetam esse mapeamento; a matriz de 4 perfis é a aprovada.

---------------------------------------------------------------------------------------------------

## E. ORIGEM DOS DEFEITOS R1–R5 E COMPORTAMENTO CORRETO (conciso)

| Def. | Onde (reprodução `REP`) | Causa no código | Comportamento correto |
|---|---|---|---|
| **R1** QR de agente pendente revogado ainda vincula (201, `state='linked'` com `revoked_at` preenchido; `RES` R1; `REP:39-47`) | `W:556-567 checkPairingCode` (preview e claim) só olha `consumed_at/expires_at/failed_attempts/code_hash`; `W:729-741 pairingClaim` não consulta `agent_devices`; `D1:202-224 claimAtomic` guarda só enrollment/vínculos e faz `UPDATE agent_devices SET state='linked'` incondicional (`D1:223`); `D1:170-180 revokeDevice` não invalida o enrollment pendente | `revokeDevice` deve também consumir/anular o enrollment (`code_hash=NULL`, marcador de revogação); `checkPairingCode` deve devolver 403 `REVOKED` (ou 410) se `device.state==='revoked'`/`revoked_at`; `claimAtomic` deve incluir guard `EXISTS (SELECT 1 FROM agent_devices WHERE device_id=? AND state='pending_pairing' AND revoked_at IS NULL)` e tornar o `UPDATE agent_devices` condicional (`WHERE state='pending_pairing'`); testar revogação concorrente ao claim |
| **R2** falha após gravar vínculo → 1ª resposta 503, reenvio 409 `EQUIPMENT_VERSION_CONFLICT`, versão 2 já gravada (`REP:48-59`) | `W:741 claimAtomic` (commit) → `W:758 logAudit` → `W:775 putClaimRequest` fora da transação; o reenvio não acha recibo (`W:628`), reexecuta validações e bate em `eq.version !== expected_version` (`W:696`) | Gravar o recibo `agent_claim_requests` (e a auditoria) **no mesmo `db.batch`** do vínculo (o corpo da resposta é determinístico antes do commit: `link_id` gerado antes, versão = `expected+1`); no reenvio com mesmo `request_id`, se não houver recibo mas existir vínculo ativo `device_id→equipment_id` criado por este `request_id`/usuário, devolver 201 `duplicate:true`; a interface deve reutilizar o `request_id` no reenvio. Mesmo princípio para `equipment-location` (`W:816-823`) e, nas rotas de máquina, `withReceipt` (`W:331-332`) grava recibo após efeitos — aceitável porque os efeitos são idempotentes por `inventory_id`/`gap_id`/presença monotônica, mas convém `batch` quando possível |
| **R3** heartbeat antigo sobrescreve presença mais nova em concorrência (sequência final 1 após aceitar 2; `REP:60-74`) | `W:850-871 heartbeat`: lê `getPresence` (`W:850`), decide `live` em memória (`W:851-853`) e grava `setPresence({...p, ...})` com upsert **incondicional** (`D1:278-281`) — read-modify-write não atômico sobre `data_json` | Presença em colunas (modelo `MIG-P`) e `UPDATE … WHERE device_id=? AND ((boot_id<>? AND collected_ms<?) OR (boot_id=? AND sequence<?) OR boot_id IS NULL)` em uma única instrução (ou `INSERT … ON CONFLICT DO UPDATE … WHERE excluded.collected_ms > … / excluded.sequence > …`, como já é feito em `setCurrentSnapshot` `D1:302-307`); `presence_updated` derivado de `meta.changes`; manter separados `last_collected_at` (declarado) e `last_received_at`/`last_live_contact_at` (servidor) |
| **R4** lote bloqueado por IP compartilhado: 31º desafio do mesmo IP → 429 com só 1 uso registrado (`REP:75-84`) | `W:340 rate('challenge-ip', 30, 3600)` aplicado antes de validar a grant e independente de `max_uses`; idem `W:379 enroll-ip 30/3600` para `enrollments`; o limite por grant `W:353` (max(10, 3×max_uses)) nunca chega a atuar | Limitar por IP apenas tentativas **inválidas** (grant inexistente/malformada) ou usar chave `grant+ip` com orçamento proporcional a `max_uses`; manter `challenge-grant` como teto principal; dar `Retry-After` coerente; o mesmo para `enroll-ip`. Não remover limites: REV §6 R4 |
| **R5** catálogo cresce 1 consulta por equipamento (1.003 fichas → 1.007 consultas; `REP:85-94`) | `W:1085-1103 pairingCatalog`: `listComputersInUnit` (com `LIMIT 2000`, `CAT:51`) + `getActiveLinkForEquipment` por item (`W:1099`); `W:586-600 pairingPreview`: por item `officialLocation` (2 consultas) + `getActiveLinkForEquipment` (3N+1) | `LEFT JOIN agent_equipment_links l ON l.equipment_id=e.id AND l.ended_at IS NULL` em UMA consulta paginada (cursor por `(asset,id)` ou `(environment_id,asset,id)`, `limit` ≤ 50–100, filtro de texto/ambiente no servidor); sugestões do preview por consulta dirigida (`serial LIKE '%'||?`) e não por varredura; sem teto artificial de fichas por unidade. Limite D1: 50 consultas/invocação no Free (REV §9) |

Nota adicional (não numerada na REV): `D1Store.getDevice` retorna só `device_id, state, created_at, revoked_at` (`D1:150`); o estado `identity_conflict` existe no CHECK da tabela mas nenhum código do servidor o grava.

---------------------------------------------------------------------------------------------------

## F. HEARTBEAT / INVENTÁRIO — SEMÂNTICA (conciso)

### F.1 Heartbeat → presença (`W:846-882`, `presenceView` `W:292-317`)
- `fresh` = |now − collected_at| ≤ 120 s (`liveWindowSeconds`). `newer` = se `boot_id` ≠ último: `collected_at` maior que o último (ou sem anterior); se mesmo `boot_id`: `sequence` maior. `live = fresh && newer` → atualiza presença e ACK `presence_updated:true`; senão só `last_received_at` (observação atrasada, `presence_updated:false`). `agent_installations.agent_version` é atualizado quando muda (`W:873`). Observação sempre gravada em `agent_heartbeats` (se `keepHeartbeats>0`).
- Estado derivado (`presenceView`): `unknown` (device inexistente) · `revoked` · `never_communicated` (sem `last_live_contact_at`) · `reported_shutdown` / `reported_suspend` (último `reason` shutdown/suspend e `last_reason_at ≥ last_live_contact_at`) · `communicating` (now − last_live_contact_at ≤ 3×heartbeat_interval + 120 s = 1020 s no padrão) ou `communicating_with_failure` (`health.inventory` ∈ {error, timeout}) · `no_recent_communication`. Resposta: `{state, last_live_contact_at, last_observation_collected_at, last_received_at, last_boot_id, last_sequence, agent_version, health, threshold_seconds, note:'Ausência de comunicação não prova que a máquina está desligada.'}`.
- Intervalos: heartbeat 300 s ± 20 % jitter; política buscada a cada 6 h; faixas do agente em `POL:6-16`. Fila do agente mantém só o heartbeat mais recente pendente (`POL:23`), logo heartbeats atrasados são raros mas possíveis.
- Custo por heartbeat aceito no D1 de referência: ~11–13 consultas (3 de identidade, nonce, rate, recibo×2, presença×2, heartbeat, opcional versão) e ~4–5 escritas; REV §9 e `POL:55-59` (120.000 sinais/dia em cenário hipotético de 1.000 máquinas × 10 h).

### F.2 Inventário (`W:900-963`)
- Seções e campos (`INV:290-869`; fontes/limitações em `DIC:11-42`): `system{hostname, dns_hostname, manufacturer, model, system_family, sku, chassis_types[int≤8], chassis_kind: desktop|laptop|all_in_one|mini|server|tablet|other|unknown, serial:{value≤128|null, reliability: ok|generic|absent|unread}, smbios_uuid:{…}, baseboard{manufacturer, product, version, serial:{…}}, bios{manufacturer, version, smbios_version, release_date, firmware_type: uefi|bios|unknown}, virtual_machine{is_vm, confidence: high|medium|low, evidence[≤8]}, architecture: x64|x86|arm64|arm|unknown}` · `cpu{processor_count, processors[≤16]{socket, manufacturer, name, architecture, cores, logical_processors, max_clock_mhz, processor_id}}` · `memory{installed_bytes, visible_bytes, slot_count, slot_count_reliability: reported|unreliable|unknown, modules[≤32]{slot, bank, capacity_bytes, manufacturer, part_number, serial:{…}, memory_type, speed_mhz, configured_speed_mhz}}` · `storage{physical_disks[≤32]{model, manufacturer, serial:{…}, size_bytes, bus_type, media_type: ssd|hdd|unknown, location: internal|external|removable|virtual|unknown, firmware}, volumes[≤32]{mount, file_system, drive_type: fixed|removable|network|optical|ram|unknown, size_bytes, free_bytes (dinâmico)}}` · `gpu{adapters[≤8]{name, manufacturer, pnp_device_id, driver_version, driver_date, reported_memory_bytes, reported_memory_reliability: reported_unreliable|unknown}}` · `network{addresses_collected:boolean, adapters[≤32]{name, description, kind: physical|virtual|vpn|loopback|unknown, interface_type, mac `^([0-9A-F]{2}:){5}[0-9A-F]{2}$`, status: up|down|unknown, ipv4[≤8], ipv6[≤8], dhcp_enabled, gateways[≤4], dns_servers[≤4]}}` (endereços só com `collect_network_addresses=true`) · `os{caption, version, build_number, architecture, install_date, last_boot_at, part_of_domain, domain_name (só com `collect_domain_name`)}` · `accounts{enabled_local_count, disabled_local_count, interactive_session_count, console_session_count, remote_session_count, named_accounts_collected:false}`. Todos nullable; strings ≤256. Não há SSID, bateria, aplicativos instalados nem SMART (REV §5).
- Qualidade: por seção (`ok|partial|unsupported|access_denied|timeout|error`); `truncated:true` ⇒ `partial` (`DIC:44-48`); `error_code` livre ≤64 (ex.: `WMI_TRUNCATED`, `TRUNCATED`, `SOURCE_UNAVAILABLE`, `PAYLOAD_LIMIT`). Seções `partial`/falhas **não** significam remoção.
- `content_hash` (agente): SHA-256 de `nome:quality:hash_da_seção` em ordem alfabética, hash de seção por JSON canônico excluindo `storage.volumes[].free_bytes`, `os.last_boot_at`, `network.*.status/ipv4/ipv6/gateways/dns_servers/dhcp_enabled`, contagens de sessão (`DIC:50-54`). Servidor apenas armazena (não recalcula).
- Servidor: `snapshot_hash` próprio (`canonicalJson` do corpo sem `message_id`); snapshot imutável; `equipment_id` copiado do vínculo ativo na inserção; **atual** = maior `collected_at` (upsert monotônico, `D1:302-307`), decidido sobre o snapshot ARMAZENADO (`W:937-945`); **baseline** = primeiro snapshot com `system`, `cpu`, `memory` em `ok` (`W:886-889`, `INSERT OR IGNORE`, `version:1`); `queue_gaps` deduplicadas por `(device_id, gap_id)`; conteúdo divergente da mesma lacuna → auditoria `queue_gap_conflict` (`D1:320-333`).
- Comparação de hardware: só local no agente (suspeita em seções `system/cpu/memory/storage/gpu` com `quality=ok` nas duas leituras e hash diferente; confirmação após 30–600 s, padrão 90; envio com `reason:'change_confirmed'`; `DIC:56-61`). No servidor: **não implementada** (`agent-reconcile`/`hardware-event-review` → 501; `MIG-P` reservava `agent_hardware_events`). Expectativa (REV §5): ignorar falha/ausência de leitura como prova de remoção; registrar mudanças rotineiras; identidade (placa-mãe/série) para revisão administrativa; nunca alterar identidade patrimonial automaticamente.
- Intervalos: inventário completo ao iniciar, a cada 21.600 s (6 h), forçado a cada 86.400 s, e em confirmação de mudança — nunca a cada heartbeat (`POL:48`). Fila: até 100 inventários / 16 MiB; descarte vira `queue_gaps` (`POL:24`). Retenção no servidor: 60 snapshots por device + atual + baseline (`D1:369-380`) — valor de exemplo, a medir no piloto (REV §8).
- `sequence`/`boot_id` em inventário: armazenados; ordenação do "atual" usa `collected_at`, não `sequence` (**[DIVERGÊNCIA de critério]** com o heartbeat, que usa `sequence` no mesmo boot).

---------------------------------------------------------------------------------------------------

## G. PROPOSTA DE MAPEAMENTO PARA O NOSSO WORKER (`server/agent-*.mjs`) — conciso

### G.1 Portar quase literalmente (com testes dos vetores e das suítes como aceite)
- `CRY` inteiro → `server/agent-crypto.mjs` (b64url estrito, sha256, thumbprint RFC 7638, `canonicalString`, `verifyP1363`, `timingSafeEqualStr`, `randomToken`).
- `VAL` inteiro → `server/agent-validate.mjs` (`validateHeartbeat`, `validateInventory`, `validateSummary`, `checkDeep`, helpers).
- De `W`: `ApiError`/`errorResponse`/`json`/`readBody` (`W:69-155`), `checkTimestamp`/`checkNonceFormat`/`checkSigFormat`/`verifySigned`/`authDevice`/`requireBodyInstallation` (`W:171-243`), `enrollmentChallenge`/`issuePairingCode`/`visualCode`/`enrollments` (`W:337-477`), `enrollmentStatus`/`enrollmentRenew`/`checkPairingCode` (`W:512-567`, com a checagem de revogação de R1), `confirmDevice` (`W:827-838`), `heartbeat` (`W:840-884`, trocando o bloco de presença pela atualização condicional de R3), `baselineEligible`/`snapshotHash`/`canonicalJson`/`inventory` (`W:80-85, 886-963`), `configRoute`/`POLICY_BOUNDS` (`W:60-67, 965-978`), `rotateKey` (`W:980-1015`), `withReceipt` (`W:320-334`), `presenceView` (`W:292-317`), `rootCreateGrant`/`grantView`/`rootListGrants`/`rootRevokeGrant`/`rootRevoke`/`grantExhausted` (`W:1105-1167, 1239-1243`), roteador de máquina (`W:1178-1192`) e `fetchHandler` (`W:1220-1233`) → `server/agent-routes-device.mjs`, `server/agent-routes-root.mjs`.
- De `D1`: `hitRate`, `useNonce`, grants, desafios, `createEnrollmentAtomic`, identidade/chaves, `rotateKeyAtomic`, `revokeDevice` (+ anulação do enrollment, R1), enrollments, `confirmLink`, recibos, snapshots/atual/baseline/lacunas, `getEquipmentHistory`, `purgeExpired` (`D1:70-200, 251-340, 352-383`) → `server/agent-store.mjs`. Padrão `agent_tx_guard` + `tryBatch` (`D1:61-68`) é válido em D1 (batch transacional).
- `MIG` tabelas `agent_*` → nova migração aditiva renumerada em `migrations/` (sem `0101`/`ref_*`, sem seeds); ajustar `agent_presence` para colunas (R3) e avaliar se `agent_equipment_location_history`/`agent_location_requests` são necessários dado o histórico próprio do inventário.
- Contrato/vetores: `contract/schemas/*.json`, `contract/examples/*.json`, `contract/test-vectors/signatures.json` como fixtures de teste em `tests/`.

### G.2 Reescrever / adaptar
- **Sessão humana** (`humanSession` `W:267-274` + `SIS`): usar a sessão real do Worker (cookie, CSRF, Origin já exigidos pelas escritas da interface, REV §7 "INTEGRAÇÃO COM O WORKER"), conta ativa/expiração/versão de credencial; mapear os QUATRO perfis (root, admin, operador, visualizador) à matriz aprovada em DECISOES.md (**[DECISÃO]** o núcleo rejeita `admin` e o exemplo o converte em root; nenhum dos dois é aceitável); `unit_ids` = unidades ativas acessíveis conforme D-046 (operador continua qualquer unidade ativa).
- **Despacho**: rotas de máquina (`/api/agent/v1/*` exceto `pairings/preview|claim|catalog`) tratadas ANTES do filtro de Origin/sessão humana do Worker; as humanas passam pelo filtro normal.
- **Catálogo** (`CAT` → `server/agent-catalog.mjs`): mapear `units`/`environments`/`inspections`/`equipments` reais (ids, `data_json`, versão, status/`published_json`); `listComputersInUnit` **paginado com JOIN** (R5); `updateEquipmentLocation`/`insertEquipment` reescritos para manter `data_json`, versão, vistoria, autoria e histórico coerentes; provavelmente iniciar com `allowNewEquipment=false` (422 `NEW_EQUIPMENT_DISABLED`) até a criação pelo fluxo do coletor estar integrada; `equipmentIdFormat` conforme nossos ids.
- **`pairingClaim`** (`W:620-777`): manter validações e ordem; recibo humano + auditoria dentro do batch (R2); guard de device não revogado (R1); histórico no mecanismo do inventário; registrar que o vínculo é PARCIAL/telemetria, não conclusão de vistoria (REV §8, D-045).
- **`pairingPreview`/`pairingCatalog`** (`W:574-609, 1085-1103`): paginação/filtros/JOIN; sugestões por consulta dirigida.
- **Limites de taxa** (`W:157-165` + chaves de A.4): reformular `challenge-ip`/`enroll-ip` (R4); considerar custo de 1 escrita por checagem em D1.
- **`agentStatus`/`agentHistory`** (`W:1026-1082`): devolver toda a sucessão de vínculos (não só o último), cursor opaco/estável em vez de offset, campos conforme a ficha do painel.
- **`equipmentLocation`** (`W:783-825`): avaliar se mapeia ao fluxo de movimentação existente ou se fica fora do escopo inicial.
- **Não portar**: `MEM` (só testes), `dev-routes.mjs`, `dev-page.mjs`, `seed.mjs`, `HOM`, `PAG`, `/agentes/*`, `/health` (opcional), `0101_*.sql`, `exemplos/*` (só referência), `wrangler.exemplo.toml` (tem `routes` dentro de `[vars]`, REV §7).

### G.3 Funções que o adaptador do sistema hospedeiro precisa fornecer
Do pacote (obrigatórias para o núcleo): `getUnit(db,id)`, `listUnits(db)`, `getEnvironment(db,id)`, `listEnvironments(db,unitId)`, `getInspection(db,id)`, `listOpenInspections(db,unitId)`, `getEquipment(db,id)`, `listComputersInUnit(db,unitId)`, `findEquipmentByAsset(db,asset)`, `assertEquipmentVersion(db,id,version)→stmt`, `updateEquipmentLocation(db,id,expectedVersion,loc)→stmt`, `insertEquipment(db,eq)→stmt`, opcional `countEquipment(db)`; sessão: `autenticar(request,{csrf,ApiError,env})→user`, `tokenCsrfParaPagina(...)` (dispensável sem a página do módulo).
Acréscimos necessários para corrigir R2/R5 e atender REV §7 (propostos, não existem no pacote): `listComputersInUnitPage(db, unitId, {cursor, limit, q, environmentId})` devolvendo `{items:[{…, already_linked, linked_device_id}], next_cursor}` via JOIN com `agent_equipment_links`; `findComputersBySerialSuffix(db, unitId, suffix)`; `appendEquipmentHistory(db, equipmentId, entry)→stmt` no histórico do inventário; `createEquipmentDraftStmts(db, …)` pelo fluxo do coletor (ou manter criação desativada); `listLinksForEquipment(db, equipmentId)` (sucessão completa); `getUnitsForUser(user)` conforme D-046; resolução de usuário/perfil/unidades ativas a partir da sessão real.

### G.4 Pontos ambíguos/contraditórios a resolver antes de codificar (referências)
1. `inspection_id` obrigatório no schema (`MSG:412`) vs opcional no código quando `requireInspection=false` (`W:637`, `MUD:11`). Nosso sistema: vistoria aberta da unidade é o contexto natural do coletor (REV §3); decidir se obrigatória.
2. `equipment_status` da resposta do claim (`'rascunho_parcial'` `W:764`) vs status gravado (`'rascunho'` `W:723`); schema não restringe.
3. `serial_hint` 4 chars (schema) vs 6 chars visíveis (validador).
4. OAS desatualizado quanto às rotas 0.1.6 (`MUD`) e sem schemas de resposta para preview/catalog/agent-status/agent-revoke/grants.
5. `expires_at` do QR é informativo; o servidor usa o próprio. `RC:104-106` monta `expires_at:null` no `qrPayload` de teste, contrariando o schema (`MSG:46-48`) — só afeta testes.
6. Datas ISO (pacote) vs epoch ms (inventário) — `PEN` "Convenções do repositório oficial".
7. `admin` recusado pelo núcleo (`W:270`) — exige decisão da matriz de perfis.
8. Heartbeat usa `sequence` para "mais novo" no mesmo boot; inventário usa `collected_at` — manter os dois critérios documentados ou unificar.
9. `/health` está no roteador de produção (`W:1212`); decidir se expomos.
10. `agent_devices.state='identity_conflict'` nunca é gravado pelo servidor; conflitos vão só para `agent_identity_conflicts`.
