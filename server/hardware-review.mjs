const parse=s=>s?JSON.parse(s):{};
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export const notificationJoins=`FROM agent_notifications n
 JOIN units u ON u.id=n.unit_id JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id
 LEFT JOIN equipment_names nm ON nm.equipment_id=e.id AND nm.unit_id=e.unit_id
 LEFT JOIN environments room ON room.id=e.environment_id AND room.unit_id=e.unit_id
 LEFT JOIN agent_inventory_snapshots snap ON snap.inventory_id=json_extract(n.details_json,'$.inventory_id') AND snap.equipment_id=n.equipment_id
 LEFT JOIN agent_hardware_reviews hr ON hr.notification_id=n.id
 LEFT JOIN service_requests sr ON sr.id=hr.request_id`;
export const notificationColumns=`n.*,u.name AS unit_name,COALESCE(room.name,json_extract(e.data_json,'$.environmentName')) AS environment_name,
 e.environment_id,e.position_label,nm.name AS display_name,json_extract(snap.sections_json,'$.system.data.hostname') AS hostname,
 (e.published_json IS NULL) AS partial,
 hr.decision,hr.actor_name AS decision_by,hr.decided_at,hr.note AS decision_note,hr.request_id,sr.number AS request_number,sr.status AS request_status`;
export function notificationItem(row){
 const details=parse(row.details_json),context=details.context||{unit_name:row.unit_name,environment_name:row.environment_name,environment_id:row.environment_id,position_label:row.position_label,display_name:row.display_name,hostname:row.hostname};
 return {...row,...context,context_source:details.context?'at_detection':'current',details,details_json:undefined,review_state:!row.decision?'pending':row.decision==='accepted'?'accepted':row.request_status==='Concluída'?'completed':'demand'};
}
export async function hardwareSummary(db){
 // Resumo independente da página/filtro de notificações e da marcação individual de leitura.
 const base=`FROM agent_notifications n JOIN units u ON u.id=n.unit_id JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id LEFT JOIN agent_hardware_reviews hr ON hr.notification_id=n.id LEFT JOIN service_requests sr ON sr.id=hr.request_id WHERE n.kind='hardware_change'`;
 const [units,pending]=await Promise.all([
  db.prepare(`SELECT n.unit_id,SUM(hr.notification_id IS NULL) AS pending,SUM(hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída') AS demands ${base} GROUP BY n.unit_id HAVING SUM(hr.notification_id IS NULL)+SUM(CASE WHEN hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída' THEN 1 ELSE 0 END)>0`).all(),
  db.prepare(`SELECT n.id ${base} AND hr.notification_id IS NULL ORDER BY n.detected_at DESC,n.id DESC LIMIT 25`).all()
 ]);
 return {units:units.results.map(u=>({...u,pending:Number(u.pending)||0,demands:Number(u.demands)||0})),pending_ids:pending.results.map(n=>n.id),pending:units.results.reduce((n,u)=>n+Number(u.pending||0),0)};
}
function printable(v){if(Array.isArray(v))return v.map(printable).join('; ');return Object.entries(v||{}).map(([k,x])=>k==='bytes'?(x/1073741824)+' GiB':String(x)).join(' / ');}
export async function hardwareReviewRoutes(request,url,user,env,{json,fail,body}){
 const path=url.pathname;if(!['/api/inventory/hardware-alerts','/api/inventory/hardware-review'].includes(path))return null;
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Disponível somente no painel.',403);
 const db=env.DB;
 if(path.endsWith('/hardware-alerts')){
  if(request.method!=='GET')return fail('Método não permitido.',405);
  const id=url.searchParams.get('id')||'',unit=url.searchParams.get('unitId')||'',offset=Number(url.searchParams.get('offset')||0),state=url.searchParams.get('state')||'active';
  if(id&&!uuid(id)||unit&&!uuid(unit)||!Number.isSafeInteger(offset)||offset<0||!['active','pending','all'].includes(state))return fail('Filtro inválido.',422);
  const where=" WHERE n.kind='hardware_change'"+(id?' AND n.id=?':unit?' AND n.unit_id=?':'')+(state==='pending'?' AND hr.notification_id IS NULL':id||state==='all'?'':" AND (hr.notification_id IS NULL OR (hr.decision='demand' AND COALESCE(sr.status,'')!='Concluída'))"),args=id?[id]:unit?[unit]:[];
  const [list,total]=await Promise.all([db.prepare(`SELECT ${notificationColumns} ${notificationJoins}${where} ORDER BY (hr.notification_id IS NULL) DESC,n.detected_at DESC,n.id DESC LIMIT 25 OFFSET ?`).bind(...args,offset).all(),db.prepare(`SELECT COUNT(*) AS n ${notificationJoins}${where}`).bind(...args).first()]);
  return json({items:list.results.map(notificationItem),total:total.n,nextOffset:offset+list.results.length<total.n?offset+25:null});
 }
 if(request.method!=='POST')return fail('Método não permitido.',405);
 if(!['root','admin'].includes(user.role))return fail('Somente root e admin decidem sobre alterações.',403);
 const a=await body(request),note=typeof a.note==='string'?a.note.trim():'';
 if(!uuid(a.id)||!uuid(a.operationId)||!['accepted','demand'].includes(a.decision)||note.length>1000)return fail('Confira a decisão e a observação.',422);
 const payload=JSON.stringify({id:a.id,decision:a.decision,note}),receipt=await db.prepare('SELECT * FROM agent_hardware_reviews WHERE operation_id=?').bind(a.operationId).first();
 if(receipt){if(receipt.actor_id!==user.id||receipt.payload_json!==payload)return fail('Operação já utilizada com outros dados.',409);return json({review:receipt,replayed:true});}
 const row=await db.prepare(`SELECT ${notificationColumns},u.active ${notificationJoins} WHERE n.id=? AND n.kind='hardware_change'`).bind(a.id).first();
 if(!row)return fail('Alteração de hardware não encontrada.',404);
 if(row.decision)return fail('Esta alteração já foi analisada. Atualize para consultar a decisão.',409);
 if(a.decision==='demand'&&!row.active)return fail('A unidade está inativa. Não é possível abrir nova demanda.',409);
 const n=notificationItem(row),now=Date.now(),requestId=a.decision==='demand'?crypto.randomUUID():null,actor=user.display_name||user.username;
 const context={unit_name:n.unit_name,environment:n.environment_name,position:n.position_label,display_name:n.display_name,hostname:n.hostname,category:'computer',hardware_notification_id:n.id,hardware_changes:n.details.changes,hardware_observed_at:n.observed_at};
 const description=('Alteração de hardware detectada pelo agente.\n'+n.details.changes.map(c=>c.label+': '+printable(c.before)+' → '+printable(c.after)).join('\n')+(note?'\nObservação: '+note:'')).slice(0,2000);
 const statements=[db.prepare(`INSERT OR IGNORE INTO agent_hardware_reviews SELECT ?,?,?,?,?,?,?,?,?,? FROM agent_notifications n JOIN units u ON u.id=n.unit_id JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id WHERE n.id=? AND n.kind='hardware_change' AND (?='accepted' OR u.active=1)`)
  .bind(a.id,a.decision,requestId,a.operationId,user.id,actor,note,now,payload,JSON.stringify(context),a.id,a.decision),
  db.prepare("INSERT INTO audit(user_id,event,created_at) SELECT ?,?,? WHERE changes()=1").bind(user.id,'hardware_'+a.decision+':'+a.id,now)];
 if(requestId){
  statements.push(db.prepare(`INSERT INTO service_requests(id,number,unit_id,equipment_id,context_json,description,kind,source,requester,status,responsible,scheduled_date,created_at,created_by,updated_at,last_operation) SELECT ?,(SELECT COALESCE(MAX(number),0)+1 FROM service_requests),?,?,?,?,'Manutenção','Painel',?,'Aberta','','',?,?,?,? WHERE EXISTS(SELECT 1 FROM agent_hardware_reviews WHERE notification_id=? AND operation_id=? AND request_id=?)`).bind(requestId,n.unit_id,n.equipment_id,JSON.stringify(context),description,actor,now,user.id,now,a.operationId,a.id,a.operationId,requestId));
  const snapshot={description,kind:'Manutenção',source:'Painel',requester:actor,status:'Aberta',responsible:'',scheduled_date:'',version:1,context,unit_id:n.unit_id,equipment_id:n.equipment_id};
  statements.push(db.prepare(`INSERT OR IGNORE INTO service_request_events SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM service_requests WHERE id=? AND last_operation=?)`).bind(a.operationId,requestId,user.id,actor,payload,JSON.stringify(snapshot),note||'Encaminhada a partir do alerta de hardware.',now,requestId,a.operationId));
 }
 const result=await db.batch(statements),saved=await db.prepare('SELECT * FROM agent_hardware_reviews WHERE notification_id=?').bind(a.id).first();
 if(saved?.operation_id!==a.operationId)return fail('Outro administrador decidiu antes deste envio. Atualize para conferir.',409);
 return json({review:saved,replayed:!result[0].meta.changes});
}
