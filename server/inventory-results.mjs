import {questionnaireVersion,problemSummary} from '../web/collector-v2-schema.js';
const parse=v=>JSON.parse(v||'{}');
export const latestPublished=`SELECT i.id FROM inspections i WHERE i.state='completed' AND i.id=(SELECT j.id FROM inspections j WHERE j.unit_id=i.unit_id AND j.state='completed' ORDER BY j.completed_at DESC,j.id DESC LIMIT 1)`;
const blocks=[['C','occurrences','Internet'],['D','occurrences','Rede/Wi-Fi'],['E','occurrences','Energia'],['H','needs','Necessidade de equipamento'],['H','improvements','Demanda geral']];
export function sectionFindings(rows){
 const items=[];
 for(const r of rows.filter(r=>[questionnaireVersion,'coleta-3.0'].includes(r.questionnaire_version))){
  const data=parse(r.data_json),add=(key,kind,item,index)=>items.push({id:r.inspection_id+':'+r.section+':'+key+':'+(item.id||index),unit_id:r.unit_id,unit_name:r.unit_name,kind,description:item.description,quantity:item.quantity??null,priority:item.priority||null,impact:item.impact||null,location:null,environment_ids:[item.environment].filter(Boolean),target_id:item.id||null,inspection_id:r.inspection_id});
  if(['C','D'].includes(r.section))problemSummary({[r.section]:data}).forEach((p,index)=>add('summary',p.source.startsWith('Wi-Fi')?'Rede/Wi-Fi':'Internet',{...p,description:p.source+' · '+p.description},index));
  if(r.section==='H')for(const [index,item]of(data.occurrences||[]).entries())add('occurrences',item.type==='Energia que afeta TI'?'Energia':item.type==='Internet'?'Internet':item.type==='Wi-Fi'?'Rede/Wi-Fi':'Demanda geral',item,index);
 }
 for(const r of rows){const data=parse(r.data_json);for(const [group,key,kind]of blocks){if(r.section!==group)continue;for(const [index,item]of (Array.isArray(data[key])?data[key]:[]).entries())items.push({id:r.inspection_id+':'+group+':'+key+':'+(item.id||index),unit_id:r.unit_id,unit_name:r.unit_name,kind,description:item.description||item.justification||item.type||'Sem descrição informada',quantity:item.quantity??null,priority:item.priority||null,impact:item.impact||null,location:item.environmentDescription||item.environmentsDescription||null,environment_ids:item.environments||[item.environment].filter(Boolean),target_id:item.id||null,inspection_id:r.inspection_id});}}
 return items;
}
export async function inventoryResults(request,url,user,env,{json,fail}){
 if(!['/api/inventory/results','/api/inventory/findings'].includes(url.pathname))return null;
 if(user.role==='operador')return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Consulta disponível somente para leitura.',405);
 const db=env.DB,unitId=url.searchParams.get('unitId')||'';
 const sections=(await db.prepare(`SELECT s.*,i.unit_id,i.questionnaire_version,u.name AS unit_name FROM inspection_sections s JOIN inspections i ON i.id=s.inspection_id JOIN units u ON u.id=i.unit_id WHERE u.active=1 AND i.id IN (${latestPublished}) ${unitId?'AND u.id=?':''}`).bind(...(unitId?[unitId]:[])).all()).results;
 const derived=sectionFindings(sections);
 const visits=(await db.prepare(`SELECT v.*,i.unit_id,u.name AS unit_name FROM visit_answers v JOIN inspections i ON i.id=v.inspection_id JOIN units u ON u.id=i.unit_id WHERE u.active=1 AND i.id IN (${latestPublished}) ${unitId?'AND u.id=?':''}`).bind(...(unitId?[unitId]:[])).all()).results;
 for(const row of visits){const a=parse(row.data_json);for(const [key,kind]of [['problems','Demanda geral'],['needs','Necessidade de equipamento']])for(const [index,item]of (a[key]||[]).entries())derived.push({id:row.inspection_id+':'+key+':'+(item.id||index),unit_id:row.unit_id,unit_name:row.unit_name,inspection_id:row.inspection_id,kind:item.area||kind,description:item.description||item.type,quantity:item.quantity??null,priority:item.priority||null,impact:null,location:item.location||'',environment_ids:[],target_id:item.id||null});}
 const equipmentBase=`FROM inventory_equipment_all e JOIN units u ON u.id=e.unit_id WHERE u.active=1 AND e.published_json IS NOT NULL ${unitId?'AND u.id=?':''}`;
 const args=unitId?[unitId]:[];
 const problemCondition=`AND (trim(COALESCE(json_extract(e.published_json,'$.problems'),''))<>'' OR json_extract(e.published_json,'$.operation') IN ('Funciona parcialmente','Não funciona'))`;
 if(url.pathname==='/api/inventory/results'){
  const equipment=(await db.prepare(`SELECT e.unit_id,json_extract(e.published_json,'$.category') AS category,json_extract(e.published_json,'$.operation') AS operation,json_extract(e.published_json,'$.use') AS use,json_extract(e.published_json,'$.brand') AS brand,json_extract(e.published_json,'$.purpose') AS purpose,COUNT(*) AS records,SUM(CAST(COALESCE(json_extract(e.published_json,'$.quantity'),1) AS INTEGER)) AS items ${equipmentBase} GROUP BY e.unit_id,category,operation,use,brand,purpose`).bind(...args).all()).results;
  const problemCounts=(await db.prepare(`SELECT e.unit_id,json_extract(e.published_json,'$.priority') AS priority,COUNT(*) AS records ${equipmentBase} ${problemCondition} GROUP BY e.unit_id,priority`).bind(...args).all()).results;
  const summary={infrastructure:derived.filter(x=>!['Necessidade de equipamento','Demanda geral'].includes(x.kind)).length,needs:derived.filter(x=>x.kind==='Necessidade de equipamento').length,general:derived.filter(x=>x.kind==='Demanda geral').length,equipment:problemCounts.reduce((s,x)=>s+x.records,0)};
  const priorities={};for(const x of [...derived,...problemCounts])if(x.priority)priorities[x.priority]=(priorities[x.priority]||0)+(x.records||1);
  return json({equipment,summary,priorities,units:visits.map(r=>({unit_id:r.unit_id,administrative:parse(r.data_json).administrative,laboratory:parse(r.data_json).laboratory,printers:parse(r.data_json).printers})),notice:'Ocorrências, necessidades e bens com problema são naturezas distintas; não representam automaticamente pendências abertas.'});
 }
 const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)return fail('Página inválida.');
 const kind=url.searchParams.get('kind')||'';const sectionItems=derived.filter(x=>!kind||x.kind===kind);
 let items=sectionItems.slice(offset,offset+50),equipmentOffset=Math.max(0,offset-sectionItems.length);
 let equipmentCount=0;
 if(!kind||kind==='Equipamento com problema'){
  equipmentCount=(await db.prepare(`SELECT COUNT(*) AS n ${equipmentBase} ${problemCondition}`).bind(...args).first()).n;
  if(items.length<50){const rows=(await db.prepare(`SELECT e.id,e.unit_id,u.name AS unit_name,e.published_json,e.inspection_id ${equipmentBase} ${problemCondition} ORDER BY e.unit_id,e.id LIMIT ? OFFSET ?`).bind(...args,50-items.length,equipmentOffset).all()).results;
   items.push(...rows.map(r=>{const d=parse(r.published_json);return {id:'equipment:'+r.id,unit_id:r.unit_id,unit_name:r.unit_name,kind:'Equipamento com problema',description:d.problems||d.operation,category:d.category,brand:d.brand,operation:d.operation,asset:d.asset,quantity:d.mode==='Lote'?d.quantity:1,priority:d.priority||null,environment_ids:[d.environment],target_id:r.id,inspection_id:r.inspection_id};}));}
 }
 const environments=(await db.prepare('SELECT e.id,e.name FROM environments e JOIN units u ON u.id=e.unit_id WHERE u.active=1'+(unitId?' AND u.id=?':'')).bind(...args).all()).results;
 const photos=(await db.prepare(`SELECT p.id,p.target_id FROM collection_photos p JOIN inspections i ON i.id=p.inspection_id JOIN units u ON u.id=p.unit_id WHERE p.status='ready' AND i.state='completed' AND u.active=1 ${unitId?'AND u.id=?':''}`).bind(...args).all()).results;
 const total=sectionItems.length+equipmentCount;
 return json({items:items.map(item=>({...item,location:item.location||item.environment_ids.map(id=>environments.find(e=>e.id===id)?.name||'Local não identificado').join(', '),photos:photos.filter(p=>p.target_id===item.target_id).map(p=>p.id)})),total,nextOffset:offset+items.length<total?offset+items.length:null});
}
