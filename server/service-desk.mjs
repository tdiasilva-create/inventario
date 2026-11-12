import {presenceState,presenceThreshold} from './agentes/presence.mjs';
import {equipmentLinkStateSql,linkFilterValues} from './equipment-link-state.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const states=['Aberta','Em atendimento','Aguardando material','Visita agendada','Concluída'];
const kinds=['Manutenção','Reposição de insumo','Visita técnica','Outro'];
const sources=['Telefone','Presencial','Painel','Outro'];
const computerWhere="COALESCE(NULLIF(e.category,''),json_extract(e.data_json,'$.category'),'') IN ('','computer','desktop','notebook')";
const joins=`FROM inventory_equipment_all e
 LEFT JOIN equipment_names n ON n.equipment_id=e.id AND n.unit_id=e.unit_id
 LEFT JOIN environments room ON room.id=e.environment_id AND room.unit_id=e.unit_id
 LEFT JOIN agent_equipment_links l ON l.equipment_id=e.id AND l.ended_at IS NULL
 LEFT JOIN agent_devices d ON d.device_id=l.device_id
 LEFT JOIN agent_presence p ON p.device_id=l.device_id
 LEFT JOIN agent_current_snapshot cs ON cs.device_id=l.device_id
 LEFT JOIN agent_inventory_snapshots si ON si.inventory_id=cs.inventory_id
 LEFT JOIN agent_enrollments en ON en.device_id=l.device_id`;
const columns=`e.id,e.unit_id,e.environment_id,e.position_label,e.category,n.name AS display_name,(e.published_json IS NULL OR e.published_json!=e.data_json) AS partial,
 ${equipmentLinkStateSql({json:'e.data_json',linked:'l.link_id IS NOT NULL',history:'EXISTS(SELECT 1 FROM agent_equipment_links history WHERE history.equipment_id=e.id AND history.ended_at IS NOT NULL)'})} AS link_state,
 COALESCE(room.name,json_extract(e.data_json,'$.environmentName'),'Ambiente não informado') AS environment_name,
 COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname')) AS hostname,
 l.device_id,d.state AS device_state,p.data_json AS presence_json,
 (SELECT COUNT(*) FROM service_requests sr WHERE sr.equipment_id=e.id AND sr.status!='Concluída') AS demands`;
function item(row,env,now=Date.now()){const p=JSON.parse(row.presence_json||'{}');const {presence_json,device_state,...rest}=row;return {...rest,partial:!!row.partial,presence_state:row.device_id?presenceState({state:device_state},p,now,presenceThreshold(env)):'unlinked',last_contact_at:p.last_live_contact_at||null};}
export const presenceGroup=st=>['communicating','communicating_with_failure'].includes(st)?'online':st==='no_recent_communication'?'lost':st==='unlinked'?'unlinked':'other';
// An active link is unique by equipment (0014); no sorted correlated subquery.
// The ribbon needs presence only, never snapshots, room names or enrollments.
export const fleetPresenceSql=`SELECT e.unit_id,l.device_id,d.state,p.data_json AS presence_json
 FROM inventory_equipment_all e
 LEFT JOIN agent_equipment_links l ON l.equipment_id=e.id AND l.ended_at IS NULL
 LEFT JOIN agent_devices d ON d.device_id=l.device_id
 LEFT JOIN agent_presence p ON p.device_id=l.device_id
 WHERE ${computerWhere}`;
export const fleetCatalogueSql="SELECT u.id,u.name,u.unit_type,u.active,c.value AS computer_declaration,c.version AS context_version,EXISTS(SELECT 1 FROM inspections i WHERE i.unit_id=u.id AND i.state='completed') AS collected FROM units u LEFT JOIN computer_context c ON c.target_id=u.id AND c.kind='unit' WHERE u.unit_type!='Escola conveniada' ORDER BY u.name COLLATE NOCASE,u.id";
export const networkPresenceSql=`SELECT e.id,e.unit_id,l.device_id,d.state AS device_state,p.data_json AS presence_json,
 COALESCE(room.name,json_extract(e.data_json,'$.environmentName'),'Ambiente não informado') AS environment_name,
 e.position_label,u.name AS unit_name
 FROM inventory_equipment_all e
 JOIN units u ON u.id=e.unit_id
 LEFT JOIN environments room ON room.id=e.environment_id AND room.unit_id=e.unit_id
 LEFT JOIN agent_equipment_links l ON l.equipment_id=e.id AND l.ended_at IS NULL
 LEFT JOIN agent_devices d ON d.device_id=l.device_id
 LEFT JOIN agent_presence p ON p.device_id=l.device_id
 WHERE ${computerWhere} AND u.unit_type!='Escola conveniada'
 ORDER BY u.name COLLATE NOCASE,environment_name,e.position_label,e.id`;
export {computerWhere as computerWhereSql,joins as computerJoins,columns as computerColumns,item as computerItem};
function text(value,max=200){return typeof value==='string'&&value.trim().length<=max?value.trim():null;}
async function result(db,id){const r=await db.prepare('SELECT * FROM service_requests WHERE id=?').bind(id).first();return r?{...r,context:JSON.parse(r.context_json)}:null;}
function dateValid(v){return !v||/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export async function serviceDeskRoutes(request,url,user,env,{json,fail,body}){
 const path=url.pathname;
 if(!path.startsWith('/api/operations/'))return null;
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Consulta disponível apenas no painel aos perfis autorizados.',403);
 if(request.method==='POST'&&!['root','admin'].includes(user.role))return fail('Somente root e admin gerenciam demandas e classificação.',403);
 const db=env.DB,s=url.searchParams,unitId=s.get('unitId')||'',offset=Number(s.get('offset')||0),q=(s.get('q')||'').trim();
 if(!Number.isSafeInteger(offset)||offset<0||q.length>120||unitId&&!uuid(unitId))return fail('Filtros inválidos.');
 if(path==='/api/operations/queue-summary'&&request.method==='GET'){
  const summary=(await db.prepare('SELECT status,COUNT(*) AS total FROM service_requests GROUP BY status').all()).results;
  return json({pending:summary.filter(r=>r.status!=='Concluída').reduce((n,r)=>n+r.total,0),summary});
 }
 if(path==='/api/operations/units'&&request.method==='GET'){
  const units=(await db.prepare(fleetCatalogueSql).all()).results;
  // Compact presence records only: no technical snapshots, account lists or passwords in this response.
  const rows=(await db.prepare(fleetPresenceSql).all()).results;
  const counts=new Map();for(const r of rows){const c=counts.get(r.unit_id)||{computers:0,online:0,lost:0,unlinked:0,other:0};c.computers++;const st=r.device_id?presenceState({state:r.state},JSON.parse(r.presence_json||'{}'),Date.now(),presenceThreshold(env)):'unlinked';if(['communicating','communicating_with_failure'].includes(st))c.online++;else if(st==='no_recent_communication')c.lost++;else if(st==='unlinked')c.unlinked++;else c.other++;counts.set(r.unit_id,c);}
  const pending=(await db.prepare("SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id").all()).results;
  return json({units:units.map(u=>({...u,...(counts.get(u.id)||{computers:0,online:0,lost:0,unlinked:0,other:0}),demands:pending.find(p=>p.unit_id===u.id)?.total||0})),server_time:new Date().toISOString(),threshold_seconds:presenceThreshold(env)});
 }
 if(path==='/api/operations/computers'&&request.method==='GET'){
  // 10/11/2026: sem unitId, lista os computadores de TODA a rede num estado de comunicação (pulso e ribbon do painel).
  // Classify compact records with the SAME presence function as /units, then
  // hydrate ONLY this page. Do not load every technical snapshot/enrollment to
  // display 60 computers. Invalid dates and the exact timeout keep JS semantics.
  const presence=s.get('presence')||'';
  if(!unitId&&['online','lost','unlinked','other'].includes(presence)){
   const now=Date.now(),rows=(await db.prepare(networkPresenceSql).all()).results;
   const all=rows.map(r=>item(r,env,now)).filter(i=>presenceGroup(i.presence_state)===presence),selected=all.slice(offset,offset+60);
   const details=selected.length?(await db.prepare(`SELECT ${columns},u.name AS unit_name ${joins} JOIN units u ON u.id=e.unit_id WHERE e.id IN (${selected.map(()=>'?').join(',')}) AND ${computerWhere} AND u.unit_type!='Escola conveniada'`).bind(...selected.map(r=>r.id)).all()).results:[];
   const byId=new Map(details.map(r=>[r.id,item(r,env,now)])),page=selected.map(r=>{
    const detail=byId.get(r.id);if(!detail||detail.unit_id!==r.unit_id||detail.device_id!==r.device_id)return null;
    // A heartbeat between these reads must not put an online machine in a lost
    // page. Keep the presence snapshot used for filtering/counting this response.
    return {...detail,presence_state:r.presence_state,last_contact_at:r.last_contact_at};
   }).filter(Boolean);
   return json({unit:null,presence,items:page,total:all.length,offset,nextOffset:offset+selected.length<all.length?offset+60:null,environments:[],server_time:new Date().toISOString()});
  }
  if(!uuid(unitId))return fail('Selecione uma unidade.');
  const unit=await db.prepare("SELECT id,name FROM units WHERE id=? AND unit_type!='Escola conveniada'").bind(unitId).first();if(!unit)return fail('Unidade não encontrada.',404);
  const room=s.get('environmentId')||'',all=s.get('allEquipment')==='1',agent=s.get('agent')||'';if(room&&!uuid(room))return fail('Ambiente inválido.');if(!linkFilterValues.includes(agent))return fail('Filtro de vínculo inválido.');
  const filters=['e.unit_id=?'],args=[unitId];if(!all)filters.push(computerWhere);if(room){filters.push('e.environment_id=?');args.push(room);}
  const base=`SELECT ${columns} ${joins} WHERE ${filters.join(' AND ')}`;
  const conditions=[];if(q){conditions.push("instr(lower(COALESCE(display_name,'')||' '||COALESCE(hostname,'')||' '||COALESCE(position_label,'')||' '||environment_name||' '||id),lower(?))>0");args.push(q);}if(agent==='unlinked')conditions.push('device_id IS NULL');else if(agent){conditions.push('link_state=?');args.push(agent);}const search=conditions.length?' WHERE '+conditions.join(' AND '):'';
  const query='WITH records AS ('+base+') ';
  const [count,page,rooms]=await db.batch([db.prepare(query+'SELECT COUNT(*) AS total FROM records'+search).bind(...args),db.prepare(query+'SELECT * FROM records'+search+' ORDER BY environment_name,position_label,id LIMIT 60 OFFSET ?').bind(...args,offset),db.prepare(`SELECT r.id,r.name,c.value AS classification,c.version AS context_version,COUNT(e.id) AS computers FROM environments r LEFT JOIN computer_context c ON c.target_id=r.id AND c.kind='environment' LEFT JOIN inventory_equipment_all e ON e.environment_id=r.id AND e.unit_id=r.unit_id AND ${computerWhere} WHERE r.unit_id=? GROUP BY r.id ORDER BY r.name,r.id`).bind(unitId)]);
  return json({unit,items:page.results.map(r=>item(r,env)),total:count.results[0].total,offset,nextOffset:offset+page.results.length<count.results[0].total?offset+60:null,environments:rooms.results,server_time:new Date().toISOString()});
 }
 if(path==='/api/operations/context'&&request.method==='POST'){
  const a=await body(request);if(!uuid(a.targetId)||!uuid(a.unitId)||!['unit','environment'].includes(a.kind)||!Number.isSafeInteger(a.version)||a.version<0||!(a.kind==='unit'?['unknown','none']:['unknown','laboratory','other']).includes(a.value))return fail('Classificação inválida.');
  const exists=await db.prepare(a.kind==='unit'?"SELECT id FROM units WHERE id=? AND id=? AND unit_type!='Escola conveniada'":'SELECT id FROM environments WHERE id=? AND unit_id=?').bind(a.targetId,a.unitId).first();if(!exists)return fail('Unidade ou ambiente não encontrado.',404);
  const old=await db.prepare('SELECT * FROM computer_context WHERE target_id=?').bind(a.targetId).first();if((old?.version||0)!==a.version)return fail('Classificação alterada por outra pessoa. Atualize a página.',409);
  const now=Date.now(),operation=crypto.randomUUID(),after=JSON.stringify(a);
  // Atomic version check; a concurrent equipment insertion prevents a false zero declaration.
  const guard=a.kind==='unit'&&a.value==='none'?` AND NOT EXISTS(SELECT 1 FROM inventory_equipment_all e WHERE e.unit_id=? AND ${computerWhere})`:'';
  const args=[a.targetId,a.unitId,a.kind,a.value,a.version+1,now,user.id,...(guard?[a.unitId]:[]),a.version];
  const stmt=db.prepare(`INSERT INTO computer_context(target_id,unit_id,kind,value,version,updated_at,updated_by) SELECT ?,?,?,?,?,?,? WHERE 1=1${guard} ON CONFLICT(target_id) DO UPDATE SET value=excluded.value,version=excluded.version,updated_at=excluded.updated_at,updated_by=excluded.updated_by WHERE computer_context.version=?`).bind(...args);
  const out=await db.batch([stmt,db.prepare('INSERT INTO computer_context_events SELECT ?,?,?,?,?,? WHERE changes()=1').bind(operation,a.targetId,user.id,old?JSON.stringify(old):null,after,now)]);
  if(!out[0].meta.changes)return fail('Não foi possível confirmar: existem computadores cadastrados ou a classificação mudou. Atualize a página.',409);
  return json({ok:true,version:a.version+1});
 }
 if(path==='/api/operations/requests'&&request.method==='GET'){
  const id=s.get('id');if(id){if(!uuid(id))return fail('Demanda inválida.');const r=await result(db,id);if(!r)return fail('Demanda não encontrada.',404);const events=(await db.prepare('SELECT actor_name,snapshot_json,note,created_at FROM service_request_events WHERE request_id=? ORDER BY created_at DESC,rowid DESC').bind(id).all()).results.map(e=>({...e,snapshot:JSON.parse(e.snapshot_json)}));return json({request:r,events});}
  const status=s.get('status')||'pending';if(!['pending','all',...states].includes(status))return fail('Situação inválida.');
  const clauses=[],args=[];if(unitId){clauses.push('unit_id=?');args.push(unitId);}if(status==='pending')clauses.push("status!='Concluída'");else if(status!=='all'){clauses.push('status=?');args.push(status);}if(q){clauses.push("instr(lower(context_json||' '||description||' '||responsible||' '||number),lower(?))>0");args.push(q);}
  const where=clauses.length?' WHERE '+clauses.join(' AND '):'';
  const [count,page,summary]=await db.batch([db.prepare('SELECT COUNT(*) AS total FROM service_requests'+where).bind(...args),db.prepare('SELECT * FROM service_requests'+where+' ORDER BY updated_at DESC,id DESC LIMIT 50 OFFSET ?').bind(...args,offset),db.prepare('SELECT status,COUNT(*) AS total FROM service_requests'+(unitId?' WHERE unit_id=?':'')+' GROUP BY status').bind(...(unitId?[unitId]:[]))]);
  return json({items:page.results.map(r=>({...r,context:JSON.parse(r.context_json)})),total:count.results[0].total,summary:summary.results,offset,nextOffset:offset+page.results.length<count.results[0].total?offset+50:null});
 }
 if(path==='/api/operations/request-save'&&request.method==='POST'){
  const a=await body(request);if(!uuid(a.operationId)||!uuid(a.id)||!Number.isSafeInteger(a.version)||a.version<0)return fail('Identificação da operação inválida.');
  const payload=JSON.stringify(a),receipt=await db.prepare('SELECT * FROM service_request_events WHERE operation_id=?').bind(a.operationId).first();
  if(receipt){if(receipt.actor_id!==user.id||receipt.payload_json!==payload)return fail('Esta operação já foi usada com outros dados.',409);return json({request:await result(db,receipt.request_id),replayed:true});}
  const old=await result(db,a.id);if((old?.version||0)!==a.version)return fail('Esta demanda foi alterada. Reabra para conferir o histórico antes de salvar.',409);
  const description=text(a.description,2000),responsible=text(a.responsible),requester=text(a.requester),note=text(a.note,2000),scheduled=text(a.scheduledDate,10);
  // Saving an unchanged request is read-only, including callers outside this UI.
  if(old&&note===''&&description===old.description&&responsible===old.responsible&&requester===old.requester&&scheduled===old.scheduled_date&&a.status===old.status&&a.kind===old.kind&&a.source===old.source)return json({request:old,unchanged:true});
  if(!description||responsible===null||requester===null||note===null||scheduled===null||!dateValid(scheduled)||!states.includes(a.status)||!kinds.includes(a.kind)||!sources.includes(a.source)||a.status==='Concluída'&&!note)return fail('Confira a descrição, situação e dados informados. Para concluir, descreva o atendimento realizado.');
  let context,unitId=old?.unit_id,equipmentId=old?.equipment_id;
  if(!old){if(!uuid(a.unitId)||a.equipmentId&&!uuid(a.equipmentId))return fail('Selecione uma unidade e, se necessário, um equipamento.');const unit=await db.prepare("SELECT id,name FROM units WHERE id=? AND active=1 AND unit_type!='Escola conveniada'").bind(a.unitId).first();if(!unit)return fail('Unidade indisponível.',404);
   const eq=a.equipmentId?await db.prepare(`SELECT ${columns} ${joins} WHERE e.id=? AND e.unit_id=?`).bind(a.equipmentId,unit.id).first():null;if(a.equipmentId&&!eq)return fail('O equipamento não pertence à unidade selecionada.',422);
   unitId=unit.id;equipmentId=eq?.id||null;context={unit_name:unit.name,display_name:eq?.display_name||null,hostname:eq?.hostname||null,environment:eq?.environment_name||null,position:eq?.position_label||null,category:eq?.category||null};
  }else context=old.context;
  const now=Date.now(),snapshot={description,kind:a.kind,source:a.source,requester,status:a.status,responsible,scheduled_date:scheduled,version:a.version+1,context,unit_id:unitId,equipment_id:equipmentId};
  const stmt=old?db.prepare('UPDATE service_requests SET description=?,kind=?,source=?,requester=?,status=?,responsible=?,scheduled_date=?,version=version+1,updated_at=?,last_operation=? WHERE id=? AND version=?').bind(description,a.kind,a.source,requester,a.status,responsible,scheduled,now,a.operationId,a.id,a.version):db.prepare('INSERT INTO service_requests(id,number,unit_id,equipment_id,context_json,description,kind,source,requester,status,responsible,scheduled_date,created_at,created_by,updated_at,last_operation) SELECT ?,COALESCE(MAX(number),0)+1,?,?,?,?,?,?,?,?,?,?,?,?,?,? FROM service_requests WHERE 1=1 ON CONFLICT(id) DO NOTHING').bind(a.id,unitId,equipmentId,JSON.stringify(context),description,a.kind,a.source,requester,a.status,responsible,scheduled,now,user.id,now,a.operationId);
  // One D1 transaction: the event is emitted only by the winning write. Operation receipt survives response loss.
  const out=await db.batch([stmt,db.prepare('INSERT INTO service_request_events(operation_id,request_id,actor_id,actor_name,payload_json,snapshot_json,note,created_at) SELECT ?,?,?,?,?,?,?,? WHERE changes()=1').bind(a.operationId,a.id,user.id,user.display_name||user.username,payload,JSON.stringify(snapshot),note,now)]);
  if(!out[0].meta.changes)return fail('A demanda mudou durante o envio. Atualize e confira o histórico.',409);
  return json({request:await result(db,a.id)},old?200:201);
 }
 return fail('Operação não encontrada.',404);
}
