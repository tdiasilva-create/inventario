import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {photoFixture} from './helpers/photo-performance.mjs';
import {session} from './helpers/agent-client.mjs';
import {thumbnailRoutes,jpegDimensions} from '../server/photo-thumbnails.mjs';
import {collectorRoutes} from '../server/collector.mjs';
import {photoGalleryRead} from '../server/photo-gallery.mjs';
import {inProgressPhotoRead} from '../server/in-progress-photos.mjs';
import {describePhotos} from '../server/photo-labels.mjs';
import worker from '../server/worker.mjs';
const jpeg=readFileSync('tests/fixtures/thumbnail-test.jpg');
async function fixture(){const f=await photoFixture(),id=crypto.randomUUID(),response=await f.upload(id),original=await response.json();return {...f,id,original};}
function thumbRequest(f,{id=f.id,inspection=f.inspection.id,sha=f.original.sha256,bytes=jpeg,root=false,headers={}}={}){return new Request('https://painel.test'+(root?'/api/root/photo-thumbnails':'/api/collector/photo-thumb'),{method:'POST',headers:{'Content-Type':'image/jpeg',Origin:'https://painel.test','X-Photo-Id':id,'X-Inspection-Id':inspection,'X-Source-SHA256':sha,...headers},body:bytes});}
const put=(f,options={},user=f.operator)=>{const request=thumbRequest(f,options);return thumbnailRoutes(request,new URL(request.url),user,f.env,f.helpers);};
test('miniaturas: 320px, 64KB, somente ready e idempotência; original/histórico/revisão preservados',async()=>{
 const f=await fixture();try{
  assert.deepEqual(jpegDimensions(jpeg),{width:320,height:240});
  const before=f.sqlite.prepare('SELECT * FROM inspections WHERE id=?').get(f.inspection.id),history=f.sqlite.prepare('SELECT count(*) n FROM collection_history').get().n;
  assert.equal((await put(f,{bytes:Buffer.alloc(65537)})).status,413);
  assert.equal((await put(f,{bytes:Buffer.alloc(50)})).status,400);
  assert.equal((await put(f,{headers:{'Content-Type':'image/png'}})).status,415);
  assert.equal((await put(f,{sha:'f'.repeat(64)})).status,409);
  assert.equal((await put(f,{inspection:crypto.randomUUID()})).status,404);
  f.sqlite.prepare("UPDATE collection_photos SET status='pending' WHERE id=?").run(f.id);assert.equal((await put(f)).status,404);
  f.sqlite.prepare("UPDATE collection_photos SET status='ready' WHERE id=?").run(f.id);
  const accepted=await f.measure(()=>put(f));assert.equal(accepted.response.status,201);assert.equal(accepted.drive,0);
  const row=f.sqlite.prepare('SELECT * FROM collection_photos WHERE id=?').get(f.id);assert.equal(row.sha256,f.original.sha256);assert.equal(row.thumb_source_sha256,row.sha256);assert.equal(row.thumb_mime,'image/jpeg');assert.equal(row.thumb_width,320);assert.deepEqual(Buffer.from(row.thumb_blob),jpeg);assert.equal(row.thumb_created_by,f.operator.id);
  assert.equal((await put(f)).status,200);assert.deepEqual(f.sqlite.prepare('SELECT * FROM inspections WHERE id=?').get(f.inspection.id),before);assert.equal(f.sqlite.prepare('SELECT count(*) n FROM collection_history').get().n,history);
  const enlarged=Buffer.from(jpeg);for(let p=2;p<enlarged.length-4;p++){if(enlarged[p]===255&&[192,193,194].includes(enlarged[p+1])){enlarged[p+7]=2;enlarged[p+8]=128;break;}}assert.equal(jpegDimensions(enlarged),null);
 }finally{f.close();}
});
test('três rotas: miniatura usa duas consultas de domínio, nenhum Drive e ETag próprio; antiga cai no original',async()=>{
 const f=await fixture();try{
  const original=await f.read(f.id),originalEtag=original.headers.get('ETag');
  const variants=[['/api/collector/photo?id='+f.id,collectorRoutes],['/api/inventory/photo?id='+f.id,photoGalleryRead],['/api/inventory/in-progress-photo?id='+f.inspection.id+'&photoId='+f.id,inProgressPhotoRead]];
  for(const [path,route]of variants){const url=new URL('https://painel.test'+path+'&size=thumb'),read=etag=>route(new Request(url,{headers:etag?{'If-None-Match':etag}:{}}),url,f.root,f.env,f.helpers);const fallback=await f.measure(()=>read());assert.equal(fallback.response.status,200);assert.equal(fallback.drive,1);assert.equal(fallback.response.headers.get('ETag'),originalEtag);}
  assert.equal((await put(f)).status,201);
  for(const [path,route]of variants){const url=new URL('https://painel.test'+path+'&size=thumb'),read=etag=>route(new Request(url,{headers:etag?{'If-None-Match':etag}:{}}),url,f.root,f.env,f.helpers);const measured=await f.measure(()=>read());assert.equal(measured.response.status,200);assert.equal(measured.sql,2);assert.equal(measured.drive,0);assert.deepEqual(Buffer.from(await measured.response.arrayBuffer()),jpeg);assert.equal(measured.response.headers.get('Cache-Control'),'private, no-cache');assert.notEqual(measured.response.headers.get('ETag'),originalEtag);const cached=await f.measure(()=>read(measured.response.headers.get('ETag')));assert.equal(cached.response.status,304);assert.equal(cached.drive,0);assert.equal((await read(originalEtag)).status,200);}
 }finally{f.close();}
});
test('Worker: CSRF, perfis, autoria, estado, provedor e sessão também protegem miniaturas em cache',async()=>{
 const f=await fixture();try{
  const root=await session(f,f.root),operator=await session(f,f.operator);const call=(s,opts={})=>worker.fetch(thumbRequest(f,{...opts,headers:{...(s?{Cookie:s.cookie,'X-CSRF-Token':s.csrf}:{}),...opts.headers}}),f.env);
  assert.equal((await call(null)).status,401);assert.equal((await call(operator,{headers:{'X-CSRF-Token':'wrong'}})).status,403);
  assert.equal((await call(operator)).status,201);
  const url='https://painel.test/api/inventory/photo?id='+f.id+'&size=thumb',read=()=>worker.fetch(new Request(url,{headers:{Cookie:root.cookie,'If-None-Match':'*'}}),f.env);
  assert.equal((await read()).status,304);assert.equal((await worker.fetch(new Request(url,{headers:{Cookie:operator.cookie}}),f.env)).status,403);
  f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.inspection.id);assert.equal((await call(operator)).status,403);assert.equal((await call(root,{root:true})).status,200);
  const other={...f.operator,id:f.root.id};assert.equal((await put(f,{},other)).status,403);
  f.sqlite.prepare("UPDATE collection_photos SET status='pending' WHERE id=?").run(f.id);assert.notEqual((await read()).status,304);
  f.sqlite.prepare("UPDATE collection_photos SET status='ready',storage_provider='r2' WHERE id=?").run(f.id);assert.equal((await read()).status,503);
  f.sqlite.prepare("UPDATE collection_photos SET storage_provider='google-drive' WHERE id=?").run(f.id);
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);assert.equal((await read()).status,404);
  f.sqlite.prepare('UPDATE units SET active=1 WHERE id=?').run(f.ids.pending);f.sqlite.prepare('UPDATE integration_tokens SET revoked_at=?').run(Date.now());assert.equal((await read()).status,503);
  f.sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(f.root.id);assert.equal((await read()).status,401);
 }finally{f.close();}
});
test('root: paginação limitada, gravação para visitas concluídas; BLOB nunca entra no JSON de manutenção',async()=>{
 const f=await fixture();try{
  const insert=f.sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status,storage_provider) SELECT ?,unit_id,inspection_id,target_kind,target_id,?,mime_type,size,sha256,created_by,created_at+?,status,storage_provider FROM collection_photos WHERE id=?");for(let n=0;n<24;n++){const id=crypto.randomUUID();insert.run(id,'TEST-'+id,n+1,f.id);}
  const list=(cursor='',user=f.root)=>{const url=new URL('https://painel.test/api/root/photo-thumbnails?cursor='+encodeURIComponent(cursor));return thumbnailRoutes(new Request(url),url,user,f.env,f.helpers);};
  assert.equal((await list('',f.operator)).status,403);const first=await(await list()).json();assert.equal(first.items.length,20);assert.ok(first.nextCursor);assert.equal(first.items[0].thumb_blob,undefined);
  const second=await(await list(first.nextCursor)).json();assert.equal(second.items.length,5);assert.equal(second.nextCursor,null);assert.equal(new Set([...first.items,...second.items].map(p=>p.id)).size,25);
  f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.inspection.id);assert.equal((await put(f,{root:true},f.root)).status,201);assert.notEqual((await(await list()).json()).items[0].id,f.id);
  const before=f.sqlite.prepare('SELECT revision,state FROM inspections WHERE id=?').get(f.inspection.id);assert.equal(before.state,'completed');assert.equal(f.sqlite.prepare('SELECT thumb_created_by FROM collection_photos WHERE id=?').get(f.id).thumb_created_by,f.root.id);
 }finally{f.close();}
});
test('legendas: equipamento publicado não recebe localização nem marca do rascunho; ocorrência tem contexto/data/autor',async()=>{
 const f=await fixture();try{
  const env=crypto.randomUUID(),equipment=crypto.randomUUID(),published={category:'computer',environment:env,environmentName:'Laboratório publicado',position_label:'PC 05'},draft={...published,environmentName:'RASCUNHO NÃO PUBLICADO',position_label:'PC 99'};
  f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(env,f.ids.pending,'RASCUNHO NÃO PUBLICADO','Sala',Date.now(),f.operator.id);
  f.sqlite.prepare('INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,published_json,created_by,created_at,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(equipment,f.ids.pending,f.inspection.id,'computer',env,'','','',JSON.stringify(draft),JSON.stringify(published),f.operator.id,Date.now(),f.operator.id,Date.now());
  f.sqlite.prepare("UPDATE collection_photos SET target_kind='equipment',target_id=? WHERE id=?").run(equipment,f.id);
  let described=await describePhotos(f.db,[{id:f.id}]);assert.match(described[0].label,/PC 99/);
  f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.inspection.id);described=await describePhotos(f.db,[{id:f.id}]);assert.equal(described[0].label,'Computador · Laboratório publicado · PC 05');assert.doesNotMatch(JSON.stringify(described),/RASCUNHO|PC 99|equipment_json/);assert.equal(described[0].created_by_name,f.operator.displayName);assert.ok(described[0].created_at);
 }finally{f.close();}
});
