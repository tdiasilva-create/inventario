import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {session} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {serviceDeskRoutes,fleetCatalogueSql,fleetPresenceSql} from '../server/service-desk.mjs';
import {presenceState} from '../server/agentes/presence.mjs';
import {readRevision} from '../server/panel-read-cache.mjs';

const call=(f,auth,path='/api/inventory/results',etag)=>worker.fetch(new Request('https://test.invalid'+path,{headers:{Cookie:auth.cookie,...(etag?{'If-None-Match':etag}:{})}}),{DB:f.db,AUTH_PEPPER:'TEST'});
const fleet=async f=>{const url=new URL('https://test.invalid/api/operations/units');return (await serviceDeskRoutes(new Request(url),url,f.root,{DB:f.db},f.helpers)).json();};
const revise=(f,sql,...args)=>f.sqlite.prepare(sql).run(...args);

test('D110: unchanged results revalidate after fresh auth, never after revocation or role change',async()=>{
 const f=collectorFixture();try{
  seedEquipmentConsultation(f);const auth=await session(f,f.root),a=await call(f,auth),etag=a.headers.get('ETag');
  assert.equal(a.status,200);assert.ok(etag);const queries=[],prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{queries.push(sql);return prepare(sql);};
  const unchanged=await call(f,auth,undefined,etag);assert.equal(unchanged.status,304);assert.equal(await unchanged.text(),'');
  assert.equal(queries.length,2);assert.match(queries[0],/FROM sessions/);assert.match(queries[1],/panel_read_versions/);
  assert.match(unchanged.headers.get('Cache-Control'),/no-store/);
  revise(f,"UPDATE users SET role='operador' WHERE id=?",f.root.id);assert.equal((await call(f,auth,undefined,etag)).status,403);
  revise(f,"UPDATE users SET role='root',must_change=1 WHERE id=?",f.root.id);assert.equal((await call(f,auth,undefined,etag)).status,403);
  revise(f,'UPDATE users SET active=0 WHERE id=?',f.root.id);assert.equal((await call(f,auth,undefined,etag)).status,401);
 }finally{f.sqlite.close();}
});

test('D110: validators distinguish user and unit; publication, removal and rollback invalidate correctly',async()=>{
 const f=collectorFixture();try{
  const seed=seedEquipmentConsultation(f),auth=await session(f,f.root),first=await call(f,auth),tag=first.headers.get('ETag'),before=await first.json();
  const path='/api/inventory/results?unitId='+seed.unit;
  assert.equal((await call(f,auth,path,tag)).status,200);
  const other={id:crypto.randomUUID(),role:'visualizador',username:'viewer'};
  revise(f,'INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)',other.id,other.username,other.role,'TEST','TEST',0);
  assert.equal((await call(f,await session(f,other),undefined,tag)).status,200);
  revise(f,"UPDATE equipments SET data_json=json_set(data_json,'$.model','ONLY DRAFT') WHERE id=?",seed.items[0].id);
  assert.equal((await call(f,auth,undefined,tag)).status,304,'draft not promoted');
  f.sqlite.exec('BEGIN');revise(f,"UPDATE equipments SET published_json=json_set(published_json,'$.operation','Não funciona') WHERE id=?",seed.items[0].id);f.sqlite.exec('ROLLBACK');
  assert.equal((await call(f,auth,undefined,tag)).status,304);
  revise(f,"UPDATE equipments SET published_json=json_set(published_json,'$.operation','Não funciona') WHERE id=?",seed.items[0].id);
  const after=await call(f,auth,undefined,tag);assert.equal(after.status,200);assert.notEqual(after.headers.get('ETag'),tag);assert.notDeepEqual(await after.json(),before);
  const next=after.headers.get('ETag');revise(f,'DELETE FROM equipments WHERE id=?',seed.items[1].id);
  assert.equal((await call(f,auth,undefined,next)).status,200);
 }finally{f.sqlite.close();}
});

test('D110: section edits, visits, completion, eligibility and miscellaneous publication refresh results',async()=>{
 const f=collectorFixture();try{
  const s=seedEquipmentConsultation(f),auth=await session(f,f.root);
  const change=async run=>{const before=await call(f,auth),tag=before.headers.get('ETag');run();assert.equal((await call(f,auth,undefined,tag)).status,200);};
  await change(()=>revise(f,'INSERT INTO inspection_sections(inspection_id,section,data_json,updated_by,updated_at) VALUES(?,?,?,?,0)',s.visit,'H','{}',f.root.id));
  await change(()=>revise(f,"UPDATE inspection_sections SET data_json=? WHERE inspection_id=? AND section='H'",JSON.stringify({occurrences:[{type:'Internet',description:'TESTE LOCAL'}]}),s.visit));
  await change(()=>revise(f,"DELETE FROM inspection_sections WHERE inspection_id=? AND section='H'",s.visit));
  await change(()=>revise(f,'INSERT INTO visit_answers(inspection_id,data_json,updated_by,updated_at) VALUES(?,?,?,0)',s.visit,'{}',f.root.id));
  await change(()=>revise(f,"UPDATE visit_answers SET data_json=? WHERE inspection_id=?",JSON.stringify({internet:{available:'Sim'}}),s.visit));
  await change(()=>revise(f,'DELETE FROM visit_answers WHERE inspection_id=?',s.visit));
  const cols=f.sqlite.prepare('PRAGMA table_info(miscellaneous_equipments)').all().map(c=>c.name);
  await change(()=>revise(f,`INSERT INTO miscellaneous_equipments(${cols.join(',')}) SELECT ${cols.map(c=>c==='id'?"'TEST-MISC'":c).join(',')} FROM equipments WHERE id=?`,s.printer));
  await change(()=>revise(f,"UPDATE miscellaneous_equipments SET published_json=json_set(published_json,'$.brand','ALTERED') WHERE id='TEST-MISC'"));
  await change(()=>revise(f,"DELETE FROM miscellaneous_equipments WHERE id='TEST-MISC'"));
  await change(()=>revise(f,"UPDATE inspections SET state='paused' WHERE id=?",s.visit));
  await change(()=>revise(f,"UPDATE inspections SET state='completed' WHERE id=?",s.visit));
  await change(()=>revise(f,"UPDATE units SET active=0 WHERE id=?",s.unit));
 }finally{f.sqlite.close();}
});

test('D110: a write between result queries prevents caching a mixed response',async()=>{
 const f=collectorFixture();try{
  const s=seedEquipmentConsultation(f),auth=await session(f,f.root),prepare=f.db.prepare.bind(f.db);let done=false;
  f.db.prepare=sql=>{if(!done&&sql.includes('SELECT v.*')){done=true;revise(f,"UPDATE units SET name='TEST concurrent' WHERE id=?",s.unit);}return prepare(sql);};
  const response=await call(f,auth);assert.equal(response.status,200);assert.equal(response.headers.get('ETag'),null);
  assert.ok((await call(f,auth)).headers.get('ETag'));
 }finally{f.sqlite.close();}
});

test('D110: stable fleet memo skips joins but heartbeat and timeout remain fresh',async()=>{
 const f=collectorFixture(),originalNow=Date.now;try{
  const s=seedEquipmentConsultation(f),at=originalNow(),queries=[],prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{queries.push(sql);return prepare(sql);};
  Date.now=()=>at;await fleet(f);queries.length=0;
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).online,1);assert.ok(!queries.includes(fleetCatalogueSql));assert.ok(!queries.some(q=>q.includes('FROM inventory_equipment_all')));
  const revision=await readRevision(f.db,'fleet');Date.now=()=>at+1020001;
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).lost,1,'timeout without a write');
  const fresh=new Date(Date.now()).toISOString();revise(f,'UPDATE agent_presence SET data_json=? WHERE device_id=?',JSON.stringify({last_live_contact_at:fresh}),s.device);
  assert.equal(await readRevision(f.db,'fleet'),revision,'no revision write for heartbeat');
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).online,1,'heartbeat read on warm cache');
  revise(f,'UPDATE agent_presence SET data_json=? WHERE device_id=?',JSON.stringify({last_live_contact_at:fresh,last_reason:'shutdown',last_reason_at:fresh}),s.device);
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).other,1);
  revise(f,"UPDATE agent_devices SET state='revoked' WHERE device_id=?",s.device);assert.notEqual(await readRevision(f.db,'fleet'),revision);
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).other,1);
 }finally{Date.now=originalNow;f.sqlite.close();}
});

test('D110: rename, declaration, equipment transfer, new/ended link and separate databases invalidate fleet',async()=>{
 const f=collectorFixture(),g=collectorFixture();try{
  const s=seedEquipmentConsultation(f);await fleet(f);await fleet(g);
  revise(f,"UPDATE units SET name='TEST RENAMED' WHERE id=?",s.unit);assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).name,'TEST RENAMED');
  assert.ok(!(await fleet(g)).units.some(u=>u.id===s.unit));
  revise(f,"INSERT INTO computer_context(target_id,unit_id,kind,value,version,updated_at,updated_by) VALUES(?,?,'unit','none',1,0,?)",s.unit,s.unit,f.root.id);
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).computer_declaration,'none');
  const now=new Date().toISOString();revise(f,'UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?',now,s.device);
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).online,0);
  revise(f,'INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,linked_by,linked_at) VALUES(?,?,?,?,?)',crypto.randomUUID(),s.device,s.items[1].id,f.root.id,now);
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).online,1);
  revise(f,'UPDATE equipments SET unit_id=? WHERE id=?',f.ids.inactive,s.items[1].id);
  assert.equal((await fleet(f)).units.find(u=>u.id===f.ids.inactive).online,1);
 }finally{f.sqlite.close();g.sqlite.close();}
});

test('D110: fresh-contact failures are not converted to offline and catalogue failures are retryable',async()=>{
 const f=collectorFixture();try{
  seedEquipmentConsultation(f);await fleet(f);const prepare=f.db.prepare.bind(f.db);
  f.db.prepare=sql=>{if(sql.includes('FROM agent_presence'))throw Error('SIMULATED READ FAILURE');return prepare(sql);};
  await assert.rejects(fleet(f),/SIMULATED/);
  f.db.prepare=prepare;assert.ok((await fleet(f)).units.some(u=>u.online));
  revise(f,"UPDATE units SET name='CHANGED' WHERE id=?",f.ids.pending);
  f.db.prepare=sql=>{if(sql===fleetCatalogueSql)throw Error('SIMULATED CATALOGUE FAILURE');return prepare(sql);};
  await assert.rejects(fleet(f),/SIMULATED/);f.db.prepare=prepare;assert.ok((await fleet(f)).units.some(u=>u.name==='CHANGED'));
 }finally{f.sqlite.close();}
});

test('D110: open/finished demands change immediately on a warm catalogue without revision writes',async()=>{
 const f=collectorFixture();try{
  const s=seedEquipmentConsultation(f);await fleet(f);const revision=await readRevision(f.db,'fleet');
  revise(f,"INSERT INTO service_requests(id,number,unit_id,context_json,description,kind,source,status,created_at,created_by,updated_at,last_operation) VALUES('TEST-REQUEST',1,?,'{}','TESTE LOCAL','Manutenção','Telefone','Aberta',0,?,0,'TEST-OP')",s.unit,f.root.id);
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).demands,1);
  revise(f,"UPDATE service_requests SET status='Concluída' WHERE id='TEST-REQUEST'");
  assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).demands,0);
  assert.equal(await readRevision(f.db,'fleet'),revision);
 }finally{f.sqlite.close();}
});

test('D110: full fleet counts match canonical joins through category fallback and null/malformed dates',async()=>{
 const f=collectorFixture();try{
  const s=seedEquipmentConsultation(f);
  const check=async()=>{
   const actual=(await fleet(f)).units,rows=(await f.db.prepare(fleetPresenceSql).all()).results;
   for(const u of actual){const expected={computers:0,online:0,lost:0,unlinked:0,other:0};for(const r of rows.filter(r=>r.unit_id===u.id)){expected.computers++;const state=r.device_id?presenceState({state:r.state},JSON.parse(r.presence_json||'{}')):'unlinked';expected[['communicating','communicating_with_failure'].includes(state)?'online':state==='no_recent_communication'?'lost':state==='unlinked'?'unlinked':'other']++;}for(const k of Object.keys(expected))assert.equal(u[k],expected[k],k);}
  };
  for(const p of [{},{last_live_contact_at:'bad'},{last_live_contact_at:new Date().toISOString(),last_health_inventory:'error'}]){revise(f,'UPDATE agent_presence SET data_json=? WHERE device_id=?',JSON.stringify(p),s.device);await check();}
  revise(f,"UPDATE equipments SET category='',data_json=json_set(data_json,'$.category','printer') WHERE id=?",s.items[0].id);await check();
  revise(f,"UPDATE equipments SET data_json=json_set(data_json,'$.category','desktop') WHERE id=?",s.items[0].id);await check();
 }finally{f.sqlite.close();}
});
