-- D-081: decisão administrativa separada da leitura individual e da telemetria.
-- IDs/contexto sobrevivem à retirada do cadastro; decisões são imutáveis.
CREATE TABLE agent_hardware_reviews (
 notification_id TEXT PRIMARY KEY,
 decision TEXT NOT NULL CHECK(decision IN ('accepted','demand')),
 request_id TEXT UNIQUE,
 operation_id TEXT NOT NULL UNIQUE,
 actor_id TEXT NOT NULL,
 actor_name TEXT NOT NULL,
 note TEXT NOT NULL,
 decided_at INTEGER NOT NULL,
 payload_json TEXT NOT NULL,
 context_json TEXT NOT NULL,
 CHECK((decision='accepted' AND request_id IS NULL) OR (decision='demand' AND request_id IS NOT NULL))
);
CREATE INDEX hardware_review_request ON agent_hardware_reviews(request_id);
