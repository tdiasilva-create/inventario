-- D-071. Additive: no alteration of inventories, accounts or agent protocol.
-- Snapshots and IDs intentionally survive root deletion of a unit/equipment.
CREATE TABLE service_requests (
 id TEXT PRIMARY KEY,
 number INTEGER NOT NULL UNIQUE,
 unit_id TEXT NOT NULL,
 equipment_id TEXT,
 context_json TEXT NOT NULL,
 description TEXT NOT NULL,
 kind TEXT NOT NULL,
 source TEXT NOT NULL,
 requester TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL CHECK(status IN ('Aberta','Em atendimento','Aguardando material','Visita agendada','Concluída')),
 responsible TEXT NOT NULL DEFAULT '',
 scheduled_date TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 created_by TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 last_operation TEXT NOT NULL UNIQUE
);
CREATE INDEX service_requests_queue ON service_requests(status,updated_at DESC);
CREATE INDEX service_requests_unit ON service_requests(unit_id,equipment_id);
CREATE TABLE service_request_events (
 operation_id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL REFERENCES service_requests(id),
 actor_id TEXT NOT NULL,
 actor_name TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 snapshot_json TEXT NOT NULL,
 note TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX service_events_history ON service_request_events(request_id,created_at);
CREATE TABLE computer_context (
 target_id TEXT PRIMARY KEY,
 unit_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('unit','environment')),
 value TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL
);
CREATE TABLE computer_context_events (
 id TEXT PRIMARY KEY,
 target_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 before_json TEXT,
 after_json TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
