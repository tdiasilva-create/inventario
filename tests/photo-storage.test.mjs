import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {fakeGoogle,testEnv} from './helpers/fake-drive.mjs';
import {photoStore,seal,open,providerFor,DRIVE_PROVIDER} from '../server/photo-storage.mjs';
import {googleRoutes,googleCallback} from '../server/google-auth.mjs';
import {collectorRoutes} from '../server/collector.mjs';
import {unitRoutes} from '../server/units.mjs';
import {digest} from '../server/security.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64');
const req=(path,data,init={})=>new Request('http://painel.test'+path,data?{method:'POST',body:JSON.stringify(data),...init}:init);
async function connect(f,env,google,user=f.root){
 // Reproduz o fluxo completo: start (estado + cookie) → callback do Google com code válido.
 const start=await googleRoutes(req('/api/root/google/start'),new URL('http://painel.test/api/root/google/start'),user,env,{...f.helpers,fetchImpl:google.fetch});
 assert.equal(start.status,302);const location=new URL(start.headers.get('Location'));const state=location.searchParams.get('state'),cookie=start.headers.get('Set-Cookie').split(';')[0];
 const callbackUrl=new URL('http://painel.test/api/root/google/callback?code=CODE-VALIDO&state='+state+'&scope=https://www.googleapis.com/auth/drive.file');
 const response=await googleCallback(new Request(callbackUrl,{headers:{Cookie:cookie}}),callbackUrl,env,{audit:f.helpers.audit,fetchImpl:google.fetch});
 return {location,response,state,cookie};
}
test('provedor: sem configuração nada é habilitado; R2 permanece quando há binding; Drive exige segredos e autorização',async()=>{
 const f=collectorFixture();
 try{
 assert.equal(providerFor({}),null);assert.equal(providerFor({PHOTOS:{}}),'r2');assert.equal(providerFor({PHOTO_STORAGE_PROVIDER:'google-drive'}),DRIVE_PROVIDER);assert.equal(providerFor({PHOTO_STORAGE_PROVIDER:'outro'}),null);
 assert.equal(await photoStore({},{db:f.db}).enabled(),false);
 assert.equal(await photoStore({PHOTOS:{}},{db:f.db}).enabled(),true);
 const semSegredo=photoStore({PHOTO_STORAGE_PROVIDER:'google-drive'},{db:f.db});assert.equal(await semSegredo.enabled(),false);assert.equal(semSegredo.provider,DRIVE_PROVIDER);
 const comSegredo=photoStore(testEnv(),{db:f.db});assert.equal(await comSegredo.enabled(),false,'credenciais sem autorização não habilitam');
 const upload=await collectorRoutes(new Request('http://t/api/collector/photo-upload',{method:'POST',headers:{'Content-Type':'image/png','X-Photo-Id':crypto.randomUUID(),'X-Inspection-Id':crypto.randomUUID(),'X-Target-Kind':'facade','X-Target-Id':crypto.randomUUID()},body:png}),new URL('http://t/api/collector/photo-upload'),f.operator,{DB:f.db,...testEnv()},f.helpers);
 assert.equal(upload.status,503);
 const caps=await(await collectorRoutes(req('/api/collector/capabilities'),new URL('http://t/api/collector/capabilities'),f.operator,{DB:f.db,...testEnv()},f.helpers)).json();
 assert.deepEqual(caps,{photosEnabled:false,photoProvider:'google-drive',offlineEnabled:false});
 }finally{f.sqlite.close();}
});
test('tokens cifrados com AES-GCM: ida e volta, chave diferente falha, chave inválida é recusada',async()=>{
 const env=testEnv();const sealed=await seal(env,'segredo-isolado');
 assert.match(sealed,/^v1:/);assert.ok(!sealed.includes('segredo'));assert.equal(await open(env,sealed),'segredo-isolado');
 await assert.rejects(open(testEnv({GOOGLE_TOKEN_KEY:Buffer.alloc(32,9).toString('base64')}),sealed),/decifrar/);
 await assert.rejects(seal(testEnv({GOOGLE_TOKEN_KEY:'curta'}),'x'),/32 bytes|inválida/);
});
test('autorização: só root inicia, callback exige estado+cookie, grava token cifrado, cria pasta e permite desconectar',async()=>{
 const f=collectorFixture(),env={DB:f.db,...testEnv()},google=fakeGoogle();
 try{
 for(const role of ['admin','operador','visualizador'])assert.equal((await googleRoutes(req('/api/root/google/start'),new URL('http://painel.test/api/root/google/start'),{...f.root,role},env,{...f.helpers,fetchImpl:google.fetch})).status,403);
 assert.equal((await googleRoutes(req('/api/root/google/start'),new URL('http://painel.test/api/root/google/start'),f.root,{DB:f.db,PHOTO_STORAGE_PROVIDER:'google-drive'},f.helpers)).status,503,'sem segredos não inicia');
 // Callback sem estado válido ou sem cookie não grava nada.
 const bogus=new URL('http://painel.test/api/root/google/callback?code=CODE-VALIDO&state='+'a'.repeat(64));
 assert.equal((await googleCallback(new Request(bogus),bogus,env,{audit:f.helpers.audit,fetchImpl:google.fetch})).status,400);
 const {location,response}=await connect(f,env,google);
 assert.equal(location.origin,'https://accounts.google.com');assert.equal(location.searchParams.get('scope'),'https://www.googleapis.com/auth/drive.file');assert.equal(location.searchParams.get('access_type'),'offline');assert.equal(location.searchParams.get('prompt'),'consent');assert.equal(location.searchParams.get('redirect_uri'),'http://painel.test/api/root/google/callback');
 assert.equal(response.status,200);assert.match(await response.text(),/Google Drive conectado/);
 const row=f.sqlite.prepare('SELECT * FROM integration_tokens').get();
 assert.equal(row.account_email,'teste@exemplo.invalid');assert.ok(row.folder_id);assert.equal(row.folder_name,'Inventário Tecnológico SEMED');
 assert.ok(!row.refresh_token_enc.includes('REFRESH-ISOLADO'),'refresh token nunca em claro');assert.equal(await open(env,row.refresh_token_enc),'REFRESH-ISOLADO');
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM integration_oauth_states').get().n,0,'estado consumido');
 // Estado reutilizado é recusado.
 const replayUrl=new URL('http://painel.test/api/root/google/callback?code=CODE-VALIDO&state='+location.searchParams.get('state'));
 assert.equal((await googleCallback(new Request(replayUrl),replayUrl,env,{audit:f.helpers.audit,fetchImpl:google.fetch})).status,400);
 const status=await(await googleRoutes(req('/api/root/google/status'),new URL('http://painel.test/api/root/google/status'),f.root,env,{...f.helpers,fetchImpl:google.fetch})).json();
 assert.equal(status.connected,true);assert.equal(status.photosEnabled,true);assert.equal(status.activeProvider,'google-drive');assert.ok(!JSON.stringify(status).includes('REFRESH'),'status não expõe tokens');assert.ok(!JSON.stringify(status).includes('ACCESS-'));
 const testRun=await(await googleRoutes(req('/api/root/google/test',{}),new URL('http://painel.test/api/root/google/test'),f.root,env,{...f.helpers,fetchImpl:google.fetch})).json();
 assert.equal(testRun.ok,true);assert.ok(!google.files.has(testRun.fileId),'arquivo de teste removido');
 const disconnect=await googleRoutes(req('/api/root/google/disconnect',{}),new URL('http://painel.test/api/root/google/disconnect'),f.root,env,{...f.helpers,fetchImpl:google.fetch});
 assert.equal(disconnect.status,200);assert.equal(google.revoked,true);
 assert.equal(f.sqlite.prepare('SELECT refresh_token_enc FROM integration_tokens').get().refresh_token_enc,null);
 assert.equal(await photoStore(env,{db:f.db,fetchImpl:google.fetch}).enabled(),false);
 const events=f.sqlite.prepare('SELECT event FROM integration_events ORDER BY id').all().map(e=>e.event);
 assert.deepEqual(events.filter(e=>['authorization_connected','self_test_ok','authorization_disconnected'].includes(e)),['authorization_connected','self_test_ok','authorization_disconnected']);
 }finally{f.sqlite.close();}
});
test('coleta com Drive: upload idempotente, leitura proxy sem link público, remoção própria, renovação de token e revogação',async()=>{
 const f=collectorFixture(),google=fakeGoogle(),env={DB:f.db,...testEnv()};
 const helpers={...f.helpers};
 const call=async(path,data,user=f.operator)=>{const r=req('/api/collector/'+path,data);return collectorRoutes(r,new URL(r.url),user,env,helpers);};
 const ok=async(path,data,user)=>{const r=await call(path,data,user);assert.ok(r.status<300,await r.clone().text());return r.json();};
 const upload=(i,kind,target,id,user=f.operator,body=png,mime='image/png')=>collectorRoutes(new Request('http://t/api/collector/photo-upload',{method:'POST',headers:{'Content-Type':mime,'X-Photo-Id':id,'X-Inspection-Id':i,'X-Target-Kind':kind,'X-Target-Id':target},body}),new URL('http://t/api/collector/photo-upload'),user,env,helpers);
 try{
 // A camada do coletor usa fetch global; aponta para a simulação apenas neste teste.
 const realFetch=globalThis.fetch;globalThis.fetch=google.fetch;
 try{
 await connect(f,env,google);
 const {inspection:i}=await ok('visit-start',{unitId:f.ids.pending});
 const photoId=crypto.randomUUID();
 const first=await upload(i.id,'facade',f.ids.pending,photoId);assert.equal(first.status,201,await first.clone().text());
 const firstBody=await first.json();assert.equal(firstBody.provider,'google-drive');assert.equal(firstBody.reused,false);
 const row=f.sqlite.prepare('SELECT * FROM collection_photos WHERE id=?').get(photoId);
 assert.equal(row.status,'ready');assert.equal(row.storage_provider,'google-drive');assert.ok(row.storage_ref.startsWith('drv-'));
 const stored=google.files.get(row.storage_ref);assert.equal(stored.appProperties.semedPhotoId,photoId);assert.equal(stored.appProperties.semedSha256,row.sha256);
 const unitFolder=google.files.get(stored.parents[0]);assert.equal(unitFolder.mimeType,'application/vnd.google-apps.folder');assert.match(unitFolder.name,/TESTE ISOLADO/);assert.equal(unitFolder.parents[0],f.sqlite.prepare('SELECT folder_id FROM integration_tokens').get().folder_id);
 // Repetição do mesmo identificador: nenhum arquivo novo.
 const repeat=await upload(i.id,'facade',f.ids.pending,photoId);assert.equal(repeat.status,200);assert.equal((await repeat.json()).repeated,true);
 assert.equal([...google.files.values()].filter(x=>x.appProperties?.semedPhotoId===photoId).length,1);
 // Upload interrompido antes de confirmar no D1 (status pending): a repetição recupera o arquivo já gravado.
 f.sqlite.prepare("UPDATE collection_photos SET status='pending',storage_ref=NULL WHERE id=?").run(photoId);
 const resumed=await upload(i.id,'facade',f.ids.pending,photoId);assert.equal(resumed.status,201);assert.equal((await resumed.json()).reused,true);
 assert.equal([...google.files.values()].filter(x=>x.appProperties?.semedPhotoId===photoId).length,1,'retomada não duplica arquivo');
 assert.equal(f.sqlite.prepare('SELECT storage_ref FROM collection_photos WHERE id=?').get(photoId).storage_ref,row.storage_ref);
 // Mesmo id com conteúdo diferente é recusado.
 const otherPng=Buffer.concat([png,Buffer.from([0])]);assert.equal((await upload(i.id,'facade',f.ids.pending,photoId,f.operator,otherPng)).status,409);
 // Leitura: proxy autenticado; visualizador não vê rascunho; sem link público.
 const read=await collectorRoutes(req('/api/collector/photo?id='+photoId),new URL('http://t/api/collector/photo?id='+photoId),f.operator,env,helpers);
 assert.equal(read.status,200);assert.equal(read.headers.get('Content-Type'),'image/png');assert.equal(read.headers.get('Cache-Control'),'private, no-store');assert.deepEqual(Buffer.from(await read.arrayBuffer()),png);
 assert.equal((await collectorRoutes(req('/api/collector/photo?id='+photoId),new URL('http://t/api/collector/photo?id='+photoId),{...f.root,role:'visualizador'},env,helpers)).status,403);
 assert.ok(!google.calls.some(c=>/permissions|webContentLink|anyone/.test(c.url)),'nenhuma permissão pública criada');
 // D-050: fotografias também pertencem às respostas/ambientes do questionário A–H.
 const {inspection:legacy}=await ok('start',{unitId:f.ids.progress});
 assert.equal((await upload(legacy.id,'facade',f.ids.progress,crypto.randomUUID())).status,201);
 assert.equal((await upload(legacy.id,'facade',f.ids.pending,crypto.randomUUID())).status,409,'fachada não aceita outra unidade');
 const {environment:room}=await ok('environment-save',{inspectionId:legacy.id,name:'Sala isolada',type:'Administrativo'});
 assert.equal((await upload(legacy.id,'environment',room.id,crypto.randomUUID())).status,201);
 assert.equal((await upload(i.id,'environment',room.id,crypto.randomUUID())).status,409,'ambiente deve pertencer à mesma unidade');
 const evidence=crypto.randomUUID();
 let legacyData=await ok('inspection?id='+legacy.id);
 await ok('section-save',{inspectionId:legacy.id,section:'C',version:legacyData.sections.C.version,answers:{exists:'Não',_photoEvidence:{'C.exists':evidence}}});
 assert.equal((await upload(legacy.id,'answer',evidence,crypto.randomUUID())).status,201);
 assert.equal((await upload(i.id,'answer',evidence,crypto.randomUUID())).status,409,'resposta deve pertencer à vistoria');
 assert.equal((await upload(legacy.id,'answer',crypto.randomUUID(),crypto.randomUUID())).status,409,'vínculo inexistente recusado');
 legacyData=await ok('inspection?id='+legacy.id);
 assert.ok(['facade','environment','answer'].every(kind=>legacyData.photos.some(p=>p.target_kind===kind)),'retomada carrega todos os contextos');
 for(let n=1;n<5;n++)assert.equal((await upload(legacy.id,'answer',evidence,crypto.randomUUID())).status,201);
 assert.equal((await upload(legacy.id,'answer',evidence,crypto.randomUUID())).status,409,'limite por resposta aplicado no servidor');
 // Renovação: token expirado é renovado uma vez e reutilizado depois.
 f.sqlite.prepare('UPDATE integration_tokens SET access_token_expires_at=0').run();
 const before=google.calls.filter(c=>c.url.includes('/token')).length;
 const second=crypto.randomUUID();assert.equal((await upload(i.id,'laboratory',i.id,second)).status,201);assert.equal((await upload(i.id,'laboratory',i.id,crypto.randomUUID())).status,201);
 assert.equal(google.calls.filter(c=>c.url.includes('/token')).length,before+1,'uma única renovação');
 // Remoção própria em rascunho apaga no Drive; outro operador não remove.
 const other={id:crypto.randomUUID(),role:'operador',username:'outro'};f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(other.id,'outro','operador','T','T',Date.now());
 assert.equal((await call('photo-remove',{id:second},other)).status,403);
 const ref=f.sqlite.prepare('SELECT storage_ref FROM collection_photos WHERE id=?').get(second).storage_ref;
 assert.equal((await call('photo-remove',{id:second})).status,200);assert.ok(!google.files.has(ref));assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM collection_photos WHERE id=?').get(second).n,0);
 // Falta de espaço: erro claro, nenhuma linha fica como 'ready'.
 const quota=fakeGoogle({quotaExceeded:true,anyToken:true});globalThis.fetch=async(input,init)=>{const u=typeof input==='string'?input:input.url;return u.includes('/upload/')?quota.fetch(input,init):google.fetch(input,init);};
 const fullId=crypto.randomUUID();const denied=await upload(i.id,'laboratory',i.id,fullId);assert.equal(denied.status,503);assert.match((await denied.json()).error,/espaço/i);
 assert.equal(f.sqlite.prepare('SELECT status FROM collection_photos WHERE id=?').get(fullId).status,'pending');
 globalThis.fetch=google.fetch;
 // Revogação externa: renovação falha → capacidade desabilitada e evento registrado.
 google.revoked=true;f.sqlite.prepare('UPDATE integration_tokens SET access_token_expires_at=0').run();
 const revokedUpload=await upload(i.id,'laboratory',i.id,crypto.randomUUID());assert.equal(revokedUpload.status,503);assert.match((await revokedUpload.json()).error,/revogada/);
 assert.ok(f.sqlite.prepare('SELECT revoked_at FROM integration_tokens').get().revoked_at);
 const caps=await(await call('capabilities')).json();assert.equal(caps.photosEnabled,false);
 assert.ok(f.sqlite.prepare("SELECT COUNT(*) n FROM integration_events WHERE event='authorization_revoked'").get().n>=1);
 }finally{globalThis.fetch=realFetch;}
 }finally{f.sqlite.close();}
});
test('exclusão de unidade pelo root enfileira arquivos do Drive com referência e a limpeza os remove',async()=>{
 const f=collectorFixture(),google=fakeGoogle(),env={DB:f.db,...testEnv()};
 const realFetch=globalThis.fetch;globalThis.fetch=google.fetch;
 try{
 await connect(f,env,google);
 const start=await collectorRoutes(req('/api/collector/visit-start',{unitId:f.ids.pending}),new URL('http://t/api/collector/visit-start'),f.operator,env,f.helpers);const {inspection:i}=await start.json();
 const photoId=crypto.randomUUID();
 const up=await collectorRoutes(new Request('http://t/api/collector/photo-upload',{method:'POST',headers:{'Content-Type':'image/png','X-Photo-Id':photoId,'X-Inspection-Id':i.id,'X-Target-Kind':'facade','X-Target-Id':f.ids.pending},body:png}),new URL('http://t/api/collector/photo-upload'),f.operator,env,f.helpers);assert.equal(up.status,201);
 const ref=f.sqlite.prepare('SELECT storage_ref FROM collection_photos WHERE id=?').get(photoId).storage_ref;assert.ok(google.files.has(ref));
 const store=photoStore(env,{db:f.db,fetchImpl:google.fetch});
 const api=async(path,data)=>{const r=req(path,data);return unitRoutes(r,new URL(r.url),f.root,f.db,{...f.helpers,store});};
 const preview=await(await api('/api/root/unit-delete-preview?id='+f.ids.pending)).json();assert.equal(preview.impact.photos,1);
 // Simula falha de limpeza no momento da exclusão: a fila preserva provedor e referência.
 const failing={...store,delete:async()=>{throw Error('indisponível');}};
 const r=req('/api/root/unit-delete',{id:f.ids.pending,snapshot:preview.snapshot,confirmName:preview.unit.name,reason:'Cadastro de teste isolado'});
 const deleted=await(await unitRoutes(r,new URL(r.url),f.root,f.db,{...f.helpers,store:failing})).json();
 assert.equal(deleted.ok,true);assert.equal(deleted.photosPendingDeletion,1);
 const queued=f.sqlite.prepare('SELECT * FROM photo_deletion_queue').get();assert.equal(queued.storage_provider,'google-drive');assert.equal(queued.storage_ref,ref);
 assert.ok(google.files.has(ref),'arquivo ainda existe enquanto a fila não é processada');
 const cleanup=await(await api('/api/root/photo-cleanup',{})).json();
 assert.equal(cleanup.pending,0);assert.equal(cleanup.provider,'google-drive');assert.ok(!google.files.has(ref));
 }finally{globalThis.fetch=realFetch;f.sqlite.close();}
});
