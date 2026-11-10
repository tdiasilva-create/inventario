import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {panelSearch} from '../server/panel-search.mjs';
import {equipmentRead} from '../server/inventory-equipment.mjs';
import {legacyUnitTypes} from '../web/unit-schema.js';
function setup(){const f=collectorFixture(),seed=seedEquipmentConsultation(f),env={DB:f.db};const call=(q,extra='',role='root',method='GET')=>{const r=new Request('https://isolado.test/api/inventory/search?q='+encodeURIComponent(q)+'&'+extra,{method});return panelSearch(r,new URL(r.url),role?{...f.root,role}:null,env,f.helpers);};return {...f,...seed,env,call};}
test('busca global pesquisa dados salvos e telemetria, preserva zeros e separa unidades de fichas; não escreve',async()=>{const f=setup();try{
 f.sqlite.prepare('UPDATE units SET name=?,manager_name=?,code=? WHERE id=?').run('TESTE · Educação São Luís','JOÃO GESTOR','99999999',f.unit);
 const before=f.sqlite.prepare('SELECT total_changes() n').get().n;
 for(const term of ['teste-pc-001','001234567','001 234 567','000.987.654',f.items[0].id,'SERIE-1','MODELO RASCUNHO','Fabricante de teste','Mesa 55','laboratorio','educacao sao luis']){const r=await f.call(term);assert.equal(r.status,200);const b=await r.json();assert.ok(b.equipment.total>0,term);assert.ok(b.equipment.items.every(e=>e.partial===1));assert.ok(!JSON.stringify(b).includes('PRIVATE/'));assert.ok(!JSON.stringify(b).includes('RASCUNHO SEGREDO'));}
 for(const term of ['JOAO GESTOR','99999999','Educação São Luís']){const b=await(await f.call(term)).json();assert.equal(b.units.items[0].id,f.unit);}
 const phone=await(await f.call('001234567')).json();assert.equal(phone.equipment.items[0].anydesk,'001234567');assert.equal(phone.equipment.items[0].link_state,'linked');assert.equal(phone.equipment.items[0].hostname,'TESTE-PC-001');
 const first=await(await f.call('MODELO RASCUNHO')).json(),second=await(await f.call('MODELO RASCUNHO','equipmentOffset=30')).json();assert.equal(first.equipment.total,59);assert.equal(first.equipment.items.length,30);assert.equal(second.equipment.items.length,29);assert.equal(new Set([...first.equipment.items,...second.equipment.items].map(e=>e.id)).size,59);assert.equal(second.equipment.nextOffset,null);
 for(const term of ["%' OR 1=1 --",'%', 'jamaisencontrado']){const b=await(await f.call(term.length<2?term+'%':term)).json();assert.equal(b.equipment.total,0);}
 assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,before);
 }finally{f.sqlite.close();}});
test('busca limita perfis, método, parâmetros e não expõe unidades inativas, fora do escopo ou agente desvinculado',async()=>{const f=setup();try{
 for(const role of ['root','admin','visualizador'])assert.equal((await f.call('teste','',role)).status,200);
 assert.equal((await f.call('teste','',null)).status,401);assert.equal((await f.call('teste','','operador')).status,403);assert.equal((await f.call('teste','','root','POST')).status,405);
 for(const [q,extra]of [['x',''],['a'.repeat(121),''],['teste','equipmentOffset=-1'],['teste','unitOffset=1.5'],['teste','unitOffset=Infinity']])assert.equal((await f.call(q,extra)).status,400);
 f.env.APP_KIND='collector';assert.equal((await f.call('teste')).status,403);delete f.env.APP_KIND;
 f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),f.device);
 assert.equal((await(await f.call('TESTE-PC-001')).json()).equipment.total,0);
 for(const type of legacyUnitTypes){f.sqlite.prepare('UPDATE units SET unit_type=? WHERE id=?').run(type,f.unit);const b=await(await f.call('teste')).json();assert.equal(b.equipment.total,0);assert.ok(b.units.items.every(u=>u.id!==f.unit));}
 f.sqlite.prepare("UPDATE units SET active=0,unit_type='Escola municipal' WHERE id=?").run(f.unit);assert.equal((await(await f.call('teste')).json()).equipment.total,0);
 }finally{f.sqlite.close();}});
test('páginas independentes de unidades, nome corrigido, categoria, ficha publicada e cadastro retirado',async()=>{const f=setup();try{
 for(let n=0;n<35;n++)f.sqlite.prepare('INSERT INTO units(id,name,name_key,active,created_at,updated_at) VALUES(?,?,?,1,?,?)').run(crypto.randomUUID(),'PAGINA · Unidade '+n,'pagina-'+n,Date.now(),Date.now());
 const a=await(await f.call('pagina')).json(),b=await(await f.call('pagina','unitOffset=20')).json();assert.equal(a.units.total,35);assert.equal(a.units.items.length,20);assert.equal(b.units.items.length,15);assert.equal(new Set([...a.units.items,...b.units.items].map(u=>u.id)).size,35);assert.equal(a.equipment.total,0);
 assert.equal((await(await f.call('impressora')).json()).equipment.items[0].id,f.printer);
 f.sqlite.prepare('INSERT INTO equipment_names(equipment_id,unit_id,name,updated_by,updated_at,version) VALUES(?,?,?,?,?,1)').run(f.items[0].id,f.unit,'PC · Recepção',f.root.id,Date.now());
 f.sqlite.prepare('UPDATE equipments SET data_json=published_json WHERE id=?').run(f.items[0].id);
 const renamed=await(await f.call('recepcao')).json();assert.equal(renamed.equipment.total,1);assert.equal(renamed.equipment.items[0].partial,0);assert.equal(renamed.equipment.items[0].display_name,'PC · Recepção');
 // D-078 retira a ficha da tabela ativa, mantendo os arquivos/histórico fora da busca.
 f.sqlite.prepare('DELETE FROM equipments WHERE id=?').run(f.draft);assert.equal((await(await f.call(f.draft)).json()).equipment.total,0);
 }finally{f.sqlite.close();}});
test('ficha atual e fotos de rascunho são explícitas; o padrão oficial mantém somente publicados',async()=>{const f=setup();try{
 const open=crypto.randomUUID();f.sqlite.prepare("INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,state) VALUES(?,?,?,?,?,'open')").run(open,f.unit,f.root.id,Date.now(),Date.now());
 f.sqlite.prepare('UPDATE equipments SET inspection_id=? WHERE id=?').run(open,f.draft);const photo=f.photo(f.draft,f.unit,open);
 const call=async scope=>{const r=new Request('https://isolado.test/api/inventory/equipment?unitId='+f.unit+'&q='+f.draft+(scope?'&scope='+scope:''));return equipmentRead(r,new URL(r.url),f.root,f.env,{...f.helpers,unit:async()=>({id:f.unit})});};
 assert.equal((await(await call()).json()).total,0);
 const current=await(await call('current')).json();assert.equal(current.source,'current');assert.equal(current.total,1);assert.equal(current.items[0].data.model,'MODELO RASCUNHO');assert.equal(current.items[0].record_partial,true);assert.equal(current.items[0].photo_count,1);assert.equal(current.items[0].photo_id,photo);
 assert.equal((await call('anything')).status,403);f.env.APP_KIND='collector';assert.equal((await call('current')).status,403);
 }finally{f.sqlite.close();}});
