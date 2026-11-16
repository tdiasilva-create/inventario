import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers/dispatch-fixture.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {random} from '../server/security.mjs';
import {cleanDispatchPositions} from '../server/technical-dispatch.mjs';
import worker from '../server/worker.mjs';
import {hardwareChange} from './helpers/hardware-change.mjs';

const pos=()=>({latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()});
async function preview(f,id){const r=await f.call('/api/operations/request-delete-preview?id='+id);assert.equal(r.status,200,JSON.stringify(r.data));return {id,version:r.data.request.version,revision:r.data.revision,operationId:crypto.randomUUID(),reason:'Cadastro duplicado · TESTE ISOLADO',confirm:true};}
const remove=(f,a,s)=>f.call('/api/operations/request-delete',a,s);
const summary=async f=>(await f.call('/api/inventory/pending-summary')).data.demands;
const key=()=>({id:crypto.randomUUID(),token:random()});
const start=(f,id,k,s=f.os)=>f.call('/api/technician/accept',f.cmd({id,version:f.ver(id),position:pos(),tracking:k}),s);
async function heartbeat(f,k){return worker.fetch(new Request('https://teste.invalid/api/technician/tracking-heartbeat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`SEMED-Tracking ${k.id}.${k.token}`},body:JSON.stringify({position:pos()})}),f.env);}

test('D126: sinalização nasce somente no aceite, conta demandas únicas e independe de GPS/sessão',async()=>{const f=await setup();try{
 await f.enable();await f.enable(f.root);const id=await f.task();await f.assign(id,[f.operator.id,f.root.id]);
 assert.equal((await summary(f)).units[0].accepted,0);
 await start(f,id,key());await start(f,id,key(),f.rs);assert.equal((await summary(f)).units[0].accepted,1);
 f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.operator.id);await cleanDispatchPositions(f.db);
 assert.equal((await summary(f)).units[0].accepted,1);
 await f.call('/api/technician/pause',f.cmd({id,version:f.ver(id)}),f.rs);assert.equal((await summary(f)).units[0].accepted,1,'colega ainda aceitou');
 await f.assign(id,[f.root.id]);assert.equal((await summary(f)).units[0].accepted,0,'último aceite retirado');
 assert.equal((await summary(f)).total,1,'pendência permanece');
}finally{f.sqlite.close();}});

test('D126: exclusão preserva ficha/eventos, arquivo consultável, contadores e idempotência',async()=>{const f=await setup();try{
 const id=await f.task(),before=f.sqlite.prepare('SELECT * FROM service_requests WHERE id=?').get(id),a=await preview(f,id);
 assert.equal((await remove(f,a)).status,200);assert.equal((await remove(f,a)).data.replayed,true);
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM service_requests WHERE id=?').get(id),before);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events WHERE request_id=?').get(id).n,2);
 assert.equal((await summary(f)).total,0);
 for(const status of ['pending','all','Aberta'])assert.equal((await f.call('/api/operations/requests?status='+status)).data.total,0);
 const archive=await f.call('/api/operations/requests?status=deleted');assert.equal(archive.status,200);assert.equal(archive.data.total,1);assert.equal(archive.data.items[0].id,id);
 const historical=await f.call('/api/operations/requests?id='+id);assert.equal(historical.data.request.deleted_reason,a.reason);assert.equal(historical.data.events[0].snapshot.deleted,true);
 assert.equal((await remove(f,{...a,reason:'outro'})).status,409);
 const creation=JSON.parse(f.sqlite.prepare('SELECT payload_json FROM service_request_events WHERE operation_id=?').get(before.last_operation).payload_json);
 assert.equal((await f.call('/api/operations/request-save',creation)).status,409,'recibo antigo não reabre nem retorna dados do arquivo');
 const last=await f.task();assert.equal(f.sqlite.prepare('SELECT number FROM service_requests WHERE id=?').get(last).number,2,'numeração não reutilizada');
 assert.throws(()=>f.sqlite.prepare('DELETE FROM service_request_deletions WHERE request_id=?').run(id),/PRESERVED/);
 assert.throws(()=>f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(id),/DELETED/);
}finally{f.sqlite.close();}});

test('D126: root exclusivo, CSRF, método, confirmação e coletor bloqueados',async()=>{const f=await setup();try{
 const id=await f.task(),a=await preview(f,id);
 for(const role of ['admin','visualizador','operador']){
  f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.operator.id);const s=await session(f,{...f.operator,role});
  assert.equal((await remove(f,a,s)).status,403);assert.equal((await f.call('/api/operations/request-delete-preview?id='+id,undefined,s)).status,403);
  assert.equal((await f.call('/api/operations/requests?status=deleted',undefined,s)).status,403);
 }
 for(const bad of [{confirm:false},{reason:'  '},{version:-1},{revision:'1'},{operationId:'bad'}])assert.equal((await remove(f,{...a,...bad})).status,400);
 assert.equal((await humanFetch(worker,f.env,'https://teste.invalid',f.rs,'/api/operations/request-delete',a,{noCsrf:true})).status,403);
 assert.equal((await f.call('/api/operations/request-delete?id='+id)).status,405);
 f.env.APP_KIND='collector';assert.equal((await remove(f,a)).status,403);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_deletions').get().n,0);
}finally{f.sqlite.close();}});

test('D126: conflito de atribuição/versão invalida prévia; falha no histórico reverte toda a exclusão',async()=>{const f=await setup();try{
 await f.enable();const id=await f.task(),a=await preview(f,id);await f.assign(id);assert.equal((await remove(f,a)).status,409);
 const b=await preview(f,id);f.sqlite.exec("CREATE TRIGGER fail_archive BEFORE INSERT ON service_request_events WHEN json_extract(NEW.snapshot_json,'$.deleted')=1 BEGIN SELECT RAISE(ABORT,'TEST_ARCHIVE_FAILURE'); END;");
 assert.equal((await remove(f,b)).status,503);assert.equal((await summary(f)).total,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_assignments WHERE ended_at IS NULL').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_deletions').get().n,0);
 f.sqlite.exec('DROP TRIGGER fail_archive');assert.equal((await remove(f,b)).status,200);
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM dispatch_notifications WHERE message LIKE '%excluída pelo root%'").get().n,1);
}finally{f.sqlite.close();}});

test('D126: dois técnicos, exclusão da atual conserva GPS só para quem ainda tem fila',async()=>{const f=await setup();try{
 await f.enable();await f.enable(f.root);const id=await f.task(),next=await f.task();await f.assign(id,[f.operator.id,f.root.id]);await f.assign(next);
 const k1=key(),k2=key();assert.equal((await start(f,id,k1)).status,200);assert.equal((await start(f,id,k2,f.rs)).status,200);
 const before=f.sqlite.prepare('SELECT * FROM dispatch_tracking_positions WHERE tracking_id=?').get(k1.id);
 assert.equal((await remove(f,await preview(f,id))).status,200);
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM dispatch_tracking_positions WHERE tracking_id=?').get(k1.id),before);
 assert.equal((await heartbeat(f,k1)).status,200);assert.equal((await heartbeat(f,k2)).status,410);
 const map=(await f.call('/api/dispatch/map')).data;assert.equal(map.positions.length,1);assert.equal(map.positions[0].user_id,f.operator.id);assert.deepEqual(map.routes.map(r=>r.id),[next]);
 assert.equal((await f.call('/api/technician/queue',undefined,f.os)).data.items.length,1);
 assert.equal((await f.call('/api/technician/request?id='+id,undefined,f.os)).status,404);
 assert.equal((await f.call('/api/technician/complete',f.cmd({id,version:f.ver(id)}),f.os)).status,404);
 assert.equal((await summary(f)).units[0].accepted,0);
 await remove(f,await preview(f,next));assert.equal((await heartbeat(f,k1)).status,410);assert.equal((await f.call('/api/dispatch/map')).data.positions.length,0);
}finally{f.sqlite.close();}});

test('D126: excluir demanda futura não muda atendimento aceito nem encerra localização',async()=>{const f=await setup();try{
 await f.enable();const id=await f.task(),next=await f.task();await f.assign(id);await f.assign(next);const k=key();await start(f,id,k);
 await remove(f,await preview(f,next));assert.equal((await summary(f)).units[0].accepted,1);assert.equal((await heartbeat(f,k)).status,200);
 assert.equal((await f.call('/api/technician/complete',f.cmd({id,version:f.ver(id)}),f.os)).status,200);
 assert.equal((await summary(f)).total,0);assert.equal((await heartbeat(f,k)).status,410);
}finally{f.sqlite.close();}});

test('D126: exclusão de concluída não desconta outras atribuições abertas',async()=>{const f=await setup();try{
 await f.enable();const done=await f.task(),open=await f.task();await f.assign(done);await f.assign(open);const k=key();await start(f,done,k);
 await f.call('/api/technician/complete',f.cmd({id:done,version:f.ver(done)}),f.os);
 await remove(f,await preview(f,done));assert.equal((await heartbeat(f,k)).status,200);assert.equal((await summary(f)).total,1);
 assert.equal(f.sqlite.prepare('SELECT open_count FROM dispatch_open_counts WHERE user_id=?').get(f.operator.id).open_count,1);
}finally{f.sqlite.close();}});

test('D126: exclusão de demanda de hardware preserva parecer sem manter alerta operacional',async()=>{const f=await setup();try{
 await hardwareChange(f,f.env);const alert=f.sqlite.prepare("SELECT id FROM agent_notifications WHERE kind='hardware_change' LIMIT 1").get();assert.ok(alert);
 const review=await f.call('/api/inventory/hardware-review',{id:alert.id,operationId:crypto.randomUUID(),decision:'demand',note:'TESTE'});assert.equal(review.status,200,JSON.stringify(review.data));
 const id=review.data.review.request_id;await remove(f,await preview(f,id));
 assert.equal(f.sqlite.prepare('SELECT request_id FROM agent_hardware_reviews WHERE notification_id=?').get(alert.id).request_id,id);
 const h=await f.call('/api/inventory/hardware-alerts?id='+alert.id);assert.equal(h.data.items[0].review_state,'deleted');
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM panel_hardware_active WHERE notification_id=?').get(alert.id).n,0);
 f.sqlite.prepare('UPDATE units SET name=name WHERE id=?').run(f.ids.pending);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM panel_hardware_source WHERE notification_id=?').get(alert.id).n,0);
}finally{f.sqlite.close();}});
