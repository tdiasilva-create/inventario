import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {describePhotos} from '../server/photo-labels.mjs';
import worker from '../server/worker.mjs';
const origin='https://test.local';
async function setup(){
 const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY'},actors=[f.root,f.operator];
 for(const role of ['operador','visualizador','admin']){const u={id:crypto.randomUUID(),username:crypto.randomUUID(),role};f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(u.id,u.username,role,'TEST','TEST',Date.now());actors.push(u);}
 const sessions=await Promise.all(actors.map(u=>session(f,u)));
 const call=(path,data,actor=1)=>humanFetch(worker,env,origin,sessions[actor],path,data);
 const visit=(await call('/api/collector/v3-start',{unitId:f.ids.pending})).data.inspection;
 const room=(await call('/api/collector/environment-save',{inspectionId:visit.id,name:'Laboratorio errado'})).data.environment;
 const command=(name,version=1)=>({id:room.id,version,name,operationId:crypto.randomUUID(),inspectionId:visit.id});
 return {...f,env,sessions,call,visit,room,command};
}
const mobile='/api/collector/environment-rename',desktop='/api/root/environment-rename';
test('rename: mantém ID, equipamentos/fotos e snapshots; reflete nome corrigido no painel e nas legendas',async()=>{
 const f=await setup();try{
  const equipmentId=crypto.randomUUID(),photoId=crypto.randomUUID();
  const created=await f.call('/api/collector/equipment-save',{inspectionId:f.visit.id,id:equipmentId,environmentId:f.room.id,data:{category:'computer',mode:'Individual',quantity:1,registration:'Manual',manualReason:'Sistema incompatível',position_label:'PC 01',operation:'Funcionando',assetStatus:'Sem patrimônio'}});assert.equal(created.status,201,JSON.stringify(created));
  f.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(photoId,f.ids.pending,f.visit.id,'environment',f.room.id,'TEST-ONLY','image/jpeg',1,'TEST',f.operator.id,Date.now(),'ready');
  f.sqlite.prepare('INSERT INTO inspection_environments VALUES(?,?,?)').run(f.visit.id,f.room.id,JSON.stringify(f.room));
  f.sqlite.prepare('UPDATE equipments SET published_json=data_json WHERE id=?').run(equipmentId);
  const device=crypto.randomUUID(),link=crypto.randomUUID();
  f.sqlite.prepare("INSERT INTO agent_devices(device_id,state,created_at) VALUES(?,'linked',?)").run(device,new Date().toISOString());
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at) VALUES(?,?,?,?,?,?)').run(link,device,equipmentId,f.visit.id,f.operator.id,new Date().toISOString());
  const originalLink=f.sqlite.prepare('SELECT * FROM agent_equipment_links WHERE link_id=?').get(link);
  const original=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(equipmentId),photo=f.sqlite.prepare('SELECT * FROM collection_photos WHERE id=?').get(photoId);
  const changed=await f.call(mobile,f.command('Laboratório de informática'));assert.equal(changed.status,200,JSON.stringify(changed));assert.equal(changed.data.environment.id,f.room.id);assert.equal(changed.data.environment.name_version,2);
  assert.deepEqual(f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(equipmentId),original);
  assert.deepEqual(f.sqlite.prepare('SELECT * FROM collection_photos WHERE id=?').get(photoId),photo);
  assert.deepEqual(f.sqlite.prepare('SELECT * FROM agent_equipment_links WHERE link_id=?').get(link),originalLink);
  assert.equal(JSON.parse(f.sqlite.prepare('SELECT data_json FROM inspection_environments').get().data_json).name,'Laboratorio errado');
  const event=f.sqlite.prepare('SELECT * FROM environment_name_events').get();assert.equal(event.before_name,'Laboratorio errado');assert.equal(event.after_name,'Laboratório de informática');assert.equal(event.actor_id,f.operator.id);
  assert.equal(f.sqlite.prepare('SELECT created_by FROM environments WHERE id=?').get(f.room.id).created_by,f.operator.id);
  assert.equal(f.sqlite.prepare('SELECT state FROM inspections WHERE id=?').get(f.visit.id).state,'open');
  // Simulate an already published visit only inside this isolated test database.
  f.sqlite.prepare("UPDATE inspections SET state='completed',completed_at=? WHERE id=?").run(Date.now(),f.visit.id);
  const detail=await f.call('/api/inventory/unit?unitId='+f.ids.pending,undefined,0);assert.equal(detail.status,200,JSON.stringify(detail));assert.equal(detail.data.environments[0].name,'Laboratório de informática');
  const page=await f.call('/api/inventory/equipment?unitId='+f.ids.pending+'&q=informática',undefined,0);assert.equal(page.data.total,1);assert.equal(page.data.items[0].environment_name,'Laboratório de informática');
  const photos=await describePhotos(f.db,[photo]);assert.equal(photos[0].label,'Ambiente · Laboratório de informática');
  const operation=await f.call('/api/operations/computers?unitId='+f.ids.pending,undefined,0);assert.equal(operation.data.items[0].environment_name,'Laboratório de informática');
 }finally{f.sqlite.close();}
});
test('rename: root corrige pelo painel sem criar visita; demais perfis não ganham permissão administrativa',async()=>{
 const f=await setup();try{
  f.sqlite.prepare("UPDATE inspections SET state='completed',completed_at=? WHERE id=?").run(Date.now(),f.visit.id);
  const payload={...f.command('Secretaria'),unitId:f.ids.pending};delete payload.inspectionId;
  for(const actor of [1,2,3,4])assert.equal((await f.call(desktop,payload,actor)).status,403);
  assert.equal((await f.call(mobile,f.command('Bloqueado'))).status,409);
  const r=await f.call(desktop,payload,0);assert.equal(r.status,200,JSON.stringify(r));
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM inspections WHERE unit_id=? AND state='open'").get(f.ids.pending).n,0);
  assert.equal(f.sqlite.prepare('SELECT inspection_id FROM environment_name_events').get().inspection_id,null);
  assert.equal((await f.call('/api/root/environments?unitId='+f.ids.pending,undefined,0)).data.environments[0].name,'Secretaria');
 }finally{f.sqlite.close();}
});
test('rename: valida nomes/duplicidade inclusive legados, unidade, sessão e reabertura manual',async()=>{
 const f=await setup();try{
  for(const name of ['', '   ', 'x'.repeat(181),null,123])assert.equal((await f.call(mobile,f.command(name))).status,400);
  f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),f.ids.pending,'Secretária','',Date.now(),f.root.id);
  assert.equal((await f.call(mobile,f.command(' SECRETARIA '))).status,409);
  assert.equal((await f.call(mobile,{...f.command('Sala'),id:crypto.randomUUID()})).status,404);
  const another=(await f.call('/api/collector/v3-start',{unitId:f.ids.blocked})).data.inspection;
  assert.equal((await f.call(mobile,{...f.command('Sala'),inspectionId:another.id})).status,404);
  assert.equal((await f.call(mobile,f.command('Sala'),3)).status,403);
  assert.equal((await worker.fetch(new Request(origin+mobile,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(f.command('Sala'))}),f.env)).status,401);
  assert.equal((await worker.fetch(new Request(origin+mobile,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:f.sessions[1].cookie,'X-CSRF-Token':'invalid'},body:JSON.stringify(f.command('Sala'))}),f.env)).status,403);
  f.sqlite.prepare("UPDATE inspection_sections SET state='Concluído' WHERE inspection_id=? AND section='B'").run(f.visit.id);
  assert.match((await f.call(mobile,f.command('Sala'))).data.error,/reabertura/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environment_name_events').get().n,0);
 }finally{f.sqlite.close();}
});
test('rename: conflito entre operadores preserva tentativa e registro, sem último a salvar ganhar',async()=>{
 const f=await setup();try{
  const first=await f.call(mobile,f.command('Sala A'),2);assert.equal(first.status,200);
  const second=await f.call(mobile,f.command('Sala B'));assert.equal(second.status,409);assert.equal(second.data.server.name,'Sala A');
  assert.equal(f.sqlite.prepare('SELECT name FROM environments WHERE id=?').get(f.room.id).name,'Sala A');
  const conflict=f.sqlite.prepare('SELECT * FROM collection_conflicts').get();assert.equal(JSON.parse(conflict.attempted_json).name,'Sala B');assert.equal(JSON.parse(conflict.server_json).name,'Sala A');
  const confirmed=await f.call(mobile,f.command('Sala B',2));assert.equal(confirmed.status,200);
  const back=await f.call(mobile,f.command('Laboratorio errado',3));assert.equal(back.status,200);
  assert.equal((await f.call(mobile,f.command('ABA não pode sobrescrever',1))).status,409);
 }finally{f.sqlite.close();}
});
test('rename: reenvio após perda da resposta não duplica histórico/revisão e não desfaz correção posterior',async()=>{
 const f=await setup();try{
  const payload=f.command('Sala correta'),first=await f.call(mobile,payload);assert.equal(first.status,200);
  const revision=f.sqlite.prepare('SELECT revision FROM inspections WHERE id=?').get(f.visit.id).revision;
  const replay=await f.call(mobile,payload);assert.equal(replay.status,200);assert.equal(replay.data.replayed,true);
  assert.equal(f.sqlite.prepare('SELECT revision FROM inspections WHERE id=?').get(f.visit.id).revision,revision);
  assert.equal((await f.call(mobile,{...payload,name:'Outro texto'})).status,409);
  assert.equal((await f.call(mobile,payload,2)).status,409);
  await f.call(mobile,f.command('Nome final',2),2);
  assert.equal((await f.call(mobile,payload)).data.environment.name,'Nome final');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environment_name_events').get().n,2);
  f.sqlite.prepare("UPDATE inspection_sections SET state='Concluído' WHERE inspection_id=? AND section='B'").run(f.visit.id);
  f.sqlite.prepare("UPDATE inspections SET state='completed',completed_at=? WHERE id=?").run(Date.now(),f.visit.id);
  assert.equal((await f.call(mobile,payload)).data.replayed,true,'Recibo pode ser confirmado após concluir a visita, sem nova escrita');
 }finally{f.sqlite.close();}
});
test('rename: banco revalida conclusão concorrente e alteração sem mudança não grava',async()=>{
 const f=await setup();try{
  assert.equal((await f.call(mobile,f.command(f.room.name))).data.unchanged,true);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environment_name_events').get().n,0);
  const batch=f.db.batch;f.db.batch=async statements=>{f.sqlite.prepare("UPDATE inspections SET state='completed',completed_at=? WHERE id=?").run(Date.now(),f.visit.id);return batch(statements);};
  const blocked=await f.call(mobile,f.command('Não pode salvar'));assert.equal(blocked.status,409);
  assert.equal(f.sqlite.prepare('SELECT name FROM environments WHERE id=?').get(f.room.id).name,f.room.name);
 }finally{f.sqlite.close();}
});
