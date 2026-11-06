import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import {equipmentTable} from '../web/desktop-inventory.js';
import worker from '../server/worker.mjs';
const origin='https://isolado.test';
async function setup(version='v3'){
 const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector'},op=await session(f,f.operator);
 const call=(path,data)=>humanFetch(worker,env,origin,op,path,data);
 const i=(await call('/api/collector/'+version+'-start',{unitId:f.ids.pending})).data.inspection;
 const room=(await call('/api/collector/environment-save',{inspectionId:i.id,name:'TESTE ISOLADO · Secretaria'})).data.environment;
 const base={category:'desktop',mode:'Individual',quantity:1,registration:'Manual',manualReason:'Não liga',environmentName:room.name,environment:room.id,position_label:'Mesa 1',assetStatus:'Sem patrimônio',operation:'Funcionando',condition:'Bom',use:'Em uso'};
 return {...f,env,call,i,room,base};
}
test('AnyDesk/RustDesk: V2 e V3 aceitam vazios, preservam dígitos/zeros, permitem limpar e não perdem dados com cliente anterior',async()=>{
 for(const version of ['v2','v3']){const f=await setup(version);try{
  for(const category of version==='v3'?['computer','desktop','notebook']:['desktop','notebook']){
   const id=crypto.randomUUID(),data={...f.base,category,anydesk:'00123456789',rustdesk:'000987654321'};
   const saved=await f.call('/api/collector/equipment-save',{id,inspectionId:f.i.id,data});assert.equal(saved.status,201,JSON.stringify(saved));
   const locked=await f.call('/api/collector/equipment-lock',{id,inspectionId:f.i.id});assert.equal(locked.data.equipment.data.anydesk,data.anydesk);assert.equal(locked.data.equipment.data.rustdesk,data.rustdesk);
   // Cliente anterior omite campos desconhecidos; não equivale a limpar explicitamente.
   const updated=await f.call('/api/collector/equipment-save',{id,inspectionId:f.i.id,version:saved.data.version,lockToken:locked.data.token,data:{...f.base,category,operation:'Não foi possível testar'}});assert.equal(updated.status,200,JSON.stringify(updated));
   let stored=JSON.parse(f.sqlite.prepare('SELECT data_json FROM equipments WHERE id=?').get(id).data_json);assert.equal(stored.anydesk,data.anydesk);assert.equal(stored.rustdesk,data.rustdesk);
   const list=await f.call('/api/collector/equipment-list?unitId='+f.ids.pending+'&category=computers');const row=list.data.items.find(e=>e.id===id);assert.equal(row.data.anydesk,data.anydesk);
   for(const partial of [true,false]){const html=equipmentTable([row],[f.room],{partial});assert.match(html,/AnyDesk \(opcional\)/);assert.match(html,/00123456789/);assert.match(html,/RustDesk \(opcional\)/);assert.match(html,/000987654321/);}
   const clear=await f.call('/api/collector/equipment-save',{id,inspectionId:f.i.id,version:updated.data.version,lockToken:locked.data.token,data:{...f.base,category,anydesk:'',rustdesk:''}});assert.equal(clear.status,200,JSON.stringify(clear));
   stored=JSON.parse(f.sqlite.prepare('SELECT data_json FROM equipments WHERE id=?').get(id).data_json);assert.equal(stored.anydesk,'');assert.equal(stored.rustdesk,'');
  }
  assert.equal((await f.call('/api/collector/equipment-save',{id:crypto.randomUUID(),inspectionId:f.i.id,data:f.base})).status,201);
 }finally{f.sqlite.close();}}
});
test('AnyDesk/RustDesk: rejeita letras, sinais, decimal e notação científica também em rascunho do QR',async()=>{
 const f=await setup();try{
  const before=f.sqlite.prepare('SELECT count(*) n FROM environments').get().n;
  for(const draft of [false,true])for(const key of ['anydesk','rustdesk'])for(const value of ['abc','12 34','12.34','+123','-123','1e9',123]){
   const r=await f.call('/api/collector/equipment-save',{id:crypto.randomUUID(),inspectionId:f.i.id,draft,data:{...f.base,registration:draft?'Agente':'Manual',environmentName:'NÃO CRIAR AO RECUSAR', [key]:value}});
   assert.equal(r.status,400,JSON.stringify(r));assert.ok(r.data.fields[key]);
  }
  assert.equal(f.sqlite.prepare('SELECT count(*) n FROM equipments').get().n,0);assert.equal(f.sqlite.prepare('SELECT count(*) n FROM environments').get().n,before);
  const draft=await f.call('/api/collector/equipment-save',{id:crypto.randomUUID(),inspectionId:f.i.id,draft:true,data:{...f.base,registration:'Agente',anydesk:'001234567',rustdesk:'000123456'}});assert.equal(draft.status,201);
  const d=JSON.parse(f.sqlite.prepare('SELECT data_json FROM equipments WHERE id=?').get(draft.data.id).data_json);assert.equal(d.anydesk,'001234567');assert.equal(d.rustdesk,'000123456');
 }finally{f.sqlite.close();}
});
