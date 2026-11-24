import {digest} from './security.mjs';
import {routeCoordinates,previewRoadRoute} from './dispatch-road-routing.mjs';

const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const kinds=new Set(['Manutenção','Reposição de insumo','Visita técnica','Outro']);
const eligible="u.active=1 AND u.unit_type!='Escola conveniada'";
const technicians=`SELECT u.id,u.username,u.display_name FROM users u JOIN dispatch_technicians t ON t.user_id=u.id AND t.enabled=1 WHERE u.active=1 ORDER BY u.display_name,u.username`;
const queueSql=`SELECT r.id,r.number,r.unit_id,o.position,
 EXISTS(SELECT 1 FROM dispatch_assignments a WHERE a.request_id=r.id AND a.user_id=? AND a.ended_at IS NULL) AS assigned,
 EXISTS(SELECT 1 FROM dispatch_service_activity t WHERE t.request_id=r.id AND t.user_id=?) AS started
 FROM service_requests_active r JOIN dispatch_order o ON o.request_id=r.id WHERE r.status!='Concluída' ORDER BY o.position,r.number`;

// The queue is global (D105). Preserve other pending requests' relative order.
// A legacy out-of-order acceptance must precede the new block, without ending it.
export function insertMapRoute(queue,newIds){
 const anchor=queue.findIndex(r=>r.assigned),active=queue.find(r=>r.assigned&&r.started);
 const at=anchor<0?queue.length:anchor;
 const before=queue.slice(0,at).filter(r=>r.id!==active?.id).map(r=>r.id);
 const after=queue.slice(at).filter(r=>r.id!==active?.id).map(r=>r.id);
 return [...before,...(active?[active.id]:[]),...newIds,...after];
}

export async function mapRoutePlannerRoutes(request,url,user,env,{json,fail,body}){
 const path=url.pathname;if(!['/api/dispatch/map-route-options','/api/dispatch/map-route-create','/api/dispatch/map-route-preview'].includes(path))return null;
 if(user.role!=='root'||env.APP_KIND==='collector')return fail('Somente root pode criar rotas no mapa.',403);
 const db=env.DB;
 if(request.method==='GET'&&path.endsWith('-options')){
  const id=url.searchParams.get('technicianId');if(id&&!uuid(id))return fail('Técnico inválido.');
  const [people,meta,assigned]=await db.batch([db.prepare(technicians),db.prepare('SELECT revision FROM dispatch_meta WHERE id=1'),
   db.prepare(`SELECT r.id,r.number,EXISTS(SELECT 1 FROM dispatch_service_activity t WHERE t.request_id=r.id AND t.user_id=a.user_id) AS started FROM dispatch_assignments a JOIN service_requests_active r ON r.id=a.request_id WHERE a.user_id=? AND a.ended_at IS NULL AND r.status!='Concluída'`).bind(id||'')]);
  const own=assigned.results,active=own.find(r=>r.started);
  return json({technicians:people.results,revision:meta.results[0].revision,pending:own.length,active:active?{id:active.id,number:active.number}:null});
 }
 if(request.method!=='POST'||path.endsWith('-options'))return fail('Método não permitido.',405);
 const a=await body(request);if(!a||!Array.isArray(a.stops)||!a.stops.length||a.stops.length>99||!a.stops.every(s=>s&&uuid(s.unitId))||new Set(a.stops.map(s=>s.unitId)).size!==a.stops.length)return fail('Escolha de 1 a 99 unidades distintas.');
 const unitIds=JSON.stringify(a.stops.map(s=>s.unitId));
 if(path.endsWith('-preview')){
  const units=(await db.prepare(`SELECT u.id,u.latitude,u.longitude FROM units u WHERE u.id IN (SELECT value FROM json_each(?)) AND ${eligible}`).bind(unitIds).all()).results;
  const points=a.stops.map(s=>units.find(u=>u.id===s.unitId));
  if(points.length<2||points.some(u=>!u||!routeCoordinates(u.latitude,u.longitude)))return fail('A prévia exige pelo menos duas unidades ativas com coordenadas válidas.');
  return json(await previewRoadRoute(env,points.map(u=>[u.latitude,u.longitude])));
 }
 if(!uuid(a.operationId)||!uuid(a.technicianId)||!Number.isSafeInteger(a.revision)||a.revision<0||!a.stops.every(s=>typeof s.description==='string'&&s.description.trim().length>0&&s.description.trim().length<=2000&&kinds.has(s.kind)))return fail('Informe a atividade de cada unidade e escolha um técnico.');
 const payload={scope:'map-route',operationId:a.operationId,revision:a.revision,technicianId:a.technicianId,stops:a.stops.map(s=>({unitId:s.unitId,description:s.description.trim(),kind:s.kind}))};
 const hash=await digest(JSON.stringify(payload));
 const replay=async()=>{
  const receipt=await db.prepare('SELECT actor_id,payload_hash FROM dispatch_receipts WHERE operation_id=?').bind(a.operationId).first();
  if(!receipt)return null;
  if(receipt.actor_id!==user.id||receipt.payload_hash!==hash)return fail('Operação já utilizada com outros dados.',409);
  const event=await db.prepare("SELECT detail_json FROM dispatch_events WHERE id=? AND action='map_route'").bind(a.operationId).first();
  if(!event)return fail('Recibo indisponível. Consulte a Central de demandas antes de reenviar.',409);
  return json({ok:true,replayed:true,requests:JSON.parse(event.detail_json).requests});
 };
 const previous=await replay();if(previous)return previous;
 const [people,units,queue,maximum,meta]=await db.batch([
  db.prepare(technicians),db.prepare(`SELECT u.id,u.name,u.latitude,u.longitude FROM units u WHERE u.id IN (SELECT value FROM json_each(?)) AND ${eligible}`).bind(unitIds),
  db.prepare(queueSql).bind(a.technicianId,a.technicianId),db.prepare('SELECT COALESCE(MAX(number),0) AS n FROM service_requests'),db.prepare('SELECT revision FROM dispatch_meta WHERE id=1')
 ]);
 const byId=new Map(units.results.map(u=>[u.id,u]));
 if(meta.results[0].revision!==a.revision)return await replay()||fail('A fila mudou. Atualize os técnicos e confira a sequência antes de enviar.',409);
 if(!people.results.some(t=>t.id===a.technicianId)||payload.stops.some(s=>!byId.has(s.unitId)||!routeCoordinates(byId.get(s.unitId).latitude,byId.get(s.unitId).longitude)))return fail('Unidade ou técnico indisponível, ou coordenadas inválidas. Atualize antes de enviar.',409);
 if(queue.results.filter(r=>r.assigned).length+a.stops.length>99)return fail('O técnico ultrapassaria 99 demandas abertas, limite do cálculo de ruas. Reduza as atribuições antes de criar esta rota.',409);
 const now=Date.now(),attempt=crypto.randomUUID(),name=user.display_name||user.username;
 const records=payload.stops.map((s,i)=>({...s,id:crypto.randomUUID(),assignmentId:crypto.randomUUID(),eventId:crypto.randomUUID(),number:maximum.results[0].n+i+1,unitName:byId.get(s.unitId).name,stop:i+1}));
 const requests=records.map(r=>({id:r.id,number:r.number,unitId:r.unitId}));
 const order=insertMapRoute(queue.results,records.map(r=>r.id));
 const oldPositions=new Map(queue.results.map(r=>[r.id,r.position]));
 const changed=order.map((id,i)=>({id,position:(i+1)*1024})).filter(r=>oldPositions.get(r.id)!==r.position);
 const data=JSON.stringify(records),gate='EXISTS(SELECT 1 FROM dispatch_meta WHERE id=1 AND attempt=?)';
 const stmt=(sql,args=[])=>db.prepare(sql.replaceAll('$gate',gate)).bind(...args,attempt);
 // Recheck catalogue and permissions inside the SAME transaction; coordinates can
 // change without dispatch_meta. Exact catalogue snapshot prevents stale destinations.
 const unitSnapshot=JSON.stringify(units.results);
 const validSnapshot=`NOT EXISTS(SELECT 1 FROM json_each(?) j LEFT JOIN units u ON u.id=json_extract(j.value,'$.id') WHERE u.id IS NULL OR NOT (${eligible}) OR u.name IS NOT json_extract(j.value,'$.name') OR u.latitude IS NOT json_extract(j.value,'$.latitude') OR u.longitude IS NOT json_extract(j.value,'$.longitude'))`;
 const out=await db.batch([
  db.prepare(`UPDATE dispatch_meta SET revision=revision+1,attempt=? WHERE id=1 AND revision=? AND EXISTS(SELECT 1 FROM users WHERE id=? AND active=1 AND role='root') AND EXISTS(SELECT 1 FROM users u JOIN dispatch_technicians t ON t.user_id=u.id AND t.enabled=1 WHERE u.id=? AND u.active=1) AND ${validSnapshot}`).bind(attempt,a.revision,user.id,a.technicianId,unitSnapshot),
  stmt('INSERT INTO dispatch_receipts SELECT ?,?,?,? WHERE $gate',[a.operationId,user.id,hash,now]),
  stmt(`INSERT INTO service_requests(id,number,unit_id,equipment_id,context_json,description,kind,source,requester,status,responsible,scheduled_date,created_at,created_by,updated_at,last_operation)
   SELECT json_extract(value,'$.id'),json_extract(value,'$.number'),json_extract(value,'$.unitId'),NULL,
   json_object('unit_name',json_extract(value,'$.unitName'),'purpose','map_route','route_id',?,'route_stop',json_extract(value,'$.stop')),
   json_extract(value,'$.description'),json_extract(value,'$.kind'),'Painel',?,'Aberta','','',?,?,?,json_extract(value,'$.id') FROM json_each(?) WHERE $gate`,[a.operationId,name,now,user.id,now,data]),
  stmt(`INSERT INTO service_request_events SELECT r.id,r.id,?,?,json_object('routeId',?,'technicianId',?,'description',r.description,'kind',r.kind),json_object('description',r.description,'kind',r.kind,'source',r.source,'requester',r.requester,'status',r.status,'responsible',r.responsible,'scheduled_date',r.scheduled_date,'version',r.version,'context',json(r.context_json),'unit_id',r.unit_id,'equipment_id',r.equipment_id),'Demanda criada e atribuída pela rota do mapa.',? FROM service_requests r WHERE r.id IN (SELECT json_extract(value,'$.id') FROM json_each(?)) AND $gate`,[user.id,name,a.operationId,a.technicianId,now,data]),
  stmt(`INSERT INTO dispatch_assignments SELECT json_extract(value,'$.assignmentId'),json_extract(value,'$.id'),?,?,?,NULL FROM json_each(?) WHERE $gate`,[a.technicianId,now,user.id,data]),
  stmt(`INSERT INTO dispatch_events SELECT json_extract(value,'$.eventId'),json_extract(value,'$.id'),?,?,'assign',json_object('before',json('[]'),'after',json(?),'origin','map_route'),? FROM json_each(?) WHERE $gate`,[user.id,name,JSON.stringify([a.technicianId]),now,data]),
  stmt(`INSERT INTO dispatch_events SELECT ?,NULL,?,?,'map_route',?,? WHERE $gate`,[a.operationId,user.id,name,JSON.stringify({requests,technicianId:a.technicianId,orderBefore:queue.results.map(r=>r.id),orderAfter:order}),now]),
  stmt(`INSERT INTO dispatch_notifications(user_id,request_id,message,created_at) SELECT ?,json_extract(value,'$.id'),'Nova rota: demanda #'||json_extract(value,'$.number')||' · '||json_extract(value,'$.unitName'),? FROM json_each(?) WHERE $gate`,[a.technicianId,now,data]),
  stmt(`INSERT INTO dispatch_notifications(user_id,request_id,message,created_at) SELECT DISTINCT a.user_id,NULL,'A sequência de atendimentos foi atualizada pelo root.',? FROM dispatch_assignments a WHERE a.ended_at IS NULL AND a.request_id IN (SELECT value FROM json_each(?)) AND $gate`,[now,JSON.stringify(queue.results.filter(r=>r.assigned&&(r.started||r.id===queue.results.find(q=>q.assigned)?.id)).map(r=>r.id))]),
  stmt(`UPDATE dispatch_order SET position=(SELECT json_extract(value,'$.position') FROM json_each(?) WHERE json_extract(value,'$.id')=request_id) WHERE request_id IN (SELECT json_extract(value,'$.id') FROM json_each(?)) AND $gate`,[JSON.stringify(changed),JSON.stringify(changed)]),
  stmt('INSERT INTO audit(user_id,event,created_at) SELECT ?,?,? WHERE $gate',[user.id,'map_route_created:'+a.operationId,now])
 ]);
 if(!out[0].meta.changes)return await replay()||fail('A fila, a unidade ou o técnico mudou. Atualize e confira antes de tentar novamente.',409);
 return json({ok:true,requests},201);
}
