import test from 'node:test';
import assert from 'node:assert/strict';
import {unitEquipmentMapFixture} from './helpers/unit-equipment-map.mjs';
import {unitEquipmentMapRead} from '../server/unit-equipment-map.mjs';
import {equipmentRead} from '../server/inventory-equipment.mjs';
import {networkTestRoutes} from '../server/agent-network-tests.mjs';
import {collectorRoutes} from '../server/collector.mjs';

function setup(t){const f=unitEquipmentMapFixture();t.after(()=>f.sqlite.close());const env={DB:f.db,APP_KIND:'panel',AGENT_NETWORK_TESTS_PROVIDER:'cloudflare'},helpers={...f.helpers,unit:async id=>f.sqlite.prepare('SELECT * FROM units WHERE id=? AND active=1').get(id)};
 const call=(handler,query='',role='root',method='GET',environment=env)=>{const request=new Request('https://isolated.test/api/inventory/unit-equipment-map?unitId='+f.unit+'&'+query,{method});return handler(request,new URL(request.url),role?{...f.root,role}:null,environment,helpers);};
 return {...f,env,helpers,call};}
test('setores: atuais/parciais, ambientes vazios, lotes, órfãos e isolamento por ID sem writes',async t=>{
 const f=setup(t),changes=f.sqlite.prepare('SELECT total_changes() n').get().n;
 const map=await(await f.call(unitEquipmentMapRead)).json();
 assert.equal(map.records,60);assert.equal(map.items,67);assert.equal(map.source,'current');assert.equal(map.sectors.length,4);
 const second=map.sectors.find(r=>r.id===f.second),room=map.sectors.find(r=>r.id===f.room);
 assert.equal(second.records,2);assert.equal(room.records,56);assert.equal(room.items,63);
 assert.equal(map.sectors.find(r=>r.id===f.empty).records,0);assert.equal(map.sectors.find(r=>r.id==='unassigned').records,2);
 assert.ok(!map.sectors.some(r=>r.id===f.foreign));
 const read=async query=>(await f.call(equipmentRead,'scope=current&'+query)).json();
 const page1=await read('sectorId='+f.room),page2=await read('sectorId='+f.room+'&offset=50');
 assert.equal(page1.items.length,50);assert.equal(page2.items.length,6);assert.equal(page2.nextOffset,null);
 assert.equal(new Set([...page1.items,...page2.items].map(i=>i.id)).size,56);
 assert.ok([...page1.items,...page2.items].some(i=>i.id===f.draft&&i.record_partial));
 assert.equal(page1.items[0].photo_id,f.firstPhoto);assert.equal(page1.items[0].network_test_capable,true);
 assert.deepEqual(new Set((await read('sectorId='+f.second)).items.map(i=>i.id)),new Set([f.moved,f.printer]));
 assert.deepEqual(new Set((await read('sectorId=unassigned')).items.map(i=>i.id)),new Set([f.notebook,f.orphan]));
 assert.equal((await read('sectorId='+f.empty)).total,0);assert.equal((await read('sectorId='+f.foreign)).total,0);
 const exact=await read('equipmentId='+f.moved);assert.equal(exact.items.length,1);assert.equal(exact.items[0].data.position_label,'PC 01');assert.equal(exact.items[0].data.environment,f.second);
 const official=await(await f.call(equipmentRead,'environmentId='+f.room)).json();assert.ok(official.items.some(i=>i.id===f.moved),'published query retains old location');
 assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,changes);
});
test('setores: permissões, GET, unidade ativa, escopo e filtros rejeitados',async t=>{
 const f=setup(t);
 for(const role of ['root','admin','visualizador'])assert.equal((await f.call(unitEquipmentMapRead,'',role)).status,200);
 assert.equal((await f.call(unitEquipmentMapRead,'',null)).status,401);
 assert.equal((await f.call(unitEquipmentMapRead,'','operador')).status,403);
 assert.equal((await f.call(unitEquipmentMapRead,'','root','POST')).status,405);
 assert.equal((await f.call(unitEquipmentMapRead,'','root','GET',{...f.env,APP_KIND:'collector'})).status,403);
 for(const query of ['scope=published&sectorId='+f.room,'scope=current&sectorId=oops','equipmentId=oops'])assert.equal((await f.call(equipmentRead,query)).status,400);
 assert.equal((await f.call(collectorRoutes)).status,200,'route connected');
 f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.unit);assert.equal((await f.call(unitEquipmentMapRead)).status,403);
});
test('setores: unidade sem equipamentos, nomes iguais não geram vínculos e plano usa índices por unidade',async t=>{
 const f=setup(t);
 const req=new Request('https://isolated.test/api/inventory/unit-equipment-map?unitId='+f.ids.assigned);
 const map=await(await unitEquipmentMapRead(req,new URL(req.url),f.root,f.env,f.helpers)).json();
 assert.equal(map.records,0);assert.equal(map.sectors.length,1);assert.equal(map.sectors[0].id,f.foreign);
 const plan=f.sqlite.prepare('EXPLAIN QUERY PLAN SELECT e.id FROM inventory_equipment_all e WHERE e.unit_id=?').all(f.unit);
 assert.ok(plan.filter(r=>r.detail.includes('SEARCH')&&r.detail.includes('unit_id=?')).length>=2,JSON.stringify(plan));
});
test('atalho de velocidade seleciona ID exato, não agenda teste e mantém exclusividade root',async t=>{
 const f=setup(t),before=f.sqlite.prepare('SELECT total_changes() n').get().n;
 const get=async(id,role='root')=>{const r=new Request('https://isolated.test/api/root/network-tests/computers?equipmentId='+id);return networkTestRoutes(r,new URL(r.url),{...f.root,role},f.env,f.helpers);};
 const result=await(await get(f.items[0].id)).json();assert.equal(result.items.length,1);assert.equal(result.items[0].equipment_id,f.items[0].id);assert.equal(result.items[0].capable,true);
 assert.equal((await(await get(f.printer)).json()).items.length,0);
 assert.equal((await get('invalid')).status,400);for(const role of ['admin','visualizador','operador'])assert.equal((await get(f.items[0].id,role)).status,403);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_network_tests').get().n,0);
 assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,before);
});
