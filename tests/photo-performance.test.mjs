import test from 'node:test';
import assert from 'node:assert/strict';
import {photoFixture,png} from './helpers/photo-performance.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session} from './helpers/agent-client.mjs';
import {photoStore,accessToken} from '../server/photo-storage.mjs';
import {photoResponse,photoNotModified} from '../server/photo-response.mjs';
import worker from '../server/worker.mjs';

test('fotos: menos consultas, primeiro envio sem busca, reenvio perdido recupera arquivo e ETag evita Drive',async()=>{
 const f=await photoFixture();try{
  const firstId=crypto.randomUUID(),secondId=crypto.randomUUID();
  const first=await f.measure(()=>f.upload(firstId));assert.equal(first.response.status,201);assert.equal(first.integrationReads,1);assert.equal(first.drive,4);
  const second=await f.measure(()=>f.upload(secondId));assert.equal(second.response.status,201);assert.equal(second.integrationReads,1);assert.equal(second.drive,2,'pasta existente: reserva do ID e upload idempotente');assert.equal(second.sql,12);
  const repeated=await f.measure(()=>f.upload(secondId));assert.equal(repeated.response.status,200);assert.equal(repeated.drive,0);
  f.sqlite.prepare("UPDATE collection_photos SET status='pending',storage_ref=NULL WHERE id=?").run(secondId);
  const retry=await f.measure(()=>f.upload(secondId));assert.equal(retry.response.status,201);assert.equal((await retry.response.json()).reused,true);assert.equal(retry.drive,1,'retomada pesquisa e recupera sem novo upload');
  assert.equal([...f.google.files.values()].filter(p=>p.appProperties?.semedPhotoId===secondId).length,1);
  for(const gallery of [false,true]){
   const read=await f.measure(()=>f.read(firstId,null,gallery));assert.equal(read.response.status,200);assert.equal(read.sql,2);assert.equal(read.drive,1);assert.equal(read.integrationReads,1);assert.deepEqual(Buffer.from(await read.response.arrayBuffer()),png);
   const etag=read.response.headers.get('ETag');assert.match(etag,/^"[a-f0-9]{64}"$/);assert.equal(read.response.headers.get('Cache-Control'),'private, no-cache');
   const cached=await f.measure(()=>f.read(firstId,'"other", W/'+etag,gallery));assert.equal(cached.response.status,304);assert.equal(cached.drive,0);assert.equal(await cached.response.text(),'');assert.equal(cached.response.headers.get('Vary'),'Cookie');
   assert.equal((await f.read(firstId,'"different"',gallery)).status,200);
  }
 }finally{f.close();}
});

test('Worker: revalidação de fotos passa por sessão, perfil, estado, unidade e integração',async()=>{
 const f=await photoFixture();try{
  const id=crypto.randomUUID();assert.equal((await f.upload(id)).status,201);const etag=(await f.read(id)).headers.get('ETag');
  const root=await session(f,f.root),operator=await session(f,f.operator),viewer={...f.root,role:'visualizador',id:crypto.randomUUID(),username:'viewer'};
  f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(viewer.id,viewer.username,viewer.role,'TEST','TEST',Date.now());const view=await session(f,viewer);
  const routes=['/api/collector/photo?id='+id,'/api/inventory/photo?id='+id,'/api/inventory/in-progress-photo?id='+f.inspection.id+'&photoId='+id];
  const request=(path,cookie)=>new Request('https://painel.test'+path,{headers:{...(cookie?{Cookie:cookie}:{}),'If-None-Match':etag}});
  for(const path of routes){assert.equal((await worker.fetch(request(path),f.env)).status,401);assert.equal((await worker.fetch(request(path,root.cookie),f.env)).status,304);}
  assert.equal((await worker.fetch(request(routes[0],view.cookie),f.env)).status,403,'visualizador não recebe rascunho pela rota legada');
  assert.equal((await worker.fetch(request(routes[1],operator.cookie),f.env)).status,403);
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);
  for(const path of routes)assert.notEqual((await worker.fetch(request(path,root.cookie),f.env)).status,304);
  f.sqlite.prepare('UPDATE units SET active=1 WHERE id=?').run(f.ids.pending);
  f.sqlite.prepare("UPDATE collection_photos SET status='pending' WHERE id=?").run(id);
  for(const path of routes)assert.notEqual((await worker.fetch(request(path,root.cookie),f.env)).status,304);
  f.sqlite.prepare("UPDATE collection_photos SET status='ready' WHERE id=?").run(id);
  f.sqlite.prepare('UPDATE integration_tokens SET revoked_at=?').run(Date.now());
  for(const path of routes)assert.equal((await worker.fetch(request(path,root.cookie),f.env)).status,503);
  f.sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(f.root.id);
  for(const path of routes){const r=await worker.fetch(request(path,root.cookie),f.env);assert.equal(r.status,401);assert.equal(r.headers.get('Cache-Control'),'no-store');}
 }finally{f.close();}
});

test('token memo não atravessa banco, chave, revogação, reconexão ou expiração',async()=>{
 const f=await photoFixture();try{
  const t=await accessToken(f.env,f.db,{fetchImpl:f.google.fetch});assert.ok(t.token);
  await assert.rejects(accessToken({...f.env,GOOGLE_TOKEN_KEY:Buffer.alloc(32,9).toString('base64')},f.db,{fetchImpl:f.google.fetch}),/decifrar/);
  const other=collectorFixture();try{await assert.rejects(accessToken({...f.env,DB:other.db},other.db,{fetchImpl:f.google.fetch}),/não autorizado/);}finally{other.sqlite.close();}
  const row=f.sqlite.prepare('SELECT * FROM integration_tokens').get();f.sqlite.prepare('UPDATE integration_tokens SET refresh_token_enc=NULL').run();
  await assert.rejects(accessToken(f.env,f.db,{fetchImpl:f.google.fetch}),/não autorizado/);assert.equal(await photoStore(f.env).enabled(),false);
  f.sqlite.prepare('UPDATE integration_tokens SET refresh_token_enc=?,access_token_expires_at=0').run(row.refresh_token_enc);
  const before=f.google.calls.length,renewed=await accessToken(f.env,f.db,{fetchImpl:f.google.fetch});assert.notEqual(renewed.token,t.token);assert.equal(f.google.calls.length,before+1);
  assert.equal((await accessToken(f.env,f.db,{fetchImpl:f.google.fetch})).token,renewed.token);assert.equal(f.google.calls.length,before+1);
 }finally{f.close();}
});

test('cache: assets revalidam; HTML, API, erros e redirects não são armazenados',async()=>{
 const f=collectorFixture();try{
  const root=await session(f,f.root),env={DB:f.db,AUTH_PEPPER:'TEST',ASSETS:{fetch:async request=>{const url=new URL(request.url),status=url.searchParams.has('missing')?404:request.headers.has('If-None-Match')?304:200;return new Response(status===304?null:'fixture',{status,headers:{'Content-Type':url.pathname.endsWith('.html')?'text/html':url.pathname.endsWith('.css')?'text/css':'text/javascript','ETag':'"asset"'}});}}};
  for(const kind of ['painel','collector'])for(const path of ['/login.css','/tokens.css','/vendor/barlow/Barlow-400.woff2','/login.js','/assets/paisagem-coleta.jpg']){
   for(const conditional of [false,true]){const r=await worker.fetch(new Request('https://painel.test'+path,{headers:conditional?{'If-None-Match':'"asset"'}:{}}),{...env,APP_KIND:kind});assert.equal(r.status,conditional?304:200,path);assert.equal(r.headers.get('Cache-Control'),'public, no-cache');assert.equal(r.headers.get('ETag'),'"asset"');}
  }
  for(const [path,cookie]of [['/login',''],['/login.css?missing',''],['/api/auth/me',''],['/api/auth/me',root.cookie],['/configuracoes',root.cookie],['/desktop.js','']]){const r=await worker.fetch(new Request('https://painel.test'+path,{headers:cookie?{Cookie:cookie}:{}}),env);assert.equal(r.headers.get('Cache-Control'),'no-store',path);}
  const fallback=await worker.fetch(new Request('https://painel.test/login.css'),{...env,ASSETS:{fetch:async()=>new Response('<html>',{headers:{'Content-Type':'text/html'}})}});assert.equal(fallback.headers.get('Cache-Control'),'no-store');
 }finally{f.sqlite.close();}
});

test('fotos: hash ausente não gera ETag; comprimento é repassado e índices atendem listas',async()=>{
 const row={mime_type:'image/png',sha256:'a'.repeat(64)};
 assert.equal(photoResponse(row,{body:png,contentLength:png.length}).headers.get('Content-Length'),String(png.length));
 assert.equal(photoResponse({...row,sha256:'legacy'},{body:png}).headers.get('Cache-Control'),'private, no-store');
 assert.equal(photoNotModified(new Request('https://test',{headers:{'If-None-Match':'*'}}),{...row,sha256:'legacy'}),null);
 const f=collectorFixture();try{
  for(const [sql,index]of [["SELECT id FROM collection_photos WHERE inspection_id='x' ORDER BY created_at DESC,id DESC LIMIT 51",'collection_photos_inspection'],["SELECT id FROM collection_photos WHERE unit_id='x' AND status='ready' ORDER BY created_at DESC LIMIT 49",'collection_photos_unit_status']])assert.match(JSON.stringify(f.sqlite.prepare('EXPLAIN QUERY PLAN '+sql).all()),new RegExp(index));
 }finally{f.sqlite.close();}
});
