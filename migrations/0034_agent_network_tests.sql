-- D118: pedidos explícitos root; nenhum teste automático ou arquivo de teste no D1.
CREATE TABLE agent_network_tests (
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL UNIQUE,
 requested_by TEXT NOT NULL,
 device_id TEXT NOT NULL,
 installation_id TEXT NOT NULL,
 link_id TEXT NOT NULL,
 equipment_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 context_json TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('light','speed')),
 state TEXT NOT NULL CHECK(state IN ('queued','running','cancelling','completed','failed','cancelled','expired')),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 started_at INTEGER,
 finished_at INTEGER,
 attempt_id TEXT,
 cancelled_by TEXT,
 result_json TEXT,
 observation_json TEXT
);
CREATE UNIQUE INDEX agent_network_one_per_unit ON agent_network_tests(unit_id) WHERE state IN ('queued','running','cancelling');
CREATE INDEX agent_network_delivery ON agent_network_tests(device_id,state,expires_at);
CREATE INDEX agent_network_history ON agent_network_tests(created_at DESC,id);
CREATE INDEX agent_network_unit_history ON agent_network_tests(unit_id,created_at DESC);
