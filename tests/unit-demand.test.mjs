import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import worker from '../server/worker.mjs';
async function setup(){const f=collectorFixture();f.env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'};f.rs=await session(f,f.root);f.os=await session(f,f.operator);f.sqlite.prepare('INSERT INTO dispatch_technicians VALUES(?,1,?,?)').run(f.operator.id,Date.now(),f.root.id);f.call=(path,data,s=f.rs,opts)=>humanFetch(worker,f.env,'https://teste.invalid',s,path,data,opts);f.payload=unitId=>({operationId:crypto.randomUUID(),unitId:unitId||f.ids.pending,technicianId:f.operator.id,description:'TESTE · substituir teclado',kind:'Manutenção'});f.create=a=>f.call('/api/dispatch/unit-request-create',a||f.payload());return f;}
test('D129: unidade com agente recebe demanda atribuída; não há limite de uma necessidade por unidade',async()=>{const f=await setup();try{
 const s=seedEquipmentConsultation(f),a=f.payload(s.unit);assert.equal((await f.call('/api/dispatch/unit-request-options?unitId='+s.unit)).status,200);
 assert.equal((await f.create(a)).status,201);assert.equal((await f.create({...f.payload(s.unit),description:'TESTE · instalar impressora'})).status,201);
 const queue=(await f.call('/api/technician/queue',undefined,f.os)).data;assert.equal(queue.items.length,2);assert.equal(queue.items[0].context.purpose,'unit_request');assert.equal(queue.items[0].unit_id,s.unit);assert.equal(queue.notifications.length,2);
 const taskList=await f.call('/api/dispatch/collection-tasks?unitIds='+encodeURIComponent(JSON.stringify([s.unit])));assert.equal(taskList.data.tasks.length,0);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_attendances').get().n,0);
}finally{f.sqlite.close();}});
test('D129: reenvio simultâneo usa recibo; payload diferente conflita; rollback não deixa demanda sem responsável',async()=>{const f=await setup();try{
 const a=f.payload(),rs=await Promise.all([f.create(a),f.create(a)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,201]);assert.equal((await f.create({...a,description:'TESTE · diferente'})).status,409);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_notifications').get().n,1);
 f.sqlite.exec("CREATE TRIGGER test_rollback BEFORE INSERT ON dispatch_assignments BEGIN SELECT RAISE(ABORT,'TEST'); END;");assert.equal((await f.create()).status,503);
 for(const table of ['service_requests','service_request_events','dispatch_assignments','dispatch_notifications'])assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM '+table).get().n,1,table);
}finally{f.sqlite.close();}});
test('D129: root, CSRF e unidade elegível; técnico pode coletar ou só atender conforme conta existente',async()=>{const f=await setup();try{
 const a=f.payload();assert.equal((await f.call('/api/dispatch/unit-request-create',a,f.os)).status,403);assert.equal((await f.call('/api/dispatch/unit-request-create',a,f.rs,{noCsrf:true})).status,403);
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.operator.id);assert.equal((await f.call('/api/dispatch/unit-request-options?unitId='+a.unitId,undefined,f.os)).status,403);}
 assert.equal((await f.create(a)).status,201,'técnico visualizador habilitado pode receber atendimento, sem ganhar coleta');
 f.env.APP_KIND='collector';assert.equal((await f.create()).status,403);delete f.env.APP_KIND;
 for(const patch of [{description:''},{description:'x'.repeat(2001)},{kind:'inventado'},{technicianId:'invalido'}])assert.equal((await f.create({...f.payload(),...patch})).status,400);
 assert.equal((await f.create(f.payload(f.ids.inactive))).status,409);f.sqlite.prepare("UPDATE units SET unit_type='Escola conveniada' WHERE id=?").run(f.ids.progress);assert.equal((await f.create(f.payload(f.ids.progress))).status,409);
 const original=f.db.batch;f.db.batch=async statements=>{f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=0 WHERE user_id=?').run(f.operator.id);return original(statements);};assert.equal((await f.create()).status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);
}finally{f.sqlite.close();}});
