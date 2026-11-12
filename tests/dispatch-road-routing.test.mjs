import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers/dispatch-fixture.mjs';
import {routeResponse} from './helpers/routing-provider.mjs';
import {cleanDispatchPositions} from '../server/technical-dispatch.mjs';
async function prepared(){
 const f=await setup();await f.enable();f.tasks=[];f.calls=[];
 for(const [i,key] of ['pending','progress','blocked'].entries()){
  const id=await f.task();f.tasks.push(id);f.sqlite.prepare('UPDATE service_requests SET unit_id=? WHERE id=?').run(f.ids[key],id);
  f.sqlite.prepare('UPDATE units SET latitude=?,longitude=? WHERE id=?').run(-2.535+i*.003,-44.165+i*.004,f.ids[key]);await f.assign(id);
 }
 await f.accept(f.tasks[1]);
 f.env.ROUTING_FETCH=async(url,options)=>{f.calls.push({url,options});return routeResponse(url);};
 f.route=()=>f.call('/api/dispatch/road-route?technician='+f.operator.id);
 f.unlock=()=>f.sqlite.prepare('UPDATE dispatch_routing_gate SET next_at=0,lease_until=0').run();
 return f;
}
test('D106: ruas partem do GPS e respeitam estritamente o root, mesmo com aceite fora de ordem; cache compartilhado',async()=>{const f=await prepared();try{
 const r=await f.route();assert.equal(r.status,200);assert.equal(r.data.status,'ready');assert.deepEqual(r.data.requestIds,f.tasks);assert.deepEqual(r.data.origin,[-2.54,-44.17]);assert.ok(r.data.geometry.coordinates.length>4);
 const request=f.calls[0];assert.match(request.url,/routed-car\/route\/v1\/driving\/-44.170000,-2.540000;/);assert.doesNotMatch(request.url,/trip|TESTE|root|operador/);assert.match(request.options.headers['User-Agent'],/SEMED/);
 assert.equal((await f.route()).data.cached,true);assert.equal(f.calls.length,1);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_road_routes').get().n,1);
 assert.equal((await f.call('/api/dispatch/map')).data.positions[0].routeKey,r.data.routeKey);
}finally{f.sqlite.close();}});
test('D106: reordenar/editar destino invalida cache e muda a sequência sem otimização',async()=>{const f=await prepared();try{
 const first=await f.route();await f.call('/api/dispatch/move',f.cmd({id:f.tasks[2],beforeId:f.tasks[0]}));f.unlock();
 const second=await f.route();assert.deepEqual(second.data.requestIds,[f.tasks[2],f.tasks[0],f.tasks[1]]);assert.notEqual(first.data.routeKey,second.data.routeKey);
 f.sqlite.prepare('UPDATE units SET latitude=-2.53 WHERE id=?').run(f.ids.blocked);f.unlock();assert.notEqual((await f.route()).data.routeKey,second.data.routeKey);assert.equal(f.calls.length,3);
}finally{f.sqlite.close();}});
test('D106: limite global de provedor e resposta tardia após retirada/conclusão não ressuscitam GPS',async()=>{const f=await prepared();try{
 let release;f.env.ROUTING_FETCH=url=>{f.calls.push(url);return new Promise(resolve=>{release=()=>resolve(routeResponse(url));});};
 const pending=f.route();while(!release)await new Promise(r=>setTimeout(r,1));assert.equal((await f.route()).data.status,'waiting');assert.equal(f.calls.length,1);
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(f.tasks[1]);release();assert.equal((await pending).data.status,'changed');assert.equal((await f.route()).data.code,'NO_POSITION');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_road_routes').get().n,0);
}finally{f.sqlite.close();}});
test('D106: falha/NoRoute/geometria inválida são explícitos, sem linhas retas de fallback',async()=>{const f=await prepared();try{
 for(const respond of [()=>{throw Error('offline');},()=>Response.json({code:'NoRoute'}),()=>new Response('busy',{status:429}),url=>{const x=routeResponse(url);return x.json().then(v=>{v.waypoints.reverse();return Response.json(v);});}]){
  f.env.ROUTING_FETCH=respond;f.sqlite.exec('DELETE FROM dispatch_road_routes');f.unlock();const r=await f.route();assert.equal(r.data.status,'unavailable');assert.equal(r.data.geometry,undefined);assert.ok(r.data.expiresAt>Date.now());
 }
}finally{f.sqlite.close();}});
test('D106: unidade sem coordenadas bloqueia a sequência inteira, sem pular paradas',async()=>{const f=await prepared();try{
 f.sqlite.prepare('UPDATE units SET latitude=NULL WHERE id=?').run(f.ids.progress);const r=await f.route();assert.equal(r.data.code,'MISSING_COORDINATES');assert.equal(r.data.requestNumbers.length,1);assert.equal(f.calls.length,0);
}finally{f.sqlite.close();}});
test('D106: sessão/perfil/coletor e posição expirada não recebem cache nem chamam provedor',async()=>{const f=await prepared();try{
 await f.route();assert.equal((await f.call('/api/dispatch/road-route?technician='+f.operator.id,undefined,f.os)).status,403);
 f.env.APP_KIND='collector';assert.equal((await f.route()).status,403);delete f.env.APP_KIND;
 f.sqlite.prepare('UPDATE dispatch_positions SET observed_at=?,received_at=?').run(Date.now()-181000,Date.now()-181000);assert.equal((await f.route()).data.code,'NO_POSITION');await cleanDispatchPositions(f.db);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_road_routes').get().n,0);assert.equal(f.calls.length,1);
}finally{f.sqlite.close();}});
test('D106: deslocamento relevante e expiração recalculam; logout apaga a última rota',async()=>{const f=await prepared();try{
 await f.route();f.unlock();f.sqlite.prepare('UPDATE dispatch_positions SET latitude=latitude+0.001').run();let r=await f.route();assert.equal(r.data.cached,false);assert.equal(f.calls.length,2);
 f.sqlite.prepare('UPDATE dispatch_road_routes SET expires_at=0').run();f.unlock();await f.route();assert.equal(f.calls.length,3);
 await f.call('/api/auth/logout',{},f.os);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_road_routes').get().n,0);assert.equal((await f.route()).data.code,'NO_POSITION');
}finally{f.sqlite.close();}});
test('D106: nova ordem durante consulta invalida resultado antes da entrega',async()=>{const f=await prepared();try{
 let release;f.env.ROUTING_FETCH=url=>new Promise(resolve=>{release=()=>resolve(routeResponse(url));});const pending=f.route();while(!release)await new Promise(r=>setTimeout(r,1));
 await f.call('/api/dispatch/move',f.cmd({id:f.tasks[2],beforeId:f.tasks[0]}));release();assert.equal((await pending).data.status,'changed');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_road_routes').get().n,0);
}finally{f.sqlite.close();}});
