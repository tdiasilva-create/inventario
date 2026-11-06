-- Módulo de agentes Windows (contrato 0.1.6, proposta D-053): tabelas ADITIVAS com prefixo agent_.
-- Origem: revisoes/agente-0.1.6-fonte/modulo-servidor/migrations/0100_agentes.sql, renumerada para a sequência real do projeto.
-- Não cria catálogo paralelo: unidades, ambientes, equipamentos e usuários continuam nas tabelas existentes.
-- Datas ISO 8601 UTC em texto; prazos técnicos em epoch ms. Nenhuma tabela existente é alterada.

-- Asserções dentro de db.batch(): "INSERT INTO agent_tx_guard(ok) SELECT 0 WHERE NOT (<condição>)"
-- viola o CHECK e desfaz o batch inteiro quando a condição é falsa. Esta tabela permanece sempre vazia.
CREATE TABLE IF NOT EXISTS agent_tx_guard (ok INTEGER NOT NULL CHECK (ok = 1));

-- Autorizações de instalação (uso único OU lote): só o HASH do código é guardado.
CREATE TABLE IF NOT EXISTS agent_install_grants (
  grant_id              TEXT PRIMARY KEY,
  code_hash             TEXT NOT NULL UNIQUE,
  created_by            TEXT NOT NULL,
  created_at            TEXT NOT NULL,
  expires_at            TEXT NOT NULL,
  max_uses              INTEGER NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 1000),
  uses_count            INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0 AND uses_count <= max_uses),
  used_at               TEXT,                -- primeiro uso
  last_used_at          TEXT,
  used_by_installation  TEXT,                -- último uso
  revoked_at            TEXT,
  note                  TEXT CHECK (note IS NULL OR length(note) <= 140)
);

CREATE TABLE IF NOT EXISTS agent_enrollment_challenges (
  challenge_id   TEXT PRIMARY KEY,
  grant_id       TEXT NOT NULL,
  challenge      TEXT NOT NULL,
  created_at     TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  used_by        TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_challenges_expires ON agent_enrollment_challenges(expires_at);

CREATE TABLE IF NOT EXISTS agent_devices (
  device_id     TEXT PRIMARY KEY,
  state         TEXT NOT NULL CHECK (state IN ('pending_pairing','linked','revoked','identity_conflict')),
  created_at    TEXT NOT NULL,
  revoked_at    TEXT,
  revoked_by    TEXT,
  revoke_reason TEXT
);

CREATE TABLE IF NOT EXISTS agent_installations (
  installation_id  TEXT PRIMARY KEY,
  device_id        TEXT NOT NULL,
  agent_version    TEXT,
  current_key_id   TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  revoked_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_installations_device ON agent_installations(device_id);

CREATE TABLE IF NOT EXISTS agent_keys (
  key_id           TEXT PRIMARY KEY,         -- thumbprint RFC 7638
  installation_id  TEXT NOT NULL,
  public_jwk       TEXT NOT NULL,            -- JSON {kty,crv,x,y}; NUNCA chave privada
  status           TEXT NOT NULL CHECK (status IN ('active','retiring','revoked')),
  created_at       TEXT NOT NULL,
  valid_until      TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_keys_installation ON agent_keys(installation_id);

CREATE TABLE IF NOT EXISTS agent_enrollments (
  enrollment_id     TEXT PRIMARY KEY,
  device_id         TEXT NOT NULL UNIQUE,
  grant_id          TEXT NOT NULL,
  code_hash         TEXT,                    -- NULL após consumo
  visual_code       TEXT,
  expires_at        TEXT NOT NULL,
  failed_attempts   INTEGER NOT NULL DEFAULT 0,
  renewals          INTEGER NOT NULL DEFAULT 0,
  consumed_at       TEXT,
  summary_json      TEXT NOT NULL CHECK (length(summary_json) <= 4096),
  created_at        TEXT NOT NULL
);

-- Vínculo agente ↔ ficha. NÃO guarda localização: ela vive na ficha (tabela de equipamentos do sistema).
CREATE TABLE IF NOT EXISTS agent_equipment_links (
  link_id               TEXT PRIMARY KEY,
  device_id             TEXT NOT NULL,
  equipment_id          TEXT NOT NULL,
  inspection_id         TEXT,
  linked_by             TEXT NOT NULL,
  linked_at             TEXT NOT NULL,
  device_confirmed_at   TEXT,
  ended_at              TEXT,
  end_reason            TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_link_active_device ON agent_equipment_links(device_id) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_link_active_equipment ON agent_equipment_links(equipment_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_link_equipment ON agent_equipment_links(equipment_id, linked_at);

-- Histórico de localização da ficha feito pelo módulo (se o sistema já tiver histórico próprio,
-- o adaptador de catálogo pode gravar lá também).
CREATE TABLE IF NOT EXISTS agent_equipment_location_history (
  history_id        TEXT PRIMARY KEY,
  equipment_id      TEXT NOT NULL,
  version_before    INTEGER NOT NULL,
  version_after     INTEGER NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN ('ficha_criada','localizacao_confirmada','posicao_definida_e_confirmada','mudanca_de_localizacao')),
  source            TEXT NOT NULL CHECK (source IN ('pairing_claim','equipment_location')),
  before_json       TEXT,
  after_json        TEXT NOT NULL,
  reason            TEXT,
  changed_by        TEXT NOT NULL,
  changed_at        TEXT NOT NULL,
  inspection_id     TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_eq_loc_hist ON agent_equipment_location_history(equipment_id, version_after);

-- Idempotência de pedidos humanos (vínculo e mudança de localização).
CREATE TABLE IF NOT EXISTS agent_claim_requests (
  request_key   TEXT PRIMARY KEY,            -- user_id|request_id
  body_hash     TEXT NOT NULL,
  status        INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_location_requests (
  request_key   TEXT PRIMARY KEY,
  body_hash     TEXT NOT NULL,
  status        INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

-- Presença: UMA linha por dispositivo (atualizada a cada heartbeat aceito).
CREATE TABLE IF NOT EXISTS agent_presence (
  device_id   TEXT PRIMARY KEY,
  data_json   TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Observações recentes de heartbeat (limitadas por dispositivo; opcional, ver D1Store.keepHeartbeats).
CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id     TEXT NOT NULL,
  collected_at  TEXT NOT NULL,
  received_at   TEXT NOT NULL,
  boot_id       TEXT NOT NULL,
  sequence      INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  live          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_hb_device ON agent_heartbeats(device_id, id);

-- Snapshots técnicos imutáveis (proveniência: reportado_pelo_agente).
CREATE TABLE IF NOT EXISTS agent_inventory_snapshots (
  inventory_id           TEXT PRIMARY KEY,
  device_id              TEXT NOT NULL,
  equipment_id           TEXT,
  collected_at           TEXT NOT NULL,
  received_at            TEXT NOT NULL,
  boot_id                TEXT NOT NULL,
  sequence               INTEGER NOT NULL,
  reason                 TEXT NOT NULL,
  previous_inventory_id  TEXT,
  content_hash           TEXT,
  snapshot_hash          TEXT NOT NULL,
  queue_gaps_json        TEXT,
  sections_json          TEXT NOT NULL CHECK (length(sections_json) <= 65536)
);
CREATE INDEX IF NOT EXISTS idx_agent_snap_device_time ON agent_inventory_snapshots(device_id, collected_at);
CREATE INDEX IF NOT EXISTS idx_agent_snap_equipment_time ON agent_inventory_snapshots(equipment_id, collected_at);

CREATE TABLE IF NOT EXISTS agent_current_snapshot (
  device_id     TEXT PRIMARY KEY,
  inventory_id  TEXT NOT NULL,
  collected_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS agent_baseline (
  device_id     TEXT PRIMARY KEY,
  inventory_id  TEXT NOT NULL,
  version       INTEGER NOT NULL,
  set_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_queue_gaps (
  device_id                   TEXT NOT NULL,
  gap_id                      TEXT NOT NULL,
  dropped_count               INTEGER NOT NULL CHECK (dropped_count >= 1),
  dropped_change_count        INTEGER NOT NULL CHECK (dropped_change_count >= 0),
  first_dropped_collected_at  TEXT NOT NULL,
  last_dropped_collected_at   TEXT NOT NULL,
  first_reported_inventory_id TEXT NOT NULL,
  received_at                 TEXT NOT NULL,
  PRIMARY KEY (device_id, gap_id)
);

-- Recibos de idempotência (ACK). Expurgo pelo agendamento (scheduled) do módulo.
CREATE TABLE IF NOT EXISTS agent_message_receipts (
  device_id    TEXT NOT NULL,
  message_id   TEXT NOT NULL,
  body_hash    TEXT NOT NULL,
  ack_json     TEXT NOT NULL,
  expires_at   INTEGER NOT NULL,             -- epoch ms
  PRIMARY KEY (device_id, message_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_receipts_expires ON agent_message_receipts(expires_at);

-- Proteção de replay persistente.
CREATE TABLE IF NOT EXISTS agent_request_nonces (
  key_id      TEXT NOT NULL,
  nonce       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,              -- epoch ms
  PRIMARY KEY (key_id, nonce)
);
CREATE INDEX IF NOT EXISTS idx_agent_nonces_expires ON agent_request_nonces(expires_at);

-- Limites de taxa (janela fixa).
CREATE TABLE IF NOT EXISTS agent_rate_limits (
  rate_key      TEXT PRIMARY KEY,
  count         INTEGER NOT NULL,
  window_start  INTEGER NOT NULL             -- epoch ms
);

CREATE TABLE IF NOT EXISTS agent_identity_conflicts (
  conflict_id      TEXT PRIMARY KEY,
  detected_at      TEXT NOT NULL,
  kind             TEXT NOT NULL,
  installation_id  TEXT,
  key_id           TEXT,
  resolved_at      TEXT,
  resolved_by      TEXT
);

CREATE TABLE IF NOT EXISTS agent_audit_log (
  audit_id     TEXT PRIMARY KEY,
  at           TEXT NOT NULL,
  actor        TEXT NOT NULL,
  action       TEXT NOT NULL,
  target       TEXT,
  details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_audit_at ON agent_audit_log(at);

-- ===== Adaptação ao inventário SEMED (aditiva) =====
-- Localização confirmada DENTRO da ficha (fonte de verdade), conforme contrato: ambiente continua em environment_id/data_json.
ALTER TABLE equipments ADD COLUMN position_label TEXT;
ALTER TABLE equipments ADD COLUMN position_description TEXT;
ALTER TABLE equipments ADD COLUMN location_state TEXT NOT NULL DEFAULT 'declarada';
ALTER TABLE equipments ADD COLUMN location_confirmed_by TEXT;
ALTER TABLE equipments ADD COLUMN location_confirmed_at TEXT;
-- R3: presença monotônica por (boot_id, sequence); colunas explícitas permitem atualização condicional em SQL.
ALTER TABLE agent_presence ADD COLUMN boot_id TEXT;
ALTER TABLE agent_presence ADD COLUMN sequence INTEGER;
ALTER TABLE agent_presence ADD COLUMN collected_ms INTEGER;
CREATE INDEX IF NOT EXISTS idx_agent_links_device_time ON agent_equipment_links(device_id, linked_at);
CREATE INDEX IF NOT EXISTS idx_agent_enrollments_grant ON agent_enrollments(grant_id);
