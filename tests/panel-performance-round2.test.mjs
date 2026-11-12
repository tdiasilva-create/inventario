import test from 'node:test';
import assert from 'node:assert/strict';
import {photoFixture,png} from './helpers/photo-performance.mjs';
import {session} from './helpers/agent-client.mjs';
import {measuredEnvironment,databaseIdentity,timingHeader,timed} from '../server/request-timing.mjs';
import worker from '../server/worker.mjs';

test('D104: three photo routes use one fresh domain batch; originals do not select thumbnail binary',async()=>{
 const f=await photoFixture();try{
  const id=crypto.randomUUID();assert.equal((await f.upload(id)).status,201);
  const root=await session(f,f.root),db=f.env.DB,queries=[];
  f.env.DB={prepare(sql){queries.push(sql);return db.prepare(sql);},batch:statements=>db.batch(statements)};
  const routes=['/api/collector/photo?id='+id,'/api/inventory/photo?id='+id,'/api/inventory/in-progress-photo?id='+f.inspection.id+'&photoId='+id];
  for(const path of routes){
   const read=etag=>worker.fetch(new Request('https://panel.test'+path,{headers:{Cookie:root.cookie,...(etag?{'If-None-Match':etag}:{})}}),f.env);
   queries.length=0;
   const result=await f.measure(()=>read());assert.equal(result.response.status,200);assert.equal(result.batches,1);assert.equal(result.sql,3);assert.equal(result.integrationReads,1);
   assert.deepEqual(Buffer.from(await result.response.arrayBuffer()),png);
   const photoSql=queries.find(s=>s.includes('FROM collection_photos p'));assert.ok(photoSql);assert.doesNotMatch(photoSql,/p\.\*|thumb_blob/);
   const timing=result.response.headers.get('Server-Timing');assert.match(timing,/d1_calls;desc="2"/);assert.match(timing,/drive_headers;dur=/);assert.match(timing,/auth;dur=/);assert.doesNotMatch(timing,/SELECT|TEST|token|google|@/i);
   const etag=result.response.headers.get('ETag'),cached=await f.measure(()=>read(etag));assert.equal(cached.response.status,304);assert.equal(cached.integrationReads,1);assert.equal(cached.drive,0);
   f.sqlite.prepare('UPDATE integration_tokens SET revoked_at=?').run(Date.now());assert.equal((await read(etag)).status,503);
   f.sqlite.prepare('UPDATE integration_tokens SET revoked_at=NULL').run();
   assert.equal((await read(etag)).status,304);
  }
  f.sqlite.prepare('DELETE FROM integration_tokens').run();
  for(const path of routes){const r=await worker.fetch(new Request('https://panel.test'+path,{headers:{Cookie:root.cookie}}),f.env);assert.equal(r.status,503);assert.match(r.headers.get('Server-Timing'),/d1_calls;desc="2"/);}
 }finally{f.close();}
});

test('D104: timing keeps native statement binding/batches, per-request counters and original DB identity',async()=>{
 const statements=new WeakSet(),db={prepare(sql){const statement={bind(...args){return db.prepare(args.join(','));},first(){assert.ok(statements.has(this));return Promise.resolve(sql);},run(){assert.ok(statements.has(this));return Promise.resolve({results:[sql]});}};statements.add(statement);return statement;},batch(batch){assert.ok(batch.every(s=>statements.has(s)));return Promise.all(batch.map(s=>s.run()));}};
 const request=new Request('https://panel.test/api/inventory/photo'),base={DB:db};
 const a=measuredEnvironment(request,base),b=measuredEnvironment(request,base);
 assert.equal(databaseIdentity(a.DB),db);assert.equal(base.DB,db);assert.notEqual(a.DB,b.DB);
 assert.equal(await a.DB.prepare('ignored').bind('bound').first(),'bound');
 assert.deepEqual(await a.DB.batch([a.DB.prepare('one'),a.DB.prepare('two')]),[{results:['one']},{results:['two']}]);
 assert.match(timingHeader(a),/d1_calls;desc="2"/);assert.match(timingHeader(b),/d1_calls;desc="0"/);
 await assert.rejects(timed(a,'auth',()=>Promise.reject(Error('private details'))));assert.doesNotMatch(timingHeader(a),/private/);
 for(const [req,env] of [[new Request('https://panel.test/api/x',{method:'POST'}),base],[new Request('https://panel.test/bundles/a.js'),base],[request,{...base,APP_KIND:'collector'}]])assert.equal(measuredEnvironment(req,env),env);
});
