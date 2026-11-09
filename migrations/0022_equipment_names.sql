-- D-077: display names are independent from observations and agent hostnames.
CREATE TABLE equipment_names (
 equipment_id TEXT PRIMARY KEY REFERENCES equipments(id) ON DELETE CASCADE,
 unit_id TEXT NOT NULL REFERENCES units(id),
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 180),
 version INTEGER NOT NULL CHECK(version>0),
 updated_at INTEGER NOT NULL,
 updated_by TEXT NOT NULL
);
CREATE INDEX equipment_names_unit ON equipment_names(unit_id);
-- Keep the audit/receipt even after a separately authorized unit deletion.
CREATE TABLE equipment_name_events (
 operation_id TEXT PRIMARY KEY,
 equipment_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 actor_id TEXT NOT NULL,
 actor_name TEXT NOT NULL,
 before_name TEXT,
 after_name TEXT NOT NULL,
 from_version INTEGER NOT NULL,
 to_version INTEGER NOT NULL,
 payload_json TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX equipment_name_events_equipment ON equipment_name_events(equipment_id,created_at);
