import {collectorFixture} from './collector-db.mjs';
import {seedEquipmentConsultation} from './equipment-consultation.mjs';

// Isolated examples, never production records.
export function unitEquipmentMapFixture(){
 const f=collectorFixture(),d=seedEquipmentConsultation(f),db=f.sqlite;
 db.prepare('UPDATE units SET name=? WHERE id=?').run('DEMONSTRAÇÃO · Escola do organograma',d.unit);
 const room=(name,unit=d.unit)=>{const id=crypto.randomUUID();db.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(id,unit,name,'Sala',Date.now(),f.root.id);return id;};
 const second=room('Secretaria'),empty=room('Coordenação · vazia'),foreign=room('Secretaria',f.ids.assigned);
 // A moved partial record must follow current IDs, while its published location stays intact.
 const moved=d.items[1].id;
 db.prepare("UPDATE equipments SET environment_id=?,data_json=json_set(data_json,'$.environment',?,'$.environmentName','Secretaria','$.position_label','PC 01') WHERE id=?").run(second,second,moved);
 db.prepare("UPDATE equipments SET data_json=json_set(data_json,'$.position_label','PC 01') WHERE id=?").run(d.items[0].id);
 db.prepare('UPDATE equipments SET environment_id=? WHERE id=?').run(second,d.printer);
 // A broken cross-unit relationship belongs in the unknown bucket, not in either named sector.
 db.prepare('UPDATE equipments SET environment_id=? WHERE id=?').run(foreign,d.notebook);
 const orphan=crypto.randomUUID(),orphanData={category:'other',customCategory:'Estabilizador',mode:'Individual',environmentName:'Secretaria'};
 db.prepare('INSERT INTO miscellaneous_equipments(id,unit_id,inspection_id,category,asset,serial,search_text,data_json,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(orphan,d.unit,d.visit,'other','','','',JSON.stringify(orphanData),f.root.id,Date.now(),f.root.id,Date.now());
 db.prepare("UPDATE agent_presence SET data_json=json_set(data_json,'$.network_test_protocol',1) WHERE device_id=?").run(d.device);
 db.prepare('INSERT INTO agent_installations VALUES(?,?,?,?,?,NULL)').run(crypto.randomUUID(),d.device,'0.1.9-test','TEST-KEY',new Date().toISOString());
 return {...f,...d,second,empty,foreign,moved,orphan};
}
