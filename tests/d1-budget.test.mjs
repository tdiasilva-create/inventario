import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {collectionCTE,collectionCountsSql} from '../server/pending-indicators.mjs';
import {runAgentMonitoring,livePresenceSql} from '../server/agent-monitoring.mjs';
import {readPendingSnapshots,pendingSnapshotBatches} from '../server/monitoring-queries.mjs';
import {d1DailyQuotaResponse} from '../server/d1-budget.mjs';
import {measuredEnvironment,timingHeader} from '../server/request-timing.mjs';
import {networkPresenceSql} from '../server/service-desk.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const legacy=JSON.parse(readFileSync('tests/fixtures/d1-budget-legacy-queries.json','utf8'));
const normalize=rows=>rows.map(r=>JSON.stringify(Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b))))).sort();

test('D108: transactional counters equal the canonical rule through lifecycle, transfer, rollback and deletion',()=>{
 const f=collectorFixture(),db=f.sqlite;
 const check=()=>{
  assert.deepEqual(normalize(db.prepare(collectionCountsSql).all()),normalize(db.prepare(collectionCTE+' SELECT state,COUNT(*) AS total FROM pending GROUP BY state').all()));
  assert.deepEqual(normalize(db.prepare('SELECT * FROM panel_collection_states').all()),normalize(db.prepare('SELECT * FROM panel_collection_state_source').all()));
 };
 try{
  check();const unit=f.ids.pending,visit=crypto.randomUUID();
  db.prepare("INSERT INTO inspections(id,unit_id,state,created_by,created_at,updated_at) VALUES(?,?,'paused',?,0,0)").run(visit,unit,f.root.id);check();
  for(const state of ['open','paused','completed','open','completed']){db.prepare('UPDATE inspections SET state=? WHERE id=?').run(state,visit);check();}
  for(const type of ['Obra em andamento','Escola conveniada','Escola municipal militar','Creche municipal','Unidade administrativa']){db.prepare('UPDATE units SET unit_type=? WHERE id=?').run(type,unit);check();}
  for(const active of [0,1]){db.prepare('UPDATE units SET active=? WHERE id=?').run(active,unit);check();}
  // Draft timestamps/answers must not rewrite the counters.
  const changes=db.prepare('SELECT total_changes() n').get().n;
  db.prepare('UPDATE inspections SET updated_at=123 WHERE id=?').run(visit);
  assert.equal(db.prepare('SELECT total_changes() n').get().n-changes,1);check();
  db.exec('BEGIN');db.prepare("UPDATE inspections SET state='open' WHERE id=?").run(visit);check();db.exec('ROLLBACK');check();
  db.prepare('UPDATE inspections SET unit_id=? WHERE id=?').run(f.ids.inactive,visit);check();
  db.prepare('DELETE FROM inspections WHERE id=?').run(visit);check();
  db.prepare('DELETE FROM units WHERE id=?').run(unit);check();
 }finally{db.close();}
});

test('D108: backlog >200 preserves every hardware change, mixed timestamps and resumption',async()=>{
 const f=collectorFixture(),s=seedEquipmentConsultation(f),env={DB:f.db},base=Math.ceil(Date.now()/1000)*1000;
 try{
  await runAgentMonitoring(env,base);
  const source=f.sqlite.prepare('SELECT * FROM agent_inventory_snapshots WHERE device_id=?').get(s.device);
  const add=(n)=>{const id=crypto.randomUUID(),ms=base+n*1000,at=new Date(ms).toISOString().replace(n%2?'.000Z':'not-present','Z'),sections=JSON.parse(source.sections_json);sections.memory.data.installed_bytes=n*1024;
   f.sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,1,?,?,?)').run(id,s.device,s.items[0].id,at,at,crypto.randomUUID(),'periodic',id,JSON.stringify(sections));return {id,at};};
  let last;for(let n=1;n<=350;n++)last=add(n);
  f.sqlite.prepare('UPDATE agent_current_snapshot SET inventory_id=?,collected_at=? WHERE device_id=?').run(last.id,last.at,s.device);
  const read=async()=>{const rows=(await f.db.prepare(livePresenceSql).all()).results,cursors=new Map((await f.db.prepare('SELECT * FROM agent_monitor_cursors').all()).results.map(r=>[r.device_id,r]));
   const actual=await readPendingSnapshots(f.db,rows,cursors),expected=(await f.db.prepare(legacy.snapshots).all()).results;
   assert.deepEqual(normalize(actual.map(({monitor_ms,...r})=>r)),normalize(expected));return actual;};
  assert.equal((await read()).length,200);await runAgentMonitoring(env,base+400000);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM agent_notifications WHERE kind='hardware_change'").get().n,200);
  assert.equal((await read()).length,150);await runAgentMonitoring(env,base+401000);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM agent_notifications WHERE kind='hardware_change'").get().n,350);
  assert.equal((await read()).length,0);await runAgentMonitoring(env,base+402000);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM agent_notifications WHERE kind='hardware_change'").get().n,350);
 }finally{f.sqlite.close();}
});

test('D108: batched ranges respect binding limits and new-link baselines',async()=>{
 const f=collectorFixture(),s=seedEquipmentConsultation(f);try{
  const rows=(await f.db.prepare(livePresenceSql).all()).results;
  assert.equal((await readPendingSnapshots(f.db,rows,new Map())).length,1);
  const old=new Map([[s.device,{link_id:'ended-link',collected_ms:Date.now()+100000}]]);
  assert.equal((await readPendingSnapshots(f.db,rows,old)).length,1,'replacement starts at the current snapshot');
  const batch=pendingSnapshotBatches(Array.from({length:201},(_,i)=>({...rows[0],device_id:'device-'+i})),new Map());
  assert.equal(batch.length,11);assert.ok(batch.every(b=>b.args.length<=80));
  assert.deepEqual(await readPendingSnapshots(f.db,[],new Map()),[]);
 }finally{f.sqlite.close();}
});

test('D108: unchanged loss does not write/lookup context on every minute; recovery stays active',async()=>{
 const f=collectorFixture(),s=seedEquipmentConsultation(f),env={DB:f.db},now=Date.now();try{
  const at=new Date(now-49*3600000).toISOString();f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:at}),s.device);
  await runAgentMonitoring(env,now);const count=f.sqlite.prepare('SELECT COUNT(*) n FROM agent_notifications').get().n;
  const queries=[],prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{queries.push(sql);return prepare(sql);};
  await runAgentMonitoring(env,now+60000);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_notifications').get().n,count);
  assert.equal(queries.some(sql=>sql.startsWith('INSERT OR IGNORE INTO agent_notifications')),false);
  assert.equal(queries.some(sql=>sql.includes('AS hostname')),false,'no detail JSON for unchanged presence');
  f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:new Date(now+60000).toISOString()}),s.device);
  await runAgentMonitoring(env,now+60001);assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM agent_notifications WHERE resolved_at IS NULL AND kind='communication_lost'").get().n,0);
 }finally{f.sqlite.close();}
});

test('D108: backlog spread across batches hydrates only the global first 200 snapshots',async()=>{
 const f=collectorFixture(),s=seedEquipmentConsultation(f),base=Date.now();try{
  const source=f.sqlite.prepare('SELECT * FROM agent_inventory_snapshots WHERE device_id=?').get(s.device);
  for(let n=0;n<41;n++){
   const device=crypto.randomUUID(),equipment=crypto.randomUUID(),link=crypto.randomUUID(),at=new Date(base).toISOString();
   f.sqlite.prepare('INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,published_json,created_by,created_at,updated_by,updated_at) SELECT ?,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,published_json,created_by,created_at,updated_by,updated_at FROM equipments WHERE id=?').run(equipment,s.items[0].id);
   f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,at);
   f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,linked_by,linked_at) VALUES(?,?,?,?,?)').run(link,device,equipment,f.root.id,at);
   f.sqlite.prepare('INSERT INTO agent_monitor_cursors VALUES(?,?,?,?,0,?,?)').run(device,link,base,'{}',crypto.randomUUID(),base);
   let last;for(let j=1;j<=10;j++){const date=new Date(base+j*1000).toISOString(),id=crypto.randomUUID();f.sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,1,?,?,?)').run(id,device,equipment,date,date,crypto.randomUUID(),'periodic',id,source.sections_json);last={id,date};}
   f.sqlite.prepare('INSERT INTO agent_current_snapshot VALUES(?,?,?)').run(device,last.id,last.date);
  }
  const rows=(await f.db.prepare(livePresenceSql).all()).results,cursors=new Map((await f.db.prepare('SELECT * FROM agent_monitor_cursors').all()).results.map(r=>[r.device_id,r]));
  const batch=f.db.batch.bind(f.db);let fullRows=0;
  f.db.batch=async statements=>{const result=await batch(statements);fullRows+=result.flatMap(r=>r.results).filter(r=>'sections_json'in r).length;return result;};
  const actual=await readPendingSnapshots(f.db,rows,cursors),expected=(await f.db.prepare(legacy.snapshots).all()).results;
  assert.equal(actual.length,200);assert.equal(fullRows,200,'do not hydrate all candidate batches');
  assert.deepEqual(actual.map(s=>s.inventory_id),expected.map(s=>s.inventory_id));
  assert.deepEqual(normalize(actual.map(({monitor_ms,...r})=>r)),normalize(expected));
 }finally{f.sqlite.close();}
});

test('D108: row metrics include first/all/batch with no extra queries or credentials',async()=>{
 let calls=0;
 const db={prepare(){return {all:async()=>{calls++;return {results:[{secret:'not-in-header'}],meta:{rows_read:7,rows_written:0}};},first:async()=>{throw Error('metadata would be lost');}};},batch:async()=>{calls++;return [{meta:{rows_read:3,rows_written:2}},{meta:{rows_read:5,rows_written:1}}];}};
 const env=measuredEnvironment(new Request('https://test.invalid/api/test'),{DB:db});
 assert.deepEqual(await env.DB.prepare('not logged').first(),{secret:'not-in-header'});await env.DB.prepare('').all();await env.DB.batch([]);
 assert.equal(calls,3);const h=timingHeader(env);assert.match(h,/d1_rows_read;desc="22"/);assert.match(h,/d1_rows_written;desc="3"/);assert.doesNotMatch(h,/secret|not-in-header|not logged|d1_unmeasured/);
});

test('D108: heartbeat during page hydration keeps the same presence used by its filter',async()=>{
 const f=collectorFixture(),s=seedEquipmentConsultation(f),auth=await session(f,f.root),old=new Date(Date.now()-2*3600000).toISOString();
 try{
  f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:old}),s.device);
  const prepare=f.db.prepare.bind(f.db);let first=true;
  f.db.prepare=sql=>{const stmt=prepare(sql);if(sql===networkPresenceSql){const all=stmt.all;stmt.all=async()=>{const r=await all();if(first){first=false;f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:new Date().toISOString()}),s.device);}return r;};}return stmt;};
  const response=await humanFetch(worker,{DB:f.db,AUTH_PEPPER:'TEST-ONLY'},'https://test.invalid',auth,'/api/operations/computers?presence=lost');
  assert.equal(response.status,200,JSON.stringify(response.data));const item=response.data.items.find(r=>r.device_id===s.device);assert.ok(item);
  assert.equal(item.presence_state,'no_recent_communication');assert.equal(item.last_contact_at,old);
  const next=await humanFetch(worker,{DB:f.db,AUTH_PEPPER:'TEST-ONLY'},'https://test.invalid',auth,'/api/operations/computers?presence=online');
  assert.equal(next.status,200);assert.ok(next.data.items.some(r=>r.device_id===s.device&&r.presence_state==='communicating'));
 }finally{f.sqlite.close();}
});

test('D108: only daily D1 exhaustion pauses dashboard GETs until the UTC reset',async t=>{
 const now=Date.parse('2026-11-12T23:59:30Z');t.mock.method(Date,'now',()=>now);
 const response=d1DailyQuotaResponse(new Error('D1_ERROR: daily rows read limit exceeded (7500); PRIVATE_SQL'),now);
 assert.equal(response.status,503);assert.equal(response.headers.get('Retry-After'),'30');const data=await response.json();assert.equal(data.retryAt,Date.parse('2026-11-13T00:00:00Z'));assert.doesNotMatch(JSON.stringify(data),/PRIVATE_SQL/);
 for(const e of ['Drive daily quota exceeded','D1_ERROR: database busy','D1_ERROR: table missing','D1_ERROR: no such table: user_7500','Invalid credentials'])assert.equal(d1DailyQuotaResponse(Error(e),now),null);
 assert.equal(d1DailyQuotaResponse(Error('D1 request failed [code: 7500]'),now).status,503);
 const api=await import('../web/desktop-request.js?quota-test');let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json(data,{status:503});});
 await assert.rejects(api.readPanelJson('/api/test'));await assert.rejects(api.readPanelJson('/api/other'));assert.equal(calls,1);
 t.mock.method(Date,'now',()=>data.retryAt);t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({ok:true});});
 assert.deepEqual(await api.readPanelJson('/api/test'),{ok:true});assert.equal(calls,2);
});
