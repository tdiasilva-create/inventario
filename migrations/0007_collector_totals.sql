CREATE TABLE unit_collection_totals(unit_id TEXT PRIMARY KEY,records INTEGER NOT NULL DEFAULT 0,items INTEGER NOT NULL DEFAULT 0,problems INTEGER NOT NULL DEFAULT 0);
INSERT INTO unit_collection_totals(unit_id,records,items,problems) SELECT unit_id,COUNT(*),SUM(CAST(COALESCE(json_extract(data_json,'$.quantity'),1) AS INTEGER)),SUM(CASE WHEN COALESCE(json_extract(data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END) FROM equipments GROUP BY unit_id;
CREATE TRIGGER equipment_totals_insert AFTER INSERT ON equipments BEGIN
 INSERT INTO unit_collection_totals(unit_id,records,items,problems) VALUES(NEW.unit_id,1,CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER),CASE WHEN COALESCE(json_extract(NEW.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END)
 ON CONFLICT(unit_id) DO UPDATE SET records=records+1,items=items+excluded.items,problems=problems+excluded.problems;
END;
CREATE TRIGGER equipment_totals_update AFTER UPDATE OF data_json ON equipments BEGIN
 UPDATE unit_collection_totals SET items=items+CAST(COALESCE(json_extract(NEW.data_json,'$.quantity'),1) AS INTEGER)-CAST(COALESCE(json_extract(OLD.data_json,'$.quantity'),1) AS INTEGER),problems=problems+(CASE WHEN COALESCE(json_extract(NEW.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END)-(CASE WHEN COALESCE(json_extract(OLD.data_json,'$.problems'),'')<>'' THEN 1 ELSE 0 END) WHERE unit_id=NEW.unit_id;
END;
CREATE INDEX equipment_unit_category ON equipments(unit_id,category,created_at DESC,id DESC);
