ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
CREATE TABLE units (id TEXT PRIMARY KEY,name TEXT NOT NULL,name_key TEXT NOT NULL UNIQUE,code TEXT UNIQUE,address TEXT NOT NULL DEFAULT '',neighborhood TEXT NOT NULL DEFAULT '',latitude REAL,longitude REAL,active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE TABLE unit_assignments (user_id TEXT NOT NULL REFERENCES users(id),unit_id TEXT NOT NULL REFERENCES units(id),assigned_by TEXT NOT NULL REFERENCES users(id),assigned_at INTEGER NOT NULL,PRIMARY KEY(user_id,unit_id));
CREATE INDEX assignments_unit ON unit_assignments(unit_id);
CREATE TABLE unit_changes(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT NOT NULL,event TEXT NOT NULL,target_id TEXT NOT NULL,payload TEXT NOT NULL,created_at INTEGER NOT NULL);
