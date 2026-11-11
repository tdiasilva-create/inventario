// P0 (10/11/2026): revisão explicável — `pending` com uma ação por pendência, compatível com errors/details.
// Reproduz o caso EMI ALANA LUDMILA (duas fichas válidas, agente vinculado, draft=true) com dados sintéticos.
import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorFixture} from './helpers/collector-db.mjs';
import worker from '../server/worker.mjs';
import {session,humanFetch} from './helpers/agent-client.mjs';
const origin='https://test.local';
async function fixture(){const f=collectorFixture(),objects=new Map(),env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector',PHOTOS:{put:async(k,b)=>objects.set(k,b),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)}};const op=await session(f,f.operator);
 f.call=(p,d)=>humanFetch(worker,env,origin,op,p,d);f.env=env;f.op=op;const start=await f.call('/api/collector/v3-start',{unitId:f.ids.pending,preservePrevious:true});assert.equal(start.status,201);f.i=start.data.inspection;
 f.room=crypto.randomUUID();f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by,name_key) VALUES(?,?,?,?,?,?,?)').run(f.room,f.ids.pending,'LAB-ALANA','',Date.now(),f.operator.id,'lab-alana');
 f.computer=({position='Mesa 1',draft=false,agent=true,registration='Agente',operation='Funcionando'}={})=>{const id=crypto.randomUUID(),now=Date.now();const data={questionnaireVersion:'coleta-3.0',category:'desktop',mode:'Individual',quantity:1,registration,environment:f.room,environmentName:'LAB-ALANA',assetStatus:'Sem patrimônio',...(position?{position_label:position}:{}),...(operation?{operation}:{}),...(draft?{draft:true}:{}),...(registration==='Manual'?{manualReason:'Não liga'}:{})};
  f.sqlite.prepare('INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,search_text,data_json,created_by,created_at,updated_by,updated_at,position_label) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,f.ids.pending,f.i.id,'desktop',f.room,'','','desktop',JSON.stringify(data),f.operator.id,now,f.operator.id,now,position||null);
  f.sqlite.prepare("UPDATE inspection_sections SET state='Em andamento' WHERE inspection_id=? AND section='F'").run(f.i.id);
  if(agent){const device=crypto.randomUUID(),iso=new Date().toISOString();f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,iso);f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at,device_confirmed_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),device,id,f.i.id,f.operator.id,iso,iso);}
  return id;};
 return f;}
test('T05/T06/T07: a revisão nomeia cada ficha pendente, com causa e ação; errors/details continuam iguais',async()=>{
 const f=await fixture();try{
  const pc4=f.computer({position:'2 bancada Pc 4',draft:true}),pc6=f.computer({position:'BANCADA 2 / PC6',draft:true}),ok=f.computer({position:'BANCADA 1 / PC1'});
  const semPos=f.computer({position:'',operation:'',draft:true}),semAgente=f.computer({position:'BANCADA 3 / PC9',draft:true,agent:false});
  const r=await f.call('/api/collector/review?id='+f.i.id);assert.equal(r.status,200);const {errors,details,pending}=r.data;
  // compatibilidade
  assert.ok(['Complete e salve as fichas iniciadas nesta visita.','Vincule os computadores em modo Agente ou escolha cadastro manual.'].includes(errors.F),'errors.F continua uma mensagem genérica (a última causa vence) — por isso existe pending');assert.equal(details['draft:'+pc4],'Ficha ainda incompleta.');assert.equal(details['agent:'+semAgente],'Vínculo pendente.');assert.equal(errors.facade,'Envie a fotografia inicial da fachada.');
  // pendências estruturadas
  assert.ok(Array.isArray(pending));
  const by=id=>pending.filter(p=>p.id===id);
  assert.deepEqual(by(pc4).map(p=>p.code),['FICHA_EM_RASCUNHO']);assert.equal(by(pc4)[0].label,'LAB-ALANA · 2 bancada Pc 4');assert.equal(by(pc4)[0].action,'open-equipment');assert.match(by(pc4)[0].message,/falta salvar a ficha/);
  assert.deepEqual(by(pc6).map(p=>p.code),['FICHA_EM_RASCUNHO']);
  assert.equal(by(ok).length,0,'ficha completa não é pendência');
  const t06=by(semPos)[0];assert.equal(t06.code,'CAMPO_OBRIGATORIO');assert.deepEqual(Object.keys(t06.fields).sort(),['operation','position_label']);assert.match(t06.message,/Posição no ambiente/);assert.match(t06.message,/Funcionamento observado/);assert.equal(t06.label,'LAB-ALANA · posição não informada');
  assert.deepEqual(by(semAgente).map(p=>p.code).sort(),['FICHA_EM_RASCUNHO','VINCULO_AGENTE_PENDENTE'],'duas causas na mesma ficha, nenhuma sobrescreve a outra');
  assert.equal(pending.filter(p=>p.section==='F').at(-1).code,'ASSUNTO_NAO_CONCLUIDO','a ação manual de concluir F é listada por último');
  assert.ok(pending.some(p=>p.code==='FOTO_OBRIGATORIA_PENDENTE'&&p.section==='facade'&&p.action==='open-facade'));
  assert.ok(pending.every(p=>p.blocking===true&&typeof p.message==='string'&&p.section));
  // concluir F sem resolver → 409 com as pendências do assunto (sem a de "concluir")
  const row=f.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='F'").get(f.i.id);
  const c=await f.call('/api/collector/inventory-section',{inspectionId:f.i.id,section:'F',version:row.version});assert.equal(c.status,409);assert.ok(Array.isArray(c.data.pending)&&c.data.pending.length===5&&c.data.pending.every(p=>p.section==='F'&&p.code!=='ASSUNTO_NAO_CONCLUIDO'));
  assert.equal(f.sqlite.prepare("SELECT state FROM inspection_sections WHERE inspection_id=? AND section='F'").get(f.i.id).state,'Em andamento','o diagnóstico não conclui nada');
  // salvar a ficha válida com a validação completa retira o rascunho (sem mexer no banco por fora)
  const lock=await f.call('/api/collector/equipment-lock',{inspectionId:f.i.id,id:pc4});assert.equal(lock.status,200);const data={...lock.data.equipment.data};delete data.draft;
  const save=await f.call('/api/collector/equipment-save',{inspectionId:f.i.id,id:pc4,version:lock.data.equipment.version,lockToken:lock.data.token,environmentId:f.room,data});assert.equal(save.status,200);
  const r2=await f.call('/api/collector/review?id='+f.i.id);assert.equal(r2.data.pending.filter(p=>p.id===pc4).length,0);assert.equal(r2.data.pending.filter(p=>p.code==='FICHA_EM_RASCUNHO').length,2);
 }finally{f.sqlite.close();}
});
test('Retomada da própria trava invalida a aba anterior; outro operador e versão antiga não sobrescrevem',async()=>{
 const f=await fixture();try{
  const id=f.computer({registration:'Manual',agent:false}),request={inspectionId:f.i.id,id};
  const first=await f.call('/api/collector/equipment-lock',request),second=await f.call('/api/collector/equipment-lock',request);
  assert.equal(first.status,200);assert.equal(second.status,200);assert.notEqual(first.data.token,second.data.token);
  const other=await session(f,f.root);
  const denied=await humanFetch(worker,f.env,origin,other,'/api/collector/equipment-lock',request);assert.equal(denied.status,409);
  const payload={...request,version:first.data.equipment.version,environmentId:f.room,data:{...first.data.equipment.data,position_label:'Mesa atualizada'}};
  assert.equal((await f.call('/api/collector/equipment-save',{...payload,lockToken:first.data.token})).status,409);
  // Liberar o token antigo não libera o token novo.
  await f.call('/api/collector/equipment-unlock',{id,token:first.data.token});
  assert.equal((await f.call('/api/collector/equipment-save',{...payload,lockToken:second.data.token})).status,200);
  assert.equal((await f.call('/api/collector/equipment-save',{...payload,data:{...payload.data,position_label:'Mudança obsoleta'},lockToken:second.data.token})).status,409);
  assert.equal(f.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(id).position_label,'Mesa atualizada');
 }finally{f.sqlite.close();}
});
test('Impressora sem foto impede concluir G e identifica a ficha; foto pronta libera, sem alterar histórico',async()=>{
 const f=await fixture();try{
  const id=crypto.randomUUID(),save=await f.call('/api/collector/equipment-save',{inspectionId:f.i.id,id,version:0,environmentId:f.room,data:{category:'printer',mode:'Individual',quantity:1,environment:f.room,environmentName:'LAB-ALANA',brand:'TESTE',model:'Modelo isolado',operation:'Funcionando'}});
  assert.equal(save.status,201,JSON.stringify(save));
  const row=f.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='G'").get(f.i.id);
  const result=await f.call('/api/collector/inventory-section',{inspectionId:f.i.id,section:'G',version:row.version});
  assert.equal(result.status,409);assert.equal(result.data.pending.length,1);
  assert.equal(result.data.pending[0].id,id);assert.equal(result.data.pending[0].code,'FOTO_OBRIGATORIA_PENDENTE');
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64');
  const response=await worker.fetch(new Request(origin+'/api/collector/photo-upload',{method:'POST',headers:{Cookie:f.op.cookie,Origin:origin,'X-CSRF-Token':f.op.csrf,'Content-Type':'image/png','X-Photo-Id':crypto.randomUUID(),'X-Inspection-Id':f.i.id,'X-Target-Kind':'equipment','X-Target-Id':id},body:bytes}),f.env);
  assert.equal(response.status,201);
  assert.equal((await f.call('/api/collector/inventory-section',{inspectionId:f.i.id,section:'G',version:row.version})).status,200);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM collection_photos WHERE target_id=?').get(id).n,1);
 }finally{f.sqlite.close();}
});
