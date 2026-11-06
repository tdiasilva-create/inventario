-- Keep a durable deletion receipt, independent of the removed master record.
CREATE TABLE root_deletions(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,actor_id TEXT NOT NULL,unit_json TEXT NOT NULL,impact_json TEXT NOT NULL,reason TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE photo_deletion_queue(object_key TEXT PRIMARY KEY,deletion_id TEXT NOT NULL,created_at INTEGER NOT NULL);
-- A failed precondition aborts the entire D1 batch before any deletion.
CREATE TABLE root_deletion_guard(id TEXT PRIMARY KEY,valid INTEGER NOT NULL CHECK(valid=1));
