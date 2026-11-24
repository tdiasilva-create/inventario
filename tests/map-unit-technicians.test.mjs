import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers/dispatch-fixture.mjs';
import {session} from './helpers/agent-client.mjs';
import {cleanDispatchPositions} from '../server/technical-dispatch.mjs';
import {readDispatchMap,dispatchMapAssignmentsSql} from '../server/dispatch-road-routing.mjs';
import {mapUnitTechnicians,unitTechniciansText} from '../web/map-unit-technicians.js';

test('D132: nomes por unidade/usuário, deduplicação, aceite e estados de leitura explícitos',()=>{
 const routes=[{unit_id:'u',user_id:'b',technician_name:'Bruno',accepted:0},{unit_id:'u',user_id:'a',technician_name:'Ana',accepted:0},{unit_id:'u',user_id:'a',technician_name:'Ana',accepted:1},{unit_id:'v',user_id:'c',technician_name:'Ana',accepted:0}];
 const units=mapUnitTechnicians(routes),state={enabled:true,ready:true,units};
 assert.deepEqual(units.get('u'),[{name:'Ana',accepted:true},{name:'Bruno',accepted:false}]);
 assert.equal(unitTechniciansText(state,'u',3),'Técnicos designados: Ana; Bruno\nAceite confirmado: Ana');
 assert.equal(unitTechniciansText(state,'v',1),'Técnico designado: Ana');
 assert.equal(unitTechniciansText(state,'none',1),'Técnico ainda não designado.');
 assert.equal(unitTechniciansText(state,'none',0),'');
 assert.equal(unitTechniciansText({enabled:false,ready:true,units},'u',3),'');
 assert.match(unitTechniciansText({enabled:true},'u',1),/consultando/);
 assert.equal(unitTechniciansText({enabled:true,error:true},'u',1),'Designações: consulta indisponível.');
 assert.match(unitTechniciansText({...state,error:true},'u',3),/última leitura; atualização indisponível/);
 assert.throws(()=>mapUnitTechnicians(null));assert.throws(()=>mapUnitTechnicians([{}]));
 assert.equal(mapUnitTechnicians([...routes,{unit_id:'u',user_id:'other',technician_name:'Ana',accepted:0}]).get('u').length,3,'homônimos continuam sendo pessoas distintas');
});

test('D132: designação sem GPS, aceite por tarefa e permanência após expirar sessão',async()=>{const f=await setup();try{
 await f.enable();await f.enable(f.root);const first=await f.task(),next=await f.task();
 await f.assign(first,[f.root.id,f.operator.id]);await f.assign(next);
 const read=async()=>{const r=await f.call('/api/dispatch/map');assert.equal(r.status,200);return r.data;};
 let map=await read();assert.equal(map.positions.length,0);assert.equal(map.routes.length,3);assert.ok(map.routes.every(r=>r.accepted===0));
 assert.equal((await f.accept(first)).status,200);map=await read();assert.deepEqual(map.routes.filter(r=>r.accepted).map(r=>[r.user_id,r.id]),[[f.operator.id,first]]);
 f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.operator.id);await cleanDispatchPositions(f.db);
 map=await read();assert.equal(map.positions.length,0);assert.equal(map.routes.find(r=>r.id===first&&r.user_id===f.operator.id).accepted,1,'D126 independe da validade do GPS/sessão');
 await f.assign(first,[f.root.id]);map=await read();assert.ok(map.routes.every(r=>!r.accepted));
 assert.equal(map.routes.filter(r=>r.id===first).length,1);assert.equal(map.routes.find(r=>r.id===first).user_id,f.root.id);
}finally{f.sqlite.close();}});

test('D132: nomes apenas de atribuições atuais, contas habilitadas e demandas ativas',async()=>{const f=await setup();try{
 await f.enable();await f.enable(f.root);const id=await f.task();await f.assign(id,[f.operator.id,f.root.id]);
 const read=async()=>(await f.call('/api/dispatch/map')).data.routes;
 f.sqlite.prepare("UPDATE users SET display_name='TESTE · Nome atualizado' WHERE id=?").run(f.operator.id);
 assert.equal((await read()).find(r=>r.user_id===f.operator.id).technician_name,'TESTE · Nome atualizado');
 f.sqlite.prepare('UPDATE users SET active=0 WHERE id=?').run(f.operator.id);assert.equal((await read()).length,1);
 f.sqlite.prepare('UPDATE users SET active=1 WHERE id=?').run(f.operator.id);f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=0 WHERE user_id=?').run(f.operator.id);assert.equal((await read()).length,1);
 await f.assign(id,[]);assert.equal((await read()).length,0);
 await f.assign(id,[f.root.id]);f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(id);assert.equal((await read()).length,0);
 const deleted=await f.task();await f.assign(deleted,[f.root.id]);const p=await f.call('/api/operations/request-delete-preview?id='+deleted);
 const r=await f.call('/api/operations/request-delete',{id:deleted,version:p.data.request.version,revision:p.data.revision,operationId:crypto.randomUUID(),reason:'TESTE ISOLADO',confirm:true});assert.equal(r.status,200);assert.equal((await read()).length,0);
}finally{f.sqlite.close();}});

test('D132: endpoint continua exclusivo do root, sem novo lote ou varredura de aceites',async()=>{const f=await setup();try{
 await f.enable();const id=await f.task();await f.assign(id);await f.accept(id);
 let batches=0,statements=0;const db={...f.db,batch:async list=>{batches++;statements+=list.length;return f.db.batch(list);}};
 assert.equal((await readDispatchMap(db)).routes.length,1);assert.equal(batches,1);assert.equal(statements,3);
 const plan=f.sqlite.prepare('EXPLAIN QUERY PLAN '+dispatchMapAssignmentsSql).all().map(r=>r.detail).join('\n');
 assert.match(plan,/SEARCH activity USING INDEX sqlite_autoindex_dispatch_service_activity_1 \(user_id=\?\) LEFT-JOIN/);assert.doesNotMatch(plan,/SCAN activity/);
 for(const role of ['admin','visualizador','operador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.operator.id);const s=await session(f,{...f.operator,role});assert.equal((await f.call('/api/dispatch/map',undefined,s)).status,403);}
 f.env.APP_KIND='collector';assert.equal((await f.call('/api/dispatch/map')).status,403);delete f.env.APP_KIND;
 f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.root.id);assert.equal((await f.call('/api/dispatch/map')).status,401);
}finally{f.sqlite.close();}});
