import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {session,humanFetch,agentIdentity,machinePost,summary,heartbeatBody} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const endpoint='/api/root/equipment-delete',origin='https://test.local';
async function setup(){const f=collectorFixture(),s=seedEquipmentConsultation(f),root=await session(f,f.root),op=await session(f,f.operator),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',DEBUG_COLLECTION:'1'};
 const call=(p,d,sess=root,e=env)=>humanFetch(worker,e,origin,sess,p,d);
 const preview=async(id=s.printer)=>call(endpoint+'?'+new URLSearchParams({id,unitId:s.unit}));
 const command=async(id=s.printer)=>({id,unitId:s.unit,operationId:crypto.randomUUID(),snapshot:(await preview(id)).data.snapshot,reason:'Cadastro duplicado · TESTE ISOLADO',confirm:true});
 return {...f,...s,rootSession:root,op,env,call,preview,command};}
test('exclusão: preserva fotos, ficha e nomes; reduz contagens e não atinge outros equipamentos',async()=>{const f=await setup();try{
 f.photo(f.printer);const name=await f.call('/api/root/equipment-name',{id:f.printer,unitId:f.unit,name:'Impressora duplicada',version:0,operationId:crypto.randomUUID()});assert.equal(name.status,200);
 const photos=f.sqlite.prepare('SELECT * FROM collection_photos').all(),other=f.sqlite.prepare('SELECT * FROM equipments WHERE id<>?').all(f.printer);
 const before=f.sqlite.prepare('SELECT * FROM unit_collection_totals WHERE unit_id=?').get(f.unit),counts=f.sqlite.prepare('SELECT * FROM published_equipment_counts WHERE unit_id=? AND category=?').get(f.unit,'printer');
 const a=await f.command(),r=await f.call(endpoint,a);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.photosPreserved,1);
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM collection_photos').all(),photos);assert.deepEqual(f.sqlite.prepare('SELECT * FROM equipments WHERE id<>?').all(f.printer),other);
 assert.equal(f.sqlite.prepare('SELECT * FROM unit_collection_totals WHERE unit_id=?').get(f.unit).records,before.records-1);assert.equal(f.sqlite.prepare('SELECT * FROM published_equipment_counts WHERE unit_id=? AND category=?').get(f.unit,'printer').records,counts.records-1);
 const archive=(await f.call('/api/root/equipment-deleted?unitId='+f.unit)).data.items[0];assert.equal(archive.snapshot.displayName,'Impressora duplicada');assert.equal(archive.snapshot.record.id,f.printer);assert.equal(archive.snapshot.photos.length,1);
 assert.equal((await f.call('/api/inventory/equipment?'+new URLSearchParams({unitId:f.unit,q:f.printer}))).data.total,0);
 assert.equal((await f.call(endpoint,a)).data.replayed,true);assert.equal((await f.call(endpoint,{...a,reason:'Outra operação'})).status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_deletions').get().n,1);
 assert.throws(()=>f.sqlite.prepare('INSERT INTO equipments SELECT * FROM equipments WHERE id=?').run(other[0].id));
 const row=archive.snapshot.record,cols=Object.keys(row).filter(k=>k!=='storage_kind');assert.throws(()=>f.sqlite.prepare('INSERT INTO equipments('+cols.join(',')+') VALUES('+cols.map(()=>'?').join(',')+')').run(...cols.map(k=>row[k])),/EQUIPMENT_DELETED/);
}finally{f.sqlite.close();}});
test('exclusão: root apenas, no painel, com CSRF, motivo, confirmação e mesma unidade',async()=>{const f=await setup();try{
 const a=await f.command();assert.equal((await f.call(endpoint,a,f.op)).status,403);assert.equal((await f.call(endpoint,a,f.rootSession,{...f.env,APP_KIND:'collector'})).status,403);
 assert.equal((await humanFetch(worker,f.env,origin,f.rootSession,endpoint,a,{noCsrf:true})).status,403);
 for(const change of [{confirm:false},{reason:''},{snapshot:''},{operationId:'invalido'}])assert.equal((await f.call(endpoint,{...a,...change})).status,400);
 assert.equal((await f.call(endpoint,{...a,unitId:f.ids.assigned})).status,404);
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);assert.equal((await f.call(endpoint,a)).status,403);assert.equal((await f.call('/api/root/equipment-deleted?unitId='+f.unit)).status,403);}
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_deletions').get().n,0);
}finally{f.sqlite.close();}});
test('exclusão: prévia e transação detectam mudança concorrente, sem apagar ou arquivar parcialmente',async()=>{const f=await setup();try{
 let a=await f.command();f.sqlite.prepare('UPDATE equipments SET version=version+1 WHERE id=?').run(a.id);assert.equal((await f.call(endpoint,a)).status,409);
 a=await f.command();const batch=f.db.batch;f.db.batch=async st=>{f.db.batch=batch;f.sqlite.prepare('UPDATE equipments SET version=version+1 WHERE id=?').run(a.id);return batch(st);};assert.equal((await f.call(endpoint,a)).status,409);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_deletions').get().n,0);assert.ok(f.sqlite.prepare('SELECT id FROM equipments WHERE id=?').get(a.id));
}finally{f.sqlite.close();}});
test('exclusão: rascunho apagado não ressuscita por aba antiga; revisão e contagens da coleta são atualizadas',async()=>{const f=await setup();try{
 const open=crypto.randomUUID(),now=Date.now();f.sqlite.prepare("INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,questionnaire_version) VALUES(?,?,?,?,?,'coleta-3.0')").run(open,f.unit,f.root.id,now,now);
 f.sqlite.prepare('UPDATE equipments SET inspection_id=? WHERE id=?').run(open,f.draft);f.sqlite.prepare("INSERT INTO inspection_sections(inspection_id,section,state,updated_by,updated_at) VALUES(?,'F','Concluído',?,?)").run(open,f.root.id,now);
 const a=await f.command(f.draft);assert.equal((await f.call(endpoint,a)).status,200);
 assert.equal(f.sqlite.prepare('SELECT records FROM inspection_collection_totals WHERE inspection_id=?').get(open).records,0);assert.equal(f.sqlite.prepare('SELECT state FROM inspection_sections WHERE inspection_id=?').get(open).state,'Em andamento');assert.equal(f.sqlite.prepare('SELECT revision FROM inspections WHERE id=?').get(open).revision,2);
 const old=await f.call('/api/collector/equipment-save',{id:f.draft,inspectionId:open,data:{category:'computer'}},f.op);assert.equal(old.status,410,JSON.stringify(old));
}finally{f.sqlite.close();}});
test('exclusão: lote em Outros desconta quantidade correta; demandas e auditorias permanecem',async()=>{const f=await setup();try{
 const r=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(f.lot);r.id=crypto.randomUUID();r.category='other';r.data_json=JSON.stringify({category:'other',quantity:8});r.published_json=r.data_json;
 const cols=Object.keys(r);f.sqlite.prepare('INSERT INTO miscellaneous_equipments('+cols.join(',')+') VALUES('+cols.map(()=>'?').join(',')+')').run(...cols.map(k=>r[k]));
 const demand=await f.call('/api/operations/request-save',{id:crypto.randomUUID(),operationId:crypto.randomUUID(),version:0,unitId:f.unit,equipmentId:r.id,description:'TESTE ISOLADO · Manutenção',kind:'Manutenção',source:'Painel',requester:'',status:'Aberta',responsible:'',scheduledDate:'',note:''});assert.equal(demand.status,201,JSON.stringify(demand));const demands=f.sqlite.prepare('SELECT * FROM service_requests').all(),events=f.sqlite.prepare('SELECT * FROM service_request_events').all();
 const before=f.sqlite.prepare('SELECT items FROM unit_collection_totals WHERE unit_id=?').get(f.unit).items;
 assert.equal((await f.call(endpoint,await f.command(r.id))).status,200);assert.equal(f.sqlite.prepare('SELECT items FROM unit_collection_totals WHERE unit_id=?').get(f.unit).items,before-8);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM collection_history WHERE entity_id=? AND event=?').get(r.id,'equipment_deleted').n,1);assert.deepEqual(f.sqlite.prepare('SELECT * FROM service_requests').all(),demands);assert.deepEqual(f.sqlite.prepare('SELECT * FROM service_request_events').all(),events);
}finally{f.sqlite.close();}});
test('exclusão: agente mantém chave/instalação, perde vínculo ativo e pode renovar QR e vincular novamente',async()=>{const f=await setup();try{
 f.env.AGENTES_EXIGIR_AUTORIZACAO='nao';const identity=await agentIdentity(),api='/api/agent/v1',base={protocol_version:'1.0',request_id:crypto.randomUUID(),agent_version:'0.1.8'};
 const c=await worker.fetch(new Request(origin+api+'/enrollment-challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(base)}),f.env),ch=await c.json();assert.equal(c.status,200);
 const en=await machinePost(worker,f.env,origin,identity,api+'/enrollments',{...base,installation_id:identity.installationId,challenge_id:ch.challenge_id,challenge:ch.challenge,public_key_jwk:identity.publicJwk,summary},{scheme:'SEMED-Enroll',subject:ch.challenge_id});assert.equal(en.status,201,JSON.stringify(en));identity.deviceId=en.data.device_id;
 const visit=(await f.call('/api/collector/v3-start',{unitId:f.ids.assigned},f.op)).data.inspection;
 async function make(){const id=crypto.randomUUID(),saved=await f.call('/api/collector/equipment-save',{id,inspectionId:visit.id,draft:true,data:{category:'computer',mode:'Individual',quantity:1,registration:'Agente',environmentName:'TESTE ISOLADO · Sala',position_label:'Mesa 1',operation:'Funcionando'}},f.op);assert.equal(saved.status,201,JSON.stringify(saved));return {id,...saved.data};}
 async function claim(eq,code){const lock=(await f.call('/api/collector/equipment-lock',{id:eq.id,inspectionId:visit.id},f.op)).data.token;return f.call(api+'/pairings/claim',{request_id:crypto.randomUUID(),enrollment_id:en.data.enrollment_id,pairing_code:code,unit_id:f.ids.assigned,environment_id:eq.environment.id,inspection_id:visit.id,equipment:{mode:'existing',equipment_id:eq.id,expected_version:eq.version},position:{label:'Mesa 1'},lock_token:lock},f.op);}
 const eq=await make();assert.equal((await claim(eq,en.data.pairing_code)).status,201);
 const keys=f.sqlite.prepare('SELECT * FROM agent_keys').all(),installations=f.sqlite.prepare('SELECT * FROM agent_installations').all();
 const preview=(await f.call(endpoint+'?'+new URLSearchParams({id:eq.id,unitId:f.ids.assigned}))).data;
 assert.equal((await f.call(endpoint,{id:eq.id,unitId:f.ids.assigned,snapshot:preview.snapshot,operationId:crypto.randomUUID(),reason:'Duplicidade em teste isolado',confirm:true})).status,200);
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM agent_keys').all(),keys);assert.deepEqual(f.sqlite.prepare('SELECT * FROM agent_installations').all(),installations);
 assert.equal((await machinePost(worker,f.env,origin,identity,api+'/heartbeat',heartbeatBody(identity,{sequence:1}))).data.code,'DEVICE_NOT_LINKED');
 const renewed=await machinePost(worker,f.env,origin,identity,api+'/enrollment-renew',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId});assert.equal(renewed.status,200,JSON.stringify(renewed));
 const second=await make();assert.equal((await claim(second,renewed.data.pairing_code)).status,201);assert.equal((await machinePost(worker,f.env,origin,identity,api+'/heartbeat',heartbeatBody(identity,{sequence:2}))).status,200);
 assert.equal(f.sqlite.prepare('SELECT end_reason FROM agent_equipment_links WHERE equipment_id=?').get(eq.id).end_reason,'equipment_deleted');
}finally{f.sqlite.close();}});
