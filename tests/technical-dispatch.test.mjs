import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {cleanDispatchPositions} from '../server/technical-dispatch.mjs';
const pos=()=>({latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()});
async function setup(){const f=collectorFixture();f.env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'};f.rs=await session(f,f.root);f.os=await session(f,f.operator);f.call=(path,data,s=f.rs)=>humanFetch(worker,f.env,'https://teste.invalid',s,path,data);f.revision=()=>f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision;f.cmd=(x={})=>({operationId:crypto.randomUUID(),revision:f.revision(),...x});f.task=async()=>{const id=crypto.randomUUID();let r=await f.call('/api/operations/request-save',{id,operationId:crypto.randomUUID(),version:0,unitId:f.ids.pending,equipmentId:null,description:'TESTE ISOLADO · atendimento',kind:'Visita técnica',source:'Painel',requester:'',responsible:'',scheduledDate:'',note:'',status:'Aberta'});assert.equal(r.status,201,JSON.stringify(r.data));return id;};f.ver=id=>f.sqlite.prepare('SELECT version FROM service_requests WHERE id=?').get(id).version;f.enable=async(user=f.operator)=>{let r=await f.call('/api/dispatch/technician',f.cmd({userId:user.id,enabled:true}));assert.equal(r.status,200,JSON.stringify(r.data));};f.assign=async(id,ids=[f.operator.id])=>{const r=await f.call('/api/dispatch/assign',f.cmd({id,userIds:ids}));assert.equal(r.status,200,JSON.stringify(r.data));};f.accept=async(id,s=f.os)=>f.call('/api/technician/accept',f.cmd({id,version:f.ver(id),position:pos()}),s);return f;}
test('D105: root habilita/atribui, técnico aceita com GPS e conclui sem relato obrigatório',async()=>{const f=await setup();try{
 assert.equal((await f.call('/api/technician/queue',undefined,f.os)).status,403);await f.enable();const id=await f.task();await f.assign(id);
 let r=await f.call('/api/technician/queue',undefined,f.os);assert.equal(r.data.items[0].id,id);
 assert.equal((await f.call('/api/technician/accept',f.cmd({id,version:1}),f.os)).status,422);
 r=await f.accept(id);assert.equal(r.status,200,JSON.stringify(r.data));let a=(await f.call('/api/technician/active',undefined,f.os)).data.attendance;assert.ok(a.id);
 r=await f.call('/api/dispatch/map');assert.equal(r.data.positions.length,1);assert.equal(r.data.positions[0].fresh,true);
 r=await f.call('/api/technician/position',{attendanceId:a.id,position:pos()},f.os);assert.equal(r.status,200,JSON.stringify(r.data));
 const done=f.cmd({id,version:f.ver(id)});r=await f.call('/api/technician/complete',done,f.os);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal((await f.call('/api/technician/complete',done,f.os)).data.replayed,true);
 assert.equal((await f.call('/api/dispatch/map')).data.positions.length,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_positions').get().n,0);
 assert.equal((await f.call('/api/technician/position',{attendanceId:a.id,position:pos()},f.os)).status,409);
 assert.equal(f.sqlite.prepare('SELECT status FROM service_requests WHERE id=?').get(id).status,'Concluída');
 assert.equal(f.sqlite.prepare('SELECT actor_id FROM dispatch_events WHERE action=?').get('complete').actor_id,f.operator.id);
 assert.doesNotMatch(JSON.stringify(f.sqlite.prepare('SELECT * FROM dispatch_events').all()),/latitude|longitude/);
}finally{f.sqlite.close();}});
test('D105: limite de dois, isolamento, uma ativa, reatribuição encerra localização',async()=>{const f=await setup();try{
 await f.enable();await f.enable(f.root);const id=await f.task(),id2=await f.task();await f.assign(id,[f.operator.id,f.root.id]);await f.assign(id2);
 assert.equal((await f.call('/api/dispatch/assign',f.cmd({id,userIds:[f.root.id,f.operator.id,crypto.randomUUID()]}))).status,400);
 assert.equal((await f.call('/api/dispatch/queue',undefined,f.os)).status,403);assert.equal((await f.call('/api/operations/requests',undefined,f.os)).status,403);
 assert.equal((await f.accept(id)).status,200);assert.equal((await f.accept(id2)).status,409);
 assert.equal((await f.accept(id,f.rs)).status,200);let map=await f.call('/api/dispatch/map');assert.equal(map.data.positions.length,2);
 await f.assign(id,[f.root.id]);assert.equal((await f.call('/api/technician/note',f.cmd({id,version:f.ver(id),note:'x'}),f.os)).status,403);assert.equal((await f.call('/api/dispatch/map')).data.positions.length,1);
 assert.equal((await f.call('/api/technician/complete',f.cmd({id,version:f.ver(id)}),f.rs)).status,200);assert.equal((await f.call('/api/dispatch/map')).data.positions.length,0);
 assert.equal((await f.accept(id2)).status,200);
}finally{f.sqlite.close();}});
test('D105: ordenação persistente, conflito e recibos; sem GPS antigo/forjado',async()=>{const f=await setup();try{
 await f.enable();const ids=[await f.task(),await f.task(),await f.task()];for(const id of ids)await f.assign(id);
 const move=f.cmd({id:ids[2],beforeId:ids[0]});assert.equal((await f.call('/api/dispatch/move',move)).status,200);assert.equal((await f.call('/api/dispatch/move',move)).data.replayed,true);
 assert.equal((await f.call('/api/dispatch/move',{...move,operationId:crypto.randomUUID()})).status,409);
 assert.deepEqual((await f.call('/api/technician/queue',undefined,f.os)).data.items.map(r=>r.id),[ids[2],ids[0],ids[1]]);
 for(const p of [{...pos(),observedAt:Date.now()-100000},{...pos(),latitude:91},{...pos(),latitude:'-2.5'},{...pos(),accuracy:0}])assert.equal((await f.call('/api/technician/accept',f.cmd({id:ids[0],version:1,position:p}),f.os)).status,422);
 assert.equal((await f.call('/api/technician/queue',undefined,f.rs)).status,403);
 assert.equal((await f.call('/api/technician/notifications',undefined,f.os)).data.unread>0,true);
}finally{f.sqlite.close();}});
test('D105: conclusão desktop, desabilitação e logout não deixam posição ativa',async()=>{const f=await setup();try{
 await f.enable();const id=await f.task();await f.assign(id);await f.accept(id);
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída',updated_at=? WHERE id=?").run(Date.now(),id);assert.equal((await f.call('/api/dispatch/map')).data.positions.length,0);
 const next=await f.task();await f.assign(next);await f.accept(next);await f.call('/api/auth/logout',{},f.os);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_positions').get().n,0);
 f.os=await session(f,f.operator);await f.accept(next);await f.call('/api/dispatch/technician',f.cmd({userId:f.operator.id,enabled:false}));assert.equal((await f.call('/api/technician/queue',undefined,f.os)).status,403);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_positions').get().n,0);
}finally{f.sqlite.close();}});
test('D105: sessão diferente, posição fora de ordem, expiração e limpeza de coordenadas',async()=>{const f=await setup();try{
 await f.enable();const id=await f.task();await f.assign(id);await f.accept(id);const a=(await f.call('/api/technician/active',undefined,f.os)).data.attendance;
 const other=await session(f,f.operator);assert.equal((await f.call('/api/technician/position',{attendanceId:a.id,position:pos()},other)).status,409);
 const first=f.sqlite.prepare('SELECT * FROM dispatch_positions').get();await f.call('/api/technician/position',{attendanceId:a.id,position:{...pos(),latitude:1,observedAt:first.observed_at-1}},f.os);assert.equal(f.sqlite.prepare('SELECT latitude FROM dispatch_positions').get().latitude,first.latitude);
 f.sqlite.prepare('UPDATE dispatch_positions SET observed_at=?,received_at=?').run(Date.now()-200000,Date.now()-200000);assert.equal((await f.call('/api/dispatch/map')).data.positions[0].fresh,false);await cleanDispatchPositions(f.db);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_positions').get().n,0);
 f.sqlite.prepare('UPDATE sessions SET expires_at=0').run();await cleanDispatchPositions(f.db);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_attendances WHERE ended_at IS NULL').get().n,0);
}finally{f.sqlite.close();}});
test('D105: falha no evento reverte atribuição; CSRF e coletor bloqueados',async()=>{const f=await setup();try{
 await f.enable();const id=await f.task();const payload=f.cmd({id,userIds:[f.operator.id]});f.sqlite.exec("CREATE TRIGGER fail_dispatch BEFORE INSERT ON dispatch_events BEGIN SELECT RAISE(ABORT,'TEST FAIL'); END;");assert.equal((await f.call('/api/dispatch/assign',payload)).status,503);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_assignments').get().n,0);f.sqlite.exec('DROP TRIGGER fail_dispatch');assert.equal((await f.call('/api/dispatch/assign',payload)).status,200);
 const missing=await humanFetch(worker,f.env,'https://teste.invalid',f.os,'/api/technician/accept',f.cmd({id,version:f.ver(id),position:pos()}),{noCsrf:true});assert.equal(missing.status,403);
 f.env.APP_KIND='collector';assert.equal((await f.call('/api/technician/queue',undefined,f.os)).status,403);assert.equal((await f.call('/api/dispatch/queue')).status,403);
}finally{f.sqlite.close();}});
test('D105: reenvio de aceite após perda do ACK e conclusão pelo colega',async()=>{const f=await setup();try{
 await f.enable();await f.enable(f.root);const id=await f.task();await f.assign(id,[f.operator.id,f.root.id]);const payload=f.cmd({id,version:f.ver(id),position:pos()});assert.equal((await f.call('/api/technician/accept',payload,f.os)).status,200);assert.equal((await f.call('/api/technician/accept',payload,f.os)).data.replayed,true);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_attendances').get().n,1);
 assert.equal((await f.call('/api/technician/complete',f.cmd({id,version:f.ver(id)}),f.rs)).status,200);assert.equal((await f.call('/api/dispatch/map')).data.positions.length,0);
}finally{f.sqlite.close();}});
