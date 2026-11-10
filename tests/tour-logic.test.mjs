import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
async function setup(){const f=collectorFixture(),s=seedEquipmentConsultation(f),env={DB:f.db,AUTH_PEPPER:'TEST'},root=await session(f,f.root);return {...f,s,env,rootUser:f.root,root,call:(path,auth=root,data)=>humanFetch(worker,env,'https://teste.invalid',auth,path,data)};}
test('D082 rede: mesma classificação, unidades distintas, paginação, permissões e nenhuma escrita',async()=>{const f=await setup();try{
 const source=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(f.s.items[1].id),cols=Object.keys(source),insert=f.sqlite.prepare('INSERT INTO equipments('+cols.join(',')+') VALUES('+cols.map(()=>'?')+')');
 // Two distinct unit IDs deliberately have the same label; grouping must never merge them.
 f.sqlite.prepare('UPDATE units SET name=(SELECT name FROM units WHERE id=?) WHERE id=?').run(f.s.unit,f.ids.progress);
 for(let n=0;n<75;n++){const row={...source,id:crypto.randomUUID(),unit_id:f.ids.progress};insert.run(...cols.map(k=>row[k]));}
 const now=new Date().toISOString();for(const [i,reason,ago]of [[1,'periodic',3600000],[2,'shutdown',3600000],[3,'suspend',3600000],[4,null,null]]){const device=crypto.randomUUID();f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,now);f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),device,f.s.items[i].id,f.s.visit,f.rootUser.id,now);if(reason){const contact=new Date(Date.now()-ago).toISOString();f.sqlite.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(device,JSON.stringify({last_live_contact_at:contact,last_reason:reason,last_reason_at:contact}),now);}}
 const totals=(await f.call('/api/operations/units')).data.units.reduce((c,u)=>{for(const k of Object.keys(c))c[k]+=u[k];return c;},{computers:0,online:0,lost:0,unlinked:0,other:0});
 assert.equal(totals.computers,132);assert.equal(totals.computers,totals.online+totals.lost+totals.unlinked+totals.other);
 for(const state of ['online','lost','unlinked','other']){let off=0,seen=new Set();do{const r=await f.call('/api/operations/computers?presence='+state+'&offset='+off);assert.equal(r.status,200);assert.equal(r.data.total,totals[state]);assert.ok(r.data.items.length<=60);for(const row of r.data.items){assert.ok(!seen.has(row.id));seen.add(row.id);assert.ok(row.unit_name);assert.ok(!('presence_json' in row));}off=r.data.nextOffset;}while(off!==null);assert.equal(seen.size,totals[state]);}
 for(const query of ['','presence=invalid','presence=lost&offset=-1','presence=lost&unitId=invalid'])assert.equal((await f.call('/api/operations/computers?'+query)).status,400);
 const op=await session(f,f.operator);assert.equal((await f.call('/api/operations/computers?presence=lost',op)).status,403);for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.operator.id);assert.equal((await f.call('/api/operations/computers?presence=lost',op)).status,200);}f.env.APP_KIND='collector';assert.equal((await f.call('/api/operations/computers?presence=lost')).status,403);
 }finally{f.sqlite.close();}});
test('D082 ambiente: filtro usa localização publicada, sem antecipar movimentação parcial',async()=>{const f=await setup();try{
 const other=crypto.randomUUID();f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(other,f.s.unit,'Outro local de teste','Sala',Date.now(),f.rootUser.id);f.sqlite.prepare('UPDATE equipments SET environment_id=? WHERE id=?').run(other,f.s.items[0].id);
 let r=await f.call('/api/inventory/equipment?unitId='+f.s.unit+'&environmentId='+f.s.room);assert.equal(r.status,200);assert.equal(r.data.total,58);assert.ok(r.data.items.some(e=>e.id===f.s.items[0].id));assert.ok(!r.data.items.some(e=>e.id===f.s.draft));
 assert.equal((await f.call('/api/inventory/equipment?unitId='+f.s.unit+'&environmentId='+crypto.randomUUID())).data.total,0);assert.equal((await f.call('/api/inventory/equipment?unitId='+f.s.unit+'&environmentId=invalid')).status,400);
 }finally{f.sqlite.close();}});
test('D082 salvar demanda inalterada não cria evento nem altera versão, mas uma nota cria histórico',async()=>{const f=await setup();try{
 const payload={id:crypto.randomUUID(),operationId:crypto.randomUUID(),version:0,unitId:f.s.unit,equipmentId:null,kind:'Manutenção',source:'Painel',description:'TESTE ISOLADO',requester:'',responsible:'',status:'Aberta',scheduledDate:'',note:''};assert.equal((await f.call('/api/operations/request-save',f.root,payload)).status,201);
 const same={...payload,version:1,operationId:crypto.randomUUID()};const r=await f.call('/api/operations/request-save',f.root,same);assert.equal(r.status,200);assert.equal(r.data.unchanged,true);assert.equal(r.data.request.version,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events').get().n,1);
 assert.equal((await f.call('/api/operations/request-save',f.root,{...same,note:{}})).status,400);assert.equal((await f.call('/api/operations/request-save',f.root,{...same,note:'Contato com a unidade',operationId:crypto.randomUUID()})).status,200);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events').get().n,2);
 }finally{f.sqlite.close();}});
