// Rehearsal against a PRIVATE export in local workerd. No remote writes or data output.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inventoryResults} from '../server/inventory-results.mjs';
import {serviceDeskRoutes} from '../server/service-desk.mjs';
import {measuredEnvironment,timingHeader} from '../server/request-timing.mjs';
const input=process.argv[2];if(!input)throw Error('Pass a private SQL export');
const require=createRequire(import.meta.url),{Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
const dump=readFileSync(input),sqlite=new DatabaseSync(':memory:');sqlite.exec(dump.toString());
const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(t=>t.name);
const hash=b=>createHash('sha256').update(b).digest('hex');
const tableHash=t=>hash(JSON.stringify(sqlite.prepare('SELECT * FROM "'+t+'"').all()));
const prior=new Map(tables.map(t=>[t,tableHash(t)])),fk=sqlite.prepare('PRAGMA foreign_key_check').all();
sqlite.exec(readFileSync('migrations/0031_panel_read_revisions.sql','utf8'));
for(const t of tables)assert.equal(tableHash(t),prior.get(t),'existing data changed: '+t);
assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),fk);assert.equal(sqlite.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
async function oldModule(file){
 const source=execFileSync('git',['show','b573704:'+file],{encoding:'utf8'}).replace(/from (['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+q+pathToFileURL(path.resolve(path.dirname(file),p)).href+q);
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const oldResults=(await oldModule('server/inventory-results.mjs')).inventoryResults,oldFleet=(await oldModule('server/service-desk.mjs')).serviceDeskRoutes;
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:'export default {fetch(){return new Response("local only")}}',d1Databases:['DB']}));
try{
 const db=await mf.getD1Database('DB'),schema=sqlite.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 await db.batch(schema.filter(s=>s.type==='table').map(s=>db.prepare(s.sql)));
 const inserts=[db.prepare('PRAGMA defer_foreign_keys=ON')];
 for(const t of schema.filter(s=>s.type==='table'))for(const row of sqlite.prepare('SELECT * FROM "'+t.name+'"').all()){
  const cols=Object.keys(row);inserts.push(db.prepare(`INSERT INTO "${t.name}" (${cols.map(c=>'"'+c+'"').join(',')}) VALUES(${cols.map(()=>'?').join(',')})`).bind(...Object.values(row)));
 }
 await db.batch(inserts);for(const s of schema.filter(s=>s.type!=='table'))await db.prepare(s.sql).run();
 const user={role:'root',id:randomUUID()},helpers={json:(v,status=200)=>Response.json(v,{status}),fail:(error,status=400)=>Response.json({error},{status})};
 const metric=h=>Object.fromEntries([...h.matchAll(/(d1_rows_read|d1_rows_written|d1_calls);desc="(\d+)"/g)].map(m=>[m[1],+m[2]]));
 async function run(fn,p,etag){const request=new Request('https://local.invalid'+p,{headers:etag?{'If-None-Match':etag}:{}}),env=measuredEnvironment(request,{DB:db,APP_KIND:'panel'}),res=await fn(request,new URL(request.url),user,env,helpers),data=res.status===304?null:await res.json();assert.ok([200,304].includes(res.status));return {status:res.status,etag:res.headers.get('ETag'),data,...metric(timingHeader(env))};}
 const beforeResults=await run(oldResults,'/api/inventory/results'),beforeFleet=await run(oldFleet,'/api/operations/units');
 const coldResults=await run(inventoryResults,'/api/inventory/results'),warmResults=await run(inventoryResults,'/api/inventory/results',coldResults.etag);
 const coldFleet=await run(serviceDeskRoutes,'/api/operations/units'),warmFleet=await run(serviceDeskRoutes,'/api/operations/units');
 assert.deepEqual(coldResults.data,beforeResults.data);assert.equal(warmResults.status,304);assert.deepEqual(warmFleet.data.units,beforeFleet.data.units);assert.deepEqual(coldFleet.data.units,beforeFleet.data.units);
 const businessOnly=r=>{const {data,etag,...rest}=r;return rest;};
 const results={before:businessOnly(beforeResults),cold:businessOnly(coldResults),warm:businessOnly(warmResults)};
 const fleet={before:businessOnly(beforeFleet),cold:businessOnly(coldFleet),warm:businessOnly(warmFleet)};
 const otherPerMinute=41*4+65*4+113+7;
 const beforePerMinute=(beforeResults.d1_rows_read+2)*4+(beforeFleet.d1_rows_read+2)+otherPerMinute;
 const afterPerMinute=(warmResults.d1_rows_read+2)*4+(warmFleet.d1_rows_read+2)+otherPerMinute;
 const evidence={at:new Date().toISOString(),runtime:'LOCAL workerd with private production export; no production writes',backup:{sha256:hash(dump),bytes:dump.length,unchangedTables:tables.length,foreignKeyIssues:fk.length,integrity:'ok'},results,fleet,equivalent:true,projection:{authRowsPerRequest:2,otherPerMinuteFromReport:otherPerMinute,beforePerMinute,afterPerMinute,reductionPercent:100*(1-afterPerMinute/beforePerMinute),fiveTabsEightHours:afterPerMinute*5*480,notice:'Warm stable data. Excludes cron/agents/collector and cold starts/edits. Not a full-day measurement.'}};
 mkdirSync('docs/05-qualidade/evidencias/d1-read-cache-2026-11-12',{recursive:true});writeFileSync('docs/05-qualidade/evidencias/d1-read-cache-2026-11-12/local-costs.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}finally{sqlite.close();await mf.dispose();}
