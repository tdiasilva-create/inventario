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
 let releaseSlow,enteredSlow;const slowEntered=new Promise(r=>enteredSlow=r),slowGate=new Promise(r=>releaseSlow=r);let checks=0;
 t.mock.method(globalThis,'fetch',async()=>{if(++checks===1){enteredSlow();await slowGate;}return new Response('FFFF:0\n');});
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
