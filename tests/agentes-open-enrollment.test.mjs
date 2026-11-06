import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {agentIdentity,machinePost,heartbeatBody,inventoryBody,session,humanFetch,summary} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {D1Store} from '../server/agentes/nucleo/d1-store.mjs';
import {MemoryStore} from '../server/agentes/nucleo/store.mjs';
import {createApp} from '../server/agentes/nucleo/worker.mjs';
import {OPEN_ENROLLMENT,OPEN_PENDING_TTL_MS} from '../server/agentes/nucleo/enrollment-policy.mjs';
import {manutencaoAgentes} from '../server/agentes/index.mjs';
const origin='https://isolado.test',api='/api/agent/v1';
function fixture(){const f=collectorFixture();return {...f,env:{DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector',AGENTES_EXIGIR_AUTORIZACAO:'nao'}};}
async function challenge(f,{headers={},body}={}){const r=await worker.fetch(new Request(origin+api+'/enrollment-challenge',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body??{protocol_version:'1.0',request_id:crypto.randomUUID(),agent_version:'0.1.8'})}),f.env);return {status:r.status,data:await r.json(),headers:r.headers};}
async function register(f,id,ch,extra={}){const r=await machinePost(worker,f.env,origin,id,api+'/enrollments',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:id.installationId,challenge_id:ch.data.challenge_id,challenge:ch.data.challenge,public_key_jwk:id.publicJwk,agent_version:'0.1.8',summary},{scheme:'SEMED-Enroll',subject:ch.data.challenge_id,...extra});if(r.status===201||r.status===200)id.deviceId=r.data.device_id;return r;}
async function enrolled(f){const id=await agentIdentity(),ch=await challenge(f);assert.equal(ch.status,200);const en=await register(f,id,ch);assert.equal(en.status,201,JSON.stringify(en.data));return {id,ch,en};}
async function claim(f,id,en){const op=await session(f,f.operator),call=(p,d)=>humanFetch(worker,f.env,origin,op,p,d);const i=(await call('/api/collector/v3-start',{unitId:f.ids.pending})).data.inspection;const eq=crypto.randomUUID();const saved=await call('/api/collector/equipment-save',{id:eq,inspectionId:i.id,draft:true,data:{category:'computer',mode:'Individual',quantity:1,registration:'Agente',environmentName:'TESTE ISOLADO · Secretaria',position_label:'Mesa 1',assetStatus:'Sem patrimônio',operation:'Funcionando'}});assert.equal(saved.status,201,JSON.stringify(saved));const lock=(await call('/api/collector/equipment-lock',{id:eq,inspectionId:i.id})).data.token;const body={request_id:crypto.randomUUID(),enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending,environment_id:saved.data.environment.id,inspection_id:i.id,equipment:{mode:'existing',equipment_id:eq,expected_version:saved.data.version},position:{label:'Mesa 1'},lock_token:lock};
 const anon=await worker.fetch(new Request(origin+api+'/pairings/claim',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)}),f.env);assert.equal(anon.status,401);
 assert.equal((await humanFetch(worker,f.env,origin,op,api+'/pairings/claim',body,{noCsrf:true})).status,403);
 const r=await call(api+'/pairings/claim',body);assert.equal(r.status,201,JSON.stringify(r));return {eq,op,i,r};}
test('A: cadastro sem autorização, QR e vínculo V3; telemetria só após operador autenticado vincular',async()=>{const f=fixture();try{
 const {id,en}=await enrolled(f);assert.equal(en.data.state,'pending_pairing');assert.match(en.data.pairing_code,/^[A-Za-z0-9_-]{22}$/);
 assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_install_grants').get().n,0);
 assert.equal(f.sqlite.prepare('SELECT grant_id FROM agent_enrollments').get().grant_id,OPEN_ENROLLMENT);
 for(const [path,body] of [['heartbeat',heartbeatBody(id,{sequence:1})],['inventory',inventoryBody(id,{sequence:2})]]){const r=await machinePost(worker,f.env,origin,id,api+'/'+path,body);assert.equal(r.status,403);assert.equal(r.data.code,'DEVICE_NOT_LINKED');}
 const {eq,op,r}=await claim(f,id,en);
 const confirm=await machinePost(worker,f.env,origin,id,api+'/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:id.installationId,link_id:r.data.link_id});assert.equal(confirm.status,200,JSON.stringify(confirm.data));
 for(const [path,body] of [['heartbeat',heartbeatBody(id,{sequence:3})],['inventory',inventoryBody(id,{sequence:4})]]){const r=await machinePost(worker,f.env,origin,id,api+'/'+path,body);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.accepted,true);assert.equal(r.data.message_id,body.message_id);const again=await machinePost(worker,f.env,origin,id,api+'/'+path,body);assert.equal(again.data.duplicate,true);}
 const root=await session(f,f.root);const status=await humanFetch(worker,{...f.env,APP_KIND:'painel'},origin,root,'/api/inventory/agent-status?equipmentId='+eq);assert.equal(status.status,200);assert.ok(status.data);
 const devices=await humanFetch(worker,f.env,origin,root,'/api/root/agent-devices');assert.equal(devices.data.enrollment_policy.require_install_grant,false);assert.equal(devices.data.items[0].equipment.id,eq);
 assert.equal((await humanFetch(worker,f.env,origin,root,'/api/root/agent-install-grants',{expires_in_seconds:3600})).data.code,'INSTALL_GRANT_NOT_REQUIRED');
 assert.equal((await humanFetch(worker,f.env,origin,op,'/api/root/agent-devices')).status,403);
 }finally{f.sqlite.close();}});
test('A: resposta perdida e desafio vencido recuperam o mesmo ID, sem autorização ou duplicação',async()=>{const f=fixture();try{
 const {id,ch,en}=await enrolled(f);assert.equal((await register(f,id,ch)).status,200);
 f.sqlite.prepare('UPDATE agent_enrollment_challenges SET expires_at=? WHERE challenge_id=?').run('2000-01-01T00:00:00Z',ch.data.challenge_id);
 assert.equal((await register(f,id,ch)).data.code,'CHALLENGE_EXPIRED');
 const retry=await register(f,id,await challenge(f));assert.equal(retry.status,200);assert.equal(retry.data.device_id,en.data.device_id);assert.equal(retry.data.renew_required,true);
 const renewed=await machinePost(worker,f.env,origin,id,api+'/enrollment-renew',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:id.installationId});assert.equal(renewed.status,200,JSON.stringify(renewed.data));assert.ok(renewed.data.pairing_code);
 assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_devices').get().n,1);
 const other=await agentIdentity();other.installationId=id.installationId;assert.equal((await register(f,other,await challenge(f))).data.code,'IDENTITY_CONFLICT');
 const root=await session(f,f.root);await humanFetch(worker,f.env,origin,root,'/api/root/agent-revoke',{device_id:id.deviceId,reason:'TESTE ISOLADO'});
 assert.equal((await register(f,id,await challenge(f))).data.code,'REVOKED');assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_devices').get().n,1);
 }finally{f.sqlite.close();}});
test('A: assinatura, desafio de uso único, corpo e limite por IP continuam obrigatórios',async()=>{const f=fixture();try{
 const id=await agentIdentity(),ch=await challenge(f),bad=await register(f,id,ch,{tamperSignature:true});assert.equal(bad.status,401);
 assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_devices').get().n,0);assert.equal((await register(f,id,ch)).status,201);
 const second=await agentIdentity();assert.equal((await register(f,second,ch)).data.code,'CHALLENGE_USED');assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_devices').get().n,1);
 const invalid=await challenge(f,{body:{protocol_version:'1.0',request_id:crypto.randomUUID(),agent_version:'0.1.8',grant_id:OPEN_ENROLLMENT}});assert.equal(invalid.status,422);
 f.sqlite.prepare('INSERT INTO agent_rate_limits(rate_key,count,window_start) VALUES(?,?,?)').run('challenge-ip:192.0.2.40',599,Date.now());
 assert.equal((await challenge(f,{headers:{'CF-Connecting-IP':'192.0.2.40'}})).status,200);
 const limit=await challenge(f,{headers:{'CF-Connecting-IP':'192.0.2.40'}});assert.equal(limit.status,429);assert.ok(Number(limit.headers.get('retry-after'))>0);
 const open=await challenge(f);f.env.AGENTES_EXIGIR_AUTORIZACAO='sim';assert.equal((await challenge(f)).status,401);assert.equal((await register(f,await agentIdentity(),open)).data.code,'GRANT_REQUIRED');
 }finally{f.sqlite.close();}});
test('A: 200 máquinas no mesmo IP recebem identidades distintas sem consumir lotes',async()=>{const f=fixture();try{const ids=new Set(),codes=new Set();for(let n=0;n<200;n++){const {id,en}=await enrolled(f);ids.add(id.deviceId);codes.add(en.data.pairing_code);}assert.equal(ids.size,200);assert.equal(codes.size,200);assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_install_grants').get().n,0);assert.equal(f.sqlite.prepare('SELECT count(*) n FROM equipments').get().n,0);f.sqlite.prepare('UPDATE agent_enrollments SET created_at=?').run('2000-01-01T00:00:00Z');assert.equal((await manutencaoAgentes(f.env)).expired_pending,200);assert.equal(f.sqlite.prepare("SELECT count(*) n FROM agent_audit_log WHERE action='open_enrollment_expired'").get().n,200);}finally{f.sqlite.close();}});
test('A: expiração em 30 dias revoga apenas cadastros abertos nunca vinculados, com auditoria e sem exclusão',async()=>{const f=fixture();try{
 const young=await enrolled(f),old=await enrolled(f),linked=await enrolled(f),legacy=await enrolled(f);await claim(f,linked.id,linked.en);
 const oldDate=new Date(Date.now()-OPEN_PENDING_TTL_MS-10000).toISOString();
 for(const x of [old,linked,legacy]) f.sqlite.prepare('UPDATE agent_enrollments SET created_at=? WHERE device_id=?').run(oldDate,x.id.deviceId);
 f.sqlite.prepare('UPDATE agent_enrollments SET grant_id=? WHERE device_id=?').run(crypto.randomUUID(),legacy.id.deviceId);
 const maintenance=await manutencaoAgentes(f.env);assert.equal(maintenance.expired_pending,1);
 const state=id=>f.sqlite.prepare('SELECT state FROM agent_devices WHERE device_id=?').get(id.deviceId).state;
 assert.equal(state(old.id),'revoked');assert.equal(state(young.id),'pending_pairing');assert.equal(state(linked.id),'linked');assert.equal(state(legacy.id),'pending_pairing');
 assert.equal(f.sqlite.prepare('SELECT count(*) n FROM agent_devices').get().n,4);
 assert.equal(f.sqlite.prepare("SELECT count(*) n FROM agent_audit_log WHERE action='open_enrollment_expired'").get().n,1);
 assert.equal((await manutencaoAgentes(f.env)).expired_pending,0);
 assert.equal((await register(f,old.id,await challenge(f))).data.code,'REVOKED');
 const accessed=await enrolled(f);f.sqlite.prepare('UPDATE agent_enrollments SET created_at=? WHERE device_id=?').run(oldDate,accessed.id.deviceId);
 const poll=await machinePost(worker,f.env,origin,accessed.id,api+'/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:accessed.id.installationId});assert.equal(poll.data.code,'REVOKED');
 const forClaim=await enrolled(f);f.sqlite.prepare('UPDATE agent_enrollments SET created_at=? WHERE device_id=?').run(oldDate,forClaim.id.deviceId);
 const op=await session(f,f.operator);assert.equal((await humanFetch(worker,f.env,origin,op,api+'/pairings/preview',{enrollment_id:forClaim.en.data.enrollment_id,pairing_code:forClaim.en.data.pairing_code,unit_id:f.ids.pending})).data.code,'DEVICE_REVOKED');
 }finally{f.sqlite.close();}});
test('A: corrida entre expiração e vínculo não revoga máquina que acabou de ser vinculada',async()=>{const f=fixture();try{
 const {id}=await enrolled(f);f.sqlite.prepare('UPDATE agent_enrollments SET created_at=? WHERE device_id=?').run('2000-01-01T00:00:00Z',id.deviceId);
 const original=f.db.batch;f.db.batch=async stmts=>{f.sqlite.prepare("UPDATE agent_devices SET state='linked' WHERE device_id=?").run(id.deviceId);return original(stmts);};
 assert.equal(await new D1Store(f.db).expireOpenPendingDevice(id.deviceId,Date.now()),false);
 assert.equal(f.sqlite.prepare('SELECT state FROM agent_devices WHERE device_id=?').get(id.deviceId).state,'linked');assert.equal(f.sqlite.prepare('SELECT status FROM agent_keys WHERE key_id=?').get(id.keyId).status,'active');
 }finally{f.sqlite.close();}});
test('A: adaptador em memória mantém o mesmo contrato; não é usado na produção',async()=>{const store=new MemoryStore(),app=createApp({store,config:{requireInstallGrant:false}}),f={env:{}};const r=await app.fetch(new Request(origin+api+'/enrollment-challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({protocol_version:'1.0',request_id:crypto.randomUUID(),agent_version:'0.1.8'})}));const ch={data:await r.json()},id=await agentIdentity();const en=await machinePost(app,f.env,origin,id,api+'/enrollments',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:id.installationId,challenge_id:ch.data.challenge_id,challenge:ch.data.challenge,public_key_jwk:id.publicJwk,agent_version:'0.1.8',summary},{scheme:'SEMED-Enroll',subject:ch.data.challenge_id});assert.equal(en.status,201,JSON.stringify(en.data));assert.equal(store.grants.size,0);assert.equal(store.expireOpenPendingDevice(en.data.device_id,Date.now()+OPEN_PENDING_TTL_MS+1000),true);});
