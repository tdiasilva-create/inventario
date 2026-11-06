import test from 'node:test';import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import {agentIdentity,machinePost,challenge,enroll,heartbeatBody,inventoryBody,session,humanFetch,summary,lockFor} from './helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const origin='https://coletor.test';
function envFor(f){return {DB:f.db,AUTH_PEPPER:'pepper-isolado',APP_KIND:'collector',ASSETS:{fetch:async()=>new Response('asset')}};}
async function visitWithComputer(f,env,sess,unitKey='pending',registration='Manual'){
 const start=await humanFetch(worker,env,origin,sess,'/api/collector/v2-start',{unitId:f.ids[unitKey]});assert.equal(start.status,201,JSON.stringify(start.data));
 const i=start.data.inspection;
 const envr=await humanFetch(worker,env,origin,sess,'/api/collector/environment-save',{inspectionId:i.id,name:'TESTE ISOLADO · Laboratório',type:'Laboratório de informática'});assert.equal(envr.status,201);
 const id=crypto.randomUUID();
 const data={category:'desktop',mode:'Individual',quantity:1,registration,manualReason:registration==='Manual'?'Não liga':undefined,environment:envr.data.environment.id,assetStatus:'Sem patrimônio',condition:'Bom',operation:'Funcionando',use:'Em uso'};
 const saved=await humanFetch(worker,env,origin,sess,'/api/collector/equipment-save',{inspectionId:i.id,id,data});assert.equal(saved.status,201,JSON.stringify(saved.data));
 const lock=await lockFor(worker,env,origin,sess,i.id,id);
 return {inspection:i,environment:envr.data.environment,equipmentId:id,version:saved.data.version,lock};
}
async function grant(f,env,root,{max_uses=1,expires_in_seconds=3600}={}){const r=await humanFetch(worker,env,origin,root,'/api/root/agent-install-grants',{expires_in_seconds,max_uses,note:'TESTE ISOLADO'});assert.equal(r.status,201,JSON.stringify(r.data));return r.data;}
test('autorização de instalação é exclusiva do root; cadastro do agente usa assinatura, sem Origin nem cookie',async()=>{
 const f=collectorFixture(),env=envFor(f);
 try{
 const root=await session(f,f.root),admin=await session(f,{...f.root,id:f.root.id});
 f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run('root',f.root.id);
 const op=await session(f,f.operator);
 assert.equal((await humanFetch(worker,env,origin,op,'/api/root/agent-install-grants',{expires_in_seconds:3600})).status,403,'operador não emite autorização');
 const g=await grant(f,env,root);assert.match(g.grant_code??'',/^[A-Za-z0-9_-]{22,}$/);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_install_grants WHERE code_hash=?').get(g.grant_code).n,0,'código nunca gravado em claro');
 const identity=await agentIdentity();
 const bad=await challenge(worker,env,origin,'codigo-invalido-0000000000');assert.equal(bad.status,401);
 const {challenge:ch,enrollment:en}=await enroll(worker,env,origin,identity,g.grant_code);
 assert.equal(ch.status,200,JSON.stringify(ch.data));assert.equal(en.status,201,JSON.stringify(en.data));
 assert.equal(en.data.state,'pending_pairing');assert.match(en.data.pairing_code,/^[A-Za-z0-9_-]{22}$/);assert.ok(en.data.visual_code);
 // Assinatura adulterada, replay de nonce e relógio fora da tolerância são recusados.
 const statusBody=()=>({protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId});
 assert.equal((await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollment-status',statusBody(),{tamperSignature:true})).status,401);
 const nonce='AQEBAQEBAQEBAQEBAQEBAQ';
 assert.equal((await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollment-status',statusBody(),{nonce})).status,200);
 const replay=await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollment-status',statusBody(),{nonce});assert.equal(replay.status,401);assert.equal(replay.data.code,'REPLAY');
 const skew=await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollment-status',statusBody(),{timestamp:Math.floor(Date.now()/1000)-900});assert.equal(skew.status,401);assert.equal(skew.data.code,'CLOCK_SKEW');
 // Autorização de uso único não serve para um segundo computador.
 const second=await agentIdentity();const again=await enroll(worker,env,origin,second,g.grant_code);assert.equal(again.challenge.status,409);
 }finally{f.sqlite.close();}
});
test('vínculo por QR: prévia e claim humanos com CSRF, ficha existente preservada, idempotência, consumo único e trilha',async()=>{
 const f=collectorFixture(),env=envFor(f);
 try{
 const root=await session(f,f.root),op=await session(f,f.operator);
 const g=await grant(f,env,root);const identity=await agentIdentity();const {enrollment:en}=await enroll(worker,env,origin,identity,g.grant_code);assert.equal(en.status,201);
 const v=await visitWithComputer(f,env,op);
 const before=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(v.equipmentId);
 // Prévia exige CSRF (rota humana) e devolve resumo + sugestões sem N+1.
 assert.equal((await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/preview',{enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending},{noCsrf:true})).status,403);
 const preview=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/preview',{enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending});
 assert.equal(preview.status,200,JSON.stringify(preview.data));assert.equal(preview.data.summary.hostname,summary.hostname);assert.equal(preview.data.visual_code,en.data.visual_code);
 assert.ok(preview.data.equipment_suggestions.some(s=>s.equipment_id===v.equipmentId&&s.already_linked===false));
 const wrong=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/preview',{enrollment_id:en.data.enrollment_id,pairing_code:'AAAAAAAAAAAAAAAAAAAAAA',unit_id:f.ids.pending});assert.equal(wrong.status,422);
 // Visualizador não confirma vínculo.
 const viewer={...f.root,id:f.root.id};f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);const viewerSess=await session(f,viewer);
 const claimBody=()=>({request_id:crypto.randomUUID(),enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending,environment_id:v.environment.id,inspection_id:v.inspection.id,equipment:{mode:'existing',equipment_id:v.equipmentId,expected_version:v.version},position:{label:'Bancada 01 / PC 01'},visual_code_confirmed:true,lock_token:v.lock});
 assert.equal((await humanFetch(worker,env,origin,viewerSess,'/api/agent/v1/pairings/claim',claimBody())).status,403);
 f.sqlite.prepare("UPDATE users SET role='root' WHERE id=?").run(f.root.id);
 // Sem confirmação do código visual: recusado. Ambiente de outra unidade: recusado. Versão desatualizada: conflito.
 assert.equal((await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',{...claimBody(),visual_code_confirmed:false})).status,422);
 const otherEnv=f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),f.ids.blocked,'TESTE OUTRA','x',Date.now(),f.root.id);
 const otherEnvId=f.sqlite.prepare('SELECT id FROM environments WHERE unit_id=?').get(f.ids.blocked).id;
 assert.equal((await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',{...claimBody(),environment_id:otherEnvId})).status,422);
 const stale=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',{...claimBody(),equipment:{mode:'existing',equipment_id:v.equipmentId,expected_version:99}});assert.equal(stale.status,409);assert.equal(stale.data.code,'EQUIPMENT_VERSION_CONFLICT');
 // Claim válido.
 const body=claimBody();const claim=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',body);
 assert.equal(claim.status,201,JSON.stringify(claim.data));assert.equal(claim.data.equipment_id,v.equipmentId);assert.equal(claim.data.equipment_version,v.version+1);assert.equal(claim.data.duplicate,false);
 const after=f.sqlite.prepare('SELECT * FROM equipments WHERE id=?').get(v.equipmentId);
 assert.equal(after.id,before.id,'mesmo ID permanente');assert.equal(after.version,before.version+1);assert.equal(after.environment_id,v.environment.id);assert.equal(JSON.parse(after.data_json).environment,v.environment.id);assert.equal(after.position_label,'Bancada 01 / PC 01');assert.equal(after.location_state,'confirmada_em_visita');assert.equal(after.location_confirmed_by,f.operator.id);
 assert.equal(JSON.parse(after.data_json).registration,'Agente','ficha manual passa a registrar o agente');assert.equal(JSON.parse(after.data_json).manualReason,'Não liga','histórico do motivo manual preservado');
 assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM collection_history WHERE entity_id=? AND event='agent_linked'").get(v.equipmentId).n,1);
 assert.equal(f.sqlite.prepare('SELECT state FROM agent_devices WHERE device_id=?').get(identity.deviceId).state,'linked');
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_claim_requests').get().n,1,'recibo gravado junto do vínculo');
 // QR09: mesmo request_id devolve o mesmo resultado; QR com outro pedido já consumido.
 const repeat=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',body);assert.equal(repeat.status,201);assert.equal(repeat.data.duplicate,true);assert.equal(repeat.data.link_id,claim.data.link_id);
 const consumed=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',claimBody());assert.equal(consumed.status,410);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE equipment_id=? AND ended_at IS NULL').get(v.equipmentId).n,1);
 // O agente confirma o vínculo e passa a comunicar presença; status aparece no painel.
 const st=await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId});assert.equal(st.data.state,'linked');assert.equal(st.data.link.equipment_id,v.equipmentId);
 const confirm=await machinePost(worker,env,origin,identity,'/api/agent/v1/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId,link_id:claim.data.link_id});assert.equal(confirm.status,200);
 const hb=await machinePost(worker,env,origin,identity,'/api/agent/v1/heartbeat',heartbeatBody(identity,{sequence:1}));assert.equal(hb.status,200,JSON.stringify(hb.data));assert.equal(hb.data.presence_updated,true);
 const inv=await machinePost(worker,env,origin,identity,'/api/agent/v1/inventory',inventoryBody(identity,{sequence:2}));assert.equal(inv.status,200,JSON.stringify(inv.data));
 const status=await humanFetch(worker,env,origin,root,'/api/inventory/agent-status?equipmentId='+v.equipmentId);
 assert.equal(status.status,200,JSON.stringify(status.data));assert.equal(status.data.agent.device_id,identity.deviceId);assert.equal(status.data.agent.presence.state,'communicating');assert.equal(status.data.agent.current_inventory.sections.cpu.data.processors[0].name,'CPU-TESTE');assert.equal(status.data.official_record.location,null,'ficha nunca publicada: sem localização oficial');assert.equal(status.data.draft_location.position_label,'Bancada 01 / PC 01');assert.equal(status.data.draft_location.provenance,'rascunho_visita_aberta');
 const history=await humanFetch(worker,env,origin,root,'/api/inventory/agent-history?equipmentId='+v.equipmentId);assert.equal(history.data.items.length,1);
 // Telemetria não conclui vistoria nem cria conferência.
 assert.equal(f.sqlite.prepare('SELECT state FROM inspections WHERE id=?').get(v.inspection.id).state,'open');
 }finally{f.sqlite.close();}
});
test('R1 e R2: revogação concorrente não cria vínculo; falha após gravar devolve o mesmo recibo na repetição',async()=>{
 const f=collectorFixture(),env=envFor(f);
 try{
 const root=await session(f,f.root),op=await session(f,f.operator);
 const g=await grant(f,env,root,{max_uses:3});const a=await agentIdentity(),b=await agentIdentity();
 const ea=(await enroll(worker,env,origin,a,g.grant_code)).enrollment,eb=(await enroll(worker,env,origin,b,g.grant_code)).enrollment;
 const v=await visitWithComputer(f,env,op);
 const claimFor=(en,extra={})=>({request_id:crypto.randomUUID(),enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending,environment_id:v.environment.id,inspection_id:v.inspection.id,equipment:{mode:'existing',equipment_id:v.equipmentId,expected_version:v.version},position:{label:'PC 01'},visual_code_confirmed:true,lock_token:v.lock,...extra});
 // R1 (a): revogado antes do claim → 403 e nenhum vínculo.
 assert.equal((await humanFetch(worker,env,origin,root,'/api/root/agent-revoke',{device_id:a.deviceId,reason:'TESTE ISOLADO revogação'})).status,200);
 const revoked=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',claimFor(ea));assert.equal(revoked.status,403);assert.equal(revoked.data.code,'DEVICE_REVOKED');
 // R1 (b): corrida — revogação acontece entre a pré-checagem e a gravação. O batch deve desfazer tudo.
 const realBatch=f.db.batch;let raced=false;
 f.db.batch=async statements=>{if(!raced&&statements.some(s=>true)&&f.sqlite.prepare("SELECT state FROM agent_devices WHERE device_id=?").get(b.deviceId)?.state==='pending_pairing'){raced=true;f.sqlite.prepare("UPDATE agent_devices SET state='revoked',revoked_at=? WHERE device_id=?").run(new Date().toISOString(),b.deviceId);}return realBatch(statements);};
 const race=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',claimFor(eb));f.db.batch=realBatch;
 assert.equal(race.status,403,JSON.stringify(race.data));assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,0);assert.equal(f.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(v.equipmentId).version,v.version,'ficha intacta');
 // R2: novo agente; falha DEPOIS do commit (auditoria) → 503 na primeira resposta, mas o vínculo e o recibo já existem;
 // a repetição com o mesmo request_id devolve o resultado original em vez de conflito de versão.
 const c=await agentIdentity();const ec=(await enroll(worker,env,origin,c,g.grant_code)).enrollment;assert.equal(ec.status,201);
 const body=claimFor(ec);
 const realPrepare=f.db.prepare;let failed=false;f.db.prepare=(sql,...rest)=>{if(!failed&&/INSERT INTO agent_audit_log/.test(sql)){failed=true;return {bind:()=>({run:async()=>{throw Error('falha simulada após gravar');},first:async()=>{throw Error('falha simulada');},all:async()=>{throw Error('falha simulada');}})};}return realPrepare(sql,...rest);};
 const first=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',body);f.db.prepare=realPrepare;
 assert.equal(first.status,503,JSON.stringify(first.data));
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE equipment_id=? AND ended_at IS NULL').get(v.equipmentId).n,1,'vínculo gravado');
 const retry=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',body);
 assert.equal(retry.status,201,JSON.stringify(retry.data));assert.equal(retry.data.duplicate,true);assert.equal(retry.data.equipment_version,v.version+1);
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE equipment_id=?').get(v.equipmentId).n,1,'sem segundo vínculo');
 }finally{f.sqlite.close();}
});
test('R3: heartbeat atrasado não regride a presença; reinício (novo boot) é aceito; última comunicação e última leitura são distintas',async()=>{
 const f=collectorFixture(),env=envFor(f);
 try{
 const root=await session(f,f.root),op=await session(f,f.operator);
 const g=await grant(f,env,root);const id=await agentIdentity();const en=(await enroll(worker,env,origin,id,g.grant_code)).enrollment;
 const v=await visitWithComputer(f,env,op);
 const claim=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/claim',{request_id:crypto.randomUUID(),enrollment_id:en.data.enrollment_id,pairing_code:en.data.pairing_code,unit_id:f.ids.pending,environment_id:v.environment.id,inspection_id:v.inspection.id,equipment:{mode:'existing',equipment_id:v.equipmentId,expected_version:v.version},position:{label:'PC 02'},visual_code_confirmed:true,lock_token:v.lock});assert.equal(claim.status,201);
 const iso=ms=>new Date(ms).toISOString().replace(/\.\d{3}Z$/,'Z');
 const t0=Date.now();
 const s2=await machinePost(worker,env,origin,id,'/api/agent/v1/heartbeat',heartbeatBody(id,{sequence:2,collectedAt:iso(t0-1000)}));assert.equal(s2.data.presence_updated,true);
 const s1=await machinePost(worker,env,origin,id,'/api/agent/v1/heartbeat',heartbeatBody(id,{sequence:1,collectedAt:iso(t0-5000)}));assert.equal(s1.status,200);assert.equal(s1.data.presence_updated,false,'sequência antiga não atualiza');
 const presence=()=>JSON.parse(f.sqlite.prepare('SELECT data_json FROM agent_presence WHERE device_id=?').get(id.deviceId).data_json);
 assert.equal(presence().sequence,2);assert.ok(presence().last_received_at,'recebimento registrado mesmo sem avançar');
 // Corrida: duas gravações com o mesmo estado lido; a mais antiga perde no momento da escrita.
 const newBoot=crypto.randomUUID();
 const s3=await machinePost(worker,env,origin,id,'/api/agent/v1/heartbeat',heartbeatBody(id,{sequence:1,bootId:newBoot,collectedAt:iso(t0)}));assert.equal(s3.data.presence_updated,true,'novo boot com coleta mais recente é aceito');
 assert.equal(presence().boot_id,newBoot);
 const late=await machinePost(worker,env,origin,id,'/api/agent/v1/heartbeat',heartbeatBody(id,{sequence:9,collectedAt:iso(t0-3000)}));assert.equal(late.data.presence_updated,false,'boot antigo com coleta anterior não regride');
 const status=await humanFetch(worker,env,origin,root,'/api/inventory/agent-status?equipmentId='+v.equipmentId);
 assert.equal(status.data.agent.presence.last_boot_id,newBoot);assert.equal(status.data.agent.current_inventory,null,'sem leitura técnica ainda');assert.ok(status.data.agent.presence.last_live_contact_at);
 }finally{f.sqlite.close();}
});
test('R4 e R5: lote atrás do mesmo IP não esgota o limite indevidamente; catálogo paginado sem N+1',async()=>{
 const f=collectorFixture(),env=envFor(f);
 try{
 const root=await session(f,f.root),op=await session(f,f.operator);
 const g=await grant(f,env,root,{max_uses:200});
 for(let n=0;n<40;n++){const c=await challenge(worker,env,origin,g.grant_code,{ip:'10.0.0.1'});assert.equal(c.status,200,'desafio '+n+' → '+c.status);}
 // Abuso continua limitado: código inválido repetido muitas vezes do mesmo IP acaba em 429.
 let blocked=0;for(let n=0;n<700;n++){const c=await challenge(worker,env,origin,'codigo-invalido-'+String(n).padStart(12,'0'),{ip:'10.0.0.9'});if(c.status===429){blocked++;break;}}assert.equal(blocked,1,'limite por IP continua existindo');
 const v=await visitWithComputer(f,env,op);
 for(let n=0;n<60;n++){const r=await humanFetch(worker,env,origin,op,'/api/collector/equipment-save',{inspectionId:v.inspection.id,id:crypto.randomUUID(),data:{category:'desktop',mode:'Individual',quantity:1,registration:'Manual',manualReason:'Não liga',environment:v.environment.id,assetStatus:'Informar número',asset:'TESTE-'+String(n).padStart(4,'0'),condition:'Bom',operation:'Funcionando',use:'Em uso'}});assert.equal(r.status,201);}
 let prepared=0;const realPrepare=f.db.prepare;f.db.prepare=(sql,...rest)=>{prepared++;return realPrepare(sql,...rest);};
 const page1=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/catalog?unit_id='+f.ids.pending);
 assert.equal(page1.status,200,JSON.stringify(page1.data));assert.equal(page1.data.equipment.length,50);assert.ok(page1.data.next_cursor);assert.ok(prepared<12,'consultas na página 1: '+prepared);
 prepared=0;const page2=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/catalog?unit_id='+f.ids.pending+'&cursor='+encodeURIComponent(page1.data.next_cursor));
 assert.equal(page2.data.equipment.length,11);assert.equal(page2.data.next_cursor,null);
 const ids=new Set([...page1.data.equipment,...page2.data.equipment].map(e=>e.id));assert.equal(ids.size,61,'sem repetição nem perda');
 const search=await humanFetch(worker,env,origin,op,'/api/agent/v1/pairings/catalog?unit_id='+f.ids.pending+'&q=teste-0007');assert.equal(search.data.equipment.length,1);
 f.db.prepare=realPrepare;
 }finally{f.sqlite.close();}
});
