import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {collectorFixture} from './helpers/collector-db.mjs';
import {hardwareChange} from './helpers/hardware-change.mjs';
import {setup} from './helpers/dispatch-fixture.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {hardwareSummary} from '../server/hardware-review.mjs';
import {handleAgentHuman} from '../server/agentes/index.mjs';
import {random} from '../server/security.mjs';
import worker from '../server/worker.mjs';

const hardwareBase=`FROM agent_notifications n JOIN units u ON u.id=n.unit_id JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id LEFT JOIN agent_hardware_reviews hr ON hr.notification_id=n.id LEFT JOIN service_requests sr ON sr.id=hr.request_id WHERE n.kind='hardware_change'`;
function verify(f){
 const canonical=f.sqlite.prepare(`SELECT n.unit_id,SUM(hr.notification_id IS NULL) pending,SUM(hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída') demands ${hardwareBase} GROUP BY n.unit_id HAVING SUM(hr.notification_id IS NULL)+SUM(CASE WHEN hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída' THEN 1 ELSE 0 END)>0 ORDER BY n.unit_id`).all();
 assert.deepEqual(f.sqlite.prepare('SELECT unit_id,pending,demands FROM panel_hardware_counts WHERE pending+demands>0 ORDER BY unit_id').all().map(x=>({...x})),canonical.map(x=>({...x,demands:Number(x.demands)||0})));
 assert.deepEqual(f.sqlite.prepare('SELECT notification_id,unit_id,detected_at,state FROM panel_hardware_active ORDER BY notification_id').all(),f.sqlite.prepare('SELECT * FROM panel_hardware_source ORDER BY notification_id').all());
 const counts=f.sqlite.prepare("SELECT '' scope,status,COUNT(*) total FROM service_requests GROUP BY status UNION ALL SELECT unit_id,status,COUNT(*) FROM service_requests GROUP BY unit_id,status ORDER BY 1,2").all();
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM service_request_counts WHERE total>0 ORDER BY scope,status').all(),counts);
}
const request=(f,id,unit=f.ids.pending,status='Aberta')=>f.sqlite.prepare("INSERT INTO service_requests(id,number,unit_id,context_json,description,kind,source,status,created_at,created_by,updated_at,last_operation) SELECT ?,COALESCE(MAX(number),0)+1,?,'{}','TESTE orçamento','Outro','Painel',?,1,?,1,? FROM service_requests").run(id,unit,status,f.root.id,crypto.randomUUID());

test('D123: backfill preserves canonical tables; hardware decisions, orphan context, move/delete and rollback stay equivalent',async()=>{
 const f=collectorFixture({beforeMigration:'0035'});try{
  const env={DB:f.db,AUTH_PEPPER:'TEST'},seed=await hardwareChange(f,env);
  const tables=f.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(x=>x.name);
  const hash=t=>createHash('sha256').update(JSON.stringify(f.sqlite.prepare('SELECT * FROM "'+t+'"').all())).digest('hex');
  const before=new Map(tables.map(t=>[t,hash(t)]));
  const rid=crypto.randomUUID();request(f,rid,seed.unit,'Concluída');
  before.set('service_requests',hash('service_requests')); // include the legacy row in the baseline
  // Other existing triggers may also respond to the legacy request insert.
  for(const t of tables)before.set(t,hash(t));
  f.sqlite.exec(readFileSync('migrations/0035_audit_read_budget.sql','utf8'));
  for(const t of tables)assert.equal(hash(t),before.get(t),t);verify(f);
  // Backfill above stays pinned to D123. Current Worker routes require later schemas.
  for(const file of readdirSync('migrations').filter(x=>x.endsWith('.sql')&&x>'0035_audit_read_budget.sql').sort())f.sqlite.exec(readFileSync('migrations/'+file,'utf8'));
  assert.equal((await hardwareSummary(f.db)).pending,1);
  const auth=await session(f,f.root);
  let r=await humanFetch(worker,env,'https://teste.invalid',auth,'/api/inventory/hardware-review',{id:seed.id,decision:'demand',note:'TESTE',operationId:crypto.randomUUID()});assert.equal(r.status,200);verify(f);
  const demand=r.data.review.request_id;
  f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(demand);verify(f);assert.equal((await hardwareSummary(f.db)).units.length,0);
  f.sqlite.prepare("UPDATE service_requests SET status='Aberta',unit_id=? WHERE id=?").run(f.ids.assigned,demand);verify(f);
  f.sqlite.exec('BEGIN');f.sqlite.prepare("UPDATE service_requests SET status='Concluída'").run();verify(f);f.sqlite.exec('ROLLBACK');verify(f);
  f.sqlite.prepare('DELETE FROM agent_hardware_reviews WHERE notification_id=?').run(seed.id);verify(f);assert.equal((await hardwareSummary(f.db)).pending,1);
  f.sqlite.prepare('UPDATE equipments SET unit_id=? WHERE id=?').run(f.ids.assigned,seed.items[0].id);verify(f);assert.equal((await hardwareSummary(f.db)).pending,0);
  f.sqlite.prepare('UPDATE equipments SET unit_id=? WHERE id=?').run(seed.unit,seed.items[0].id);verify(f);
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(seed.unit);verify(f);assert.equal((await hardwareSummary(f.db)).pending,1,'inactivation must not silently decide a historical alert');
  // No FK on notification context: removal excludes the alert without deleting its history.
  f.sqlite.prepare('DELETE FROM equipments WHERE id=?').run(seed.items[0].id);verify(f);assert.equal((await hardwareSummary(f.db)).pending,0);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_notifications WHERE id=?').get(seed.id).n,1);
 }finally{f.sqlite.close();}
});

test('D123: demand projection matches canonical count, all filters, pagination and deletion with closed history',async()=>{
 const f=collectorFixture();try{
  for(let n=0;n<220;n++)request(f,crypto.randomUUID(),n%2?f.ids.pending:f.ids.assigned,n<200?'Concluída':n%3?'Aberta':'Em atendimento');verify(f);
  const env={DB:f.db,AUTH_PEPPER:'TEST'},s=await session(f,f.root);
  for(const unit of ['',f.ids.pending,crypto.randomUUID()])for(const state of ['pending','all','Aberta','Concluída'])for(const q of ['','orçamento','ausente']){
   const args=[],parts=[];if(unit){parts.push('unit_id=?');args.push(unit);}if(state==='pending')parts.push("status!='Concluída'");else if(state!=='all'){parts.push('status=?');args.push(state);}if(q){parts.push("instr(lower(context_json||' '||description||' '||responsible||' '||number),lower(?))>0");args.push(q);}
   const where=parts.length?' WHERE '+parts.join(' AND '):'';
   const p='/api/operations/requests?'+new URLSearchParams({unitId:unit,status:state,q,offset:'50'});
   const r=await humanFetch(worker,env,'https://teste.invalid',s,p);assert.equal(r.status,200);
   assert.equal(r.data.total,f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests'+where).get(...args).n);
   assert.deepEqual(r.data.items.map(i=>i.id),f.sqlite.prepare('SELECT id FROM service_requests'+where+' ORDER BY updated_at DESC,id DESC LIMIT 50 OFFSET 50').all(...args).map(i=>i.id));
  }
  const id=f.sqlite.prepare('SELECT id FROM service_requests LIMIT 1').get().id;f.sqlite.prepare('DELETE FROM dispatch_order WHERE request_id=?').run(id);f.sqlite.prepare('DELETE FROM service_requests WHERE id=?').run(id);verify(f);
  const plans=f.sqlite.prepare("EXPLAIN QUERY PLAN SELECT * FROM service_requests WHERE status!='Concluída' ORDER BY updated_at DESC,id DESC LIMIT 50").all().map(x=>x.detail).join('\n');assert.match(plans,/service_request_pending_order/);assert.doesNotMatch(plans,/TEMP B-TREE/);
 }finally{f.sqlite.close();}
});

test('D123: root revokes tracking after origin login expired or was cleaned; natural expiry preserves location',async()=>{
 for(const cleaned of [false,true]){const f=await setup();try{
  await f.enable();const id=await f.task();await f.assign(id);const key={id:crypto.randomUUID(),token:random()};
  assert.equal((await f.call('/api/technician/accept',f.cmd({id,version:f.ver(id),position:{latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()},tracking:key}),f.os)).status,200);
  f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.operator.id);
  if(cleaned)f.sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(f.operator.id);
  const native=()=>worker.fetch(new Request('https://teste.invalid/api/technician/tracking-heartbeat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`SEMED-Tracking ${key.id}.${key.token}`},body:'{}'}),f.env);
  assert.equal((await native()).status,200);
  const forbidden=await f.call('/api/admin/revoke',{id:f.root.id},await session(f,f.operator));assert.equal(forbidden.status,403);
  assert.equal((await native()).status,200);
  assert.equal((await f.call('/api/admin/revoke',{id:f.operator.id})).status,200);
  assert.equal((await native()).status,410);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking_positions').get().n,0);
  assert.equal(f.sqlite.prepare('SELECT end_reason FROM dispatch_tracking').get().end_reason,'admin_revoked');
  assert.equal((await f.call('/api/admin/revoke',{id:f.operator.id})).status,200);
 }finally{f.sqlite.close();}}
});

test('D123: viewer cannot preview/catalog/claim or consume pairing attempts on either Worker',async()=>{
 for(const APP_KIND of ['panel','collector'])for(const [method,path] of [['POST','preview'],['GET','catalog'],['POST','claim'],['GET','claim-status']]){
  const req=new Request('https://teste.invalid/api/agent/v1/pairings/'+path,{method,...(method==='POST'?{body:'{}'}:{})});
  const r=await handleAgentHuman(req,new URL(req.url),{id:'viewer',role:'visualizador'},{APP_KIND,DB:{prepare(){throw Error('denied role reached persistence');}}});assert.equal(r.status,403);
 }
});

test('D123: explicit session revocation reaches an expired origin but never another user tracking',async()=>{
 const f=await setup();try{
  await f.enable();const id=await f.task();await f.assign(id);const key={id:crypto.randomUUID(),token:random()};
  assert.equal((await f.call('/api/technician/accept',f.cmd({id,version:f.ver(id),position:{latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()},tracking:key}),f.os)).status,200);
  const origin=f.sqlite.prepare('SELECT session_hash FROM dispatch_tracking').get().session_hash;
  f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.operator.id);
  f.sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(f.operator.id);
  assert.equal((await f.call('/api/auth/revoke',{id:origin})).status,200);
  assert.equal(f.sqlite.prepare('SELECT ended_at FROM dispatch_tracking').get().ended_at,null,'root self-service route must not affect another user');
  const current=await session(f,f.operator);
  assert.equal((await f.call('/api/auth/revoke',{id:origin},current)).status,200);
  assert.equal(f.sqlite.prepare('SELECT end_reason FROM dispatch_tracking').get().end_reason,'session_revoked');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking_positions').get().n,0);
  assert.equal((await f.call('/api/technician/queue',undefined,current)).status,200,'another login remains valid');
 }finally{f.sqlite.close();}
});
