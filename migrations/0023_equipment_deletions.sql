-- D-078: retirar cadastros ativos conservando uma cópia integral e os anexos.
CREATE TABLE equipment_deletions (
 equipment_id TEXT PRIMARY KEY,
 unit_id TEXT NOT NULL,
 operation_id TEXT NOT NULL UNIQUE,
 actor_id TEXT NOT NULL,
 actor_name TEXT NOT NULL,
 reason TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 snapshot_json TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX equipment_deletions_unit ON equipment_deletions(unit_id,created_at DESC,equipment_id);
-- Abas antigas nunca podem reutilizar um ID já retirado do inventário.
CREATE TRIGGER equipment_deleted_identity BEFORE INSERT ON equipments
 WHEN EXISTS(SELECT 1 FROM equipment_deletions WHERE equipment_id=NEW.id)
 BEGIN SELECT RAISE(ABORT,'EQUIPMENT_DELETED'); END;
CREATE TRIGGER misc_deleted_identity BEFORE INSERT ON miscellaneous_equipments
 WHEN EXISTS(SELECT 1 FROM equipment_deletions WHERE equipment_id=NEW.id)
 BEGIN SELECT RAISE(ABORT,'EQUIPMENT_DELETED'); END;
CREATE TRIGGER equipment_totals_delete AFTER DELETE ON equipments BEGIN
 UPDATE unit_collection_totals SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),problems=problems-(CASE WHEN COALESCE(json_extract(OLD.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END) WHERE unit_id=OLD.unit_id;
 UPDATE inspection_collection_totals SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),new_records=new_records-(OLD.published_json IS NULL),changed_records=changed_records-(OLD.published_json IS NOT NULL) WHERE inspection_id=OLD.inspection_id;
 UPDATE published_equipment_counts SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.published_json,'$.quantity'),1) AS INTEGER) WHERE unit_id=OLD.unit_id AND category=json_extract(OLD.published_json,'$.category') AND OLD.published_json IS NOT NULL;
END;
CREATE TRIGGER misc_equipment_totals_delete AFTER DELETE ON miscellaneous_equipments BEGIN
 UPDATE unit_collection_totals SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),problems=problems-(CASE WHEN COALESCE(json_extract(OLD.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END) WHERE unit_id=OLD.unit_id;
 UPDATE inspection_collection_totals SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),new_records=new_records-(OLD.published_json IS NULL),changed_records=changed_records-(OLD.published_json IS NOT NULL) WHERE inspection_id=OLD.inspection_id;
 UPDATE published_equipment_counts SET records=records-1,items=items-CAST(COALESCE(json_extract(OLD.published_json,'$.quantity'),1) AS INTEGER) WHERE unit_id=OLD.unit_id AND category=json_extract(OLD.published_json,'$.category') AND OLD.published_json IS NOT NULL;
END;
