import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {collectorFixture} from './helpers/collector-db.mjs';
import {hardwareChange} from './helpers/hardware-change.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
async function raw(env,auth,path){const response=await worker.fetch(new Request('https://teste.invalid'+path,{headers:{Cookie:auth.cookie}}),env);return {response,data:await response.clone().json().catch(()=>null)};}

test('D103: shared status matches legacy counts, hardware and presence with fewer SQL reads',async()=>{
 const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'};
 try{
  const seed=await hardwareChange(f,env),auth=await session(f,f.root),queries=[];
  const prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{queries.push(sql);return prepare(sql);};
  const call=p=>raw(env,auth,p);
  const ids=seed.items.slice(0,50).map(e=>e.id).join(',');
  const a=await call('/api/inventory/pending-summary'),b=await call('/api/inventory/monitoring?equipmentIds='+ids),before=queries.splice(0);
  const c=await call('/api/inventory/panel-status?equipmentIds='+ids),after=queries.splice(0);
  assert.equal(c.response.status,200);assert.equal(c.response.headers.get('cache-control'),'no-store');
  for(const k of ['collections','demands','hardware'])assert.deepEqual(c.data.pending[k],a.data[k]);
  assert.deepEqual(c.data.monitoring.hardware,b.data.hardware);assert.deepEqual(c.data.monitoring.statuses,b.data.statuses);
  assert.ok(after.length<before.length,{before:before.length,after:after.length});
  assert.equal(after.filter(q=>q.includes('FROM sessions s')).length,1);
  assert.ok(after.every(q=>/^\s*(SELECT|WITH)/i.test(q)),'no writes');
  assert.equal((await call('/api/inventory/panel-status?equipmentIds=wrong')).response.status,422);
  assert.equal((await call('/api/inventory/panel-status?equipmentIds='+Array(51).fill(seed.items[0].id).join(','))).response.status,422);
  console.log(JSON.stringify({sharedStatusSql:{before:before.length,after:after.length}}));
 }finally{f.sqlite.close();}
});
test('D103: authentication, roles, first access and immutable code do not expose API data',async()=>{
 const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST',ASSETS:{fetch:async r=>new Response('/* test code */',{headers:{'Content-Type':new URL(r.url).pathname.endsWith('.css')?'text/css':'text/javascript'}})}};
 try{
  const bundle='/bundles/account-entry-ABCDEFG1.js',root=await session(f,f.root),operator=await session(f,f.operator);
  const call=(auth,p,extra={})=>raw({...env,...extra},auth,p);
  const noAuth=await worker.fetch(new Request('https://teste.invalid/api/inventory/panel-status'),env);assert.equal(noAuth.status,401);
  assert.equal((await worker.fetch(new Request('https://teste.invalid'+bundle),env)).status,302);
  assert.equal((await call(operator,'/api/inventory/panel-status')).response.status,403);
  assert.equal((await call(root,'/api/inventory/panel-status',{APP_KIND:'collector'})).response.status,403);
  const code=await call(root,bundle);assert.equal(code.response.status,200);assert.match(code.response.headers.get('cache-control'),/private.*immutable/);
  assert.equal(code.response.headers.get('vary'),'Cookie');
  assert.equal((await call(root,'/api/inventory/panel-status')).response.headers.get('cache-control'),'no-store');
  f.sqlite.prepare('UPDATE users SET must_change=1 WHERE id=?').run(f.root.id);
  assert.equal((await call(root,bundle)).response.status,200);
  assert.equal((await call(root,'/api/inventory/panel-status')).response.status,403);
  assert.equal((await call(root,'/bundles/desktop-ABCDEFG1.js')).response.status,302);
  f.sqlite.prepare('UPDATE users SET active=0 WHERE id=?').run(f.root.id);
  assert.equal((await call(root,'/api/inventory/panel-status')).response.status,401);
 }finally{f.sqlite.close();}
});
test('D103: production HTML references a single bundled entry and versioned stylesheet',async()=>{
 const manifest=JSON.parse(await readFile('dist/painel-bundles.json','utf8'));
 for(const [page,entry] of Object.entries({'index.html':'desktop','operations.html':'operations','account.html':'account-entry','panel-search.html':'panel-search','pending-collections.html':'pending-collections','communication-log.html':'communication-log'})){
  const html=await readFile('dist/painel/'+page,'utf8');assert.equal((html.match(/<script type="module"/g)||[]).length,1);
  assert.ok(html.includes(manifest.entries[entry]));assert.ok(html.includes(manifest.cssPath));
  const code=await readFile('dist/painel'+manifest.entries[entry],'utf8');assert.ok(code.length>1000);
  assert.ok(!code.includes('sourceMappingURL'),'no published source maps');
 }
});
