import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const origin='https://test.local';
async function setup(){
 const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector'},sessions=[];
 for(const role of ['operador','operador','visualizador']){
  const user={id:crypto.randomUUID(),username:crypto.randomUUID(),role};
  f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(user.id,user.username,role,'TEST','TEST',Date.now());
  sessions.push(await session(f,user));
 }
 const call=(p,d,actor=0)=>humanFetch(worker,env,origin,sessions[actor],'/api/collector/'+p,d);
 const i=(await call('v3-start',{unitId:f.ids.pending})).data.inspection;
 return {...f,env,sessions,call,i};
}
const computer={category:'computer',mode:'Individual',quantity:1,registration:'Manual',manualReason:'Sistema incompatível',position_label:'PC 01',assetStatus:'Sem patrimônio',operation:'Funcionando'};
test('D-074: operadores consultam ambientes atuais e selecionam pelo ID, sem criar a partir do rótulo',async()=>{
 const f=await setup();try{
  const url='environments?inspectionId='+f.i.id;
  assert.deepEqual((await f.call(url,undefined,1)).data.environments,[]);
  const created=await f.call('environment-save',{inspectionId:f.i.id,name:'Laboratório de informática'});assert.equal(created.status,200);
  const room=created.data.environment,list=await f.call(url,undefined,1);assert.equal(list.status,200);assert.equal(list.data.environments[0].id,room.id);
  const before=f.sqlite.prepare('SELECT COUNT(*) n FROM collection_history').get().n;
  await f.call(url,undefined,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM collection_history').get().n,before,'Consulta não grava histórico');
  for(let n=0;n<2;n++){
   const id=crypto.randomUUID(),r=await f.call('equipment-save',{inspectionId:f.i.id,id,environmentId:room.id,data:{...computer,environmentName:'Rótulo desatualizado',position_label:'PC '+n}},n);
   assert.equal(r.status,201,JSON.stringify(r));assert.equal(r.data.environment.name,room.name);
   const saved=f.sqlite.prepare('SELECT environment_id,data_json FROM equipments WHERE id=?').get(id);assert.equal(saved.environment_id,room.id);assert.equal(JSON.parse(saved.data_json).environmentName,room.name);
  }
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environments WHERE unit_id=?').get(f.ids.pending).n,1);
  const authors=f.sqlite.prepare("SELECT DISTINCT actor_id FROM collection_history WHERE event='equipment_created'").all();assert.equal(authors.length,2);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE published_json IS NOT NULL').get().n,0,'Seleção não publica a vistoria');
 }finally{f.sqlite.close();}
});
test('D-074: ID vazio, inexistente ou de outra unidade é recusado sem criar ambiente; perfis/escopo preservados',async()=>{
 const f=await setup();try{
  const other=(await f.call('v3-start',{unitId:f.ids.blocked})).data.inspection;
  const room=(await f.call('environment-save',{inspectionId:other.id,name:'Sala de outra unidade'})).data.environment;
  for(const environmentId of ['',crypto.randomUUID(),room.id,'invalido']){
   const r=await f.call('equipment-save',{inspectionId:f.i.id,id:crypto.randomUUID(),environmentId,data:{...computer,environmentName:'Não criar'}});
   assert.equal(r.status,400,JSON.stringify(r));assert.ok(r.data.fields.environmentName);
  }
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipments').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environments').get().n,1);
  const list='environments?inspectionId='+f.i.id;
  assert.equal((await f.call(list,undefined,2)).status,403);
  assert.equal((await worker.fetch(new Request(origin+'/api/collector/'+list),f.env)).status,401);
  f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.ids.pending);assert.equal((await f.call(list)).status,403);
 }finally{f.sqlite.close();}
});
test('D-074: criação concorrente/repetida usa o mesmo ID, e edição por seleção mantém equipamento, rascunho e controle de versão',async()=>{
 const f=await setup();try{
  const result=await Promise.all([0,1].map(actor=>f.call('environment-save',{inspectionId:f.i.id,name:actor?' LABORATORIO ':'Laboratório'},actor)));
  assert.ok(result.every(r=>r.status===200));assert.equal(result[0].data.environment.id,result[1].data.environment.id);
  const room=result[0].data.environment,id=crypto.randomUUID();
  const draft=await f.call('equipment-save',{inspectionId:f.i.id,id,environmentId:room.id,draft:true,data:{...computer,registration:'Agente',manualReason:''}});assert.equal(draft.status,201);
  const locked=await f.call('equipment-lock',{inspectionId:f.i.id,id});
  const saved=await f.call('equipment-save',{inspectionId:f.i.id,id,environmentId:room.id,version:draft.data.version,lockToken:locked.data.token,data:{...computer,registration:'Agente'}});assert.equal(saved.status,200);assert.equal(saved.data.id,id);
  assert.equal((await f.call('equipment-lock',{inspectionId:f.i.id,id},1)).status,409);
  const printer=await f.call('equipment-save',{inspectionId:f.i.id,id:crypto.randomUUID(),environmentId:room.id,draft:true,data:{category:'printer',mode:'Individual',quantity:1}});assert.equal(printer.status,201,JSON.stringify(printer));
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environments').get().n,1);
 }finally{f.sqlite.close();}
});
