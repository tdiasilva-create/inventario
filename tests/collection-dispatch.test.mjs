import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import worker from '../server/worker.mjs';
import {collectionTasksSql} from '../server/collection-dispatch.mjs';
import {random} from '../server/security.mjs';
async function setup(){
 const f=collectorFixture();f.env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'};f.rs=await session(f,f.root);f.os=await session(f,f.operator);
 f.call=(path,data,s=f.rs,opts)=>humanFetch(worker,f.env,'https://teste.invalid',s,path,data,opts);
 f.enable=(u=f.operator)=>f.sqlite.prepare('INSERT INTO dispatch_technicians VALUES(?,1,?,?)').run(u.id,Date.now(),f.root.id);
 f.payload=unitId=>({operationId:crypto.randomUUID(),unitId:unitId||f.ids.pending,technicianId:f.operator.id,notes:'TESTE ISOLADO · conferir computadores'});
 f.create=a=>f.call('/api/dispatch/collection-designate',a||f.payload());
 f.tasks=ids=>f.call('/api/dispatch/collection-tasks?unitIds='+encodeURIComponent(JSON.stringify(ids||[f.ids.pending])));
 return f;
}
test('D128: designar cria demanda, fila, histórico e aviso atomicamente, sem iniciar GPS nem concluir coleta',async()=>{
 const f=await setup();try{f.enable();
  const options=await f.call('/api/dispatch/collection-options?unitId='+f.ids.pending);assert.equal(options.status,200);assert.equal(options.data.technicians.length,1);assert.equal(options.data.unit.linked,0);
  const a=f.payload(),r=await f.create(a);assert.equal(r.status,201,JSON.stringify(r.data));assert.equal(r.data.request.id,a.operationId);
  const task=(await f.tasks()).data.tasks[0];assert.equal(task.technicians[0].id,f.operator.id);assert.equal(task.status,'Aberta');
  const q=await f.call('/api/technician/queue',undefined,f.os);assert.equal(q.data.items[0].id,a.operationId);assert.match(q.data.notifications[0].message,/Nova coleta atribuída/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events WHERE request_id=?').get(a.operationId).n,1);
  assert.equal(f.sqlite.prepare('SELECT open_count FROM dispatch_open_counts WHERE user_id=?').get(f.operator.id).open_count,1);
  for(const table of ['dispatch_attendances','dispatch_tracking','dispatch_positions'])assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM inspections WHERE state='completed' AND unit_id=?").get(f.ids.pending).n,0);
 }finally{f.sqlite.close();}
});

const revision=f=>f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision;
const version=(f,id)=>f.sqlite.prepare('SELECT version FROM service_requests WHERE id=?').get(id).version;
const command=(f,values)=>({operationId:crypto.randomUUID(),revision:revision(f),...values});
async function editStatus(f,id,status){
 const r=(await f.call('/api/operations/requests?id='+id)).data.request;
 return f.call('/api/operations/request-save',{id,operationId:crypto.randomUUID(),version:r.version,unitId:r.unit_id,equipmentId:null,description:r.description,kind:r.kind,source:r.source,requester:r.requester,status,responsible:r.responsible,scheduledDate:r.scheduled_date,note:'TESTE · mudança de estado'});
}
test('D128: concluir permite nova designação; reabrir não duplica; exclusão preserva histórico e impede replay antigo',async()=>{
 const f=await setup();try{f.enable();const a=f.payload();assert.equal((await f.create(a)).status,201);
  assert.equal((await editStatus(f,a.operationId,'Concluída')).status,200);
  const b=f.payload();assert.equal((await f.create(b)).status,201);
  assert.equal((await editStatus(f,a.operationId,'Aberta')).status,409);assert.equal((await f.tasks()).data.tasks.length,1);
  const preview=(await f.call('/api/operations/request-delete-preview?id='+b.operationId)).data;
  assert.equal((await f.call('/api/operations/request-delete',{id:b.operationId,version:preview.request.version,revision:preview.revision,operationId:crypto.randomUUID(),confirm:true,reason:'TESTE LOCAL · remover duplicação simulada'})).status,200);
  assert.equal((await f.create(b)).status,409);assert.equal((await editStatus(f,a.operationId,'Aberta')).status,200);
  assert.equal((await f.tasks()).data.tasks[0].id,a.operationId);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events WHERE request_id=?').get(b.operationId).n,2,'criação e exclusão continuam no histórico');
 }finally{f.sqlite.close();}
});
test('D128: atribuição pela Central conserva permissões, inclusive alteração concorrente do perfil',async()=>{
 const f=await setup();try{f.enable();f.enable(f.root);const a=f.payload();await f.create(a);
  const assign=ids=>f.call('/api/dispatch/assign',command(f,{id:a.operationId,userIds:ids}));
  assert.equal((await assign([f.root.id,f.operator.id])).status,200);
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);assert.equal((await assign([f.operator.id])).status,422);
  f.sqlite.prepare("UPDATE users SET role='operador' WHERE id=?").run(f.operator.id);
  const original=f.db.batch;f.db.batch=async statements=>{f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);return original(statements);};
  assert.equal((await assign([f.operator.id])).status,409);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_assignments WHERE request_id=? AND ended_at IS NULL').get(a.operationId).n,2,'não remove responsável anterior em falha');
 }finally{f.sqlite.close();}
});
test('D128: permissão alterada entre leitura e transação não cria demanda nem aviso',async()=>{
 const f=await setup();try{f.enable();const original=f.db.batch;f.db.batch=async statements=>{f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=0 WHERE user_id=?').run(f.operator.id);return original(statements);};
  assert.equal((await f.create()).status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_notifications').get().n,0);
 }finally{f.sqlite.close();}
});
test('D128: primeira aceitação inicia GPS; nova coleta amplia fila ativa; última conclusão encerra posição',async()=>{
 const f=await setup();try{f.enable();const a=f.payload(),b=f.payload(f.ids.progress);await f.create(a);
  const key={id:crypto.randomUUID(),token:random()},position=()=>({latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()});
  const accept=id=>f.call('/api/technician/accept',command(f,{id,version:version(f,id),position:position(),tracking:key}),f.os);
  const complete=id=>f.call('/api/technician/complete',command(f,{id,version:version(f,id)}),f.os);
  assert.equal((await accept(a.operationId)).status,200);await f.create(b);
  assert.equal(f.sqlite.prepare('SELECT open_count FROM dispatch_open_counts WHERE user_id=?').get(f.operator.id).open_count,2);
  assert.equal((await complete(a.operationId)).status,200);assert.equal(f.sqlite.prepare('SELECT ended_at FROM dispatch_tracking WHERE id=?').get(key.id).ended_at,null);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking_positions').get().n,1);
  assert.equal((await accept(b.operationId)).status,200);assert.equal((await complete(b.operationId)).status,200);
  assert.notEqual(f.sqlite.prepare('SELECT ended_at FROM dispatch_tracking WHERE id=?').get(key.id).ended_at,null);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking_positions').get().n,0);
 }finally{f.sqlite.close();}
});
test('D128: repetição, ACK perdido e concorrência não duplicam demanda/aviso; outra operação encontra a atual',async()=>{
 const f=await setup();try{f.enable();const a=f.payload();const results=await Promise.all([f.create(a),f.create(a),f.create(f.payload())]);
  assert.equal(results.filter(r=>r.status===201).length,1);assert.ok(results.every(r=>[200,201,409].includes(r.status)),JSON.stringify(results));
  assert.equal((await f.create(a)).data.replayed,true);assert.equal((await f.create({...a,notes:'outra orientação'})).status,409);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_notifications').get().n,1);
  const duplicate=await f.create(f.payload());assert.equal(duplicate.status,409);assert.equal(duplicate.data.existing.id,a.operationId);
 }finally{f.sqlite.close();}
});
test('D128: root/CSRF/escopo, técnico habilitado e permissão de coleta são exigidos no servidor',async()=>{
 const f=await setup();try{f.enable();const a=f.payload();
  assert.equal((await f.call('/api/dispatch/collection-designate',a,f.os)).status,403);
  assert.equal((await f.call('/api/dispatch/collection-designate',a,f.rs,{noCsrf:true})).status,403);
  f.env.APP_KIND='collector';assert.equal((await f.create(a)).status,403);delete f.env.APP_KIND;
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);assert.equal((await f.create(a)).status,409);assert.equal((await f.call('/api/dispatch/collection-options?unitId='+a.unitId)).data.technicians.length,0);
  f.sqlite.prepare("UPDATE users SET role='operador' WHERE id=?").run(f.operator.id);
  f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=0 WHERE user_id=?').run(f.operator.id);assert.equal((await f.create(a)).status,409);
  f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=1 WHERE user_id=?').run(f.operator.id);
  for(const type of ['Obra em andamento','Escola conveniada']){f.sqlite.prepare('UPDATE units SET unit_type=? WHERE id=?').run(type,a.unitId);assert.equal((await f.create(a)).status,409);}
  assert.equal((await f.create({...a,notes:'a'.repeat(1001)})).status,400);assert.equal((await f.tasks(['invalido'])).status,400);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);
 }finally{f.sqlite.close();}
});
test('D128: unidade vinculada recusa designação; vínculo encerrado permite e lista usa índice por unidade',async()=>{
 const f=await setup();try{f.enable();const s=seedEquipmentConsultation(f),a=f.payload(s.unit);
  assert.equal((await f.create(a)).status,409);
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),s.device);
  assert.equal((await f.create(a)).status,201);
  const plan=f.sqlite.prepare('EXPLAIN QUERY PLAN '+collectionTasksSql).all(JSON.stringify([s.unit]));assert.ok(plan.some(x=>/SEARCH .*r .*INDEX .*unit/i.test(x.detail)),JSON.stringify(plan));
 }finally{f.sqlite.close();}
});
test('D128: falha na atribuição reverte demanda, recibos, fila, contadores e avisos',async()=>{
 const f=await setup();try{f.enable();f.sqlite.exec("CREATE TRIGGER teste_falha BEFORE INSERT ON dispatch_assignments BEGIN SELECT RAISE(ABORT,'TESTE_ROLLBACK'); END;");
  assert.equal((await f.create()).status,503);
  for(const table of ['service_requests','service_request_events','dispatch_order','dispatch_assignments','dispatch_events','dispatch_notifications'])assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM '+table).get().n,0,table);
 }finally{f.sqlite.close();}
});
