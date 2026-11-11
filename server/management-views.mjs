import {computerWhereSql,computerJoins,computerColumns,computerItem,presenceGroup} from './service-desk.mjs';
import {linkFilterValues} from './equipment-link-state.mjs';
import {collectionCTE,hardwarePendingFrom} from './pending-indicators.mjs';
import {inventoryScopeSql,collectionScopeSql} from './unit-scope.mjs';
import {presenceThreshold} from './agentes/presence.mjs';
import {providerReport} from './provider-report.mjs';
const uuid=v=>/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export async function managementViews(request,url,user,env,{json,fail}){
 const path=url.pathname;if(!['/api/inventory/computer-report','/api/inventory/work-plan','/api/inventory/provider-report'].includes(path))return null;
 if(!user)return fail('Autenticação necessária.',401);
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Consulta disponível somente no painel.',403);
 if(request.method!=='GET')return fail('Consulta somente para leitura.',405);
 if(path.endsWith('/provider-report')){
  if([...url.searchParams].length)return fail('Este relatório abrange toda a rede, sem filtros.');
  return json(await providerReport(env.DB,env));
 }
 const s=url.searchParams,offset=Number(s.get('offset')||0),unitId=s.get('unitId')||'',q=(s.get('q')||'').trim(),db=env.DB;
 if(!Number.isSafeInteger(offset)||offset<0||q.length>120||unitId&&!uuid(unitId))return fail('Filtros inválidos.');
 if(path.endsWith('/computer-report')){
  const room=s.get('environmentId')||'',presence=s.get('presence')||'',agent=s.get('agent')||'',publication=s.get('publication')||'',active=s.get('active')||'all',all=s.get('all')||'0';
  if(room&&(!unitId||!uuid(room))||!['','online','lost','unlinked','other'].includes(presence)||!linkFilterValues.includes(agent)||!['','published','partial'].includes(publication)||!['all','1','0'].includes(active)||!['0','1'].includes(all))return fail('Filtros inválidos.');
  const filters=[computerWhereSql,inventoryScopeSql('u')],args=[];
  if(unitId){filters.push('u.id=?');args.push(unitId);}if(room){filters.push('e.environment_id=?');args.push(room);}if(active!=='all'){filters.push('u.active=?');args.push(Number(active));}
  const outer=[];if(q){outer.push("instr(lower(COALESCE(display_name,'')||' '||COALESCE(hostname,'')||' '||COALESCE(position_label,'')||' '||environment_name||' '||unit_name||' '||id),lower(?))>0");args.push(q);}
  if(agent==='unlinked')outer.push('device_id IS NULL');else if(agent){outer.push('link_state=?');args.push(agent);}if(publication)outer.push('partial='+(publication==='partial'?1:0));
  const query=`WITH records AS (SELECT ${computerColumns},u.name AS unit_name,u.active AS unit_active,
   CASE WHEN json_extract(e.data_json,'$.mode')='Lote' THEN json_extract(e.data_json,'$.quantity') ELSE 1 END AS registered_quantity,
   (json_extract(e.data_json,'$.mode')='Lote') AS is_batch
   ${computerJoins} JOIN units u ON u.id=e.unit_id WHERE ${filters.join(' AND ')}) SELECT * FROM records${outer.length?' WHERE '+outer.join(' AND '):''} ORDER BY unit_name COLLATE NOCASE,unit_id,environment_name COLLATE NOCASE,environment_id,position_label,id`;
  const [rows,units,rooms]=await db.batch([
   db.prepare(query).bind(...args),
   db.prepare(`SELECT id,name,active FROM units u WHERE ${inventoryScopeSql('u')} ORDER BY name COLLATE NOCASE,id`),
   db.prepare('SELECT id,name FROM environments WHERE unit_id=? ORDER BY name COLLATE NOCASE,id').bind(unitId)
  ]);
  const now=Date.now(),records=rows.results.map(r=>computerItem(r,env,now)).filter(r=>!presence||presenceGroup(r.presence_state)===presence);
  const totals={records:records.length,online:0,lost:0,unlinked:0,other:0,partial:0};for(const r of records){totals[presenceGroup(r.presence_state)]++;if(r.partial)totals.partial++;}
  const items=all==='1'?records:records.slice(offset,offset+60);
  return json({items,total:records.length,totals,offset:all==='1'?0:offset,pageSize:60,nextOffset:all==='1'||offset+items.length>=records.length?null:offset+60,complete:all==='1',units:units.results,environments:rooms.results,server_time:new Date(now).toISOString(),threshold_seconds:presenceThreshold(env)});
 }
 const kind=s.get('kind')||'';if(!['','collection','demands','hardware'].includes(kind))return fail('Filtro de providências inválido.');
 // Inclui solicitações antigas de unidade removida/inativa; não as oculta da fila.
 const cte=collectionCTE+`, demands AS (SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id),
 hardware AS (SELECT n.unit_id,COUNT(*) AS total ${hardwarePendingFrom} GROUP BY n.unit_id),
 keys AS (SELECT unit_id FROM pending UNION SELECT unit_id FROM demands UNION SELECT unit_id FROM hardware),
 work AS (SELECT k.unit_id,COALESCE(u.name,(SELECT json_extract(sr.context_json,'$.unit_name') FROM service_requests sr WHERE sr.unit_id=k.unit_id ORDER BY sr.created_at DESC,sr.id LIMIT 1),'Unidade removida') AS name,
 u.code,u.active,(u.id IS NULL) AS removed,p.inspection_id,p.updated_at AS collection_updated_at,
 COALESCE(p.state,CASE WHEN u.active=1 AND ${collectionScopeSql('u')} THEN 'none' ELSE 'unavailable' END) AS collection_state,
 (p.unit_id IS NOT NULL) AS collection_pending,COALESCE(d.total,0) AS demands,COALESCE(h.total,0) AS hardware
 FROM keys k LEFT JOIN units u ON u.id=k.unit_id LEFT JOIN pending p ON p.unit_id=k.unit_id LEFT JOIN demands d ON d.unit_id=k.unit_id LEFT JOIN hardware h ON h.unit_id=k.unit_id)`;
 const conditions=[],args=[];if(unitId){conditions.push('unit_id=?');args.push(unitId);}if(q){conditions.push("instr(lower(name||' '||COALESCE(code,'')),lower(?))>0");args.push(q);}if(kind)conditions.push(({collection:'collection_pending',demands:'demands',hardware:'hardware'})[kind]+'>0');
 const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
 const [page,total]=await db.batch([db.prepare(cte+' SELECT * FROM work'+where+' ORDER BY name COLLATE NOCASE,unit_id LIMIT 50 OFFSET ?').bind(...args,offset),db.prepare(cte+' SELECT COUNT(*) AS units,COALESCE(SUM(collection_pending),0) AS collections,COALESCE(SUM(demands),0) AS demands,COALESCE(SUM(hardware),0) AS hardware FROM work'+where).bind(...args)]);
 const totals=total.results[0];return json({items:page.results,total:totals.units,totals,offset,pageSize:50,nextOffset:offset+page.results.length<totals.units?offset+50:null,server_time:new Date().toISOString()});
}
