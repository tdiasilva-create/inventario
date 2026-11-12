-- D-105. Separate technician capability; no change to existing roles or inventory.
CREATE TABLE dispatch_meta(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL DEFAULT 0, attempt TEXT NOT NULL DEFAULT '');
INSERT INTO dispatch_meta(id) VALUES(1);
CREATE TABLE dispatch_technicians(user_id TEXT PRIMARY KEY REFERENCES users(id),enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),updated_at INTEGER NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE dispatch_order(request_id TEXT PRIMARY KEY REFERENCES service_requests(id),position INTEGER NOT NULL);
INSERT INTO dispatch_order SELECT id,number*1024 FROM service_requests;
CREATE TABLE dispatch_assignments(id TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES service_requests(id),user_id TEXT NOT NULL REFERENCES users(id),assigned_at INTEGER NOT NULL,assigned_by TEXT NOT NULL,ended_at INTEGER);
CREATE UNIQUE INDEX dispatch_current_assignment ON dispatch_assignments(request_id,user_id) WHERE ended_at IS NULL;
CREATE INDEX dispatch_user_queue ON dispatch_assignments(user_id,ended_at,request_id);
CREATE TABLE dispatch_attendances(id TEXT PRIMARY KEY,assignment_id TEXT NOT NULL REFERENCES dispatch_assignments(id),request_id TEXT NOT NULL REFERENCES service_requests(id),user_id TEXT NOT NULL REFERENCES users(id),session_hash TEXT NOT NULL,started_at INTEGER NOT NULL,ended_at INTEGER,end_reason TEXT);
CREATE UNIQUE INDEX dispatch_active_user ON dispatch_attendances(user_id) WHERE ended_at IS NULL;
CREATE INDEX dispatch_request_attendance ON dispatch_attendances(request_id,ended_at);
CREATE TABLE dispatch_positions(attendance_id TEXT PRIMARY KEY REFERENCES dispatch_attendances(id),latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),accuracy REAL NOT NULL CHECK(accuracy>0),observed_at INTEGER NOT NULL,received_at INTEGER NOT NULL);
CREATE TABLE dispatch_receipts(operation_id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,payload_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE dispatch_events(id TEXT PRIMARY KEY,request_id TEXT,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,action TEXT NOT NULL,detail_json TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX dispatch_event_request ON dispatch_events(request_id,created_at);
CREATE TABLE dispatch_notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL REFERENCES users(id),request_id TEXT,message TEXT NOT NULL,created_at INTEGER NOT NULL,read_at INTEGER);
CREATE INDEX dispatch_notice_user ON dispatch_notifications(user_id,id);
CREATE TRIGGER dispatch_assignment_max BEFORE INSERT ON dispatch_assignments WHEN NEW.ended_at IS NULL BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM dispatch_assignments WHERE request_id=NEW.request_id AND ended_at IS NULL)>=2 THEN RAISE(ABORT,'DISPATCH_MAX_TWO') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM dispatch_technicians t JOIN users u ON u.id=t.user_id WHERE t.user_id=NEW.user_id AND t.enabled=1 AND u.active=1) THEN RAISE(ABORT,'DISPATCH_TECH_DISABLED') END;
END;
CREATE TRIGGER dispatch_request_insert AFTER INSERT ON service_requests BEGIN
 INSERT INTO dispatch_order VALUES(NEW.id,COALESCE((SELECT MAX(position) FROM dispatch_order),0)+1024);
 UPDATE dispatch_meta SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER dispatch_request_changed AFTER UPDATE ON service_requests BEGIN
 UPDATE dispatch_meta SET revision=revision+1 WHERE id=1;
 INSERT INTO dispatch_notifications(user_id,request_id,message,created_at) SELECT user_id,NEW.id,'Demanda #'||NEW.number||' atualizada: '||NEW.status,NEW.updated_at FROM dispatch_assignments WHERE request_id=NEW.id AND ended_at IS NULL;
END;
CREATE TRIGGER dispatch_request_completed AFTER UPDATE OF status ON service_requests WHEN NEW.status='Concluída' BEGIN
 UPDATE dispatch_attendances SET ended_at=NEW.updated_at,end_reason='completed' WHERE request_id=NEW.id AND ended_at IS NULL;
 DELETE FROM dispatch_positions WHERE attendance_id IN (SELECT id FROM dispatch_attendances WHERE request_id=NEW.id);
END;
CREATE TRIGGER dispatch_assignment_ended AFTER UPDATE OF ended_at ON dispatch_assignments WHEN NEW.ended_at IS NOT NULL BEGIN
 UPDATE dispatch_attendances SET ended_at=NEW.ended_at,end_reason='reassigned' WHERE assignment_id=NEW.id AND ended_at IS NULL;
 DELETE FROM dispatch_positions WHERE attendance_id IN (SELECT id FROM dispatch_attendances WHERE assignment_id=NEW.id);
END;
CREATE TRIGGER dispatch_attendance_ended AFTER UPDATE OF ended_at ON dispatch_attendances WHEN NEW.ended_at IS NOT NULL BEGIN
 DELETE FROM dispatch_positions WHERE attendance_id=NEW.id;
END;
CREATE TRIGGER dispatch_technician_disabled AFTER UPDATE OF enabled ON dispatch_technicians WHEN NEW.enabled=0 BEGIN
 UPDATE dispatch_assignments SET ended_at=NEW.updated_at WHERE user_id=NEW.user_id AND ended_at IS NULL;
 UPDATE dispatch_meta SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER dispatch_user_disabled AFTER UPDATE OF active ON users WHEN NEW.active=0 BEGIN
 UPDATE dispatch_assignments SET ended_at=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE user_id=NEW.id AND ended_at IS NULL;
 UPDATE dispatch_meta SET revision=revision+1 WHERE id=1;
END;
CREATE TRIGGER dispatch_session_removed AFTER DELETE ON sessions BEGIN
 UPDATE dispatch_attendances SET ended_at=CAST(strftime('%s','now') AS INTEGER)*1000,end_reason='session_ended' WHERE session_hash=OLD.token_hash AND ended_at IS NULL;
END;
