ALTER TABLE equipments ADD COLUMN published_verified_at INTEGER;
ALTER TABLE equipments ADD COLUMN published_updated_at INTEGER;
CREATE TABLE inspection_environments(inspection_id TEXT NOT NULL REFERENCES inspections(id),environment_id TEXT NOT NULL,data_json TEXT NOT NULL,PRIMARY KEY(inspection_id,environment_id));
CREATE TABLE missing_equipment_cases(id TEXT PRIMARY KEY,equipment_id TEXT NOT NULL REFERENCES equipments(id),unit_id TEXT NOT NULL,inspection_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'open',reason TEXT NOT NULL,created_by TEXT NOT NULL,created_at INTEGER NOT NULL,resolved_by TEXT,resolved_at INTEGER);
CREATE UNIQUE INDEX missing_open_equipment ON missing_equipment_cases(equipment_id) WHERE state='open';
