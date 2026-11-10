// D-088: prazo do incidente, independente da janela curta de presença D-070.
export const communicationLossSeconds=48*60*60;
const parse=s=>s?JSON.parse(s):{};
export async function communicationLog(request,url,user,env,{json,fail}){
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Consulta disponível somente no painel gerencial.',403);
 if(request.method!=='GET')return fail('Método não permitido.',405);
 const q=(url.searchParams.get('q')||'').trim(),state=url.searchParams.get('state')||'open',offset=Number(url.searchParams.get('offset')||0),now=Date.now(),pageSize=25;
 if(q.length>120||!['open','closed','all'].includes(state)||!Number.isSafeInteger(offset)||offset<0)return fail('Filtro inválido.',422);
 const joins=`FROM agent_notifications n JOIN units u ON u.id=n.unit_id
 JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id
 LEFT JOIN environments room ON room.id=e.environment_id AND room.unit_id=e.unit_id
 LEFT JOIN equipment_names nm ON nm.equipment_id=e.id AND nm.unit_id=e.unit_id
 LEFT JOIN agent_current_snapshot current ON current.device_id=n.device_id
 LEFT JOIN agent_inventory_snapshots snap ON snap.inventory_id=current.inventory_id AND snap.device_id=n.device_id`;
 const hostname="COALESCE(json_extract(n.details_json,'$.context.hostname'),json_extract(snap.sections_json,'$.system.data.hostname'))";
 const duration='COALESCE(n.resolved_at,?)-CAST(ROUND((julianday(n.observed_at)-2440587.5)*86400000) AS INTEGER)';
 // Incidentes antigos curtos permanecem intactos no banco, mas não se tornam avisos da regra nova.
 const where=`WHERE n.kind='communication_lost' AND (${duration})>?${state==='open'?' AND n.resolved_at IS NULL':state==='closed'?' AND n.resolved_at IS NOT NULL':''}${q?` AND (instr(lower(u.name),lower(?))>0 OR instr(lower(COALESCE(nm.name,'')||' '||COALESCE(${hostname},'')||' '||COALESCE(room.name,'')||' '||COALESCE(e.position_label,'')||' '||e.id||' '||COALESCE(json_extract(n.details_json,'$.context'),'')),lower(?))>0)`:''}`;
 const args=[now,communicationLossSeconds*1000,...(q?[q,q]:[])],db=env.DB;
 const [page,count,health]=await Promise.all([
  db.prepare(`SELECT n.*,u.name AS unit_name,COALESCE(room.name,json_extract(e.data_json,'$.environmentName')) AS environment_name,e.position_label,nm.name AS display_name,${hostname} AS hostname,(e.published_json IS NULL) AS partial ${joins} ${where} ORDER BY n.detected_at DESC,n.id DESC LIMIT ? OFFSET ?`).bind(...args,pageSize,offset).all(),
  db.prepare(`SELECT COUNT(*) AS total ${joins} ${where}`).bind(...args).first(),
  db.prepare('SELECT last_success_at FROM agent_monitor_health WHERE id=1').first()
 ]);
 const items=page.results.map(n=>{const details=parse(n.details_json),context=details.context;return {
  id:n.id,unit_id:n.unit_id,equipment_id:n.equipment_id,unit_name:context?.unit_name??n.unit_name,
  environment_name:context?.environment_name??n.environment_name,display_name:context?.display_name??n.display_name,
  hostname:context?.hostname??n.hostname,position_label:context?.position_label??n.position_label,
  context_source:context?'at_detection':'current',partial:!!n.partial,last_contact_at:n.observed_at,
  detected_at:n.detected_at,resolved_at:n.resolved_at,resolution:n.resolution,
  duration_seconds:Math.max(0,Math.floor(((n.resolved_at??now)-Date.parse(n.observed_at))/1000)),
  previous_policy:Number(details.threshold_seconds)<communicationLossSeconds
 };});
 return json({items,total:count.total,offset,pageSize,nextOffset:offset+items.length<count.total?offset+pageSize:null,threshold_seconds:communicationLossSeconds,monitor_last_success_at:health?.last_success_at??null,server_time:new Date(now).toISOString()});
}
