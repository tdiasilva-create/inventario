// Reproducible additive projection: no questionnaire answers copied into management tables.
import {writeFileSync} from 'node:fs';
const meaningful=ref=>`EXISTS(SELECT 1 FROM json_tree(${ref}.data_json) j WHERE j.type NOT IN ('object','array','null') AND (j.type<>'text' OR trim(j.atom)<>'') AND j.fullkey NOT LIKE '$.completed[%')`;
const sources=[
 ['sections','inspection_sections',r=>`${r}.inspection_id||':'||${r}.section`,r=>`(SELECT unit_id FROM inspections WHERE id=${r}.inspection_id)`,meaningful],
 ['visit','visit_answers',r=>`${r}.inspection_id`,r=>`(SELECT unit_id FROM inspections WHERE id=${r}.inspection_id)`,meaningful],
 ...['environments','equipments','miscellaneous_equipments'].map(t=>[t,t,r=>`${r}.id`,r=>`${r}.unit_id`,()=> '1']),
 ['photos','collection_photos',r=>`${r}.id`,r=>`${r}.unit_id`,r=>`${r}.status='ready'`]
];
let sql=`-- D-111: classification of inventory coverage, independent of inspection publication.
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
`;
for(const [source,table,key,unit,present] of sources){
 sql+=`INSERT INTO collection_data_presence SELECT '${source}',${key('s')},${unit('s')} FROM ${table} s WHERE ${present('s')};\n`;
 sql+=`CREATE TRIGGER coverage_${source}_insert AFTER INSERT ON ${table} WHEN ${present('NEW')} BEGIN
 INSERT INTO collection_data_presence VALUES('${source}',${key('NEW')},${unit('NEW')}); END;\n`;
 sql+=`CREATE TRIGGER coverage_${source}_delete AFTER DELETE ON ${table} BEGIN
 DELETE FROM collection_data_presence WHERE source='${source}' AND entity_id=${key('OLD')}; END;\n`;
 const columns=['sections','visit'].includes(source)?'data_json':source==='photos'?'status,unit_id':'unit_id';
 sql+=`CREATE TRIGGER coverage_${source}_update AFTER UPDATE OF ${columns} ON ${table}
 WHEN (${present('NEW')}) IS NOT (${present('OLD')}) OR ${unit('NEW')} IS NOT ${unit('OLD')}
 BEGIN
 DELETE FROM collection_data_presence WHERE source='${source}' AND entity_id=${key('OLD')};
 INSERT INTO collection_data_presence SELECT '${source}',${key('NEW')},${unit('NEW')} WHERE ${present('NEW')}; END;\n`;
}
// Retain review history if root deletes a unit; its ID will never be reused.
sql+=`CREATE TRIGGER coverage_unit_delete AFTER DELETE ON units BEGIN
 DELETE FROM collection_data_presence WHERE unit_id=OLD.id;
 DELETE FROM unit_collection_reviews WHERE unit_id=OLD.id;
END;\n`;
writeFileSync('migrations/0032_collection_control.sql',sql);
