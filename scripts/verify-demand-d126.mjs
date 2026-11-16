// Read-only private backup validation; mutations only in a separate synthetic local D1.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readPendingSummary,demandMapSummarySql} from '../server/pending-indicators.mjs';
import {measuredEnvironment,timingHeader} from '../server/request-timing.mjs';
import {setup} from '../tests/helpers/dispatch-fixture.mjs';
import {random} from '../server/security.mjs';
import worker from '../server/worker.mjs';

const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: PRIVATE_BACKUP.sql OUTPUT.json');
const bytes=readFileSync(input),sql=readFileSync('migrations/0037_demand_activity_archive.sql','utf8'),sqlite=new DatabaseSync(':memory:');sqlite.exec(bytes.toString());
const sha=v=>createHash('sha256').update(v).digest('hex');
const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t=>t.name);
const tableHash=t=>sha(JSON.stringify(sqlite.prepare('SELECT * FROM "'+t+'"').all()));
const before=new Map(tables.map(t=>[t,tableHash(t)]));
const require=createRequire(import.meta.url),{Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:'export default {fetch(){return new Response("local")}}',d1Databases:['DB','FIXTURE']}));
async function copy(source,db,dataTables=null){
 const schema=source.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 await db.batch(schema.filter(x=>x.type==='table').map(x=>db.prepare(x.sql)));
 const inserts=[db.prepare('PRAGMA defer_foreign_keys=ON')];
 for(const t of schema.filter(x=>x.type==='table'&&(!dataTables||dataTables.includes(x.name))))for(const row of source.prepare('SELECT * FROM "'+t.name+'"').all()){
  const cols=Object.keys(row);inserts.push(db.prepare('INSERT INTO "'+t.name+'" ('+cols.map(c=>'"'+c+'"').join(',')+') VALUES('+cols.map(()=>'?').join(',')+')').bind(...Object.values(row).map(x=>x instanceof Uint8Array?x.buffer.slice(x.byteOffset,x.byteOffset+x.byteLength):x)));
 }
 await db.batch(inserts);for(const x of schema.filter(x=>x.type!=='table'))await db.prepare(x.sql).run();
}
try{
 const db=await mf.getD1Database('DB');
 // Optional focused workload retains every row and index read by this query;
 // full-backup restore/hash validation below still checks ALL original tables.
 const focused=process.argv.includes('--focused');
 await copy(sqlite,db,focused?['users','service_requests','service_request_counts','panel_collection_counts','dispatch_assignments','dispatch_attendances','dispatch_technicians']:null);
 const previous=await db.prepare("SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id ORDER BY unit_id").all();
 sqlite.exec(sql);for(const t of tables)assert.equal(tableHash(t),before.get(t),'existing rows changed: '+t);
 assert.equal(sqlite.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
 await db.exec(sql.split('\n').filter(l=>!l.trimStart().startsWith('--')).join(' '));
 const measured=measuredEnvironment(new Request('https://local.invalid/api/test'),{DB:db});
 const current=await readPendingSummary(measured.DB,0);
 assert.deepEqual(current.demands.units.map(({accepted,...u})=>u),previous.results);
 const next=await db.prepare(demandMapSummarySql).all();
 const f=await setup();
 try{
  await f.enable();const first=await f.task(),second=await f.task();await f.assign(first);await f.assign(second);const key={id:crypto.randomUUID(),token:random()};
  assert.equal((await f.call('/api/technician/accept',f.cmd({id:first,version:1,tracking:key,position:{latitude:-2.53,longitude:-44.11,accuracy:10,observedAt:Date.now()}}),f.os)).status,200);
  const runtime=await mf.getD1Database('FIXTURE');await copy(f.sqlite,runtime);f.env.DB=runtime;
  const preview=await f.call('/api/operations/request-delete-preview?id='+first);assert.equal(preview.status,200);
  const a={id:first,operationId:crypto.randomUUID(),version:preview.data.request.version,revision:preview.data.revision,reason:'TESTE LOCAL',confirm:true};
  assert.equal((await f.call('/api/operations/request-delete',a)).status,200);assert.equal((await f.call('/api/operations/request-delete',a)).data.replayed,true);
  assert.equal((await runtime.prepare('SELECT COUNT(*) n FROM service_request_events WHERE request_id=?').bind(first).first()).n,3);
  const native=()=>worker.fetch(new Request('https://teste.invalid/api/technician/tracking-heartbeat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`SEMED-Tracking ${key.id}.${key.token}`},body:'{}'}),f.env);
  assert.equal((await native()).status,200);
  const last=await f.call('/api/operations/request-delete-preview?id='+second);assert.equal((await f.call('/api/operations/request-delete',{...a,id:second,operationId:crypto.randomUUID(),version:last.data.request.version,revision:last.data.revision})).status,200);
  assert.equal((await native()).status,410);assert.equal((await runtime.prepare('SELECT COUNT(*) n FROM dispatch_tracking_positions').first()).n,0);
 }finally{f.sqlite.close();}
 const result={at:new Date().toISOString(),runtime:'workerd local / D1',focusedReadWorkload:focused,backup:{bytes:bytes.length,sha256:sha(bytes),unchangedExistingTables:tables.length,integrity:'ok',foreignKeyErrors:0},demandMap:{beforeRowsRead:previous.meta.rows_read,afterRowsRead:next.meta.rows_read,beforeWrites:previous.meta.rows_written,afterWrites:next.meta.rows_written,totalsEquivalent:true},summaryTiming:timingHeader(measured),syntheticDeletion:{atomicHistory:true,idempotent:true,trackingPreservedWithRemainingQueue:true,trackingEndsWithEmptyQueue:true},productionWrites:false};
 writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{sqlite.close();await mf.dispose();}
