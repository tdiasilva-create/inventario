import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const {request}=createRequire(import.meta.url)('C:/Users/SIGAE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='https://painel-semed-paco-validacao.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';
const c=await request.newContext(),credentials=JSON.parse(await readFile('private-data/local-credentials.json','utf8')).find(x=>x.username==='root');
const fixture=JSON.parse(await readFile('private-data/collector-fixture.json','utf8'));
await c.post(base+'/api/auth/login',{headers:{Origin:base},data:credentials});
const csrf=(await(await c.get(base+'/api/auth/me')).json()).csrf;
const get=async path=>{const r=await c.get(base+path);assert.equal(r.status(),200,await r.text());return r.json();};
const post=async(path,data,status=200)=>{const r=await c.post(base+path,{headers:{Origin:base,'X-CSRF-Token':csrf},data});assert.equal(r.status(),status,await r.text());return r.json();};
try{
 const before=await get('/api/inventory/summary');
 let snapshot=await get('/api/collector/inspection?id='+fixture.inspectionId);
 const answers={A:{},B:{counts:[{type:'Outro ambiente',quantity:1}]},C:{exists:'Não',uncovered:'Não'},D:{wired:'Não',wifi:'Não',routers:'Não',aps:'Não',switches:'Não',racks:'Não',cables:'Não avaliada',damaged:'Não'},E:{outlets:'Sim',irregular:'Não',protected:'Não',waiting:'Não'},H:{lack:'Não'}};
 for(const [section,data] of Object.entries(answers)){
  const s=snapshot.sections[section];
  if(s.state==='Concluído')continue;
  await post('/api/collector/section-save',{inspectionId:fixture.inspectionId,section,answers:data,version:s.version,complete:true});
 }
 for(const section of ['F','G'])await post('/api/collector/inventory-section',{inspectionId:fixture.inspectionId,section,version:snapshot.sections[section].version});
 let review=await get('/api/collector/review?id='+fixture.inspectionId);assert.deepEqual(review.errors,{});
 await post('/api/collector/finish',{inspectionId:fixture.inspectionId,confirm:true,revision:review.revision-1},409);
 await post('/api/collector/finish',{inspectionId:fixture.inspectionId,confirm:true,revision:review.revision});
 await post('/api/collector/finish',{inspectionId:fixture.inspectionId,confirm:true,revision:review.revision});
 const summary=await get('/api/inventory/summary'),visit=summary.visits.find(x=>x.unit_id===fixture.unitId);
 assert.equal(visit.visits,1);assert.equal(summary.equipment.filter(x=>x.unit_id===fixture.unitId).reduce((s,x)=>s+x.records,0),1006);
 const official=await get('/api/inventory/unit?unitId='+fixture.unitId);assert.equal(official.environments.length,1);
 assert.equal((await get('/api/inventory/equipment?unitId='+fixture.unitId)).items.length,50);
 const next=await post('/api/collector/start',{unitId:fixture.unitId});assert.notEqual(next.inspection.id,fixture.inspectionId);
 snapshot=await get('/api/collector/inspection?id='+next.inspection.id);assert.equal(snapshot.sections.C.data.exists,'Não');assert.equal(snapshot.sections.C.state,'Pendente');
 await post('/api/collector/verify',{inspectionId:next.inspection.id,id:fixture.equipmentId,result:'Não verificado'});
 review=await get('/api/collector/review?id='+next.inspection.id);assert.equal(review.unverified,1006);
 const filtered=await get('/api/collector/equipment-list?'+new URLSearchParams({unitId:fixture.unitId,inspectionId:next.inspection.id,verification:'unverified'}));assert.equal(filtered.items.length,50);
 await post('/api/collector/verify',{inspectionId:next.inspection.id,id:fixture.equipmentId,result:'Não localizado',reason:'Não localizado no teste isolado'});
 assert.equal((await get('/api/collector/review?id='+next.inspection.id)).missing,1);
 assert.deepEqual(await get('/api/inventory/summary'),summary);
 const result={status:'PASS',records:1006,checks:['conclusão manual A–H','versão desatualizada recusada','conclusão idempotente','1006 registros oficiais após confirmação','ambiente e paginação recebidos','nova vistoria mantém IDs e respostas','não verificado continua pendente','não localizado não altera publicação antes da conclusão','rascunhos não mudam indicadores'],beforePublished:before.equipment.length};
 await writeFile('docs/05-qualidade/evidencias/coletor-online/finish.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await c.dispose();}
