import {questionnaireVersion,topics,v3Sections,validateV3Section,validateV3Equipment,isComputer} from '../web/collector-v3-schema.js';
import {v2Evidence,environmentKey} from './collector-v2.mjs';
const parse=s=>JSON.parse(s||'{}');
export const isV3=i=>i?.questionnaire_version===questionnaireVersion;
export async function startV3(request,user,env,{body,json,fail,unit,history}){
 const data=await body(request),u=await unit(data.unitId);if(!u)return fail('Unidade não autorizada.',403);
 const db=env.DB,old=await db.prepare("SELECT * FROM inspections WHERE unit_id=? AND state='open'").bind(u.id).first();
 if(isV3(old))return json({inspection:old});
 if(old&&data.preservePrevious!==true)return json({error:'Há um rascunho anterior em andamento. Preserve-o no histórico para iniciar a coleta atual.',legacyInspectionId:old.id},409);
 const id=crypto.randomUUID(),now=Date.now();
 const previous=await db.prepare("SELECT id FROM inspections WHERE unit_id=? AND questionnaire_version=? AND state='completed' ORDER BY completed_at DESC LIMIT 1").bind(u.id,questionnaireVersion).first();
 const prior=previous?(await db.prepare('SELECT section,data_json FROM inspection_sections WHERE inspection_id=?').bind(previous.id).all()).results:[];
 await db.batch([...(old?[db.prepare("UPDATE inspections SET state='paused',updated_at=? WHERE id=? AND state='open'").bind(now,old.id),history(old,old.id,'inspection_preserved_for_v3',null,{newInspection:id})]:[]),db.prepare('INSERT INTO inspections(id,unit_id,questionnaire_version,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,u.id,questionnaireVersion,user.id,now,now),...topics.map(([g])=>db.prepare('INSERT INTO inspection_sections(inspection_id,section,data_json,state,updated_by,updated_at) VALUES(?,?,?,?,?,?)').bind(id,g,g==='A'?'{}':prior.find(r=>r.section===g)?.data_json||'{}',previous&&g!=='A'?'Concluído':'Pendente',user.id,now))]);
 return json({inspection:await db.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first()},201);
}
// Digitação livre com identidade estável: reutiliza o nome normalizado na mesma unidade.
// Nunca aproxima nomes diferentes silenciosamente (Sala 1 e Sala 10 são distintos).
export async function resolveV3Environment(db,i,name,user,history,touch){
 name=String(name||'').trim().replace(/\s+/g,' ');if(!name||name.length>180)return null;
 const list=(await db.prepare('SELECT * FROM environments WHERE unit_id=? ORDER BY created_at,id').bind(i.unit_id).all()).results;
 const existing=list.find(e=>environmentKey(e.name)===environmentKey(name));if(existing)return existing;
 const id=crypto.randomUUID(),now=Date.now();
 try{
  const result=await db.batch([touch(i),db.prepare("INSERT INTO environments(id,unit_id,name,type,created_at,created_by,name_key) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM inspections WHERE id=? AND state='open')").bind(id,i.unit_id,name,'',now,user.id,environmentKey(name),i.id),history(i,id,'environment_created',null,{name,type:''})]);
  if(!result[1].meta.changes)return null;
 }catch(error){
  const concurrent=await db.prepare('SELECT * FROM environments WHERE unit_id=? AND name_key=?').bind(i.unit_id,environmentKey(name)).first();
  if(concurrent)return concurrent;throw error;
 }
 return {id,unit_id:i.unit_id,name,type:''};
}
export async function reviewV3(db,i,context){
 const rows=(await db.prepare('SELECT * FROM inspection_sections WHERE inspection_id=?').bind(i.id).all()).results,errors={},details={};
 for(const [g]of topics){const row=rows.find(r=>r.section===g);if(!row||row.state!=='Concluído')errors[g]='Marque este assunto como concluído.';const fields=validateV3Section(g,parse(row?.data_json),context);if(Object.keys(fields).length){details[g]=fields;errors[g]=Object.values(fields).join(' ');}}
 const equipment=(await db.prepare('SELECT id,data_json,EXISTS(SELECT 1 FROM agent_equipment_links l WHERE l.equipment_id=inventory_equipment_all.id AND l.ended_at IS NULL) AS agent_linked FROM inventory_equipment_all WHERE unit_id=? AND (inspection_id=? OR id IN (SELECT equipment_id FROM equipment_verifications WHERE inspection_id=?))').bind(i.unit_id,i.id,i.id).all()).results;
 const photos=await v2Evidence(db,i);
 if(!photos.some(p=>p.target_kind==='facade'))errors.facade='Envie a fotografia inicial da fachada.';
 for(const e of equipment){const d=parse(e.data_json),group=d.category==='printer'?'G':d.category==='other'?'O':'F';
  if(d.draft){errors[group]='Complete e salve as fichas iniciadas nesta visita.';details['draft:'+e.id]='Ficha ainda incompleta.';}
  if(isComputer(d)&&d.registration==='Agente'&&!e.agent_linked){errors.F='Vincule os computadores em modo Agente ou escolha cadastro manual.';details['agent:'+e.id]='Vínculo pendente.';}
  if(d.category==='printer'&&!photos.some(p=>p.target_kind==='equipment'&&p.target_id===e.id))errors['photo:'+e.id]='Envie a fotografia inicial da impressora.';
 }
 return {errors,details};
}
export const v3ExtraEquipmentKeys=['registration','manualReason','assetStatus','origin','acquisition','supplies','connection','ip','computerOrigin','environmentName','position_label'];
