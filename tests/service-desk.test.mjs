import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
async function fixture(){const f=collectorFixture(),seed=seedEquipmentConsultation(f),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'},root=await session(f,f.root);return {...f,seed,env,rootSession:root,call:(path,data,auth=root,extra={})=>humanFetch(worker,env,'https://teste.invalid',auth,'/api/operations/'+path,data,extra)};}
function request(f,extra={}){return {id:crypto.randomUUID(),operationId:crypto.randomUUID(),version:0,unitId:f.seed.unit,equipmentId:null,description:'TESTE ISOLADO · teclado e mouse com defeito',kind:'Manutenção',source:'Telefone',requester:'TESTE solicitante',status:'Aberta',responsible:'',scheduledDate:'',note:'',...extra};}
test('central: unidade sem computadores, equipamento correto, histórico e reenvio sem duplicar',async()=>{const f=await fixture();try{
 const payload=request(f,{unitId:f.ids.inactive});assert.equal((await f.call('request-save',payload)).status,404);
 payload.unitId=f.ids.progress;let r=await f.call('request-save',payload);assert.equal(r.status,201,JSON.stringify(r.data));const first=r.data.request;assert.equal(first.number,1);assert.equal(first.equipment_id,null);
 r=await f.call('request-save',payload);assert.equal(r.status,200);assert.equal(r.data.replayed,true);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);
 assert.equal((await f.call('request-save',{...payload,description:'alterado'})).status,409);
 assert.equal((await f.call('request-save',request(f,{unitId:f.ids.progress,equipmentId:f.seed.items[0].id}))).status,422);
 const linked=request(f,{equipmentId:f.seed.items[0].id});r=await f.call('request-save',linked);assert.equal(r.status,201,JSON.stringify(r.data));assert.equal(r.data.request.context.hostname,'TESTE-PC-001');
 const update={...linked,version:1,status:'Aguardando material',note:'TESTE · aguardando teclado',operationId:crypto.randomUUID()};assert.equal((await f.call('request-save',update)).status,200);
 assert.equal((await f.call('request-save',{...update,operationId:crypto.randomUUID()})).status,409);
 assert.equal((await f.call('request-save',{...update,version:2,status:'Concluída',note:'',operationId:crypto.randomUUID()})).status,400);
 r=await f.call('request-save',{...update,version:2,status:'Concluída',note:'TESTE · substituídos teclado e mouse',operationId:crypto.randomUUID()});assert.equal(r.status,200,JSON.stringify(r.data));
 r=await f.call('requests?id='+linked.id);assert.equal(r.data.events.length,3);assert.equal(r.data.events[0].snapshot.status,'Concluída');assert.match(r.data.events[0].note,/substituídos/);
 assert.equal((await f.call('requests')).data.total,1);assert.equal((await f.call('requests?status=all')).data.total,2);
}finally{f.sqlite.close();}});
test('central: permissões servidor, CSRF e separação do coletor',async()=>{const f=await fixture();try{const op=await session(f,f.operator);
 assert.equal((await f.call('units',undefined,op)).status,403);assert.equal((await f.call('request-save',request(f),op)).status,403);
 assert.equal((await f.call('request-save',request(f),f.rootSession,{noCsrf:true})).status,403);
 f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.operator.id);assert.equal((await f.call('units',undefined,op)).status,200);assert.equal((await f.call('request-save',request(f),op)).status,403);
 f.sqlite.prepare("UPDATE users SET role='admin' WHERE id=?").run(f.operator.id);assert.equal((await f.call('request-save',request(f),op)).status,201);
 f.env.APP_KIND='collector';assert.equal((await f.call('units')).status,403);
}finally{f.sqlite.close();}});
test('computadores: todas as unidades, zero separado de desconhecido, laboratórios explícitos e paginação',async()=>{const f=await fixture();try{
 let r=await f.call('units');assert.equal(r.status,200,JSON.stringify(r.data));let u=r.data.units.find(u=>u.id===f.seed.unit);assert.equal(u.computers,57);assert.equal(u.online,1);assert.equal(u.unlinked,56);
 assert.ok(r.data.units.find(u=>u.id===f.ids.progress));assert.equal(r.data.units.find(u=>u.id===f.ids.progress).computer_declaration,null);
 const zero={targetId:f.ids.progress,unitId:f.ids.progress,kind:'unit',value:'none',version:0};assert.equal((await f.call('context',zero)).status,200);assert.equal((await f.call('context',zero)).status,409);
 assert.equal((await f.call('context',{...zero,targetId:f.seed.unit,unitId:f.seed.unit})).status,409);
 r=await f.call('computers?unitId='+f.seed.unit);assert.equal(r.data.total,57);assert.equal(r.data.items.length,57);assert.equal(r.data.environments[0].classification,null);assert.ok(r.data.items.find(e=>e.id===f.seed.draft).partial);
 assert.equal((await f.call('context',{targetId:f.seed.room,unitId:f.seed.unit,kind:'environment',value:'laboratory',version:0})).status,200);
 r=await f.call('computers?unitId='+f.seed.unit+'&q=TESTE-PC-001');assert.equal(r.data.total,1);assert.equal(r.data.items[0].hostname,'TESTE-PC-001');assert.equal(r.data.environments[0].classification,'laboratory');
 assert.equal((await f.call('computers?unitId='+f.seed.unit+'&allEquipment=1')).data.total,59);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM computer_context_events').get().n,2);
}finally{f.sqlite.close();}});
test('comunicação muda sem fechar demanda manual; histórico sobrevive remoção da unidade',async()=>{const f=await fixture();try{
 const p=request(f,{equipmentId:f.seed.items[0].id});assert.equal((await f.call('request-save',p)).status,201);
 const old=new Date(Date.now()-3600000).toISOString();f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:old}),f.seed.device);
 let r=await f.call('units');assert.equal(r.data.units.find(u=>u.id===f.seed.unit).lost,1);
 f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:new Date().toISOString()}),f.seed.device);
 r=await f.call('units');assert.equal(r.data.units.find(u=>u.id===f.seed.unit).online,1);assert.equal((await f.call('requests?id='+p.id)).data.request.status,'Aberta');
 // Snapshot uses recorded context, never a join that hides a request after a root deletion.
 f.sqlite.exec('PRAGMA foreign_keys=OFF');f.sqlite.prepare('DELETE FROM units WHERE id=?').run(f.seed.unit);r=await f.call('requests?id='+p.id);assert.equal(r.status,200);assert.match(r.data.request.context.unit_name,/TESTE/);
}finally{f.sqlite.close();}});
test('volume: mais de mil computadores, paginação completa e demandas acima de 50',async()=>{const f=await fixture();try{
 const source=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(f.seed.items[1].id),columns=Object.keys(source),insert=f.sqlite.prepare('INSERT INTO equipments('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')');
 for(let n=0;n<1000;n++){const copy={...source,id:crypto.randomUUID(),position_label:'TESTE · computador '+n};insert.run(...columns.map(k=>copy[k]));}
 let r=await f.call('units');assert.equal(r.data.units.find(u=>u.id===f.seed.unit).computers,1057);
 let offset=0,seen=new Set();do{r=await f.call('computers?unitId='+f.seed.unit+'&offset='+offset);assert.equal(r.status,200);assert.ok(r.data.items.length<=60);for(const i of r.data.items){assert.ok(!seen.has(i.id));seen.add(i.id);}offset=r.data.nextOffset;}while(offset!==null);assert.equal(seen.size,1057);
 for(let n=0;n<52;n++)assert.equal((await f.call('request-save',request(f,{description:'TESTE ISOLADO · demanda '+n}))).status,201);
 r=await f.call('requests');assert.equal(r.data.items.length,50);assert.equal(r.data.total,52);assert.equal((await f.call('requests?offset=50')).data.items.length,2);assert.equal((await f.call('queue-summary')).data.pending,52);
}finally{f.sqlite.close();}});
test('transação: falha no histórico reverte gravação e permite repetir o comando',async()=>{const f=await fixture();try{
 const original=f.env.DB.batch;let failOnce=true;f.env.DB.batch=async statements=>{if(failOnce){failOnce=false;return original([...statements,f.env.DB.prepare("SELECT missing_column FROM service_requests")]);}return original(statements);};
 const data=request(f);assert.equal((await f.call('request-save',data)).status,503);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);
 assert.equal((await f.call('request-save',data)).status,201);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events').get().n,1);
 assert.equal((await f.call('request-save',request(f,{scheduledDate:'2026-13-01'}))).status,400);
}finally{f.sqlite.close();}});
