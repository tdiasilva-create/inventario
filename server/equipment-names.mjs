const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const eligible="e.category IN ('computer','desktop','notebook','printer') AND u.unit_type!='Escola conveniada'";
export async function equipmentNameRoutes(request,url,user,env,{json,fail,body}){
 if(url.pathname!=='/api/root/equipment-name')return null;
 if(user.role!=='root'||env.APP_KIND==='collector')return fail('Somente root pode editar nomes de equipamentos pelo painel.',403);
 if(!['GET','POST'].includes(request.method))return fail('Método não permitido.',405);
 const a=request.method==='POST'?await body(request):Object.fromEntries(url.searchParams),{id,unitId,version,operationId}=a;
 if(!uuid(id)||!uuid(unitId))return fail('Identificação do equipamento inválida.');
 const db=env.DB;
 const current=()=>db.prepare(`SELECT e.id,e.unit_id,e.category,n.name,COALESCE(n.version,0) AS name_version FROM equipments e JOIN units u ON u.id=e.unit_id LEFT JOIN equipment_names n ON n.equipment_id=e.id AND n.unit_id=e.unit_id WHERE e.id=? AND e.unit_id=? AND ${eligible}`).bind(id,unitId).first();
 const old=await current();if(!old)return fail('Computador ou impressora não encontrado nesta unidade.',404);
 if(request.method==='GET')return json({equipment:old,history:(await db.prepare('SELECT before_name,after_name,actor_name,created_at FROM equipment_name_events WHERE equipment_id=? AND unit_id=? ORDER BY to_version DESC LIMIT 20').bind(id,unitId).all()).results});
 const name=typeof a.name==='string'?a.name.trim().replace(/\s+/g,' '):'';
 if(!uuid(operationId)||!Number.isSafeInteger(version)||version<0||!name||name.length>180||/[\u0000-\u001f\u007f]/.test(a.name||'')||Object.keys(a).some(k=>!['id','unitId','name','version','operationId'].includes(k)))return fail('Informe um nome de até 180 caracteres e atualize a ficha se necessário.');
 const payload=JSON.stringify({id,unitId,version,name});
 const receipt=()=>db.prepare('SELECT actor_id,payload_json FROM equipment_name_events WHERE operation_id=?').bind(operationId).first();
 const matches=r=>r?.actor_id===user.id&&r.payload_json===payload;
 const existing=await receipt();if(existing)return matches(existing)?json({equipment:await current(),replayed:true}):fail('Identificador de alteração já utilizado.',409);
 const conflict=async()=>{
  const server=await current();
  await db.prepare('INSERT INTO collection_conflicts(id,unit_id,entity_id,actor_id,attempted_json,server_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),unitId,id,user.id,JSON.stringify({name,version}),JSON.stringify(server),Date.now()).run();
  return json({error:'O nome mudou durante a edição. Confira o nome atual antes de salvar.',conflict:true,server},409);
 };
 if(old.name_version!==version)return conflict();
 if(old.name===name)return json({equipment:old,unchanged:true});
 const now=Date.now();
 try{
  const out=await db.batch([
   db.prepare(`INSERT INTO equipment_names(equipment_id,unit_id,name,version,updated_at,updated_by)
    SELECT e.id,e.unit_id,?,?,?,? FROM equipments e JOIN units u ON u.id=e.unit_id LEFT JOIN equipment_names n ON n.equipment_id=e.id
    WHERE e.id=? AND e.unit_id=? AND ${eligible} AND COALESCE(n.version,0)=?
    ON CONFLICT(equipment_id) DO UPDATE SET name=excluded.name,version=excluded.version,updated_at=excluded.updated_at,updated_by=excluded.updated_by WHERE equipment_names.version=?`)
    .bind(name,version+1,now,user.id,id,unitId,version,version),
   db.prepare('INSERT INTO equipment_name_events(operation_id,equipment_id,unit_id,actor_id,actor_name,before_name,after_name,from_version,to_version,payload_json,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1')
    .bind(operationId,id,unitId,user.id,user.display_name||user.username,old.name,name,version,version+1,payload,now)
  ]);
  if(!out[0].meta.changes){if(matches(await receipt()))return json({equipment:await current(),replayed:true});return conflict();}
 }catch(error){if(matches(await receipt()))return json({equipment:await current(),replayed:true});if(/UNIQUE constraint/i.test(error.message))return fail('Identificador de alteração já utilizado. Reabra a ficha.',409);throw error;}
 return json({equipment:await current()});
}
