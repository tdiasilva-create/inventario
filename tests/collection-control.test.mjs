import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectorFixture} from './helpers/collector-db.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const origin='https://painel.test';
async function setup(t,options){const f=collectorFixture(options);t.after(()=>f.sqlite.close());const sess=await session(f,f.root),env={DB:f.db,AUTH_PEPPER:'TEST',DEBUG_COLLECTION:'1'};return {...f,env,sess,call:(p='',data,opts)=>humanFetch(worker,env,origin,sess,'/api/collection-control'+p,data,opts)};}
const proposal=(f,status='complete',version=0)=>({unitId:f.ids.progress,status,version,operationId:crypto.randomUUID()});
const item=(r,id)=>r.data.items.find(u=>u.id===id);
function section(f,data={exists:'Não'}){const i=f.sqlite.prepare('SELECT id FROM inspections WHERE unit_id=?').get(f.ids.progress);f.sqlite.prepare("INSERT INTO inspection_sections(inspection_id,section,data_json,updated_by,updated_at) VALUES(?,'C',?,?,?)").run(i.id,JSON.stringify(data),f.root.id,Date.now());return i.id;}
test('empty registration/visit/states are no data; false, zero and real answers count',async t=>{
 const f=await setup(t);assert.equal(item(await f.call(),f.ids.progress).status,'none');
 section(f,{text:' ',empty:[],nested:{value:null}});assert.equal(item(await f.call(),f.ids.progress).status,'none');
 f.sqlite.exec("UPDATE inspection_sections SET data_json='{\"exists\":false}'");assert.equal(item(await f.call(),f.ids.progress).status,'partial');
 f.sqlite.exec("UPDATE inspection_sections SET data_json='{\"quantity\":0}'");assert.equal(item(await f.call(),f.ids.progress).status,'partial');
 f.sqlite.exec("UPDATE inspection_sections SET data_json='{}',state='Concluído'");assert.equal(item(await f.call(),f.ids.progress).status,'none');
});
test('root decision persists through completed visit, new answers and deletion; manual downgrade recorded',async t=>{
 const f=await setup(t),i=section(f);f.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(i);
 assert.equal(item(await f.call(),f.ids.progress).status,'partial');
 const p=proposal(f);assert.equal((await f.call('/classify',p)).status,200);
 f.sqlite.exec("UPDATE inspection_sections SET data_json='{\"exists\":\"Sim\"}'");assert.equal(item(await f.call(),f.ids.progress).status,'complete');
 f.sqlite.exec('DELETE FROM inspection_sections');assert.equal(item(await f.call(),f.ids.progress).status,'complete');
 assert.equal((await f.call('/classify',proposal(f,'partial',1))).status,200);
 const history=await f.call('/history?unitId='+f.ids.progress);assert.equal(history.data.items.length,2);assert.equal(history.data.items[0].after_status,'partial');assert.equal(history.data.items[0].actor_name,'root');
 assert.equal(f.sqlite.prepare('SELECT state FROM inspections WHERE id=?').get(i).state,'completed');
});
test('evidence follows environments, photos ready and legacy visits without counting incomplete uploads',async t=>{
 const f=await setup(t),i=f.sqlite.prepare('SELECT id FROM inspections WHERE unit_id=?').get(f.ids.progress).id;
 f.sqlite.prepare('INSERT INTO visit_answers(inspection_id,data_json,updated_by,updated_at) VALUES(?,?,?,?)').run(i,'{"completed":["internet"]}',f.root.id,1);assert.equal(item(await f.call(),f.ids.progress).status,'none');
 f.sqlite.prepare("UPDATE visit_answers SET data_json=?").run('{"internet":"Não existe"}');assert.equal(item(await f.call(),f.ids.progress).status,'partial');f.sqlite.exec('DELETE FROM visit_answers');
 f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run('room',f.ids.progress,'TESTE','Sala',1,f.root.id);assert.equal(item(await f.call(),f.ids.progress).status,'partial');f.sqlite.exec('DELETE FROM environments');
 f.sqlite.prepare('INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('p',f.ids.progress,i,'facade',i,'isolated','image/jpeg',10,'hash',f.root.id,1);assert.equal(item(await f.call(),f.ids.progress).status,'none');f.sqlite.exec("UPDATE collection_photos SET status='ready'");assert.equal(item(await f.call(),f.ids.progress).status,'partial');f.sqlite.exec('DELETE FROM collection_photos');assert.equal(item(await f.call(),f.ids.progress).status,'none');
});
test('optimistic version and retry are safe, audit only once, no forged sem dados',async t=>{
 const f=await setup(t),p=proposal(f);assert.equal((await f.call('/classify',p)).status,200);assert.equal((await f.call('/classify',p)).data.replayed,true);
 assert.equal((await f.call('/classify',proposal(f,'partial',0))).status,409);
 assert.equal((await f.call('/classify',{...p,status:'partial'})).status,409);
 assert.equal((await f.call('/classify',proposal(f,'none',1))).status,400);
 assert.equal((await f.call('/classify',proposal(f,'complete',1))).data.unchanged,true);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM unit_collection_review_history').get().n,1);
});
test('permissions: root writes; admin/viewer read; operator and collector blocked; CSRF/session enforced',async t=>{
 const f=await setup(t);for(const role of ['admin','visualizador','operador']){
  f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);
  assert.equal((await f.call()).status,role==='operador'?403:200);assert.equal((await f.call('/classify',proposal(f))).status,403);
 }
 f.sqlite.prepare("UPDATE users SET role='root' WHERE id=?").run(f.root.id);
 assert.equal((await f.call('/classify',proposal(f),{noCsrf:true})).status,403);
 f.env.APP_KIND='collector';assert.equal((await f.call()).status,403);delete f.env.APP_KIND;
 f.sqlite.exec('DELETE FROM sessions');assert.equal((await f.call()).status,401);
});
test('filters/pagination omit inactive/works/conveniadas and return stable totals',async t=>{
 const f=await setup(t);section(f);let r=await f.call('?status=partial');assert.equal(r.data.total,1);assert.equal(r.data.totals.none,3);
 f.sqlite.prepare("UPDATE units SET name='ESCOLA São José',name_key='escola sao jose' WHERE id=?").run(f.ids.progress);assert.equal((await f.call('?q=sao')).data.total,1);
 f.sqlite.prepare("UPDATE units SET unit_type='Obra em andamento' WHERE id=?").run(f.ids.progress);assert.equal((await f.call()).data.total,3);assert.equal((await f.call('/classify',proposal(f))).status,404);
 for(let n=0;n<53;n++)f.sqlite.prepare('INSERT INTO units(id,name,name_key,active,created_at,updated_at) VALUES(?,?,?,?,?,?)').run('extra'+n,'EXEMPLO '+String(n).padStart(3,'0'),'extra'+n,1,1,1);
 r=await f.call();assert.equal(r.data.items.length,50);const r2=await f.call('?offset=50');assert.equal(new Set([...r.data.items,...r2.data.items].map(u=>u.id)).size,56);
 assert.equal((await f.call('?offset=-1')).status,400);assert.equal((await f.call('?status=bad')).status,400);
});
test('migration backfills real answers without altering existing data; rollback projection consistent',async t=>{
 const f=await setup(t,{beforeMigration:'0032'});section(f);const before=f.sqlite.prepare('SELECT * FROM inspection_sections').all();
 f.sqlite.exec(readFileSync('migrations/0032_collection_control.sql','utf8'));assert.deepEqual(f.sqlite.prepare('SELECT * FROM inspection_sections').all(),before);assert.equal(item(await f.call(),f.ids.progress).status,'partial');
 f.sqlite.exec("BEGIN; UPDATE inspection_sections SET data_json='{}'; ROLLBACK;");assert.equal(item(await f.call(),f.ids.progress).status,'partial');
 const plan=f.sqlite.prepare('EXPLAIN QUERY PLAN SELECT 1 FROM collection_data_presence WHERE unit_id=?').all(f.ids.progress);assert.match(JSON.stringify(plan),/COVERING INDEX collection_data_presence_unit/);assert.equal(f.sqlite.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});
