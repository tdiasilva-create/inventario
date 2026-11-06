import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {photoGalleryRead} from '../server/photo-gallery.mjs';
export function galleryFixture(){
 const f=collectorFixture(),visits={};
 for(const state of ['open','paused','completed']){const id=crypto.randomUUID();visits[state]=id;f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,state) VALUES(?,?,?,?,?,?)').run(id,f.ids.pending,f.operator.id,100,100,state);}
 const photos=[];
 function add(state='open',status='ready',kind='facade',target=f.ids.pending,unit=f.ids.pending){const id=crypto.randomUUID();f.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status,storage_provider,storage_ref) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,unit,visits[state],kind,target,'PRIVATE/'+id,'image/png',4,'HASH',f.operator.id,1000,status,'r2','PRIVATE_REF');photos.push(id);return id;}
 for(let n=0;n<53;n++)add(n%3===0?'completed':n%3===1?'paused':'open');
 const pending=add('open','pending'),orphan=add('completed','ready','equipment',crypto.randomUUID());
 const env={DB:f.db,PHOTOS:{get:async()=>({body:new Uint8Array([137,80,78,71])})}};
 const call=(path='photos',role='root',method='GET',override=env)=>{const req=new Request('https://test/api/inventory/'+path,{method});return photoGalleryRead(req,new URL(req.url),role?{...f.root,role}:null,override,f.helpers);};
 return {...f,visits,photos,pending,orphan,env,call,add};
}
test('galeria pagina todos os estados e filtra sem vazar armazenamento ou publicar rascunhos',async()=>{
 const f=galleryFixture();try{const before=f.sqlite.prepare('SELECT total_changes() AS n').get().n;
  for(const role of ['root','admin','visualizador']){let cursor='',seen=[];do{const r=await f.call('photos?cursor='+encodeURIComponent(cursor),role);assert.equal(r.status,200);const p=await r.json();assert.equal(p.published+p.partial+p.paused,53);assert.ok(p.items.length<=48);assert.ok(!JSON.stringify(p).includes('PRIVATE'));assert.ok(p.items.every(x=>!('object_key'in x)&&!('storage_ref'in x)));seen.push(...p.items.map(x=>x.id));cursor=p.nextCursor;}while(cursor);assert.equal(seen.length,53);assert.equal(new Set(seen).size,53);assert.ok(!seen.includes(f.pending));assert.ok(!seen.includes(f.orphan));}
  for(const [scope,state]of [['partial','open'],['paused','paused'],['published','completed']]){const p=await(await f.call('photos?scope='+scope)).json();assert.ok(p.items.length);assert.ok(p.items.every(x=>x.inspection_state===state));}
  assert.equal((await(await f.call('photos?kind=equipment')).json()).items.length,0);
  assert.equal((await(await f.call('photos?unitId='+f.ids.assigned)).json()).items.length,0);
  assert.equal(f.sqlite.prepare('SELECT total_changes() AS n').get().n,before);
 }finally{f.sqlite.close();}
});
test('galeria e binários exigem autorização, vínculo íntegro e arquivo recebido',async()=>{
 const f=galleryFixture();try{
  for(const path of ['photos','photo?id='+f.photos[0]]){assert.equal((await f.call(path,null)).status,401);assert.equal((await f.call(path,'operador')).status,403);assert.equal((await f.call(path,'root','POST')).status,405);}
  for(const p of ['photos?cursor=invalid','photos?unitId=invalid','photos?kind=bad','photos?scope=bad','photo?id=bad'])assert.equal((await f.call(p)).status,400);
  for(const id of f.photos.slice(0,3)){const r=await f.call('photo?id='+id,'visualizador');assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal((await r.arrayBuffer()).byteLength,4);}
  assert.equal((await f.call('photo?id='+f.pending)).status,404);assert.equal((await f.call('photo?id='+f.orphan)).status,404);
  assert.equal((await f.call('photo?id='+f.photos[0],'root','GET',{DB:f.db})).status,503);
  assert.equal((await f.call('photo?id='+f.photos[0],'root','GET',{...f.env,PHOTOS:{get:async()=>null}})).status,404);
  f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.visits.open);assert.equal((await f.call('photo?id='+f.photos[2])).status,200,'transição da visita não quebra foto elegível');
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);assert.equal((await(await f.call('photos')).json()).items.length,0);assert.equal((await f.call('photo?id='+f.photos[0])).status,404);
 }finally{f.sqlite.close();}
});
