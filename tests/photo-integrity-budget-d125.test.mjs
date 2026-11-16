import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import jpeg from 'jpeg-js';
import {validThumbnail,thumbnailFrame} from '../server/jpeg-thumbnail.mjs';
import {thumbnailRoutes} from '../server/photo-thumbnails.mjs';
import {photoGalleryRead} from '../server/photo-gallery.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {photoFixture} from './helpers/photo-performance.mjs';

const good=readFileSync('tests/fixtures/thumbnail-test.jpg');
function brokenScan(bytes){const b=Buffer.from(bytes);let p=2;while(p<b.length){const m=b[p+1],n=b.readUInt16BE(p+2);if(m===0xda)return Buffer.concat([b.subarray(0,p+2+n),Buffer.from([0xff,0xd9])]);p+=2+n;}throw Error('no scan');}
test('D125: JPEG decodificável; cabeçalho forjado, scan vazio/truncado, quadros duplicados e excesso são recusados',async()=>{
 assert.deepEqual(await validThumbnail(good),{width:320,height:240});
 const empty=brokenScan(good);assert.ok(thumbnailFrame(empty));assert.equal(await validThumbnail(empty),null);
 const forged=Buffer.from([255,216,255,192,0,17,8,0,240,1,64,3,1,17,0,2,17,0,3,17,0,255,218,0,12,3,1,0,2,17,3,17,0,63,0,0,255,217]);
 assert.ok(thumbnailFrame(forged));assert.equal(await validThumbnail(forged),null);
 for(const b of [Buffer.alloc(65537),good.subarray(0,good.length-20),Buffer.concat([good,good]),Buffer.concat([good.subarray(0,-30),Buffer.from([255,217])])])assert.equal(await validThumbnail(b),null);
 const excessive=Buffer.from(good);const sof=excessive.indexOf(Buffer.from([255,192]));assert.ok(sof>=0);excessive.writeUInt16BE(32000,sof+5);assert.equal(await validThumbnail(excessive),null);
 for(const size of [1,8,319,320]){const data=Buffer.alloc(size*size*4,170);const encoded=jpeg.encode({width:size,height:size,data},70).data;assert.deepEqual(await validThumbnail(encoded),{width:size,height:size});}
});

test('D125: rejeição de miniatura não altera original, derivada válida, visita ou histórico; root repara com JPEG válido',async()=>{
 const f=await photoFixture();try{
  const id=crypto.randomUUID(),original=await(await f.upload(id)).json();
  const put=async(bytes,force=false)=>{const url=new URL('https://test/api/root/photo-thumbnails'+(force?'?force=1':''));return thumbnailRoutes(new Request(url,{method:'POST',headers:{'Content-Type':'image/jpeg','X-Photo-Id':id,'X-Inspection-Id':f.inspection.id,'X-Source-SHA256':original.sha256},body:bytes}),url,f.root,f.env,f.helpers);};
  assert.equal((await put(good)).status,201);
  const before=f.sqlite.prepare('SELECT * FROM collection_photos WHERE id=?').get(id),visit=f.sqlite.prepare('SELECT * FROM inspections WHERE id=?').get(f.inspection.id),history=f.sqlite.prepare('SELECT COUNT(*) n FROM collection_history').get().n;
  assert.equal((await put(brokenScan(good),true)).status,400);
  assert.deepEqual(f.sqlite.prepare('SELECT * FROM collection_photos WHERE id=?').get(id),before);
  assert.equal((await put(good,true)).status,201);
  assert.equal(f.sqlite.prepare('SELECT sha256 FROM collection_photos WHERE id=?').get(id).sha256,before.sha256);
  assert.deepEqual(f.sqlite.prepare('SELECT * FROM inspections WHERE id=?').get(f.inspection.id),visit);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM collection_history').get().n,history);
 }finally{f.close();}
});

function fixture(){
 const f=collectorFixture(),visit=crypto.randomUUID();
 f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,state) VALUES(?,?,?,?,?,?)').run(visit,f.ids.pending,f.operator.id,1,1,'open');
 const add=(kind='facade',target=f.ids.pending,status='ready')=>{const id=crypto.randomUUID();f.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,f.ids.pending,visit,kind,target,id,'image/jpeg',good.length,'a'.repeat(64),f.operator.id,100,status);return id;};
 const photos=Array.from({length:70},()=>add()),statements=[],original=f.db;
 const wrap=(sql,p=[])=>({bind:(...args)=>wrap(sql,args),...Object.fromEntries(['run','first','all'].map(method=>[method,async()=>{statements.push({sql,params:p});return original.prepare(sql).bind(...p)[method]();}]))});
 const db={prepare:wrap,batch:async s=>original.batch(s)},env={DB:db};
 const call=async(params='',role='root')=>{const url=new URL('https://test/api/inventory/photos'+(params?'?'+params:''));return photoGalleryRead(new Request(url),url,{...f.root,role},env,f.helpers);};
 const canonical=()=>f.sqlite.prepare(`SELECT COUNT(*) n FROM collection_photos p JOIN inspections i ON i.id=p.inspection_id AND i.unit_id=p.unit_id JOIN units u ON u.id=p.unit_id WHERE p.status='ready' AND u.active=1 AND u.unit_type<>'Escola conveniada' AND i.state IN ('open','paused','completed') AND (i.state<>'completed' OR p.target_kind<>'equipment' OR EXISTS(SELECT 1 FROM inventory_equipment_all e WHERE e.id=p.target_id AND e.unit_id=p.unit_id AND e.published_json IS NOT NULL))`).get().n;
 return {...f,db,env,visit,add,photos,statements,call,canonical};
}
test('D125: páginas aquecidas não recontam fotos; mesmos IDs/totais, planos sem ordenação temporária',async()=>{
 const f=fixture();try{
  const first=await(await f.call()).json();assert.equal(first.partial,70);assert.equal(first.items.length,48);
  const coldCounts=f.statements.filter(s=>s.sql.includes('GROUP BY i.state')).length;assert.equal(coldCounts,1);
  const second=await(await f.call('cursor='+encodeURIComponent(first.nextCursor))).json();assert.equal(second.partial,70);assert.equal(second.items.length,22);
  assert.equal(new Set([...first.items,...second.items].map(x=>x.id)).size,70);
  assert.equal(f.statements.filter(s=>s.sql.includes('GROUP BY i.state')).length,coldCounts);
  await f.call('unitId='+f.ids.pending);
  for(const {sql,params}of f.statements.filter(s=>s.sql.includes('LIMIT 49'))){const plan=JSON.stringify(f.sqlite.prepare('EXPLAIN QUERY PLAN '+sql).all(...params));assert.match(plan,/collection_photos_ready_(unit_)?date/);assert.doesNotMatch(plan,/TEMP B-TREE/);}
  f.statements.length=0;assert.equal((await f.call('','operador')).status,403);assert.equal(f.statements.length,0);
 }finally{f.sqlite.close();}
});
test('D125: contagens invalidam com status, unidade, visita e publicação/remoção de equipamento',async()=>{
 const f=fixture();try{
  const verify=async()=>{const p=await(await f.call()).json();assert.equal(p.published+p.partial+p.paused,f.canonical());return p;};
  await verify();f.add();assert.equal((await verify()).partial,71);
  f.sqlite.prepare("UPDATE collection_photos SET status='pending' WHERE id=?").run(f.photos[0]);assert.equal((await verify()).partial,70);
  f.sqlite.prepare("UPDATE units SET active=0 WHERE id=?").run(f.ids.pending);assert.equal((await verify()).partial,0);
  f.sqlite.prepare("UPDATE units SET active=1,unit_type='Escola conveniada' WHERE id=?").run(f.ids.pending);assert.equal((await verify()).partial,0);
  f.sqlite.prepare("UPDATE units SET unit_type='Escola municipal' WHERE id=?").run(f.ids.pending);assert.equal((await verify()).partial,70);
  f.sqlite.prepare("UPDATE inspections SET state='paused' WHERE id=?").run(f.visit);assert.equal((await verify()).paused,70);
  const eq=crypto.randomUUID();f.add('equipment',eq);await verify();
  f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.visit);assert.equal((await verify()).published,70,'orphan excluded');
  const environment=crypto.randomUUID();f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_by,created_at) VALUES(?,?,?,?,?,?)').run(environment,f.ids.pending,'TESTE ISOLADO','Sala',f.operator.id,1);
  for(const table of ['equipments','miscellaneous_equipments']){
   f.sqlite.prepare(`INSERT INTO ${table}(id,unit_id,inspection_id,environment_id,category,asset,serial,search_text,data_json,published_json,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(eq,f.ids.pending,f.visit,environment,'desktop','','','','{"category":"desktop"}','{"category":"desktop"}',f.operator.id,f.operator.id,1,1);
   assert.equal((await verify()).published,71);
   f.sqlite.prepare(`UPDATE ${table} SET published_json=NULL WHERE id=?`).run(eq);assert.equal((await verify()).published,70);
   f.sqlite.prepare(`UPDATE ${table} SET published_json='{"category":"desktop"}' WHERE id=?`).run(eq);assert.equal((await verify()).published,71);
   f.sqlite.prepare(`DELETE FROM ${table} WHERE id=?`).run(eq);assert.equal((await verify()).published,70);
  }
  const before=f.sqlite.prepare('SELECT revision FROM photo_gallery_revision').get().revision;
  f.sqlite.prepare("UPDATE collection_photos SET thumb_blob=?,thumb_source_sha256=sha256 WHERE id=?").run(good,f.photos[1]);
  assert.equal(f.sqlite.prepare('SELECT revision FROM photo_gallery_revision').get().revision,before,'thumbnail does not invalidate counts');
 }finally{f.sqlite.close();}
});
test('D125: revisão alterada entre leituras devolve página e contagens da mesma transação',async()=>{
 const f=fixture();try{
  await f.call();f.add();const batch=f.db.batch;let once=true;
  f.db.batch=async statements=>{const result=await batch(statements);if(once){once=false;f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);}return result;};
  const p=await(await f.call()).json();assert.equal(p.partial,0);assert.equal(p.items.length,0);
 }finally{f.sqlite.close();}
});
test('D125: manutenção encontra hash nulo/divergente e usa índice inclusive depois do cursor',async()=>{
 const f=fixture();try{
  for(const id of f.photos.slice(0,45))f.sqlite.prepare('UPDATE collection_photos SET thumb_blob=?,thumb_source_sha256=sha256 WHERE id=?').run(good,id);
  f.sqlite.prepare('UPDATE collection_photos SET thumb_source_sha256=NULL WHERE id=?').run(f.photos[0]);
  f.sqlite.prepare("UPDATE collection_photos SET thumb_source_sha256='wrong' WHERE id=?").run(f.photos[1]);
  const seen=[];let cursor='';do{
   const url=new URL('https://test/api/root/photo-thumbnails?cursor='+encodeURIComponent(cursor));const r=await thumbnailRoutes(new Request(url),url,f.root,f.env,f.helpers);assert.equal(r.status,200);const p=await r.json();seen.push(...p.items.map(x=>x.id));cursor=p.nextCursor;
  }while(cursor);
  assert.equal(seen.length,27);assert.equal(new Set(seen).size,27);assert.ok(seen.includes(f.photos[0]));assert.ok(seen.includes(f.photos[1]));
  for(const {sql,params}of f.statements.filter(s=>s.sql.includes('LIMIT 21'))){const plan=JSON.stringify(f.sqlite.prepare('EXPLAIN QUERY PLAN '+sql).all(...params));assert.match(plan,/collection_photos_thumb_repair/);assert.doesNotMatch(plan,/TEMP B-TREE/);}
 }finally{f.sqlite.close();}
});
