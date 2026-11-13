// Synthetic data only, local workerd D1. Measures the same position cycle before
// and after D114, including authentication; never contacts production or OSRM.
import {createRequire} from 'node:module';import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';import {setup} from '../tests/helpers/dispatch-fixture.mjs';
import {random} from '../server/security.mjs';import worker from '../server/worker.mjs';
const require=createRequire(import.meta.url),{Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
const f=await setup(),mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:'export default {fetch(){return new Response("local")}}',d1Databases:['DB']}));
try{
 await f.enable();const id=await f.task();await f.assign(id);const key={id:crypto.randomUUID(),token:random()},position={latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()-30000};
 assert.equal((await f.call('/api/technician/accept',f.cmd({id,version:f.ver(id),position,tracking:key}),f.os)).status,200);
 const attendance=f.sqlite.prepare('SELECT id FROM dispatch_attendances WHERE ended_at IS NULL').get().id;
 f.sqlite.prepare('INSERT INTO dispatch_positions VALUES(?,?,?,?,?,?)').run(attendance,position.latitude,position.longitude,12,position.observedAt,position.observedAt);
 f.sqlite.prepare('UPDATE dispatch_tracking_positions SET received_at=?').run(position.observedAt);
 const db=await mf.getD1Database('DB'),schema=f.sqlite.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 const tables=schema.filter(s=>s.type==='table');await db.batch(tables.map(t=>db.prepare(t.sql)));
 const inserts=[db.prepare('PRAGMA defer_foreign_keys=ON')];
 for(const t of tables)for(const row of f.sqlite.prepare('SELECT * FROM "'+t.name+'"').all()){const cols=Object.keys(row);inserts.push(db.prepare(`INSERT INTO "${t.name}" (${cols.map(c=>'"'+c+'"')}) VALUES(${cols.map(()=>'?')})`).bind(...Object.values(row)));}
 await db.batch(inserts);for(const s of schema.filter(s=>s.type!=='table'))await db.prepare(s.sql).run();
 let counts;const record=r=>{counts.calls++;counts.rowsRead+=r.meta.rows_read;counts.rowsWritten+=r.meta.rows_written;return r;};
 const measured={prepare(sql){const wrap=s=>({bind:(...args)=>wrap(s.bind(...args)),first:async()=>record(await s.all()).results[0]||null,all:async()=>record(await s.all()),run:async()=>record(await s.run())});return wrap(db.prepare(sql));},batch:s=>Promise.all(s.map(q=>q.run()))};
 const env={DB:measured,AUTH_PEPPER:'TEST'};
 const request=(path,body,headers={})=>new Request('https://teste.invalid'+path,{method:body?'POST':'GET',headers:{Cookie:f.os.cookie,...(body?{Origin:'https://teste.invalid','Content-Type':'application/json','X-CSRF-Token':f.os.csrf}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 const out={runtime:'local workerd D1',synthetic:true,intervalSeconds:25};
 counts={calls:0,rowsRead:0,rowsWritten:0};
 let r=await worker.fetch(request('/api/technician/active'),env);assert.equal(r.status,200);
 r=await worker.fetch(request('/api/technician/position',{attendanceId:attendance,position:{...position,observedAt:Date.now()}}),env);assert.equal(r.status,200);
 out.before={requests:2,...counts};
 counts={calls:0,rowsRead:0,rowsWritten:0};
 r=await worker.fetch(request('/api/technician/tracking-heartbeat',{position:{...position,observedAt:Date.now()}},{Authorization:`SEMED-Tracking ${key.id}.${key.token}`}),env);assert.equal(r.status,200);out.after={requests:1,...counts};
 // The new native authorization plan must use indexed point lookups, not queue history.
 const {trackingGuard}=await import('../server/technician-tracking.mjs');out.authorizationPlan=(await db.prepare(`EXPLAIN QUERY PLAN SELECT t.id FROM dispatch_tracking t WHERE t.id=? AND t.token_hash=? AND ${trackingGuard}`).bind(key.id,'test').all()).results.map(r=>r.detail);
 out.projection8h5Technicians={cycles:5760,readsBefore:out.before.rowsRead*5760,readsAfter:out.after.rowsRead*5760,writesAfter:out.after.rowsWritten*5760,note:'Only native position cycles; excludes maps, routes, queues, agents, cron and all other traffic.'};
 assert.ok(out.after.rowsRead<=out.before.rowsRead,JSON.stringify(out));assert.ok(out.after.calls<out.before.calls);
 const dir='docs/05-qualidade/evidencias/localizacao-d114-2026-11-13';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/d1-local.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
}finally{f.sqlite.close();await mf.dispose();}
