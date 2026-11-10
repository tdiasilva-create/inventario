import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {hardwareChange} from './helpers/hardware-change.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
async function setup(){const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'},s=await hardwareChange(f,env),auth=await session(f,f.root);return {...f,...s,env,auth,call:(p,data,opts)=>humanFetch(worker,env,'https://teste.invalid',auth,'/api/inventory/'+p,data,opts)};}
const decision=(id,value='accepted')=>({id,decision:value,note:'Conferência de teste',operationId:crypto.randomUUID()});
test('D081: leitura não decide; decisão global imutável e reenvio idempotente; novo evento volta a exigir análise',async()=>{const f=await setup();try{
 let r=await f.call('monitoring');assert.equal(r.data.hardware.pending,1);assert.equal(r.data.items[0].hostname,'TESTE-PC-001');assert.equal(r.data.items[0].context_source,'at_detection');
 await f.call('notifications/read',{id:f.id});assert.equal((await f.call('monitoring')).data.hardware.pending,1);
 const command=decision(f.id);r=await f.call('hardware-review',command);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal((await f.call('hardware-review',command)).data.replayed,true);
 assert.equal((await f.call('hardware-review',decision(f.id,'demand'))).status,409);assert.equal((await f.call('monitoring')).data.hardware.pending,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);
 assert.equal((await f.call('hardware-alerts?id='+f.id)).data.items[0].review_state,'accepted');await f.change(68719476736,3000);assert.equal((await f.call('monitoring')).data.hardware.pending,1);
 }finally{f.sqlite.close();}});
test('D081: demanda única ligada ao equipamento, contexto histórico e atendimento aberto/concluído/reaberto',async()=>{const f=await setup();try{
 f.sqlite.prepare('UPDATE environments SET name=? WHERE id=?').run('NOME POSTERIOR',f.room);
 const command=decision(f.id,'demand');let r=await f.call('hardware-review',command);assert.equal(r.status,200,JSON.stringify(r.data));const id=r.data.review.request_id;
 await f.call('hardware-review',command);const request=f.sqlite.prepare('SELECT * FROM service_requests').get();assert.equal(request.id,id);assert.equal(request.unit_id,f.unit);assert.equal(request.equipment_id,f.items[0].id);assert.equal(JSON.parse(request.context_json).environment,'TESTE · Laboratório');assert.match(request.description,/16 GiB → 32 GiB/);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events').get().n,1);
 r=await f.call('monitoring');assert.equal(r.data.hardware.pending,0);assert.equal(r.data.hardware.units[0].demands,1);
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(id);assert.equal((await f.call('monitoring')).data.hardware.units.length,0);
 f.sqlite.prepare("UPDATE service_requests SET status='Aberta' WHERE id=?").run(id);assert.equal((await f.call('monitoring')).data.hardware.units[0].demands,1);
 }finally{f.sqlite.close();}});
test('D081: decisões concorrentes não duplicam demandas e falha transacional não deixa decisão órfã',async()=>{const f=await setup();try{
 const original=f.db.batch;f.db.batch=s=>original([...s,f.db.prepare('INSERT INTO missing_table VALUES(1)')]);const failed=await f.call('hardware-review',decision(f.id,'demand'));assert.equal(failed.status,503);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_hardware_reviews').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);
 let queue=Promise.resolve();f.db.batch=s=>{const run=queue.then(()=>original(s));queue=run.catch(()=>{});return run;};
 const results=await Promise.all([f.call('hardware-review',decision(f.id,'demand')),f.call('hardware-review',decision(f.id))]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_hardware_reviews').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);
 }finally{f.sqlite.close();}});
test('D081: autorização, CSRF, coletor isolado, filtros e unidade sem coordenadas',async()=>{const f=await setup();try{
 const path='/api/inventory/hardware-alerts';assert.equal((await worker.fetch(new Request('https://teste.invalid'+path),f.env)).status,401);
 const op=await session(f,f.operator);assert.equal((await humanFetch(worker,f.env,'https://teste.invalid',op,path)).status,403);
 assert.equal((await f.call('hardware-review',decision(f.id),{noCsrf:true})).status,403);
 f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);assert.equal((await f.call('hardware-alerts')).status,200);assert.equal((await f.call('hardware-review',decision(f.id))).status,403);
 f.sqlite.prepare("UPDATE users SET role='admin' WHERE id=?").run(f.root.id);assert.equal((await f.call('hardware-alerts?unitId='+f.ids.assigned)).data.total,0);assert.equal((await f.call('hardware-alerts?offset=-1')).status,422);
 f.sqlite.prepare('UPDATE units SET latitude=NULL,longitude=NULL WHERE id=?').run(f.unit);assert.equal((await f.call('monitoring')).data.hardware.pending,1);
 assert.equal((await humanFetch(worker,{...f.env,APP_KIND:'collector'},'https://teste.invalid',f.auth,path)).status,403);
 assert.equal((await f.call('hardware-review',decision(f.id))).status,200);
 }finally{f.sqlite.close();}});
test('D081: reenvios simultâneos têm um recibo/demanda; pendentes aparecem antes dos encaminhados e paginam',async()=>{const f=await setup();try{
 const original=f.db.batch;let queue=Promise.resolve();f.db.batch=s=>{const run=queue.then(()=>original(s));queue=run.catch(()=>{});return run;};
 const command=decision(f.id,'demand'),results=await Promise.all([f.call('hardware-review',command),f.call('hardware-review',command)]);assert.deepEqual(results.map(r=>r.status),[200,200]);assert.equal(results[0].data.review.request_id,results[1].data.review.request_id);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);
 for(let i=0;i<28;i++)f.sqlite.prepare('INSERT INTO agent_notifications SELECT ?,?,device_id,link_id,equipment_id,unit_id,kind,observed_at,detected_at-?,details_json,NULL,NULL FROM agent_notifications WHERE id=?').run(crypto.randomUUID(),'test-pending-'+i,i+1,f.id);
 let r=await f.call('hardware-alerts');assert.equal(r.data.items.length,25);assert.ok(r.data.items.every(n=>n.review_state==='pending'));assert.equal(r.data.nextOffset,25);r=await f.call('hardware-alerts?offset=25');assert.equal(r.data.items.length,4);assert.equal(r.data.items[3].review_state,'demand');assert.equal((await f.call('monitoring')).data.hardware.pending,28);
 }finally{f.sqlite.close();}});
