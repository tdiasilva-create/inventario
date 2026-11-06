import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {fakeGoogle,testEnv} from './helpers/fake-drive.mjs';
import {digest} from '../server/security.mjs';
import worker from '../server/worker.mjs';
// Exercita o Worker completo (cookies, CSRF, ordem das rotas) com Google simulado. Sem rede e sem dados reais.
test('worker: start exige sessão root, callback funciona sem cookie de sessão e status/teste respeitam CSRF',async()=>{
 const f=collectorFixture(),google=fakeGoogle();
 const token='a'.repeat(64),csrf='csrf-isolado';
 f.sqlite.prepare('UPDATE users SET must_change=0 WHERE id=?').run(f.root.id);
 f.sqlite.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at,created_at,credential_version,user_agent) VALUES(?,?,?,?,?,?,?)').run(await digest(token),f.root.id,csrf,Date.now()+3600000,Date.now(),0,'teste');
 const env={DB:f.db,AUTH_PEPPER:'pepper-isolado',ASSETS:{fetch:async()=>new Response('asset')},...testEnv()};
 const origin='https://painel.test',cookie='__Host-semed='+token;
 const realFetch=globalThis.fetch;globalThis.fetch=google.fetch;
 try{
 // Sem sessão: 401 no start; callback com estado inválido responde página de erro, não 401.
 assert.equal((await worker.fetch(new Request(origin+'/api/root/google/start'),env)).status,401);
 const bogus=await worker.fetch(new Request(origin+'/api/root/google/callback?state='+'b'.repeat(64)+'&code=x'),env);assert.equal(bogus.status,400);assert.match(await bogus.text(),/não reconhecida/);
 // Root inicia: redirecionamento ao Google com cookie Lax de curta duração.
 const start=await worker.fetch(new Request(origin+'/api/root/google/start',{headers:{Cookie:cookie}}),env);
 assert.equal(start.status,302);const location=new URL(start.headers.get('Location'));assert.equal(location.hostname,'accounts.google.com');assert.equal(location.searchParams.get('redirect_uri'),origin+'/api/root/google/callback');
 const oauthCookie=start.headers.get('Set-Cookie');assert.match(oauthCookie,/__Host-semed-oauth=[a-f0-9]{64}; Path=\/; Secure; HttpOnly; SameSite=Lax/);
 // Retorno do Google: somente o cookie Lax acompanha (o de sessão é Strict). Deve concluir mesmo assim.
 const cb=await worker.fetch(new Request(origin+'/api/root/google/callback?code=CODE-VALIDO&state='+location.searchParams.get('state'),{headers:{Cookie:oauthCookie.split(';')[0]}}),env);
 assert.equal(cb.status,200);assert.match(cb.headers.get('Content-Type'),/text\/html/);assert.match(await cb.text(),/Google Drive conectado/);assert.match(cb.headers.get('Set-Cookie'),/Max-Age=0/);
 // Status autenticado; POST sem CSRF é recusado; com CSRF executa o teste de envio.
 const status=await worker.fetch(new Request(origin+'/api/root/google/status',{headers:{Cookie:cookie}}),env);assert.equal(status.status,200);assert.equal((await status.json()).connected,true);
 assert.equal((await worker.fetch(new Request(origin+'/api/root/google/test',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:'{}'}),env)).status,403);
 const run=await worker.fetch(new Request(origin+'/api/root/google/test',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf},body:'{}'}),env);
 assert.equal(run.status,200);assert.equal((await run.json()).ok,true);
 // No coletor as rotas não existem.
 assert.equal((await worker.fetch(new Request(origin+'/api/root/google/status',{headers:{Cookie:cookie}}),{...env,APP_KIND:'collector'})).status,404);
 }finally{globalThis.fetch=realFetch;f.sqlite.close();}
});
