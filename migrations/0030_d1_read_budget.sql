-- D-108: additive indexes and derived counters; no deletion or change to business records.
-- Equality lookups must not scan every visit of every unit on each dashboard poll.
CREATE INDEX inspection_unit_state ON inspections(unit_id,state);
CREATE INDEX service_requests_pending_unit ON service_requests(unit_id) WHERE status!='Concluída';
-- Preserve chronological comparisons for ISO timestamps with and without fractions.
-- The expression is identical to the monitor query, not a lexical date comparison.
CREATE INDEX agent_snap_monitor_range ON agent_inventory_snapshots(
 device_id,equipment_id,
 CAST((julianday(collected_at)-2440587.5)*86400000+0.5 AS INTEGER),inventory_id
);

-- A transactional projection of the existing D-085 rule, not a new definition.
-- Only unit eligibility and inspection state change it; heartbeat/GPS/draft edits
-- do NOT touch these counters. Both Workers participate through SQLite triggers.
CREATE VIEW panel_collection_state_source AS
 SELECT u.id AS unit_id,
 CASE WHEN u.active!=1 OR COALESCE(u.unit_type,'') IN ('Escola conveniada','Obra em andamento') THEN NULL
 WHEN EXISTS(SELECT 1 FROM inspections i WHERE i.unit_id=u.id AND i.state='open') THEN 'in_progress'
 WHEN EXISTS(SELECT 1 FROM inspections i WHERE i.unit_id=u.id AND i.state='completed') THEN NULL
 WHEN EXISTS(SELECT 1 FROM inspections i WHERE i.unit_id=u.id AND i.state='paused') THEN 'preserved'
 ELSE 'not_started' END AS state
 FROM units u;
CREATE TABLE panel_collection_states (
 unit_id TEXT PRIMARY KEY REFERENCES units(id) ON DELETE CASCADE,
 state TEXT CHECK(state IN ('not_started','in_progress','preserved'))
);
CREATE TABLE panel_collection_counts (
 state TEXT PRIMARY KEY CHECK(state IN ('not_started','in_progress','preserved')),
 total INTEGER NOT NULL CHECK(total>=0)
);
INSERT INTO panel_collection_counts VALUES('not_started',0),('in_progress',0),('preserved',0);
CREATE TRIGGER panel_collection_count_insert AFTER INSERT ON panel_collection_states WHEN NEW.state IS NOT NULL BEGIN
 UPDATE panel_collection_counts SET total=total+1 WHERE state=NEW.state;
END;
CREATE TRIGGER panel_collection_count_delete AFTER DELETE ON panel_collection_states WHEN OLD.state IS NOT NULL BEGIN
 UPDATE panel_collection_counts SET total=total-1 WHERE state=OLD.state;
END;
CREATE TRIGGER panel_collection_count_update AFTER UPDATE OF state ON panel_collection_states WHEN NEW.state IS NOT OLD.state BEGIN
 UPDATE panel_collection_counts SET total=total-1 WHERE state=OLD.state;
 UPDATE panel_collection_counts SET total=total+1 WHERE state=NEW.state;
END;
INSERT INTO panel_collection_states SELECT * FROM panel_collection_state_source;
CREATE TRIGGER panel_collection_unit_insert AFTER INSERT ON units BEGIN
 INSERT INTO panel_collection_states SELECT * FROM panel_collection_state_source WHERE unit_id=NEW.id;
END;
CREATE TRIGGER panel_collection_unit_update AFTER UPDATE OF active,unit_type ON units BEGIN
 UPDATE panel_collection_states SET state=(SELECT state FROM panel_collection_state_source WHERE unit_id=NEW.id) WHERE unit_id=NEW.id AND state IS NOT (SELECT state FROM panel_collection_state_source WHERE unit_id=NEW.id);
END;
CREATE TRIGGER panel_collection_visit_insert AFTER INSERT ON inspections BEGIN
 UPDATE panel_collection_states SET state=(SELECT state FROM panel_collection_state_source WHERE unit_id=NEW.unit_id) WHERE unit_id=NEW.unit_id AND state IS NOT (SELECT state FROM panel_collection_state_source WHERE unit_id=NEW.unit_id);
END;
CREATE TRIGGER panel_collection_visit_delete AFTER DELETE ON inspections BEGIN
 UPDATE panel_collection_states SET state=(SELECT state FROM panel_collection_state_source WHERE unit_id=OLD.unit_id) WHERE unit_id=OLD.unit_id AND state IS NOT (SELECT state FROM panel_collection_state_source WHERE unit_id=OLD.unit_id);
END;
CREATE TRIGGER panel_collection_visit_update AFTER UPDATE OF state,unit_id ON inspections WHEN OLD.state IS NOT NEW.state OR OLD.unit_id IS NOT NEW.unit_id BEGIN
 UPDATE panel_collection_states SET state=(SELECT state FROM panel_collection_state_source WHERE unit_id=panel_collection_states.unit_id) WHERE unit_id IN (OLD.unit_id,NEW.unit_id) AND state IS NOT (SELECT state FROM panel_collection_state_source WHERE unit_id=panel_collection_states.unit_id);
END;
