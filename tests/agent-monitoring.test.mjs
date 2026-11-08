import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {runAgentMonitoring,hardwareComponents} from '../server/agent-monitoring.mjs';
import {presenceState} from '../server/agentes/presence.mjs';
import worker from '../server/worker.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
function setup(){const f=collectorFixture(),s=seedEquipmentConsultation(f),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'},base=Date.now();
 const snapshot=f.sqlite.prepare('SELECT * FROM agent_inventory_snapshots WHERE device_id=?').get(s.device);
 const add=(ms,change,bare=false)=>{const sections=JSON.parse(snapshot.sections_json);change?.(sections);const id=crypto.randomUUID(),iso=bare?new Date(ms).toISOString().replace('.000Z','Z'):new Date(ms).toISOString();f.sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,1,?,?,?)').run(id,s.device,s.items[0].id,iso,iso,crypto.randomUUID(),'periodic',id,JSON.stringify(sections));f.sqlite.prepare('UPDATE agent_current_snapshot SET inventory_id=?,collected_at=? WHERE device_id=? AND collected_at<?').run(id,iso,s.device,iso);return id;};
 const events=()=>f.sqlite.prepare('SELECT * FROM agent_notifications ORDER BY detected_at,id').all();
 const presence=(ms,reason='periodic')=>{const iso=new Date(ms).toISOString();f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:iso,last_reason:reason,last_reason_at:iso,last_health_inventory:'ok'}),s.device);};
 return {...f,...s,env,base,snapshot,add,events,presence,run:ms=>runAgentMonitoring(env,ms??base)};
}
test('hardware: estabelece referência sem alertas retroativos; mudança e retorno com antes/depois; reenvio e ordem',async()=>{const f=setup();try{
 await f.run();assert.equal(f.events().length,0);
 const id=f.add(f.base+1000,s=>s.memory.data.installed_bytes=34359738368);await f.run(f.base+2000);
 let events=f.events();assert.equal(events.length,1);const details=JSON.parse(events[0].details_json);assert.equal(details.inventory_id,id);assert.deepEqual(details.changes[0].before,{bytes:17179869184});assert.deepEqual(details.changes[0].after,{bytes:34359738368});
 await f.run(f.base+2000);assert.equal(f.events().length,1);
 f.add(f.base-1000,s=>s.memory.data.installed_bytes=1);await f.run(f.base+3000);assert.equal(f.events().length,1);
 f.add(f.base+4000);await f.run(f.base+5000);assert.equal(f.events().length,2,'retorno à peça anterior também notifica');
 const second=Math.ceil((f.base+6000)/1000)*1000;f.add(second,s=>s.memory.data.installed_bytes=1,true);f.add(second+100,s=>s.memory.data.installed_bytes=2);await f.run(second+1000);assert.equal(f.events().length,4,'ordem temporal correta inclusive ISO com/sem frações');
 }finally{f.sqlite.close();}});
test('hardware: parcial, ausente, reordenação e dados voláteis não notificam; primeira série confiável só estabelece referência',async()=>{const f=setup();try{
 await f.run();f.add(f.base+1000,s=>{s.memory.quality='partial';s.memory.data.installed_bytes=1;s.cpu.data.processors[0].max_clock_mhz=5000;s.storage.data.physical_disks[0].free_bytes=1;});await f.run(f.base+2000);assert.equal(f.events().length,0);
 f.add(f.base+3000,s=>{s.memory.data.modules.reverse();s.memory.data.modules.forEach((m,i)=>m.serial={value:'SERIE-'+m.slot,reliability:'ok'});});await f.run(f.base+4000);assert.equal(f.events().length,0);
 f.add(f.base+5000,s=>s.memory.data.modules.forEach(m=>m.serial={value:'OUTRA-'+m.slot,reliability:'ok'}));await f.run(f.base+6000);assert.equal(f.events().length,1);
 assert.deepEqual(hardwareComponents({cpu:{quality:'error',data:{processors:[]}},storage:{quality:'ok',data:{physical_disks:[]}}}),{});
 }finally{f.sqlite.close();}});
test('presença: limite exato, deduplicação, retorno, novo incidente, suspensão, desligamento, nunca comunicou e revogação',async()=>{const f=setup();try{
 f.presence(f.base);await f.run(f.base+1020000);assert.equal(f.events().length,0);await f.run(f.base+1020001);await f.run(f.base+1100000);assert.equal(f.events().length,1);assert.equal(f.events()[0].resolved_at,null);
 f.presence(f.base+1200000);await f.run(f.base+1200000);assert.ok(f.events()[0].resolved_at);assert.equal(f.events()[0].resolution,'Comunicação retomada');
 await f.run(f.base+2220001);assert.equal(f.events().length,2);
 f.presence(f.base+2300000,'suspend');await f.run(f.base+4000000);assert.equal(f.events().length,2);assert.equal(f.events()[1].resolution,'Suspensão informada');
 f.presence(f.base+4300000,'shutdown');await f.run(f.base+6000000);assert.equal(f.events().length,2);
 assert.equal(presenceState({state:'linked'},{},f.base),'never_communicated');assert.equal(presenceState({state:'revoked'},{},f.base),'revoked');
 f.presence(f.base+6000000);await f.run(f.base+7020001);f.sqlite.prepare("UPDATE agent_devices SET state='revoked' WHERE device_id=?").run(f.device);await f.run(f.base+7020002);assert.ok(f.events().every(n=>n.resolved_at));
 }finally{f.sqlite.close();}});
test('monitoramento é transacional e retoma após falha; mudanças múltiplas entre rodadas preservadas',async()=>{const f=setup();try{
 await f.run();f.add(f.base+1000,s=>s.memory.data.installed_bytes=1);f.add(f.base+2000,s=>s.memory.data.installed_bytes=2);
 const batch=f.db.batch;f.db.batch=async statements=>batch([...statements,f.db.prepare('INSERT INTO table_missing VALUES(1)')]);await assert.rejects(f.run(f.base+3000));assert.equal(f.events().length,0);f.db.batch=batch;await f.run(f.base+4000);assert.equal(f.events().length,2);
 }finally{f.sqlite.close();}});
test('rodadas concorrentes usam revisão e não duplicam; heartbeat durante a verificação impede alerta falso',async()=>{const f=setup();try{
 await f.run();f.add(f.base+1000,s=>s.memory.data.installed_bytes=1);
 const batch=f.db.batch;let queue=Promise.resolve();f.db.batch=statements=>{const run=queue.then(()=>batch(statements));queue=run.catch(()=>{});return run;};
 await Promise.all([f.run(f.base+2000),f.run(f.base+2000)]);assert.equal(f.events().length,1);
 f.presence(f.base-1100000);f.db.batch=async statements=>{f.presence(f.base);return batch(statements);};await f.run(f.base);assert.equal(f.events().filter(e=>e.kind==='communication_lost').length,0);
 }finally{f.sqlite.close();}});
test('peças: disco interno, vídeo PCI e placa; USB, clock e driver não contam como troca',()=>{
 const s={storage:{quality:'ok',data:{physical_disks:[{model:'SSD',size_bytes:1024,location:'internal',serial:{reliability:'ok',value:'A'}},{model:'USB',size_bytes:123,location:'removable'}]}},gpu:{quality:'ok',data:{adapters:[{pnp_device_id:'PCI\\VEN_1234&DEV_5678&SUBSYS_12345678\\instance',driver_version:'1'}]}},system:{quality:'ok',data:{baseboard:{manufacturer:'FAB',product:'PLACA',serial:{reliability:'ok',value:'PLACA1'}}}}};
 const before=hardwareComponents(s);assert.equal(before.storage.length,1);assert.ok(before.gpu);assert.equal(before.board_serial.serie,'PLACA1');s.gpu.data.adapters[0].driver_version='2';s.storage.data.physical_disks.pop();assert.deepEqual(hardwareComponents(s),before);
 s.storage.data.physical_disks[0].serial.value='B';assert.notDeepEqual(hardwareComponents(s).storage_serials,before.storage_serials);
});
test('volume: 200 computadores, lote de eventos sem duplicação',async()=>{const f=setup();try{
 for(let i=1;i<200;i++){const device=crypto.randomUUID(),equipment=crypto.randomUUID(),link=crypto.randomUUID(),snapshot=crypto.randomUUID(),iso=new Date(f.base).toISOString();
  f.sqlite.prepare('INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,published_json,created_by,created_at,updated_by,updated_at) SELECT ?,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,published_json,created_by,created_at,updated_by,updated_at FROM equipments WHERE id=?').run(equipment,f.items[0].id);
  f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,iso);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at) VALUES(?,?,?,?,?,?)').run(link,device,equipment,f.visit,f.root.id,iso);
  f.sqlite.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(device,JSON.stringify({last_live_contact_at:new Date(f.base-1100000).toISOString()}),iso);
  f.sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) SELECT ?,?,?,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json FROM agent_inventory_snapshots WHERE inventory_id=?').run(snapshot,device,equipment,f.snapshot.inventory_id);
  f.sqlite.prepare('INSERT INTO agent_current_snapshot VALUES(?,?,?)').run(device,snapshot,f.snapshot.collected_at);
 }
 f.presence(f.base-1100000);let result=await f.run();assert.equal(result.devices,200);assert.equal(f.events().length,200);await f.run();assert.equal(f.events().length,200);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_monitor_cursors').get().n,200);
 }finally{f.sqlite.close();}});
test('API: autenticação, perfis/CSRF, leitura individual, paginação, status dinâmico, atraso visível e coletor isolado',async()=>{const f=setup();try{
 f.presence(f.base-1100000);await f.run();const root=await session(f,f.root),operator=await session(f,f.operator),origin='https://teste.invalid',endpoint='/api/inventory/monitoring?equipmentIds='+f.items[0].id;
 assert.equal((await worker.fetch(new Request(origin+endpoint),f.env)).status,401);
 assert.equal((await humanFetch(worker,f.env,origin,operator,endpoint)).status,403);
 let r=await humanFetch(worker,f.env,origin,root,endpoint);assert.equal(r.status,200);assert.equal(r.data.unread,1);assert.equal(r.data.statuses[0].state,'no_recent_communication');assert.ok(r.data.monitor_last_success_at);
 const notification=r.data.items[0].id;
 assert.equal((await humanFetch(worker,f.env,origin,root,'/api/inventory/notifications/read',{id:notification},{noCsrf:true})).status,403);
 assert.equal((await humanFetch(worker,f.env,origin,root,'/api/inventory/notifications/read',{id:notification})).status,200);
 r=await humanFetch(worker,f.env,origin,root,endpoint);assert.equal(r.data.unread,0);
 f.presence(Date.now());r=await humanFetch(worker,f.env,origin,root,endpoint);assert.equal(r.data.statuses[0].state,'communicating','consulta calcula presença sem esperar cron');
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);assert.equal((await humanFetch(worker,f.env,origin,root,endpoint)).status,200);}
 assert.equal((await humanFetch(worker,{...f.env,APP_KIND:'collector'},origin,root,endpoint)).status,403);
 assert.equal((await humanFetch(worker,f.env,origin,root,'/api/inventory/monitoring?offset=-1')).status,422);
 for(let i=0;i<28;i++)f.sqlite.prepare('INSERT INTO agent_notifications SELECT ?,?,device_id,link_id,equipment_id,unit_id,kind,observed_at,detected_at+?,details_json,NULL,NULL FROM agent_notifications WHERE id=?').run(crypto.randomUUID(),'test-'+i,i+1,notification);
 r=await humanFetch(worker,f.env,origin,root,'/api/inventory/monitoring');assert.equal(r.data.items.length,25);assert.equal(r.data.nextOffset,25);assert.equal(r.data.total,29);
 assert.equal((await humanFetch(worker,f.env,origin,root,'/api/inventory/monitoring?offset=25')).data.items.length,4);
 }finally{f.sqlite.close();}});
