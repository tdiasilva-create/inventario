// A retirada é administrativa. Histórico, fotos, demandas e IDs não são reaproveitados.
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const snapshotSQL=`SELECT json_object('record',json_object('id',e.id,'unit_id',e.unit_id,'inspection_id',e.inspection_id,'category',e.category,'environment_id',e.environment_id,'asset',e.asset,'serial',e.serial,'search_text',e.search_text,'data_json',e.data_json,'published_json',e.published_json,'version',e.version,'created_by',e.created_by,'created_at',e.created_at,'updated_by',e.updated_by,'updated_at',e.updated_at,'verified_at',e.verified_at,'verified_by',e.verified_by,'mutation_id',e.mutation_id,'duplicate_flag',e.duplicate_flag,'published_verified_at',e.published_verified_at,'published_updated_at',e.published_updated_at,'position_label',e.position_label,'position_description',e.position_description,'location_state',e.location_state,'location_confirmed_by',e.location_confirmed_by,'location_confirmed_at',e.location_confirmed_at,'storage_kind',e.storage_kind),
 'hostname',(SELECT COALESCE(json_extract(si.sections_json,'$.system.data.hostname'),json_extract(en.summary_json,'$.hostname')) FROM agent_equipment_links l LEFT JOIN agent_current_snapshot cs ON cs.device_id=l.device_id LEFT JOIN agent_inventory_snapshots si ON si.inventory_id=cs.inventory_id LEFT JOIN agent_enrollments en ON en.device_id=l.device_id WHERE l.equipment_id=e.id AND l.ended_at IS NULL LIMIT 1),
 'unitName',u.name,'environmentName',r.name,'displayName',n.name,'nameVersion',n.version,'inspectionRevision',i.revision,'questionnaireVersion',i.questionnaire_version,
 'photos',json((SELECT json_group_array(json_object('id',p.id,'status',p.status,'size',p.size,'sha256',p.sha256)) FROM collection_photos p WHERE p.target_kind='equipment' AND p.target_id=e.id AND p.unit_id=e.unit_id)),
 'links',json((SELECT json_group_array(json_object('link_id',l.link_id,'device_id',l.device_id,'linked_at',l.linked_at,'ended_at',l.ended_at,'end_reason',l.end_reason)) FROM agent_equipment_links l WHERE l.equipment_id=e.id)),
 'verifications',json((SELECT json_group_array(json_object('inspection_id',v.inspection_id,'result',v.result,'reason',v.reason,'user_id',v.user_id,'created_at',v.created_at)) FROM equipment_verifications v WHERE v.equipment_id=e.id)),
 'missingCases',json((SELECT json_group_array(json_object('id',m.id,'inspection_id',m.inspection_id,'reason',m.reason,'state',m.state,'created_by',m.created_by,'created_at',m.created_at,'resolved_by',m.resolved_by,'resolved_at',m.resolved_at)) FROM missing_equipment_cases m WHERE m.equipment_id=e.id))) AS snapshot
 FROM inventory_equipment_all e JOIN units u ON u.id=e.unit_id JOIN inspections i ON i.id=e.inspection_id LEFT JOIN environments r ON r.id=e.environment_id LEFT JOIN equipment_names n ON n.equipment_id=e.id WHERE e.id=? AND e.unit_id=?`;
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function equipmentDeletionRoutes(request,url,user,env,{json,fail,body}){
 if(!['/api/root/equipment-delete','/api/root/equipment-deleted'].includes(url.pathname))return null;
 if(user.role!=='root'||env.APP_KIND==='collector')return fail('Somente root pode apagar cadastros pelo painel.',403);
 const db=env.DB;
 if(url.pathname.endsWith('-deleted')){
  if(request.method!=='GET')return fail('Método não permitido.',405);
  const unitId=url.searchParams.get('unitId'),offset=Number(url.searchParams.get('offset')||0);if(!uuid(unitId)||!Number.isSafeInteger(offset)||offset<0)return fail('Consulta inválida.');
  const rows=(await db.prepare(`SELECT x.equipment_id,x.actor_name,x.reason,x.snapshot_json,x.created_at,(SELECT json_group_array(json_object('id',p.id,'status',p.status)) FROM collection_photos p WHERE p.target_kind='equipment' AND p.target_id=x.equipment_id AND p.unit_id=x.unit_id) AS photos_json FROM equipment_deletions x WHERE unit_id=? ORDER BY created_at DESC,equipment_id LIMIT 21 OFFSET ?`).bind(unitId,offset).all()).results;
  return json({items:rows.slice(0,20).map(r=>({...r,snapshot:{...JSON.parse(r.snapshot_json),photos:JSON.parse(r.photos_json)},snapshot_json:undefined,photos_json:undefined})),nextOffset:rows.length>20?offset+20:null});
 }
 if(!['GET','POST'].includes(request.method))return fail('Método não permitido.',405);
 const a=request.method==='POST'?await body(request):Object.fromEntries(url.searchParams),{id,unitId,operationId}=a;
 if(!uuid(id)||!uuid(unitId))return fail('Identificação inválida.');
 const write=request.method==='POST',reason=typeof a.reason==='string'?a.reason.trim():'';
 if(write&&(!uuid(operationId)||!reason||reason.length<5||reason.length>1000||a.confirm!==true||typeof a.snapshot!=='string'||a.snapshot.length!==64))return fail('Confirme a exclusão e informe um motivo de 5 a 1.000 caracteres.');
 const payload=JSON.stringify({id,unitId,reason,snapshot:a.snapshot});
 const receipt=await db.prepare('SELECT equipment_id,operation_id,actor_id,payload_json FROM equipment_deletions WHERE equipment_id=? OR operation_id=?').bind(id,operationId||'').first();
 if(receipt)return write&&receipt.operation_id===operationId&&receipt.actor_id===user.id&&receipt.payload_json===payload?json({deleted:true,id,replayed:true}):fail('Cadastro já apagado ou identificador de operação já utilizado.',409);
 const row=await db.prepare(snapshotSQL).bind(id,unitId).first();if(!row)return fail('Equipamento não encontrado nesta unidade.',404);
 const snapshot=JSON.parse(row.snapshot),record=snapshot.record,activeLinks=snapshot.links.filter(l=>!l.ended_at);
 const preview={id,unitId,name:snapshot.displayName||snapshot.hostname||({computer:'Computador',desktop:'Computador',notebook:'Notebook',printer:'Impressora',other:'Outro equipamento'}[record.category]||record.category),unitName:snapshot.unitName,environmentName:snapshot.environmentName,photos:snapshot.photos.length,activeAgents:activeLinks.length,published:!!record.published_json,snapshot:await hash(row.snapshot)};
 if(!write)return json(preview);
 if(preview.snapshot!==a.snapshot)return fail('O equipamento mudou após a prévia. Feche e confira novamente antes de apagar.',409);
 const now=Date.now(),iso=new Date(now).toISOString(),table=record.storage_kind==='misc'?'miscellaneous_equipments':'equipments',lock=record.storage_kind==='misc'?'miscellaneous_locks':'equipment_locks',q=(sql,...args)=>db.prepare(sql).bind(...args);
 const st=[q(`INSERT INTO root_deletion_guard(id,valid) SELECT ?,CASE WHEN COALESCE((${snapshotSQL}),'')=? THEN 1 ELSE 0 END`,operationId,id,unitId,row.snapshot),
  q('INSERT INTO equipment_deletions(equipment_id,unit_id,operation_id,actor_id,actor_name,reason,payload_json,snapshot_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)',id,unitId,operationId,user.id,user.display_name||user.username,reason,payload,row.snapshot,now)];
 for(const link of activeLinks){
  // Não revogar a instalação: encerra o vínculo, invalida o QR anterior e permite gerar outro.
  st.push(q("INSERT INTO agent_audit_log(audit_id,at,actor,action,target,details_json) VALUES(?,?,?,'equipment_deleted',?,?)",crypto.randomUUID(),iso,user.id,link.device_id,JSON.stringify({equipment_id:id,link_id:link.link_id,reason})),
   q("UPDATE agent_equipment_links SET ended_at=?,end_reason='equipment_deleted' WHERE link_id=? AND ended_at IS NULL",iso,link.link_id),
   q("UPDATE agent_devices SET state='pending_pairing' WHERE device_id=? AND state='linked'",link.device_id),
   q("UPDATE agent_enrollments SET consumed_at=NULL,code_hash=NULL,visual_code=NULL,expires_at=?,created_at=?,renewals=0,failed_attempts=0 WHERE device_id=? AND EXISTS(SELECT 1 FROM agent_devices WHERE device_id=? AND state='pending_pairing')",iso,iso,link.device_id,link.device_id));
 }
 st.push(q('DELETE FROM '+lock+' WHERE equipment_id=?',id),q('DELETE FROM equipment_verifications WHERE equipment_id=?',id),q('DELETE FROM missing_equipment_cases WHERE equipment_id=?',id),q('DELETE FROM '+table+' WHERE id=? AND unit_id=?',id,unitId),
  q("UPDATE inspection_sections SET state='Em andamento',version=version+1,updated_by=?,updated_at=?,mutation_id=NULL WHERE inspection_id=? AND section IN (SELECT value FROM json_each(?)) AND EXISTS(SELECT 1 FROM inspections WHERE id=? AND state='open')",user.id,now,record.inspection_id,JSON.stringify(['coleta-2.0','coleta-3.0'].includes(snapshot.questionnaireVersion)?[record.category==='printer'?'G':record.category==='other'&&snapshot.questionnaireVersion==='coleta-3.0'?'O':'F']:['F','G']),record.inspection_id),
  q("UPDATE inspections SET revision=revision+1,updated_at=? WHERE id=?",now,record.inspection_id),
  q("INSERT INTO collection_history(id,unit_id,inspection_id,entity_id,event,before_json,after_json,actor_id,created_at) VALUES(?,?,?,?,'equipment_deleted',?,?,?,?)",operationId,unitId,record.inspection_id,id,record.data_json,JSON.stringify({reason,archived:true}),user.id,now),
  q('DELETE FROM root_deletion_guard WHERE id=?',operationId));
 try{await db.batch(st);}catch(error){const saved=await db.prepare('SELECT actor_id,payload_json FROM equipment_deletions WHERE operation_id=?').bind(operationId).first();if(saved?.actor_id===user.id&&saved.payload_json===payload)return json({deleted:true,id,replayed:true});if(/CHECK constraint|UNIQUE constraint/.test(error.message))return fail('O cadastro mudou durante a exclusão. Atualize a prévia.',409);throw error;}
 return json({deleted:true,id,photosPreserved:preview.photos,agentsAwaitingPairing:activeLinks.length});
}
