import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {unitRoutes} from '../server/units.mjs';import {collectorRoutes} from '../server/collector.mjs';
const request=(path,data)=>new Request('http://test'+path,{method:data?'POST':'GET',...(data?{body:JSON.stringify(data)}:{})});
test('root exclui unidade com vínculos, sem afetar outras unidades ou apagar autoria histórica',async()=>{
 const f=collectorFixture();f.sqlite.exec('PRAGMA foreign_keys=ON');
 const api=async(path,data,user=f.root)=>{const r=request(path,data);return unitRoutes(r,new URL(r.url),user,f.db,f.helpers);};
 const collect=async(path,data)=>{const r=request('/api/collector/'+path,data);const response=await collectorRoutes(r,new URL(r.url),f.operator,{DB:f.db},f.helpers);assert.ok(response.status<300,await response.clone().text());return response.json();};
 try{
 const {inspection}=await collect('start',{unitId:f.ids.pending}),{environment}=await collect('environment-save',{inspectionId:inspection.id,name:'Sala de teste isolado',type:'Outro ambiente'});
 const equipmentId=crypto.randomUUID();await collect('equipment-save',{inspectionId:inspection.id,id:equipmentId,data:{category:'desktop',mode:'Individual',quantity:1,environment:environment.id,asset:'00001',serial:'Não identificado',brand:'Não identificado',model:'Não identificado',condition:'Bom',operation:'Funcionando',use:'Em uso',technical:{}}});
 f.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),f.ids.pending,inspection.id,'equipment',equipmentId,'ISOLATED-TEST-PHOTO','image/jpeg',3,'test',f.operator.id,Date.now());
 // Exercise already-published data and every foreign-key dependency as well.
 f.sqlite.prepare('UPDATE equipments SET published_json=data_json WHERE id=?').run(equipmentId);
 f.sqlite.prepare("UPDATE inspections SET state='completed',completed_at=? WHERE id=?").run(Date.now(),inspection.id);
 f.sqlite.prepare('INSERT INTO inspection_environments(inspection_id,environment_id,data_json) VALUES(?,?,?)').run(inspection.id,environment.id,JSON.stringify(environment));
 f.sqlite.prepare('INSERT INTO published_unit_status(unit_id,visits,latest,environment_count) VALUES(?,1,?,1)').run(f.ids.pending,Date.now());
 f.sqlite.prepare('INSERT INTO equipment_locks(equipment_id,user_id,token,expires_at) VALUES(?,?,?,?)').run(equipmentId,f.operator.id,'test-lock',Date.now()+10000);
 f.sqlite.prepare('INSERT INTO missing_equipment_cases(id,equipment_id,unit_id,inspection_id,reason,created_by,created_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),equipmentId,f.ids.pending,inspection.id,'Teste isolado',f.operator.id,Date.now());
 const path='/api/root/unit-delete-preview?id='+f.ids.pending;
 for(const role of ['admin','operador','visualizador'])assert.equal((await api(path,undefined,{...f.root,role})).status,403);
 const preview=await(await api(path)).json();assert.equal(preview.impact.equipment,1);assert.equal(preview.impact.photos,1);
 const data={id:f.ids.pending,snapshot:preview.snapshot,confirmName:preview.unit.name,reason:'Cadastro incorreto em teste isolado'};
 assert.equal((await api('/api/root/unit-delete',{...data,confirmName:'outro nome'})).status,400);
 assert.equal((await api('/api/root/unit-delete',{...data,snapshot:'antigo'})).status,409);
 // A writer racing after the external check must roll back the whole batch.
 const realBatch=f.db.batch;f.db.batch=async statements=>{f.sqlite.prepare('UPDATE inspections SET revision=revision+1 WHERE id=?').run(inspection.id);return realBatch(statements);};
 assert.equal((await api('/api/root/unit-delete',data)).status,409);f.db.batch=realBatch;
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM root_deletions').get().n,0);
 const updated=await(await api(path)).json();data.snapshot=updated.snapshot;
 assert.equal((await api('/api/root/unit-delete',data)).status,200);
 for(const table of ['units','inspections','environments','equipments','collection_photos','unit_collection_totals','published_equipment_counts','published_unit_status']){
  const column=table==='units'?'id':'unit_id';assert.equal(f.sqlite.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${column}=?`).get(f.ids.pending).n,0,table);
 }
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM units WHERE id=?').get(f.ids.blocked).n,1);
 assert.ok(f.sqlite.prepare('SELECT COUNT(*) n FROM collection_history WHERE unit_id=?').get(f.ids.pending).n>0);
 assert.equal(f.sqlite.prepare('SELECT actor_id FROM root_deletions').get().actor_id,f.root.id);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM photo_deletion_queue').get().n,1);
 const cleanup=request('/api/root/photo-cleanup',{});
 const failed=await unitRoutes(cleanup,new URL(cleanup.url),f.root,f.db,{...f.helpers,photos:{delete:async()=>{throw Error('isolated storage failure');}}});
 assert.equal((await failed.json()).pending,1);
 const removed=[];const retry=request('/api/root/photo-cleanup',{}),retried=await unitRoutes(retry,new URL(retry.url),f.root,f.db,{...f.helpers,photos:{delete:async key=>removed.push(key)}});
 assert.equal((await retried.json()).pending,0);assert.deepEqual(removed,['ISOLATED-TEST-PHOTO']);
 assert.deepEqual(f.sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
 assert.equal((await api('/api/root/unit-delete',data)).status,404);
 }finally{f.sqlite.close();}
});
test('segundo operador continua a mesma vistoria e mantém autoria anterior e controle de versões',async()=>{
 const f=collectorFixture(),second={id:crypto.randomUUID(),role:'operador',username:'segundo'};
 f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(second.id,second.username,second.role,'TEST','TEST',Date.now());
 const api=async(path,data,user)=>{const r=request('/api/collector/'+path,data);return collectorRoutes(r,new URL(r.url),user,{DB:f.db},f.helpers);};
 try{
 const {inspection}=await(await api('start',{unitId:f.ids.blocked},f.operator)).json();
 assert.equal((await api('section-save',{inspectionId:inspection.id,section:'A',version:1,answers:{responsible:'Primeiro'}},f.operator)).status,200);
 const resumed=await(await api('start',{unitId:f.ids.blocked},second)).json();assert.equal(resumed.inspection.id,inspection.id);
 assert.equal((await api('section-save',{inspectionId:inspection.id,section:'A',version:2,answers:{responsible:'Segundo'}},second)).status,200);
 assert.equal((await api('section-save',{inspectionId:inspection.id,section:'A',version:2,answers:{responsible:'Antigo'}},f.operator)).status,409);
 const actors=f.sqlite.prepare("SELECT DISTINCT actor_id FROM collection_history WHERE inspection_id=? AND event='section_saved'").all(inspection.id).map(r=>r.actor_id);
 assert.deepEqual(new Set(actors),new Set([f.operator.id,second.id]));
 }finally{f.sqlite.close();}
});
