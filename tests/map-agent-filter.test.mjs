import test from 'node:test';
import assert from 'node:assert/strict';
import {unitsWithoutInternetAgent} from '../web/map-agent-filter.js';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {serviceDeskRoutes,fleetContactsSql} from '../server/service-desk.mjs';

test('D131: uma capacidade confirmada basta, offline conta; escolas sem agentes e versões antigas permanecem',()=>{
 const units=['mixed','old','none','inactive','contract'].map(id=>({id,name:id,active:id==='inactive'?0:1,unit_type:id==='contract'?'Escola conveniada':'Escola municipal'}));
 const fleet={units:units.map(u=>({id:u.id,linked:u.id==='none'?0:5,internet_test_capable:u.id==='mixed'?1:0,online:0}))};
 assert.deepEqual(unitsWithoutInternetAgent([...units,units[1]],fleet).map(u=>u.id),['old','none']);
 assert.deepEqual(unitsWithoutInternetAgent([units[0]],fleet),[]);
 assert.deepEqual(unitsWithoutInternetAgent([],{units:[]}),[]);
});

test('D131: ausência de leitura ou capacidade inválida não se transforma em unidade sem agente atualizado',()=>{
 const units=[{id:'a',active:1}];
 for(const fleet of [null,{}, {units:[]},{units:[{id:'a',linked:1}]},{units:[{id:'a',linked:1,internet_test_capable:'1'}]},{units:[{id:'a',linked:0,internet_test_capable:1}]},{units:[{id:'a',linked:1,internet_test_capable:-1}]},{units:[{id:'a',linked:1,internet_test_capable:0},{id:'a',linked:1,internet_test_capable:0}]}])assert.throws(()=>unitsWithoutInternetAgent(units,fleet));
});

test('D131: capacidade fresca no mesmo SQL/pulso, sem vínculo encerrado, revogado ou outro equipamento',async()=>{
 const f=collectorFixture();try{
  const s=seedEquipmentConsultation(f),queries=[],prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{queries.push(sql);return prepare(sql);};
  const read=async()=>{const u=new URL('https://teste.invalid/api/operations/units');return (await serviceDeskRoutes(new Request(u),u,f.root,{DB:f.db},f.helpers)).json();};
  const presence=protocol=>f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({agent_version:'0.1.9',network_test_protocol:protocol,last_live_contact_at:'2020-01-01T00:00:00Z'}),s.device);
  let data=await read();assert.equal(data.units.find(u=>u.id===s.unit).internet_test_capable,0);
  presence(1);queries.length=0;data=await read();const unit=data.units.find(u=>u.id===s.unit);assert.equal(unit.internet_test_capable,1);assert.equal(unit.online,0);assert.equal(queries.length,3);assert.ok(queries.includes(fleetContactsSql));assert.equal(queries.some(sql=>/INSERT|UPDATE|DELETE/.test(sql)),false);
  assert.equal(data.units.find(u=>u.id===f.ids.assigned).internet_test_capable,0);
  presence(0);assert.equal((await read()).units.find(u=>u.id===s.unit).internet_test_capable,0,'versão sozinha não comprova suporte');
  presence(1);f.sqlite.prepare("UPDATE agent_devices SET state='revoked' WHERE device_id=?").run(s.device);assert.equal((await read()).units.find(u=>u.id===s.unit).internet_test_capable,0);
  f.sqlite.prepare("UPDATE agent_devices SET state='linked' WHERE device_id=?").run(s.device);f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),s.device);assert.equal((await read()).units.find(u=>u.id===s.unit).internet_test_capable,0);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,linked_by,linked_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),s.device,s.draft,f.root.id,new Date().toISOString());assert.equal((await read()).units.find(u=>u.id===s.unit).internet_test_capable,1,'cadastro parcial também conta');
  f.sqlite.prepare("UPDATE equipments SET category='printer' WHERE id=?").run(s.draft);assert.equal((await read()).units.find(u=>u.id===s.unit).internet_test_capable,0);
 }finally{f.sqlite.close();}
});
