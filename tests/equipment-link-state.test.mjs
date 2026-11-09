import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedLinkStates} from './helpers/equipment-link-state.mjs';
import {equipmentRead} from '../server/inventory-equipment.mjs';
import {serviceDeskRoutes} from '../server/service-desk.mjs';
import {collectorRoutes} from '../server/collector.mjs';
import {equipmentLinkState,equipmentLinkBadge} from '../web/equipment-link-state.js';

function setup(){const f=collectorFixture(),s=seedLinkStates(f),env={DB:f.db},helpers={...f.helpers,unit:async id=>f.sqlite.prepare('SELECT * FROM units WHERE id=?').get(id)};
 const call=async(kind,query='',role='root')=>{const path=kind==='official'?'/api/inventory/equipment':'/api/operations/computers',request=new Request('https://teste.invalid'+path+'?unitId='+s.unit+'&'+query);return (kind==='official'?equipmentRead:serviceDeskRoutes)(request,new URL(request.url),{...f.root,role},env,helpers);};return {...f,s,call};}

test('vínculo visual: não confundir ausência, encerramento, manual e comunicação',()=>{
 const cases=[[{category:'desktop',registration:'Manual',agent_linked:true},'linked'],[{category:'desktop',registration:'Agente'},'pending'],[{category:'desktop',registration:'Manual'},'manual'],[{category:'desktop'},'unknown'],[{category:'desktop',registration:'Manual',agent_history:1},'ended'],[{category:'printer',registration:'Manual'},'not_applicable']];
 for(const [data,state]of cases){assert.equal(equipmentLinkState(data),state);const badge=equipmentLinkBadge(data);assert.equal(badge.includes('data-link-state="'+state+'"'),state!=='not_applicable');}
 assert.equal(equipmentLinkState({data:{category:'desktop',registration:'Manual'},agent_linked:1,agent_history:1,presence_state:'no_recent_communication'}),'linked');
 assert.equal(equipmentLinkBadge({data:{category:'desktop',manualReason:'<img onerror=alert(1)>'}}).includes('<img'),false);
});
test('consultas: classificação, filtros em todas as páginas e leitura sem alteração de vínculos/fotos',async()=>{const f=setup();try{
 const before=f.sqlite.prepare('SELECT total_changes() n').get().n;
 for(const kind of ['official','operations']){
  for(const [state,n]of [['linked',0],['pending',2],['ended',3],['unknown',4]]){const r=await f.call(kind,'agent='+state),v=await r.json();assert.equal(r.status,200,JSON.stringify(v));assert.equal(v.total,1);assert.equal(v.items[0].id,f.s.items[n].id);assert.equal(v.items[0].link_state,state);if(state==='linked')assert.equal(v.items[0].presence_state,'no_recent_communication');}
  const manual=await(await f.call(kind,'agent=manual')).json();assert.equal(manual.total,kind==='official'?52:53);assert.ok(manual.items.every(i=>i.link_state==='manual'));
  const all=await(await f.call(kind)).json();assert.ok(all.items.some(i=>i.id===f.s.items[0].id));
  assert.equal((await f.call(kind,'agent=bad')).status,400);assert.equal((await f.call(kind,'','operador')).status,403);
  for(const role of ['root','admin','visualizador'])assert.equal((await f.call(kind,'agent=manual',role)).status,200);
 }
 const last=await(await f.call('official','agent=manual&offset=50')).json();assert.equal(last.items.length,2);assert.equal(last.nextOffset,null);
 const combined=await(await f.call('operations','agent=linked&q=TESTE-PC-001&environmentId='+f.s.room)).json();assert.equal(combined.total,1);
 const noMatch=await(await f.call('operations','agent=manual&q=TESTE-PC-001')).json();assert.equal(noMatch.total,0);
 assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,before);
 }finally{f.sqlite.close();}});
test('rascunhos: vínculo encerrado preservado, oficial não antecipa modo de cadastro parcial',async()=>{const f=setup();try{
 const open=crypto.randomUUID(),now=Date.now();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(open,f.s.unit,f.root.id,now,now);
 f.sqlite.prepare('UPDATE equipments SET inspection_id=? WHERE id IN (?,?)').run(open,f.s.items[0].id,f.s.items[3].id);
 const req=new Request('https://teste.invalid/api/inventory/in-progress-equipment?id='+open),response=await collectorRoutes(req,new URL(req.url),f.root,{DB:f.db},f.helpers),v=await response.json();assert.equal(response.status,200,JSON.stringify(v));
 assert.equal(equipmentLinkState(v.items.find(x=>x.id===f.s.items[3].id)),'ended');assert.equal(equipmentLinkState(v.items.find(x=>x.id===f.s.items[0].id)),'linked');
 f.sqlite.prepare("UPDATE equipments SET data_json=json_set(data_json,'$.registration','Agente') WHERE id=?").run(f.s.items[1].id);
 const pub=await(await f.call('official','q='+f.s.items[1].id)).json(),partial=await(await f.call('operations','q='+f.s.items[1].id)).json();assert.equal(pub.items[0].link_state,'manual');assert.equal(partial.items[0].link_state,'pending');assert.equal(partial.items[0].partial,true);
 }finally{f.sqlite.close();}});
