import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers/dispatch-fixture.mjs';
import {session} from './helpers/agent-client.mjs';
import {routeResponse} from './helpers/routing-provider.mjs';
import worker from '../server/worker.mjs';
import {cleanDispatchPositions} from '../server/technical-dispatch.mjs';
import {random,digest} from '../server/security.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {readFileSync} from 'node:fs';
const pos=()=>({latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()});
const credential=()=>({id:crypto.randomUUID(),token:random()});
async function fixture(){
 const f=await setup();await f.enable();f.key=credential();f.idsQueue=[await f.task(),await f.task()];for(const id of f.idsQueue)await f.assign(id);
 f.start=(id=f.idsQueue[0],key=f.key,s=f.os)=>f.call('/api/technician/accept',f.cmd({id,version:f.ver(id),position:pos(),tracking:key}),s);
 f.finish=(id,s=f.os)=>f.call('/api/technician/complete',f.cmd({id,version:f.ver(id)}),s);
 f.native=async(body={},key=f.key,path='tracking-heartbeat',extra={})=>{
  const r=await worker.fetch(new Request('https://teste.invalid/api/technician/'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`SEMED-Tracking ${key.id}.${key.token}`,...extra},body:JSON.stringify(body)}),f.env);
  return {status:r.status,data:await r.json()};
 };
 f.map=async()=>(await f.call('/api/dispatch/map')).data;
 f.latest=()=>f.sqlite.prepare('SELECT * FROM dispatch_tracking_positions WHERE tracking_id=?').get(f.key.id);
 f.close=()=>f.sqlite.close();return f;
}
test('D114: first acceptance starts queue tracking; partial completion/pause preserve it; last completion removes it',async()=>{const f=await fixture();try{
 assert.equal((await f.native()).status,410);assert.equal((await f.map()).positions.length,0);
 assert.equal((await f.start()).status,200);let map=await f.map();assert.equal(map.positions.length,1);assert.equal(map.positions[0].tracking,true);assert.equal(map.positions[0].fresh,true);
 await f.finish(f.idsQueue[0]);assert.equal((await f.native()).status,200);map=await f.map();assert.equal(map.positions.length,1);assert.equal(map.positions[0].request_id,f.idsQueue[1]);
 assert.equal((await f.start(f.idsQueue[1])).status,200);
 assert.equal((await f.call('/api/technician/pause',f.cmd({id:f.idsQueue[1],version:f.ver(f.idsQueue[1])}),f.os)).status,200);
 assert.equal((await f.native()).data.active,true);assert.equal((await f.map()).positions.length,1);
 await f.start(f.idsQueue[1]);await f.finish(f.idsQueue[1]);assert.equal((await f.native({position:pos()})).status,410);assert.equal(f.latest(),undefined);assert.equal((await f.map()).positions.length,0);
 const third=await f.task();await f.assign(third);assert.equal((await f.native()).status,410,'a new assignment alone cannot resume an ended run');
 const k=credential();assert.equal((await f.start(third,k)).status,200);assert.equal((await f.native({},k)).status,200);
 assert.doesNotMatch(JSON.stringify(f.sqlite.prepare('SELECT * FROM dispatch_events').all()),/latitude|longitude|token/);
}finally{f.close();}});
test('D114: native position continues after login expiry but cannot read/modify demands',async()=>{const f=await fixture();try{
 await f.start();f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.operator.id);await cleanDispatchPositions(f.db);f.sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(f.operator.id);
 assert.equal((await f.call('/api/technician/queue',undefined,f.os)).status,401);
 assert.equal((await f.native()).status,200);assert.equal((await f.map()).positions[0].fresh,true);
 for(const path of ['queue','request','accept','complete','position'])assert.equal((await f.native({},f.key,path)).status,403);
 const auth=f.sqlite.prepare('SELECT token_hash FROM dispatch_tracking').get();assert.equal(auth.token_hash,await digest(f.key.token));assert.notEqual(auth.token_hash,f.key.token);
 assert.equal((await f.native({},f.key,'tracking-stop')).status,200);assert.equal((await f.map()).positions.length,0);
 assert.equal((await f.native()).status,410);assert.equal((await f.native({},f.key,'tracking-stop')).status,200);
}finally{f.close();}});
test('D114: last unassignment closes run; intermediate removal and added tasks remain in order',async()=>{const f=await fixture();try{
 await f.start();await f.assign(f.idsQueue[0],[]);assert.equal((await f.native()).status,200);assert.equal((await f.map()).positions.length,1);
 const third=await f.task();await f.assign(third);await f.call('/api/dispatch/move',f.cmd({id:third,beforeId:f.idsQueue[1]}));assert.deepEqual((await f.map()).routes.map(x=>x.id),[third,f.idsQueue[1]]);
 await f.assign(f.idsQueue[1],[]);assert.equal((await f.native()).status,200);await f.assign(third,[]);assert.equal((await f.native()).status,410);assert.equal(f.latest(),undefined);
}finally{f.close();}});
test('D114: teammate completion stops only technicians whose queue is empty',async()=>{const f=await fixture();try{
 await f.enable(f.root);await f.assign(f.idsQueue[0],[f.operator.id,f.root.id]);const other=credential();
 await f.start();assert.equal((await f.start(f.idsQueue[0],other,f.rs)).status,200);assert.equal((await f.map()).positions.length,2);
 await f.finish(f.idsQueue[0],f.rs);assert.equal((await f.native()).status,200);assert.equal((await f.native({},other)).status,410);assert.equal((await f.map()).positions[0].user_id,f.operator.id);
}finally{f.close();}});
test('D114: logout, credential change, disabled account and disabled technician revoke capability immediately',async()=>{
 for(const action of ['logout','credentials','account','technician']){const f=await fixture();try{
  await f.start();
  if(action==='logout')await f.call('/api/auth/logout',{},f.os);
  if(action==='credentials')f.sqlite.prepare('UPDATE users SET credential_version=credential_version+1 WHERE id=?').run(f.operator.id);
  if(action==='account')f.sqlite.prepare('UPDATE users SET active=0 WHERE id=?').run(f.operator.id);
  if(action==='technician')await f.call('/api/dispatch/technician',f.cmd({userId:f.operator.id,enabled:false}));
  assert.equal((await f.native({position:pos()})).status,410,action);assert.equal(f.latest(),undefined);assert.equal((await f.map()).positions.length,0);
 }finally{f.close();}}
});
test('D114: scope, bogus credentials, revoked run replay, CSRF and collector isolation',async()=>{const f=await fixture();try{
 await f.start();assert.equal((await f.native({},credential())).status,410);assert.equal((await f.native({},f.key,'tracking-heartbeat',{Origin:'https://other.invalid'})).status,403);
 f.env.APP_KIND='collector';assert.equal((await f.native()).status,403);delete f.env.APP_KIND;
 await f.enable(f.root);await f.assign(f.idsQueue[1],[f.root.id,f.operator.id]);assert.equal((await f.start(f.idsQueue[1],f.key,f.rs)).status,409);
 await f.native({},f.key,'tracking-stop');assert.equal((await f.start(f.idsQueue[1])).data.code,'TRACKING_ENDED');
 assert.equal((await f.native({position:pos()})).status,410);
}finally{f.close();}});
test('D114: old/duplicate/invalid fixes do not replace latest; stale fix disappears without closing queue',async()=>{const f=await fixture();try{
 await f.start();const original=f.latest();assert.equal((await f.native({position:{...pos(),latitude:1,observedAt:original.observed_at-1}})).status,200);assert.equal(f.latest().latitude,original.latitude);
 for(const p of [{...pos(),observedAt:Date.now()-91000},{...pos(),latitude:91},{...pos(),accuracy:0},{...pos(),accuracy:5001}])assert.equal((await f.native({position:p})).status,422);
 f.sqlite.prepare('UPDATE dispatch_tracking_positions SET observed_at=?,received_at=?').run(Date.now()-181000,Date.now()-181000);
 assert.equal((await f.map()).positions[0].fresh,false);await cleanDispatchPositions(f.db);assert.equal(f.latest(),undefined);assert.equal((await f.native()).status,200);
 assert.equal((await f.native({position:pos()})).status,200);assert.equal((await f.map()).positions[0].fresh,true);
}finally{f.close();}});
test('D114: receipt replay never duplicates a run and rollback leaves neither authorization nor GPS',async()=>{const f=await fixture();try{
 const payload=f.cmd({id:f.idsQueue[0],version:f.ver(f.idsQueue[0]),position:pos(),tracking:f.key});
 f.sqlite.exec("CREATE TRIGGER fail_tracking BEFORE INSERT ON dispatch_events WHEN NEW.action='accept' BEGIN SELECT RAISE(ABORT,'TEST'); END;");
 assert.equal((await f.call('/api/technician/accept',payload,f.os)).status,503);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking').get().n,0);f.sqlite.exec('DROP TRIGGER fail_tracking');
 assert.equal((await f.call('/api/technician/accept',payload,f.os)).status,200);assert.equal((await f.call('/api/technician/accept',payload,f.os)).data.replayed,true);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking').get().n,1);
 await f.finish(f.idsQueue[0]);await f.start(f.idsQueue[1]);await f.finish(f.idsQueue[1]);assert.equal((await f.call('/api/technician/accept',payload,f.os)).data.replayed,true);assert.equal((await f.native()).status,410);
}finally{f.close();}});
test('D114: street routing remains available between demands, trims completed stops and rejects delayed result after final removal',async()=>{const f=await fixture();try{
 f.sqlite.prepare('UPDATE units SET latitude=-2.535,longitude=-44.165 WHERE id=?').run(f.ids.pending);f.env.ROUTING_FETCH=url=>routeResponse(url);await f.start();
 const route=()=>f.call('/api/dispatch/road-route?technician='+f.operator.id);let r=await route();assert.equal(r.data.status,'ready');assert.deepEqual(r.data.requestIds,f.idsQueue);
 assert.equal((await route()).data.cached,true);await f.finish(f.idsQueue[0]);f.sqlite.exec('UPDATE dispatch_routing_gate SET next_at=0,lease_until=0');r=await route();assert.equal(r.data.status,'ready');assert.deepEqual(r.data.requestIds,[f.idsQueue[1]]);
 f.sqlite.exec('DELETE FROM dispatch_tracking_routes; UPDATE dispatch_routing_gate SET next_at=0,lease_until=0');let release;f.env.ROUTING_FETCH=url=>new Promise(resolve=>{release=()=>resolve(routeResponse(url));});
 const delayed=route();while(!release)await new Promise(r=>setTimeout(r,1));await f.assign(f.idsQueue[1],[]);release();assert.equal((await delayed).data.status,'changed');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking_routes').get().n,0);
}finally{f.close();}});
test('D114: new explicit acceptance on another device rotates capability; old phone cannot overwrite it',async()=>{const f=await fixture();try{
 await f.start();await f.call('/api/technician/pause',f.cmd({id:f.idsQueue[0],version:f.ver(f.idsQueue[0])}),f.os);
 const second=credential(),secondSession=await session(f,f.operator);assert.equal((await f.start(f.idsQueue[0],second,secondSession)).status,200);
 assert.equal((await f.native()).status,410);assert.equal((await f.native({},second)).status,200);const m=await f.map();assert.equal(m.positions.length,1);assert.equal(m.positions[0].id,second.id);
}finally{f.close();}});
test('D114: migration backfills only open counts; legacy transitions and rollback keep the projection exact',async()=>{
 const f=collectorFixture({beforeMigration:'0033'});try{
  const now=Date.now();f.sqlite.prepare('INSERT INTO dispatch_technicians VALUES(?,1,?,?)').run(f.operator.id,now,f.root.id);
  const row={id:crypto.randomUUID(),number:1,unit_id:f.ids.pending,equipment_id:null,kind:'Visita técnica',source:'Painel',status:'Aberta',description:'TESTE',requester:'',responsible:'',scheduled_date:'',created_by:f.root.id,updated_by:f.root.id,created_at:now,updated_at:now,version:1,last_operation:crypto.randomUUID(),context_json:'{}'};
  // Use the real table defaults while supplying its required snapshot fields.
  const cols=f.sqlite.prepare('PRAGMA table_info(service_requests)').all().map(c=>c.name),keys=Object.keys(row).filter(k=>cols.includes(k));f.sqlite.prepare(`INSERT INTO service_requests(${keys}) VALUES(${keys.map(()=>'?')})`).run(...keys.map(k=>row[k]));
  const assigned=crypto.randomUUID();f.sqlite.prepare('INSERT INTO dispatch_assignments VALUES(?,?,?,?,?,NULL)').run(assigned,row.id,f.operator.id,now,f.root.id);
  f.sqlite.exec(readFileSync('migrations/0033_technician_tracking.sql','utf8'));assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking').get().n,0);
  const check=()=>{const actual=f.sqlite.prepare("SELECT COUNT(*) n FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id WHERE a.user_id=? AND a.ended_at IS NULL AND r.status!='Concluída'").get(f.operator.id).n;assert.equal(f.sqlite.prepare('SELECT open_count n FROM dispatch_open_counts WHERE user_id=?').get(f.operator.id)?.n||0,actual);};
  check();for(const status of ['Concluída','Aberta','Em atendimento','Concluída','Aberta']){f.sqlite.prepare('UPDATE service_requests SET status=? WHERE id=?').run(status,row.id);check();}
  f.sqlite.exec('BEGIN');f.sqlite.prepare('UPDATE dispatch_assignments SET ended_at=? WHERE id=?').run(now,assigned);check();f.sqlite.exec('ROLLBACK');check();
  f.sqlite.prepare('DELETE FROM dispatch_assignments WHERE id=?').run(assigned);check();
 }finally{f.sqlite.close();}
});
test('D114: authorization revoked between validation and write cannot restore position',async()=>{const f=await fixture();try{
 await f.start();const original=f.db;let revoked=false;
 f.env.DB={...original,prepare(sql){const wrap=q=>({bind:(...args)=>wrap(q.bind(...args)),all:()=>q.all(),first:()=>q.first(),run:async()=>{
  if(sql.includes('INSERT INTO dispatch_tracking_positions')&&!revoked){revoked=true;f.sqlite.prepare('UPDATE dispatch_assignments SET ended_at=? WHERE user_id=? AND ended_at IS NULL').run(Date.now(),f.operator.id);}
  return q.run();
 }});return wrap(original.prepare(sql));}};
 assert.equal((await f.native({position:pos()})).status,410);assert.equal(revoked,true);assert.equal(f.latest(),undefined);
}finally{f.close();}});
