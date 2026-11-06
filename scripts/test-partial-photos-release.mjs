import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {collectorFixture} from '../tests/helpers/collector-db.mjs';
import {digest} from '../server/security.mjs';
import worker,{patchAsset} from '../private-data/partial-photos-release/entry.mjs';
const f=collectorFixture(),token='c'.repeat(64);
try{
 f.sqlite.prepare('UPDATE users SET must_change=0 WHERE id=?').run(f.root.id);
 f.sqlite.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at,created_at,credential_version) VALUES(?,?,?,?,?,?)').run(await digest(token),f.root.id,'ISOLATED',Date.now()+3600000,Date.now(),0);
 let progress=await readFile('web/desktop-progress.js','utf8');
 progress=progress.replace("import {createProgressPhotos} from './desktop-progress-photos.js';\n",'').replace(' const photographs=createProgressPhotos();\n','').replace('  photographs.detach();\n','').replace('  photographs.mount();\n','').replace("  await photographs.refresh(selected&&detail?.inspection.state==='open'?selected:null);\n",'');
 const patched=patchAsset('/desktop-progress.js',progress);assert.ok(patched.includes('photographs.refresh'));
 await writeFile('private-data/partial-photos-release/asset-check.js',patched);
 const env={DB:f.db,AUTH_PEPPER:'ISOLATED',ASSETS:{fetch:async r=>new Response(new URL(r.url).pathname==='/desktop-progress.js'?progress:'Sem fotografias recebidas.',{headers:{'Content-Type':'text/javascript'}})}};
 const cookie={Cookie:'__Host-semed='+token},base='https://test';
 for(const path of ['/desktop-progress-photos.js','/desktop-progress-photos.css','/desktop-progress.js','/desktop.js']){
  assert.equal((await worker.fetch(new Request(base+path),env)).status,302);
  const r=await worker.fetch(new Request(base+path,{headers:cookie}),env);assert.equal(r.status,200,path);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.ok((await r.text()).length>100);
 }
 const id=f.sqlite.prepare('SELECT id FROM inspections LIMIT 1').get().id;
 assert.equal((await worker.fetch(new Request(base+'/api/inventory/in-progress-photos?id='+id),env)).status,401);
 const response=await worker.fetch(new Request(base+'/api/inventory/in-progress-photos?id='+id,{headers:cookie}),env);assert.equal(response.status,200,await response.clone().text());assert.equal((await response.json()).ready,0);
 const config=JSON.parse(await readFile('private-data/partial-photos-release/wrangler.json','utf8'));for(const type of ['assets','secret_text','plain_text'])assert.ok(config.unsafe.metadata.keep_bindings.includes(type));
 console.log('PASS: pacote isolado preserva autenticação, assets, segredos e rotas de fotos; V2 não incluída.');
}finally{f.sqlite.close();}
