import {presenceState,presenceThreshold} from './agentes/presence.mjs';
import {equipmentLinkStateSql,linkFilterValues} from './equipment-link-state.mjs';
import {currentSectorSql} from './unit-equipment-map.mjs';
// D-069: consulta gerencial de fichas publicadas. Nenhuma escrita ou publicação.
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const categorySql=record=>`CASE json_extract(${record},'$.category') WHEN 'desktop' THEN 0 WHEN 'computer' THEN 0 WHEN 'notebook' THEN 1 WHEN 'tablet' THEN 2 WHEN 'projector' THEN 3 WHEN 'printer' THEN 4 WHEN 'tv' THEN 5 WHEN 'router' THEN 6 WHEN 'ap' THEN 6 WHEN 'switch' THEN 6 ELSE 7 END`;
export async function equipmentRead(request,url,user,env,{json,fail,unit}){
 if(!user)return fail('Autenticação necessária.',401);
 if(!['root','admin','visualizador'].includes(user.role))return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Consulta disponível somente para leitura.',405);
 const s=url.searchParams,id=s.get('unitId'),offset=Number(s.get('offset')||0),column=s.get('category')??'',q=(s.get('q')||'').trim(),agent=s.get('agent')||'',photo=s.get('photo')||'',environment=s.get('environmentId')||'';
 if(environment&&!uuid(environment)||!uuid(id)||!Number.isSafeInteger(offset)||offset<0||!['','0','1','2','3','4','5','6','7'].includes(column)||q.length>120||!linkFilterValues.includes(agent)||!['','yes','no'].includes(photo))return fail('Filtros de equipamentos inválidos.');
 const scope=s.get('scope')||'published';if(!['published','current'].includes(scope)||scope==='current'&&env.APP_KIND==='collector')return fail('Escopo de consulta inválido.',403);
 const sector=s.get('sectorId')||'';
 if(sector&&(scope!=='current'||(sector!=='unassigned'&&!uuid(sector))))return fail('Setor inválido para esta consulta.');
 const equipmentId=s.get('equipmentId')||'';
 if(equipmentId&&!uuid(equipmentId))return fail('Equipamento inválido.');
 const u=await unit(id);if(!u)return fail('Unidade indisponível.',403);
 // D-084: escopo atual explícito para busca global; a matriz mantém o padrão publicado.
 const current=scope==='current',record=current?'e.data_json':'e.published_json';
 const photoWhere=`p.unit_id=e.unit_id AND p.target_kind='equipment' AND p.target_id=e.id AND p.status='ready' AND pi.unit_id=p.unit_id AND ${current?"(pi.state IN ('open','paused') OR (pi.state='completed' AND e.published_json IS NOT NULL))":"pi.state='completed'"}`;
 const cte=`WITH records AS (SELECT e.id,e.unit_id,${record} AS published_json,(e.published_json IS NULL OR e.published_json!=e.data_json) AS record_partial,e.created_at,${current?'e.verified_at':'e.published_verified_at'} AS verified_at,${current?'e.updated_at':'e.published_updated_at'} AS updated_at,n.name AS display_name,
 e.environment_id AS current_environment,e.position_label AS current_position,e.location_state AS current_location_state,e.updated_at AS current_updated_at,e.inspection_id AS current_inspection_id,
 ${categorySql(record)} AS column_index,
 ${equipmentLinkStateSql({json:record,linked:'l.link_id IS NOT NULL AND l.ended_at IS NULL',history:'l.ended_at IS NOT NULL'})} AS link_state,
 CASE WHEN json_extract(${record},'$.mode')='Lote' THEN COALESCE(json_extract(${record},'$.quantity'),1) ELSE 1 END AS quantity,
 COALESCE((SELECT r.name FROM environments r WHERE r.id=json_extract(${record},'$.environment') AND r.unit_id=e.unit_id AND ${current?'1=1':'r.name_version>1'}),NULLIF(json_extract(${record},'$.environmentName'),''),(SELECT json_extract(ie.data_json,'$.name') FROM inspection_environments ie JOIN inspections vi ON vi.id=ie.inspection_id WHERE vi.unit_id=e.unit_id AND vi.state='completed' AND ie.environment_id=json_extract(${record},'$.environment') ORDER BY vi.completed_at DESC,vi.id DESC LIMIT 1)) AS environment_name,
 ap.data_json AS presence_json,l.device_id,l.linked_at,l.ended_at,CASE WHEN l.link_id IS NOT NULL AND l.ended_at IS NULL THEN 1 ELSE 0 END AS agent_linked,
 CASE WHEN l.ended_at IS NULL THEN json_extract(ap.data_json,'$.last_live_contact_at') END AS last_contact_at,
 CASE WHEN l.ended_at IS NULL THEN COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname')) END AS hostname,
 (SELECT COUNT(*) FROM collection_photos p JOIN inspections pi ON pi.id=p.inspection_id WHERE ${photoWhere}) AS photo_count,
 (SELECT p.id FROM collection_photos p JOIN inspections pi ON pi.id=p.inspection_id WHERE ${photoWhere} ORDER BY p.created_at DESC,p.id DESC LIMIT 1) AS photo_id,
 EXISTS(SELECT 1 FROM missing_equipment_cases m JOIN inspections mi ON mi.id=m.inspection_id WHERE m.equipment_id=e.id AND m.unit_id=e.unit_id AND m.state='open' AND mi.state='completed') AS missing_open
 FROM inventory_equipment_all e
 LEFT JOIN equipment_names n ON n.equipment_id=e.id AND n.unit_id=e.unit_id
 LEFT JOIN agent_equipment_links l ON l.link_id=(SELECT ll.link_id FROM agent_equipment_links ll WHERE ll.equipment_id=e.id ORDER BY (ll.ended_at IS NULL) DESC,ll.linked_at DESC,ll.link_id DESC LIMIT 1)
 LEFT JOIN agent_presence ap ON ap.device_id=l.device_id
 LEFT JOIN agent_enrollments en ON en.device_id=l.device_id
 LEFT JOIN agent_current_snapshot cs ON cs.device_id=l.device_id
 LEFT JOIN agent_inventory_snapshots si ON si.inventory_id=cs.inventory_id
 WHERE e.unit_id=? AND ${record} IS NOT NULL)`;
 const clauses=[],params=[id];
 if(equipmentId){clauses.push('id=?');params.push(equipmentId);}
 if(sector){clauses.push(`id IN (SELECT e.id FROM inventory_equipment_all e LEFT JOIN environments r ON ${currentSectorSql()} WHERE e.unit_id=? AND ${sector==='unassigned'?'r.id IS NULL':'r.id=?'})`);params.push(id,...(sector==='unassigned'?[]:[sector]));}
 if(environment){clauses.push("json_extract(published_json,'$.environment')=?");params.push(environment);}
 if(column!==''){clauses.push('column_index=?');params.push(Number(column));}
 if(q){clauses.push(`instr(lower(COALESCE(display_name,'')||' '||COALESCE(hostname,'')||' '||id||' '||COALESCE(environment_name,'')||' '||COALESCE(json_extract(published_json,'$.position_label'),'')||' '||COALESCE(json_extract(published_json,'$.asset'),'')||' '||COALESCE(json_extract(published_json,'$.serial'),'')||' '||COALESCE(json_extract(published_json,'$.brand'),'')||' '||COALESCE(json_extract(published_json,'$.model'),'')||' '||COALESCE(json_extract(published_json,'$.customCategory'),'')||' '||COALESCE(json_extract(published_json,'$.anydesk'),'')||' '||COALESCE(json_extract(published_json,'$.rustdesk'),'')),lower(?))>0`);params.push(q);}
 if(agent==='unlinked')clauses.push('agent_linked=0');
 else if(agent){clauses.push('link_state=?');params.push(agent);}
 if(photo)clauses.push('photo_count'+(photo==='yes'?'>0':'=0'));
 const where=clauses.length?' WHERE '+clauses.join(' AND '):'';
 const [countResult,pageResult]=await env.DB.batch([
  env.DB.prepare(cte+` SELECT COUNT(*) AS total,COALESCE(SUM(quantity),0) AS totalItems,(SELECT COUNT(*) FROM records) AS unitTotal,(SELECT COALESCE(SUM(quantity),0) FROM records) AS unitItems FROM records`+where).bind(...params),
  env.DB.prepare(cte+' SELECT * FROM records'+where+' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?').bind(...params,offset)
 ]);
 const counts=countResult.results[0],items=pageResult.results.map(r=>{
  const data=JSON.parse(r.published_json),position=data.position_label??null,location=data.location_state??'declarada';
  const partial=(data.environment??null)!==(r.current_environment??null)||position!==(r.current_position??null)||location!==r.current_location_state;
  return {id:r.id,data,record_partial:scope==='current'&&!!r.record_partial,link_state:r.link_state,display_name:r.display_name,environment_name:r.environment_name,position_label:position,location_state:location,verified_at:r.verified_at,updated_at:r.updated_at,
   presence_state:r.agent_linked?presenceState({state:'linked'},JSON.parse(r.presence_json||'{}'),Date.now(),presenceThreshold(env)):null,agent_linked:!!r.agent_linked,agent_history:!!r.device_id,hostname:r.hostname,last_contact_at:r.last_contact_at,link_ended_at:r.ended_at,
   photo_count:r.photo_count,photo_id:r.photo_id,missing_open:!!r.missing_open,
   network_test_capable:!!r.agent_linked&&JSON.parse(r.presence_json||'{}').network_test_protocol===1,
   partial:partial?{environment:r.current_environment,position_label:r.current_position,location_state:r.current_location_state,updated_at:r.current_updated_at,inspection_id:r.current_inspection_id}:null};
 });
 return json({...counts,items,offset,pageSize:50,nextOffset:offset+items.length<counts.total?offset+50:null,source:scope,server_time:new Date().toISOString()});
}
