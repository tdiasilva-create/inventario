import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {providerReportFixture} from './helpers/provider-report.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {providerReport} from '../server/provider-report.mjs';
import {runProviderReports,nextProviderReportAt,listProviderReports,savedProviderReport} from '../server/provider-report-history.mjs';
const origin='https://panel.test',start=Date.parse('2026-11-11T21:00:00Z'),monday=Date.parse('2026-11-16T11:00:00Z');
async function setup(){const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',DEBUG_COLLECTION:'1'},auth=await session(f,f.root),s=await providerReportFixture(f,env);return {...f,env,auth,s,call:(path,data,sess=auth,e=env)=>humanFetch(worker,e,origin,sess,path,data)};}
test('D099: uma linha por ID de unidade, provedor completo mais recente; nunca mistura computadores',async()=>{
 const f=await setup();try{
  const latest=f.s.add({at:'2090-01-01T12:00:00Z',ip:'198.51.100.10',provider:'REDE MAIS RECENTE'});
  f.s.add({at:'2091-01-01T12:00:00Z',ip:'198.51.100.11',provider:null});
  f.s.add({at:'2089-01-01T12:00:00Z',ip:'198.51.100.12',provider:'REDE ANTERIOR'});
  f.sqlite.prepare('UPDATE units SET name=(SELECT name FROM units WHERE id=?) WHERE id=?').run(f.s.unit,f.ids.inactive);
  f.s.add({unit:f.ids.inactive,ip:null});
  const r=(await f.call('/api/inventory/provider-report')).data;
  assert.equal(r.scope,'one-per-unit-with-agent-data');assert.equal(r.total,2);assert.equal(r.totals.with_provider,1);assert.equal(r.totals.without_provider,1);
  const selected=r.items.find(x=>x.unit_id===f.s.unit);assert.equal(selected.id,latest.id);assert.equal(selected.public_ip,'198.51.100.10');assert.equal(selected.provider,'REDE MAIS RECENTE');assert.equal(selected.last_contact_at,'2090-01-01T12:00:00Z');
  assert.equal(r.items.find(x=>x.unit_id===f.ids.inactive).provider,null);assert.equal(new Set(r.items.map(x=>x.unit_name)).size,1);
  // Stable tie-breaking by permanent ID.
  const tie=f.s.add({at:'2090-01-01T12:00:00Z'}),again=await providerReport(f.db,f.env);assert.equal(again.items.find(x=>x.unit_id===f.s.unit).id,[latest.id,tie.id].sort()[0]);
 }finally{f.sqlite.close();}
});
test('D099: segunda 08h Fortaleza; fronteiras, domingo e mudança de ano',()=>{
 assert.equal(nextProviderReportAt(start),'2026-11-16T11:00:00.000Z');
 assert.equal(nextProviderReportAt(monday-1),'2026-11-16T11:00:00.000Z');
 assert.equal(nextProviderReportAt(monday),'2026-11-23T11:00:00.000Z');
 assert.equal(nextProviderReportAt(Date.parse('2026-11-16T02:00:00Z')),'2026-11-16T11:00:00.000Z');
 assert.equal(nextProviderReportAt(Date.parse('2026-12-31T23:00:00Z')),'2027-01-04T11:00:00.000Z');
});
test('D099: registro inicial e semanal persistem; repetição não duplica e edição não altera passado',async()=>{
 const f=await setup();try{
  assert.equal((await listProviderReports(f.db)).total,0);
  await runProviderReports(f.env,start);const initial=(await listProviderReports(f.db)).items[0],before=await savedProviderReport(f.db,initial.id);
  assert.equal(initial.kind,'initial');assert.equal(initial.generated_at,new Date(start).toISOString());
  assert.equal((await runProviderReports(f.env,monday-1)).due,false);
  f.sqlite.prepare("UPDATE units SET name='TESTE · NOME NOVO' WHERE id=?").run(f.s.unit);
  f.sqlite.prepare("UPDATE agent_presence SET data_json=json_set(data_json,'$.network_observation.provider','PROVEDOR NOVO') WHERE device_id=?").run(f.s.device);
  await runProviderReports(f.env,monday);await runProviderReports(f.env,monday+60000);
  const list=await listProviderReports(f.db);assert.equal(list.total,2);assert.equal(list.items[0].kind,'weekly');assert.equal(list.schedule.next_due_at,'2026-11-23T11:00:00.000Z');
  assert.deepEqual(await savedProviderReport(f.db,initial.id),before);
  const saved=await savedProviderReport(f.db,list.items[0].id);assert.equal(saved.items[0].provider,'PROVEDOR NOVO');assert.equal(saved.items[0].unit_name,'TESTE · NOME NOVO');
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=?').run(new Date().toISOString());assert.equal((await providerReport(f.db,f.env)).total,0);assert.deepEqual(await savedProviderReport(f.db,initial.id),before);
  assert.throws(()=>f.sqlite.prepare("UPDATE provider_reports SET report_json='{}'").run(),/IMMUTABLE/);
 }finally{f.sqlite.close();}
});
test('D099: falha atômica retém vencimento e tenta novamente; ausência prolongada não fabrica semanas',async()=>{
 const f=await setup();try{
  await runProviderReports(f.env,start);
  const original=f.db.batch;f.db.batch=async statements=>original([...statements,f.db.prepare('INSERT INTO provider_report_schedule VALUES(1,?,?)').bind('falha','falha')]);
  await assert.rejects(runProviderReports(f.env,monday));f.db.batch=original;
  assert.equal((await listProviderReports(f.db)).total,1);assert.equal((await listProviderReports(f.db)).schedule.next_due_at,new Date(monday).toISOString());
  const late=Date.parse('2026-12-02T12:00:00Z');await runProviderReports(f.env,late);const r=(await listProviderReports(f.db)).items[0];
  assert.equal(r.scheduled_at,new Date(monday).toISOString());assert.equal(r.generated_at,new Date(late).toISOString());assert.equal(r.missed_weeks,2);assert.equal((await listProviderReports(f.db)).total,2);assert.equal((await listProviderReports(f.db)).schedule.next_due_at,'2026-12-07T11:00:00.000Z');
 }finally{f.sqlite.close();}
});
test('D099: execuções concorrentes geram um único registro inicial e um por semana',async()=>{
 const f=await setup();try{
  // D1 serializes atomic batches; emulate its queue rather than overlapping SQLite BEGINs.
  let queue=Promise.resolve();const batch=f.db.batch;f.db.batch=statements=>{const job=queue.then(()=>batch(statements));queue=job.catch(()=>{});return job;};
  await Promise.all([runProviderReports(f.env,start),runProviderReports(f.env,start+1)]);assert.equal((await listProviderReports(f.db)).total,1);
  await Promise.all([runProviderReports(f.env,monday),runProviderReports(f.env,monday+1)]);assert.equal((await listProviderReports(f.db)).total,2);
 }finally{f.sqlite.close();}
});
test('D099: histórico paginado completo, vazio legítimo, somente consulta e permissões em todas as rotas',async()=>{
 const f=await setup();try{
  await runProviderReports(f.env,start);for(let n=0;n<24;n++)await runProviderReports(f.env,monday+n*7*86400000);
  const first=(await f.call('/api/inventory/provider-reports')).data,second=(await f.call('/api/inventory/provider-reports?offset=20')).data;assert.equal(first.total,25);assert.equal(first.items.length,20);assert.equal(second.items.length,5);assert.equal(second.nextOffset,null);
  const paths=['/api/inventory/provider-report','/api/inventory/provider-reports','/api/inventory/provider-report-saved?id='+first.items[0].id];
  for(const role of ['root','admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);for(const path of paths)assert.equal((await f.call(path)).status,200);}
  const op=await session(f,f.operator);
  for(const path of paths){assert.equal((await worker.fetch(new Request(origin+path),f.env)).status,401);assert.equal((await f.call(path,undefined,op)).status,403);assert.equal((await f.call(path,undefined,f.auth,{...f.env,APP_KIND:'collector'})).status,403);assert.equal((await f.call(path,{})).status,405);}
  assert.equal((await f.call('/api/inventory/provider-reports?offset=-1')).status,400);assert.equal((await f.call('/api/inventory/provider-report-saved?id=bad')).status,400);assert.equal((await f.call('/api/inventory/provider-report-saved?id='+crypto.randomUUID())).status,404);
  assert.equal((await runProviderReports({...f.env,APP_KIND:'collector'},monday+25*7*86400000)).skipped,true);
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=?').run(new Date().toISOString());await runProviderReports(f.env,monday+25*7*86400000);const last=(await listProviderReports(f.db)).items[0];assert.equal(last.unit_count,0);assert.equal((await savedProviderReport(f.db,last.id)).complete,true);
 }finally{f.sqlite.close();}
});
test('D099: cron real do Worker chama a rotina sem depender de navegador aberto',async()=>{
 const f=await setup();try{
  let queue=Promise.resolve();const batch=f.db.batch;f.db.batch=statements=>{const job=queue.then(()=>batch(statements));queue=job.catch(()=>{});return job;};
  await worker.scheduled({cron:'* * * * *'},f.env);assert.equal((await listProviderReports(f.db)).total,1);await worker.scheduled({cron:'* * * * *'},f.env);assert.equal((await listProviderReports(f.db)).total,1);
 }finally{f.sqlite.close();}
});
