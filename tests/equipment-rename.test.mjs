import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const endpoint='/api/root/equipment-name',origin='https://test.local';
async function setup(){
 const f=collectorFixture(),data=seedEquipmentConsultation(f),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY'};
 const actors=[f.root,f.operator];for(const role of ['root','admin','visualizador']){const u={id:crypto.randomUUID(),username:crypto.randomUUID(),role};f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(u.id,u.username,role,'TEST','TEST',Date.now());actors.push(u);}
 const sessions=await Promise.all(actors.map(u=>session(f,u)));
 const call=(path,a,actor=0,options={})=>humanFetch(worker,env,origin,sessions[actor],path,a,options);
 const command=(name,id=data.items[0].id,version=0)=>({id,unitId:data.unit,name,version,operationId:crypto.randomUUID()});
 return {...f,...data,env,sessions,actors,call,command};
}
test('nomes: computador e impressora mantêm fotos, unidade, agente, ficha, autoria e publicações intactas',async()=>{
 const f=await setup();try{
  f.photo(f.printer);
  const tables=['equipments','collection_photos','agent_equipment_links','agent_devices','agent_presence','agent_inventory_snapshots','inspections','inspection_environments','published_equipment_counts'];
  const before=Object.fromEntries(tables.map(t=>[t,f.sqlite.prepare('SELECT * FROM '+t).all()]));
  for(const [id,name]of [[f.items[0].id,'Computador 05'],[f.printer,'Impressora da secretaria']]){
   const r=await f.call(endpoint,f.command(name,id));assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.equipment.id,id);assert.equal(r.data.equipment.name_version,1);
   const page=await f.call('/api/inventory/equipment?'+new URLSearchParams({unitId:f.unit,q:name}));assert.equal(page.data.total,1);assert.equal(page.data.items[0].display_name,name);assert.equal(page.data.items[0].id,id);
   const photos=await f.call('/api/inventory/photos?'+new URLSearchParams({unitId:f.unit,equipmentId:id,scope:'published'}));assert.equal(photos.data.items.length,1);assert.match(photos.data.items[0].label,new RegExp(name));
  }
  for(const table of tables)assert.deepEqual(f.sqlite.prepare('SELECT * FROM '+table).all(),before[table],table);
  const page=await f.call('/api/operations/computers?'+new URLSearchParams({unitId:f.unit,q:'Computador 05'}));assert.equal(page.data.total,1);assert.equal(page.data.items[0].hostname,'TESTE-PC-001');assert.equal(page.data.items[0].display_name,'Computador 05');
  const history=await f.call(endpoint+'?'+new URLSearchParams({id:f.items[0].id,unitId:f.unit}));assert.equal(history.data.history[0].before_name,null);assert.equal(history.data.history[0].after_name,'Computador 05');assert.equal(history.data.history[0].actor_name,'root');
 }finally{f.sqlite.close();}
});
test('nomes: permissão root no painel, sessão/CSRF, unidade e categoria validadas no servidor',async()=>{
 const f=await setup();try{
  const a=f.command('Computador');
  for(const actor of [1,3,4]){assert.equal((await f.call(endpoint,a,actor)).status,403);assert.equal((await f.call(endpoint+'?'+new URLSearchParams({id:a.id,unitId:a.unitId}),undefined,actor)).status,403);}
  f.env.APP_KIND='collector';assert.equal((await f.call(endpoint,a)).status,403);delete f.env.APP_KIND;
  assert.equal((await f.call(endpoint,a,0,{noCsrf:true})).status,403);
  assert.equal((await worker.fetch(new Request(origin+endpoint),f.env)).status,401);
  assert.equal((await f.call(endpoint,{...a,unitId:f.ids.assigned})).status,404);
  assert.equal((await f.call(endpoint,f.command('Tablet',f.lot))).status,404);
  for(const name of ['', '   ',null,42,'a'.repeat(181),'teste\u0000'])assert.equal((await f.call(endpoint,f.command(name))).status,400);
  assert.equal((await f.call(endpoint,{...a,version:-1})).status,400);
  assert.equal((await f.call(endpoint,{...a,environmentId:crypto.randomUUID()})).status,400);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_names').get().n,0);
 }finally{f.sqlite.close();}
});
test('nomes: conflito entre duas sessões e resposta perdida não sobrescrevem correção posterior',async()=>{
 const f=await setup();try{
  const a=f.command('Computador 01');assert.equal((await f.call(endpoint,a)).status,200);
  const repeat=await f.call(endpoint,a);assert.equal(repeat.data.replayed,true);
  const stale=await f.call(endpoint,f.command('Computador 02'),2);assert.equal(stale.status,409);assert.equal(stale.data.server.name,'Computador 01');
  assert.equal(JSON.parse(f.sqlite.prepare('SELECT attempted_json FROM collection_conflicts').get().attempted_json).name,'Computador 02');
  const b=f.command('Computador 03',a.id,1);assert.equal((await f.call(endpoint,b,2)).status,200);
  const late=await f.call(endpoint,a);assert.equal(late.data.equipment.name,'Computador 03');assert.equal(late.data.replayed,true);
  assert.equal((await f.call(endpoint,{...a,name:'Fraude'})).status,409);assert.equal((await f.call(endpoint,a,2)).status,409);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_name_events').get().n,2);
  assert.equal((await f.call(endpoint,f.command('Computador 03',a.id,2))).data.unchanged,true);
 }finally{f.sqlite.close();}
});
test('nomes: verificação de versão atômica quando outra sessão vence durante a escrita',async()=>{
 const f=await setup();try{
  const original=f.db.batch;let injected=false;
  f.db.batch=async statements=>{if(!injected){injected=true;f.db.batch=original;assert.equal((await f.call(endpoint,f.command('Nome concorrente'),2)).status,200);}return original(statements);};
  const r=await f.call(endpoint,f.command('Nome da aba antiga'));assert.equal(r.status,409);assert.equal(r.data.server.name,'Nome concorrente');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_name_events').get().n,1);
 }finally{f.sqlite.close();}
});
test('nomes: rascunho não vira oficial e futuras publicações/telemetria não apagam o nome',async()=>{
 const f=await setup();try{
  const open=crypto.randomUUID();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(open,f.unit,f.root.id,Date.now(),Date.now());
  f.sqlite.prepare('UPDATE equipments SET inspection_id=? WHERE id=?').run(open,f.draft);
  assert.equal((await f.call(endpoint,f.command('Computador novo',f.draft))).status,200);
  assert.equal((await f.call('/api/inventory/equipment?'+new URLSearchParams({unitId:f.unit,q:'Computador novo'}))).data.total,0);
  const partial=await f.call('/api/inventory/in-progress-equipment?id='+open);assert.equal(partial.data.items[0].display_name,'Computador novo');assert.equal(partial.data.items[0].is_new,1);
  f.sqlite.prepare("UPDATE equipments SET published_json=data_json WHERE id=?").run(f.draft);
  assert.equal((await f.call('/api/inventory/equipment?'+new URLSearchParams({unitId:f.unit,q:'Computador novo'}))).data.total,1);
  assert.equal((await f.call(endpoint,f.command('Computador 05'))).status,200);
  f.sqlite.prepare("UPDATE agent_inventory_snapshots SET sections_json=json_set(sections_json,'$.system.data.hostname','TESTE-HOST-ATUALIZADO') WHERE device_id=?").run(f.device);
  const item=(await f.call('/api/inventory/equipment?'+new URLSearchParams({unitId:f.unit,q:'Computador 05'}))).data.items[0];assert.equal(item.hostname,'TESTE-HOST-ATUALIZADO');assert.equal(item.display_name,'Computador 05');
 }finally{f.sqlite.close();}
});
test('nomes: auditoria sobrevive à exclusão autorizada e prévia antiga é invalidada pela correção',async()=>{
 const f=await setup();try{
  const preview=(await f.call('/api/root/unit-delete-preview?id='+f.unit)).data;
  assert.equal((await f.call(endpoint,f.command('PC teste'))).status,200);
  const payload={id:f.unit,confirmName:preview.unit.name,reason:'Teste isolado de integridade',snapshot:preview.snapshot};assert.equal((await f.call('/api/root/unit-delete',payload)).status,409);
  payload.snapshot=(await f.call('/api/root/unit-delete-preview?id='+f.unit)).data.snapshot;
  assert.equal((await f.call('/api/root/unit-delete',payload)).status,200);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_names').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_name_events').get().n,1);
 }finally{f.sqlite.close();}
});
