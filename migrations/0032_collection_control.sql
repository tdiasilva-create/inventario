-- D-111: classification of inventory coverage, independent of inspection publication.
CREATE TABLE collection_data_presence(source TEXT NOT NULL,entity_id TEXT NOT NULL,unit_id TEXT NOT NULL,PRIMARY KEY(source,entity_id));
CREATE INDEX collection_data_presence_unit ON collection_data_presence(unit_id);
CREATE TABLE unit_collection_reviews(unit_id TEXT PRIMARY KEY,status TEXT NOT NULL CHECK(status IN ('partial','complete')),version INTEGER NOT NULL,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,updated_at INTEGER NOT NULL,operation_id TEXT NOT NULL UNIQUE);
CREATE TABLE unit_collection_review_history(operation_id TEXT PRIMARY KEY,unit_id TEXT NOT NULL,before_status TEXT NOT NULL,after_status TEXT NOT NULL,version INTEGER NOT NULL,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX collection_review_history_unit ON unit_collection_review_history(unit_id,created_at DESC,operation_id);
CREATE TRIGGER collection_review_audit_insert AFTER INSERT ON unit_collection_reviews BEGIN
 INSERT INTO unit_collection_review_history SELECT NEW.operation_id,NEW.unit_id,CASE WHEN EXISTS(SELECT 1 FROM collection_data_presence WHERE unit_id=NEW.unit_id) THEN 'partial' ELSE 'none' END,NEW.status,NEW.version,NEW.actor_id,NEW.actor_name,NEW.updated_at;
END;
CREATE TRIGGER collection_review_audit_update AFTER UPDATE ON unit_collection_reviews BEGIN
 INSERT INTO unit_collection_review_history VALUES(NEW.operation_id,NEW.unit_id,OLD.status,NEW.status,NEW.version,NEW.actor_id,NEW.actor_name,NEW.updated_at);
END;
INSERT INTO collection_data_presence SELECT 'sections',s.inspection_id||':'||s.section,(SELECT unit_id FROM inspections WHERE id=s.inspection_id) FROM inspection_sections s WHERE EXISTS(SELECT 1 FROM json_tree(s.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%');
CREATE TRIGGER coverage_sections_insert AFTER INSERT ON inspection_sections WHEN EXISTS(SELECT 1 FROM json_tree(NEW.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%') BEGIN
 INSERT INTO collection_data_presence VALUES('sections',NEW.inspection_id||':'||NEW.section,(SELECT unit_id FROM inspections WHERE id=NEW.inspection_id)); END;
CREATE TRIGGER coverage_sections_delete AFTER DELETE ON inspection_sections BEGIN
 DELETE FROM collection_data_presence WHERE source='sections' AND entity_id=OLD.inspection_id||':'||OLD.section; END;
CREATE TRIGGER coverage_sections_update AFTER UPDATE OF data_json ON inspection_sections
 WHEN (EXISTS(SELECT 1 FROM json_tree(NEW.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%')) IS NOT (EXISTS(SELECT 1 FROM json_tree(OLD.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%')) OR (SELECT unit_id FROM inspections WHERE id=NEW.inspection_id) IS NOT (SELECT unit_id FROM inspections WHERE id=OLD.inspection_id)
 BEGIN
 DELETE FROM collection_data_presence WHERE source='sections' AND entity_id=OLD.inspection_id||':'||OLD.section;
 INSERT INTO collection_data_presence SELECT 'sections',NEW.inspection_id||':'||NEW.section,(SELECT unit_id FROM inspections WHERE id=NEW.inspection_id) WHERE EXISTS(SELECT 1 FROM json_tree(NEW.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%'); END;
INSERT INTO collection_data_presence SELECT 'visit',s.inspection_id,(SELECT unit_id FROM inspections WHERE id=s.inspection_id) FROM visit_answers s WHERE EXISTS(SELECT 1 FROM json_tree(s.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%');
CREATE TRIGGER coverage_visit_insert AFTER INSERT ON visit_answers WHEN EXISTS(SELECT 1 FROM json_tree(NEW.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%') BEGIN
 INSERT INTO collection_data_presence VALUES('visit',NEW.inspection_id,(SELECT unit_id FROM inspections WHERE id=NEW.inspection_id)); END;
CREATE TRIGGER coverage_visit_delete AFTER DELETE ON visit_answers BEGIN
 DELETE FROM collection_data_presence WHERE source='visit' AND entity_id=OLD.inspection_id; END;
CREATE TRIGGER coverage_visit_update AFTER UPDATE OF data_json ON visit_answers
 WHEN (EXISTS(SELECT 1 FROM json_tree(NEW.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%')) IS NOT (EXISTS(SELECT 1 FROM json_tree(OLD.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%')) OR (SELECT unit_id FROM inspections WHERE id=NEW.inspection_id) IS NOT (SELECT unit_id FROM inspections WHERE id=OLD.inspection_id)
 BEGIN
 DELETE FROM collection_data_presence WHERE source='visit' AND entity_id=OLD.inspection_id;
 INSERT INTO collection_data_presence SELECT 'visit',NEW.inspection_id,(SELECT unit_id FROM inspections WHERE id=NEW.inspection_id) WHERE EXISTS(SELECT 1 FROM json_tree(NEW.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%'); END;
INSERT INTO collection_data_presence SELECT 'environments',s.id,s.unit_id FROM environments s WHERE 1;
CREATE TRIGGER coverage_environments_insert AFTER INSERT ON environments WHEN 1 BEGIN
 INSERT INTO collection_data_presence VALUES('environments',NEW.id,NEW.unit_id); END;
CREATE TRIGGER coverage_environments_delete AFTER DELETE ON environments BEGIN
 DELETE FROM collection_data_presence WHERE source='environments' AND entity_id=OLD.id; END;
CREATE TRIGGER coverage_environments_update AFTER UPDATE OF unit_id ON environments
 WHEN (1) IS NOT (1) OR NEW.unit_id IS NOT OLD.unit_id
 BEGIN
 DELETE FROM collection_data_presence WHERE source='environments' AND entity_id=OLD.id;
 INSERT INTO collection_data_presence SELECT 'environments',NEW.id,NEW.unit_id WHERE 1; END;
INSERT INTO collection_data_presence SELECT 'equipments',s.id,s.unit_id FROM equipments s WHERE 1;
CREATE TRIGGER coverage_equipments_insert AFTER INSERT ON equipments WHEN 1 BEGIN
 INSERT INTO collection_data_presence VALUES('equipments',NEW.id,NEW.unit_id); END;
CREATE TRIGGER coverage_equipments_delete AFTER DELETE ON equipments BEGIN
 DELETE FROM collection_data_presence WHERE source='equipments' AND entity_id=OLD.id; END;
CREATE TRIGGER coverage_equipments_update AFTER UPDATE OF unit_id ON equipments
 WHEN (1) IS NOT (1) OR NEW.unit_id IS NOT OLD.unit_id
 BEGIN
 DELETE FROM collection_data_presence WHERE source='equipments' AND entity_id=OLD.id;
 INSERT INTO collection_data_presence SELECT 'equipments',NEW.id,NEW.unit_id WHERE 1; END;
INSERT INTO collection_data_presence SELECT 'miscellaneous_equipments',s.id,s.unit_id FROM miscellaneous_equipments s WHERE 1;
CREATE TRIGGER coverage_miscellaneous_equipments_insert AFTER INSERT ON miscellaneous_equipments WHEN 1 BEGIN
 INSERT INTO collection_data_presence VALUES('miscellaneous_equipments',NEW.id,NEW.unit_id); END;
CREATE TRIGGER coverage_miscellaneous_equipments_delete AFTER DELETE ON miscellaneous_equipments BEGIN
 DELETE FROM collection_data_presence WHERE source='miscellaneous_equipments' AND entity_id=OLD.id; END;
CREATE TRIGGER coverage_miscellaneous_equipments_update AFTER UPDATE OF unit_id ON miscellaneous_equipments
 WHEN (1) IS NOT (1) OR NEW.unit_id IS NOT OLD.unit_id
 BEGIN
 DELETE FROM collection_data_presence WHERE source='miscellaneous_equipments' AND entity_id=OLD.id;
 INSERT INTO collection_data_presence SELECT 'miscellaneous_equipments',NEW.id,NEW.unit_id WHERE 1; END;
INSERT INTO collection_data_presence SELECT 'photos',s.id,s.unit_id FROM collection_photos s WHERE s.status='ready';
CREATE TRIGGER coverage_photos_insert AFTER INSERT ON collection_photos WHEN NEW.status='ready' BEGIN
 INSERT INTO collection_data_presence VALUES('photos',NEW.id,NEW.unit_id); END;
CREATE TRIGGER coverage_photos_delete AFTER DELETE ON collection_photos BEGIN
 DELETE FROM collection_data_presence WHERE source='photos' AND entity_id=OLD.id; END;
CREATE TRIGGER coverage_photos_update AFTER UPDATE OF status,unit_id ON collection_photos
 WHEN (NEW.status='ready') IS NOT (OLD.status='ready') OR NEW.unit_id IS NOT OLD.unit_id
 BEGIN
 DELETE FROM collection_data_presence WHERE source='photos' AND entity_id=OLD.id;
 INSERT INTO collection_data_presence SELECT 'photos',NEW.id,NEW.unit_id WHERE NEW.status='ready'; END;
CREATE TRIGGER coverage_unit_delete AFTER DELETE ON units BEGIN
 DELETE FROM collection_data_presence WHERE unit_id=OLD.id;
 DELETE FROM unit_collection_reviews WHERE unit_id=OLD.id;
END;
