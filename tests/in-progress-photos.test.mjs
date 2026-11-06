import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {collectorRoutes} from '../server/collector.mjs';
import {inProgressPhotoRead} from '../server/in-progress-photos.mjs';

function fixture(){
 const f=collectorFixture(),id=crypto.randomUUID(),other=crypto.randomUUID();
 for(const v of [id,other])f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(v,v===id?f.ids.pending:f.ids.assigned,f.operator.id,100,100);
 const photos=[];
 for(let n=0;n<55;n++){
  const photoId=crypto.randomUUID();photos.push(photoId);
  f.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(photoId,f.ids.pending,id,'facade',f.ids.pending,'PRIVATE/'+photoId,'image/png',14,'HASH',f.operator.id,1000,n===0?'pending':'ready');
 }
 const env={DB:f.db,PHOTOS:{get:async()=>({body:new Uint8Array([137,80,78,71])})}};
 const call=(path,role='root',method='GET',override=env)=>{const req=new Request('https://test/api/inventory/in-progress-'+path,{method});return collectorRoutes(req,new URL(req.url),{...f.root,role},override,f.helpers);};
 return {...f,id,other,photos,env,call};
}
test('fotografias parciais paginam, preservam vínculos e não publicam nem expõem armazenamento',async()=>{
 const f=fixture();try{
  const history=f.sqlite.prepare('SELECT COUNT(*) AS n FROM collection_history').get().n;
  for(const role of ['root','admin','visualizador']){
   let cursor='',seen=[];do{const response=await f.call('photos?'+new URLSearchParams({id:f.id,cursor}),role);assert.equal(response.status,200);const page=await response.json();assert.equal(page.ready,54);assert.equal(page.pending,1);assert.ok(page.items.length<=50);assert.ok(page.items.every(p=>p.target_id===f.ids.pending));assert.equal(JSON.stringify(page).includes('PRIVATE/'),false);assert.equal('storage_ref' in page.items[0],false);seen.push(...page.items.map(p=>p.id));cursor=page.nextCursor||'';}while(cursor);assert.equal(seen.length,55);assert.equal(new Set(seen).size,55);
  }
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM collection_history').get().n,history);
  assert.equal(f.sqlite.prepare("SELECT state FROM inspections WHERE id=?").get(f.id).state,'open');
  const official=await collectorRoutes(new Request('https://test/api/inventory/unit?unitId='+f.ids.pending),new URL('https://test/api/inventory/unit?unitId='+f.ids.pending),f.root,f.env,f.helpers);assert.deepEqual((await official.json()).photos,[]);
 }finally{f.sqlite.close();}
});
test('leitura privada valida perfil, vistoria, unidade ativa, estado do arquivo e falhas do provedor',async()=>{
 const f=fixture();try{
  const path='photo?'+new URLSearchParams({id:f.id,photoId:f.photos[1]});
  for(const role of ['root','admin','visualizador']){const r=await f.call(path,role);assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('Content-Type'),'image/png');assert.equal((await r.arrayBuffer()).byteLength,4);}
  for(const p of [path,'photos?id='+f.id]){assert.equal((await f.call(p,'operador')).status,403);assert.equal((await f.call(p,'root','POST')).status,405);}
  const req=new Request('https://test/api/inventory/in-progress-photos?id='+f.id);assert.equal((await inProgressPhotoRead(req,new URL(req.url),null,f.env,f.helpers)).status,401);
  assert.equal((await f.call('photo?id='+f.other+'&photoId='+f.photos[1])).status,404);
  assert.equal((await f.call('photo?id='+f.id+'&photoId='+f.photos[0])).status,404);
  assert.equal((await f.call(path,'root','GET',{DB:f.db})).status,503);
  assert.equal((await f.call(path,'root','GET',{...f.env,PHOTOS:{get:async()=>null}})).status,404);
  assert.equal((await f.call('photos?id='+f.id+'&cursor=invalid')).status,400);
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);assert.equal((await f.call(path)).status,404);
  f.sqlite.prepare('UPDATE units SET active=1 WHERE id=?').run(f.ids.pending);f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(f.id);
  assert.equal((await f.call(path)).status,409);assert.equal((await (await f.call('photos?id='+f.id)).json()).completed,true);
 }finally{f.sqlite.close();}
});
