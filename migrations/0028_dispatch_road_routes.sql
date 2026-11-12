-- D106: only the latest derived road route, never a location history.
CREATE TABLE dispatch_road_routes (
 attendance_id TEXT PRIMARY KEY REFERENCES dispatch_attendances(id) ON DELETE CASCADE,
 route_key TEXT NOT NULL,
 origin_latitude REAL NOT NULL,
 origin_longitude REAL NOT NULL,
 expires_at INTEGER NOT NULL,
 response_json TEXT NOT NULL
);
CREATE TABLE dispatch_routing_gate (
 id INTEGER PRIMARY KEY CHECK(id=1),
 next_at INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER NOT NULL DEFAULT 0,
 token TEXT
);
INSERT INTO dispatch_routing_gate(id) VALUES(1);
CREATE TRIGGER dispatch_road_route_position_deleted AFTER DELETE ON dispatch_positions
BEGIN DELETE FROM dispatch_road_routes WHERE attendance_id=OLD.attendance_id; END;
CREATE TRIGGER dispatch_road_route_attendance_ended AFTER UPDATE OF ended_at ON dispatch_attendances
WHEN NEW.ended_at IS NOT NULL
BEGIN DELETE FROM dispatch_road_routes WHERE attendance_id=NEW.id; END;
CREATE TRIGGER dispatch_road_route_queue_changed AFTER UPDATE OF revision ON dispatch_meta
BEGIN DELETE FROM dispatch_road_routes; END;
