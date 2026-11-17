import test from 'node:test';
import assert from 'node:assert/strict';
import {unitAgentGroups,findAgentUnits} from '../web/unit-agent-overview.js';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {serviceDeskRoutes,fleetCatalogueSql,fleetMembersSql,fleetContactsSql} from '../server/service-desk.mjs';

const fleet=async f=>{const u=new URL('https://teste.invalid/api/operations/units');return(await serviceDeskRoutes(new Request(u),u,f.root,{DB:f.db},f.helpers)).json();};
test('D127: cada unidade uma vez, todos os tipos do escopo e busca local por nome sem acentos',()=>{
 const units=[{id:'a',name:'EM Árvore',unit_type:'Escola municipal'},{id:'b',name:'Sede',unit_type:'Unidade administrativa'},{id:'c',name:'Escola antiga',active:0},{id:'d',name:'Conveniada',unit_type:'Escola conveniada'}];
 const data={units:units.map(u=>({id:u.id,computers:10,linked:u.id==='a'?3:0,online:0}))};
 const groups=unitAgentGroups([...units,units[0]],data);
 assert.equal(groups.linked.length,1);assert.equal(groups.linked[0].linked,3);assert.deepEqual(groups.unlinked.map(u=>u.id),['c','b']);
 assert.equal(unitAgentGroups([units[1]],data).unlinked.length,1,'catálogo já filtrado define o escopo');
 assert.deepEqual(findAgentUnits(groups.linked,' ARVORE '),groups.linked);assert.equal(findAgentUnits(groups.linked,'nome ausente').length,0);
});
test('D127: falha, duplicidade e resposta parcial nunca viram ausência de vínculo',()=>{
 const units=[{id:'a',name:'TESTE'}];
 for(const data of [null,{}, {units:[]},{units:[{id:'a',computers:2}]},{units:[{id:'a',computers:2,linked:-1}]},{units:[{id:'a',computers:2,linked:3}]},{units:[{id:'a',computers:2,linked:'1'}]},{units:[{id:'a',computers:2,linked:1},{id:'a',computers:2,linked:1}]}])assert.throws(()=>unitAgentGroups(units,data));
 assert.deepEqual(unitAgentGroups([],{units:[]}),{linked:[],unlinked:[]});
});
test('D127: vínculo atual inclui offline/sem contato e parcial, exclui encerrado/revogado e não muda SQL recorrente',async()=>{
 const f=collectorFixture();try{
  const s=seedEquipmentConsultation(f),queries=[],prepare=f.db.prepare.bind(f.db);f.db.prepare=sql=>{queries.push(sql);return prepare(sql);};
  let data=await fleet(f);assert.equal(data.units.find(u=>u.id===s.unit).linked,1);
  assert.ok(queries.includes(fleetCatalogueSql));assert.ok(queries.includes(fleetMembersSql));
  queries.length=0;await fleet(f);assert.equal(queries.length,3,'mesmas três consultas aquecidas: revisão, presença e demandas');assert.ok(queries.includes(fleetContactsSql));
  assert.equal(queries.some(sql=>/INSERT|UPDATE|DELETE/.test(sql)),false);
  f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:'2020-01-01T00:00:00Z'}),s.device);
  data=await fleet(f);assert.equal(data.units.find(u=>u.id===s.unit).online,0);assert.equal(data.units.find(u=>u.id===s.unit).linked,1);
  f.sqlite.prepare("UPDATE agent_presence SET data_json='{}' WHERE device_id=?").run(s.device);assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).linked,1);
  f.sqlite.prepare("UPDATE agent_devices SET state='revoked' WHERE device_id=?").run(s.device);assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).linked,0);
  f.sqlite.prepare("UPDATE agent_devices SET state='linked' WHERE device_id=?").run(s.device);
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),s.device);assert.equal((await fleet(f)).units.find(u=>u.id===s.unit).linked,0);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,linked_by,linked_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),s.device,s.draft,f.root.id,new Date().toISOString());
  data=await fleet(f);assert.equal(data.units.find(u=>u.id===s.unit).linked,1,'vínculo de cadastro parcial também conta');
  assert.equal(data.units.find(u=>u.id===f.ids.assigned).linked,0,'unidade sem computadores também é listada');
 }finally{f.sqlite.close();}
});
