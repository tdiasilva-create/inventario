import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {hardwareChange} from './helpers/hardware-change.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
import {seedMapDemands} from './helpers/map-demands.mjs';
async function setup(){const f=collectorFixture(),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'},auth=await session(f,f.root);return {...f,env,auth,call:(p,data,opts)=>humanFetch(worker,env,'https://teste.invalid',auth,'/api/inventory/'+p,data,opts)};}
function visit(f,unit,state){const id=crypto.randomUUID();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,state,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,unit,state,f.root.id,Date.now(),Date.now());return id;}
test('D094: demandas por ID da unidade, estados pendentes, encerramento, reabertura e histórico sem coordenadas',async()=>{const f=await setup();try{
 const seed=seedMapDemands(f);let v=(await f.call('pending-summary')).data.demands;
 assert.equal(v.total,6);assert.equal(v.units.length,5);assert.equal(v.units.find(u=>u.unit_id===f.ids.pending).total,2);
 assert.equal(v.units.some(u=>u.unit_id===f.ids.blocked),false);assert.equal(v.units.reduce((n,u)=>n+u.total,0),v.total);
 assert.ok(v.units.some(u=>u.unit_id==='unidade-removida-teste'));assert.ok(v.units.some(u=>u.unit_id===f.ids.inactive));
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE unit_id=?").run(f.ids.pending);
 v=(await f.call('pending-summary')).data.demands;assert.equal(v.total,4);assert.equal(v.units.some(u=>u.unit_id===f.ids.pending),false);
 f.sqlite.prepare("UPDATE service_requests SET status='Em atendimento' WHERE id=?").run(seed.ids[0]);
 v=(await f.call('pending-summary')).data.demands;assert.equal(v.units.find(u=>u.unit_id===f.ids.pending).total,1);assert.equal(v.total,5);
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída'").run();assert.deepEqual((await f.call('pending-summary')).data.demands,{total:0,units:[]});
 }finally{f.sqlite.close();}});
test('D085: coleta conta unidades elegíveis uma vez; conclusão, revisita e históricos preservados',async()=>{const f=await setup();try{
 assert.deepEqual((await f.call('pending-summary')).data.collections,{total:4,not_started:3,in_progress:1,preserved:0});
 visit(f,f.ids.pending,'paused');visit(f,f.ids.pending,'paused');
 visit(f,f.ids.blocked,'completed');visit(f,f.ids.blocked,'paused');
 visit(f,f.ids.assigned,'completed');
 let v=(await f.call('pending-summary')).data;assert.equal(v.collections.total,2);assert.equal(v.collections.preserved,1);
 const id=visit(f,f.ids.assigned,'open');v=(await f.call('pending-summary')).data;assert.equal(v.collections.total,3);assert.equal(v.collections.in_progress,2);
 // Conclusão sem equipamentos não volta a ser pendente por total de equipamentos zero.
 f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(id);assert.equal((await f.call('pending-summary')).data.collections.total,2);
 f.sqlite.prepare("UPDATE units SET unit_type='Obra em andamento' WHERE id=?").run(f.ids.pending);assert.equal((await f.call('pending-summary')).data.collections.total,1);
 f.sqlite.prepare("UPDATE units SET unit_type='Escola conveniada' WHERE id=?").run(f.ids.progress);assert.equal((await f.call('pending-summary')).data.collections.total,0);
 }finally{f.sqlite.close();}});
test('D085: leitura não decide; aceite e encaminhamento movem apenas os indicadores correspondentes',async()=>{const f=await setup();try{
 const s=await hardwareChange(f,f.env);const summary=async()=>(await f.call('pending-summary')).data;
 let v=await summary();assert.equal(v.hardware.total,1);assert.equal(v.demands.total,0);const collections=v.collections.total;
 await f.call('notifications/read',{id:s.id});assert.equal((await summary()).hardware.total,1);
 const command={id:s.id,decision:'demand',note:'Teste isolado',operationId:crypto.randomUUID()};assert.equal((await f.call('hardware-review',command)).status,200);await f.call('hardware-review',command);
 v=await summary();assert.equal(v.hardware.total,0);assert.equal(v.demands.total,1);assert.equal(v.collections.total,collections);
 assert.equal((await f.call('hardware-alerts?state=pending')).data.total,0);assert.equal((await f.call('hardware-alerts')).data.total,1);
 for(const status of ['Em atendimento','Aguardando material','Visita agendada','Aberta']){f.sqlite.prepare('UPDATE service_requests SET status=?').run(status);assert.equal((await summary()).demands.total,1);}
 f.sqlite.prepare("UPDATE service_requests SET status='Concluída'").run();assert.equal((await summary()).demands.total,0);
 const second=await s.change(68719476736,3000);assert.equal((await summary()).hardware.total,1);assert.equal((await f.call('hardware-alerts?state=pending')).data.items[0].id,second);
 await f.call('hardware-review',{id:second,decision:'accepted',operationId:crypto.randomUUID()});assert.equal((await summary()).hardware.total,0);assert.equal((await summary()).demands.total,0);
 // Histórico da demanda permanece; nova abertura não reabre parecer já registrado.
 f.sqlite.prepare("UPDATE service_requests SET status='Aberta'").run();assert.equal((await summary()).demands.total,1);assert.equal((await summary()).hardware.total,0);
 }finally{f.sqlite.close();}});
test('D085: lista e contador coerentes; paginação e filtro literal sem duplicar visitas antigas',async()=>{const f=await setup();try{
 for(let i=0;i<57;i++){const id=crypto.randomUUID();f.sqlite.prepare('INSERT INTO units(id,name,name_key,active,created_at,updated_at) VALUES(?,?,?,1,0,0)').run(id,'TESTE '+String(i).padStart(2,'0'),'test-'+i);}
 const first=(await f.call('pending-collections')).data,next=(await f.call('pending-collections?offset=50')).data;
 assert.equal(first.total,61);assert.equal(first.items.length,50);assert.equal(next.items.length,11);assert.equal(next.nextOffset,null);assert.equal(new Set([...first.items,...next.items].map(u=>u.unit_id)).size,61);
 assert.equal((await f.call('pending-summary')).data.collections.total,first.total);
 assert.equal((await f.call('pending-collections?state=in_progress')).data.items[0].unit_id,f.ids.progress);
 assert.equal((await f.call('pending-collections?q=TESTE%2000')).data.total,1);assert.equal((await f.call('pending-collections?q=%25')).data.total,0);
 for(const q of ['offset=-1','offset=2.2','state=completed','q='+('x'.repeat(121))])assert.equal((await f.call('pending-collections?'+q)).status,400);
 assert.equal((await f.call('hardware-alerts?state=invalid')).status,422);
 }finally{f.sqlite.close();}});
test('D085: somente perfis desktop; consultas sem escrita e falha não retorna zero',async()=>{const f=await setup();try{
 const paths=['/api/inventory/pending-summary','/api/inventory/pending-collections'];const op=await session(f,f.operator);
 for(const path of paths){assert.equal((await worker.fetch(new Request('https://teste.invalid'+path),f.env)).status,401);assert.equal((await humanFetch(worker,f.env,'https://teste.invalid',op,path)).status,403);assert.equal((await humanFetch(worker,{...f.env,APP_KIND:'collector'},'https://teste.invalid',f.auth,path)).status,403);assert.equal((await humanFetch(worker,f.env,'https://teste.invalid',f.auth,path,{})).status,405);}
 const before=f.sqlite.prepare('SELECT count(*) n FROM inspections').get().n;
 for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);assert.equal((await f.call('pending-summary')).status,200);assert.equal((await f.call('pending-collections')).status,200);}
 assert.equal(f.sqlite.prepare('SELECT count(*) n FROM inspections').get().n,before);
 f.sqlite.prepare('UPDATE users SET must_change=1 WHERE id=?').run(f.root.id);assert.equal((await f.call('pending-summary')).status,403);f.sqlite.prepare('UPDATE users SET must_change=0 WHERE id=?').run(f.root.id);
 f.db.batch=async()=>{throw Error('TESTE falha D1');};const failed=await f.call('pending-summary');assert.ok(failed.status>=500);assert.equal(failed.data.collections,undefined);
 }finally{f.sqlite.close();}});
