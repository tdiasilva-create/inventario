// D123: local workerd only. Private backup stays local; output is aggregate metrics.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hardwareSummary} from '../server/hardware-review.mjs';
import {serviceDeskRoutes} from '../server/service-desk.mjs';
import {measuredEnvironment,timingHeader} from '../server/request-timing.mjs';
import {collectorFixture} from '../tests/helpers/collector-db.mjs';
import {connectionFixture} from '../tests/helpers/agent-connection.mjs';
import {machinePost,heartbeatBody} from '../tests/helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const input=process.argv[2],output=process.argv[3];if(!input||!output)throw Error('Usage: node scripts/measure-audit-budget.mjs PRIVATE_BACKUP.sql OUTPUT.json');
const hash=b=>createHash('sha256').update(b).digest('hex');
const dump=readFileSync(input),sqlite=new DatabaseSync(':memory:');sqlite.exec(dump.toString());
const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(x=>x.name);
const tableHash=t=>hash(JSON.stringify(sqlite.prepare('SELECT * FROM "'+t+'"').all()));
const before=new Map(tables.map(t=>[t,tableHash(t)])),fk=sqlite.prepare('PRAGMA foreign_key_check').all();
async function oldModule(file){const source=execFileSync('git',['show','9c00bac:'+file],{encoding:'utf8'}).replace(/from (['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+q+pathToFileURL(path.resolve(path.dirname(file),p)).href+q);return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
const oldHardware=(await oldModule('server/hardware-review.mjs')).hardwareSummary,oldDesk=(await oldModule('server/service-desk.mjs')).serviceDeskRoutes;
const require=createRequire(import.meta.url),{Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:'export default {fetch(){return new Response("isolated")}}',d1Databases:['DB','AGENT']}));
async function copy(source,db){
 const schema=source.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 await db.batch(schema.filter(x=>x.type==='table').map(x=>db.prepare(x.sql)));
 const insert=[db.prepare('PRAGMA defer_foreign_keys=ON')];
 for(const t of schema.filter(x=>x.type==='table'))for(const row of source.prepare('SELECT * FROM "'+t.name+'"').all()){
  const cols=Object.keys(row);insert.push(db.prepare('INSERT INTO "'+t.name+'" ('+cols.map(c=>'"'+c+'"').join(',')+') VALUES('+cols.map(()=>'?').join(',')+')').bind(...Object.values(row).map(x=>x instanceof Uint8Array?x.buffer.slice(x.byteOffset,x.byteOffset+x.byteLength):x)));
 }
 await db.batch(insert);for(const x of schema.filter(x=>x.type!=='table'))await db.prepare(x.sql).run();
}
const metrics=env=>Object.fromEntries([...timingHeader(env).matchAll(/(d1_rows_read|d1_rows_written|d1_calls);desc="(\d+)"/g)].map(m=>[m[1],+m[2]]));
const normal=v=>JSON.parse(JSON.stringify(v));
const user={id:'local-test-root',role:'root'},helpers={json:(v,status=200)=>Response.json(v,{status}),fail:(error,status=400)=>Response.json({error},{status})};
async function sample(db,fn){const env=measuredEnvironment(new Request('https://local.invalid/api/measure'),{DB:db});const data=await fn(env);return {data:normal(data),...metrics(env)};}
const queries=[['hardware.summary',env=>oldHardware(env.DB),env=>hardwareSummary(env.DB)],...['pending','all','Concluída'].map(status=>{
 const req=new Request('https://local.invalid/api/operations/requests?status='+encodeURIComponent(status));
 return ['demands.'+status,async env=>(await oldDesk(req,new URL(req.url),user,env,helpers)).json(),async env=>(await serviceDeskRoutes(req,new URL(req.url),user,env,helpers)).json()];
})];
try{
 const db=await mf.getD1Database('DB');await copy(sqlite,db);
 const samples=[];for(const [name,fn] of queries)samples.push({name,before:await sample(db,fn)});
 const sql=readFileSync('migrations/0035_audit_read_budget.sql','utf8');sqlite.exec(sql);
 for(const t of tables)assert.equal(tableHash(t),before.get(t),'canonical table changed: '+t);
 assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),fk);assert.equal(sqlite.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 await db.exec(sql.split('\n').filter(l=>!l.trimStart().startsWith('--')).join(' '));
 for(const [i,[, ,fn]] of queries.entries()){
  const after=await sample(db,fn),previous=samples[i].before;assert.deepEqual(after.data,previous.data,samples[i].name);
  delete previous.data;delete after.data;samples[i].after=after;samples[i].equivalent=true;
 }
 // Actual signed heartbeat on synthetic installation. No machine/user from production is used.
 const f=collectorFixture(),fixtureEnv={DB:f.db,AUTH_PEPPER:'TEST'},agent=await connectionFixture(f,fixtureEnv),agentDb=await mf.getD1Database('AGENT');await copy(f.sqlite,agentDb);
 const heartbeat=[];let sequence=100;
 for(const keep of ['20','0']){
  const r=await sample(agentDb,async env=>{
   const b=heartbeatBody(agent.identity,{sequence:++sequence});
   const result=await machinePost(worker,{...env,AUTH_PEPPER:'TEST',AGENTES_GUARDAR_HEARTBEATS:keep},'https://local.invalid',agent.identity,'/api/agent/v1/heartbeat',b);
   assert.equal(result.status,200);assert.equal(result.data.presence_updated,true);return result.data;
  });delete r.data;heartbeat.push({keep,...r});
 }
 const b=heartbeatBody(agent.identity,{sequence:++sequence});const env={DB:agentDb,AUTH_PEPPER:'TEST',AGENTES_GUARDAR_HEARTBEATS:'0'};
 let r=await machinePost(worker,env,'https://local.invalid',agent.identity,'/api/agent/v1/heartbeat',b);assert.equal(r.status,200);
 r=await machinePost(worker,env,'https://local.invalid',agent.identity,'/api/agent/v1/heartbeat',b);assert.equal(r.data.duplicate,true);
 r=await machinePost(worker,env,'https://local.invalid',agent.identity,'/api/agent/v1/heartbeat',{...b,uptime_seconds:4321});assert.equal(r.status,409);
 const nonce='fixed-test-nonce-123456789';const fresh=heartbeatBody(agent.identity,{sequence:++sequence});
 r=await machinePost(worker,env,'https://local.invalid',agent.identity,'/api/agent/v1/heartbeat',fresh,{nonce});assert.equal(r.status,200);
 r=await machinePost(worker,env,'https://local.invalid',agent.identity,'/api/agent/v1/heartbeat',fresh,{nonce});assert.equal(r.status,401);
 f.sqlite.close();
 const out={at:new Date().toISOString(),runtime:'LOCAL workerd, private database copy; no production writes',backup:{bytes:dump.length,sha256:hash(dump),unchangedTables:tables.length,foreignKeyIssues:fk.length},queries:samples,heartbeat,security:{receiptReplay:true,modifiedBodyRejected:true,nonceReplayRejected:true},notice:'Per-operation measurements, not full-day account usage or capacity certification.'};
 writeFileSync(output,JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
}finally{sqlite.close();await mf.dispose();}
