import {photoStore} from './photo-storage.mjs';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const LIMIT=65536;
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
async function boundedBytes(request){
 if(Number(request.headers.get('content-length'))>LIMIT)throw Error('size');
 const reader=request.body?.getReader();if(!reader)throw Error('empty');const chunks=[];let n=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>LIMIT)throw Error('size');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(n);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;
}
export function validAvatarPng(b){
 if(b.length<57||b.length>LIMIT||![137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n))return false;
 const view=new DataView(b.buffer,b.byteOffset,b.byteLength);let offset=8,header=false,data=false;
 while(offset+12<=b.length){
  const n=view.getUint32(offset),end=offset+12+n;if(end>b.length)return false;
  const type=String.fromCharCode(...b.slice(offset+4,offset+8));
  if(!['IHDR','IDAT','IEND','sRGB','gAMA','pHYs'].includes(type))return false;
  let crc=0xffffffff;for(let i=offset+4;i<offset+8+n;i++){crc^=b[i];for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  if(((crc^0xffffffff)>>>0)!==view.getUint32(offset+8+n))return false;
  if(!header){if(type!=='IHDR'||n!==13)return false;const w=view.getUint32(offset+8),h=view.getUint32(offset+12);if(!w||!h||w>128||h>128||b[offset+16]!==8||![2,6].includes(b[offset+17])||b[offset+18]||b[offset+19]||b[offset+20])return false;header=true;}
  else if(type==='IHDR')return false;
  if(type==='IDAT')data=true;
  if(type==='IEND')return n===0&&data&&end===b.length;
  offset=end;
 }
 return false;
}
export async function technicianAvatarRoutes(request,url,user,env,{json,fail,body}){
 const endpoint=url.pathname.split('/').at(-1);
 if(!['avatar','avatar-info','avatar-remove'].includes(endpoint))return null;
 if(!url.pathname.startsWith('/api/dispatch/'))return fail('Operação inválida.',404);
 // Defense in depth: only root on the panel, including all image reads/304s.
 if(user.role!=='root'||env.APP_KIND==='collector')return fail('Somente root pode gerenciar imagens dos técnicos.',403);
 const db=env.DB,get=request.method==='GET';
 if(get){
  const id=url.searchParams.get('userId');if(!uuid(id))return fail('Usuário inválido.');
  const profile=await db.prepare('SELECT u.id,u.display_name,u.username,p.image_id,COALESCE(p.version,0) AS version FROM users u LEFT JOIN technician_profiles p ON p.user_id=u.id WHERE u.id=?').bind(id).first();
  if(!profile)return fail('Usuário não encontrado.',404);
  if(endpoint==='avatar-info')return json({userId:id,name:profile.display_name||profile.username,imageId:profile.image_id,version:profile.version});
  if(endpoint!=='avatar'||!profile.image_id||url.searchParams.get('imageId')!==profile.image_id)return fail('Imagem indisponível.',404);
  const row=await db.prepare('SELECT * FROM technician_avatar_uploads WHERE id=? AND user_id=? AND state=?').bind(profile.image_id,id,'applied').first();
  if(!row)return fail('Imagem indisponível.',404);
  try{
   const store=photoStore(env);if(store.provider!==row.storage_provider||!await store.enabled())return fail('Armazenamento da imagem indisponível.',503);
   const headers={'Content-Type':'image/png','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-cache','Vary':'Cookie','ETag':'"'+row.sha256+'"'};
   if(request.headers.get('if-none-match')===headers.ETag)return new Response(null,{status:304,headers});
   const image=await store.get(row);if(!image)return fail('Imagem não encontrada no armazenamento.',404);
   return new Response(image.body,{headers});
  }catch{return fail('Não foi possível carregar a imagem.',503);}
 }
 if(request.method!=='POST'||endpoint==='avatar-info')return fail('Operação inválida.',405);
 let id,operation,expected,bytes,sha,removing=endpoint==='avatar-remove';
 if(removing){const a=await body(request);id=a.userId;operation=a.operationId;expected=a.version;}
 else{
  if(request.headers.get('content-type')!=='image/png')return fail('Envie uma miniatura PNG.',415);
  id=request.headers.get('X-User-Id');operation=request.headers.get('X-Operation-Id');expected=Number(request.headers.get('X-Avatar-Version')??NaN);
  try{bytes=await boundedBytes(request);}catch{return fail('A imagem deve ter até 64 KB.',413);}
  if(!validAvatarPng(bytes))return fail('Imagem inválida. Escolha novamente uma imagem para preparar a miniatura.',422);
  sha=await hash(bytes);
 }
 if(!uuid(id)||!uuid(operation)||!Number.isSafeInteger(expected)||expected<0)return fail('Dados de alteração inválidos.');
 if(!await db.prepare('SELECT id FROM users WHERE id=?').bind(id).first())return fail('Usuário não encontrado.',404);
 const event=await db.prepare('SELECT * FROM technician_avatar_events WHERE operation_id=?').bind(operation).first();
 if(event){
  const same=event.user_id===id&&event.actor_id===user.id&&event.action===(removing?'remove':'upload')&&event.version===expected+1;
  const upload=removing?null:await db.prepare('SELECT sha256 FROM technician_avatar_uploads WHERE id=?').bind(operation).first();
  return same&&(removing||upload?.sha256===sha)?json({ok:true,replayed:true,version:event.version}):fail('Operação já utilizada.',409);
 }
 await db.prepare('INSERT OR IGNORE INTO technician_profiles(user_id) VALUES(?)').bind(id).run();
 const profile=await db.prepare('SELECT * FROM technician_profiles WHERE user_id=?').bind(id).first();
 if(profile.version!==expected)return fail('A imagem foi alterada em outra aba. Reabra este cadastro para atualizar.',409);
 if(removing&&await db.prepare('SELECT id FROM technician_avatar_uploads WHERE id=?').bind(operation).first())return fail('Operação já utilizada.',409);
 if(!removing){
  const store=photoStore(env);if(!store.provider)return fail('Configure o armazenamento de imagens.',503);
  await db.prepare("INSERT OR IGNORE INTO technician_avatar_uploads(id,user_id,actor_id,expected_version,sha256,byte_size,object_key,storage_provider,state,created_at) VALUES(?,?,?,?,?,?,?,?, 'pending',?)").bind(operation,id,user.id,expected,sha,bytes.length,'technician-avatars/'+id+'/'+operation+'.png',store.provider,Date.now()).run();
  const upload=await db.prepare('SELECT * FROM technician_avatar_uploads WHERE id=?').bind(operation).first();
  if(upload.user_id!==id||upload.actor_id!==user.id||upload.expected_version!==expected||upload.sha256!==sha||upload.storage_provider!==store.provider)return fail('Operação já utilizada ou provedor alterado.',409);
  if(upload.state==='conflict')return fail('Essa alteração conflitou com outra imagem. Reabra o cadastro.',409);
  if(upload.state==='pending'){
   const token=crypto.randomUUID(),now=Date.now();
   const lease=await db.prepare("UPDATE technician_avatar_uploads SET upload_token=?,upload_until=? WHERE id=? AND state='pending' AND (upload_until IS NULL OR upload_until<?)").bind(token,now+120000,operation,now).run();
   if(!lease.meta.changes)return fail('Este envio ainda está em andamento. Aguarde e tente novamente.',409);
   try{
    const result=await store.put({key:upload.object_key,bytes,mime:'image/png',photoId:operation,targetKind:'technician-avatar',targetId:id,sha256:sha,retry:true});
    const saved=await db.prepare("UPDATE technician_avatar_uploads SET storage_ref=?,state='ready',upload_token=NULL,upload_until=NULL WHERE id=? AND state='pending' AND upload_token=?").bind(result.ref,operation,token).run();
    if(!saved.meta.changes)return fail('A confirmação deste envio está em andamento. Tente novamente.',409);
   }catch{await db.prepare('UPDATE technician_avatar_uploads SET upload_token=NULL,upload_until=NULL WHERE id=? AND upload_token=?').bind(operation,token).run();return fail('Não foi possível confirmar o envio da imagem. A imagem anterior foi mantida; tente novamente.',503);}
  }
 }
 const now=Date.now(),imageId=removing?null:operation;
 const changes=await db.batch([
  db.prepare('UPDATE technician_profiles SET image_id=?,version=version+1,last_operation=?,updated_at=?,updated_by=? WHERE user_id=? AND version=?').bind(imageId,operation,now,user.id,id,expected),
  db.prepare('INSERT OR IGNORE INTO technician_avatar_events SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM technician_profiles WHERE user_id=? AND last_operation=?)').bind(operation,id,user.id,removing?'remove':'upload',profile.image_id,imageId,expected+1,now,id,operation),
  ...(!removing?[db.prepare("UPDATE technician_avatar_uploads SET state=CASE WHEN EXISTS(SELECT 1 FROM technician_avatar_events WHERE operation_id=?) THEN 'applied' ELSE 'conflict' END WHERE id=? AND state='ready'").bind(operation,operation)]:[])
 ]);
 if(!changes[0].meta.changes){const done=await db.prepare('SELECT operation_id FROM technician_avatar_events WHERE operation_id=?').bind(operation).first();if(!done)return fail('Outra alteração foi salva primeiro. Reabra o cadastro para conferir.',409);}
 return json({ok:true,version:expected+1});
}
