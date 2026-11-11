import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {providerReportFixture} from './helpers/provider-report.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
const endpoint='/api/inventory/provider-report',origin='https://panel.test';
async function setup(options){const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',DEBUG_COLLECTION:'1'},auth=await session(f,f.root),s=await providerReportFixture(f,env,options);return {...f,env,auth,s,call:(path=endpoint,data,sess=auth,e=env)=>humanFetch(worker,e,origin,sess,path,data)};}

test('D098: toda a rede com vínculo atual e dados recebidos, inclusive offline antigo e legado sem IP',async()=>{
 const f=await setup();try{const before=f.sqlite.prepare('SELECT * FROM published_equipment_counts').all(),r=await f.call();assert.equal(r.status,200);const d=r.data;
 assert.equal(d.complete,true);assert.equal(d.total,4);assert.equal(d.items.length,4);assert.equal(d.totals.with_provider,2);assert.equal(d.totals.without_provider,2);
 const live=d.items.find(x=>x.id===f.s.items[0].id),offline=d.items.find(x=>x.id===f.s.offline.id),legacy=d.items.find(x=>x.id===f.s.legacy.id),only=d.items.find(x=>x.id===f.s.snapshotOnly.id);
 assert.equal(live.public_ip,'198.51.100.25');assert.equal(live.provider,'REDE TESTE ISOLADO');assert.equal(live.hostname,'TESTE-PC-001');assert.equal(offline.presence_state,'no_recent_communication');assert.equal(offline.last_contact_at,'2026-01-01T12:00:00Z');assert.equal(offline.public_ip,'203.0.113.10');assert.equal(legacy.public_ip,null);assert.equal(only.last_contact_at,null);
 for(const id of [f.s.items[1].id,f.s.ended.id,f.s.never.id,f.s.printer.id])assert.ok(!d.items.some(r=>r.id===id));
 assert.doesNotMatch(JSON.stringify(d),/RASCUNHO SEGREDO|usuario-teste|local_accounts|192\.168\.10\.25|fe80::25|sections_json|presence_json|AUTH_PEPPER/);assert.deepEqual(f.sqlite.prepare('SELECT * FROM published_equipment_counts').all(),before);
 }finally{f.sqlite.close();}
});
test('D098: mais de uma página, mesmo IP e escolas homônimas não eliminam computadores',async()=>{
 const f=await setup({extra:130});try{
 f.sqlite.prepare('UPDATE units SET name=(SELECT name FROM units WHERE id=?) WHERE id=?').run(f.s.unit,f.ids.inactive);
 const other=f.s.add({unit:f.ids.inactive,host:'=TESTE <img src=x>',state:'revoked'}),r=(await f.call()).data;
 assert.equal(r.total,135);assert.equal(r.items.length,135);assert.equal(new Set(r.items.map(x=>x.id)).size,135);assert.equal(r.totals.units,2);assert.ok(r.items.filter(x=>x.public_ip==='203.0.113.10').length>130);
 assert.equal(r.items.find(x=>x.id===other.id).unit_active,false);assert.equal(r.items.find(x=>x.id===other.id).presence_state,'revoked');
 // Ended link and archived/deleted equipment cannot inherit the active installation's connection.
 f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE link_id=?').run(new Date().toISOString(),other.link);assert.equal((await f.call()).data.total,134);
 f.sqlite.prepare("UPDATE units SET unit_type='Escola conveniada' WHERE id=?").run(f.s.unit);assert.equal((await f.call()).data.total,0);
 }finally{f.sqlite.close();}
});
test('D098: sessão, perfis, coletor bloqueado, GET apenas, sem filtros e falha explícita',async()=>{
 const f=await setup();try{
 assert.equal((await worker.fetch(new Request(origin+endpoint),f.env)).status,401);const op=await session(f,f.operator);assert.equal((await f.call(endpoint,undefined,op)).status,403);assert.equal((await f.call(endpoint,undefined,f.auth,{...f.env,APP_KIND:'collector'})).status,403);assert.equal((await f.call(endpoint,{})).status,405);
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);assert.equal((await f.call()).status,200);}
 assert.equal((await f.call(endpoint+'?unitId='+f.s.unit)).status,400);assert.equal((await f.call(endpoint+'?presence=online')).status,400);
 f.db.prepare=()=>{throw Error('D1 indisponível · TESTE');};assert.equal((await f.call()).status,503);
 }finally{f.sqlite.close();}
});
