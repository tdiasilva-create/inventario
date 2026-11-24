import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers/dispatch-fixture.mjs';
import {insertMapRoute} from '../server/map-route-planner.mjs';
import {humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {random} from '../server/security.mjs';
import {cleanDispatchPositions} from '../server/technical-dispatch.mjs';
async function fixture(){const f=await setup();await f.enable();f.sqlite.exec('DELETE FROM dispatch_notifications');f.sqlite.prepare("UPDATE units SET latitude=-2.53,longitude=-44.1,unit_type='Escola municipal' WHERE active=1").run();f.payload=()=>f.cmd({technicianId:f.operator.id,stops:[{unitId:f.ids.pending,description:'TESTE · revisão da rede',kind:'Visita técnica'},{unitId:f.ids.progress,description:'TESTE · manutenção',kind:'Manutenção'}]});f.create=a=>f.call('/api/dispatch/map-route-create',a||f.payload());return f;}
test('D130: nova sequência precede pendências e preserva atendimento fora de ordem e posições',async()=>{const f=await fixture();try{
 const other=await f.task(),pending=await f.task(),active=await f.task();await f.assign(pending);await f.assign(active);assert.equal((await f.accept(active)).status,200);
 const before=f.sqlite.prepare('SELECT * FROM dispatch_positions').all();const a=f.payload(),r=await f.create(a);assert.equal(r.status,201,JSON.stringify(r.data));
 const queue=(await f.call('/api/technician/queue',undefined,f.os)).data;assert.deepEqual(queue.items.map(r=>r.id),[active,...r.data.requests.map(r=>r.id),pending]);
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM dispatch_positions').all(),before);assert.equal(f.sqlite.prepare('SELECT ended_at FROM dispatch_attendances').get().ended_at,null);
 assert.equal(f.sqlite.prepare('SELECT request_id FROM dispatch_order ORDER BY position LIMIT 1').get().request_id,other);
 const options=(await f.call('/api/dispatch/map-route-options?technicianId='+f.operator.id)).data;assert.equal(options.active.id,active);assert.equal(options.pending,4);
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM service_request_events WHERE note='Demanda criada e atribuída pela rota do mapa.'").get().n,2);
}finally{f.sqlite.close();}});
test('D130: resposta perdida, envio simultâneo e rollback integral',async()=>{const f=await fixture();try{
 const a=f.payload(),rs=await Promise.all([f.create(a),f.create(a)]);assert.deepEqual(rs.map(r=>r.status).sort(),[200,201],JSON.stringify(rs));assert.deepEqual(rs[0].data.requests,rs[1].data.requests);
 assert.equal((await f.create({...a,stops:a.stops.slice().reverse()})).status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,2);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_notifications').get().n,2);
 f.sqlite.exec("CREATE TRIGGER test_rollback BEFORE INSERT ON dispatch_assignments BEGIN SELECT RAISE(ABORT,'TEST'); END;");assert.equal((await f.create()).status,503);
 for(const table of ['service_requests','service_request_events','dispatch_assignments','dispatch_notifications'])assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM '+table).get().n,2,table);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_receipts WHERE operation_id=?').get(a.operationId).n,1);
}finally{f.sqlite.close();}});
test('D130: root, CSRF, revisões, campos e elegibilidade revalidados na transação',async()=>{const f=await fixture();try{
 const a=f.payload();assert.equal((await f.call('/api/dispatch/map-route-create',a,f.os)).status,403);assert.equal((await humanFetch(worker,f.env,'https://teste.invalid',f.rs,'/api/dispatch/map-route-create',a,{noCsrf:true})).status,403);
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.operator.id);assert.equal((await f.call('/api/dispatch/map-route-options',undefined,f.os)).status,403);}
 f.env.APP_KIND='collector';assert.equal((await f.create()).status,403);delete f.env.APP_KIND;
 for(const patch of [{stops:[]},{stops:[a.stops[0],a.stops[0]]},{stops:[{...a.stops[0],description:' '}]},{stops:[{...a.stops[0],kind:'inventado'}]},{technicianId:'x'}])assert.equal((await f.create({...a,...patch})).status,400);
 await f.task();assert.equal((await f.create(a)).status,409);f.sqlite.prepare('UPDATE units SET latitude=NULL WHERE id=?').run(f.ids.pending);assert.equal((await f.create()).status,409);f.sqlite.prepare('UPDATE units SET latitude=-2.53 WHERE id=?').run(f.ids.pending);
 const original=f.db.batch;let batches=0;f.db.batch=async stmts=>{if(++batches===2)f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);return original(stmts);};assert.equal((await f.create()).status,409);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);
}finally{f.sqlite.close();}});
test('D130: prévia usa apenas coordenadas, ordem escolhida e gate compartilhado; não cria demandas',async()=>{const f=await fixture();try{
 f.sqlite.prepare('UPDATE units SET longitude=-44.12 WHERE id=?').run(f.ids.progress);let sent;
 f.env.ROUTING_FETCH=async(url,options)=>{sent={url,options};return Response.json({code:'Ok',waypoints:[{location:[-44.1,-2.53]},{location:[-44.12,-2.53]}],routes:[{distance:2500,duration:300,legs:[{}],geometry:{type:'LineString',coordinates:[[-44.1,-2.53],[-44.11,-2.54],[-44.12,-2.53]]}}]});};
 const a=f.payload(),r=await f.call('/api/dispatch/map-route-preview',{stops:a.stops.map(s=>({unitId:s.unitId}))});assert.equal(r.data.status,'ready',JSON.stringify(r.data));assert.ok(sent.url.startsWith('https://routing.openstreetmap.de/routed-car/route/v1/driving/-44.100000,-2.530000;-44.120000,-2.530000'));assert.equal(sent.options.redirect,'manual');assert.ok(!sent.url.includes(f.operator.id));
 assert.equal((await f.call('/api/dispatch/map-route-preview',{stops:a.stops})).data.status,'waiting');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);
 f.sqlite.exec('UPDATE dispatch_routing_gate SET next_at=0');f.env.ROUTING_FETCH=async()=>new Response(null,{status:302,headers:{location:'https://invalid.example'}});assert.equal((await f.call('/api/dispatch/map-route-preview',{stops:a.stops})).data.status,'unavailable');
}finally{f.sqlite.close();}});
test('D130: ordenação conserva outras pendências e não duplica o atendimento ativo',()=>{
 const q=[{id:'a'},{id:'b',assigned:1},{id:'c'},{id:'d',assigned:1,started:1},{id:'e',assigned:1}];assert.deepEqual(insertMapRoute(q,['n1','n2']),['a','d','n1','n2','b','c','e']);assert.deepEqual(insertMapRoute(q.map(r=>({...r,assigned:0})),['n']),['a','b','c','d','e','n']);
});
test('D130: GPS contínuo e outro técnico na mesma demanda sobrevivem à inclusão; limite de ruas e corpo UTF-8',async()=>{const f=await fixture();try{
 await f.enable(f.root);const active=await f.task();await f.assign(active,[f.operator.id,f.root.id]);const key={id:crypto.randomUUID(),token:random()};
 assert.equal((await f.call('/api/technician/accept',f.cmd({id:active,version:f.ver(active),position:{latitude:-2.53,longitude:-44.1,accuracy:10,observedAt:Date.now()},tracking:key}),f.os)).status,200);
 const before=f.sqlite.prepare('SELECT * FROM dispatch_tracking_positions').all();
 f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.operator.id);await cleanDispatchPositions(f.db);
 assert.equal((await f.call('/api/dispatch/map-route-options?technicianId='+f.operator.id)).data.active.id,active,'aceite operacional D126 sobrevive à sessão expirada');
 const r=await f.create();assert.equal(r.status,201,JSON.stringify(r.data));assert.deepEqual(f.sqlite.prepare('SELECT * FROM dispatch_tracking_positions').all(),before);assert.equal(f.sqlite.prepare('SELECT ended_at FROM dispatch_tracking').get().ended_at,null);
 assert.equal(f.sqlite.prepare('SELECT request_id FROM dispatch_order ORDER BY position LIMIT 1').get().request_id,active);
 assert.equal(f.sqlite.prepare('SELECT open_count FROM dispatch_open_counts WHERE user_id=?').get(f.operator.id).open_count,3);assert.equal(f.sqlite.prepare('SELECT open_count FROM dispatch_open_counts WHERE user_id=?').get(f.root.id).open_count,1);
 const stops=[];for(let i=0;i<97;i++){const id=crypto.randomUUID();f.sqlite.prepare("INSERT INTO units(id,name,name_key,active,latitude,longitude,unit_type,created_at,updated_at) VALUES(?,?,?,1,-2.53,-44.1,'Escola municipal',?,?)").run(id,'TESTE '+i,'route-test-'+i,Date.now(),Date.now());stops.push({unitId:id,description:'á'.repeat(2000),kind:'Visita técnica'});}
 assert.equal((await f.create({...f.payload(),stops})).status,409,'total 100 excede o provedor');
 assert.equal((await f.create({...f.payload(),stops:stops.slice(0,96)})).status,201,'99 demandas na fila e corpo UTF-8 superior a 16KiB');
 assert.equal(f.sqlite.prepare('SELECT open_count FROM dispatch_open_counts WHERE user_id=?').get(f.operator.id).open_count,99);
}finally{f.sqlite.close();}});
