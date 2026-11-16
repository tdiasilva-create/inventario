const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);

export async function demandDeletionRoutes(request,url,user,env,{json,fail,body}){
 if(!['/api/operations/request-delete-preview','/api/operations/request-delete'].includes(url.pathname))return null;
 if(env.APP_KIND==='collector'||user.role!=='root')return fail('Somente root pode excluir demandas.',403);
 const db=env.DB,preview=url.pathname.endsWith('-preview');
 if(request.method!==(preview?'GET':'POST'))return fail('Método não permitido.',405);
 const a=preview?{id:url.searchParams.get('id')}:await body(request);
 if(!uuid(a.id))return fail('Demanda inválida.');
 let payload;
 if(!preview){
  if(!uuid(a.operationId)||!Number.isSafeInteger(a.version)||a.version<1||!Number.isSafeInteger(a.revision)||a.revision<0||a.confirm!==true||typeof a.reason!=='string'||!a.reason.trim()||a.reason.trim().length>1000)return fail('Confira a confirmação e informe o motivo da exclusão.');
  payload=JSON.stringify({id:a.id,version:a.version,revision:a.revision,reason:a.reason.trim(),confirm:true});
  const previous=await db.prepare('SELECT actor_id,payload_json FROM service_request_deletions WHERE operation_id=?').bind(a.operationId).first();
  if(previous)return previous.actor_id===user.id&&previous.payload_json===payload?json({ok:true,replayed:true}):fail('Operação já utilizada com outros dados.',409);
 }
 const r=await db.prepare('SELECT * FROM service_requests_active WHERE id=?').bind(a.id).first();
 if(!r)return fail('Demanda indisponível ou já excluída. Consulte as demandas excluídas.',404);
 if(preview){
  const [meta,assignments]=await db.batch([
   db.prepare('SELECT revision FROM dispatch_meta WHERE id=1'),
   db.prepare(`SELECT u.display_name,u.username,COALESCE(c.open_count,0) AS open_count,
    EXISTS(SELECT 1 FROM dispatch_service_activity x WHERE x.assignment_id=a.id) AS accepted,
    EXISTS(SELECT 1 FROM dispatch_tracking t WHERE t.user_id=a.user_id AND t.ended_at IS NULL) AS tracking
    FROM dispatch_assignments a JOIN users u ON u.id=a.user_id LEFT JOIN dispatch_open_counts c ON c.user_id=a.user_id
    WHERE a.request_id=? AND a.ended_at IS NULL`).bind(a.id)
  ]);
  return json({request:{...r,context:JSON.parse(r.context_json)},revision:meta.results[0].revision,
   technicians:assignments.results.map(t=>({name:t.display_name||t.username,accepted:!!t.accepted,tracking:!!t.tracking,remaining:Math.max(0,t.open_count-(r.status==='Concluída'?0:1))}))});
 }
 // One conditional INSERT plus triggers is atomic, including the history, queue and GPS.
 // A concurrent assignment/accept/reorder changes revision and invalidates the preview.
 const out=await db.prepare(`INSERT INTO service_request_deletions
  SELECT r.id,?,?,?,?,?,? FROM service_requests_active r
  WHERE r.id=? AND r.version=? AND EXISTS(SELECT 1 FROM dispatch_meta WHERE id=1 AND revision=?)
  ON CONFLICT DO NOTHING`).bind(a.operationId,user.id,user.display_name||user.username,a.reason.trim(),Date.now(),payload,a.id,a.version,a.revision).run();
 if(!out.meta.changes){
  const previous=await db.prepare('SELECT actor_id,payload_json FROM service_request_deletions WHERE operation_id=?').bind(a.operationId).first();
  if(previous?.actor_id===user.id&&previous.payload_json===payload)return json({ok:true,replayed:true});
  return fail('A demanda ou o roteiro mudou. Reabra a prévia e confira antes de excluir.',409);
 }
 return json({ok:true});
}
