import {equipmentLinkStateSql} from './equipment-link-state.mjs';
import {inventoryScopeSql} from './unit-scope.mjs';
const normalize=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// SQLite lower() é ASCII; normaliza os acentos portugueses sem criar cópia privada do inventário.
const fold=sql=>[...'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ'].reduce((s,c)=>`replace(${s},'${c}','${normalize(c)}')`,`lower(${sql})`);
const field=(json,key)=>`COALESCE(json_extract(${json},'$.${key}'),'')`;
export async function panelSearch(request,url,user,env,{json,fail}){
 if(url.pathname!=='/api/inventory/search')return null;
 if(!user)return fail('Autenticação necessária.',401);
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Busca disponível somente no painel.',403);
 if(request.method!=='GET')return fail('Busca disponível somente para leitura.',405);
 const q=(url.searchParams.get('q')||'').trim(),unitOffset=Number(url.searchParams.get('unitOffset')||0),equipmentOffset=Number(url.searchParams.get('equipmentOffset')||0);
 if(q.length<2||q.length>120||[unitOffset,equipmentOffset].some(n=>!Number.isSafeInteger(n)||n<0))return fail('Digite de 2 a 120 caracteres e use uma página válida.');
 const term=normalize(q),digits=/^[\d\s.-]+$/.test(q)?q.replace(/\D/g,''):'';
 const unitWhere=`FROM units u WHERE u.active=1 AND ${inventoryScopeSql('u')} AND instr(${fold("u.name||' '||COALESCE(u.code,'')||' '||COALESCE(u.manager_name,'')")},?)>0`;
 const cte=`WITH records AS (SELECT e.id,e.unit_id,u.name AS unit_name,u.unit_type,
  e.data_json AS record_json,e.serial,e.asset,n.name AS display_name,
  COALESCE(room.name,NULLIF(json_extract(e.data_json,'$.environmentName'),''),'Ambiente não informado') AS environment_name,
  COALESCE(json_extract(e.data_json,'$.category'),e.category,'other') AS category,
  (e.published_json IS NULL OR e.published_json!=e.data_json) AS partial,
  ${equipmentLinkStateSql({json:'e.data_json',linked:'l.link_id IS NOT NULL',history:'EXISTS(SELECT 1 FROM agent_equipment_links h WHERE h.equipment_id=e.id AND h.ended_at IS NOT NULL)'})} AS link_state,
  COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname'),'') AS hostname,
  json_extract(si.sections_json,'$.system.data') AS system_json
 FROM inventory_equipment_all e JOIN units u ON u.id=e.unit_id
 LEFT JOIN equipment_names n ON n.equipment_id=e.id AND n.unit_id=e.unit_id
 LEFT JOIN environments room ON room.id=e.environment_id AND room.unit_id=e.unit_id
 LEFT JOIN agent_equipment_links l ON l.link_id=(SELECT ll.link_id FROM agent_equipment_links ll WHERE ll.equipment_id=e.id AND ll.ended_at IS NULL ORDER BY ll.linked_at DESC,ll.link_id DESC LIMIT 1)
 LEFT JOIN agent_current_snapshot cs ON cs.device_id=l.device_id
 LEFT JOIN agent_inventory_snapshots si ON si.inventory_id=cs.inventory_id
 LEFT JOIN agent_enrollments en ON en.device_id=l.device_id
 WHERE u.active=1 AND ${inventoryScopeSql('u')})`;
 const categoryName=`CASE category WHEN 'desktop' THEN 'computador desktop' WHEN 'computer' THEN 'computador' WHEN 'notebook' THEN 'computador notebook' WHEN 'printer' THEN 'impressora' WHEN 'projector' THEN 'projetor' WHEN 'router' THEN 'roteador' WHEN 'ap' THEN 'ponto de acesso' WHEN 'tv' THEN 'televisao' WHEN 'other' THEN 'outro equipamento' ELSE category END`;
 const searchable=["id","unit_name","environment_name","COALESCE(display_name,'')","hostname","COALESCE(serial,'')","COALESCE(asset,'')",categoryName,...['position_label','asset','serial','brand','model','customCategory','anydesk','rustdesk'].map(k=>field('record_json',k)),...['manufacturer','model','serial.value'].map(k=>field('system_json',k)),"CASE WHEN json_type(system_json,'$.serial')='text' THEN json_extract(system_json,'$.serial') ELSE '' END"].join("||' '||");
 const remote=k=>`replace(replace(replace(${field('record_json',k)},' ',''),'-',''),'.','')`;
 const where=` WHERE instr(${fold(searchable)},?)>0${digits.length>=2?` OR instr(${remote('anydesk')},?)>0 OR instr(${remote('rustdesk')},?)>0`:''}`;
 const args=[term,...(digits.length>=2?[digits,digits]:[])];
 const [uc,up,ec,ep]=await env.DB.batch([
  env.DB.prepare('SELECT COUNT(*) total '+unitWhere).bind(term),
  env.DB.prepare('SELECT u.id,u.name,u.code,u.unit_type,u.manager_name '+unitWhere+' ORDER BY u.name COLLATE NOCASE,u.id LIMIT 20 OFFSET ?').bind(term,unitOffset),
  env.DB.prepare(cte+' SELECT COUNT(*) total FROM records'+where).bind(...args),
  env.DB.prepare(cte+` SELECT id,unit_id,unit_name,category,display_name,hostname,environment_name,link_state,partial,
   ${field('record_json','position_label')} AS position_label,${field('record_json','brand')} AS brand,${field('record_json','model')} AS model,
   ${field('record_json','anydesk')} AS anydesk,${field('record_json','rustdesk')} AS rustdesk
   FROM records`+where+" ORDER BY unit_name COLLATE NOCASE,unit_id,COALESCE(NULLIF(display_name,''),NULLIF(hostname,''),NULLIF(json_extract(record_json,'$.position_label'),''),category) COLLATE NOCASE,id LIMIT 30 OFFSET ?").bind(...args,equipmentOffset)
 ]);
 const page=(count,rows,offset,size)=>({total:count.results[0].total,items:rows.results,offset,pageSize:size,nextOffset:offset+rows.results.length<count.results[0].total?offset+size:null});
 return json({q,units:page(uc,up,unitOffset,20),equipment:page(ec,ep,equipmentOffset,30),source:'current',server_time:new Date().toISOString()});
}
