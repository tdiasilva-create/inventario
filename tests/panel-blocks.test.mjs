import test from 'node:test';import assert from 'node:assert/strict';
import {panelBlocksFixture} from './helpers/panel-blocks.mjs';
import {collectorRoutes} from '../server/collector.mjs';
const call=(f,path,role='root',method='GET')=>{const r=new Request('http://test'+path,{method});return collectorRoutes(r,new URL(r.url),{...f.root,role},{DB:f.db},f.helpers);};
test('detalhe oficial: fachada antiga, total real acima de 50, rascunho separado e somente leitura',async()=>{
 const f=panelBlocksFixture();try{
  const before=f.sqlite.prepare('SELECT total_changes() n').get().n;
  for(const role of ['root','admin','visualizador']){
   const r=await call(f,'/api/inventory/unit?unitId='+f.unit,role);assert.equal(r.status,200);const d=await r.json();
   assert.equal(d.photoTotal,57);assert.equal(d.photos.length,50);assert.equal(d.facade.id,f.facade);assert.ok(!d.photos.some(p=>p.id===f.facade));assert.ok(!JSON.stringify(d).includes(f.partial));assert.ok(!JSON.stringify(d).includes('PRIVATE/'));
  }
  assert.equal((await call(f,'/api/inventory/unit?unitId='+f.unit,'operador')).status,403);
  assert.equal((await call(f,'/api/inventory/unit?unitId='+f.unit,'root','POST')).status,405);
  assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,before);
 }finally{f.sqlite.close();}
});
test('acompanhamento parcial devolve vínculo real; revogação retira vínculo sem publicar rascunho',async()=>{
 const f=panelBlocksFixture();try{
  const path='/api/inventory/in-progress-equipment?id='+f.open;
  let d=await(await call(f,path)).json();assert.equal(d.items.find(i=>i.id===f.items[0].id).agent_linked,1);
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),f.device);
  d=await(await call(f,path)).json();assert.equal(d.items.find(i=>i.id===f.items[0].id).agent_linked,0);
  assert.equal(f.sqlite.prepare('SELECT state FROM inspections WHERE id=?').get(f.open).state,'open');
  assert.equal((await call(f,path,'operador')).status,403);
 }finally{f.sqlite.close();}
});
