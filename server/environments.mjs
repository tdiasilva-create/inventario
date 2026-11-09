import {environmentKey} from './collector-v2.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export async function renameEnvironment(db,user,input,{unitId,inspectionId=null,json,fail}){
 const {id,operationId,version}=input;
 const name=typeof input.name==='string'?input.name.trim().replace(/\s+/g,' '):'';
 if(!uuid(id)||!uuid(operationId)||!Number.isSafeInteger(version)||version<1)return fail('Identificação da alteração inválida. Atualize a lista.');
 if(!name||name.length>180)return fail('Informe o nome do ambiente (até 180 caracteres).');
 const payload=JSON.stringify({id,unitId,inspectionId,version,name});
 const current=()=>db.prepare('SELECT id,unit_id,name,type,name_version FROM environments WHERE id=? AND unit_id=?').bind(id,unitId).first();
 const receipt=await db.prepare('SELECT actor_id,payload_json FROM environment_name_events WHERE operation_id=?').bind(operationId).first();
 if(receipt){if(receipt.actor_id!==user.id||receipt.payload_json!==payload)return fail('Identificador de alteração já utilizado.',409);return json({environment:await current(),replayed:true});}
 if(inspectionId){
  const visit=await db.prepare('SELECT state FROM inspections WHERE id=? AND unit_id=?').bind(inspectionId,unitId).first();
  if(visit?.state!=='open')return fail('Inicie uma nova visita para corrigir o ambiente pelo coletor.',409);
  const card=await db.prepare("SELECT state FROM inspection_sections WHERE inspection_id=? AND section='B'").bind(inspectionId).first();
  if(card?.state==='Concluído')return fail('Confirme a reabertura do assunto Ambientes antes de editar.',409);
 }
 const old=await current();if(!old)return fail('Ambiente não encontrado nesta unidade.',404);
 async function conflict(message){
  const stored=await current();
  await db.prepare('INSERT INTO collection_conflicts(id,unit_id,entity_id,actor_id,attempted_json,server_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),unitId,id,user.id,JSON.stringify({name,version}),JSON.stringify(stored),Date.now()).run();
  return json({error:message,conflict:true,server:stored},409);
 }
 if(old.name_version!==version)return conflict('Este ambiente foi alterado por outra pessoa. Confira o nome atual antes de salvar.');
 if(old.name===name)return json({environment:old,unchanged:true});
 const others=(await db.prepare('SELECT id,name FROM environments WHERE unit_id=? AND id<>?').bind(unitId,id).all()).results;
 if(others.some(r=>environmentKey(r.name)===environmentKey(name)))return fail('Já existe outro ambiente com esse nome nesta unidade. Escolha um nome diferente; os cadastros não serão unidos.',409);
 const guard=inspectionId?" AND EXISTS(SELECT 1 FROM inspections i JOIN units u ON u.id=i.unit_id WHERE i.id=? AND i.unit_id=environments.unit_id AND i.state='open' AND u.active=1) AND NOT EXISTS(SELECT 1 FROM inspection_sections WHERE inspection_id=? AND section='B' AND state='Concluído')":'';
 const now=Date.now(),before=JSON.stringify({name:old.name,version}),after=JSON.stringify({name,version:version+1});
 try{
  const result=await db.batch([
   db.prepare('UPDATE environments SET name=?,name_key=?,name_version=name_version+1 WHERE id=? AND unit_id=? AND name_version=?'+guard).bind(name,environmentKey(name),id,unitId,version,...(inspectionId?[inspectionId,inspectionId]:[])),
   db.prepare('INSERT INTO environment_name_events(operation_id,environment_id,unit_id,inspection_id,actor_id,before_name,after_name,from_version,to_version,payload_json,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1').bind(operationId,id,unitId,inspectionId,user.id,old.name,name,version,version+1,payload,now),
   ...(inspectionId?[
    db.prepare("UPDATE inspections SET revision=revision+1,updated_at=? WHERE id=? AND EXISTS(SELECT 1 FROM environment_name_events WHERE operation_id=?)").bind(now,inspectionId,operationId),
    db.prepare("UPDATE inspection_sections SET state='Em andamento' WHERE inspection_id=? AND section='B' AND state='Pendente' AND EXISTS(SELECT 1 FROM environment_name_events WHERE operation_id=?)").bind(inspectionId,operationId),
    db.prepare("INSERT INTO collection_history(id,unit_id,inspection_id,entity_id,event,before_json,after_json,actor_id,created_at) SELECT ?,?,?,?,'environment_renamed',?,?,?,? WHERE EXISTS(SELECT 1 FROM environment_name_events WHERE operation_id=?)").bind(operationId,unitId,inspectionId,id,before,after,user.id,now,operationId)
   ]:[])
  ]);
  if(!result[0].meta.changes){
   const repeated=await db.prepare('SELECT actor_id,payload_json FROM environment_name_events WHERE operation_id=?').bind(operationId).first();
   if(repeated?.actor_id===user.id&&repeated.payload_json===payload)return json({environment:await current(),replayed:true});
   return conflict('O ambiente ou a situação da visita mudou. Atualize a lista; se necessário, reabra o assunto Ambientes.');
  }
 }catch(error){
  // Two identical requests may both miss the initial receipt read.
  const repeated=await db.prepare('SELECT actor_id,payload_json FROM environment_name_events WHERE operation_id=?').bind(operationId).first();
  if(repeated?.actor_id===user.id&&repeated.payload_json===payload)return json({environment:await current(),replayed:true});
  if(/UNIQUE constraint/i.test(error.message))return fail('Outro cadastro já utiliza este nome ou esta alteração. Atualize a lista.',409);
  throw error;
 }
 return json({environment:await current()});
}
export async function rootEnvironmentRoutes(request,url,user,env,{json,fail,body}){
 if(!['/api/root/environments','/api/root/environment-rename'].includes(url.pathname))return null;
 if(user.role!=='root'||env.APP_KIND==='collector')return fail('Somente root pode corrigir ambientes pelo painel.',403);
 const data=request.method==='POST'?await body(request):{},unitId=data.unitId||url.searchParams.get('unitId');
 if(!uuid(unitId)||!await env.DB.prepare('SELECT id FROM units WHERE id=?').bind(unitId).first())return fail('Unidade não encontrada.',404);
 if(url.pathname==='/api/root/environments'&&request.method==='GET')return json({environments:(await env.DB.prepare('SELECT id,name,type,name_version FROM environments WHERE unit_id=? ORDER BY name COLLATE NOCASE,id').bind(unitId).all()).results});
 if(url.pathname==='/api/root/environment-rename'&&request.method==='POST')return renameEnvironment(env.DB,user,data,{unitId,json,fail});
 return fail('Método não permitido.',405);
}
