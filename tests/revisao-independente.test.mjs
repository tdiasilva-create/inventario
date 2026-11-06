// Regressões da revisão independente de 04/11/2026 (REV-01 a REV-07). Cada teste exige o comportamento CORRETO,
// com asserções inversas às observações de defeito de revisoes/claude-v2-qr-2026-11-04-analise/reproducoes.mjs.
// D1 em memória (node:sqlite), Worker real em processo, rede externa proibida; nada toca produção.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {collectorFixture} from './helpers/collector-db.mjs';
import {agentIdentity,enroll,heartbeatBody,inventoryBody,machinePost,session,humanFetch,lockFor} from './helpers/agent-client.mjs';
import {v2PhotoErrors} from '../web/collector-v2-schema.js';
import worker from '../server/worker.mjs';
const origin='https://revisao-isolada.test';
globalThis.fetch=async()=>{throw Error('Rede externa proibida neste teste');};
async function setup({registration='Manual',category='desktop',withLock=true}={}){
 const f=collectorFixture();f.sqlite.exec('PRAGMA foreign_keys=ON');
 const env={DB:f.db,AUTH_PEPPER:'REVISAO-ISOLADA',APP_KIND:'collector',ASSETS:{fetch:async()=>new Response('asset isolado')}};
 const root=await session(f,f.root),op=await session(f,f.operator);
 const api=(path,data,sess=op,opts)=>humanFetch(worker,env,origin,sess,path,data,opts);
 const started=await api('/api/collector/v2-start',{unitId:f.ids.pending});assert.equal(started.status,201);
 const inspection=started.data.inspection;
 const er=await api('/api/collector/environment-save',{inspectionId:inspection.id,name:'TESTE ISOLADO Sala A'});assert.equal(er.status,201);
 const room=er.data.environment,id=crypto.randomUUID();
 const data={category,registration,manualReason:registration==='Manual'?'Não liga':undefined,mode:'Individual',quantity:1,environment:room.id,assetStatus:'Sem patrimônio',condition:'Bom',operation:'Funcionando',use:'Em uso'};
 const saved=await api('/api/collector/equipment-save',{inspectionId:inspection.id,id,data});assert.equal(saved.status,201,JSON.stringify(saved.data));
 const lock=withLock?await lockFor(worker,env,origin,op,inspection.id,id):null;
 return {...f,env,api,root,op,rootUser:f.root,inspection,room,id,data,version:saved.data.version,lock};
}
async function enrollment(s){
 const grant=await s.api('/api/root/agent-install-grants',{expires_in_seconds:3600,max_uses:1},s.root);assert.equal(grant.status,201);
 const identity=await agentIdentity();const result=await enroll(worker,s.env,origin,identity,grant.data.grant_code);assert.equal(result.enrollment.status,201);
 return {identity,enrollment:result.enrollment.data};
}
const claimBody=(s,a,extra={})=>({request_id:crypto.randomUUID(),enrollment_id:a.enrollment.enrollment_id,pairing_code:a.enrollment.pairing_code,unit_id:s.ids.pending,environment_id:s.room.id,inspection_id:s.inspection.id,equipment:{mode:'existing',equipment_id:s.id,expected_version:s.version},position:{label:'Bancada A / PC 1'},visual_code_confirmed:true,lock_token:s.lock,...extra});
const claim=(s,a,extra)=>s.api('/api/agent/v1/pairings/claim',claimBody(s,a,extra));

test('REV-01: excluir a unidade revoga o agente na mesma transação; telemetria posterior é recusada; histórico preservado; outras unidades intactas',async()=>{
 const s=await setup();try{
  const a=await enrollment(s);assert.equal((await claim(s,a)).status,201);
  // Outra unidade com agente próprio precisa continuar intacta.
  const started2=await s.api('/api/collector/v2-start',{unitId:s.ids.assigned});assert.equal(started2.status,201,JSON.stringify(started2.data));const insp2=started2.data.inspection;
  const er2=await s.api('/api/collector/environment-save',{inspectionId:insp2.id,name:'TESTE ISOLADO Sala B'});const id2=crypto.randomUUID();
  const saved2=await s.api('/api/collector/equipment-save',{inspectionId:insp2.id,id:id2,data:{...s.data,environment:er2.data.environment.id}});assert.equal(saved2.status,201,JSON.stringify(saved2.data));
  const b=await enrollment(s);const lock2=await lockFor(worker,s.env,origin,s.op,insp2.id,id2);
  assert.equal((await s.api('/api/agent/v1/pairings/claim',{...claimBody(s,b),unit_id:s.ids.assigned,environment_id:er2.data.environment.id,inspection_id:insp2.id,equipment:{mode:'existing',equipment_id:id2,expected_version:saved2.data.version},lock_token:lock2})).status,201);
  const preview=await s.api('/api/root/unit-delete-preview?id='+s.ids.pending,undefined,s.root);assert.equal(preview.status,200);
  assert.equal(preview.data.impact.agentLinks,1,'prévia informa os agentes que serão revogados');
  // Um vínculo novo depois da prévia invalida o snapshot (verificação atômica).
  const deleted=await s.api('/api/root/unit-delete',{id:s.ids.pending,confirmName:preview.data.unit.name,snapshot:preview.data.snapshot,reason:'EXCLUSAO SOMENTE EM MEMORIA NO TESTE'},s.root);assert.equal(deleted.status,200,JSON.stringify(deleted.data));
  const hb=await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/heartbeat',heartbeatBody(a.identity,{sequence:1}));
  const inv=await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/inventory',inventoryBody(a.identity,{sequence:2}));
  assert.equal(hb.status,403,JSON.stringify(hb.data));assert.equal(inv.status,403,JSON.stringify(inv.data));assert.match(hb.data.code,/REVOKED|DEVICE_NOT_LINKED/);
  assert.equal(s.sqlite.prepare('SELECT state FROM agent_devices WHERE device_id=?').get(a.identity.deviceId).state,'revoked');
  assert.equal(s.sqlite.prepare("SELECT COUNT(*) n FROM agent_equipment_links WHERE device_id=? AND ended_at IS NULL").get(a.identity.deviceId).n,0,'vínculo encerrado');
  assert.equal(s.sqlite.prepare("SELECT end_reason FROM agent_equipment_links WHERE device_id=?").get(a.identity.deviceId).end_reason,'unit_deleted','histórico do vínculo preservado com motivo');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_presence WHERE device_id=?').get(a.identity.deviceId).n,0,'nenhuma presença nova');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_inventory_snapshots WHERE device_id=?').get(a.identity.deviceId).n,0,'nenhum snapshot novo');
  assert.equal(s.sqlite.prepare("SELECT COUNT(*) n FROM agent_audit_log WHERE action='agent_revoked' AND target=?").get(a.identity.deviceId).n,1,'auditoria da revogação');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE id=?').get(s.id).n,0,'ficha apagada; telemetria não a recria');
  // Outra unidade: agente segue ativo e comunicando.
  assert.equal(s.sqlite.prepare('SELECT state FROM agent_devices WHERE device_id=?').get(b.identity.deviceId).state,'linked');
  const hb2=await machinePost(worker,s.env,origin,b.identity,'/api/agent/v1/heartbeat',heartbeatBody(b.identity,{sequence:1}));assert.equal(hb2.status,200,JSON.stringify(hb2.data));
  // Vínculo órfão (ficha removida por outra via) também é recusado e encerrado, sem recriar nada.
  s.sqlite.exec('PRAGMA foreign_keys=OFF');s.sqlite.prepare('DELETE FROM equipment_locks WHERE equipment_id=?').run(id2);s.sqlite.prepare('DELETE FROM equipments WHERE id=?').run(id2);
  const hb3=await machinePost(worker,s.env,origin,b.identity,'/api/agent/v1/heartbeat',heartbeatBody(b.identity,{sequence:2}));assert.equal(hb3.status,403);assert.equal(hb3.data.code,'DEVICE_NOT_LINKED');
  assert.equal(s.sqlite.prepare("SELECT end_reason FROM agent_equipment_links WHERE device_id=?").get(b.identity.deviceId).end_reason,'equipment_missing');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE id=?').get(id2).n,0);
 }finally{s.sqlite.close();}
});

test('REV-02: localização segue a política do coletor (unidade ativa, visita aberta, trava própria), não altera o modo, registra trilha/revisão e grava recibo na mesma transação',async()=>{
 const s=await setup();try{
  const body=()=>({request_id:crypto.randomUUID(),equipment_id:s.id,expected_version:s.version,environment_id:s.room.id,position:{label:'Bancada B'},reason:'TESTE ISOLADO alteracao de local',inspection_id:s.inspection.id,lock_token:s.lock});
  // Unidade inativa + visita fechada: recusado, nada muda.
  s.sqlite.prepare('UPDATE units SET active=0 WHERE id=?').run(s.ids.pending);s.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(s.inspection.id);
  let r=await s.api('/api/inventory/equipment-location',body());assert.equal(r.status,422,JSON.stringify(r.data));
  s.sqlite.prepare('UPDATE units SET active=1 WHERE id=?').run(s.ids.pending);
  r=await s.api('/api/inventory/equipment-location',body());assert.equal(r.status,422);assert.equal(r.data.code,'INSPECTION_CLOSED');
  s.sqlite.prepare("UPDATE inspections SET state='open' WHERE id=?").run(s.inspection.id);
  // Sem trava / trava de outro usuário: recusado.
  r=await s.api('/api/inventory/equipment-location',{...body(),lock_token:'token-errado'});assert.equal(r.status,409);assert.equal(r.data.code,'LOCK_REQUIRED');
  const rootLock=await lockFor(worker,s.env,origin,s.root,s.inspection.id,s.id).catch(()=>null);
  if(rootLock){r=await s.api('/api/inventory/equipment-location',{...body(),lock_token:rootLock});assert.equal(r.status,409);assert.equal(r.data.code,'EQUIPMENT_LOCKED');}
  else {r=await s.api('/api/inventory/equipment-location',{...body(),lock_token:'x'});assert.equal(r.status,409);}
  let eq=s.sqlite.prepare('SELECT data_json,position_label,version FROM equipments WHERE id=?').get(s.id);
  assert.equal(JSON.parse(eq.data_json).registration,'Manual','modo intocado após recusas');assert.equal(eq.position_label,null);
  // Autorizado: operador com trava própria; modo continua Manual; trilha, revisão e recibo gravados juntos.
  const revisionBefore=s.sqlite.prepare('SELECT revision FROM inspections WHERE id=?').get(s.inspection.id).revision;
  s.lock=await lockFor(worker,s.env,origin,s.op,s.inspection.id,s.id).catch(()=>s.lock);
  const okBody=body();r=await s.api('/api/inventory/equipment-location',okBody);
  if(r.status!==200){ // trava ainda do root (180 s): libera e repete
   s.sqlite.prepare('DELETE FROM equipment_locks WHERE equipment_id=?').run(s.id);s.lock=await lockFor(worker,s.env,origin,s.op,s.inspection.id,s.id);r=await s.api('/api/inventory/equipment-location',{...okBody,lock_token:s.lock});}
  assert.equal(r.status,200,JSON.stringify(r.data));
  eq=s.sqlite.prepare('SELECT data_json,position_label,location_state,version FROM equipments WHERE id=?').get(s.id);
  assert.equal(JSON.parse(eq.data_json).registration,'Manual','mudar localização NÃO transforma Manual em Agente');
  assert.equal(eq.position_label,'Bancada B');assert.equal(eq.version,s.version+1);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,0);
  assert.equal(s.sqlite.prepare('SELECT revision FROM inspections WHERE id=?').get(s.inspection.id).revision,revisionBefore+1,'revisão da visita avança');
  const hist=s.sqlite.prepare("SELECT actor_id,inspection_id,before_json,after_json FROM collection_history WHERE entity_id=? AND event='equipment_location_changed'").get(s.id);
  assert.ok(hist);assert.equal(hist.actor_id,s.operator.id);assert.equal(hist.inspection_id,s.inspection.id);assert.equal(JSON.parse(hist.after_json).position_label,'Bancada B');assert.equal(JSON.parse(hist.before_json).position_label,null);
  // Idempotência: repetição devolve o mesmo recibo sem novo efeito; corpo diferente com o mesmo request_id é conflito.
  const again=await s.api('/api/inventory/equipment-location',{...okBody,lock_token:s.lock});assert.equal(again.status,200);assert.equal(again.data.duplicate,true);
  assert.equal(s.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(s.id).version,s.version+1);
  const conflict=await s.api('/api/inventory/equipment-location',{...okBody,lock_token:s.lock,position:{label:'Outra'}});assert.equal(conflict.status,409);assert.equal(conflict.data.code,'REQUEST_ID_CONFLICT');
  // Falha injetada depois da gravação (auditoria): recibo e ficha já estão na mesma transação → repetição devolve o recibo.
  const realPrepare=s.db.prepare.bind(s.db);let armed=true;
  s.db.prepare=sql=>{if(armed&&/INSERT INTO agent_audit_log/.test(sql)){armed=false;return {bind:()=>({run:async()=>{throw Error('falha simulada após gravar');},first:async()=>{throw Error('falha simulada');},all:async()=>{throw Error('falha simulada');}}),run:async()=>{throw Error('falha simulada após gravar');}};}return realPrepare(sql);};
  const v2=s.version+1;const second={...okBody,request_id:crypto.randomUUID(),expected_version:v2,position:{label:'Bancada C'},lock_token:s.lock};
  const failed=await s.api('/api/inventory/equipment-location',second);s.db.prepare=realPrepare;assert.equal(failed.status,503,JSON.stringify(failed.data));
  const retry=await s.api('/api/inventory/equipment-location',second);assert.equal(retry.status,200,JSON.stringify(retry.data));assert.equal(retry.data.duplicate,true);
  assert.equal(s.sqlite.prepare('SELECT version,position_label FROM equipments WHERE id=?').get(s.id).version,v2+1,'efeito aplicado uma única vez');
 }finally{s.sqlite.close();}
});

test('REV-03: claim respeita a trava de edição de outro usuário e a versão; vínculo autorizado incrementa a revisão da visita; falha de política dentro do batch não grava nada',async()=>{
 const s=await setup({withLock:false});try{
  const a=await enrollment(s);
  const held=await s.api('/api/collector/equipment-lock',{inspectionId:s.inspection.id,id:s.id},s.root);assert.equal(held.status,200);
  const revisionBefore=s.sqlite.prepare('SELECT revision FROM inspections WHERE id=?').get(s.inspection.id).revision;
  // Sem lock_token: validação; com token inventado: trava de outro usuário → 409, nenhum vínculo.
  let r=await s.api('/api/agent/v1/pairings/claim',{...claimBody(s,a),lock_token:undefined});assert.equal(r.status,422);
  r=await s.api('/api/agent/v1/pairings/claim',claimBody(s,a,{lock_token:'qualquer'}));assert.equal(r.status,409,JSON.stringify(r.data));assert.equal(r.data.code,'EQUIPMENT_LOCKED');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,0);assert.equal(s.sqlite.prepare('SELECT state FROM agent_devices WHERE device_id=?').get(a.identity.deviceId).state,'pending_pairing');
  assert.equal(s.sqlite.prepare('SELECT consumed_at FROM agent_enrollments WHERE enrollment_id=?').get(a.enrollment.enrollment_id).consumed_at,null,'QR não consumido');
  assert.equal(s.sqlite.prepare('SELECT user_id FROM equipment_locks WHERE equipment_id=?').get(s.id).user_id,s.rootUser.id,'trava do root intacta');
  // Root libera; operador adquire a trava e vincula: revisão/updated_at da visita avançam junto com ficha, vínculo e recibo.
  await s.api('/api/collector/equipment-unlock',{id:s.id,token:held.data.token},s.root);
  s.lock=await lockFor(worker,s.env,origin,s.op,s.inspection.id,s.id);
  const updatedBefore=s.sqlite.prepare('SELECT updated_at FROM inspections WHERE id=?').get(s.inspection.id).updated_at;await new Promise(res=>setTimeout(res,5));
  // Política verificada DENTRO do batch: fechar a visita entre a pré-verificação e a gravação aborta tudo.
  const realBatch=s.db.batch.bind(s.db);s.db.batch=async st=>{s.sqlite.prepare("UPDATE inspections SET state='completed' WHERE id=?").run(s.inspection.id);s.db.batch=realBatch;return realBatch(st);};
  r=await claim(s,a);assert.equal(r.status,422,JSON.stringify(r.data));assert.equal(r.data.code,'INSPECTION_CLOSED');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,0);assert.equal(s.sqlite.prepare('SELECT consumed_at FROM agent_enrollments WHERE enrollment_id=?').get(a.enrollment.enrollment_id).consumed_at,null);
  s.sqlite.prepare("UPDATE inspections SET state='open' WHERE id=?").run(s.inspection.id);
  r=await claim(s,a);assert.equal(r.status,201,JSON.stringify(r.data));
  const after=s.sqlite.prepare('SELECT revision,updated_at FROM inspections WHERE id=?').get(s.inspection.id);
  assert.equal(after.revision,revisionBefore+1,'revisão da visita avança com o vínculo');assert.ok(after.updated_at>=updatedBefore);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM collection_history WHERE entity_id=? AND event=?').get(s.id,'agent_linked').n,1);
  // Versão antiga depois do vínculo: conflito explícito, sem gravação.
  const other=await enrollment(s);r=await s.api('/api/agent/v1/pairings/claim',claimBody(s,other));assert.equal(r.status,409);assert.match(r.data.code,/EQUIPMENT_VERSION_CONFLICT|EQUIPMENT_ALREADY_LINKED/);
 }finally{s.sqlite.close();}
});

test('REV-04: mudar o ambiente pelo formulário invalida posição e confirmação anteriores; reconfirmar grava posição nova; painel não herda confirmação antiga',async()=>{
 const s=await setup();try{
  const a=await enrollment(s);const linked=await claim(s,a);assert.equal(linked.status,201,JSON.stringify(linked.data));
  let eq=s.sqlite.prepare('SELECT position_label,location_state,location_confirmed_at FROM equipments WHERE id=?').get(s.id);assert.equal(eq.position_label,'Bancada A / PC 1');assert.equal(eq.location_state,'confirmada_em_visita');
  const room2=await s.api('/api/collector/environment-save',{inspectionId:s.inspection.id,name:'TESTE ISOLADO Deposito',confirmSimilar:true});assert.equal(room2.status,201);
  // Salvar sem mudar de ambiente preserva a confirmação.
  let lock=s.lock;
  let changed=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id:s.id,version:linked.data.equipment_version,lockToken:lock,data:{...s.data,registration:'Agente',notes:'sem mudança de ambiente'}});assert.equal(changed.status,200,JSON.stringify(changed.data));
  eq=s.sqlite.prepare('SELECT environment_id,position_label,location_state,location_confirmed_at FROM equipments WHERE id=?').get(s.id);assert.equal(eq.position_label,'Bancada A / PC 1');assert.equal(eq.location_state,'confirmada_em_visita');
  // Mudar de ambiente: posição e confirmação antigas são invalidadas (nunca inventa posição nova); histórico fica na trilha.
  changed=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id:s.id,version:changed.data.version,lockToken:lock,data:{...s.data,registration:'Agente',environment:room2.data.environment.id}});assert.equal(changed.status,200,JSON.stringify(changed.data));
  eq=s.sqlite.prepare('SELECT environment_id,position_label,position_description,location_state,location_confirmed_at,location_confirmed_by,data_json FROM equipments WHERE id=?').get(s.id);
  assert.equal(eq.environment_id,room2.data.environment.id);assert.equal(eq.position_label,null);assert.equal(eq.location_state,'declarada');assert.equal(eq.location_confirmed_at,null);assert.equal(eq.location_confirmed_by,null);
  assert.equal(JSON.parse(eq.data_json).environment,room2.data.environment.id,'colunas e JSON contam a mesma história');
  assert.equal(JSON.parse(eq.data_json).registration,'Agente','vínculo preservado');assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE ended_at IS NULL').get().n,1);
  const hist=s.sqlite.prepare("SELECT before_json FROM collection_history WHERE entity_id=? AND event='equipment_updated' ORDER BY created_at DESC LIMIT 1").get(s.id);assert.ok(hist,'histórico da edição');
  // Consulta oficial do painel: sem posição confirmada para o local novo.
  const list=await s.api('/api/inventory/equipment?unitId='+s.ids.pending,undefined,s.root);
  const row=list.data.items.find(x=>x.id===s.id);if(row){assert.equal(row.position_label,null);assert.equal(row.location_state,'declarada');}
  const st=await s.api('/api/inventory/agent-status?equipmentId='+s.id,undefined,s.root);assert.equal(st.status,200);assert.equal(st.data.official_record.location,null,'nunca publicada: sem oficial');assert.equal(st.data.draft_location.position_label??null,null);assert.equal(st.data.draft_location.location_state,'declarada');
  // Reconfirmação no ambiente novo pela rota de localização (mesma política), sem mexer no modo.
  const confirm=await s.api('/api/inventory/equipment-location',{request_id:crypto.randomUUID(),equipment_id:s.id,expected_version:changed.data.version,environment_id:room2.data.environment.id,position:{label:'Prateleira 2'},reason:'Posição confirmada na visita pelo coletor',inspection_id:s.inspection.id,lock_token:lock});
  assert.equal(confirm.status,200,JSON.stringify(confirm.data));
  eq=s.sqlite.prepare('SELECT position_label,location_state,location_confirmed_by,data_json FROM equipments WHERE id=?').get(s.id);assert.equal(eq.position_label,'Prateleira 2');assert.equal(eq.location_state,'confirmada_em_visita');assert.equal(eq.location_confirmed_by,s.operator.id);assert.equal(JSON.parse(eq.data_json).registration,'Agente');
 }finally{s.sqlite.close();}
});

test('REV-05: leitura do QR não grava nada; rascunho mínimo só com tipo/modo/ambiente e mesmo ID; validação completa continua exigida para salvar e concluir F',async()=>{
 const code=await readFile('web/collector-v2.js','utf8');
 const start=code.indexOf('async function scanAgentQr()'),end=code.indexOf('\nasync function',start+10),block=code.slice(start,end);
 assert.ok(block.includes('await scanPairingQr()'),'leitor é chamado');
 assert.ok(!/await save(Item|Draft)\(\)[\s\S]*await scanPairingQr\(\)/.test(block),'nenhuma gravação antes de abrir o leitor');
 assert.ok(!block.includes('await saveItem()')&&!block.includes('await saveDraft()'),'a prévia não grava ficha');
 const s=await setup({withLock:false});try{
  const id=crypto.randomUUID();
  // Ficha só com Desktop + Agente (etapa 1) ainda não é válida para gravação completa…
  const full=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,data:{category:'desktop',mode:'Individual',quantity:1,registration:'Agente'}});assert.equal(full.status,400);
  // …mas o rascunho mínimo (o que o vínculo precisa) grava com o mesmo ID permanente.
  const noEnv=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,draft:true,data:{category:'desktop',mode:'Individual',quantity:1,registration:'Agente'}});assert.equal(noEnv.status,400);assert.ok(noEnv.data.fields.environment);
  const manual=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,draft:true,data:{category:'desktop',mode:'Individual',quantity:1,registration:'Manual',environment:s.room.id}});assert.equal(manual.status,400,'rascunho só no modo Agente');
  const printer=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,draft:true,data:{category:'printer',mode:'Individual',quantity:1,registration:'Agente',environment:s.room.id}});assert.equal(printer.status,400,'rascunho só para computadores');
  const draft=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,draft:true,data:{category:'desktop',mode:'Individual',quantity:1,registration:'Agente',environment:s.room.id}});assert.equal(draft.status,201,JSON.stringify(draft.data));
  let row=s.sqlite.prepare('SELECT data_json,version FROM equipments WHERE id=?').get(id);assert.equal(JSON.parse(row.data_json).draft,true);assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE unit_id=?').get(s.ids.pending).n,2,'nenhuma ficha extra');
  // Vínculo com o rascunho (trava + versão do rascunho) funciona; reenvio da leitura não cria outra ficha.
  const a=await enrollment(s);const lock=await lockFor(worker,s.env,origin,s.op,s.inspection.id,id);
  const linked=await s.api('/api/agent/v1/pairings/claim',claimBody(s,a,{equipment:{mode:'existing',equipment_id:id,expected_version:draft.data.version},lock_token:lock}));assert.equal(linked.status,201,JSON.stringify(linked.data));
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE unit_id=?').get(s.ids.pending).n,2);
  // Concluir F continua exigindo a conferência completa do rascunho.
  const fv=()=>s.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='F'").get(s.inspection.id).version;
  let done=await s.api('/api/collector/inventory-section',{inspectionId:s.inspection.id,section:'F',version:fv()});assert.equal(done.status,409);assert.equal(done.data.pendingDrafts,1);
  let review=await s.api('/api/collector/review?id='+s.inspection.id);assert.match(review.data.errors.F,/sem conferência completa/);assert.ok(review.data.details['draft:'+id]);
  // Salvar normalmente com campos incompletos é recusado (validação de conclusão não enfraquecida)…
  const incomplete=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,version:linked.data.equipment_version,lockToken:lock,data:{category:'desktop',mode:'Individual',quantity:1,registration:'Agente',environment:s.room.id}});assert.equal(incomplete.status,400);
  // …e o salvamento completo remove a marca de rascunho, preservando ID e vínculo; a ficha Manual da setup não bloqueia.
  const complete=await s.api('/api/collector/equipment-save',{inspectionId:s.inspection.id,id,version:linked.data.equipment_version,lockToken:lock,data:{category:'desktop',mode:'Individual',quantity:1,registration:'Agente',environment:s.room.id,assetStatus:'Sem patrimônio',condition:'Bom',operation:'Funcionando',use:'Em uso',draft:true}});assert.equal(complete.status,200,JSON.stringify(complete.data));
  row=s.sqlite.prepare('SELECT data_json FROM equipments WHERE id=?').get(id);assert.equal(JSON.parse(row.data_json).draft,undefined,'marca removida mesmo se o cliente a reenviar');assert.equal(JSON.parse(row.data_json).registration,'Agente');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE equipment_id=? AND ended_at IS NULL').get(id).n,1);
  done=await s.api('/api/collector/inventory-section',{inspectionId:s.inspection.id,section:'F',version:fv()});assert.equal(done.status,200,JSON.stringify(done.data));
 }finally{s.sqlite.close();}
});

test('REV-06: impressora alterada em visita anterior não exige foto nova na revisita sem alteração; alteração nesta visita exige; foto inicial continua obrigatória',async()=>{
 const s=await setup({category:'printer',withLock:false});try{
  s.sqlite.prepare("UPDATE equipments SET data_json=json_set(data_json,'$.physicalChanged','Sim') WHERE id=?").run(s.id);
  const photo=(kind,target,inspectionId)=>s.sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,status,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,'ready',?,?)").run(crypto.randomUUID(),s.ids.pending,inspectionId,kind,target,crypto.randomUUID(),'image/jpeg',100,'TESTE',s.operator.id,Date.now());
  photo('equipment',s.id,s.inspection.id);photo('facade',s.ids.pending,s.inspection.id);
  s.sqlite.prepare("UPDATE inspections SET state='completed',completed_at=? WHERE id=?").run(Date.now(),s.inspection.id);
  const next=await s.api('/api/collector/v2-start',{unitId:s.ids.pending});assert.equal(next.status,201);const i2=next.data.inspection;
  // Revisita: "Verificado sem alterações" sem abrir a edição → nenhuma foto nova exigida (a anterior vale).
  const verified=await s.api('/api/collector/verify',{inspectionId:i2.id,id:s.id,result:'Verificado sem alterações'});assert.equal(verified.status,200);
  let review=await s.api('/api/collector/review?id='+i2.id);assert.equal(review.status,200);assert.equal(review.data.errors['photo:'+s.id],undefined,'foto anterior reutilizada quando não houve mudança atual');
  // Editar NESTA visita declarando alteração física → foto atual obrigatória.
  const gRow=s.sqlite.prepare("SELECT state,version FROM inspection_sections WHERE inspection_id=? AND section='G'").get(i2.id);if(gRow?.state==='Concluído'){const reopened=await s.api('/api/collector/inventory-section',{inspectionId:i2.id,section:'G',version:gRow.version,reopen:true});assert.equal(reopened.status,200,JSON.stringify(reopened.data));}
  const lock=await lockFor(worker,s.env,origin,s.op,i2.id,s.id);const cur=s.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(s.id).version;
  const edited=await s.api('/api/collector/equipment-save',{inspectionId:i2.id,id:s.id,version:cur,lockToken:lock,data:{...s.data,physicalChanged:'Sim'}});assert.equal(edited.status,200,JSON.stringify(edited.data));
  review=await s.api('/api/collector/review?id='+i2.id);assert.match(review.data.errors['photo:'+s.id]||'',/fotografia da impressora/);
  photo('equipment',s.id,i2.id);review=await s.api('/api/collector/review?id='+i2.id);assert.equal(review.data.errors['photo:'+s.id],undefined,'foto desta visita atende');
  // Impressora nova sem nenhuma foto: foto inicial continua obrigatória.
  const pid=crypto.randomUUID();const created=await s.api('/api/collector/equipment-save',{inspectionId:i2.id,id:pid,data:{category:'printer',mode:'Individual',quantity:1,environment:s.room.id,operation:'Funcionando'}});assert.equal(created.status,201,JSON.stringify(created.data));
  review=await s.api('/api/collector/review?id='+i2.id);assert.match(review.data.errors['photo:'+pid]||'',/fotografia da impressora/);
  // A regra também vale na função compartilhada: physicalChanged só conta como resposta da visita atual.
  assert.deepEqual(v2PhotoErrors({sections:{},photos:[{target_kind:'equipment',target_id:'p1',status:'ready',current:false}],equipment:[{id:'p1',data:{category:'printer'}}],hasFacade:true}),{});
 }finally{s.sqlite.close();}
});

test('REV-07: cancelar a leitura antes/depois da câmera abrir encerra as trilhas; reabrir funciona; saída da página encerra',async()=>{
 const code=await readFile('web/collector-qr.js','utf8');
 const module=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 function harness(){
  const video={srcObject:null,readyState:0,play:async()=>{},pause(){}},status={textContent:''},input={addEventListener(){}};
  const h={video,status,stops:0,requested:0,release:null,click:null,listeners:{}};
  const root={setAttribute(){},querySelector:sel=>sel==='video'?video:sel==='.qr-status'?status:input,addEventListener:(type,fn)=>{if(type==='click')h.click=fn;},remove(){h.removed=true;}};
  globalThis.document={createElement:()=>root,body:{append(){},classList:{add(){},remove(){}}}};
  globalThis.BarcodeDetector=class {static async getSupportedFormats(){return ['qr_code'];}async detect(){return [];}};
  globalThis.addEventListener=(type,fn)=>{h.listeners[type]=fn;};globalThis.removeEventListener=(type)=>{delete h.listeners[type];};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>{h.requested++;return new Promise(resolve=>{h.release=resolve;});}}}});
  h.stream=()=>({getTracks:()=>[{stop(){h.stops++;}}]});
  return h;
 }
 const tick=()=>new Promise(r=>setImmediate(r));
 // 1) cancelar enquanto a permissão/câmera ainda abre: o stream que chega depois é encerrado e nunca fica atribuído.
 let h=harness();let reading=module.scanPairingQr();while(!h.requested)await tick();
 h.click({target:{closest:()=>true}});assert.equal(await reading,null);
 h.release(h.stream());await tick();await tick();
 assert.equal(h.stops,1,'trilha encerrada após cancelamento tardio');assert.equal(h.video.srcObject,null,'stream não atribuído após cancelar');assert.equal(h.listeners.pagehide,undefined,'ouvinte de saída removido');
 // 2) cancelar depois da câmera aberta também encerra.
 h=harness();reading=module.scanPairingQr();while(!h.requested)await tick();h.release(h.stream());await tick();await tick();
 assert.ok(h.video.srcObject,'câmera atribuída enquanto ativa');h.click({target:{closest:()=>true}});assert.equal(await reading,null);assert.equal(h.stops,1);assert.equal(h.video.srcObject,null);
 // 3) reabrir funciona (nova solicitação de câmera) e sair da página encerra.
 h=harness();reading=module.scanPairingQr();while(!h.requested)await tick();h.release(h.stream());await tick();await tick();
 assert.equal(typeof h.listeners.pagehide,'function');h.listeners.pagehide();assert.equal(await reading,null);assert.equal(h.stops,1);
 h=harness();reading=module.scanPairingQr();while(!h.requested)await tick();assert.equal(h.requested,1);h.click({target:{closest:()=>true}});assert.equal(await reading,null);
 delete globalThis.document;delete globalThis.BarcodeDetector;
});

test('Administração root: listagem de agentes por unidade, manutenção sob demanda e agendada preservam atual/linha de base/histórico; outros perfis recebem 403',async()=>{
 const s=await setup();try{
  const a=await enrollment(s);assert.equal((await claim(s,a)).status,201);
  const es=await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:a.identity.installationId});
  await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:a.identity.installationId,link_id:es.data.link.link_id});
  assert.equal((await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/heartbeat',heartbeatBody(a.identity,{sequence:1}))).status,200);
  for(const seq of [2,3,4])assert.equal((await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/inventory',inventoryBody(a.identity,{sequence:seq}))).status,200);
  // Listagem (root) com unidade, ficha, posição e presença; operador/visualizador → 403.
  const list=await s.api('/api/root/agent-devices?unit_id='+s.ids.pending,undefined,s.root);assert.equal(list.status,200,JSON.stringify(list.data));
  const row=list.data.items.find(x=>x.device_id===a.identity.deviceId);assert.ok(row);assert.equal(row.state,'linked');assert.equal(row.equipment.id,s.id);assert.equal(row.equipment.position_label,'Bancada A / PC 1');assert.equal(row.hostname,'PC-TESTE-ISOLADO');assert.ok(row.presence.last_live_contact_at);assert.ok(row.link.device_confirmed_at);
  assert.equal((await s.api('/api/root/agent-devices',undefined,s.op)).status,403);
  const q=await s.api('/api/root/agent-devices?q=pc-teste',undefined,s.root);assert.equal(q.data.items.length,1);
  const other=await s.api('/api/root/agent-devices?unit_id='+s.ids.assigned,undefined,s.root);assert.equal(other.data.items.length,0);
  // Manutenção: retenção de 1 snapshot por máquina preserva o atual e a linha de base; recibos/nonces vencidos são removidos no futuro.
  s.env.AGENTES_SNAPSHOTS_POR_MAQUINA='1';
  const before=s.sqlite.prepare('SELECT COUNT(*) n FROM agent_inventory_snapshots WHERE device_id=?').get(a.identity.deviceId).n;assert.equal(before,3);
  const current=s.sqlite.prepare('SELECT inventory_id FROM agent_current_snapshot WHERE device_id=?').get(a.identity.deviceId)?.inventory_id,baseline=s.sqlite.prepare('SELECT inventory_id FROM agent_baseline WHERE device_id=?').get(a.identity.deviceId)?.inventory_id;
  assert.equal((await s.api('/api/root/agent-maintenance',{},s.op)).status,403);
  const m=await s.api('/api/root/agent-maintenance',{},s.root);assert.equal(m.status,200,JSON.stringify(m.data));assert.equal(m.data.ok,true);
  const left=s.sqlite.prepare('SELECT inventory_id FROM agent_inventory_snapshots WHERE device_id=?').all(a.identity.deviceId).map(r=>r.inventory_id);
  assert.ok(left.includes(current),'snapshot atual preservado');if(baseline)assert.ok(left.includes(baseline),'linha de base preservada');assert.ok(left.length<=2&&left.length<before,'retenção aplicada');
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,1,'histórico de vínculo intocado');assert.ok(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_audit_log').get().n>0,'auditoria intocada');
  // Handler agendado do Worker (cron): executa sem erro e com relógio no futuro expurga nonces/recibos vencidos.
  const noncesBefore=s.sqlite.prepare('SELECT COUNT(*) n FROM agent_request_nonces').get().n;assert.ok(noncesBefore>0);
  const realNow=Date.now;Date.now=()=>realNow()+30*86400_000;try{let waited=null;await worker.scheduled({cron:'23 3 * * *',scheduledTime:Date.now()},s.env,{waitUntil:p=>{waited=p;}});if(waited)await waited;}finally{Date.now=realNow;}
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_request_nonces').get().n,0,'nonces vencidos removidos pelo agendamento');
  assert.ok(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_inventory_snapshots WHERE device_id=?').get(a.identity.deviceId).n>=1);
 }finally{s.sqlite.close();}
});

// ---------------------------------------------------------------------------------------------------------------------------
// Revisão 2 (R2-A, R2-B, R2-C) — asserções inversas a revisoes/claude-v2-qr-rev2-2026-11-04-analise/cenarios-adicionais.mjs
// ---------------------------------------------------------------------------------------------------------------------------
/** Executa as funções REAIS do coletor (web/collector-v2.js) com transporte para o Worker em memória e falhas controladas. */
async function frontendRunner(s,a,{failWhen}){
 const code=await readFile('web/collector-v2.js','utf8');
 const slice=(start,end)=>code.slice(code.indexOf(start),code.indexOf(end,code.indexOf(start)));
 const funcs=slice('async function saveDraft()','async function saveItem()')+slice('async function saveItem()','async function upload(')+slice('// [R2-A] Comando congelado',"app.addEventListener('submit'");
 const calls=[];let armed=true;
 const transport=async(p,d)=>{
  const mode=armed?failWhen(p,d,calls):null;
  if(mode==='before'){armed=false;calls.push({path:p,status:'perdida-antes'});throw Object.assign(Error('TESTE: rede caiu antes de enviar'),{unknown:true});}
  const r=await s.api(p,d);calls.push({path:p,status:r.status});
  if(mode==='after'&&r.status<400){armed=false;throw Object.assign(Error('TESTE: resposta perdida após commit'),{unknown:true});}
  if(r.status>=400)throw Object.assign(Error(r.data.error||r.data.message||'Falha'),r.data,{httpStatus:r.status});
  return r.data;
 };
 const initial={item:{id:crypto.randomUUID(),data:{category:'desktop',registration:'Agente',mode:'Individual',quantity:1,environment:s.room.id}},collection:{inspection:s.inspection,unit:{id:s.ids.pending}},pairing:{preview:{},qr:{enrollment_id:a.enrollment.enrollment_id,pairing_code:a.enrollment.pairing_code},requestId:crypto.randomUUID(),positionLabel:'Mesa A',confirmed:true}};
 const runner=new Function('initial','api','load','crypto',`let item=initial.item,collection=initial.collection,pairing=initial.pairing,itemVersion=0,lock=null,itemSaved=false,status='';const confirm=()=>true;\n${funcs}\nreturn {confirm:confirmAgentLink,position:confirmPosition,setPairing:p=>{pairing=p;},state:()=>({version:itemVersion,linked:!!item.agent_linked,link:item.agent_link,status,pending:!!pairing?.command,unknown:!!pairing?.command?.unknown,positionLabel:item.position_label,id:item.id}),get item(){return item;}};`)(initial,transport,async()=>{},crypto);
 return {runner,calls};
}

test('R2-A: resposta perdida DEPOIS do commit — repetir devolve o mesmo vínculo/recibo, sem duplicar, sem sobrescrever e sem sucesso falso; também falha ANTES do envio',async()=>{
 const s=await setup({withLock:false});try{
  const a=await enrollment(s);
  const {runner,calls}=await frontendRunner(s,a,{failWhen:p=>p==='/api/agent/v1/pairings/claim'?'after':null});
  await assert.rejects(runner.confirm(),/resultado é desconhecido/i,'nenhum sucesso falso');
  let st=runner.state();assert.equal(st.linked,false);assert.equal(st.pending,true);assert.equal(st.unknown,true);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,1,'o servidor já gravou');
  const before=s.sqlite.prepare('SELECT version,data_json FROM equipments WHERE id=?').get(st.id);
  await runner.confirm(); // mesmo comando: recibo encontrado → estado reconciliado
  st=runner.state();assert.equal(st.linked,true);assert.equal(st.pending,false);assert.ok(st.link?.link_id);assert.match(st.status,/recibo do comando anterior/);
  const after=s.sqlite.prepare('SELECT version,data_json FROM equipments WHERE id=?').get(st.id);
  assert.equal(after.version,before.version,'nenhuma gravação extra na repetição');assert.equal(after.data_json,before.data_json);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,1);assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE unit_id=?').get(s.ids.pending).n,2,'nenhum equipamento duplicado');
  assert.equal(st.link.link_id,s.sqlite.prepare('SELECT link_id FROM agent_equipment_links').get().link_id,'mesmo vínculo/ID');
  assert.deepEqual(calls.filter(c=>c.path==='/api/collector/equipment-save').length,1,'rascunho gravado uma única vez');
  assert.ok(!calls.some(c=>c.path==='/api/agent/v1/pairings/claim'&&c.status===409),'nenhum request_id reutilizado com outro conteúdo');
  // Falha ANTES do envio (rede cai): repetir envia o mesmo comando e vincula uma vez.
  const b=await enrollment(s);
  const {runner:r2,calls:c2}=await frontendRunner(s,b,{failWhen:p=>p==='/api/agent/v1/pairings/claim'?'before':null});
  const id2=r2.state().id;
  await assert.rejects(r2.confirm(),/resultado é desconhecido/i);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE equipment_id=?').get(id2).n,0,'nada gravado antes do envio');
  await r2.confirm();
  assert.equal(r2.state().linked,true);assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE equipment_id=?').get(id2).n,1);
  assert.equal(c2.filter(c=>c.path==='/api/agent/v1/pairings/claim'&&c.status===201).length,1);
  // Recibo consultável só pelo próprio usuário; request_id inexistente → found:false.
  const rid=c2.find(c=>c.path==='/api/agent/v1/pairings/claim')&&s.sqlite.prepare("SELECT request_key FROM agent_claim_requests WHERE request_key LIKE ?").get(s.operator.id+'|%').request_key.split('|')[1];
  const mine=await s.api('/api/agent/v1/pairings/claim-status?request_id='+rid);assert.equal(mine.status,200);assert.equal(mine.data.found,true);assert.equal(mine.data.body.duplicate,true);
  const other=await s.api('/api/agent/v1/pairings/claim-status?request_id='+rid,undefined,s.root);assert.equal(other.data.found,false,'recibo é por usuário');
  assert.equal((await s.api('/api/agent/v1/pairings/claim-status?request_id='+crypto.randomUUID())).data.found,false);
  // Confirmação de posição: mesmo princípio (request_id congelado, recibo consultável, repetição sem segundo efeito) — rota direta,
  // pois o runner da ficha nova não tem trava própria após o claim (a trava do rascunho é a do primeiro envio).
  const lockRow=s.sqlite.prepare('SELECT token FROM equipment_locks WHERE equipment_id=?').get(id2);const lockR3=lockRow.token;
  const curV=s.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(id2).version;
  const body={request_id:crypto.randomUUID(),equipment_id:id2,expected_version:curV,environment_id:s.room.id,position:{label:'Mesa Z'},reason:'Posição confirmada na visita pelo coletor',inspection_id:s.inspection.id,lock_token:lockR3};
  const first=await s.api('/api/inventory/equipment-location',body);assert.equal(first.status,200,JSON.stringify(first.data));
  const receipt=await s.api('/api/inventory/equipment-location-status?request_id='+body.request_id);assert.equal(receipt.data.found,true);assert.equal(receipt.data.body.equipment_version,first.data.equipment_version);
  const again=await s.api('/api/inventory/equipment-location',body);assert.equal(again.status,200);assert.equal(again.data.duplicate,true);
  assert.equal(s.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(id2).version,curV+1,'um único efeito');
 }finally{s.sqlite.close();}
});

test('R2-B: assunto Computadores concluído bloqueia vínculo e mudança de localização (antes e DENTRO da transação); reabertura explícita libera; conclusão continua manual',async()=>{
 const s=await setup();try{
  const a=await enrollment(s);
  const fv=()=>s.sqlite.prepare("SELECT version,state FROM inspection_sections WHERE inspection_id=? AND section='F'").get(s.inspection.id);
  assert.equal((await s.api('/api/collector/inventory-section',{inspectionId:s.inspection.id,section:'F',version:fv().version})).status,200);assert.equal(fv().state,'Concluído');
  // Claim sem reabrir: recusado, nada muda (ficha, vínculo, QR, versão).
  let r=await claim(s,a);assert.equal(r.status,422,JSON.stringify(r.data));assert.equal(r.data.code,'SECTION_COMPLETED');assert.match(r.data.message,/Reabra/);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,0);assert.equal(s.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(s.id).version,s.version);
  assert.equal(s.sqlite.prepare('SELECT consumed_at FROM agent_enrollments WHERE enrollment_id=?').get(a.enrollment.enrollment_id).consumed_at,null);assert.equal(fv().state,'Concluído');
  // Localização sem reabrir: recusada.
  const loc=()=>({request_id:crypto.randomUUID(),equipment_id:s.id,expected_version:s.version,environment_id:s.room.id,position:{label:'Mesa X'},reason:'TESTE ISOLADO mover',inspection_id:s.inspection.id,lock_token:s.lock});
  r=await s.api('/api/inventory/equipment-location',loc());assert.equal(r.status,422);assert.equal(r.data.code,'SECTION_COMPLETED');
  assert.equal(s.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(s.id).position_label,null);
  // Reabertura explícita (ação manual do coletor) libera; F volta a 'Em andamento' e a conclusão continua manual.
  assert.equal((await s.api('/api/collector/inventory-section',{inspectionId:s.inspection.id,section:'F',version:fv().version,reopen:true})).status,200);assert.equal(fv().state,'Em andamento');
  // Corrida: outro coletor conclui F entre a pré-verificação e a gravação → guarda no batch aborta sem gravar.
  const realBatch=s.db.batch.bind(s.db);s.db.batch=async st=>{s.sqlite.prepare("UPDATE inspection_sections SET state='Concluído' WHERE inspection_id=? AND section='F'").run(s.inspection.id);s.db.batch=realBatch;return realBatch(st);};
  r=await claim(s,a);assert.equal(r.status,422,JSON.stringify(r.data));assert.equal(r.data.code,'SECTION_COMPLETED');assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,0);assert.equal(s.sqlite.prepare('SELECT consumed_at FROM agent_enrollments WHERE enrollment_id=?').get(a.enrollment.enrollment_id).consumed_at,null);
  s.sqlite.prepare("UPDATE inspection_sections SET state='Em andamento' WHERE inspection_id=? AND section='F'").run(s.inspection.id);
  r=await claim(s,a);assert.equal(r.status,201,JSON.stringify(r.data));assert.equal(fv().state,'Em andamento','vínculo não conclui o assunto sozinho');
  r=await s.api('/api/inventory/equipment-location',{...loc(),expected_version:r.data.equipment_version});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(fv().state,'Em andamento');
  // Sem confundir letras: na V2 o assunto G (impressoras) concluído NÃO bloqueia computadores; no legado, F ou G concluídos bloqueiam.
  const {catalogo}=await import('../server/agentes/catalogo.mjs');
  const policy={unitId:s.ids.pending,inspectionId:s.inspection.id,equipmentId:s.id,userId:s.operator.id,lockToken:s.lock};
  s.sqlite.prepare("UPDATE inspection_sections SET state='Concluído' WHERE inspection_id=? AND section='G'").run(s.inspection.id);
  assert.equal(await catalogo.checkPolicy(s.db,policy),null,'V2: G concluído não bloqueia computadores');
  const legacy=s.sqlite.prepare("SELECT id,state FROM inspections WHERE unit_id=? AND questionnaire_version<>'coleta-2.0' ORDER BY created_at DESC LIMIT 1").get(s.ids.progress);
  if(legacy){s.sqlite.prepare("UPDATE inspections SET state='open' WHERE id=?").run(legacy.id);s.sqlite.prepare("UPDATE units SET active=1 WHERE id=?").run(s.ids.progress);
   s.sqlite.prepare("INSERT OR REPLACE INTO inspection_sections(inspection_id,section,state,version,data_json,updated_by,updated_at) VALUES(?,?,?,?,?,?,?)").run(legacy.id,'G','Concluído',1,'{}',s.operator.id,Date.now());
   assert.equal(await catalogo.checkPolicy(s.db,{...policy,unitId:s.ids.progress,inspectionId:legacy.id}),'SECTION_COMPLETED','legado: G concluído bloqueia');}
 }finally{s.sqlite.close();}
});

test('R2-C: mudança de localização na revisita fica PARCIAL até concluir e é publicada integralmente na conclusão; consultas oficiais não misturam rascunho com publicação',async()=>{
 const s=await setup();try{
  const a=await enrollment(s);const bound=await claim(s,a);assert.equal(bound.status,201,JSON.stringify(bound.data));
  const photo=inspectionId=>s.sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,status,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,'ready',?,?)").run(crypto.randomUUID(),s.ids.pending,inspectionId,'facade',s.ids.pending,crypto.randomUUID(),'image/jpeg',100,'TESTE',s.operator.id,Date.now());
  const complete=async(i,extraA={})=>{for(const [section,answers] of Object.entries({A:{present:'Não',...extraA},C:{exists:'Não'},D:{},H:{}})){const v=s.sqlite.prepare('SELECT version,state FROM inspection_sections WHERE inspection_id=? AND section=?').get(i,section);if(v.state==='Concluído')continue;const r=await s.api('/api/collector/section-save',{inspectionId:i,section,version:v.version,answers,complete:true});assert.equal(r.status,200,section+JSON.stringify(r.data));}
   for(const section of ['F','G']){const v=s.sqlite.prepare('SELECT version,state FROM inspection_sections WHERE inspection_id=? AND section=?').get(i,section);if(v.state==='Concluído')continue;const r=await s.api('/api/collector/inventory-section',{inspectionId:i,section,version:v.version});assert.equal(r.status,200,section+JSON.stringify(r.data));}
   const review=await s.api('/api/collector/review?id='+i);assert.deepEqual(review.data.errors,{},JSON.stringify(review.data));const fin=await s.api('/api/collector/finish',{inspectionId:i,confirm:true,revision:review.data.revision});assert.equal(fin.status,200,JSON.stringify(fin.data));};
  photo(s.inspection.id);await complete(s.inspection.id);
  await s.api('/api/collector/equipment-unlock',{id:s.id,token:s.lock});
  // Publicação 1: ambiente Sala A, posição Mesa… ('Bancada A / PC 1' do claim) e modo Agente coerentes na ficha oficial.
  let official=(await s.api('/api/inventory/equipment?unitId='+s.ids.pending,undefined,s.root)).data.items.find(x=>x.id===s.id);
  assert.equal(official.data.environment,s.room.id);assert.equal(official.data.position_label,'Bancada A / PC 1');assert.equal(official.position_label,'Bancada A / PC 1');assert.equal(official.location_state,'confirmada_em_visita');assert.equal(official.data.registration,'Agente','Manual→Agente publicado');assert.equal(official.partial,null);
  // Visita 2: reabrir F, criar Depósito, mover pela rota autorizada.
  const oldId=s.inspection.id,next=await s.api('/api/collector/v2-start',{unitId:s.ids.pending});assert.equal(next.status,201);const i2=next.data.inspection;
  const f2=s.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='F'").get(i2.id);assert.equal((await s.api('/api/collector/inventory-section',{inspectionId:i2.id,section:'F',version:f2.version,reopen:true})).status,200);
  const dep=await s.api('/api/collector/environment-save',{inspectionId:i2.id,name:'TESTE ISOLADO Deposito',confirmSimilar:true});assert.equal(dep.status,201);
  const token=await lockFor(worker,s.env,origin,s.op,i2.id,s.id);
  const moved=await s.api('/api/inventory/equipment-location',{request_id:crypto.randomUUID(),equipment_id:s.id,expected_version:bound.data.equipment_version,environment_id:dep.data.environment.id,position:{label:'Mesa B'},reason:'TESTE MUDANCA REALIZADA NA REVISITA',inspection_id:i2.id,lock_token:token});assert.equal(moved.status,200,JSON.stringify(moved.data));
  // ANTES de concluir: ficha oficial = visita 1 (coerente), mudança exposta como PARCIAL; agent-status separa oficial de rascunho.
  official=(await s.api('/api/inventory/equipment?unitId='+s.ids.pending,undefined,s.root)).data.items.find(x=>x.id===s.id);
  assert.equal(official.data.environment,s.room.id);assert.equal(official.position_label,'Bancada A / PC 1','posição nova NÃO vaza para a ficha oficial');assert.equal(official.data.position_label,'Bancada A / PC 1');
  assert.ok(official.partial);assert.equal(official.partial.environment,dep.data.environment.id);assert.equal(official.partial.position_label,'Mesa B');assert.equal(official.partial.inspection_id,i2.id);
  let st=await s.api('/api/inventory/agent-status?equipmentId='+s.id,undefined,s.root);assert.equal(st.data.official_record.location.environment_id,s.room.id);assert.equal(st.data.official_record.partial,true);assert.equal(st.data.draft_location.environment_id,dep.data.environment.id);assert.equal(st.data.draft_location.position_label,'Mesa B');
  // A ficha aparece na lista PARCIAL da visita aberta (coletas em andamento).
  const partialList=await s.api('/api/inventory/in-progress-equipment?id='+i2.id,undefined,s.root);assert.equal(partialList.status,200);assert.ok(partialList.data.items.some(x=>x.id===s.id),'alteração da visita aberta listada como parcial');
  assert.equal(s.sqlite.prepare('SELECT inspection_id FROM equipments WHERE id=?').get(s.id).inspection_id,i2.id,'ficha integrada ao ciclo da visita 2');
  // Telemetria não publica nem confirma localização: snapshot do agente não altera a ficha.
  const es=await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:a.identity.installationId});
  await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:a.identity.installationId,link_id:es.data.link.link_id});
  assert.equal((await machinePost(worker,s.env,origin,a.identity,'/api/agent/v1/inventory',inventoryBody(a.identity,{sequence:1}))).status,200);
  const rowMid=s.sqlite.prepare('SELECT version,published_json FROM equipments WHERE id=?').get(s.id);assert.equal(rowMid.version,moved.data.equipment_version);assert.equal(JSON.parse(rowMid.published_json).environment,s.room.id);
  // DEPOIS de concluir a visita 2: publicação integral da nova localização; histórico preservado; sem duplicar.
  await complete(i2.id,{facadeChanged:'Não'});
  const row=s.sqlite.prepare('SELECT inspection_id,data_json,published_json FROM equipments WHERE id=?').get(s.id);
  assert.equal(row.inspection_id,i2.id);assert.equal(JSON.parse(row.published_json).environment,dep.data.environment.id);assert.equal(JSON.parse(row.published_json).position_label,'Mesa B');assert.equal(JSON.parse(row.published_json).location_state,'confirmada_em_visita');assert.equal(JSON.parse(row.published_json).environment,JSON.parse(row.data_json).environment);
  official=(await s.api('/api/inventory/equipment?unitId='+s.ids.pending,undefined,s.root)).data.items.find(x=>x.id===s.id);
  assert.equal(official.data.environment,dep.data.environment.id);assert.equal(official.position_label,'Mesa B');assert.equal(official.location_state,'confirmada_em_visita');assert.equal(official.partial,null);
  st=await s.api('/api/inventory/agent-status?equipmentId='+s.id,undefined,s.root);assert.equal(st.data.official_record.location.environment_id,dep.data.environment.id);assert.equal(st.data.official_record.location.position_label,'Mesa B');assert.equal(st.data.official_record.partial,false);assert.equal(st.data.draft_location,null);
  assert.equal(s.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE unit_id=?').get(s.ids.pending).n,1);
  assert.ok(s.sqlite.prepare("SELECT COUNT(*) n FROM collection_history WHERE entity_id=? AND event IN ('agent_linked','equipment_location_changed')").get(s.id).n>=2,'histórico das duas visitas');
  // Mudança SÓ de posição (mesmo ambiente) e edição pelo formulário numa visita 3: JSON e colunas contam a mesma história.
  const next3=await s.api('/api/collector/v2-start',{unitId:s.ids.pending});const i3=next3.data.inspection;const f3=s.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='F'").get(i3.id);assert.equal((await s.api('/api/collector/inventory-section',{inspectionId:i3.id,section:'F',version:f3.version,reopen:true})).status,200);
  await s.api('/api/collector/equipment-unlock',{id:s.id,token});const t3=await lockFor(worker,s.env,origin,s.op,i3.id,s.id);const v3=s.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(s.id).version;
  const onlyPos=await s.api('/api/inventory/equipment-location',{request_id:crypto.randomUUID(),equipment_id:s.id,expected_version:v3,environment_id:dep.data.environment.id,position:{label:'Mesa C'},reason:'TESTE so posicao',inspection_id:i3.id,lock_token:t3});assert.equal(onlyPos.status,200);
  const saved3=await s.api('/api/collector/equipment-save',{inspectionId:i3.id,id:s.id,version:onlyPos.data.equipment_version,lockToken:t3,data:{...s.data,registration:'Agente',environment:dep.data.environment.id,notes:'edição pelo formulário'}});assert.equal(saved3.status,200,JSON.stringify(saved3.data));
  const row3=s.sqlite.prepare('SELECT position_label,location_state,data_json FROM equipments WHERE id=?').get(s.id);assert.equal(row3.position_label,'Mesa C');assert.equal(JSON.parse(row3.data_json).position_label,'Mesa C');assert.equal(JSON.parse(row3.data_json).location_state,row3.location_state);
  // Concorrência: outra sessão (root) com versão antiga é recusada sem gravar.
  const stale=await s.api('/api/inventory/equipment-location',{request_id:crypto.randomUUID(),equipment_id:s.id,expected_version:v3,environment_id:dep.data.environment.id,position:{label:'Mesa D'},reason:'TESTE concorrencia',inspection_id:i3.id,lock_token:'outra'},s.root);assert.ok([409,422].includes(stale.status));assert.equal(s.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(s.id).position_label,'Mesa C');
 }finally{s.sqlite.close();}
});
