-- D-110: cheap revision guards, updated transactionally by BOTH Workers.
-- No business rows are altered. No triggers on heartbeats, GPS, sessions or photos.
CREATE TABLE panel_read_versions (
 name TEXT PRIMARY KEY CHECK(name IN ('results','fleet')),
 epoch TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;
INSERT INTO panel_read_versions(name,epoch) VALUES('results',lower(hex(randomblob(16)))),('fleet',lower(hex(randomblob(16))));

CREATE TRIGGER panel_revision_units_insert AFTER INSERT ON units BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results','fleet');
END;
CREATE TRIGGER panel_revision_units_delete AFTER DELETE ON units BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results','fleet');
END;
CREATE TRIGGER panel_revision_units_update AFTER UPDATE OF id,name,active,unit_type ON units WHEN (OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.active IS NOT NEW.active OR OLD.unit_type IS NOT NEW.unit_type) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results','fleet');
END;
CREATE TRIGGER panel_revision_inspections_insert AFTER INSERT ON inspections WHEN NEW.state='completed' BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results','fleet');
END;
CREATE TRIGGER panel_revision_inspections_delete AFTER DELETE ON inspections WHEN OLD.state='completed' BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results','fleet');
END;
CREATE TRIGGER panel_revision_inspections_update AFTER UPDATE OF id,state,unit_id,completed_at,questionnaire_version ON inspections WHEN (OLD.id IS NOT NEW.id OR OLD.state IS NOT NEW.state OR OLD.unit_id IS NOT NEW.unit_id OR OLD.completed_at IS NOT NEW.completed_at OR OLD.questionnaire_version IS NOT NEW.questionnaire_version) AND (OLD.state='completed' OR NEW.state='completed') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results','fleet');
END;
CREATE TRIGGER panel_revision_inspection_sections_insert AFTER INSERT ON inspection_sections WHEN EXISTS(SELECT 1 FROM inspections WHERE id=NEW.inspection_id AND state='completed') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_inspection_sections_delete AFTER DELETE ON inspection_sections WHEN EXISTS(SELECT 1 FROM inspections WHERE id=OLD.inspection_id AND state='completed') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_inspection_sections_update AFTER UPDATE OF inspection_id,data_json,section ON inspection_sections WHEN (OLD.inspection_id IS NOT NEW.inspection_id OR OLD.data_json IS NOT NEW.data_json OR OLD.section IS NOT NEW.section) AND (EXISTS(SELECT 1 FROM inspections WHERE id=OLD.inspection_id AND state='completed') OR EXISTS(SELECT 1 FROM inspections WHERE id=NEW.inspection_id AND state='completed')) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_visit_answers_insert AFTER INSERT ON visit_answers WHEN EXISTS(SELECT 1 FROM inspections WHERE id=NEW.inspection_id AND state='completed') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_visit_answers_delete AFTER DELETE ON visit_answers WHEN EXISTS(SELECT 1 FROM inspections WHERE id=OLD.inspection_id AND state='completed') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_visit_answers_update AFTER UPDATE OF inspection_id,data_json ON visit_answers WHEN (OLD.inspection_id IS NOT NEW.inspection_id OR OLD.data_json IS NOT NEW.data_json) AND (EXISTS(SELECT 1 FROM inspections WHERE id=OLD.inspection_id AND state='completed') OR EXISTS(SELECT 1 FROM inspections WHERE id=NEW.inspection_id AND state='completed')) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_equipments_insert AFTER INSERT ON equipments WHEN NEW.published_json IS NOT NULL BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_equipments_delete AFTER DELETE ON equipments WHEN OLD.published_json IS NOT NULL BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_equipments_update AFTER UPDATE OF unit_id,published_json ON equipments WHEN (OLD.unit_id IS NOT NEW.unit_id OR OLD.published_json IS NOT NEW.published_json) AND (OLD.published_json IS NOT NULL OR NEW.published_json IS NOT NULL) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_equipments_fleet_insert AFTER INSERT ON equipments BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_equipments_fleet_delete AFTER DELETE ON equipments BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_equipments_fleet_update AFTER UPDATE OF id,unit_id,category,data_json ON equipments WHEN OLD.id IS NOT NEW.id OR OLD.unit_id IS NOT NEW.unit_id OR COALESCE(NULLIF(OLD.category,''),json_extract(OLD.data_json,'$.category'),'') IS NOT COALESCE(NULLIF(NEW.category,''),json_extract(NEW.data_json,'$.category'),'') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_miscellaneous_equipments_insert AFTER INSERT ON miscellaneous_equipments WHEN NEW.published_json IS NOT NULL BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_miscellaneous_equipments_delete AFTER DELETE ON miscellaneous_equipments WHEN OLD.published_json IS NOT NULL BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_miscellaneous_equipments_update AFTER UPDATE OF unit_id,published_json ON miscellaneous_equipments WHEN (OLD.unit_id IS NOT NEW.unit_id OR OLD.published_json IS NOT NEW.published_json) AND (OLD.published_json IS NOT NULL OR NEW.published_json IS NOT NULL) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('results');
END;
CREATE TRIGGER panel_revision_miscellaneous_equipments_fleet_insert AFTER INSERT ON miscellaneous_equipments BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_miscellaneous_equipments_fleet_delete AFTER DELETE ON miscellaneous_equipments BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_miscellaneous_equipments_fleet_update AFTER UPDATE OF id,unit_id,category,data_json ON miscellaneous_equipments WHEN OLD.id IS NOT NEW.id OR OLD.unit_id IS NOT NEW.unit_id OR COALESCE(NULLIF(OLD.category,''),json_extract(OLD.data_json,'$.category'),'') IS NOT COALESCE(NULLIF(NEW.category,''),json_extract(NEW.data_json,'$.category'),'') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_agent_equipment_links_insert AFTER INSERT ON agent_equipment_links BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_agent_equipment_links_delete AFTER DELETE ON agent_equipment_links BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_agent_equipment_links_update AFTER UPDATE OF device_id,equipment_id,ended_at ON agent_equipment_links WHEN (OLD.device_id IS NOT NEW.device_id OR OLD.equipment_id IS NOT NEW.equipment_id OR OLD.ended_at IS NOT NEW.ended_at) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_agent_devices_insert AFTER INSERT ON agent_devices BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_agent_devices_delete AFTER DELETE ON agent_devices BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_agent_devices_update AFTER UPDATE OF device_id,state ON agent_devices WHEN (OLD.device_id IS NOT NEW.device_id OR OLD.state IS NOT NEW.state) BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_computer_context_insert AFTER INSERT ON computer_context WHEN NEW.kind='unit' BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_computer_context_delete AFTER DELETE ON computer_context WHEN OLD.kind='unit' BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
CREATE TRIGGER panel_revision_computer_context_update AFTER UPDATE OF target_id,kind,value,version ON computer_context WHEN (OLD.target_id IS NOT NEW.target_id OR OLD.kind IS NOT NEW.kind OR OLD.value IS NOT NEW.value OR OLD.version IS NOT NEW.version) AND (OLD.kind='unit' OR NEW.kind='unit') BEGIN
 UPDATE panel_read_versions SET revision=revision+1 WHERE name IN ('fleet');
END;
