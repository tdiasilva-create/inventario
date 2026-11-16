// Local workerd only. Optional private backup stays local; only aggregates leave.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {collectorFixture} from '../tests/helpers/collector-db.mjs';
import {photoGalleryRead} from '../server/photo-gallery.mjs';
import {thumbnailRoutes} from '../server/photo-thumbnails.mjs';
import {measuredEnvironment,timingHeader} from '../server/request-timing.mjs';

const output=process.argv[2],input=process.argv[3];if(!output)throw Error('Usage: node scripts/measure-photo-budget-d125.mjs OUTPUT.json [PRIVATE_BACKUP.sql]');
let sqlite;
if(input){sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(input,'utf8'));}
else{
 const f=collectorFixture({beforeMigration:'0036'});sqlite=f.sqlite;const visit=crypto.randomUUID();
 sqlite.prepare("INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,state) VALUES(?,?,?,?,?,'open')").run(visit,f.ids.pending,f.root.id,1,1);
 const insert=sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status,thumb_blob,thumb_source_sha256) VALUES(?,?,?,'facade',?,?,'image/jpeg',100,?,?,?,'ready',?,?)");
 sqlite.exec('BEGIN');for(let i=0;i<5000;i++){const id=crypto.randomUUID();insert.run(id,f.ids.pending,visit,f.ids.pending,id,'a'.repeat(64),f.root.id,1000+i,i<4900?new Uint8Array([1,2]):null,i<4900?'a'.repeat(64):null);}sqlite.exec('COMMIT');
}
const sha=v=>createHash('sha256').update(v).digest('hex');
const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(x=>x.name),hashes=new Map(tables.map(t=>[t,sha(JSON.stringify(sqlite.prepare('SELECT * FROM "'+t+'"').all()))]));
async function oldModule(file){const source=execFileSync('git',['show','f910cd3:'+file],{encoding:'utf8'}).replace(/from (['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+q+pathToFileURL(path.resolve(path.dirname(file),p)).href+q);return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}
const oldGallery=(await oldModule('server/photo-gallery.mjs')).photoGalleryRead,oldThumb=(await oldModule('server/photo-thumbnails.mjs')).thumbnailRoutes;
const require=createRequire(import.meta.url),{Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:'export default {fetch(){return new Response("local")}}',d1Databases:['DB']}));
async function copy(source,db){
 const schema=source.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
 await db.batch(schema.filter(x=>x.type==='table').map(x=>db.prepare(x.sql)));
 const insert=[db.prepare('PRAGMA defer_foreign_keys=ON')];
 for(const t of schema.filter(x=>x.type==='table'))for(const row of source.prepare('SELECT * FROM "'+t.name+'"').all()){
  const cols=Object.keys(row);insert.push(db.prepare('INSERT INTO "'+t.name+'" ('+cols.map(c=>'"'+c+'"').join(',')+') VALUES('+cols.map(()=>'?').join(',')+')').bind(...Object.values(row).map(x=>x instanceof Uint8Array?x.buffer.slice(x.byteOffset,x.byteOffset+x.byteLength):x)));
 }
 await db.batch(insert);for(const x of schema.filter(x=>x.type!=='table'))await db.prepare(x.sql).run();
}
const helpers={json:(v,status=200)=>Response.json(v,{status}),fail:(error,status=400)=>Response.json({error},{status})};
async function sample(db,route,query){const request=new Request('https://test'+query),env=measuredEnvironment(request,{DB:db,APP_KIND:'panel'}),response=await route(request,new URL(request.url),{id:'synthetic-root',role:'root'},env,helpers);assert.equal(response.status,200);return {data:await response.json(),...Object.fromEntries([...timingHeader(env).matchAll(/(d1_rows_read|d1_rows_written|d1_calls);desc="(\d+)"/g)].map(m=>[m[1],+m[2]]))};}
try{
 const db=await mf.getD1Database('DB');await copy(sqlite,db);
 const first=await sample(db,oldGallery,'/api/inventory/photos');
 const queries=[['gallery.first','/api/inventory/photos',oldGallery,photoGalleryRead],...(first.data.nextCursor?[['gallery.next','/api/inventory/photos?cursor='+encodeURIComponent(first.data.nextCursor),oldGallery,photoGalleryRead]]:[]),['backfill','/api/root/photo-thumbnails',oldThumb,thumbnailRoutes]];
 const results=[];for(const [name,url,oldRoute]of queries)results.push({name,before:await sample(db,oldRoute,url)});
 const sql=readFileSync('migrations/0036_photo_gallery_reads.sql','utf8');sqlite.exec(sql);await db.exec(sql.split('\n').filter(l=>!l.trimStart().startsWith('--')).join(' '));
 for(const t of tables)assert.equal(sha(JSON.stringify(sqlite.prepare('SELECT * FROM "'+t+'"').all())),hashes.get(t),t);
 assert.equal(sqlite.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(sqlite.prepare('PRAGMA foreign_key_check').all().length,0);
 for(const [i,[name,url,,route]]of queries.entries()){
  const after=await sample(db,route,url);assert.deepEqual(after.data,results[i].before.data,name);
  delete after.data;delete results[i].before.data;results[i].after=after;results[i].equivalent=true;
 }
 const out={at:new Date().toISOString(),runtime:'local workerd',source:input?'private backup':'5000 synthetic photos, 100 missing thumbnails',unchangedTables:tables.length,queries:results,note:'First page includes a cold count; next page reuses exact counts at the same revision. No production writes.'};
 mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
}finally{sqlite.close();await mf.dispose();}
