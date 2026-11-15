import {observeConnection} from './agentes/connection.mjs';

// Only this closed diagnostic is permitted. No shell, arbitrary URL, download-to-disk or remote script.
export const NETWORK_TEST_PROTOCOL=1;
export const NETWORK_TARGET='cloudflare';
export const NETWORK_LIMITS=Object.freeze({light:{max_seconds:15,download_bytes:0,upload_bytes:0},speed:{max_seconds:45,download_bytes:33554432,upload_bytes:8388608}});
const active="('queued','running','cancelling')";
const parse=v=>{try{return JSON.parse(v||'null');}catch{return null;}};
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
export const networkTestsEnabled=env=>env.AGENT_NETWORK_TESTS_PROVIDER===NETWORK_TARGET;
const hostname=`COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname'))`;
const join=`FROM agent_equipment_links l JOIN inventory_equipment_all e ON e.id=l.equipment_id JOIN units u ON u.id=e.unit_id JOIN agent_devices d ON d.device_id=l.device_id JOIN agent_installations i ON i.device_id=d.device_id AND i.revoked_at IS NULL LEFT JOIN agent_presence p ON p.device_id=d.device_id LEFT JOIN environments n ON n.id=e.environment_id AND n.unit_id=e.unit_id LEFT JOIN equipment_names names ON names.equipment_id=e.id AND names.unit_id=e.unit_id LEFT JOIN agent_current_snapshot cs ON cs.device_id=d.device_id LEFT JOIN agent_inventory_snapshots si ON si.inventory_id=cs.inventory_id LEFT JOIN agent_enrollments en ON en.device_id=d.device_id`;
const live=`l.ended_at IS NULL AND d.state='linked' AND u.active=1`;
function rowView(r,now){return {...r,state:active.includes("'"+r.state+"'")&&r.expires_at<=now?(r.state==='cancelling'?'cancelled':'expired'):r.state,context:parse(r.context_json),result:parse(r.result_json),observation:parse(r.observation_json),context_json:undefined,result_json:undefined,observation_json:undefined};}
async function expire(db,unit,now){await db.prepare(`UPDATE agent_network_tests SET state=CASE WHEN state='cancelling' THEN 'cancelled' ELSE 'expired' END,finished_at=? WHERE unit_id=? AND state IN ${active} AND expires_at<=?`).bind(now,unit,now).run();}

export async function networkTestRoutes(request,url,user,env,{json,fail,body}){
 if(!url.pathname.startsWith('/api/root/network-tests'))return null;
 if(user?.role!=='root'||env.APP_KIND==='collector')return fail('Somente root no painel pode administrar testes de internet.',403);
 const db=env.DB,now=Date.now(),path=url.pathname;
 if(path==='/api/root/network-tests'&&request.method==='GET'){
  const cursor=String(url.searchParams.get('before')||'').split(':'),before=Number(cursor[0])||now+1,beforeId=cursor[1]||'',unit=url.searchParams.get('unit')||'';
  const rows=(await db.prepare(`SELECT * FROM agent_network_tests WHERE (created_at<? OR (created_at=? AND id>?)) ${unit?'AND unit_id=?':''} ORDER BY created_at DESC,id LIMIT 51`).bind(before,before,beforeId,...(unit?[unit]:[])).all()).results;
  return json({enabled:networkTestsEnabled(env),items:rows.slice(0,50).map(r=>rowView(r,now)),next:rows.length>50?rows[49].created_at+':'+rows[49].id:null,server_time:now});
 }
 if(path==='/api/root/network-tests/computers'&&request.method==='GET'){
  const q=String(url.searchParams.get('q')||'').trim().slice(0,80),after=String(url.searchParams.get('after')||'');
  const equipmentId=url.searchParams.get('equipmentId')||'';
  if(equipmentId&&!uuid(equipmentId))return fail('Equipamento inválido.');
  const rows=(await db.prepare(`SELECT l.device_id,l.link_id,e.id equipment_id,e.unit_id,u.name unit_name,n.name environment_name,e.position_label,names.name display_name,${hostname} hostname,i.installation_id,i.agent_version,p.data_json presence_json ${join} WHERE ${live} AND e.id>? ${equipmentId?'AND e.id=?':''} AND (?='' OR instr(lower(u.name||' '||coalesce(e.search_text,'')||' '||coalesce(names.name,'')||' '||coalesce(${hostname},'')),lower(?))>0) ORDER BY e.id LIMIT 51`).bind(after,...(equipmentId?[equipmentId]:[]),q,q).all()).results;
  return json({enabled:networkTestsEnabled(env),items:rows.slice(0,50).map(r=>{const p=parse(r.presence_json)||{};return {...r,presence_json:undefined,agent_version:p.agent_version||r.agent_version,capable:p.network_test_protocol===1,last_contact:p.last_live_contact_at||null,connection:p.network_observation||null};}),next:rows.length>50?rows[49].equipment_id:null});
 }
 if(path==='/api/root/network-tests/request'&&request.method==='POST'){
  if(!networkTestsEnabled(env))return fail('Serviço de medição ainda não habilitado.',503);
  const b=await body(request);if(!uuid(b.request_id)||!uuid(b.equipment_id)||!Object.hasOwn(NETWORK_LIMITS,b.mode)||Object.keys(b).some(k=>!['request_id','equipment_id','mode'].includes(k)))return fail('Informe computador, tipo de teste e identificador do pedido.',422);
  const old=await db.prepare('SELECT * FROM agent_network_tests WHERE request_id=?').bind(b.request_id).first();
  if(old)return old.requested_by===user.id&&old.equipment_id===b.equipment_id&&old.mode===b.mode?json({item:rowView(old,now),duplicate:true}):fail('Identificador usado em outro pedido.',409);
  const c=await db.prepare(`SELECT l.device_id,l.link_id,e.id equipment_id,e.unit_id,u.name unit_name,n.name environment_name,e.position_label,names.name display_name,${hostname} hostname,i.installation_id,p.data_json presence_json ${join} WHERE ${live} AND e.id=? ORDER BY i.created_at DESC LIMIT 1`).bind(b.equipment_id).first();
  if(!c)return fail('Computador sem agente ativo vinculado a uma unidade ativa.',422);
  if(parse(c.presence_json)?.network_test_protocol!==1)return fail('Atualize o agente: esta instalação ainda não informou suporte ao teste de internet.',422);
  await expire(db,c.unit_id,now);
  const context={unit:c.unit_name,environment:c.environment_name,position:c.position_label,computer:c.display_name,hostname:c.hostname};
  const id=crypto.randomUUID();
  try{
   const r=await db.prepare(`INSERT INTO agent_network_tests(id,request_id,requested_by,device_id,installation_id,link_id,equipment_id,unit_id,context_json,mode,state,created_at,expires_at) SELECT ?,?,?,?,?,?,?,?,?,?,'queued',?,? WHERE NOT EXISTS(SELECT 1 FROM agent_network_tests WHERE unit_id=? AND created_at>?) AND (SELECT count(*) FROM agent_network_tests WHERE state IN ${active} AND expires_at>?)<20`).bind(id,b.request_id,user.id,c.device_id,c.installation_id,c.link_id,c.equipment_id,c.unit_id,JSON.stringify(context),b.mode,now,now+1800000,c.unit_id,now-300000,now).run();
   if(!r.meta.changes)return fail('Aguarde cinco minutos entre pedidos da mesma unidade ou a liberação da fila.',409);
  }catch(e){if(/UNIQUE constraint/.test(e.message))return fail('Já existe um teste pendente nesta unidade. Atualize o histórico.',409);throw e;}
  return json({item:rowView(await db.prepare('SELECT * FROM agent_network_tests WHERE id=?').bind(id).first(),now)},201);
 }
 if(path==='/api/root/network-tests/cancel'&&request.method==='POST'){
  const b=await body(request);if(!uuid(b.id))return fail('Pedido inválido.',422);
  const r=await db.prepare(`UPDATE agent_network_tests SET state=CASE WHEN state='queued' THEN 'cancelled' ELSE 'cancelling' END,cancelled_by=?,finished_at=CASE WHEN state='queued' THEN ? ELSE finished_at END WHERE id=? AND state IN ('queued','running') RETURNING *`).bind(user.id,now,b.id).all();
  const item=r.results[0]||await db.prepare('SELECT * FROM agent_network_tests WHERE id=?').bind(b.id).first();
  return item?json({item:rowView(item,now)}):fail('Teste não encontrado.',404);
 }
 return fail('Operação de teste inexistente.',404);
}

// One indexed lookup only for a new agent declaring support, at its existing heartbeat cadence.
export async function pendingNetworkTest(env,device,now){
 if(!networkTestsEnabled(env))return null;
 const r=await env.DB.prepare("SELECT id,mode,expires_at,link_id FROM agent_network_tests WHERE device_id=? AND state='queued' AND expires_at>? ORDER BY created_at LIMIT 1").bind(device.device_id,now).first();
 return r?{id:r.id,mode:r.mode,link_id:r.link_id,expires_at:r.expires_at}:null;
}

function validateResult(result,job,now){
 if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Resultado inválido.');
 const keys=['outcome','started_at','finished_at','latency_ms','jitter_ms','download','upload','interface_type','reason'];
 if(Object.keys(result).some(k=>!keys.includes(k)))throw Error('Campo de resultado não permitido.');
 if(!['completed','failed','cancelled'].includes(result.outcome))throw Error('Estado de resultado inválido.');
 if(!Number.isSafeInteger(result.started_at)||!Number.isSafeInteger(result.finished_at)||result.finished_at<result.started_at||result.finished_at>now+300000||now-result.finished_at>86400000||Math.abs(job.started_at-result.started_at)>300000||(result.outcome==='completed'&&result.finished_at-result.started_at>60000))throw Error('Horário/duração do teste inválido.');
 for(const k of ['latency_ms','jitter_ms'])if(result[k]!==null&&(!Number.isFinite(result[k])||result[k]<0||result[k]>60000))throw Error('Latência inválida.');
 if(!['wired','wifi','other','unknown'].includes(result.interface_type))throw Error('Interface inválida.');
 if(result.reason!==null&&(typeof result.reason!=='string'||result.reason.length>200))throw Error('Motivo inválido.');
 const out={...result};
 for(const direction of ['download','upload']){
  const sample=result[direction],limit=NETWORK_LIMITS[job.mode][direction+'_bytes'];
  if(sample==null){out[direction]=null;continue;}
  if(!limit||Object.keys(sample).some(k=>!['bytes','milliseconds','limited'].includes(k))||!Number.isSafeInteger(sample.bytes)||sample.bytes<1||sample.bytes>limit||!Number.isFinite(sample.milliseconds)||sample.milliseconds<1||sample.milliseconds>45000||typeof sample.limited!=='boolean')throw Error('Amostra de transferência inválida.');
  out[direction]={...sample,mbps:Math.round(sample.bytes*8/sample.milliseconds/1000*100)/100};
 }
 if(out.outcome==='completed'&&(out.latency_ms===null||(job.mode==='speed'&&(!out.download||!out.upload))))throw Error('Teste incompleto não pode ser concluído.');
 return out;
}

export async function networkTestMachine(env,request,body,{device,inst,link,now,ApiError}){
 const db=env.DB,action=new URL(request.url).pathname.split('/').pop(),bad=(status,code,message)=>{throw new ApiError(status,code,message);};
 if(!networkTestsEnabled(env)&&action!=='result')bad(503,'NETWORK_TEST_DISABLED','Medição não habilitada.');
 if(!uuid(body.id)||!uuid(body.attempt_id)||body.installation_id!==inst.installation_id||body.protocol_version!=='1.0'||Object.keys(body).some(k=>!['id','attempt_id','installation_id','protocol_version','result'].includes(k)))bad(422,'VALIDATION_FAILED','Pedido inválido.');
 let job=await db.prepare('SELECT * FROM agent_network_tests WHERE id=?').bind(body.id).first();
 if(!job||job.device_id!==device.device_id||job.installation_id!==inst.installation_id||job.link_id!==link.link_id)bad(404,'NETWORK_TEST_NOT_FOUND','Pedido não pertence ao vínculo atual.');
 if(action==='start'){
  if(job.state==='running'&&job.attempt_id===body.attempt_id&&job.expires_at>now)return {job:{id:job.id,mode:job.mode,target:NETWORK_TARGET,limits:NETWORK_LIMITS[job.mode],stop_at:job.started_at+60000},duplicate:true};
  if(job.state!=='queued'||job.expires_at<=now)bad(409,'NETWORK_TEST_UNAVAILABLE','Teste cancelado, iniciado ou expirado.');
  // Atomic gate prevents simultaneous starts beyond the global cap; no second execution after a crash.
  const r=await db.prepare("UPDATE agent_network_tests SET state='running',attempt_id=?,started_at=?,expires_at=?,observation_json=? WHERE id=? AND state='queued' AND expires_at>? AND (SELECT count(*) FROM agent_network_tests WHERE state IN ('running','cancelling') AND expires_at>?)<2 RETURNING *").bind(body.attempt_id,now,now+120000,JSON.stringify(observeConnection(request,new Date(now).toISOString())),job.id,now,now).all();
  job=r.results[0];if(!job)bad(409,'NETWORK_TEST_BUSY','Outro teste ocupou a vaga; aguarde a próxima comunicação.');
  return {job:{id:job.id,mode:job.mode,target:NETWORK_TARGET,limits:NETWORK_LIMITS[job.mode],stop_at:now+60000},duplicate:false};
 }
 if(job.attempt_id!==body.attempt_id)bad(409,'NETWORK_TEST_ATTEMPT','Tentativa não corresponde ao teste iniciado.');
 if(action==='check')return {continue:job.state==='running'&&job.expires_at>now&&now<job.started_at+60000,state:rowView(job,now).state};
 if(action!=='result')bad(404,'NOT_FOUND','Operação inexistente.');
 let result;try{result=validateResult(body.result,job,now);}catch(e){bad(422,'VALIDATION_FAILED',e.message);}
 const raw=JSON.stringify(result);
 if(job.result_json){if(job.result_json!==raw)bad(409,'NETWORK_TEST_RESULT_CONFLICT','Resultado já registrado com outro conteúdo.');return {accepted:true,duplicate:true};}
 // A journal may deliver after connectivity returns, without executing the traffic again.
 // Never reopen the lease or undo a cancellation; preserve late evidence with its own timestamp.
 if(!['running','cancelling','expired','cancelled'].includes(job.state)||now-job.started_at>86400000)bad(409,'NETWORK_TEST_EXPIRED','Prazo de recebimento de 24 horas encerrado.');
 const updated=await db.prepare("UPDATE agent_network_tests SET state=CASE WHEN cancelled_by IS NOT NULL THEN 'cancelled' ELSE ? END,result_json=?,finished_at=? WHERE id=? AND attempt_id=? AND state IN ('running','cancelling','expired','cancelled') AND result_json IS NULL RETURNING id").bind(result.outcome,raw,now,job.id,body.attempt_id).all();
 if(!updated.results.length)bad(409,'NETWORK_TEST_RESULT_CONFLICT','Teste alterado; consulte novamente.');
 return {accepted:true,duplicate:false};
}
