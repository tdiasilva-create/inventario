import {questionnaireVersion,topics,v2Sections,validateV2Section,v2PhotoErrors,pendingAgentLinks,pendingDrafts} from '../web/collector-v2-schema.js';
const parse=s=>JSON.parse(s||'{}');
export const isV2=i=>i?.questionnaire_version===questionnaireVersion;
export async function startV2(request,user,env,{body,json,fail,unit,history}){
 const data=await body(request),u=await unit(data.unitId);if(!u)return fail('Unidade não autorizada.',403);
 const db=env.DB,old=await db.prepare("SELECT * FROM inspections WHERE unit_id=? AND state='open'").bind(u.id).first();
 if(isV2(old))return json({inspection:old});
 if(old&&data.preservePrevious!==true)return json({error:'Há uma coleta anterior em andamento. Confirme para preservá-la e iniciar a V2.',legacyInspectionId:old.id},409);
 const id=crypto.randomUUID(),now=Date.now();
 const previous=await db.prepare("SELECT id FROM inspections WHERE unit_id=? AND questionnaire_version=? AND state='completed' ORDER BY completed_at DESC LIMIT 1").bind(u.id,questionnaireVersion).first();
 const prior=previous?(await db.prepare('SELECT section,data_json FROM inspection_sections WHERE inspection_id=?').bind(previous.id).all()).results:[];
 await db.batch([...(old?[db.prepare("UPDATE inspections SET state='paused',updated_at=? WHERE id=? AND state='open'").bind(now,old.id),history(old,old.id,'inspection_preserved_for_v2',null,{newInspection:id})]:[]),db.prepare('INSERT INTO inspections(id,unit_id,questionnaire_version,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,u.id,questionnaireVersion,user.id,now,now),...topics.map(([g])=>db.prepare('INSERT INTO inspection_sections(inspection_id,section,data_json,state,updated_by,updated_at) VALUES(?,?,?,?,?,?)').bind(id,g,g==='A'?'{}':prior.find(r=>r.section===g)?.data_json||'{}',previous&&g!=='A'?'Concluído':'Pendente',user.id,now))]);
 return json({inspection:await db.prepare('SELECT * FROM inspections WHERE id=?').bind(id).first()},201);
}
export async function v2Evidence(db,i){
 // Current plus previously completed evidence, never another draft's photos.
 const photos=(await db.prepare("SELECT p.id,p.target_kind,p.target_id,p.status,p.inspection_id FROM collection_photos p JOIN inspections v ON v.id=p.inspection_id WHERE p.unit_id=? AND p.status='ready' AND (v.state='completed' OR p.inspection_id=?) ORDER BY p.created_at").bind(i.unit_id,i.id).all()).results.map(p=>({...p,current:p.inspection_id===i.id}));
 return photos;
}
export async function reviewV2(db,i,context){
 const rows=(await db.prepare('SELECT * FROM inspection_sections WHERE inspection_id=?').bind(i.id).all()).results;
 const sections=Object.fromEntries(rows.map(r=>[r.section,parse(r.data_json)])),errors={},details={};
 for(const [g]of topics){const row=rows.find(r=>r.section===g);if(!row||row.state!=='Concluído')errors[g]='Marque este assunto como concluído.';const fields=validateV2Section(g,sections[g]||{},{...context,legacyGroups:false});if(Object.keys(fields).length){details[g]=fields;errors[g]=Object.values(fields).join(' ');}}
 // [REV-06] physicalChanged é resposta DESTA visita: só conta quando a ficha foi editada nesta vistoria (inspection_id atual).
 const equipment=(await db.prepare('SELECT id,inspection_id,data_json,EXISTS(SELECT 1 FROM agent_equipment_links l WHERE l.equipment_id=equipments.id AND l.ended_at IS NULL) AS agent_linked FROM equipments WHERE unit_id=? AND (inspection_id=? OR id IN (SELECT equipment_id FROM equipment_verifications WHERE inspection_id=?))').bind(i.unit_id,i.id,i.id).all()).results.map(e=>{const data=parse(e.data_json);if(e.inspection_id!==i.id)delete data.physicalChanged;return {id:e.id,data,agent_linked:!!e.agent_linked,editedThisVisit:e.inspection_id===i.id};});
 const photos=await v2Evidence(db,i);
 // Modo Agente: o vínculo é confirmado somente pelo servidor (claim do QR); sem ele o assunto F não conclui.
 const unlinked=pendingAgentLinks(equipment);if(unlinked.length)errors.F=(errors.F?errors.F+' ':'')+unlinked.length+' computador(es) em modo Agente ainda sem vínculo confirmado. Vincule pelo QR Code ou troque para cadastro manual.';
 for(const e of unlinked)details['agent:'+e.id]='Vínculo do agente pendente.';
 // [REV-05] rascunhos iniciados pelo QR precisam da conferência completa antes de concluir F.
 const drafts=pendingDrafts(equipment);if(drafts.length)errors.F=(errors.F?errors.F+' ':'')+drafts.length+' ficha(s) iniciada(s) pelo QR ainda sem conferência completa (conservação, funcionamento e uso).';
 for(const e of drafts)details['draft:'+e.id]='Complete a ficha do computador.';
 Object.assign(errors,v2PhotoErrors({sections,equipment,photos,hasFacade:photos.some(p=>p.target_kind==='facade')}));
 const earlier=photos.some(p=>p.target_kind==='facade'&&!p.current);
 if(earlier&&!['Sim','Não','Não foi possível verificar'].includes(sections.A?.facadeChanged))errors.facadeChanged='Informe se a fachada sofreu alteração desde a última foto.';
 return {errors,details};
}
export const v2ExtraEquipmentKeys=['registration','manualReason','assetStatus','origin','acquisition','supplies','supplier','connection','ip','ssid','physicalChanged'];
export function validSectionShape(section,data){
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 const check=(fields,obj,extra=[])=>{if(!obj||typeof obj!=='object'||Array.isArray(obj))return false;return Object.entries(obj).every(([key,value])=>{if(extra.includes(key))return typeof value==='string'&&value.length<=4000;const f=fields.find(f=>f.key===key);if(!f)return false;if(f.type==='rows')return Array.isArray(value)&&value.every(r=>check(f.children,r,['id']));return ['string','number','boolean'].includes(typeof value)&&String(value).length<=4000;});};
 const fields=v2Sections[section]||[];
 return check(fields,data,section==='A'?['facadeChanged']:[]);
}
export async function pendingDraftCount(db,i){
 return (await db.prepare("SELECT COUNT(*) AS n FROM equipments e WHERE e.unit_id=? AND (e.inspection_id=? OR e.id IN (SELECT equipment_id FROM equipment_verifications WHERE inspection_id=?)) AND json_extract(e.data_json,'$.draft')=1").bind(i.unit_id,i.id,i.id).first()).n;
}
export async function pendingAgentLinkCount(db,i){
 return (await db.prepare("SELECT COUNT(*) AS n FROM equipments e WHERE e.unit_id=? AND (e.inspection_id=? OR e.id IN (SELECT equipment_id FROM equipment_verifications WHERE inspection_id=?)) AND e.category IN ('desktop','notebook') AND json_extract(e.data_json,'$.registration')='Agente' AND NOT EXISTS(SELECT 1 FROM agent_equipment_links l WHERE l.equipment_id=e.id AND l.ended_at IS NULL)").bind(i.unit_id,i.id,i.id).first()).n;
}
// Nomes de ambiente parecidos (acentos, caixa e espaços ignorados; um contido no outro) para aviso antes de criar outro cadastro.
export const environmentKey=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function editDistance(a,b){if(Math.abs(a.length-b.length)>3)return 99;const prev=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){let diag=prev[0];prev[0]=i;for(let j=1;j<=b.length;j++){const tmp=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,diag+(a[i-1]===b[j-1]?0:1));diag=tmp;}}return prev[b.length];}
export function similarEnvironments(name,environments){
 const key=environmentKey(name);if(key.length<3)return [];const compact=key.replace(/\s/g,''),tokens=new Set(key.split(' ').filter(t=>t.length>2));
 return environments.filter(e=>{const k=environmentKey(e.name);if(k===key)return e.name.toLowerCase()!==String(name).toLowerCase();const c=k.replace(/\s/g,'');if(c.includes(compact)||compact.includes(c))return true;if(editDistance(c,compact)<=2)return true;const other=k.split(' ').filter(t=>t.length>2);const shared=other.filter(t=>tokens.has(t)).length;return tokens.size>0&&other.length>0&&shared/Math.max(tokens.size,other.length)>=0.6;});
}
