-- D-057 / V3: outros equipamentos com ID permanente, sem inventar um ambiente.
-- Migração exclusivamente aditiva; nenhuma ficha, tabela ou fotografia antiga é removida.
CREATE TABLE miscellaneous_equipments(id TEXT PRIMARY KEY,unit_id TEXT NOT NULL REFERENCES units(id),inspection_id TEXT NOT NULL REFERENCES inspections(id),category TEXT NOT NULL,environment_id TEXT REFERENCES environments(id),asset TEXT NOT NULL,serial TEXT NOT NULL,search_text TEXT NOT NULL,data_json TEXT NOT NULL,published_json TEXT,version INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL,created_at INTEGER NOT NULL,updated_by TEXT NOT NULL,updated_at INTEGER NOT NULL,verified_at INTEGER,verified_by TEXT,mutation_id TEXT,duplicate_flag INTEGER NOT NULL DEFAULT 0,published_verified_at INTEGER,published_updated_at INTEGER,position_label TEXT,position_description TEXT,location_state TEXT NOT NULL DEFAULT 'declarada',location_confirmed_by TEXT,location_confirmed_at TEXT);
CREATE TABLE miscellaneous_locks(equipment_id TEXT PRIMARY KEY REFERENCES miscellaneous_equipments(id),user_id TEXT NOT NULL,token TEXT NOT NULL,expires_at INTEGER NOT NULL);
CREATE INDEX miscellaneous_unit_page ON miscellaneous_equipments(unit_id,created_at DESC,id DESC);
CREATE INDEX miscellaneous_inspection_page ON miscellaneous_equipments(inspection_id,updated_at DESC,id DESC);
CREATE VIEW inventory_equipment_all AS SELECT *, 'legacy' AS storage_kind FROM equipments UNION ALL SELECT *, 'misc' AS storage_kind FROM miscellaneous_equipments;
ALTER TABLE environments ADD COLUMN name_key TEXT;
CREATE UNIQUE INDEX environment_normalized_name ON environments(unit_id,name_key) WHERE name_key IS NOT NULL;
CREATE TRIGGER misc_equipment_totals_insert AFTER INSERT ON miscellaneous_equipments BEGIN
 INSERT INTO unit_collection_totals(unit_id,records,items,problems) VALUES(NEW.unit_id,1,CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER),CASE WHEN COALESCE(json_extract(NEW.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END)
 ON CONFLICT(unit_id) DO UPDATE SET records=records+1,items=items+excluded.items,problems=problems+excluded.problems;
END;
CREATE TRIGGER misc_equipment_totals_update AFTER UPDATE OF data_json ON miscellaneous_equipments BEGIN
 UPDATE unit_collection_totals SET items=items+CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER)-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),problems=problems+(CASE WHEN COALESCE(json_extract(NEW.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END)-(CASE WHEN COALESCE(json_extract(OLD.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END) WHERE unit_id=NEW.unit_id;
END;
CREATE TRIGGER misc_published_equipment_update AFTER UPDATE OF published_json ON miscellaneous_equipments WHEN NEW.published_json IS NOT OLD.published_json BEGIN
 UPDATE published_equipment_counts SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.published_json,'$.quantity'),1) AS INTEGER) WHERE unit_id=OLD.unit_id AND category=json_extract(OLD.published_json,'$.category') AND OLD.published_json IS NOT NULL;
 INSERT INTO published_equipment_counts(unit_id,category,records,items) SELECT NEW.unit_id,json_extract(NEW.published_json,'$.category'),1,CAST(COALESCE(json_extract(NEW.published_json,'$.quantity'),1) AS INTEGER) WHERE NEW.published_json IS NOT NULL ON CONFLICT(unit_id,category) DO UPDATE SET records=records+1,items=items+excluded.items;
END;
CREATE TRIGGER misc_progress_equipment_insert AFTER INSERT ON miscellaneous_equipments BEGIN
 INSERT INTO inspection_collection_totals(inspection_id,records,items,new_records,changed_records) VALUES(NEW.inspection_id,1,CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER),NEW.published_json IS NULL,NEW.published_json IS NOT NULL)
 ON CONFLICT(inspection_id) DO UPDATE SET records=records+1,items=items+excluded.items,new_records=new_records+excluded.new_records,changed_records=changed_records+excluded.changed_records;
END;
CREATE TRIGGER misc_progress_equipment_update AFTER UPDATE OF inspection_id,data_json,published_json ON miscellaneous_equipments WHEN NEW.inspection_id IS NOT OLD.inspection_id OR NEW.data_json IS NOT OLD.data_json OR NEW.published_json IS NOT OLD.published_json BEGIN
 UPDATE inspection_collection_totals SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),new_records=new_records-(OLD.published_json IS NULL),changed_records=changed_records-(OLD.published_json IS NOT NULL) WHERE inspection_id=OLD.inspection_id;
 INSERT INTO inspection_collection_totals(inspection_id,records,items,new_records,changed_records) VALUES(NEW.inspection_id,1,CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER),NEW.published_json IS NULL,NEW.published_json IS NOT NULL)
 ON CONFLICT(inspection_id) DO UPDATE SET records=records+1,items=items+excluded.items,new_records=new_records+excluded.new_records,changed_records=changed_records+excluded.changed_records;
END;
