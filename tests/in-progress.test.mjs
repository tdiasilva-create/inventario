import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';import {collectorRoutes} from '../server/collector.mjs';
const call=async(f,user,path,data)=>{const r=new Request('http://test'+path,data?{method:'POST',body:JSON.stringify(data)}:{});return collectorRoutes(r,new URL(r.url),user,{DB:f.db},f.helpers);};
const ok=async(f,user,path,data)=>{const r=await call(f,user,path,data);assert.ok(r.status<300,await r.clone().text());return r.json();};
test('rascunhos salvos aparecem imediatamente no acompanhamento, sem publicar e sem escrita de leitura',async()=>{
 const f=collectorFixture();try{
 const {inspection}=await ok(f,f.operator,'/api/collector/start',{unitId:f.ids.pending});
 await ok(f,f.operator,'/api/collector/section-save',{inspectionId:inspection.id,section:'C',version:1,answers:{exists:'Sim'}});
 const history=f.sqlite.prepare('SELECT COUNT(*) AS n FROM collection_history').get().n;
 for(const role of ['root','admin','visualizador']){const user={...f.root,role},list=await ok(f,user,'/api/inventory/in-progress');const row=list.items.find(x=>x.id===inspection.id);assert.equal(row.states.C,'Em andamento');assert.equal(row.records,0);const detail=await ok(f,user,'/api/inventory/in-progress-detail?id='+inspection.id);assert.equal(detail.sections.C.exists,'Sim');assert.equal(detail.activity[0].actor_name,'Operador · teste isolado');}
 assert.equal((await call(f,f.operator,'/api/inventory/in-progress')).status,403);
 assert.equal((await call(f,f.root,'/api/inventory/in-progress',{})).status,405);
 assert.equal((await call(f,f.root,'/api/inventory/in-progress?cursor=invalid')).status,400);
 assert.equal((await call(f,f.root,'/api/inventory/in-progress-detail?id='+crypto.randomUUID())).status,404);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM collection_history').get().n,history);
 assert.equal((await ok(f,f.root,'/api/inventory/summary')).equipment.some(x=>x.unit_id===f.ids.pending),false);
 }finally{f.sqlite.close();}
});
test('equipamentos parciais paginam, lotes são contados, conclusão retira andamento e revisita não duplica',async()=>{
 const f=collectorFixture();try{
 const {inspection}=await ok(f,f.operator,'/api/collector/start',{unitId:f.ids.pending}),{environment}=await ok(f,f.operator,'/api/collector/environment-save',{inspectionId:inspection.id,name:'Sala real no teste isolado',type:'Outro ambiente'});
 const item={category:'desktop',mode:'Individual',quantity:1,environment:environment.id,asset:'Sem patrimônio',serial:'Sem número de série',brand:'Não identificado',model:'Não identificado',condition:'Bom',operation:'Funcionando',use:'Em uso',technical:{}},ids=[];
 for(let index=0;index<53;index++){const id=crypto.randomUUID();ids.push(id);await ok(f,f.operator,'/api/collector/equipment-save',{inspectionId:inspection.id,id,data:{...item,notes:'Item isolado '+index}});}
 await ok(f,f.operator,'/api/collector/equipment-save',{inspectionId:inspection.id,id:crypto.randomUUID(),data:{...item,category:'tv',mode:'Lote',quantity:12}});
 const total=(await ok(f,f.root,'/api/inventory/in-progress-detail?id='+inspection.id)).totals;assert.deepEqual(total,{records:54,items:65,new_records:54,changed_records:0});
 let cursor='',seen=[];do{const page=await ok(f,f.root,'/api/inventory/in-progress-equipment?'+new URLSearchParams({id:inspection.id,cursor}));assert.ok(page.items.length<=50);seen.push(...page.items.map(x=>x.id));cursor=page.nextCursor||'';}while(cursor);assert.equal(seen.length,54);assert.equal(new Set(seen).size,54);
 const snapshot=await ok(f,f.operator,'/api/collector/inspection?id='+inspection.id),answers={A:{},B:{counts:[{type:'Outro ambiente',quantity:1}]},C:{exists:'Não',uncovered:'Não'},D:{wired:'Não',wifi:'Não',routers:'Não',aps:'Não',switches:'Não',racks:'Não',cables:'Não avaliada',damaged:'Não'},E:{outlets:'Sim',irregular:'Não',protected:'Não',waiting:'Não'},H:{lack:'Não'}};
 for(const [section,data]of Object.entries(answers))await ok(f,f.operator,'/api/collector/section-save',{inspectionId:inspection.id,section,version:snapshot.sections[section].version,answers:data,complete:true});
 for(const section of ['F','G'])await ok(f,f.operator,'/api/collector/inventory-section',{inspectionId:inspection.id,section,version:snapshot.sections[section].version});
 const review=await ok(f,f.operator,'/api/collector/review?id='+inspection.id);assert.deepEqual(review.errors,{});await ok(f,f.operator,'/api/collector/finish',{inspectionId:inspection.id,revision:review.revision,confirm:true});
 assert.equal((await ok(f,f.root,'/api/inventory/in-progress')).items.some(x=>x.id===inspection.id),false);
 assert.equal((await ok(f,f.root,'/api/inventory/in-progress-detail?id='+inspection.id)).inspection.state,'completed');
 assert.equal((await ok(f,f.root,'/api/inventory/in-progress-equipment?id='+inspection.id)).completed,true);
 const official=await ok(f,f.root,'/api/inventory/summary');assert.equal(official.equipment.filter(x=>x.unit_id===f.ids.pending).reduce((n,x)=>n+x.quantity,0),65);
 const next=await ok(f,f.operator,'/api/collector/start',{unitId:f.ids.pending});const lock=await ok(f,f.operator,'/api/collector/equipment-lock',{inspectionId:next.inspection.id,id:ids[0]});await ok(f,f.operator,'/api/collector/equipment-save',{inspectionId:next.inspection.id,id:ids[0],version:1,lockToken:lock.token,data:{...item,notes:'Atualização parcial'}});
 const revisit=(await ok(f,f.root,'/api/inventory/in-progress-detail?id='+next.inspection.id)).totals;assert.deepEqual(revisit,{records:1,items:1,new_records:0,changed_records:1});assert.deepEqual(await ok(f,f.root,'/api/inventory/summary'),official);
 }finally{f.sqlite.close();}
});

