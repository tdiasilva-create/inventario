-- D-070: apenas tabelas novas; sem alterar cadastros, fotos, protocolo ou snapshots.
CREATE TABLE agent_monitor_cursors (
 device_id TEXT PRIMARY KEY REFERENCES agent_devices(device_id),
 link_id TEXT NOT NULL,
 collected_ms INTEGER NOT NULL,
 components_json TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 commit_token TEXT NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE agent_notifications (
 id TEXT PRIMARY KEY,
 event_key TEXT NOT NULL UNIQUE,
 device_id TEXT NOT NULL,
 link_id TEXT NOT NULL,
 equipment_id TEXT NOT NULL,
 unit_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('hardware_change','communication_lost')),
 observed_at TEXT NOT NULL,
 detected_at INTEGER NOT NULL,
 details_json TEXT NOT NULL,
 resolved_at INTEGER,
 resolution TEXT
);
CREATE INDEX agent_notifications_recent ON agent_notifications(detected_at DESC,id DESC);
CREATE INDEX agent_notifications_equipment ON agent_notifications(equipment_id,detected_at DESC);
CREATE INDEX agent_notifications_open ON agent_notifications(kind,resolved_at,link_id);
CREATE TABLE agent_notification_reads (
 notification_id TEXT NOT NULL REFERENCES agent_notifications(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 read_at INTEGER NOT NULL,
 PRIMARY KEY(notification_id,user_id)
);
CREATE TABLE agent_monitor_health (id INTEGER PRIMARY KEY CHECK(id=1),last_success_at INTEGER NOT NULL,processed INTEGER NOT NULL);
