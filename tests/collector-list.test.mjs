import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {unitRoutes} from '../server/units.mjs';import {collectorRoutes} from '../server/collector.mjs';
import {visibleCollectorUnits,unitListState} from '../web/collector-unit-list.js';
test('operador lista pendentes sem atribuição, mantém rascunhos e só filtra ao digitar',async()=>{
 const f=collectorFixture();try{const request=new Request('http://test/api/units'),response=await unitRoutes(request,new URL(request.url),f.operator,f.db,f.helpers),{units}=await response.json();
 assert.equal(response.status,200);assert.deepEqual(new Set(units.map(u=>u.id)),new Set([f.ids.pending,f.ids.progress,f.ids.assigned,f.ids.blocked]));
 assert.equal(visibleCollectorUnits(units).length,2);assert.equal(visibleCollectorUnits(units,'sem inventário').length,1);assert.equal(visibleCollectorUnits(units,'','received').length,2);
 assert.equal(unitListState(units.find(u=>u.id===f.ids.progress)),'progress');
 }finally{f.sqlite.close();}
});
test('D-046 permite retomar inventário de outra equipe e bloqueia unidade inativa',async()=>{
 const f=collectorFixture();const start=async(unitId,user=f.operator)=>{const request=new Request('http://test/api/collector/start',{method:'POST',body:JSON.stringify({unitId})});return collectorRoutes(request,new URL(request.url),user,{DB:f.db},f.helpers);};
 try{const first=await start(f.ids.pending);assert.equal(first.status,200);const {inspection}=await first.json();assert.equal((await(await start(f.ids.pending)).json()).inspection.id,inspection.id);
 assert.equal((await start(f.ids.inactive)).status,403);assert.equal((await start(f.ids.blocked)).status,200);assert.equal((await start(f.ids.pending,{...f.operator,role:'visualizador'})).status,403);
 f.sqlite.prepare('INSERT INTO published_equipment_counts(unit_id,category,records,items) VALUES(?,?,1,1)').run(f.ids.pending,'desktop');
 assert.equal((await start(f.ids.pending)).status,200,'quem iniciou continua autorizado após publicação');
 const request=new Request('http://test/api/collector/inspection?id='+inspection.id);assert.equal((await collectorRoutes(request,new URL(request.url),f.operator,{DB:f.db},f.helpers)).status,200);
 }finally{f.sqlite.close();}
});

test('servidor conclui conectividade sem B e preserva descrição após cadastro de ambiente',async()=>{
 const f=collectorFixture();
 const post=async(path,data)=>{const r=new Request('http://test/api/collector/'+path,{method:'POST',body:JSON.stringify(data)});return collectorRoutes(r,new URL(r.url),f.operator,{DB:f.db},f.helpers);};
 try{
 const {inspection}=await(await post('start',{unitId:f.ids.pending})).json();
 const answers={exists:'Não',uncovered:'Sim',affectedDescription:'Salas dos fundos',occurrences:[{id:crypto.randomUUID(),description:'Sem conectividade nas salas dos fundos',visible:'Não'}]};
 const first=await post('section-save',{inspectionId:inspection.id,section:'C',version:1,answers,complete:true});assert.equal(first.status,200,await first.text());
 assert.equal(f.sqlite.prepare("SELECT state FROM inspection_sections WHERE inspection_id=? AND section='B'").get(inspection.id).state,'Pendente');
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM environments WHERE unit_id=?').get(f.ids.pending).n,0);
 const environment=await post('environment-save',{inspectionId:inspection.id,name:'Sala dos fundos',type:'Outro ambiente'});assert.equal(environment.status,201);
 const get=new Request('http://test/api/collector/review?id='+inspection.id),review=await(await collectorRoutes(get,new URL(get.url),f.operator,{DB:f.db},f.helpers)).json();assert.equal(review.errors.C,undefined);
 const saved=JSON.parse(f.sqlite.prepare("SELECT data_json FROM inspection_sections WHERE inspection_id=? AND section='C'").get(inspection.id).data_json);assert.equal(saved.affectedDescription,'Salas dos fundos');
 }finally{f.sqlite.close();}
});
