import test from 'node:test';
import assert from 'node:assert/strict';
import {authFixture,collectorOrigin,temporaryPassword,personalPassword} from './helpers/auth-fixture.mjs';

for(const kind of ['collector','panel'])test(`${kind}: senha definitiva não volta a provisória após sair, entrar e expirar sessão`,async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('FFFF:0\n'));
 const f=await authFixture();t.after(()=>f.sqlite.close());
 const first=await f.login(kind,'operador',temporaryPassword);assert.equal(first.status,200);assert.equal(first.data.redirect,'/conta');
 assert.equal((await f.call(kind,'/api/auth/me',first)).data.mustChange,true);
 const changed=await f.call(kind,'/api/auth/password',{...first,data:{currentPassword:temporaryPassword,password:personalPassword}});assert.equal(changed.status,200);
 assert.equal((await f.call(kind,'/api/auth/me',first)).status,401,'Troca invalida a sessão antiga');
 assert.equal((await f.login(kind,'operador',temporaryPassword)).status,401,'Senha provisória não pode ser reutilizada');
 const second=await f.login(kind,'operador',personalPassword);assert.equal(second.status,200);assert.equal((await f.call(kind,'/api/auth/me',second)).data.mustChange,false);
 assert.equal(second.data.redirect,kind==='collector'?'/':collectorOrigin+'/login?origem=painel');
 assert.equal((await f.call('collector','/api/auth/me',second)).data.mustChange,false,'Os dois Workers consultam a mesma situação no banco');
 f.sqlite.prepare('UPDATE sessions SET expires_at=0 WHERE user_id=?').run(f.operator.id);
 assert.equal((await f.call(kind,'/api/auth/me',second)).status,401);
 const third=await f.login(kind,'operador',personalPassword);assert.equal(third.status,200);assert.equal((await f.call(kind,'/api/auth/me',third)).data.mustChange,false);
 assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM audit WHERE user_id=? AND event='password_changed'").get(f.operator.id).n,1);
 const row=f.sqlite.prepare('SELECT must_change,temporary_expires FROM users WHERE id=?').get(f.operator.id);assert.equal(row.must_change,0);assert.equal(row.temporary_expires,null);
});

test('somente uma redefinição administrativa volta a exigir senha provisória; permissões preservadas',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('FFFF:0\n'));
 const f=await authFixture();t.after(()=>f.sqlite.close());
 f.sqlite.prepare('UPDATE users SET must_change=0,temporary_expires=NULL').run();
 const op=await f.login('collector','operador',temporaryPassword),root=await f.login('panel','root',temporaryPassword);
 assert.equal(root.data.redirect,'/');
 assert.equal((await f.call('panel','/api/admin/reset',{...op,data:{id:f.root.id}})).status,403);
 const reset=await f.call('panel','/api/admin/reset',{...root,data:{id:f.operator.id}});assert.equal(reset.status,200);
 assert.equal((await f.call('collector','/api/auth/me',op)).status,401);
 const login=await f.login('collector','operador',reset.data.temporaryPassword);assert.equal(login.data.redirect,'/conta');assert.equal((await f.call('collector','/api/auth/me',login)).data.mustChange,true);
 const changed=await f.call('collector','/api/auth/password',{...login,data:{currentPassword:reset.data.temporaryPassword,password:personalPassword}});assert.equal(changed.status,200);
 assert.equal((await f.login('collector','operador',personalPassword)).data.redirect,'/');
});

test('duas trocas concorrentes não registram sucesso falso nem encerram a sessão criada com a senha vencedora',async t=>{
 const f=await authFixture();t.after(()=>f.sqlite.close());
 const initial=await f.login('collector','operador',temporaryPassword);
 let releaseSlow,enteredSlow;const slowEntered=new Promise(r=>enteredSlow=r),slowGate=new Promise(r=>releaseSlow=r);let batches=0;const originalBatch=f.db.batch.bind(f.db);
 // Segurar o primeiro UPDATE, sem depender de consulta externa de senhas.
 t.mock.method(f.db,'batch',async statements=>{if(++batches===1){enteredSlow();await slowGate;}return originalBatch(statements);});
 const losing=f.call('collector','/api/auth/password',{...initial,data:{currentPassword:temporaryPassword,password:'TESTE ISOLADO senha perdedora 2026!'}});
 await slowEntered;
 const winning=await f.call('collector','/api/auth/password',{...initial,data:{currentPassword:temporaryPassword,password:personalPassword}});assert.equal(winning.status,200);
 const current=await f.login('collector','operador',personalPassword);assert.equal(current.status,200);
 releaseSlow();assert.equal((await losing).status,409);
 assert.equal((await f.call('collector','/api/auth/me',current)).status,200,'Tentativa vencida não invalida a sessão nova');
 assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM audit WHERE user_id=? AND event='password_changed'").get(f.operator.id).n,1);
});

test('senha atual incorreta e senha nova inválida não alteram credencial nem registram troca',async t=>{
 const f=await authFixture();t.after(()=>f.sqlite.close());
 const first=await f.login('collector','operador',temporaryPassword);
 const invalid=await f.call('collector','/api/auth/password',{...first,data:{currentPassword:'INCORRETA',password:personalPassword}});assert.equal(invalid.status,403);
 const short=await f.call('collector','/api/auth/password',{...first,data:{currentPassword:temporaryPassword,password:'curta'}});assert.equal(short.status,400);
 assert.equal((await f.call('collector','/api/auth/me',first)).data.mustChange,true);
 assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM audit WHERE event='password_changed'").get().n,0);
});

test('root, admin e visualizador continuam no painel com senha definida',async t=>{
 const f=await authFixture();t.after(()=>f.sqlite.close());
 for(const role of ['root','admin','visualizador']){
  f.sqlite.prepare('UPDATE users SET role=?,must_change=0,temporary_expires=NULL WHERE id=?').run(role,f.root.id);
  const login=await f.login('panel','root',temporaryPassword);assert.equal(login.status,200);assert.equal(login.data.redirect,'/');
  const me=await f.call('panel','/api/auth/me',login);assert.equal(me.data.mustChange,false);assert.equal(me.data.canView,true);
 }
});

test('D-096 root define provisória, campos inválidos não criam conta e permissões continuam no servidor',async t=>{
 const f=await authFixture();t.after(()=>f.sqlite.close());f.sqlite.prepare('UPDATE users SET must_change=0,temporary_expires=NULL').run();
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('Não deve consultar serviço externo');});
 const root=await f.login('panel','root',temporaryPassword),op=await f.login('collector','operador',temporaryPassword);
 const payload={username:'teste.criacao',role:'operador',displayName:'TESTE ISOLADO',temporaryPassword:'123456'};
 assert.equal((await f.call('panel','/api/admin/create',{...op,data:payload})).status,403);
 assert.equal((await f.call('panel','/api/admin/create',{...root,csrf:'invalido',data:payload})).status,403);
 for(const value of [undefined,null,123456,'','12345','a'.repeat(257)])assert.equal((await f.call('panel','/api/admin/create',{...root,data:{...payload,temporaryPassword:value}})).status,400);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM users').get().n,2);
 const created=await f.call('panel','/api/admin/create',{...root,data:payload});assert.equal(created.status,201);assert.equal(created.data.temporaryPassword,'123456');assert.equal(created.data.expiresIn,86400);
 const row=f.sqlite.prepare('SELECT * FROM users WHERE username=?').get(payload.username);assert.equal(row.must_change,1);assert.notEqual(row.password_hash,'123456');assert.ok(row.temporary_expires>Date.now());
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM audit WHERE event LIKE 'user_created:%'").get().n,1);
 assert.equal((await f.call('panel','/api/admin/create',{...root,data:payload})).status,409);
 f.sqlite.prepare("UPDATE users SET role='admin' WHERE id=?").run(f.root.id);assert.equal((await f.call('panel','/api/admin/create',{...root,data:{...payload,username:'nao.permitido'}})).status,403);
 assert.equal(calls,0);
});

for(const kind of ['panel','collector'])test(`D-096 ${kind}: seis caracteres, troca obrigatória, validação no servidor e reentrada`,async t=>{
 const f=await authFixture();t.after(()=>f.sqlite.close());f.sqlite.prepare('UPDATE users SET must_change=0,temporary_expires=NULL WHERE id=?').run(f.root.id);
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('Sem dependência externa');});
 const root=await f.login('panel','root',temporaryPassword),username='teste.seis';
 const created=await f.call('panel','/api/admin/create',{...root,data:{username,role:kind==='panel'?'visualizador':'operador',temporaryPassword:'654321'}});assert.equal(created.status,201);
 const first=await f.login(kind,username,'654321');assert.equal(first.data.redirect,'/conta');assert.equal((await f.call(kind,'/api/auth/me',first)).data.mustChange,true);
 assert.equal((await f.call(kind,'/api/units',first)).status,403);
 for(const password of ['12345','654321'])assert.equal((await f.call(kind,'/api/auth/password',{...first,data:{currentPassword:'654321',password}})).status,400);
 const changed=await f.call(kind,'/api/auth/password',{...first,data:{currentPassword:'654321',password:'abcdef'}});assert.equal(changed.status,200);assert.equal((await f.call(kind,'/api/auth/me',first)).status,401);
 assert.equal((await f.login(kind,username,'654321')).status,401);const next=await f.login(kind,username,'abcdef');assert.equal(next.status,200);assert.equal((await f.call(kind,'/api/auth/me',next)).data.mustChange,false);
 assert.equal((await f.call(kind,'/api/units',{cookie:next.cookie})).status,200);assert.equal(calls,0);
});
