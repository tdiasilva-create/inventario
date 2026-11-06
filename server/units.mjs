import {validateUnit} from './unit-validation.mjs';
import {unitDeletion} from './unit-deletion.mjs';
import {operatorUnitAccess,operatorUnitParams} from './collector-access.mjs';
export {validateUnit} from './unit-validation.mjs';
export async function unitRoutes(request,url,user,db,{json,fail,body,audit,photos,store}){
 const path=url.pathname;
 const deletion=await unitDeletion(request,url,user,db,{json,fail,body,audit,photos,store});if(deletion)return deletion;
 if(path==='/api/units'&&request.method==='GET'){
  const query=`SELECT u.*,
   COALESCE((SELECT SUM(pc.records) FROM published_equipment_counts pc WHERE pc.unit_id=u.id),0) AS inventory_records,
   COALESCE((SELECT records FROM unit_collection_totals t WHERE t.unit_id=u.id),0) AS draft_records,
   EXISTS(SELECT 1 FROM inspections i WHERE i.unit_id=u.id AND i.state='open') AS collection_started
   FROM units u WHERE u.active=1 ${user.role==='operador'?'AND '+operatorUnitAccess():''} ORDER BY u.name COLLATE NOCASE`;
  const stmt=db.prepare(query);return json({units:(await (user.role==='operador'?stmt.bind(...operatorUnitParams(user)):stmt).all()).results});
 }
 if(!path.startsWith('/api/root/'))return null;
 if(user.role!=='root')return fail('Somente root pode administrar unidades e atribuições.',403);
 if(path==='/api/root/units'&&request.method==='GET')return json({units:(await db.prepare("SELECT u.*,(SELECT i.id FROM inspections i WHERE i.unit_id=u.id AND i.state='open') AS open_inspection FROM units u ORDER BY u.name").all()).results});
 if(path==='/api/root/unit-save'&&request.method==='POST'){
  const data=await body(request);const old=data.id?await db.prepare('SELECT * FROM units WHERE id=?').bind(String(data.id)).first():null;const checked=validateUnit({...old,...data,active:data.active??(old?!!old.active:true)});if(checked.error)return json({error:checked.error,fields:checked.fields},400);const v=checked.value;
  if(data.id&&!old)return fail('Unidade não encontrada.',404);
  if(old&&(!Number.isInteger(data.version)||old.version!==data.version))return fail('Unidade alterada por outro acesso. Recarregue antes de salvar.',409);
  const duplicate=await db.prepare('SELECT id FROM units WHERE (name_key=? OR (code IS NOT NULL AND code=?)) AND id<>?').bind(v.name_key,v.code,old?.id||'').first();if(duplicate){const row=await db.prepare('SELECT name,code FROM units WHERE id=?').bind(duplicate.id).first();const field=v.code&&row.code===v.code?'code':'name';const message=field==='code'?'INEP já cadastrado em '+row.name:'Nome já cadastrado: '+row.name;return json({error:message,fields:{[field]:message}},409);}
  const now=Date.now(),id=old?.id||crypto.randomUUID();let stmt;
  if(old)stmt=db.prepare('UPDATE units SET name=?,name_key=?,code=?,address=?,neighborhood=?,latitude=?,longitude=?,active=?,manager_name=?,unit_type=?,region=?,phone=?,email=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(v.name,v.name_key,v.code,v.address,v.neighborhood,v.latitude,v.longitude,v.active,v.manager_name,v.unit_type,v.region,v.phone,v.email,now,id,data.version);
  else stmt=db.prepare('INSERT INTO units(id,name,name_key,code,address,neighborhood,latitude,longitude,active,manager_name,unit_type,region,phone,email,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,v.name,v.name_key,v.code,v.address,v.neighborhood,v.latitude,v.longitude,v.active,v.manager_name,v.unit_type,v.region,v.phone,v.email,now,now);
  const result=await db.batch([stmt,db.prepare('INSERT INTO unit_changes(actor_id,event,target_id,payload,created_at) VALUES(?,?,?,?,?)').bind(user.id,old?'unit_updated':'unit_created',id,JSON.stringify({before:old,after:v}),now),audit(db,user.id,(old?'unit_updated:':'unit_created:')+id)]);
  if(!result[0].meta.changes)return fail('Conflito de atualização. Recarregue.',409);return json({id},old?200:201);
 }
 if(path==='/api/root/assignments'&&request.method==='GET')return json({operators:(await db.prepare("SELECT id,username,display_name,active FROM users WHERE role='operador' ORDER BY username").all()).results,assignments:(await db.prepare('SELECT user_id,unit_id FROM unit_assignments').all()).results});
 if(path==='/api/root/assignments'&&request.method==='POST'){
  const data=await body(request),target=await db.prepare("SELECT id FROM users WHERE id=? AND role='operador' AND active=1").bind(String(data.userId)).first();if(!target)return fail('Selecione um operador ativo.');
  if(!Array.isArray(data.unitIds)||data.unitIds.length>200||data.unitIds.some(id=>typeof id!=='string'))return fail('Seleção de unidades inválida (máximo 200 por atribuição).');
  const ids=[...new Set(data.unitIds)],activeIds=new Set((await db.prepare('SELECT id FROM units WHERE active=1').all()).results.map(x=>x.id));if(ids.some(id=>!activeIds.has(id)))return fail('Seleção contém unidade inexistente ou inativa.');
  const old=(await db.prepare('SELECT unit_id FROM unit_assignments WHERE user_id=?').bind(target.id).all()).results.map(r=>r.unit_id);const now=Date.now();
  await db.batch([db.prepare('DELETE FROM unit_assignments WHERE user_id=?').bind(target.id),db.prepare('INSERT INTO unit_assignments(user_id,unit_id,assigned_by,assigned_at) SELECT ?,value,?,? FROM json_each(?)').bind(target.id,user.id,now,JSON.stringify(ids)),db.prepare('INSERT INTO unit_changes(actor_id,event,target_id,payload,created_at) VALUES(?,?,?,?,?)').bind(user.id,'assignments_changed',target.id,JSON.stringify({before:old,after:ids}),now),audit(db,user.id,'assignments_changed:'+target.id)]);return json({ok:true});
 }
 if(path==='/api/root/user-role'&&request.method==='POST'){
  const data=await body(request);if(!['root','admin','operador','visualizador'].includes(data.role))return fail('Perfil inválido.');const target=await db.prepare('SELECT id,role FROM users WHERE id=?').bind(String(data.userId)).first();if(!target||target.id===user.id)return fail('Não é permitido alterar o próprio perfil por esta operação.',403);
  await db.batch([db.prepare('UPDATE users SET role=?,credential_version=credential_version+1 WHERE id=?').bind(data.role,target.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id),...(data.role==='operador'?[]:[db.prepare('DELETE FROM unit_assignments WHERE user_id=?').bind(target.id)]),audit(db,user.id,'role_changed:'+target.id)]);return json({ok:true});
 }
 return fail('Operação não encontrada.',404);
}
