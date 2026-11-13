import test from 'node:test';import assert from 'node:assert/strict';
import {authFixture,temporaryPassword} from './helpers/auth-fixture.mjs';
import {session} from './helpers/agent-client.mjs';
import {setup} from './helpers/dispatch-fixture.mjs';
test('D115: one mobile login; permissions remain independent from technician enablement',async()=>{
 const f=await authFixture();try{
  f.sqlite.prepare('UPDATE users SET must_change=0').run();
  let login=await f.call('panel','/api/auth/login',{data:{username:'operador',password:temporaryPassword,application:'mobile'}});
  assert.equal(login.status,200);assert.equal(login.data.redirect,'/app');
  const op={cookie:login.cookie,csrf:(await f.call('panel','/api/auth/me',{cookie:login.cookie})).data.csrf};
  let me=await f.call('panel','/api/mobile/me',op);assert.equal(me.data.collect,true);assert.equal(me.data.technician,false);
  assert.equal((await f.call('panel','/api/technician/queue',op)).status,403);
  assert.equal((await f.call('panel','/app/coleta',op)).status,200);
  assert.equal((await f.call('panel','/api/root/units',op)).status,403);
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);
  me=await f.call('panel','/api/mobile/me',op);assert.equal(me.data.collect,false);
  assert.equal((await f.call('panel','/app/coleta',op)).status,403);
  assert.equal((await f.call('panel','/api/mobile/units',op)).status,403);
  assert.equal((await f.call('panel','/api/collector/start',{...op,data:{unitId:f.ids.pending}})).status,403);
  assert.equal((await f.call('panel','/api/auth/login',{data:{username:'operador',password:temporaryPassword,application:'mobile'}})).status,403);
  f.sqlite.prepare('INSERT INTO dispatch_technicians(user_id,enabled,updated_by,updated_at) VALUES(?,1,?,?)').run(f.operator.id,f.root.id,Date.now());
  me=await f.call('panel','/api/mobile/me',op);assert.equal(me.data.technician,true);assert.equal(me.data.collect,false);
  assert.equal((await f.call('panel','/api/technician/queue',op)).status,200);
  assert.equal((await f.call('panel','/api/collector/start',{...op,data:{unitId:f.ids.pending}})).status,403);
 }finally{f.sqlite.close();}
});
test('D115: mandatory password, revoked sessions, same-origin embedding and CSRF remain enforced',async()=>{
 const f=await authFixture();try{
  assert.equal((await f.call('panel','/app')).status,200);
  let r=await f.call('panel','/app/coleta');assert.equal(r.status,302);assert.equal(r.response.headers.get('Location'),'/app');
  const s=await session(f,f.operator);f.sqlite.prepare('UPDATE users SET must_change=1 WHERE id=?').run(f.operator.id);
  assert.equal((await f.call('panel','/api/mobile/me',s)).data.mustChange,true);
  assert.equal((await f.call('panel','/api/mobile/units',s)).status,403);
  f.sqlite.prepare('UPDATE users SET must_change=0').run();
  r=await f.call('panel','/app/coleta/v3',s);assert.equal(r.status,200);assert.equal(r.response.headers.get('X-Frame-Options'),'SAMEORIGIN');assert.match(r.response.headers.get('Content-Security-Policy'),/frame-ancestors 'self'/);
  r=await f.call('panel','/api/collector/start',{cookie:s.cookie,data:{unitId:f.ids.pending}});assert.equal(r.status,403);
  f.sqlite.prepare('DELETE FROM sessions').run();assert.equal((await f.call('panel','/api/mobile/me',s)).status,401);
  assert.equal((await f.call('collector','/app')).status,302,'independent collector never serves the application');
 }finally{f.sqlite.close();}
});
test('D115: switching modules cannot terminate a queue tracking capability; collection never creates tracking',async()=>{
 const f=await setup();try{
  const id=await f.task();await f.enable();await f.assign(id);await f.accept(id);
  assert.equal((await f.call('/api/mobile/me',undefined,f.os)).data.collect,true);
  assert.equal((await f.call('/api/mobile/me',undefined,f.os)).data.technician,true);
  assert.equal((await f.call('/api/mobile/units',undefined,f.os)).status,200);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking').get().n,0,'read-only entry cannot start queue tracking');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_attendances WHERE ended_at IS NULL').get().n,1);
 }finally{f.sqlite.close();}
});
