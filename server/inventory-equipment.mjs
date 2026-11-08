import {presenceState,presenceThreshold} from './agentes/presence.mjs';
// D-069: consulta gerencial de fichas publicadas. Nenhuma escrita ou publicação.
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const categorySql=`CASE json_extract(e.published_json,'$.category') WHEN 'desktop' THEN 0 WHEN 'computer' THEN 0 WHEN 'notebook' THEN 1 WHEN 'tablet' THEN 2 WHEN 'projector' THEN 3 WHEN 'printer' THEN 4 WHEN 'tv' THEN 5 WHEN 'router' THEN 6 WHEN 'ap' THEN 6 WHEN 'switch' THEN 6 ELSE 7 END`;
const photoWhere=`p.unit_id=e.unit_id AND p.target_kind='equipment' AND p.target_id=e.id AND p.status='ready' AND pi.unit_id=p.unit_id AND pi.state='completed'`;
export async function equipmentRead(request,url,user,env,{json,fail,unit}){
 if(!user)return fail('Autenticação necessária.',401);
 if(!['root','admin','visualizador'].includes(user.role))return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Consulta disponível somente para leitura.',405);
 const s=url.searchParams,id=s.get('unitId'),offset=Number(s.get('offset')||0),column=s.get('category')??'',q=(s.get('q')||'').trim(),agent=s.get('agent')||'',photo=s.get('photo')||'';
 if(!uuid(id)||!Number.isSafeInteger(offset)||offset<0||!['','0','1','2','3','4','5','6','7'].includes(column)||q.length>120||!['','linked','unlinked'].includes(agent)||!['','yes','no'].includes(photo))return fail('Filtros de equipamentos inválidos.');
 const u=await unit(id);if(!u)return fail('Unidade indisponível.',403);
 // Os filtros usam a ficha publicada; search_text e data_json podem conter alterações parciais.
 const cte=`WITH records AS (SELECT e.id,e.unit_id,e.published_json,e.created_at,e.published_verified_at AS verified_at,e.published_updated_at AS updated_at,
 e.environment_id AS current_environment,e.position_label AS current_position,e.location_state AS current_location_state,e.updated_at AS current_updated_at,e.inspection_id AS current_inspection_id,
 ${categorySql} AS column_index,
 CASE WHEN json_extract(e.published_json,'$.mode')='Lote' THEN COALESCE(json_extract(e.published_json,'$.quantity'),1) ELSE 1 END AS quantity,
 COALESCE(NULLIF(json_extract(e.published_json,'$.environmentName'),''),(SELECT json_extract(ie.data_json,'$.name') FROM inspection_environments ie JOIN inspections vi ON vi.id=ie.inspection_id WHERE vi.unit_id=e.unit_id AND vi.state='completed' AND ie.environment_id=json_extract(e.published_json,'$.environment') ORDER BY vi.completed_at DESC,vi.id DESC LIMIT 1)) AS environment_name,
 ap.data_json AS presence_json,l.device_id,l.linked_at,l.ended_at,CASE WHEN l.link_id IS NOT NULL AND l.ended_at IS NULL THEN 1 ELSE 0 END AS agent_linked,
 CASE WHEN l.ended_at IS NULL THEN json_extract(ap.data_json,'$.last_live_contact_at') END AS last_contact_at,
 CASE WHEN l.ended_at IS NULL THEN COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname')) END AS hostname,
 (SELECT COUNT(*) FROM collection_photos p JOIN inspections pi ON pi.id=p.inspection_id WHERE ${photoWhere}) AS photo_count,
 (SELECT p.id FROM collection_photos p JOIN inspections pi ON pi.id=p.inspection_id WHERE ${photoWhere} ORDER BY p.created_at DESC,p.id DESC LIMIT 1) AS photo_id,
 EXISTS(SELECT 1 FROM missing_equipment_cases m JOIN inspections mi ON mi.id=m.inspection_id WHERE m.equipment_id=e.id AND m.unit_id=e.unit_id AND m.state='open' AND mi.state='completed') AS missing_open
 FROM inventory_equipment_all e
 LEFT JOIN agent_equipment_links l ON l.link_id=(SELECT ll.link_id FROM agent_equipment_links ll WHERE ll.equipment_id=e.id ORDER BY (ll.ended_at IS NULL) DESC,ll.linked_at DESC,ll.link_id DESC LIMIT 1)
 LEFT JOIN agent_presence ap ON ap.device_id=l.device_id
 LEFT JOIN agent_enrollments en ON en.device_id=l.device_id
 LEFT JOIN agent_current_snapshot cs ON cs.device_id=l.device_id
 LEFT JOIN agent_inventory_snapshots si ON si.inventory_id=cs.inventory_id
 WHERE e.unit_id=? AND e.published_json IS NOT NULL)`;
 const clauses=[],params=[id];
 if(column!==''){clauses.push('column_index=?');params.push(Number(column));}
 if(q){clauses.push(`instr(lower(COALESCE(hostname,'')||' '||id||' '||COALESCE(environment_name,'')||' '||COALESCE(json_extract(published_json,'$.position_label'),'')||' '||COALESCE(json_extract(published_json,'$.asset'),'')||' '||COALESCE(json_extract(published_json,'$.serial'),'')||' '||COALESCE(json_extract(published_json,'$.brand'),'')||' '||COALESCE(json_extract(published_json,'$.model'),'')||' '||COALESCE(json_extract(published_json,'$.customCategory'),'')),lower(?))>0`);params.push(q);}
 if(agent)clauses.push('agent_linked='+(agent==='linked'?1:0));
 if(photo)clauses.push('photo_count'+(photo==='yes'?'>0':'=0'));
 const where=clauses.length?' WHERE '+clauses.join(' AND '):'';
 const [countResult,pageResult]=await env.DB.batch([
  env.DB.prepare(cte+` SELECT COUNT(*) AS total,COALESCE(SUM(quantity),0) AS totalItems,(SELECT COUNT(*) FROM records) AS unitTotal,(SELECT COALESCE(SUM(quantity),0) FROM records) AS unitItems FROM records`+where).bind(...params),
  env.DB.prepare(cte+' SELECT * FROM records'+where+' ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?').bind(...params,offset)
 ]);
 const counts=countResult.results[0],items=pageResult.results.map(r=>{
  const data=JSON.parse(r.published_json),position=data.position_label??null,location=data.location_state??'declarada';
  const partial=(data.environment??null)!==(r.current_environment??null)||position!==(r.current_position??null)||location!==r.current_location_state;
  return {id:r.id,data,environment_name:r.environment_name,position_label:position,location_state:location,verified_at:r.verified_at,updated_at:r.updated_at,
   presence_state:r.agent_linked?presenceState({state:'linked'},JSON.parse(r.presence_json||'{}'),Date.now(),presenceThreshold(env)):null,agent_linked:!!r.agent_linked,agent_history:!!r.device_id,hostname:r.hostname,last_contact_at:r.last_contact_at,link_ended_at:r.ended_at,
   photo_count:r.photo_count,photo_id:r.photo_id,missing_open:!!r.missing_open,
   partial:partial?{environment:r.current_environment,position_label:r.current_position,location_state:r.current_location_state,updated_at:r.current_updated_at,inspection_id:r.current_inspection_id}:null};
 });
 return json({...counts,items,offset,pageSize:50,nextOffset:offset+items.length<counts.total?offset+50:null,source:'published',server_time:new Date().toISOString()});
}
