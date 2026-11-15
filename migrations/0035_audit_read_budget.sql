-- D123: derived projections. Preserve all canonical records and historical decisions.
-- No trigger runs on heartbeat, GPS, session, photo or equipment-answer-only updates.
CREATE VIEW panel_hardware_source AS
 SELECT n.id AS notification_id,n.unit_id,n.detected_at,
 CASE WHEN hr.notification_id IS NULL THEN 'pending' ELSE 'demand' END AS state
 FROM agent_notifications n
 JOIN units u ON u.id=n.unit_id
 JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id
 LEFT JOIN agent_hardware_reviews hr ON hr.notification_id=n.id
 LEFT JOIN service_requests sr ON sr.id=hr.request_id
 WHERE n.kind='hardware_change'
 AND (hr.notification_id IS NULL OR (hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída'));
CREATE TABLE panel_hardware_active (
 notification_id TEXT PRIMARY KEY REFERENCES agent_notifications(id) ON DELETE CASCADE,
 unit_id TEXT NOT NULL,detected_at INTEGER NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','demand'))
);
CREATE INDEX panel_hardware_pending ON panel_hardware_active(detected_at DESC,notification_id DESC) WHERE state='pending';
CREATE INDEX panel_hardware_unit ON panel_hardware_active(unit_id);
CREATE TABLE panel_hardware_counts (
 unit_id TEXT PRIMARY KEY,pending INTEGER NOT NULL CHECK(pending>=0),demands INTEGER NOT NULL CHECK(demands>=0)
);
CREATE TRIGGER panel_hardware_count_insert AFTER INSERT ON panel_hardware_active BEGIN
 INSERT INTO panel_hardware_counts VALUES(NEW.unit_id,NEW.state='pending',NEW.state='demand')
 ON CONFLICT(unit_id) DO UPDATE SET pending=pending+excluded.pending,demands=demands+excluded.demands;
END;
CREATE TRIGGER panel_hardware_count_delete AFTER DELETE ON panel_hardware_active BEGIN
 UPDATE panel_hardware_counts SET pending=pending-(OLD.state='pending'),demands=demands-(OLD.state='demand') WHERE unit_id=OLD.unit_id;
 DELETE FROM panel_hardware_counts WHERE unit_id=OLD.unit_id AND pending=0 AND demands=0;
END;
INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source;
CREATE TRIGGER panel_hardware_notification_insert AFTER INSERT ON agent_notifications  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id=NEW.id;
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id=NEW.id;
END;
CREATE TRIGGER panel_hardware_notification_update AFTER UPDATE OF kind,unit_id,equipment_id,detected_at ON agent_notifications  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id=OLD.id OR notification_id=NEW.id;
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id=OLD.id OR notification_id=NEW.id;
END;
CREATE TRIGGER panel_hardware_notification_delete AFTER DELETE ON agent_notifications BEGIN DELETE FROM panel_hardware_active WHERE notification_id=OLD.id; END;
CREATE TRIGGER panel_hardware_review_insert AFTER INSERT ON agent_hardware_reviews  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id=NEW.notification_id;
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id=NEW.notification_id;
END;
CREATE TRIGGER panel_hardware_review_update AFTER UPDATE OF notification_id,decision,request_id ON agent_hardware_reviews  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (OLD.notification_id,NEW.notification_id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (OLD.notification_id,NEW.notification_id);
END;
CREATE TRIGGER panel_hardware_review_delete AFTER DELETE ON agent_hardware_reviews  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id=OLD.notification_id;
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id=OLD.notification_id;
END;
CREATE TRIGGER panel_hardware_request_insert AFTER INSERT ON service_requests  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=NEW.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=NEW.id);
END;
CREATE TRIGGER panel_hardware_request_delete AFTER DELETE ON service_requests  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=OLD.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=OLD.id);
END;
CREATE TRIGGER panel_hardware_request_update AFTER UPDATE OF status ON service_requests WHEN OLD.status IS NOT NEW.status BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=NEW.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT notification_id FROM agent_hardware_reviews WHERE request_id=NEW.id);
END;
CREATE TRIGGER panel_hardware_units_insert AFTER INSERT ON units  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT id FROM agent_notifications WHERE unit_id=NEW.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT id FROM agent_notifications WHERE unit_id=NEW.id);
END;
CREATE TRIGGER panel_hardware_units_delete AFTER DELETE ON units  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT id FROM agent_notifications WHERE unit_id=OLD.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT id FROM agent_notifications WHERE unit_id=OLD.id);
END;
CREATE TRIGGER panel_hardware_equipments_insert AFTER INSERT ON equipments  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT id FROM agent_notifications WHERE equipment_id=NEW.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT id FROM agent_notifications WHERE equipment_id=NEW.id);
END;
CREATE TRIGGER panel_hardware_equipments_delete AFTER DELETE ON equipments  BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT id FROM agent_notifications WHERE equipment_id=OLD.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT id FROM agent_notifications WHERE equipment_id=OLD.id);
END;
CREATE TRIGGER panel_hardware_equipment_move AFTER UPDATE OF unit_id ON equipments WHEN OLD.unit_id IS NOT NEW.unit_id BEGIN
 DELETE FROM panel_hardware_active WHERE notification_id IN (SELECT id FROM agent_notifications WHERE equipment_id=NEW.id);
 INSERT INTO panel_hardware_active SELECT * FROM panel_hardware_source WHERE notification_id IN (SELECT id FROM agent_notifications WHERE equipment_id=NEW.id);
END;

-- Demands survive unit deletion by design. Scope '' = whole network; other scopes = unit IDs.
CREATE TABLE service_request_counts (
 scope TEXT NOT NULL,status TEXT NOT NULL,total INTEGER NOT NULL CHECK(total>=0),
 PRIMARY KEY(scope,status)
);
INSERT INTO service_request_counts SELECT '',status,COUNT(*) FROM service_requests GROUP BY status
 UNION ALL SELECT unit_id,status,COUNT(*) FROM service_requests GROUP BY unit_id,status;
CREATE TRIGGER service_request_count_insert AFTER INSERT ON service_requests BEGIN
 INSERT INTO service_request_counts VALUES('',NEW.status,1),(NEW.unit_id,NEW.status,1)
 ON CONFLICT(scope,status) DO UPDATE SET total=total+1;
END;
CREATE TRIGGER service_request_count_delete AFTER DELETE ON service_requests BEGIN
 UPDATE service_request_counts SET total=total-1 WHERE scope IN ('',OLD.unit_id) AND status=OLD.status;
END;
CREATE TRIGGER service_request_count_update AFTER UPDATE OF status,unit_id ON service_requests
 WHEN OLD.status IS NOT NEW.status OR OLD.unit_id IS NOT NEW.unit_id BEGIN
 UPDATE service_request_counts SET total=total-1 WHERE scope IN ('',OLD.unit_id) AND status=OLD.status;
 INSERT INTO service_request_counts VALUES('',NEW.status,1),(NEW.unit_id,NEW.status,1)
 ON CONFLICT(scope,status) DO UPDATE SET total=total+1;
END;
-- Page reads should visit the requested page, not sort closed requests to find pending ones.
CREATE INDEX service_request_pending_order ON service_requests(updated_at DESC,id DESC) WHERE status!='Concluída';
CREATE INDEX service_request_unit_pending_order ON service_requests(unit_id,updated_at DESC,id DESC) WHERE status!='Concluída';
CREATE INDEX service_request_all_order ON service_requests(updated_at DESC,id DESC);
CREATE INDEX service_request_unit_order ON service_requests(unit_id,updated_at DESC,id DESC);
