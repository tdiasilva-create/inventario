import {topicNames,visitVersion} from '../web/visit-schema.js';
import {visitReview} from './visit-routes.mjs';
import {hideContact} from './collector.mjs';
import {inProgressPhotoRead} from './in-progress-photos.mjs';
const parse=v=>JSON.parse(v||'{}');
const visitStates=a=>({__visit:true,...Object.fromEntries(Object.entries(topicNames).map(([key,name])=>[name,a.completed?.includes(key)?'Concluído':'Em andamento']))});
const uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v);
function cursorParams(encoded){if(!encoded)return null;try{const v=JSON.parse(atob(encoded));return Array.isArray(v)&&Number.isSafeInteger(v[0])&&uuid(v[1])?v:false;}catch{return false;}}
export async function inProgressRead(request,url,user,env,{json,fail}){
 const photoResponse=await inProgressPhotoRead(request,url,user,env,{json,fail});if(photoResponse)return photoResponse;
 const path=url.pathname;if(!path.startsWith('/api/inventory/in-progress'))return null;
 if(!['root','admin','visualizador'].includes(user.role))return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Acompanhamento disponível somente para consulta.',405);
 const db=env.DB;
 if(path==='/api/inventory/in-progress'){
  const cursor=cursorParams(url.searchParams.get('cursor'));if(cursor===false)return fail('Página inválida.');
  const rows=(await db.prepare(`SELECT i.id,i.unit_id,i.created_at,i.updated_at,i.revision,i.questionnaire_version,(SELECT data_json FROM visit_answers WHERE inspection_id=i.id) AS visit_json,u.name AS unit_name,
   COALESCE(NULLIF(creator.display_name,''),creator.username,'Usuário indisponível') AS created_by_name,
   COALESCE(t.records,0) AS records,COALESCE(t.items,0) AS items,COALESCE(t.new_records,0) AS new_records,COALESCE(t.changed_records,0) AS changed_records,
   (SELECT json_group_object(s.section,s.state) FROM inspection_sections s WHERE s.inspection_id=i.id) AS states_json
   FROM inspections i JOIN units u ON u.id=i.unit_id LEFT JOIN users creator ON creator.id=i.created_by LEFT JOIN inspection_collection_totals t ON t.inspection_id=i.id
   WHERE i.state='open' AND u.active=1 ${cursor?'AND (i.created_at<? OR (i.created_at=? AND i.id<?))':''}
   ORDER BY i.created_at DESC,i.id DESC LIMIT 51`).bind(...(cursor?[cursor[0],cursor[0],cursor[1]]:[])).all()).results;
  const total=await db.prepare("SELECT COUNT(*) AS count FROM inspections i JOIN units u ON u.id=i.unit_id WHERE i.state='open' AND u.active=1").first();
  const page=rows.slice(0,50),last=page.at(-1);
  return json({items:page.map(r=>({...r,states:r.questionnaire_version===visitVersion?visitStates(parse(r.visit_json)):parse(r.states_json),visit_json:undefined,states_json:undefined})),total:total.count,nextCursor:rows.length>50?btoa(JSON.stringify([last.created_at,last.id])):null,serverTime:Date.now()});
 }
 const id=url.searchParams.get('id');if(!uuid(id))return fail('Vistoria inválida.');
 const inspection=await db.prepare("SELECT i.*,u.name AS unit_name,COALESCE(NULLIF(creator.display_name,''),creator.username,'Usuário indisponível') AS created_by_name FROM inspections i JOIN units u ON u.id=i.unit_id LEFT JOIN users creator ON creator.id=i.created_by WHERE i.id=? AND u.active=1").bind(id).first();
 if(!inspection)return fail('Vistoria indisponível.',404);
 if(path==='/api/inventory/in-progress-detail'){
  const rows=(await db.prepare("SELECT s.section,s.state,s.data_json,s.version,s.updated_at,COALESCE(NULLIF(u.display_name,''),u.username,'Usuário indisponível') AS updated_by_name FROM inspection_sections s LEFT JOIN users u ON u.id=s.updated_by WHERE s.inspection_id=? ORDER BY s.section").bind(id).all()).results;
  const environments=(await db.prepare('SELECT id,name,type FROM environments WHERE unit_id=? ORDER BY name').bind(inspection.unit_id).all()).results;
  const activity=(await db.prepare("SELECT h.id,h.entity_id,h.event,h.created_at,COALESCE(NULLIF(u.display_name,''),u.username,'Usuário indisponível') AS actor_name FROM collection_history h LEFT JOIN users u ON u.id=h.actor_id WHERE h.inspection_id=? ORDER BY h.created_at DESC,h.id DESC LIMIT 20").bind(id).all()).results;
  const totals=await db.prepare('SELECT records,items,new_records,changed_records FROM inspection_collection_totals WHERE inspection_id=?').bind(id).first()||{records:0,items:0,new_records:0,changed_records:0};
  const visit=inspection.questionnaire_version===visitVersion?await visitReview(db,inspection):null;
  return json({visit,inspection,sections:hideContact(Object.fromEntries(rows.map(r=>[r.section,parse(r.data_json)])),user),states:visit?visitStates(visit.answers):Object.fromEntries(rows.map(r=>[r.section,{state:r.state,version:r.version,updatedAt:r.updated_at,updatedBy:r.updated_by_name}])),environments,activity,totals,serverTime:Date.now()});
 }
 if(path==='/api/inventory/in-progress-equipment'){
  if(inspection.state!=='open')return json({completed:true,items:[],nextCursor:null});
  const cursor=cursorParams(url.searchParams.get('cursor'));if(cursor===false)return fail('Página inválida.');
  const rows=(await db.prepare(`SELECT e.id,e.data_json,e.published_json IS NULL AS is_new,e.duplicate_flag,e.updated_at,COALESCE(NULLIF(u.display_name,''),u.username,'Usuário indisponível') AS updated_by_name FROM inventory_equipment_all e LEFT JOIN users u ON u.id=e.updated_by WHERE e.inspection_id=? ${cursor?'AND (e.updated_at<? OR (e.updated_at=? AND e.id<?))':''} ORDER BY e.updated_at DESC,e.id DESC LIMIT 51`).bind(id,...(cursor?[cursor[0],cursor[0],cursor[1]]:[])).all()).results;
  const page=rows.slice(0,50),last=page.at(-1);
  return json({items:page.map(r=>({...r,data:parse(r.data_json),data_json:undefined})),nextCursor:rows.length>50?btoa(JSON.stringify([last.updated_at,last.id])):null,revision:inspection.revision});
 }
 return fail('Consulta não encontrada.',404);
}
