import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../server/worker.mjs';
import {photoFixture} from './helpers/photo-performance.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {readCollectorJson} from '../web/collector-request.js';
import {createPhotoPreviews} from '../web/collector-photo-previews.js';
import {isCollectorBundle} from '../shared/mobile-assets.mjs';

test('D120: combined review equals the legacy review, preserves history and revalidates permissions',async()=>{
 const f=await photoFixture();try{
  const origin='https://painel.test',s=await session(f,f.operator),env={...f.env,APP_KIND:'panel'};
  const call=(path,data)=>humanFetch(worker,env,origin,s,path,data);
  // Historical facade from the previous completed visit must keep its original identity.
  const uploaded=await f.upload();assert.equal(uploaded.status,201);const photo=await uploaded.json();
  f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.inspection.id);
  const started=await call('/api/collector/v3-start',{unitId:f.ids.pending,preservePrevious:true}),id=started.data.inspection.id;
  const room=await call('/api/collector/environment-save',{inspectionId:id,name:'Sala isolada',type:''});assert.equal(room.status,200);
  const equipment=crypto.randomUUID();
  const saved=await call('/api/collector/equipment-save',{inspectionId:id,id:equipment,version:0,environmentId:room.data.environment.id,data:{category:'computer',mode:'Individual',quantity:1,assetStatus:'Sem patrimônio',operation:'Funcionando',registration:'Agente',environment:room.data.environment.id,position_label:'Mesa teste',draft:true}});
  assert.equal(saved.status,201,JSON.stringify(saved.data));
  const before=f.sqlite.prepare('SELECT total_changes() n').get().n;
  const old=await call('/api/collector/review?id='+id),snapshot=await call('/api/collector/inspection?id='+id+'&review=1');
  assert.equal(snapshot.status,200);assert.deepEqual(snapshot.data.review,old.data);
  assert.ok(snapshot.data.review.pending.some(p=>p.id===equipment&&p.code==='VINCULO_AGENTE_PENDENTE'));
  assert.equal(snapshot.data.photos.find(p=>p.id===photo.id)?.current,false);
  assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,before,'GET never changes history or sections');
  f.sqlite.prepare("UPDATE inspection_sections SET state='Concluído',version=version+1 WHERE inspection_id=? AND section='A'").run(id);
  const fresh=await call('/api/collector/inspection?id='+id+'&review=1');assert.equal(fresh.data.sections.A.state,'Concluído');assert.ok(!fresh.data.review.pending.some(p=>p.section==='A'&&p.code==='ASSUNTO_NAO_CONCLUIDO'));
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);assert.equal((await call('/api/collector/inspection?id='+id+'&review=1')).status,403);
  f.sqlite.prepare('UPDATE units SET active=1 WHERE id=?').run(f.ids.pending);
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);assert.equal((await call('/api/collector/inspection?id='+id+'&review=1')).status,403);
  f.sqlite.prepare('DELETE FROM sessions').run();assert.equal((await call('/api/collector/inspection?id='+id+'&review=1')).status,401);
 }finally{f.close();}
});

test('D120: request deadline covers the response body, aborts and never retries a write',async()=>{
 let calls=0,signal;
 await assert.rejects(readCollectorJson('/test',{method:'POST',body:'draft'},{timeoutMs:15,fetchImpl:async(_,o)=>{calls++;signal=o.signal;return {status:200,json:()=>new Promise(()=>{})};}}),e=>e.unknown===true&&/demorou/.test(e.message));
 assert.equal(calls,1);assert.equal(signal.aborted,true);
 await assert.rejects(readCollectorJson('/test',{}, {fetchImpl:async()=>({status:200,json:async()=>{throw Error('bad JSON');}})}),e=>e.unknown===true);
 const result=await readCollectorJson('/test',{}, {fetchImpl:async()=>({status:401,json:async()=>({error:'expired'})})});assert.equal(result.response.status,401);
});

test('D120: ready photo previews are bounded, replaceable and revoked on removal',()=>{
 let next=0;const revoked=[],evicted=[];const cache=createPhotoPreviews({limit:2,urls:{createObjectURL:()=>`blob:${++next}`,revokeObjectURL:u=>revoked.push(u)},onEvict:id=>evicted.push(id)});
 cache.set('a',{});cache.set('b',{});cache.set('c',{});assert.equal(cache.size,2);assert.equal(cache.get('a'),undefined);assert.deepEqual(evicted,['a']);
 cache.set('b',{});assert.equal(cache.get('b'),'blob:4');cache.retain(new Set(['b']));assert.equal(cache.size,1);cache.clear();assert.equal(cache.size,0);assert.equal(new Set(revoked).size,4);
});

test('D120: immutable collection bundles still require a fresh authorized session on both Workers',async()=>{
 const f=await photoFixture();try{
  const s=await session(f,f.operator),path='/collector-bundles/collector-v3-ABCD1234.js';
  assert.equal(isCollectorBundle(path),true);assert.equal(isCollectorBundle('/collector-bundles/../secret.js'),false);
  for(const APP_KIND of ['panel','collector']){
   const env={...f.env,APP_KIND,ASSETS:{fetch:async()=>new Response('export {};',{headers:{'Content-Type':'text/javascript'}})}};
   const get=()=>worker.fetch(new Request('https://painel.test'+path,{headers:{Cookie:s.cookie}}),env);
   let r=await get();assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'private, max-age=31536000, immutable');assert.equal(r.headers.get('Vary'),'Cookie');
   f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);r=await get();assert.notEqual(r.status,200,'viewer cannot receive collection JS');
   f.sqlite.prepare("UPDATE users SET role='operador' WHERE id=?").run(f.operator.id);
  }
  f.sqlite.prepare('DELETE FROM sessions').run();const env={...f.env,APP_KIND:'panel'};assert.notEqual((await worker.fetch(new Request('https://painel.test'+path,{headers:{Cookie:s.cookie}}),env)).status,200);
 }finally{f.close();}
});

test('D120: deployed collection HTML has one JS entry, no bundled HEIC and no changes to native tracking',()=>{
 for(const target of ['painel','coletor'])for(const entry of ['collector','collector-v3']){
  const html=readFileSync(`dist/${target}/${entry}.html`,'utf8');const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)];assert.equal(scripts.length,1);assert.ok(isCollectorBundle(scripts[0][1]));
  const js=readFileSync(`dist/${target}${scripts[0][1]}`,'utf8');assert.ok(js.length<130000);if(entry==='collector-v3')assert.match(js,/\/vendor\/heic-to\/heic-to.min.js/);
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 }
});
