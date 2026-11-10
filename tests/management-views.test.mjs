import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {hardwareChange} from './helpers/hardware-change.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
async function setup(){const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'},auth=await session(f,f.root);return {...f,env,auth,call:(p,data)=>humanFetch(worker,env,'https://test.invalid',auth,'/api/inventory/'+p,data)};}
test('D086: relatório usa estados existentes, dados atuais PARCIAL e não altera inventário publicado',async()=>{const f=await setup();try{
 const s=seedEquipmentConsultation(f),before=f.sqlite.prepare('SELECT * FROM published_equipment_counts').all();
 let v=(await f.call('computer-report')).data;assert.equal(v.total,57);assert.equal(v.totals.online,1);assert.equal(v.totals.unlinked,56);assert.equal(v.totals.partial,57);assert.equal(v.items.find(i=>i.id===s.items[0].id).hostname,'TESTE-PC-001');
 const old=new Date(Date.now()-18*60000).toISOString();f.sqlite.prepare("UPDATE agent_presence SET data_json=json_set(data_json,'$.last_live_contact_at',?) WHERE device_id=?").run(old,s.device);
 v=(await f.call('computer-report?presence=lost')).data;assert.equal(v.total,1);assert.equal(v.items[0].last_contact_at,old);assert.equal(v.items[0].link_state,'linked');
 f.sqlite.prepare("UPDATE agent_presence SET data_json=json_set(data_json,'$.last_reason','shutdown','$.last_reason_at',?) WHERE device_id=?").run(new Date().toISOString(),s.device);
 assert.equal((await f.call('computer-report?presence=lost')).data.total,0);v=(await f.call('computer-report?presence=other')).data;assert.equal(v.items[0].presence_state,'reported_shutdown');
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM published_equipment_counts').all(),before);
 assert.doesNotMatch(JSON.stringify(v),/RASCUNHO SEGREDO|local_accounts|usuario-teste|presence_json|sections_json/);
 }finally{f.sqlite.close();}});
test('D086: filtros combinam unidade/ambiente/host/vínculo/publicação/situação sem confundir lote com fichas',async()=>{const f=await setup();try{
 const s=seedEquipmentConsultation(f);
 f.sqlite.prepare('UPDATE equipments SET data_json=published_json WHERE id=?').run(s.items[0].id);
 let v=(await f.call(`computer-report?unitId=${s.unit}&environmentId=${s.room}&agent=linked&publication=published&q=teste-pc`)).data;assert.equal(v.total,1);assert.equal(v.items[0].partial,false);
 assert.equal((await f.call('computer-report?publication=partial')).data.total,56);
 assert.equal((await f.call('computer-report?agent=manual')).data.total,56);
 assert.equal((await f.call('computer-report?unitId='+f.ids.assigned+'&environmentId='+s.room)).data.total,0);
 f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(s.unit);assert.equal((await f.call('computer-report?active=1')).data.total,0);assert.equal((await f.call('computer-report?active=0')).data.total,57);
 f.sqlite.prepare("UPDATE equipments SET data_json=json_set(data_json,'$.mode','Lote','$.quantity',20) WHERE id=?").run(s.items[1].id);
 v=(await f.call('computer-report?all=1')).data;assert.equal(v.total,57);assert.equal(v.items.find(i=>i.id===s.items[1].id).registered_quantity,20);assert.equal(v.items.find(i=>i.id===s.items[1].id).is_batch,1);
 f.sqlite.prepare("UPDATE units SET unit_type='Escola conveniada' WHERE id=?").run(s.unit);assert.equal((await f.call('computer-report')).data.total,0);
 }finally{f.sqlite.close();}});
test('D086: exportação completa em uma consulta, paginação e filtros além da primeira página',async()=>{const f=await setup();try{
 const s=seedEquipmentConsultation(f),base=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(s.items[1].id),cols=Object.keys(base),insert=f.sqlite.prepare('INSERT INTO equipments('+cols.join(',')+') VALUES('+cols.map(()=>'?').join(',')+')');
 for(let i=0;i<85;i++)insert.run(...cols.map(c=>c==='id'?crypto.randomUUID():c==='position_label'?'EXTRA '+String(i).padStart(3,'0'):base[c]));
 const a=(await f.call('computer-report')).data,b=(await f.call('computer-report?offset=60')).data,c=(await f.call('computer-report?offset=120')).data,all=(await f.call('computer-report?all=1')).data;
 assert.equal(a.items.length,60);assert.equal(b.items.length,60);assert.equal(c.items.length,22);assert.equal(c.nextOffset,null);assert.equal(all.complete,true);assert.equal(all.items.length,142);assert.equal(all.total,142);assert.equal(new Set(all.items.map(r=>r.id)).size,142);assert.deepEqual(all.items.map(r=>r.id),[...a.items,...b.items,...c.items].map(r=>r.id));
 assert.equal((await f.call('computer-report?q=EXTRA&all=1')).data.items.length,85);assert.equal((await f.call('computer-report?q=%25')).data.total,0);
 }finally{f.sqlite.close();}});
test('D086: planejamento agrega por ID, preserva demandas órfãs e acompanha parecer/conclusão/revisita',async()=>{const f=await setup();try{
 const s=await hardwareChange(f,f.env);let plan=(await f.call('work-plan')).data;assert.equal(plan.totals.collections,3);assert.equal(plan.totals.hardware,1);assert.equal(plan.totals.demands,0);assert.equal(plan.items.find(r=>r.unit_id===s.unit).collection_state,'none');
 const command={id:s.id,decision:'demand',operationId:crypto.randomUUID()};await f.call('hardware-review',command);plan=(await f.call('work-plan?kind=demands')).data;assert.equal(plan.total,1);assert.equal(plan.totals.hardware,0);assert.equal(plan.totals.demands,1);
 const removed=crypto.randomUUID();f.sqlite.prepare("UPDATE service_requests SET unit_id=?,context_json=?").run(removed,JSON.stringify({unit_name:'TESTE · Unidade removida'}));
 plan=(await f.call('work-plan')).data;assert.equal(plan.items.find(r=>r.unit_id===removed).removed,1);assert.equal(plan.items.find(r=>r.unit_id===removed).name,'TESTE · Unidade removida');assert.equal(plan.totals.demands,(await f.call('pending-summary')).data.demands.total);
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída'").run();assert.equal((await f.call('work-plan?kind=demands')).data.total,0);
 const visit=crypto.randomUUID();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(visit,s.unit,f.root.id,Date.now(),Date.now());plan=(await f.call('work-plan?unitId='+s.unit)).data;assert.equal(plan.items[0].inspection_id,visit);assert.equal(plan.items[0].collection_state,'in_progress');
 f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(visit);assert.equal((await f.call('work-plan?unitId='+s.unit)).data.total,0);
 }finally{f.sqlite.close();}});
test('D086: fila paginada e unidades homônimas não se fundem; inativas sem providência não são incluídas',async()=>{const f=await setup();try{
 for(let n=0;n<72;n++)f.sqlite.prepare('INSERT INTO units(id,name,name_key,created_at,updated_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),'TESTE · Homônima','homonima-'+n,0,0);
 let a=(await f.call('work-plan?q=Homônima')).data,b=(await f.call('work-plan?q=Homônima&offset=50')).data;assert.equal(a.total,72);assert.equal(a.items.length,50);assert.equal(b.items.length,22);assert.equal(new Set([...a.items,...b.items].map(r=>r.unit_id)).size,72);assert.equal(b.nextOffset,null);
 assert.equal((await f.call('work-plan?unitId='+f.ids.inactive)).data.total,0);assert.equal((await f.call('work-plan?q=%25')).data.total,0);
 }finally{f.sqlite.close();}});
test('D086: sessão/perfis/coletor/GET, validação e indisponibilidade explícita',async()=>{const f=await setup();try{
 const op=await session(f,f.operator);for(const path of ['computer-report','work-plan']){assert.equal((await worker.fetch(new Request('https://test.invalid/api/inventory/'+path),f.env)).status,401);assert.equal((await humanFetch(worker,f.env,'https://test.invalid',op,'/api/inventory/'+path)).status,403);assert.equal((await humanFetch(worker,{...f.env,APP_KIND:'collector'},'https://test.invalid',f.auth,'/api/inventory/'+path)).status,403);assert.equal((await f.call(path,{})).status,405);}
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);assert.equal((await f.call('computer-report')).status,200);assert.equal((await f.call('work-plan')).status,200);}
 for(const q of ['presence=invalid','unitId=abc','environmentId=abc','offset=-1','offset=1.5','active=invalid','all=true','agent=invalid','publication=invalid','q='+('x'.repeat(121))])assert.equal((await f.call('computer-report?'+q)).status,400,q);
 assert.equal((await f.call('work-plan?kind=invalid')).status,400);f.db.batch=async()=>{throw Error('TESTE D1 indisponível');};assert.equal((await f.call('computer-report?all=1')).status,503);assert.equal((await f.call('work-plan')).status,503);
 }finally{f.sqlite.close();}});
