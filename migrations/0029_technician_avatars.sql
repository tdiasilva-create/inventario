-- D-107: private avatar files; no image bytes in D1 and no change to sessions/GPS.
CREATE TABLE technician_avatar_uploads (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), actor_id TEXT NOT NULL REFERENCES users(id),
 expected_version INTEGER NOT NULL, sha256 TEXT NOT NULL, byte_size INTEGER NOT NULL,
 object_key TEXT NOT NULL UNIQUE, storage_provider TEXT NOT NULL, storage_ref TEXT,
 state TEXT NOT NULL CHECK(state IN ('pending','ready','applied','conflict')), created_at INTEGER NOT NULL,
 upload_token TEXT, upload_until INTEGER
);
CREATE TABLE technician_profiles (
 user_id TEXT PRIMARY KEY REFERENCES users(id), image_id TEXT REFERENCES technician_avatar_uploads(id),
 version INTEGER NOT NULL DEFAULT 0, last_operation TEXT, updated_at INTEGER, updated_by TEXT
);
CREATE TABLE technician_avatar_events (
 operation_id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), actor_id TEXT NOT NULL,
 action TEXT NOT NULL, previous_id TEXT, image_id TEXT, version INTEGER NOT NULL, created_at INTEGER NOT NULL
);
