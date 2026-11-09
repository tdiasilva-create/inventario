// Dados sintéticos somente no SQLite em memória dos testes.
import {collectorFixture} from './collector-db.mjs';
import {seedEquipmentConsultation} from './equipment-consultation.mjs';
export function panelBlocksFixture(){
 const f=collectorFixture(),s=seedEquipmentConsultation(f),db=f.sqlite;
 db.prepare("UPDATE units SET unit_type='Escola municipal',latitude=-2.54,longitude=-44.17 WHERE id=?").run(s.unit);
 db.prepare("UPDATE units SET unit_type='Unidade administrativa',region='Outra' WHERE id<>?").run(s.unit);
 const facade=s.photo(s.unit);db.prepare("UPDATE collection_photos SET target_kind='facade',created_at=1 WHERE id=?").run(facade);
 for(let n=0;n<54;n++)s.photo();
 // 57 fotos oficiais desta unidade; fachada é anterior às últimas 50.
 db.prepare('INSERT INTO inspection_sections(inspection_id,section,data_json,updated_by,updated_at) VALUES(?,?,?,?,?)').run(s.visit,'A',JSON.stringify({name:'NOME PUBLICADO',role:'TESTE'}),f.root.id,Date.now());
 for(const item of s.items.filter(x=>x.id!==s.draft)){
  const data={...item.data,problems:'=TESTE()',priority:'Baixa'};
  db.prepare('UPDATE equipments SET published_json=? WHERE id=?').run(JSON.stringify(data),item.id);
 }
 const open=crypto.randomUUID();db.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(open,s.unit,f.root.id,Date.now(),Date.now());
 db.prepare('UPDATE equipments SET inspection_id=? WHERE id=?').run(open,s.items[0].id);
 const partial=s.photo(s.unit,s.unit,open);db.prepare("UPDATE collection_photos SET target_kind='facade' WHERE id=?").run(partial);
 return {...f,...s,facade,open,partial};
}
