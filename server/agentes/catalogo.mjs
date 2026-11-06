// ADAPTADOR DE CATÁLOGO do módulo de agentes para as tabelas REAIS do inventário SEMED.
// Único ponto que conhece units / environments / inspections / equipments. Formatos conforme nucleo/catalogo.mjs.
// Não cria catálogo paralelo; a ficha (equipments) continua a fonte de verdade de unidade/ambiente/posição.
import {questionnaireVersion as V2} from '../../web/collector-v2-schema.js';
const COMPUTADORES="('desktop','notebook','computer')";
// [R2-B] assunto dos computadores por versão do questionário: V2 = só F; legado = F ou G (mesma regra de /api/collector/equipment-save).
const SECAO_CONCLUIDA=`EXISTS (SELECT 1 FROM inspection_sections s JOIN inspections i ON i.id=s.inspection_id WHERE s.inspection_id=?1 AND s.state='Concluído' AND (s.section='F' OR (i.questionnaire_version NOT IN ('${V2}','coleta-3.0') AND s.section='G')))`;
const EQ_COLS=`e.id,e.unit_id,e.environment_id,e.category,e.asset,e.serial,e.version,e.inspection_id,e.position_label,e.position_description,e.location_state,e.location_confirmed_by,e.location_confirmed_at,e.published_json IS NOT NULL AS published,e.published_json,e.duplicate_flag,e.data_json`;
// [R2-C] published_location = localização da ÚLTIMA PUBLICAÇÃO (published_json); as colunas são o estado atual (rascunho da visita aberta).
const pubLoc=json=>{if(!json)return null;try{const d=JSON.parse(json);return {environment_id:d.environment??null,position_label:d.position_label??null,position_description:d.position_description??null,location_state:d.location_state??'declarada',location_confirmed_by:d.location_confirmed_by??null,location_confirmed_at:d.location_confirmed_at??null,registration:d.registration??null};}catch{return null;}};
const eq=r=>{if(!r)return r;const published_location=pubLoc(r.published_json);const cur={environment_id:r.environment_id??null,position_label:r.position_label??null,position_description:r.position_description??null,location_state:r.location_state??'declarada'};const partial=!!r.published&&!!published_location&&(published_location.environment_id!==cur.environment_id||published_location.position_label!==cur.position_label||published_location.location_state!==cur.location_state);return {id:r.id,unit_id:r.unit_id,environment_id:cur.environment_id,category:r.category,asset:r.asset||null,serial:r.serial||null,status:r.published?'publicado':'rascunho',version:Number(r.version),inspection_id:r.inspection_id??null,position_label:cur.position_label,position_description:cur.position_description,location_state:cur.location_state,location_confirmed_by:r.location_confirmed_by??null,location_confirmed_at:r.location_confirmed_at??null,duplicate_flag:!!r.duplicate_flag,brand:safe(r.data_json,'brand'),model:safe(r.data_json,'model'),registration:safe(r.data_json,'registration'),published_location,partial_location:partial,already_linked:r.already_linked===undefined?undefined:!!r.already_linked};};
function safe(json,key){try{return JSON.parse(json||'{}')[key]??null;}catch{return null;}}
const unit=r=>r&&({unit_id:r.id,name:r.name,active:!!r.active,code:r.code??null});
const env=r=>r&&({environment_id:r.id,unit_id:r.unit_id,name:r.name});
const insp=r=>r&&({inspection_id:r.id,unit_id:r.unit_id,state:r.state,questionnaire_version:r.questionnaire_version});
const guard=(db,condition,...args)=>db.prepare('INSERT INTO agent_tx_guard(ok) SELECT 0 WHERE NOT ('+condition+')').bind(...args);
export const catalogo={
 nome:'inventario-semed (units/environments/inspections/equipments)',
 async getUnit(db,id){return unit(await db.prepare('SELECT id,name,active,code FROM units WHERE id=?1').bind(id).first());},
 async listUnits(db){return (await db.prepare('SELECT id,name,active,code FROM units WHERE active=1 ORDER BY name COLLATE NOCASE').all()).results.map(unit);},
 async getEnvironment(db,id){return env(await db.prepare('SELECT id,unit_id,name FROM environments WHERE id=?1').bind(id).first());},
 async listEnvironments(db,unitId){return (await db.prepare('SELECT id,unit_id,name FROM environments WHERE unit_id=?1 ORDER BY name COLLATE NOCASE').bind(unitId).all()).results.map(env);},
 async getInspection(db,id){return insp(await db.prepare('SELECT id,unit_id,state,questionnaire_version FROM inspections WHERE id=?1').bind(id).first());},
 async listOpenInspections(db,unitId){return (await db.prepare("SELECT id,unit_id,state,questionnaire_version FROM inspections WHERE unit_id=?1 AND state='open' ORDER BY created_at").bind(unitId).all()).results.map(insp);},
 async getEquipment(db,id){return eq(await db.prepare(`SELECT ${EQ_COLS} FROM equipments e WHERE e.id=?1`).bind(id).first());},
 /** R5: uma consulta só (vínculo ativo via LEFT JOIN), com cursor e filtro; nunca varre a unidade inteira por padrão. */
 async listComputersInUnit(db,unitId,{cursor=null,limit=50,q=''}={}){
  const conditions=['e.unit_id=?1',`e.category IN ${COMPUTADORES}`],params=[unitId];
  const term=String(q||'').trim().toLowerCase().slice(0,60);if(term){params.push(term);conditions.push(`instr(e.search_text,?${params.length})>0`);}
  if(cursor){params.push(cursor);conditions.push(`e.id>?${params.length}`);}
  const size=Math.max(1,Math.min(200,Number(limit)||50));params.push(size+1);
  const rows=(await db.prepare(`SELECT ${EQ_COLS},EXISTS(SELECT 1 FROM agent_equipment_links l WHERE l.equipment_id=e.id AND l.ended_at IS NULL) AS already_linked FROM equipments e WHERE ${conditions.join(' AND ')} ORDER BY e.id LIMIT ?${params.length}`).bind(...params).all()).results;
  const page=rows.slice(0,size).map(eq);
  return Object.assign(page,{nextCursor:rows.length>size?page.at(-1).id:null});
 },
 async findEquipmentByAsset(db,asset,unitId=null){const row=unitId?await db.prepare(`SELECT ${EQ_COLS} FROM equipments e WHERE e.unit_id=?2 AND e.asset=?1 LIMIT 1`).bind(asset,unitId).first():await db.prepare(`SELECT ${EQ_COLS} FROM equipments e WHERE e.asset=?1 LIMIT 1`).bind(asset).first();return eq(row);},
 assertEquipmentVersion(db,id,version){return guard(db,'EXISTS (SELECT 1 FROM equipments WHERE id=?1 AND version=?2)',id,version);},
 /** Atualiza ambiente (coluna E data_json), posição e confirmação na própria ficha, incrementando a versão.
  * [REV-02] Só o claim confirmado marca registration='Agente' (markAgent); a mudança de localização nunca altera o modo. */
 updateEquipmentLocation(db,id,expectedVersion,l,{by=null,nowMs=Date.now(),markAgent=false,inspectionId=null}={}){
  // [R2-C] a mutação humana entra no ciclo da visita: inspection_id passa a ser a visita aberta (publicada no finish) e os campos de
  // localização ficam TAMBÉM no data_json, para que published_json carregue ambiente+posição+confirmação coerentes.
  const json="json_set(data_json,'$.environment',?1,'$.position_label',?2,'$.position_description',?3,'$.location_state',?4,'$.location_confirmed_by',?5,'$.location_confirmed_at',?6"+(markAgent?",'$.registration','Agente'":"")+")";
  return db.prepare(`UPDATE equipments SET environment_id=?1,data_json=${json},position_label=?2,position_description=?3,location_state=?4,location_confirmed_by=?5,location_confirmed_at=?6,version=version+1,updated_by=COALESCE(?7,updated_by),updated_at=?8,inspection_id=COALESCE(?11,inspection_id),search_text=search_text WHERE id=?9 AND version=?10`).bind(l.environment_id,l.position_label,l.position_description,l.location_state,l.location_confirmed_by,l.location_confirmed_at,by,nowMs,id,expectedVersion,inspectionId);
 },
 /** [REV-02/REV-03] Política compartilhada com o coletor, verificada DENTRO do batch: unidade ativa, visita aberta da
  * mesma unidade e trava de edição do próprio usuário (token válido). Igual à regra de /api/collector/equipment-save. */
 policyGuards(db,{unitId,inspectionId,equipmentId,userId,lockToken,nowMs=Date.now()}){
  return [
   guard(db,'EXISTS (SELECT 1 FROM units WHERE id=?1 AND active=1)',unitId),
   guard(db,"EXISTS (SELECT 1 FROM inspections WHERE id=?1 AND unit_id=?2 AND state='open')",inspectionId||'',unitId),
   guard(db,'EXISTS (SELECT 1 FROM equipment_locks WHERE equipment_id=?1 AND user_id=?2 AND token=?3 AND expires_at>?4)',equipmentId,userId,String(lockToken||''),nowMs),
   guard(db,'NOT '+SECAO_CONCLUIDA,inspectionId||'') // [R2-B] assunto dos computadores não pode estar concluído (reabertura manual)
  ];
 },
 /** Pré-verificação legível da mesma política (o batch continua sendo a verificação que vale). Devolve null ou um motivo. */
 async checkPolicy(db,{unitId,inspectionId,equipmentId,userId,lockToken,nowMs=Date.now()}){
  const u=await db.prepare('SELECT active FROM units WHERE id=?1').bind(unitId).first();if(!u)return 'UNIT_NOT_FOUND';if(!u.active)return 'UNIT_INACTIVE';
  if(!inspectionId)return 'INSPECTION_REQUIRED';
  const i=await db.prepare('SELECT unit_id,state FROM inspections WHERE id=?1').bind(inspectionId).first();if(!i||i.unit_id!==unitId)return 'INSPECTION_NOT_IN_UNIT';if(i.state!=='open')return 'INSPECTION_CLOSED';
  const l=await db.prepare('SELECT user_id,token,expires_at FROM equipment_locks WHERE equipment_id=?1').bind(equipmentId).first();
  if(!l||l.expires_at<=nowMs)return 'LOCK_REQUIRED';if(l.user_id!==userId)return 'EQUIPMENT_LOCKED';if(l.token!==String(lockToken||''))return 'LOCK_REQUIRED';
  if((await db.prepare('SELECT '+SECAO_CONCLUIDA+' AS done').bind(inspectionId).first())?.done)return 'SECTION_COMPLETED';
  return null;
 },
 /** Revisão/updated_at da visita avançam junto com a ficha, como em qualquer edição do coletor. */
 touchInspection(db,inspectionId,nowMs=Date.now()){return db.prepare("UPDATE inspections SET revision=revision+1,updated_at=?1 WHERE id=?2 AND state='open'").bind(nowMs,inspectionId||'');},
 /** Histórico do inventário (mesma trilha das edições humanas), na mesma transação do vínculo. */
 historyStatement(db,{equipmentId,unitId,inspectionId,event,before,after,actorId,nowMs=Date.now()}){
  return db.prepare('INSERT INTO collection_history(id,unit_id,inspection_id,entity_id,event,before_json,after_json,actor_id,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)').bind(crypto.randomUUID(),unitId,inspectionId||'',equipmentId,event,before===null||before===undefined?null:JSON.stringify(before),after===null||after===undefined?null:JSON.stringify(after),actorId,nowMs);
 },
 // Ficha nova pelo vínculo está DESLIGADA (allowNewEquipment:false): a ficha nasce pelo fluxo normal do coletor (validação V2, autoria, histórico)
 // e o vínculo acontece com mode 'existing'. Mantido por compatibilidade de interface; nunca chamado em produção.
 insertEquipment(){throw new Error('Criação de ficha pelo vínculo desativada; use o fluxo do coletor.');},
 async countEquipment(db){return (await db.prepare(`SELECT COUNT(*) AS n FROM equipments WHERE category IN ${COMPUTADORES}`).first()).n;}
};
