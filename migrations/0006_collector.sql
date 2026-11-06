CREATE TABLE inspections(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL REFERENCES units(id),state TEXT NOT NULL DEFAULT 'open',questionnaire_version TEXT NOT NULL DEFAULT '1.0',created_by TEXT NOT NULL REFERENCES users(id),created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,completed_at INTEGER,revision INTEGER NOT NULL DEFAULT 1,completion_token TEXT);
CREATE UNIQUE INDEX inspection_open_unit ON inspections(unit_id) WHERE state='open';
CREATE INDEX inspection_unit_time ON inspections(unit_id,created_at);
CREATE TABLE inspection_sections(inspection_id TEXT NOT NULL REFERENCES inspections(id),section TEXT NOT NULL,data_json TEXT NOT NULL DEFAULT '{}',state TEXT NOT NULL DEFAULT 'Pendente',version INTEGER NOT NULL DEFAULT 1,updated_by TEXT NOT NULL,updated_at INTEGER NOT NULL,mutation_id TEXT,PRIMARY KEY(inspection_id,section));
CREATE TABLE environments(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL REFERENCES units(id),name TEXT NOT NULL,type TEXT NOT NULL,created_at INTEGER NOT NULL,created_by TEXT NOT NULL);
CREATE UNIQUE INDEX environment_unit_name ON environments(unit_id,name COLLATE NOCASE);
CREATE TABLE equipments(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL REFERENCES units(id),inspection_id TEXT NOT NULL REFERENCES inspections(id),category TEXT NOT NULL,environment_id TEXT NOT NULL REFERENCES environments(id),asset TEXT NOT NULL,serial TEXT NOT NULL,search_text TEXT NOT NULL,data_json TEXT NOT NULL,published_json TEXT,version INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL,created_at INTEGER NOT NULL,updated_by TEXT NOT NULL,updated_at INTEGER NOT NULL,verified_at INTEGER,verified_by TEXT,mutation_id TEXT,duplicate_flag INTEGER NOT NULL DEFAULT 0);
CREATE INDEX equipment_unit_page ON equipments(unit_id,created_at DESC,id DESC);
CREATE INDEX equipment_unit_identity ON equipments(unit_id,asset,serial);
CREATE TABLE equipment_locks(equipment_id TEXT PRIMARY KEY REFERENCES equipments(id),user_id TEXT NOT NULL,token TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE equipment_verifications(inspection_id TEXT NOT NULL REFERENCES inspections(id),equipment_id TEXT NOT NULL REFERENCES equipments(id),result TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',user_id TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(inspection_id,equipment_id));
CREATE TABLE collection_history(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,inspection_id TEXT NOT NULL,entity_id TEXT NOT NULL,event TEXT NOT NULL,before_json TEXT,after_json TEXT,actor_id TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX collection_history_entity ON collection_history(entity_id,created_at);
CREATE TABLE collection_conflicts(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,entity_id TEXT NOT NULL,actor_id TEXT NOT NULL,attempted_json TEXT NOT NULL,server_json TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE collection_photos(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,inspection_id TEXT NOT NULL,target_kind TEXT NOT NULL,target_id TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,mime_type TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,created_by TEXT NOT NULL,created_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'pending');
CREATE INDEX collection_photos_target ON collection_photos(target_kind,target_id,created_at);

CREATE INDEX equipment_unit_serial ON equipments(unit_id,serial);
