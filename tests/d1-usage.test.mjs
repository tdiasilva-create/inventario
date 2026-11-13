import test from 'node:test';
import assert from 'node:assert/strict';
import {usagePeriod,usageLevel,usageQuery,parseUsage,usageView,refreshD1Usage,USAGE_KEY,USAGE_INTERVAL,d1UsageRoutes} from '../server/d1-usage.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const now=Date.parse('2026-11-13T12:00:00Z');
const sum=(rowsRead=3500000,rowsWritten=85000)=>({rowsRead,rowsWritten});
const result=(rowsRead,rowsWritten)=>({data:{viewer:{accounts:[{current:[{sum:sum(rowsRead,rowsWritten)}],recent:[{sum:sum(100000,2000)}],history:[{dimensions:{date:'2026-11-13'},sum:sum(rowsRead,rowsWritten)}]}]}}});
function kv(initial=null){let value=initial;return {gets:0,puts:0,async get(key){assert.equal(key,USAGE_KEY);this.gets++;return structuredClone(value);},async put(key,text,opts){assert.equal(opts.expirationTtl,604800);this.puts++;value=JSON.parse(text);},value:()=>value};}
const env=cache=>({USAGE_CACHE:cache,USAGE_ACCOUNT_ID:'TEST-ACCOUNT',CLOUDFLARE_ANALYTICS_TOKEN:'TEST-ONLY'});
test('D109: account-wide quota, precise 70/85/95 boundaries, reads and writes independently',()=>{
 assert.deepEqual([0,69.999,70,84.999,85,94.999,95,99.999,100,105].map(usageLevel),['normal','normal','warning','warning','high','high','critical','critical','limit','limit']);
 const view=usageView({snapshot:parseUsage(result(),now)},now);
 assert.equal(view.metrics.rowsRead.level,'warning');assert.equal(view.metrics.rowsWritten.level,'high');assert.equal(view.level,'high');assert.equal(view.percent,85);
 assert.equal(view.metrics.rowsRead.remaining,1500000);assert.equal(view.metrics.rowsWritten.remaining,15000);
 assert.equal(usageView({snapshot:parseUsage(result(5100000,0),now)},now).metrics.rowsRead.remaining,0);
 const q=usageQuery('only-this-account',now);assert.equal(q.variables.account,'only-this-account');assert.ok(!q.query.includes('databaseId'));assert.ok(q.query.includes('rowsRead rowsWritten'));
});
test('D109: reset midnight UTC = 21h Fortaleza; previous day never masquerades as current zero',()=>{
 const end=usagePeriod(now).end;assert.equal(new Date(end).toLocaleTimeString('pt-BR',{timeZone:'America/Fortaleza'}),'21:00:00');
 const view=usageView({snapshot:parseUsage(result(),now)},end);assert.equal(view.metrics,null);assert.equal(view.error,'NEW_PERIOD_PENDING');assert.equal(view.history.length,1);
 assert.equal(usagePeriod(end-1).date,'2026-11-13');assert.equal(usagePeriod(end).date,'2026-11-14');
});
test('D109: valid empty aggregation is zero; absent account, errors, malformed numbers or history are errors',()=>{
 const empty={data:{viewer:{accounts:[{current:[],recent:[],history:[]}]}}};assert.equal(parseUsage(empty,now).rowsRead,0);
 for(const payload of [{}, {data:{viewer:{accounts:[]}}},{...result(),errors:[{message:'fail'}]},result(-1,0),result('0',0),result(NaN,0)])assert.throws(()=>parseUsage(payload,now));
 const bad=result();bad.data.viewer.accounts[0].history.push(bad.data.viewer.accounts[0].history[0]);assert.throws(()=>parseUsage(bad,now));
});
test('D109: forecast requires 15min, stale estimates hidden, before-reset forecast uses recent rate',()=>{
 const view=usageView({snapshot:parseUsage(result(4500000,0),now)},now);assert.ok(view.metrics.rowsRead.estimatedLimitAt>now);
 const s=parseUsage(result(),now);s.recent.seconds=100;assert.equal(usageView({snapshot:s},now).metrics.rowsRead.estimatedLimitAt,null);
 assert.equal(usageView({snapshot:parseUsage(result(),now)},now+USAGE_INTERVAL*3).metrics.rowsRead.estimatedLimitAt,null);
});
test('D109: one shared KV update per five-minute slot; GET does not refresh analytics or query DB',async()=>{
 const cache=kv(),e=env(cache);let requests=0;e.DB={prepare(){throw Error('No DB allowed');}};
 const fetcher=async(url,init)=>{requests++;assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');assert.equal(init.headers.Authorization,'Bearer TEST-ONLY');return Response.json(result());};
 assert.deepEqual(await refreshD1Usage(e,now+60000,{fetcher}),{skipped:'schedule'});
 assert.deepEqual(await refreshD1Usage(e,now,{fetcher}),{ok:true});assert.deepEqual(await refreshD1Usage(e,now+1,{fetcher}),{skipped:'fresh'});
 const f=collectorFixture();try{for(let i=0;i<4;i++){const r=await d1UsageRoutes(new Request('https://test/api/root/d1-usage'),new URL('https://test/api/root/d1-usage'),f.root,e,f.helpers);assert.equal(r.status,200);}}finally{f.sqlite.close();}
 assert.equal(requests,1);assert.equal(cache.puts,1);
});
test('D109: failures preserve last real counts, classify errors without exposing credentials/provider body',async()=>{
 for(const [response,code] of [[()=>new Response('private body',{status:403}),'ANALYTICS_PERMISSION'],[()=>new Response('no',{status:429}),'ANALYTICS_UNAVAILABLE'],[()=>Response.json({errors:[{message:'secret'}]}),'INVALID_ANALYTICS'],[()=>{throw Error('timeout-secret');},'ANALYTICS_UNAVAILABLE']]){
  const cache=kv({snapshot:parseUsage(result(),now),attemptAt:now});await refreshD1Usage(env(cache),now+USAGE_INTERVAL,{fetcher:async()=>response()});
  const view=usageView(cache.value(),now+USAGE_INTERVAL);assert.equal(view.error,code);assert.equal(view.metrics.rowsRead.used,3500000);assert.equal(view.stale,true);assert.ok(!JSON.stringify(view).includes('secret'));
 }
 const cache=kv();await refreshD1Usage(env(cache),now,{fetcher:async()=>{throw Error();}});assert.equal(usageView(cache.value(),now).metrics,null);
});
test('D109: root session, forced password, revocation, collector and methods validated by actual Worker',async()=>{
 const f=collectorFixture(),cache=kv({snapshot:parseUsage(result(),Date.now())}),e={...env(cache),DB:f.db,AUTH_PEPPER:'TEST-ONLY'};
 const origin='https://test.invalid',path='/api/root/d1-usage';try{
  const root=await session(f,f.root);assert.equal((await humanFetch(worker,e,origin,root,path)).status,200);
  const reads=cache.gets;for(const role of ['admin','visualizador','operador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);assert.equal((await humanFetch(worker,e,origin,root,path)).status,403);}assert.equal(cache.gets,reads);
  f.sqlite.prepare("UPDATE users SET role='root',must_change=1 WHERE id=?").run(f.root.id);assert.equal((await humanFetch(worker,e,origin,root,path)).status,403);
  f.sqlite.prepare('UPDATE users SET must_change=0 WHERE id=?').run(f.root.id);
  assert.equal((await humanFetch(worker,{...e,APP_KIND:'collector'},origin,root,path)).status,404);
  assert.equal((await humanFetch(worker,e,origin,root,path,{})).status,405);
  f.sqlite.prepare('DELETE FROM sessions').run();assert.equal((await humanFetch(worker,e,origin,root,path)).status,401);
 }finally{f.sqlite.close();}
});
test('D109: configuration absence is explicit; collector and non-due cron never call provider',async()=>{
 const cache=kv();assert.equal((await refreshD1Usage({...env(cache),APP_KIND:'collector'},now)).skipped,'configuration');assert.equal(cache.gets,0);
 const f=collectorFixture();try{const r=await d1UsageRoutes(new Request('https://test/api/root/d1-usage'),new URL('https://test/api/root/d1-usage'),f.root,{},f.helpers);assert.equal((await r.json()).error,'NOT_CONFIGURED');}finally{f.sqlite.close();}
});
test('D109: scheduled analytics succeeds even when D1 monitoring rejects; original failure remains observable',async()=>{
 const fetchBefore=globalThis.fetch,cache=kv();globalThis.fetch=async()=>Response.json(result());
 try{await assert.rejects(worker.scheduled({cron:'* * * * *',scheduledTime:now},{...env(cache),DB:{prepare(){throw Error('D1_DAILY_QUOTA');}}}),/D1_DAILY_QUOTA/);assert.equal(cache.puts,1);assert.equal(cache.value().error,null);}finally{globalThis.fetch=fetchBefore;}
});
