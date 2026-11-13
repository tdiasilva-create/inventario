-- D114: one explicitly started tracking run per technician, across their open queue.
-- No existing attendance is promoted; old APKs keep their original lifecycle.
CREATE TABLE dispatch_tracking (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 session_hash TEXT NOT NULL,
 credential_version INTEGER NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,
 started_at INTEGER NOT NULL,
 ended_at INTEGER,
 end_reason TEXT
);
CREATE UNIQUE INDEX dispatch_tracking_current ON dispatch_tracking(user_id) WHERE ended_at IS NULL;
CREATE INDEX dispatch_tracking_session ON dispatch_tracking(session_hash) WHERE ended_at IS NULL;
-- A point lookup for each native tick, independent of completed queue history.
CREATE TABLE dispatch_open_counts(user_id TEXT PRIMARY KEY REFERENCES users(id),open_count INTEGER NOT NULL CHECK(open_count>=0));
INSERT INTO dispatch_open_counts SELECT a.user_id,COUNT(*) FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id WHERE a.ended_at IS NULL AND r.status!='Concluída' GROUP BY a.user_id;
CREATE TRIGGER dispatch_open_assigned AFTER INSERT ON dispatch_assignments
WHEN NEW.ended_at IS NULL AND EXISTS(SELECT 1 FROM service_requests WHERE id=NEW.request_id AND status!='Concluída') BEGIN
 INSERT INTO dispatch_open_counts VALUES(NEW.user_id,1) ON CONFLICT(user_id) DO UPDATE SET open_count=open_count+1;
END;
CREATE TRIGGER dispatch_open_unassigned AFTER UPDATE OF ended_at ON dispatch_assignments
WHEN OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL AND EXISTS(SELECT 1 FROM service_requests WHERE id=NEW.request_id AND status!='Concluída') BEGIN
 UPDATE dispatch_open_counts SET open_count=open_count-1 WHERE user_id=NEW.user_id;
END;
CREATE TRIGGER dispatch_open_assignment_deleted AFTER DELETE ON dispatch_assignments
WHEN OLD.ended_at IS NULL AND EXISTS(SELECT 1 FROM service_requests WHERE id=OLD.request_id AND status!='Concluída') BEGIN
 UPDATE dispatch_open_counts SET open_count=open_count-1 WHERE user_id=OLD.user_id;
END;
CREATE TRIGGER dispatch_open_request_status AFTER UPDATE OF status ON service_requests
WHEN (OLD.status='Concluída')!=(NEW.status='Concluída') BEGIN
 INSERT INTO dispatch_open_counts(user_id,open_count) SELECT user_id,0 FROM dispatch_assignments WHERE request_id=NEW.id AND ended_at IS NULL ON CONFLICT(user_id) DO NOTHING;
 UPDATE dispatch_open_counts SET open_count=open_count+CASE WHEN NEW.status='Concluída' THEN -1 ELSE 1 END WHERE user_id IN (SELECT user_id FROM dispatch_assignments WHERE request_id=NEW.id AND ended_at IS NULL);
END;
CREATE TABLE dispatch_tracking_positions (
 tracking_id TEXT PRIMARY KEY REFERENCES dispatch_tracking(id),
 latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 accuracy REAL NOT NULL CHECK(accuracy>0 AND accuracy<=5000),
 observed_at INTEGER NOT NULL,
 received_at INTEGER NOT NULL
);
CREATE TABLE dispatch_tracking_routes (
 tracking_id TEXT PRIMARY KEY REFERENCES dispatch_tracking(id),
 route_key TEXT NOT NULL,
 origin_latitude REAL NOT NULL,
 origin_longitude REAL NOT NULL,
 expires_at INTEGER NOT NULL,
 response_json TEXT NOT NULL
);
CREATE TRIGGER dispatch_tracking_ended AFTER UPDATE OF ended_at ON dispatch_tracking
WHEN NEW.ended_at IS NOT NULL BEGIN
 DELETE FROM dispatch_tracking_positions WHERE tracking_id=NEW.id;
 DELETE FROM dispatch_tracking_routes WHERE tracking_id=NEW.id;
END;
CREATE TRIGGER dispatch_tracking_position_deleted AFTER DELETE ON dispatch_tracking_positions
BEGIN DELETE FROM dispatch_tracking_routes WHERE tracking_id=OLD.tracking_id; END;
CREATE TRIGGER dispatch_tracking_queue_changed AFTER UPDATE OF revision ON dispatch_meta
BEGIN DELETE FROM dispatch_tracking_routes; END;
CREATE TRIGGER dispatch_tracking_last_completed AFTER UPDATE OF status ON service_requests
WHEN NEW.status='Concluída' BEGIN
 UPDATE dispatch_tracking SET ended_at=NEW.updated_at,end_reason='queue_completed'
 WHERE ended_at IS NULL AND user_id IN (SELECT user_id FROM dispatch_assignments WHERE request_id=NEW.id AND ended_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id
 WHERE a.user_id=dispatch_tracking.user_id AND a.ended_at IS NULL AND r.status!='Concluída');
END;
CREATE TRIGGER dispatch_tracking_last_unassigned AFTER UPDATE OF ended_at ON dispatch_assignments
WHEN NEW.ended_at IS NOT NULL BEGIN
 UPDATE dispatch_tracking SET ended_at=NEW.ended_at,end_reason='queue_unassigned'
 WHERE user_id=NEW.user_id AND ended_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id
 WHERE a.user_id=NEW.user_id AND a.ended_at IS NULL AND r.status!='Concluída');
END;
CREATE TRIGGER dispatch_tracking_disabled AFTER UPDATE OF enabled ON dispatch_technicians
WHEN NEW.enabled=0 BEGIN
 UPDATE dispatch_tracking SET ended_at=NEW.updated_at,end_reason='access_revoked' WHERE user_id=NEW.user_id AND ended_at IS NULL;
END;
CREATE TRIGGER dispatch_tracking_credentials AFTER UPDATE OF active,credential_version ON users
WHEN NEW.active=0 OR NEW.credential_version!=OLD.credential_version BEGIN
 UPDATE dispatch_tracking SET ended_at=CAST(strftime('%s','now') AS INTEGER)*1000,end_reason='credentials_revoked' WHERE user_id=NEW.id AND ended_at IS NULL;
END;
-- Natural cookie expiry must not end the native location capability (explicit
-- decision D114). Logout and revocation of a still-valid session do end it.
CREATE TRIGGER dispatch_tracking_session_revoked AFTER DELETE ON sessions
WHEN OLD.expires_at>CAST(strftime('%s','now') AS INTEGER)*1000 BEGIN
 UPDATE dispatch_tracking SET ended_at=CAST(strftime('%s','now') AS INTEGER)*1000,end_reason='session_revoked' WHERE session_hash=OLD.token_hash AND ended_at IS NULL;
END;
