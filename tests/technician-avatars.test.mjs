import test from 'node:test';import assert from 'node:assert/strict';
import {setup} from './helpers/dispatch-fixture.mjs';
import {session} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {validAvatarPng} from '../server/technician-avatars.mjs';
import {photoStore,seal} from '../server/photo-storage.mjs';
import {fakeGoogle,testEnv} from './helpers/fake-drive.mjs';
import {avatarPng} from './helpers/avatar-png.mjs';
const origin='https://teste.invalid';
async function fixture(){
 const f=await setup(),files=new Map();f.files=files;f.puts=0;f.env.PHOTOS={put:async(k,b)=>{f.puts++;if(f.fail)throw Error('TEST storage failure');files.set(k,b);},get:async k=>files.has(k)?{body:files.get(k)}:null};
 f.upload=async({s=f.rs,id=f.operator.id,op=crypto.randomUUID(),version=0,bytes=avatarPng(),csrf=true}={})=>{const response=await worker.fetch(new Request(origin+'/api/dispatch/avatar',{method:'POST',headers:{Cookie:s.cookie,Origin:origin,...(csrf?{'X-CSRF-Token':s.csrf}:{}),'Content-Type':'image/png','X-User-Id':id,'X-Operation-Id':op,'X-Avatar-Version':String(version)},body:bytes}),f.env);return {status:response.status,data:await response.json()};};
 f.get=(id,image,s=f.rs,etag)=>worker.fetch(new Request(origin+'/api/dispatch/avatar?'+new URLSearchParams({userId:id,imageId:image}),{headers:{Cookie:s.cookie,...(etag?{'If-None-Match':etag}:{})}}),f.env);
 return f;
}
test('avatar: root exclusivo, CSRF, coletor e conteúdo inválido bloqueados',async()=>{const f=await fixture();try{
 await f.enable();assert.equal((await f.upload({s:f.os})).status,403);assert.equal((await f.upload({csrf:false})).status,403);
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.operator.id);const s=await session(f,f.operator);assert.equal((await f.upload({s})).status,403);assert.equal((await f.get(f.operator.id,crypto.randomUUID(),s)).status,403);}
 assert.equal((await f.upload({bytes:Buffer.alloc(65537)})).status,413);assert.equal((await f.upload({bytes:Buffer.from('<svg/>')})).status,422);assert.equal((await f.upload({bytes:avatarPng(1,129)})).status,422);
 f.env.APP_KIND='collector';assert.equal((await f.upload()).status,403);assert.equal(f.puts,0);
}finally{f.sqlite.close();}});
test('avatar: envio, leitura privada, troca versionada, remoção e mapa preservam atendimento',async()=>{const f=await fixture();try{
 await f.enable();const task=await f.task();await f.assign(task);assert.equal((await f.accept(task)).status,200);const before=f.sqlite.prepare('SELECT * FROM dispatch_attendances').all();
 const op=crypto.randomUUID();assert.equal((await f.upload({op})).status,200);assert.equal((await f.upload({op})).data.replayed,true);assert.equal(f.puts,1);
 const r=await f.get(f.operator.id,op);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private/);assert.deepEqual(Buffer.from(await r.arrayBuffer()),avatarPng());const etag=r.headers.get('etag');assert.equal((await f.get(f.operator.id,op,f.rs,etag)).status,304);assert.equal((await f.get(f.operator.id,op,f.os,etag)).status,403);
 const map=await f.call('/api/dispatch/map');assert.equal(map.data.positions[0].avatar_id,op);
 const second=crypto.randomUUID();assert.equal((await f.upload({op:second,version:1,bytes:avatarPng(99)})).status,200);assert.equal((await f.upload({version:1})).status,409);assert.equal((await f.get(f.operator.id,op)).status,404);
 const command={userId:f.operator.id,operationId:crypto.randomUUID(),version:2};assert.equal((await f.call('/api/dispatch/avatar-remove',command)).status,200);assert.equal((await f.call('/api/dispatch/avatar-remove',command)).data.replayed,true);
 assert.equal((await f.call('/api/dispatch/map')).data.positions[0].avatar_id,null);assert.equal(f.files.size,2,'previous private files retained');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM technician_avatar_events').get().n,3);assert.deepEqual(f.sqlite.prepare('SELECT * FROM dispatch_attendances').all(),before);
}finally{f.sqlite.close();}});
test('avatar: falha mantém anterior, repetição retoma, concorrência não sobrescreve',async()=>{const f=await fixture();try{
 const original=crypto.randomUUID();await f.upload({op:original});f.fail=true;const op=crypto.randomUUID();assert.equal((await f.upload({op,version:1})).status,503);assert.equal(f.sqlite.prepare('SELECT image_id FROM technician_profiles').get().image_id,original);f.fail=false;assert.equal((await f.upload({op,version:1})).status,200);
 let release,started;const gate=new Promise(r=>release=r),ready=new Promise(r=>started=r);const put=f.env.PHOTOS.put;f.env.PHOTOS.put=async(...args)=>{started();await gate;return put(...args);};const parallel=crypto.randomUUID();const first=f.upload({op:parallel,version:2});await ready;assert.equal((await f.upload({op:parallel,version:2})).status,409);release();assert.equal((await first).status,200);assert.equal((await f.upload({op:parallel,version:2})).data.replayed,true);
 assert.equal(f.sqlite.prepare('SELECT version FROM technician_profiles').get().version,3);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM technician_avatar_events').get().n,3);
}finally{f.sqlite.close();}});
test('avatar: Drive usa pasta privada própria, reutiliza envio e não inventa vistoria',async()=>{const f=await fixture();try{
 const google=fakeGoogle(),env=testEnv({DB:f.db});const refresh=await seal(env,'REFRESH-ISOLADO');f.sqlite.prepare("INSERT INTO integration_tokens(provider,refresh_token_enc,folder_id,scope,connected_by,connected_at) VALUES('google-drive',?,'ROOT-PRIVATE','https://www.googleapis.com/auth/drive.file',?,?)").run(refresh,f.root.id,Date.now());
 const store=photoStore(env,{fetchImpl:google.fetch}),id=crypto.randomUUID();const input={key:'technician-avatars/'+id,bytes:avatarPng(),mime:'image/png',photoId:id,targetKind:'technician-avatar',targetId:f.operator.id,sha256:'test',retry:true};
 const first=await store.put(input),again=await store.put(input);assert.equal(first.ref,again.ref);assert.equal(again.reused,true);const file=google.files.get(first.ref),folder=google.files.get(file.parents[0]);assert.equal(folder.name,'Avatares dos técnicos');assert.deepEqual(folder.parents,['ROOT-PRIVATE']);assert.equal(file.appProperties.semedUnitId,undefined);assert.equal(file.appProperties.semedInspectionId,undefined);assert.equal([...google.files.values()].filter(x=>x.bytes).length,1);assert.equal((await store.get({storage_ref:first.ref})).body instanceof ReadableStream,true);
 assert.equal(validAvatarPng(avatarPng()),true);const bad=avatarPng();bad[30]^=1;assert.equal(validAvatarPng(bad),false);
}finally{f.sqlite.close();}});
