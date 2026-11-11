import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeIp,observeConnection} from '../server/agentes/connection.mjs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {connectionFixture} from './helpers/agent-connection.mjs';
import {session,humanFetch,heartbeatBody,machinePost} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const origin='https://panel.test';
const environment=f=>({DB:f.db,AUTH_PEPPER:'TEST ONLY',APP_KIND:'collector',ASSETS:{fetch:async()=>new Response('asset')}});

test('IPv4/IPv6 normalizados; não aceita portas, listas, HTML ou endereço malformado',()=>{
 assert.equal(normalizeIp('198.51.100.25'),'198.51.100.25');assert.equal(normalizeIp('2001:db8:0:0::1'),'2001:db8::1');
 for(const v of [null,45,'','a'.repeat(100),'999.1.1.1','192.168.1','1.2.3.4:80','1.2.3.4,5.6.7.8','fe80::1%eth0','<img src=x>','2001:xyz::1',' 1.2.3.4 '])assert.equal(normalizeIp(v),null);
});
test('metadados somente da borda: sem CF, sem IP ou subrequest não fabrica conexão',()=>{
 const r=new Request('https://collector.test',{headers:{'CF-Connecting-IP':'198.51.100.25','X-Provider':'FORJADO'}});
 assert.equal(observeConnection(r,'date'),null);Object.defineProperty(r,'cf',{value:{asOrganization:'REDE TESTE',asn:64512}});
 assert.equal(observeConnection(r,'date').provider,'REDE TESTE');r.headers.set('CF-Worker','relay.test');assert.equal(observeConnection(r,'date'),null);r.headers.delete('CF-Worker');r.headers.delete('CF-Connecting-IP');assert.equal(observeConnection(r,'date'),null);
});
test('IPv6 original prevalece sobre pseudo IPv4 e provedor ausente não é herdado',()=>{
 const r=new Request('https://collector.test',{headers:{'CF-Connecting-IP':'240.1.2.3','CF-Connecting-IPv6':'2001:db8::25'}});Object.defineProperty(r,'cf',{value:{asn:'64512'}});
 assert.deepEqual(observeConnection(r,'2026-11-11T12:00:00Z'),{public_ip:'2001:db8::25',ip_version:6,provider:null,asn:null,observed_at:'2026-11-11T12:00:00Z',source:'cloudflare'});
});
test('agente existente comunica sem novo protocolo: persiste e mostra conexão, IP interno separado',async t=>{
 const f=collectorFixture();t.after(()=>f.sqlite.close());const env=environment(f),x=await connectionFixture(f,env),root=await session(f,f.root);
 const before=f.sqlite.prepare('SELECT data_json,published_json FROM equipments WHERE id=?').get(x.items[0].id);
 const r=await x.send(1);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.presence_updated,true);
 assert.deepEqual(Object.keys(r.data).sort(),['accepted','config_version','duplicate','message_id','presence_updated','server_received_at'].sort(),'ACK do instalador inalterado');
 const status=await humanFetch(worker,{...env,APP_KIND:'panel'},origin,root,'/api/inventory/agent-status?equipmentId='+x.items[0].id);
 const p=status.data.agent.presence;assert.equal(status.status,200);assert.equal(p.network_observation.public_ip,'198.51.100.25');assert.equal(p.network_observation.provider,'REDE TESTE ISOLADO');assert.equal(p.network_observation.observed_at,p.last_live_contact_at);
 assert.deepEqual(status.data.agent.current_inventory.sections.network.data.adapters[0].ipv4,['192.168.10.25']);
 assert.deepEqual(f.sqlite.prepare('SELECT data_json,published_json FROM equipments WHERE id=?').get(x.items[0].id),before);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_notifications').get().n,0,'IP não gera alerta de hardware');
 const manual=await humanFetch(worker,env,origin,root,'/api/inventory/agent-status?equipmentId='+x.items[1].id);assert.equal(manual.data.agent,null);
 assert.equal((await worker.fetch(new Request(origin+'/api/inventory/agent-status?equipmentId='+x.items[0].id),env)).status,401);
});
test('mudança de IP/provedor substitui valores; fila antiga, duplicata e assinatura inválida não avançam conexão',async t=>{
 const f=collectorFixture();t.after(()=>f.sqlite.close());const env=environment(f),x=await connectionFixture(f,env);
 const body=heartbeatBody(x.identity,{sequence:2}),path='/api/agent/v1/heartbeat';
 const send=options=>machinePost(worker,env,origin,x.identity,path,body,options);
 assert.equal((await send({ip:'198.51.100.1',cf:{asOrganization:'REDE A',asn:64512}})).status,200);
 const get=()=>JSON.parse(f.sqlite.prepare('SELECT data_json FROM agent_presence WHERE device_id=?').get(x.device).data_json);
 const first=get();assert.equal((await send({ip:'198.51.100.2',cf:{asOrganization:'REDE B'}})).data.duplicate,true);assert.deepEqual(get(),first);
 assert.equal((await x.send(1,{ip:'198.51.100.3'})).data.presence_updated,false);assert.deepEqual(get().network_observation,first.network_observation);
 assert.equal((await x.send(3,{}, {collectedAt:new Date(Date.now()-3600000).toISOString()})).data.presence_updated,false);assert.deepEqual(get().network_observation,first.network_observation);
 assert.equal((await x.send(4,{tamperSignature:true})).status,401);assert.deepEqual(get().network_observation,first.network_observation);
 assert.equal((await x.send(5,{ip:'203.0.113.2',cf:{asn:64513}})).data.presence_updated,true);assert.equal(get().network_observation.public_ip,'203.0.113.2');assert.equal(get().network_observation.provider,null);
 assert.equal((await x.send(6,{cf:undefined})).data.presence_updated,true);assert.equal(get().network_observation,null,'não atribuir IP anterior ao contato novo sem metadados');
});
test('vínculo encerrado e agente revogado não expõem nova conexão nem aceitam heartbeat',async t=>{
 const f=collectorFixture();t.after(()=>f.sqlite.close());const env=environment(f),x=await connectionFixture(f,env),root=await session(f,f.root);
 assert.equal((await x.send(1)).status,200);
 f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),x.device);
 const result=await humanFetch(worker,env,origin,root,'/api/inventory/agent-status?equipmentId='+x.items[0].id);assert.equal(result.data.agent.presence.network_observation,null);
 assert.equal((await x.send(2)).status,403);f.sqlite.prepare("UPDATE agent_devices SET state='revoked' WHERE device_id=?").run(x.device);assert.equal((await x.send(3)).status,403);
});
