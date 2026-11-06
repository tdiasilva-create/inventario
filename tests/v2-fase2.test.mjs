import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {agentIdentity,enroll,session,humanFetch,lockFor} from './helpers/agent-client.mjs';
import {validateV2Equipment,validateV2Section,pendingAgentLinks,categoryStatusOptions} from '../web/collector-v2-schema.js';
import worker from '../server/worker.mjs';
const origin='https://coletor.test';
const envFor=f=>({DB:f.db,AUTH_PEPPER:'pepper-isolado',APP_KIND:'collector',ASSETS:{fetch:async()=>new Response('asset')}});
const base={category:'desktop',mode:'Individual',quantity:1,environment:'room',assetStatus:'Sem patrimônio',condition:'Bom',operation:'Funcionando',use:'Em uso'},ctx={environments:[{id:'room'}]};
test('V2 4.2/4.M1: modo Agente aceito sem motivo manual; modo Manual exige motivo; 2.L11 opcional no resultado externo',()=>{
 assert.deepEqual(validateV2Equipment({...base,registration:'Agente'},ctx),{});
 assert.ok(validateV2Equipment({...base,registration:'Manual'},ctx).manualReason,'manual exige motivo');
 assert.deepEqual(validateV2Equipment({...base,registration:'Manual',manualReason:'Não liga'},ctx),{});
 assert.ok(validateV2Equipment({...base,registration:'Outro'},ctx).registration,'opção inválida recusada');
 assert.ok(!('environment' in validateV2Equipment({...base,registration:'Agente',environment:'x'},ctx)&&/grupo B/.test(validateV2Equipment({...base,registration:'Agente',environment:'x'},{...ctx,legacyGroups:false}).environment)),'mensagem sem referência ao grupo B na V2');
 const link={provider:'Op',type:'Fibra',contracted:'100',works:'Sim',drops:'Não',quality:'Boa',satisfaction:'Satisfeito',test:'Resultado externo manual',download:'50',upload:'10',testedAt:'2026-11-04T09:00',testOrigin:'Medido no computador cabeado'};
 assert.deepEqual(validateV2Section('C',{exists:'Sim',linkCount:'1',links:[link]}),{},'schoolWifi não bloqueia o resultado externo');
 assert.deepEqual(pendingAgentLinks([{id:'1',data:{category:'desktop',registration:'Agente'},agent_linked:false},{id:'2',data:{category:'desktop',registration:'Agente'},agent_linked:true},{id:'3',data:{category:'desktop',registration:'Manual'},agent_linked:false},{id:'4',data:{category:'printer',registration:'Agente'},agent_linked:false}]).map(e=>e.id),['1']);
 assert.deepEqual(validateV2Section('F',{categoryStatus:categoryStatusOptions[1]}),{});assert.ok(validateV2Section('G',{categoryStatus:'Outra coisa'}).categoryStatus);
});
test('servidor V2: F só conclui com vínculo confirmado; 7.C1 gravado; ambiente parecido pede confirmação; telefone oculto ao visualizador',async()=>{
 const f=collectorFixture(),env=envFor(f);
 try{
 const root=await session(f,f.root),op=await session(f,f.operator);
 const start=await humanFetch(worker,env,origin,op,'/api/collector/v2-start',{unitId:f.ids.pending});const i=start.data.inspection;
 const e1=await humanFetch(worker,env,origin,op,'/api/collector/environment-save',{inspectionId:i.id,name:'Laboratório de Informática 1',type:''});assert.equal(e1.status,201);
 // Nome parecido: aviso com a lista; confirmação explícita cria mesmo assim; nome igual reutiliza.
 const similar=await humanFetch(worker,env,origin,op,'/api/collector/environment-save',{inspectionId:i.id,name:'Laboratorio de informatica 01',type:''});assert.equal(similar.status,409);assert.equal(similar.data.similar[0].name,'Laboratório de Informática 1');
 const confirmed=await humanFetch(worker,env,origin,op,'/api/collector/environment-save',{inspectionId:i.id,name:'Laboratorio de informatica 01',type:'',confirmSimilar:true});assert.equal(confirmed.status,201);
 const same=await humanFetch(worker,env,origin,op,'/api/collector/environment-save',{inspectionId:i.id,name:'laboratório de informática 1',type:''});assert.equal(same.status,200);assert.equal(same.data.existing,true);
 const envId=e1.data.environment.id,id=crypto.randomUUID();
 const saved=await humanFetch(worker,env,origin,op,'/api/collector/equipment-save',{inspectionId:i.id,id,data:{...base,environment:envId,registration:'Agente'}});assert.equal(saved.status,201,JSON.stringify(saved.data));
 const list=await humanFetch(worker,env,origin,op,'/api/collector/equipment-list?'+new URLSearchParams({unitId:f.ids.pending,inspectionId:i.id,category:'computers'}));assert.equal(list.data.items[0].agent_linked,0);
 // 7.C1 na seção F (opcional) e tentativa de concluir F sem vínculo.
 const status=await humanFetch(worker,env,origin,op,'/api/collector/section-save',{inspectionId:i.id,section:'F',version:1,answers:{categoryStatus:'Não foi possível verificar'}});assert.equal(status.status,200,JSON.stringify(status.data));
 const blocked=await humanFetch(worker,env,origin,op,'/api/collector/inventory-section',{inspectionId:i.id,section:'F',version:status.data.version});assert.equal(blocked.status,409);assert.equal(blocked.data.pendingAgentLinks,1);
 let review=await humanFetch(worker,env,origin,op,'/api/collector/review?id='+i.id);assert.match(review.data.errors.F,/sem vínculo/);assert.ok(review.data.details['agent:'+id]);
 // Vínculo real pelo módulo do agente libera a conclusão.
 const g=await humanFetch(worker,env,origin,root,'/api/root/agent-install-grants',{expires_in_seconds:3600});const identity=await agentIdentity();const {enrollment:en}=await enroll(worker,env,origin,identity,g.data.grant_code);assert.equal(en.status,201);
 const claim=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',{request_id:crypto.randomUUID(),enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending,environment_id:envId,inspection_id:i.id,equipment:{mode:'existing',equipment_id:id,expected_version:1},position:{label:'PC 01'},visual_code_confirmed:true,lock_token:await lockFor(worker,env,origin,op,i.id,id)});assert.equal(claim.status,201,JSON.stringify(claim.data));
 const done=await humanFetch(worker,env,origin,op,'/api/collector/inventory-section',{inspectionId:i.id,section:'F',version:status.data.version});assert.equal(done.status,200,JSON.stringify(done.data));
 review=await humanFetch(worker,env,origin,op,'/api/collector/review?id='+i.id);assert.ok(!review.data.errors.F);
 assert.equal(JSON.parse(f.sqlite.prepare("SELECT data_json FROM inspection_sections WHERE inspection_id=? AND section='F'").get(i.id).data_json).categoryStatus,'Não foi possível verificar');
 // Telefone do acompanhante: operador/root veem; visualizador não recebe.
 await humanFetch(worker,env,origin,op,'/api/collector/section-save',{inspectionId:i.id,section:'A',version:1,answers:{present:'Sim',name:'TESTE ISOLADO',role:'Direção',phone:'(98) 90000-0000'}});
 const viewer={...f.root,id:f.root.id};f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);const vs=await session(f,viewer);
 const partial=await humanFetch(worker,env,origin,vs,'/api/inventory/in-progress-detail?id='+i.id);assert.equal(partial.status,200,JSON.stringify(partial.data));assert.equal(partial.data.sections.A.name,'TESTE ISOLADO');assert.equal(partial.data.sections.A.phone,undefined);
 f.sqlite.prepare("UPDATE users SET role='root' WHERE id=?").run(f.root.id);
 const full=await humanFetch(worker,env,origin,root,'/api/inventory/in-progress-detail?id='+i.id);assert.equal(full.data.sections.A.phone,'(98) 90000-0000');
 }finally{f.sqlite.close();}
});
