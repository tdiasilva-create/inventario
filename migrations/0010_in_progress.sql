-- Incremental monitoring totals: no full equipment scan for every refresh.
CREATE TABLE inspection_collection_totals(inspection_id TEXT PRIMARY KEY,records INTEGER NOT NULL DEFAULT 0,items INTEGER NOT NULL DEFAULT 0,new_records INTEGER NOT NULL DEFAULT 0,changed_records INTEGER NOT NULL DEFAULT 0);
INSERT INTO inspection_collection_totals(inspection_id,records,items,new_records,changed_records)
 SELECT inspection_id,COUNT(*),SUM(CAST(COALESCE(json_extract(data_json,'$.quantity'),1) AS INTEGER)),SUM(published_json IS NULL),SUM(published_json IS NOT NULL) FROM equipments GROUP BY inspection_id;
CREATE TRIGGER progress_equipment_insert AFTER INSERT ON equipments BEGIN
 INSERT INTO inspection_collection_totals(inspection_id,records,items,new_records,changed_records) VALUES(NEW.inspection_id,1,CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER),NEW.published_json IS NULL,NEW.published_json IS NOT NULL)
 ON CONFLICT(inspection_id) DO UPDATE SET records=records+1,items=items+excluded.items,new_records=new_records+excluded.new_records,changed_records=changed_records+excluded.changed_records;
END;
CREATE TRIGGER progress_equipment_update AFTER UPDATE OF inspection_id,data_json,published_json ON equipments WHEN NEW.inspection_id IS NOT OLD.inspection_id OR NEW.data_json IS NOT OLD.data_json OR NEW.published_json IS NOT OLD.published_json BEGIN
 UPDATE inspection_collection_totals SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),new_records=new_records-(OLD.published_json IS NULL),changed_records=changed_records-(OLD.published_json IS NOT NULL) WHERE inspection_id=OLD.inspection_id;
 INSERT INTO inspection_collection_totals(inspection_id,records,items,new_records,changed_records) VALUES(NEW.inspection_id,1,CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER),NEW.published_json IS NULL,NEW.published_json IS NOT NULL)
 ON CONFLICT(inspection_id) DO UPDATE SET records=records+1,items=items+excluded.items,new_records=new_records+excluded.new_records,changed_records=changed_records+excluded.changed_records;
END;
CREATE INDEX progress_equipment_page ON equipments(inspection_id,updated_at DESC,id DESC);
CREATE INDEX progress_history_page ON collection_history(inspection_id,created_at DESC,id DESC);
CREATE INDEX progress_inspections_page ON inspections(state,created_at DESC,id DESC);
