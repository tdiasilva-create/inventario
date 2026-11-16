-- D126: preserve canonical requests/events; exclusion is an immutable tombstone.
CREATE TABLE service_request_deletions (
 request_id TEXT PRIMARY KEY REFERENCES service_requests(id),
 operation_id TEXT NOT NULL UNIQUE,
 actor_id TEXT NOT NULL,
 actor_name TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 1000),
 deleted_at INTEGER NOT NULL,
 payload_json TEXT NOT NULL
);
CREATE INDEX service_request_deletions_time ON service_request_deletions(deleted_at DESC,request_id);
CREATE VIEW service_requests_active AS
 SELECT r.* FROM service_requests r
 WHERE NOT EXISTS(SELECT 1 FROM service_request_deletions d WHERE d.request_id=r.id);
-- Only positive/open unit counters belong to the recurring map read.
CREATE INDEX service_request_open_scopes ON service_request_counts(scope,total)
 WHERE scope!='' AND status!='Concluída' AND total>0;

-- Business acceptance is distinct from GPS freshness or the lifetime of a cookie.
-- At most one accepted service per technician. This projection never stores GPS.
CREATE TABLE dispatch_service_activity (
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 assignment_id TEXT NOT NULL REFERENCES dispatch_assignments(id),
 request_id TEXT NOT NULL REFERENCES service_requests(id),
 started_at INTEGER NOT NULL
);
CREATE INDEX dispatch_service_activity_request ON dispatch_service_activity(request_id);
INSERT INTO dispatch_service_activity
 SELECT t.user_id,t.assignment_id,t.request_id,t.started_at
 FROM dispatch_attendances t
 JOIN dispatch_assignments a ON a.id=t.assignment_id AND a.ended_at IS NULL
 JOIN users u ON u.id=t.user_id AND u.active=1
 JOIN dispatch_technicians c ON c.user_id=t.user_id AND c.enabled=1
 JOIN service_requests r ON r.id=t.request_id AND r.status!='Concluída'
 WHERE t.ended_at IS NULL;
CREATE TRIGGER dispatch_service_accepted AFTER INSERT ON dispatch_attendances WHEN NEW.ended_at IS NULL BEGIN
 INSERT INTO dispatch_service_activity VALUES(NEW.user_id,NEW.assignment_id,NEW.request_id,NEW.started_at)
 ON CONFLICT(user_id) DO UPDATE SET assignment_id=excluded.assignment_id,request_id=excluded.request_id,started_at=excluded.started_at;
END;
CREATE TRIGGER dispatch_service_stopped AFTER UPDATE OF ended_at ON dispatch_attendances
 WHEN NEW.ended_at IS NOT NULL AND NEW.end_reason NOT IN ('session_expired','session_ended') BEGIN
 DELETE FROM dispatch_service_activity WHERE user_id=NEW.user_id AND assignment_id=NEW.assignment_id AND started_at=NEW.started_at;
END;
CREATE TRIGGER dispatch_service_unassigned AFTER UPDATE OF ended_at ON dispatch_assignments WHEN NEW.ended_at IS NOT NULL BEGIN
 DELETE FROM dispatch_service_activity WHERE assignment_id=NEW.id;
END;
CREATE TRIGGER dispatch_service_completed AFTER UPDATE OF status ON service_requests WHEN NEW.status='Concluída' BEGIN
 DELETE FROM dispatch_service_activity WHERE request_id=NEW.id;
END;
CREATE TRIGGER dispatch_service_user_revoked AFTER UPDATE OF active,credential_version ON users
 WHEN NEW.active=0 OR NEW.credential_version!=OLD.credential_version BEGIN
 DELETE FROM dispatch_service_activity WHERE user_id=NEW.id;
END;

-- A deleted hardware demand stays in the historical decision, outside live alerts.
DROP VIEW panel_hardware_source;
CREATE VIEW panel_hardware_source AS
 SELECT n.id AS notification_id,n.unit_id,n.detected_at,
 CASE WHEN hr.notification_id IS NULL THEN 'pending' ELSE 'demand' END AS state
 FROM agent_notifications n JOIN units u ON u.id=n.unit_id
 JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id
 LEFT JOIN agent_hardware_reviews hr ON hr.notification_id=n.id
 LEFT JOIN service_requests sr ON sr.id=hr.request_id
 WHERE n.kind='hardware_change'
 AND (hr.notification_id IS NULL OR (hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída'
 AND NOT EXISTS(SELECT 1 FROM service_request_deletions d WHERE d.request_id=hr.request_id)));

CREATE TRIGGER service_request_archive AFTER INSERT ON service_request_deletions BEGIN
 INSERT INTO dispatch_notifications(user_id,request_id,message,created_at)
 SELECT a.user_id,NEW.request_id,'Demanda #'||r.number||' excluída pelo root e retirada do roteiro. Histórico preservado.',NEW.deleted_at
 FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id
 WHERE a.request_id=NEW.request_id AND a.ended_at IS NULL;
 UPDATE dispatch_attendances SET ended_at=NEW.deleted_at,end_reason='request_deleted'
 WHERE request_id=NEW.request_id AND ended_at IS NULL;
 -- Existing D114 triggers decrement open_count and stop tracking ONLY if no work remains.
 UPDATE dispatch_assignments SET ended_at=NEW.deleted_at WHERE request_id=NEW.request_id AND ended_at IS NULL;
 DELETE FROM dispatch_service_activity WHERE request_id=NEW.request_id;
 UPDATE dispatch_meta SET revision=revision+1 WHERE id=1;
 DELETE FROM dispatch_road_routes;
 UPDATE service_request_counts SET total=total-1
 WHERE scope IN ('',(SELECT unit_id FROM service_requests WHERE id=NEW.request_id))
 AND status=(SELECT status FROM service_requests WHERE id=NEW.request_id);
 DELETE FROM panel_hardware_active WHERE notification_id IN
 (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=NEW.request_id);
 INSERT INTO audit(user_id,event,created_at) VALUES(NEW.actor_id,'request_deleted:'||NEW.request_id,NEW.deleted_at);
 INSERT INTO dispatch_events VALUES(NEW.operation_id,NEW.request_id,NEW.actor_id,NEW.actor_name,'delete',json_object('reason',NEW.reason),NEW.deleted_at);
 INSERT INTO service_request_events
 SELECT NEW.operation_id,r.id,NEW.actor_id,NEW.actor_name,NEW.payload_json,
 json_object('description',r.description,'kind',r.kind,'source',r.source,'status',r.status,'version',r.version,
 'responsible',r.responsible,'requester',r.requester,'scheduled_date',r.scheduled_date,'context',json(r.context_json),
 'unit_id',r.unit_id,'equipment_id',r.equipment_id,'deleted',json('true')),
 'Excluída pelo root. Motivo: '||NEW.reason,NEW.deleted_at FROM service_requests r WHERE r.id=NEW.request_id;
END;
CREATE TRIGGER service_request_archive_immutable BEFORE UPDATE ON service_request_deletions BEGIN SELECT RAISE(ABORT,'REQUEST_ARCHIVE_IMMUTABLE'); END;
CREATE TRIGGER service_request_archive_preserved BEFORE DELETE ON service_request_deletions BEGIN SELECT RAISE(ABORT,'REQUEST_ARCHIVE_PRESERVED'); END;
CREATE TRIGGER service_request_deleted_write BEFORE UPDATE ON service_requests
 WHEN EXISTS(SELECT 1 FROM service_request_deletions WHERE request_id=OLD.id) BEGIN SELECT RAISE(ABORT,'REQUEST_DELETED'); END;
CREATE TRIGGER service_request_deleted_purge BEFORE DELETE ON service_requests
 WHEN EXISTS(SELECT 1 FROM service_request_deletions WHERE request_id=OLD.id) BEGIN SELECT RAISE(ABORT,'REQUEST_ARCHIVE_PRESERVED'); END;
CREATE TRIGGER dispatch_deleted_assignment BEFORE INSERT ON dispatch_assignments
 WHEN EXISTS(SELECT 1 FROM service_request_deletions WHERE request_id=NEW.request_id) BEGIN SELECT RAISE(ABORT,'REQUEST_DELETED'); END;
CREATE TRIGGER dispatch_deleted_attendance BEFORE INSERT ON dispatch_attendances
 WHEN EXISTS(SELECT 1 FROM service_request_deletions WHERE request_id=NEW.request_id) BEGIN SELECT RAISE(ABORT,'REQUEST_DELETED'); END;
