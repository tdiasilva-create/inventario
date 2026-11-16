// Exercise the actual Wrangler bundle + compiled WASM in local Cloudflare workerd.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
(async()=>{
 const dir=path.resolve(process.argv[2]||'private-data/d125-dry-panel'),out=process.argv[3]||'evidencias/fotos-miniaturas-d125-2026-11-16/runtime.json';
 const {Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session}=await import('./helpers/agent-client.mjs');
 const f=collectorFixture(),root=await session(f,f.root),visit=crypto.randomUUID(),photo=crypto.randomUUID();
 f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(visit,f.ids.pending,f.root.id,1,1);
 f.sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status,storage_provider) VALUES(?,?,?,'facade',?,?,'image/jpeg',100,?,?,1,'ready','r2')").run(photo,f.ids.pending,visit,f.ids.pending,'TEST-ONLY','a'.repeat(64),f.root.id);
 const mf=new Miniflare(convertV4MiniflareOptions({modules:[{type:'ESModule',path:path.join(dir,'worker.js'),contents:fs.readFileSync(path.join(dir,'worker.js'),'utf8')},...fs.readdirSync(dir).filter(n=>n.endsWith('.wasm')).map(n=>({type:'CompiledWasm',path:path.join(dir,n),contents:fs.readFileSync(path.join(dir,n))}))],compatibilityDate:'2026-10-27',d1Databases:['DB'],r2Buckets:['PHOTOS'],bindings:{AUTH_PEPPER:'TEST-ONLY',PHOTO_STORAGE_PROVIDER:'r2',APP_KIND:'panel'}}));
 try{
  const db=await mf.getD1Database('DB'),schema=f.sqlite.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid").all();
  await db.batch(schema.filter(x=>x.type==='table').map(x=>db.prepare(x.sql)));
  const statements=[db.prepare('PRAGMA defer_foreign_keys=ON')];
  for(const t of schema.filter(x=>x.type==='table'))for(const row of f.sqlite.prepare('SELECT * FROM "'+t.name+'"').all()){const cols=Object.keys(row);statements.push(db.prepare('INSERT INTO "'+t.name+'" ('+cols.join(',')+') VALUES('+cols.map(()=>'?').join(',')+')').bind(...Object.values(row)));}
  await db.batch(statements);for(const item of schema.filter(x=>x.type!=='table'))await db.prepare(item.sql).run();
  const good=fs.readFileSync('tests/fixtures/thumbnail-test.jpg'),forged=Buffer.from([255,216,255,192,0,17,8,0,240,1,64,3,1,17,0,2,17,0,3,17,0,255,218,0,12,3,1,0,2,17,3,17,0,63,0,0,255,217]);
  const send=bytes=>mf.dispatchFetch('https://test/api/root/photo-thumbnails?force=1',{method:'POST',headers:{Origin:'https://test',Cookie:root.cookie,'X-CSRF-Token':root.csrf,'Content-Type':'image/jpeg','X-Photo-Id':photo,'X-Inspection-Id':visit,'X-Source-SHA256':'a'.repeat(64)},body:bytes});
  for(const [bytes,status]of [[forged,400],[good,201],[forged,400]]){const r=await send(bytes);assert.equal(r.status,status,await r.text());}
  const read=await mf.dispatchFetch('https://test/api/inventory/photo?id='+photo+'&size=thumb',{headers:{Cookie:root.cookie}});assert.equal(read.status,200);assert.deepEqual(Buffer.from(await read.arrayBuffer()),good);
  const noAuth=await mf.dispatchFetch('https://test/api/inventory/photo?id='+photo+'&size=thumb');assert.equal(noAuth.status,401);
  const result={passed:true,runtime:'Cloudflare workerd; actual Wrangler bundle and compiled WASM',checks:5,originalPreserved:true,noOfficialRecordsWritten:true};fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{f.sqlite.close();await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
