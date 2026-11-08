import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {seedEquipmentConsultation} from './helpers/equipment-consultation.mjs';
import {equipmentRead} from '../server/inventory-equipment.mjs';
import {photoGalleryRead} from '../server/photo-gallery.mjs';
function setup(){const f=collectorFixture(),data=seedEquipmentConsultation(f),env={DB:f.db},helpers={...f.helpers,unit:async id=>f.sqlite.prepare('SELECT * FROM units WHERE id=? AND active=1').get(id)};
 const call=(query='',role='root',method='GET')=>{const request=new Request('https://isolado.test/api/inventory/equipment?unitId='+data.unit+'&'+query,{method});return equipmentRead(request,new URL(request.url),role?{...f.root,role}:null,env,helpers);};return {...f,...data,env,call};}
test('consulta oficial: pagina >50, categorias da matriz, quantidades, busca no servidor e fotos isoladas',async()=>{const f=setup();try{
 const before=f.sqlite.prepare('SELECT total_changes() n').get().n;
 const first=await (await f.call()).json();assert.equal(first.items.length,50);assert.equal(first.total,58);assert.equal(first.totalItems,65);assert.equal(first.nextOffset,50);
 const second=await(await f.call('offset=50')).json();assert.equal(second.items.length,8);assert.equal(second.nextOffset,null);assert.equal(new Set([...first.items,...second.items].map(x=>x.id)).size,58);
 assert.equal(first.items[0].hostname,'TESTE-PC-001');assert.equal(first.items[0].photo_count,1);assert.equal(first.items[0].photo_id,f.firstPhoto);assert.equal(first.items[1].photo_id,f.manualPhoto);assert.equal(first.items[2].photo_count,0);assert.equal(first.items[0].data.anydesk,'001234567');assert.equal(first.items[0].data.model,'Modelo 1');assert.ok(!JSON.stringify(first).includes('PRIVATE/'));assert.ok(!JSON.stringify(first).includes('MODELO RASCUNHO'));
 for(const [col,total]of [[0,55],[1,1],[2,1],[3,0],[4,1],[5,0],[6,0],[7,0]])assert.equal((await(await f.call('category='+col)).json()).total,total);
 assert.equal((await(await f.call('q=Mesa%2055')).json()).items[0].id,f.items[54].id);
 assert.equal((await(await f.call('q=TESTE-PC-001')).json()).total,1);
 assert.equal((await(await f.call('q=RASCUNHO')).json()).total,0);
 assert.equal((await(await f.call('q=%25')).json()).total,0,'busca literal, sem curinga SQL');
 assert.equal((await(await f.call('agent=linked')).json()).total,1);assert.equal((await(await f.call('agent=unlinked')).json()).total,57);
 assert.equal((await(await f.call('photo=yes')).json()).total,2);assert.equal((await(await f.call('photo=no')).json()).total,56);
 assert.equal((await(await f.call('category=2')).json()).totalItems,8);
 assert.equal(f.sqlite.prepare('SELECT total_changes() n').get().n,before);
 }finally{f.sqlite.close();}});
test('consulta gerencial exige perfil, GET, unidade ativa e parâmetros válidos',async()=>{const f=setup();try{
 for(const role of ['root','admin','visualizador'])assert.equal((await f.call('',role)).status,200);
 assert.equal((await f.call('',null)).status,401);assert.equal((await f.call('','operador')).status,403);assert.equal((await f.call('','root','POST')).status,405);
 for(const query of ['offset=-1','offset=1.5','category=10','agent=any','photo=bad','q='+('a'.repeat(121))])assert.equal((await f.call(query)).status,400,query);
 f.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(f.unit);assert.equal((await f.call()).status,403);
 }finally{f.sqlite.close();}});
test('galeria por equipamento não mistura unidade, fotos parciais ou outro alvo; pagina acima de48',async()=>{const f=setup();try{
 const call=async query=>{const req=new Request('https://isolado.test/api/inventory/photos?'+query);return photoGalleryRead(req,new URL(req.url),f.root,f.env,f.helpers);};
 let q='unitId='+f.unit+'&equipmentId='+f.items[0].id+'&scope=published';
 let data=await(await call(q)).json();assert.deepEqual(data.items.map(x=>x.id),[f.firstPhoto]);
 assert.equal((await call('equipmentId='+f.items[0].id)).status,400);assert.equal((await call(q+'&kind=facade')).status,400);
 assert.equal((await(await call('unitId='+f.ids.assigned+'&equipmentId='+f.items[0].id+'&scope=published')).json()).items.length,0);
 for(let n=0;n<50;n++)f.photo();data=await(await call(q)).json();assert.equal(data.items.length,48);assert.equal(data.published,51);assert.ok(data.nextCursor);const next=await(await call(q+'&cursor='+encodeURIComponent(data.nextCursor))).json();assert.equal(next.items.length,3);assert.equal(new Set([...data.items,...next.items].map(x=>x.id)).size,51);
 }finally{f.sqlite.close();}});
