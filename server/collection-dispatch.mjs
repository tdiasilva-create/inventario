// D128/D129: explicit root actions share atomic creation + assignment + notification.
export const collectionPurpose='collection_agent_link';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export const collectionRoles="('root','admin','operador')";
export const collectionTaskCondition="json_extract(r.context_json,'$.purpose')='collection_agent_link'";
const validUnit="u.active=1 AND u.unit_type NOT IN ('Escola conveniada','Obra em andamento')";
const linkedSql=`SELECT 1 FROM inventory_equipment_all e JOIN agent_equipment_links l ON l.equipment_id=e.id AND l.ended_at IS NULL
 JOIN agent_devices d ON d.device_id=l.device_id AND d.state='linked'
 WHERE e.unit_id=u.id AND COALESCE(NULLIF(e.category,''),json_extract(e.data_json,'$.category'),'') IN ('','computer','desktop','notebook')`;
export const collectionTasksSql=`SELECT r.id,r.number,r.unit_id,r.status,a.user_id,
 COALESCE(NULLIF(t.display_name,''),t.username) AS name,t.active,COALESCE(cap.enabled,0) AS enabled,t.role
 FROM service_requests_active r LEFT JOIN dispatch_assignments a ON a.request_id=r.id AND a.ended_at IS NULL
 LEFT JOIN users t ON t.id=a.user_id LEFT JOIN dispatch_technicians cap ON cap.user_id=t.id
 WHERE r.unit_id IN (SELECT value FROM json_each(?)) AND r.status!='Concluída' AND ${collectionTaskCondition}
 ORDER BY r.created_at DESC,r.id,a.assigned_at,a.id`;
export async function readCollectionTasks(db,unitIds){
 const rows=(await db.prepare(collectionTasksSql).bind(JSON.stringify(unitIds)).all()).results,tasks=new Map();
 for(const row of rows){let task=tasks.get(row.id);if(!task){task={id:row.id,number:row.number,unitId:row.unit_id,status:row.status,technicians:[]};tasks.set(row.id,task);}
  if(row.user_id)task.technicians.push({id:row.user_id,name:row.name,available:!!row.active&&!!row.enabled&&['root','admin','operador'].includes(row.role)});
 }
 return [...tasks.values()];
}
async function existing(db,unitId){return (await readCollectionTasks(db,[unitId]))[0]||null;}
export async function collectionDispatchRoutes(request,url,user,env,{json,fail,body}){
 const route=url.pathname;if(!['/api/dispatch/collection-tasks','/api/dispatch/collection-options','/api/dispatch/collection-designate','/api/dispatch/unit-request-options','/api/dispatch/unit-request-create'].includes(route))return null;
 if(env.APP_KIND==='collector'||user.role!=='root')return fail('Somente root pode registrar e atribuir por este atalho.',403);
 const db=env.DB,general=route.includes('/unit-request-');
 const unitCondition=general?"u.active=1 AND u.unit_type!='Escola conveniada'":validUnit;
 const roleCondition=general?'':` AND t.role IN ${collectionRoles}`;
 if(route.endsWith('/collection-tasks')&&request.method==='GET'){
  let ids;try{ids=JSON.parse(url.searchParams.get('unitIds')||'null');}catch{return fail('Unidades inválidas.');}
  if(!Array.isArray(ids)||ids.length>200||!ids.every(uuid))return fail('Selecione até 200 unidades.');
  return json({tasks:ids.length?await readCollectionTasks(db,[...new Set(ids)]):[],serverTime:Date.now()});
 }
 if((route.endsWith('/collection-options')||route.endsWith('/unit-request-options'))&&request.method==='GET'){
  const id=url.searchParams.get('unitId');if(!uuid(id))return fail('Unidade inválida.');
  const unit=await db.prepare(`SELECT u.id,u.name${general?'':`,EXISTS(${linkedSql}) AS linked`} FROM units u WHERE u.id=? AND ${unitCondition}`).bind(id).first();
  if(!unit)return fail('Esta unidade não está disponível para '+(general?'uma nova demanda.':'coleta.'),422);
  const task=general?null:await existing(db,id);
  const technicians=(await db.prepare(`SELECT u.id,u.username,u.display_name FROM users u JOIN dispatch_technicians t ON t.user_id=u.id AND t.enabled=1 WHERE u.active=1 ${general?'':`AND u.role IN ${collectionRoles}`} ORDER BY u.display_name,u.username`).all()).results;
  return json({unit,task,technicians});
 }
 if(!['/api/dispatch/collection-designate','/api/dispatch/unit-request-create'].includes(route)||request.method!=='POST')return fail('Método não permitido.',405);
 const a=await body(request);
 if(!uuid(a.operationId)||!uuid(a.unitId)||!uuid(a.technicianId))return fail('Confira a unidade e o técnico responsável.');
 if(general?(typeof a.description!=='string'||!a.description.trim()||a.description.trim().length>2000||!['Manutenção','Reposição de insumo','Visita técnica','Outro'].includes(a.kind)):(typeof a.notes!=='string'||a.notes.trim().length>1000))return fail(general?'Informe o tipo e o que a unidade precisa (até 2.000 caracteres).':'Confira a orientação (até 1.000 caracteres).');
 const notes=general?'':a.notes.trim(),description=general?a.description.trim():'Realizar coleta de inventário e vincular agentes aos computadores.'+(notes?'\n\nOrientação: '+notes:''),kind=general?a.kind:'Visita técnica';
 const payload=JSON.stringify(general?{scope:'unit_request',unitId:a.unitId,technicianId:a.technicianId,description,kind}:{unitId:a.unitId,technicianId:a.technicianId,notes});
 const replay=async()=>{
  const receipt=await db.prepare('SELECT e.actor_id,e.payload_json,r.id,r.number,r.status,d.deleted_at FROM service_request_events e JOIN service_requests r ON r.id=e.request_id LEFT JOIN service_request_deletions d ON d.request_id=r.id WHERE e.operation_id=?').bind(a.operationId).first();
  if(!receipt)return null;
  if(receipt.actor_id!==user.id||receipt.payload_json!==payload)return fail('Esta operação já foi utilizada com outros dados.',409);
  if(receipt.deleted_at)return fail('Esta designação foi excluída. Consulte o histórico na Central.',409);
  return json({ok:true,replayed:true,request:{id:receipt.id,number:receipt.number,status:receipt.status}});
 };
 const previous=await replay();if(previous)return previous;
 const current=general?null:await existing(db,a.unitId);if(current)return json({error:'Já existe uma coleta designada para esta unidade.',existing:current},409);
 const attempt=crypto.randomUUID(),now=Date.now(),name=user.display_name||user.username;
 // The first write rechecks eligibility and absence INSIDE the D1 batch transaction.
 // A fresh server nonce gates every following effect; a lost ACK cannot duplicate it.
 const gate='EXISTS(SELECT 1 FROM service_requests WHERE id=? AND last_operation=?)';
 const gated=(sql,args=[])=>db.prepare(sql.replaceAll('$gate',gate)).bind(...args,a.operationId,attempt);
 const insert=db.prepare(`INSERT INTO service_requests(id,number,unit_id,equipment_id,context_json,description,kind,source,requester,status,responsible,scheduled_date,created_at,created_by,updated_at,last_operation)
 SELECT ?,COALESCE((SELECT MAX(number) FROM service_requests),0)+1,u.id,NULL,
 json_object('unit_name',u.name,'purpose',?),?,?,'Painel',?,'Aberta','','',?,?,?,?
 FROM units u WHERE u.id=? AND ${unitCondition} ${general?'':`AND NOT EXISTS(${linkedSql})`}
 AND EXISTS(SELECT 1 FROM users t JOIN dispatch_technicians c ON c.user_id=t.id AND c.enabled=1 WHERE t.id=? AND t.active=1${roleCondition})
 AND EXISTS(SELECT 1 FROM users actor WHERE actor.id=? AND actor.active=1 AND actor.role='root')
 ${general?'':`AND NOT EXISTS(SELECT 1 FROM service_requests_active r WHERE r.unit_id=u.id AND r.status!='Concluída' AND ${collectionTaskCondition})`}
 ON CONFLICT(id) DO NOTHING`).bind(a.operationId,general?'unit_request':collectionPurpose,description,kind,name,now,user.id,now,attempt,a.unitId,a.technicianId,user.id);
 const out=await db.batch([insert,
  gated(`INSERT INTO service_request_events SELECT ?,r.id,?,?,?,json_object('description',r.description,'kind',r.kind,'source',r.source,'requester',r.requester,'status',r.status,'responsible',r.responsible,'scheduled_date',r.scheduled_date,'version',r.version,'context',json(r.context_json),'unit_id',r.unit_id,'equipment_id',r.equipment_id),?,? FROM service_requests r WHERE r.id=? AND $gate`,[a.operationId,user.id,name,payload,general?'Demanda registrada e atribuída pela página da unidade.':'Coleta designada pelo Panorama.',now,a.operationId]),
  gated('INSERT INTO dispatch_assignments SELECT ?,?,?,?,?,NULL WHERE $gate',[crypto.randomUUID(),a.operationId,a.technicianId,now,user.id]),
  gated('INSERT INTO dispatch_events SELECT ?,?,?,?,?,?,? WHERE $gate',[crypto.randomUUID(),a.operationId,user.id,name,'assign',JSON.stringify({before:[],after:[a.technicianId],origin:general?'unit_page':'panorama_collection'}),now]),
  gated("INSERT INTO dispatch_notifications(user_id,request_id,message,created_at) SELECT ?,id,?||number||' · '||json_extract(context_json,'$.unit_name'),? FROM service_requests WHERE id=? AND $gate",[a.technicianId,general?'Nova demanda atribuída: #':'Nova coleta atribuída: demanda #',now,a.operationId]),
  gated('INSERT INTO audit(user_id,event,created_at) SELECT ?,?||?,? WHERE $gate',[user.id,general?'unit_request_assigned:':'collection_designated:',a.operationId,now])
 ]);
 if(!out[0].meta.changes){const repeated=await replay();if(repeated)return repeated;return json({error:general?'A unidade ou o técnico não está mais disponível. Atualize antes de tentar novamente.':'A unidade ou o técnico mudou, já há agente vinculado ou existe uma designação aberta. Atualize antes de tentar novamente.',existing:general?null:await existing(db,a.unitId)},409);}
 const row=await db.prepare('SELECT id,number,status FROM service_requests WHERE id=?').bind(a.operationId).first();
 return json({ok:true,request:row},201);
}
