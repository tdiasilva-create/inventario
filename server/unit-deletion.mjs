// Deletion is a distinct root action, not an alias for inactivation.
const snapshotSQL=`SELECT json_object('version',u.version,
 'visits',(SELECT COUNT(*) FROM inspections WHERE unit_id=u.id),
 'revisions',(SELECT COALESCE(SUM(revision),0) FROM inspections WHERE unit_id=u.id),
 'environments',(SELECT COUNT(*) FROM environments WHERE unit_id=u.id),
 'equipment',(SELECT COUNT(*) FROM inventory_equipment_all WHERE unit_id=u.id),
 'equipmentVersions',(SELECT COALESCE(SUM(version),0) FROM inventory_equipment_all WHERE unit_id=u.id),
 'photos',(SELECT COUNT(*) FROM collection_photos WHERE unit_id=u.id),
 'photoState',(SELECT COALESCE(SUM(created_at+size+CASE WHEN status='ready' THEN 1 ELSE 0 END),0) FROM collection_photos WHERE unit_id=u.id),
 'agentLinks',(SELECT COUNT(*) FROM agent_equipment_links l JOIN equipments e ON e.id=l.equipment_id WHERE e.unit_id=u.id AND l.ended_at IS NULL),
 'agentLinksAll',(SELECT COUNT(*) FROM agent_equipment_links l JOIN equipments e ON e.id=l.equipment_id WHERE e.unit_id=u.id)) AS snapshot FROM units u WHERE u.id=?`;
// REV-01: agentes vinculados a fichas da unidade entram no impacto e são revogados NA MESMA transação da exclusão.
// Histórico (vínculos encerrados, localização, snapshots, auditoria) é preservado; nenhuma telemetria recria unidade/ficha.
const linkedDevices='SELECT l.device_id FROM agent_equipment_links l JOIN equipments e ON e.id=l.equipment_id WHERE e.unit_id=? AND l.ended_at IS NULL';
import {photoStore} from './photo-storage.mjs';
// `store` é a camada de armazenamento (R2 ou Google Drive); `photos` (binding R2) continua aceito por compatibilidade.
async function cleanPhotos(db,store){
 if(store&&await store.enabled()){const rows=(await db.prepare('SELECT object_key,storage_provider,storage_ref FROM photo_deletion_queue ORDER BY created_at LIMIT 50').all()).results;for(const row of rows){try{await store.delete(row);await db.prepare('DELETE FROM photo_deletion_queue WHERE object_key=?').bind(row.object_key).run();}catch{/* Retain key for retry; never claim the file was deleted. */}}}
 return (await db.prepare('SELECT COUNT(*) AS n FROM photo_deletion_queue').first()).n;
}
export async function unitDeletion(request,url,user,db,{json,fail,body,audit,photos,store}){
 if(!['/api/root/unit-delete-preview','/api/root/unit-delete','/api/root/photo-cleanup'].includes(url.pathname))return null;
 if(user.role!=='root')return fail('Somente root pode excluir unidades.',403);
 store=store||(photos?photoStore({},{photos}):null);
 if(url.pathname==='/api/root/photo-cleanup'){if(request.method!=='POST')return fail('Método não permitido.',405);return json({pending:await cleanPhotos(db,store),storageAvailable:!!store&&await store.enabled(),provider:store?.provider||null});}
 const preview=url.pathname.endsWith('-preview');
 if(request.method!==(preview?'GET':'POST'))return fail('Método não permitido.',405);
 const data=preview?{id:url.searchParams.get('id')}:await body(request);
 const unit=await db.prepare('SELECT * FROM units WHERE id=?').bind(String(data.id)).first();
 if(!unit)return fail('Unidade não encontrada.',404);
 const snapshot=(await db.prepare(snapshotSQL).bind(unit.id).first()).snapshot,impact=JSON.parse(snapshot);
 if(preview)return json({unit:{id:unit.id,name:unit.name},impact,snapshot});
 if(data.confirmName!==unit.name||typeof data.reason!=='string'||data.reason.trim().length<5||data.reason.length>1000)return fail('Confirme o nome exato da unidade e informe o motivo da exclusão (5 a 1.000 caracteres).');
 if(data.snapshot!==snapshot)return fail('Os dados mudaram após a prévia. Confira novamente antes de excluir.',409);
 const id=crypto.randomUUID(),now=Date.now(),nowIso=new Date(now).toISOString().replace(/\.\d{3}Z$/,'Z'),q=(sql,...args)=>db.prepare(sql).bind(...args);
 const equipment='SELECT id FROM equipments WHERE unit_id=?',visits='SELECT id FROM inspections WHERE unit_id=?';
 const statements=[
  q(`INSERT INTO root_deletion_guard(id,valid) SELECT ?,CASE WHEN COALESCE((${snapshotSQL}),'')=? THEN 1 ELSE 0 END`,id,unit.id,snapshot),
  q('INSERT INTO root_deletions(id,unit_id,actor_id,unit_json,impact_json,reason,created_at) VALUES(?,?,?,?,?,?,?)',id,unit.id,user.id,JSON.stringify(unit),JSON.stringify(impact),data.reason.trim(),now),
  q('INSERT OR IGNORE INTO photo_deletion_queue(object_key,deletion_id,created_at,storage_provider,storage_ref) SELECT object_key,?,?,storage_provider,storage_ref FROM collection_photos WHERE unit_id=?',id,now,unit.id),
  q(`INSERT INTO agent_audit_log(audit_id,at,actor,action,target,details_json) SELECT lower(hex(randomblob(16))),?,?,'agent_revoked',device_id,json_object('reason','unit_deleted','unit_id',?,'deletion_id',?) FROM (${linkedDevices})`,nowIso,user.id,unit.id,id,unit.id),
  q(`UPDATE agent_keys SET status='revoked' WHERE installation_id IN (SELECT installation_id FROM agent_installations WHERE device_id IN (${linkedDevices}))`,unit.id),
  q(`UPDATE agent_installations SET revoked_at=COALESCE(revoked_at,?) WHERE device_id IN (${linkedDevices})`,nowIso,unit.id),
  q(`UPDATE agent_devices SET state='revoked',revoked_at=?,revoked_by=?,revoke_reason=? WHERE state<>'revoked' AND device_id IN (${linkedDevices})`,nowIso,user.id,'unit_deleted:'+unit.id,unit.id),
  q(`UPDATE agent_equipment_links SET ended_at=?,end_reason='unit_deleted' WHERE ended_at IS NULL AND equipment_id IN (${equipment})`,nowIso,unit.id),
  q(`DELETE FROM equipment_locks WHERE equipment_id IN (${equipment})`,unit.id),
  q(`DELETE FROM equipment_verifications WHERE equipment_id IN (${equipment}) OR inspection_id IN (${visits})`,unit.id,unit.id),
  q('DELETE FROM missing_equipment_cases WHERE unit_id=?',unit.id),
  q('DELETE FROM collection_photos WHERE unit_id=?',unit.id),
  q('DELETE FROM miscellaneous_locks WHERE equipment_id IN (SELECT id FROM miscellaneous_equipments WHERE unit_id=?)',unit.id),
  q('DELETE FROM miscellaneous_equipments WHERE unit_id=?',unit.id),
  q('DELETE FROM equipments WHERE unit_id=?',unit.id),
  q('DELETE FROM environments WHERE unit_id=?',unit.id),
  q(`DELETE FROM inspection_sections WHERE inspection_id IN (${visits})`,unit.id),
  q(`DELETE FROM inspection_environments WHERE inspection_id IN (${visits})`,unit.id),
  q(`DELETE FROM inspection_collection_totals WHERE inspection_id IN (${visits})`,unit.id),
  q(`DELETE FROM visit_answers WHERE inspection_id IN (${visits})`,unit.id),
  q('DELETE FROM inspections WHERE unit_id=?',unit.id),
  q('DELETE FROM unit_assignments WHERE unit_id=?',unit.id),
  q('DELETE FROM unit_collection_totals WHERE unit_id=?',unit.id),
  q('DELETE FROM published_equipment_counts WHERE unit_id=?',unit.id),
  q('DELETE FROM published_unit_status WHERE unit_id=?',unit.id),
  q('DELETE FROM units WHERE id=?',unit.id),
  q('INSERT INTO unit_changes(actor_id,event,target_id,payload,created_at) VALUES(?,?,?,?,?)',user.id,'unit_deleted',unit.id,JSON.stringify({deletionId:id,unit,impact,reason:data.reason.trim()}),now),
  audit(db,user.id,'unit_deleted:'+unit.id),
  q('DELETE FROM root_deletion_guard WHERE id=?',id)
 ];
 try{await db.batch(statements);}catch(error){if(String(error.message).includes('CHECK constraint failed'))return fail('Os dados mudaram durante a exclusão. Confira novamente.',409);throw error;}
 // History/conflicts/audit remain as traceability, not active inventory.
 return json({ok:true,id,photosPendingDeletion:await cleanPhotos(db,store)});
}
