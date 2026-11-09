-- D-076: correct the label, never replace the environment or its references.
ALTER TABLE environments ADD COLUMN name_version INTEGER NOT NULL DEFAULT 1;
CREATE TABLE environment_name_events (
 operation_id TEXT PRIMARY KEY,
 environment_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 inspection_id TEXT,
 actor_id TEXT NOT NULL,
 before_name TEXT NOT NULL,
 after_name TEXT NOT NULL,
 from_version INTEGER NOT NULL,
 to_version INTEGER NOT NULL,
 payload_json TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
-- No cascading foreign keys: retain correction history after an authorized unit deletion.
CREATE INDEX environment_name_history ON environment_name_events(environment_id,created_at);
