import {digest} from './security.mjs';
import {readDispatchMap,roadRoute} from './dispatch-road-routing.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const freshMs=180000;
export async function cleanDispatchPositions(db,now=Date.now()){
 await db.batch([db.prepare("UPDATE dispatch_attendances SET ended_at=?,end_reason='session_expired' WHERE ended_at IS NULL AND NOT EXISTS(SELECT 1 FROM sessions s JOIN users u ON u.id=s.user_id AND u.active=1 AND u.credential_version=s.credential_version WHERE s.token_hash=dispatch_attendances.session_hash AND s.expires_at>?)").bind(now,now),db.prepare('DELETE FROM dispatch_positions WHERE received_at<? OR observed_at<?').bind(now-freshMs,now-freshMs)]);
 await db.prepare('DELETE FROM dispatch_road_routes WHERE expires_at<=?').bind(now).run();
}
export async function isTechnician(db,id){return !!await db.prepare('SELECT 1 FROM dispatch_technicians WHERE user_id=? AND enabled=1').bind(id).first();}
export function validPosition(p,now=Date.now()){
 return p&&typeof p==='object'&&['latitude','longitude','accuracy','observedAt'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k]))&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180&&p.accuracy>0&&p.accuracy<=5000&&p.observedAt<=now+30000&&p.observedAt>=now-90000;
}
const assignmentSql=`SELECT a.id,a.request_id,a.user_id,u.display_name,u.username,a.assigned_at,
 t.id AS attendance_id,t.started_at,t.session_hash,s.expires_at
 FROM dispatch_assignments a JOIN users u ON u.id=a.user_id AND u.active=1
 JOIN dispatch_technicians cap ON cap.user_id=u.id AND cap.enabled=1
 LEFT JOIN dispatch_attendances t ON t.assignment_id=a.id AND t.ended_at IS NULL
 LEFT JOIN sessions s ON s.token_hash=t.session_hash AND s.credential_version=u.credential_version
 WHERE a.ended_at IS NULL`;
const queueSql=`SELECT r.*,o.position,u.name AS current_unit_name,u.latitude,u.longitude
 FROM service_requests r JOIN dispatch_order o ON o.request_id=r.id LEFT JOIN units u ON u.id=r.unit_id`;
const asRequest=r=>{const {context_json,...rest}=r;return {...rest,context:JSON.parse(context_json)};};
async function queue(db,user,{root=false,offset=0,history=false}={}){
 const cond=root?"r.status!='Concluída'":`EXISTS(SELECT 1 FROM dispatch_assignments a WHERE a.request_id=r.id AND a.user_id=? AND a.ended_at IS NULL) AND r.status${history?'=':'!='}'Concluída'`;
 const args=root?[]:[user.id];
 const [page,count,meta,assigned]=await db.batch([
  db.prepare(queueSql+' WHERE '+cond+` ORDER BY ${history?'r.updated_at DESC':'o.position,r.number'} LIMIT 100 OFFSET ?`).bind(...args,offset),
  db.prepare('SELECT COUNT(*) AS total FROM service_requests r WHERE '+cond).bind(...args),
  db.prepare('SELECT revision FROM dispatch_meta WHERE id=1'),
  db.prepare(assignmentSql+(root?'':' AND a.request_id IN (SELECT request_id FROM dispatch_assignments WHERE user_id=? AND ended_at IS NULL)')).bind(...(root?[]:[user.id]))
 ]);
 const now=Date.now(),items=page.results.map(asRequest).map(r=>({...r,assignments:assigned.results.filter(a=>a.request_id===r.id).map(a=>({id:a.id,userId:a.user_id,name:a.display_name||a.username,accepted:!!a.attendance_id&&a.expires_at>now,attendanceId:a.expires_at>now?a.attendance_id:null,startedAt:a.expires_at>now?a.started_at:null}))}));
 return {items,total:count.results[0].total,revision:meta.results[0].revision,offset,nextOffset:offset+items.length<count.results[0].total?offset+100:null,serverTime:now};
}
async function noticeData(db,user){const [items,count]=await db.batch([db.prepare('SELECT id,request_id,message,created_at,read_at FROM dispatch_notifications WHERE user_id=? ORDER BY id DESC LIMIT 30').bind(user.id),db.prepare('SELECT COUNT(*) AS total FROM dispatch_notifications WHERE user_id=? AND read_at IS NULL').bind(user.id)]);return {notifications:items.results,unread:count.results[0].total};}
// One compare-and-swap and transaction for every business command. The random attempt,
// rather than the client operation ID, gates statements even in a simultaneous retry.
async function command(db,user,a,expected,build,{json,fail}){
 if(!uuid(a.operationId)||!Number.isSafeInteger(expected)||expected<0)return fail('Atualize a lista antes de enviar.');
 const hash=await digest(JSON.stringify(a));
 const replay=async()=>{const rec=await db.prepare('SELECT actor_id,payload_hash FROM dispatch_receipts WHERE operation_id=?').bind(a.operationId).first();return rec?rec.actor_id===user.id&&rec.payload_hash===hash?json({ok:true,replayed:true}):fail('Operação já utilizada com outros dados.',409):null;};
 const previous=await replay();if(previous)return previous;
 const attempt=crypto.randomUUID(),now=Date.now();
 const gate='EXISTS(SELECT 1 FROM dispatch_meta WHERE id=1 AND attempt=?)';
 const stmt=(sql,args=[])=>db.prepare(sql.replaceAll('$gate',gate)).bind(...args,attempt);
 const event=(action,detail,id=a.id||null)=>stmt('INSERT INTO dispatch_events SELECT ?,?,?,?,?,?,? WHERE $gate',[crypto.randomUUID(),id,user.id,user.display_name||user.username,action,JSON.stringify(detail),now]);
 const notify=(ids,message,id=a.id||null)=>stmt('INSERT INTO dispatch_notifications(user_id,request_id,message,created_at) SELECT value,?,?,? FROM json_each(?) WHERE $gate',[id,message,now,JSON.stringify([...new Set(ids)])]);
 const operations=await build({stmt,event,notify,now});
 const out=await db.batch([db.prepare('UPDATE dispatch_meta SET revision=revision+1,attempt=? WHERE id=1 AND revision=?').bind(attempt,expected),stmt('INSERT INTO dispatch_receipts SELECT ?,?,?,? WHERE $gate',[a.operationId,user.id,hash,now]),...operations]);
 if(!out[0].meta.changes)return await replay()||fail('A lista foi alterada por outra pessoa. Atualize e confira antes de tentar novamente.',409);
 return json({ok:true});
}
export async function technicalDispatchRoutes(request,url,user,env,helpers){
 const {json,fail,body}=helpers,path=url.pathname;
 if(!path.startsWith('/api/dispatch/')&&!path.startsWith('/api/technician/'))return null;
 if(env.APP_KIND==='collector')return fail('Este módulo não pertence ao coletor.',403);
 const db=env.DB,admin=path.startsWith('/api/dispatch/'),root=user.role==='root';
 if(admin&&!root)return fail('Somente root organiza e acompanha os atendimentos.',403);
 if(!admin&&!await isTechnician(db,user.id))return fail('Sua conta ainda não foi habilitada como técnico pelo root.',403);
 const endpoint=path.split('/').at(-1),get=request.method==='GET',now=Date.now();
 if(get&&endpoint==='queue'){
  const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)return fail('Página inválida.');
  const data=await queue(db,user,{root:admin,offset,history:!admin&&url.searchParams.get('history')==='1'});
  if(admin)data.technicians=(await db.prepare('SELECT u.id,u.username,u.display_name,u.active,COALESCE(t.enabled,0) AS enabled FROM users u LEFT JOIN dispatch_technicians t ON t.user_id=u.id ORDER BY u.display_name,u.username').all()).results;
  else Object.assign(data,await noticeData(db,user));
  return json(data);
 }
 if(get&&!admin&&endpoint==='notifications')return json(await noticeData(db,user));
 if(get&&!admin&&endpoint==='active'){
  const attendance=await db.prepare(`SELECT t.id,t.request_id FROM dispatch_attendances t JOIN dispatch_assignments a ON a.id=t.assignment_id AND a.ended_at IS NULL JOIN service_requests r ON r.id=t.request_id AND r.status!='Concluída' WHERE t.user_id=? AND t.ended_at IS NULL AND t.session_hash=?`).bind(user.id,user.token_hash).first();
  return json({attendance});
 }
 if(get&&admin&&endpoint==='map')return json(await readDispatchMap(db,now));
 if(get&&admin&&endpoint==='road-route'){
  const id=url.searchParams.get('technician');if(!uuid(id))return fail('Técnico inválido.');
  return roadRoute(env,id,helpers);
 }
 if(get)return fail('Operação não encontrada.',404);
 const a=await body(request);
 if(!admin&&endpoint==='notifications-read'){
  if(!Number.isSafeInteger(a.through)||a.through<0)return fail('Notificação inválida.');
  await db.prepare('UPDATE dispatch_notifications SET read_at=? WHERE user_id=? AND id<=? AND read_at IS NULL').bind(now,user.id,a.through).run();return json({ok:true});
 }
 if(!admin&&endpoint==='position'){
  if(!uuid(a.attendanceId)||!validPosition(a.position,now))return fail('Localização atual indisponível.',422);
  const p=a.position;
  const r=await db.prepare(`INSERT INTO dispatch_positions SELECT t.id,?,?,?,?,? FROM dispatch_attendances t JOIN dispatch_assignments a ON a.id=t.assignment_id AND a.ended_at IS NULL JOIN service_requests r ON r.id=t.request_id AND r.status!='Concluída' JOIN dispatch_technicians c ON c.user_id=t.user_id AND c.enabled=1 WHERE t.id=? AND t.user_id=? AND t.session_hash=? AND t.ended_at IS NULL ON CONFLICT(attendance_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,accuracy=excluded.accuracy,observed_at=excluded.observed_at,received_at=excluded.received_at WHERE excluded.observed_at>dispatch_positions.observed_at`).bind(p.latitude,p.longitude,p.accuracy,p.observedAt,now,a.attendanceId,user.id,user.token_hash).run();
  if(!r.meta.changes){const active=await db.prepare('SELECT id FROM dispatch_attendances WHERE id=? AND user_id=? AND session_hash=? AND ended_at IS NULL').bind(a.attendanceId,user.id,user.token_hash).first();if(!active)return fail('O acompanhamento deste atendimento foi encerrado.',409);}
  return json({ok:true});
 }
 const meta=await db.prepare('SELECT revision FROM dispatch_meta WHERE id=1').first();
 if(admin&&endpoint==='technician'){
  if(!uuid(a.userId)||typeof a.enabled!=='boolean')return fail('Selecione um usuário.');
  const target=await db.prepare('SELECT id,active FROM users WHERE id=?').bind(a.userId).first();if(!target||a.enabled&&!target.active)return fail('Usuário indisponível.',422);
  return command(db,user,a,a.revision,({stmt,event,notify,now})=>[
   stmt('INSERT INTO dispatch_technicians SELECT ?,?,?,? WHERE $gate ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at,updated_by=excluded.updated_by',[a.userId,Number(a.enabled),now,user.id]),event('technician_access',{userId:a.userId,enabled:a.enabled},null),notify([a.userId],a.enabled?'Acesso ao aplicativo técnico habilitado.':'Acesso ao aplicativo técnico retirado.',null)
  ],helpers);
 }
 if(admin&&endpoint==='move'){
  if(!uuid(a.id)||a.beforeId!==null&&!uuid(a.beforeId))return fail('Destino de ordenação inválido.');
  const list=(await db.prepare("SELECT o.request_id AS id FROM dispatch_order o JOIN service_requests r ON r.id=o.request_id WHERE r.status!='Concluída' ORDER BY o.position,r.number").all()).results.map(r=>r.id);
  if(!list.includes(a.id)||a.beforeId&&!list.includes(a.beforeId)||a.beforeId===a.id)return fail('Atualize a lista de demandas.',409);
  const ordered=list.filter(id=>id!==a.id);ordered.splice(a.beforeId?ordered.indexOf(a.beforeId):ordered.length,0,a.id);
  const recipients=(await db.prepare("SELECT DISTINCT a.user_id FROM dispatch_assignments a JOIN service_requests r ON r.id=a.request_id AND r.status!='Concluída' WHERE a.ended_at IS NULL").all()).results.map(r=>r.user_id);
  return command(db,user,a,a.revision,({stmt,event,notify})=>[
   stmt('UPDATE dispatch_order SET position=(SELECT (CAST(key AS INTEGER)+1)*1024 FROM json_each(?) WHERE value=dispatch_order.request_id) WHERE request_id IN (SELECT value FROM json_each(?)) AND $gate',[JSON.stringify(ordered),JSON.stringify(ordered)]),event('reorder',{beforeId:a.beforeId}),notify(recipients,'A sequência de atendimentos foi reorganizada pelo root.')
  ],helpers);
 }
 if(!uuid(a.id))return fail('Selecione uma demanda.');
 const row=await db.prepare('SELECT * FROM service_requests WHERE id=?').bind(a.id).first();if(!row)return fail('Demanda não encontrada.',404);
 if(admin&&endpoint==='assign'){
  if(!Array.isArray(a.userIds)||a.userIds.length>2||new Set(a.userIds).size!==a.userIds.length||!a.userIds.every(uuid))return fail('Escolha até dois técnicos distintos.');
  if(row.status==='Concluída')return fail('Demanda já concluída.',409);
  for(const id of a.userIds)if(!await db.prepare('SELECT 1 FROM users u JOIN dispatch_technicians t ON t.user_id=u.id AND t.enabled=1 WHERE u.id=? AND u.active=1').bind(id).first())return fail('Habilite os usuários como técnicos antes de atribuir.',422);
  const old=(await db.prepare('SELECT id,user_id FROM dispatch_assignments WHERE request_id=? AND ended_at IS NULL').bind(a.id).all()).results;
  return command(db,user,a,a.revision,({stmt,event,notify,now})=>[
   stmt('UPDATE dispatch_assignments SET ended_at=? WHERE request_id=? AND ended_at IS NULL AND user_id NOT IN (SELECT value FROM json_each(?)) AND $gate',[now,a.id,JSON.stringify(a.userIds)]),
   ...a.userIds.filter(id=>!old.some(x=>x.user_id===id)).map(id=>stmt('INSERT INTO dispatch_assignments SELECT ?,?,?,?,?,NULL WHERE $gate',[crypto.randomUUID(),a.id,id,now,user.id])),
   event('assign',{before:old.map(x=>x.user_id),after:a.userIds}),notify([...a.userIds,...old.map(x=>x.user_id)],'A atribuição da demanda #'+row.number+' foi atualizada.')
  ],helpers);
 }
 if(admin)return fail('Operação não encontrada.',404);
 const assignment=await db.prepare('SELECT id FROM dispatch_assignments WHERE request_id=? AND user_id=? AND ended_at IS NULL').bind(a.id,user.id).first();if(!assignment)return fail('Esta demanda não está atribuída a você.',403);
 // Check receipt before state/version so a lost ACK can be retried after conclusion.
 const receipt=await db.prepare('SELECT actor_id,payload_hash FROM dispatch_receipts WHERE operation_id=?').bind(String(a.operationId||'')).first();
 if(receipt)return receipt.actor_id===user.id&&receipt.payload_hash===await digest(JSON.stringify(a))?json({ok:true,replayed:true}):fail('Operação já utilizada.',409);
 if(row.status==='Concluída'||row.version!==a.version)return fail('A demanda mudou. Atualize antes de continuar.',409);
 const note=typeof a.note==='string'?a.note.trim():'';if(note.length>2000)return fail('Observação muito longa.');
 const active=await db.prepare('SELECT t.id,t.request_id,t.session_hash,s.expires_at FROM dispatch_attendances t LEFT JOIN sessions s ON s.token_hash=t.session_hash WHERE t.user_id=? AND t.ended_at IS NULL').bind(user.id).first();
 if(endpoint==='accept'){
  if(!validPosition(a.position,now))return fail('Permita a localização e aguarde uma posição atual para aceitar.',422);
  if(active&&active.expires_at>now)return fail('Você já tem um atendimento ativo. Conclua ou interrompa-o antes de aceitar outro.',409);
 }else if(!['complete','note','pause','blocked'].includes(endpoint))return fail('Operação não encontrada.',404);
 if(['note','blocked'].includes(endpoint)&&!note)return fail('Descreva a observação ou impedimento.');
 if(endpoint==='pause'&&(!active||active.request_id!==a.id))return fail('Este atendimento não está ativo para você.',409);
 if(endpoint==='complete'&&!await db.prepare('SELECT 1 FROM dispatch_attendances WHERE request_id=? AND ended_at IS NULL').bind(a.id).first())return fail('Aceite o atendimento antes de concluir.',422);
 const id=crypto.randomUUID(),status=endpoint==='complete'?'Concluída':endpoint==='accept'?'Em atendimento':row.status;
 return command(db,user,a,meta.revision,({stmt,event,notify,now})=>{
  const statements=[];
  if(endpoint==='accept'){
   statements.push(stmt('UPDATE dispatch_attendances SET ended_at=?,end_reason=? WHERE user_id=? AND ended_at IS NULL AND $gate',[now,'session_expired',user.id]));
   statements.push(stmt('INSERT INTO dispatch_attendances SELECT ?,?,?,?,?,?,NULL,NULL WHERE $gate',[id,assignment.id,a.id,user.id,user.token_hash,now]));
   const p=a.position;statements.push(stmt('INSERT INTO dispatch_positions SELECT ?,?,?,?,?,? WHERE $gate',[id,p.latitude,p.longitude,p.accuracy,p.observedAt,now]));
  }
  if(endpoint==='pause')statements.push(stmt('UPDATE dispatch_attendances SET ended_at=?,end_reason=? WHERE user_id=? AND request_id=? AND ended_at IS NULL AND $gate',[now,'paused',user.id,a.id]));
  statements.push(stmt('UPDATE service_requests SET status=?,version=version+1,updated_at=?,last_operation=? WHERE id=? AND version=? AND $gate',[status,now,a.operationId,a.id,a.version]));
  const labels={accept:'Atendimento aceito pelo técnico.',complete:'Conclusão confirmada pelo técnico.',pause:'Compartilhamento interrompido pelo técnico; demanda permanece aberta.',blocked:'Impedimento registrado pelo técnico.',note:'Observação do técnico.'};
  statements.push(stmt('INSERT INTO service_request_events SELECT ?,?,?,?,?,?,?,? WHERE $gate',[a.operationId,a.id,user.id,user.display_name||user.username,JSON.stringify({action:endpoint,note}),JSON.stringify({...asRequest(row),status,version:row.version+1}),labels[endpoint]+(note?' '+note:''),now]));
  statements.push(event(endpoint,{note,attendanceId:endpoint==='accept'?id:active?.id||null}));
  return statements;
 },helpers);
}
