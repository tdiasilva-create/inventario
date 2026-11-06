// Camada de armazenamento de fotografias (proposta D-047).
// Provedores: 'r2' (binding env.PHOTOS, implementação original preservada) e 'google-drive'
// (pasta privada criada pela aplicação no Meu Drive da conta institucional, escopo drive.file).
// Nenhum segredo sai do servidor: refresh/access token ficam cifrados (AES-GCM) no D1 com chave em GOOGLE_TOKEN_KEY.
export const DRIVE_PROVIDER='google-drive',R2_PROVIDER='r2';
export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.file';
export const DRIVE_FOLDER_NAME='Inventário Tecnológico SEMED';
const DRIVE_API='https://www.googleapis.com/drive/v3',DRIVE_UPLOAD='https://www.googleapis.com/upload/drive/v3/files',TOKEN_URL='https://oauth2.googleapis.com/token';
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))),unb64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
export class StorageError extends Error{constructor(message,status=503,code='storage'){super(message);this.status=status;this.code=code;}}

// ---- criptografia dos tokens ----
async function tokenKey(env){
 const raw=String(env.GOOGLE_TOKEN_KEY||'').trim();if(!raw)throw new StorageError('Chave de proteção de tokens não configurada.',503,'not_configured');
 let bytes;try{bytes=unb64(raw);}catch{throw new StorageError('Chave de proteção de tokens inválida.',503,'not_configured');}
 if(bytes.byteLength!==32)throw new StorageError('Chave de proteção de tokens deve ter 32 bytes (base64).',503,'not_configured');
 return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);
}
export async function seal(env,plain){const key=await tokenKey(env),iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(plain));const out=new Uint8Array(12+cipher.byteLength);out.set(iv,0);out.set(new Uint8Array(cipher),12);return 'v1:'+b64(out);}
export async function open(env,sealed){if(!sealed||!String(sealed).startsWith('v1:'))throw new StorageError('Token armazenado em formato desconhecido.',503,'token');const key=await tokenKey(env),bytes=unb64(String(sealed).slice(3));try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},key,bytes.slice(12)));}catch{throw new StorageError('Não foi possível decifrar o token armazenado. Reconecte o Google Drive.',503,'token');}}

// ---- configuração ----
export const driveConfigured=env=>!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET&&env.GOOGLE_TOKEN_KEY);
export function providerFor(env){const wanted=String(env.PHOTO_STORAGE_PROVIDER||'').trim().toLowerCase();if(wanted===DRIVE_PROVIDER)return DRIVE_PROVIDER;if(wanted===R2_PROVIDER)return env.PHOTOS?R2_PROVIDER:null;if(wanted)return null;return env.PHOTOS?R2_PROVIDER:null;}
export const integrationRow=db=>db.prepare('SELECT * FROM integration_tokens WHERE provider=?').bind(DRIVE_PROVIDER).first();
export const logIntegration=(db,event,actor,detail)=>db.prepare('INSERT INTO integration_events(provider,event,actor_id,detail,created_at) VALUES(?,?,?,?,?)').bind(DRIVE_PROVIDER,event,actor||null,detail?String(detail).slice(0,1000):null,Date.now());

// ---- Google Drive: token de acesso ----
export async function accessToken(env,db,{fetchImpl=fetch,now=Date.now()}={}){
 if(!driveConfigured(env))throw new StorageError('Integração Google Drive não configurada no servidor.',503,'not_configured');
 const row=await integrationRow(db);if(!row||!row.refresh_token_enc||row.revoked_at)throw new StorageError('Google Drive não autorizado. Solicite ao root a conexão em Configurações.',503,'not_connected');
 if(row.access_token_enc&&row.access_token_expires_at>now+60000)return {token:await open(env,row.access_token_enc),row};
 const refresh=await open(env,row.refresh_token_enc);
 const response=await fetchImpl(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,refresh_token:refresh,grant_type:'refresh_token'})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.access_token){
  const reason=String(data.error||response.status);
  if(['invalid_grant','unauthorized_client'].includes(data.error)){await db.batch([db.prepare('UPDATE integration_tokens SET revoked_at=?,access_token_enc=NULL,access_token_expires_at=NULL,last_error=? WHERE provider=?').bind(now,'refresh:'+reason,DRIVE_PROVIDER),logIntegration(db,'authorization_revoked',null,reason)]);throw new StorageError('A autorização do Google Drive foi revogada ou expirou. Reconecte em Configurações.',503,'revoked');}
  await db.prepare('UPDATE integration_tokens SET last_error=? WHERE provider=?').bind('refresh:'+reason,DRIVE_PROVIDER).run();
  throw new StorageError('Não foi possível renovar o acesso ao Google Drive. Tente novamente.',503,'refresh_failed');
 }
 const expires=now+Math.max(60,Number(data.expires_in)||3600)*1000;
 await db.prepare('UPDATE integration_tokens SET access_token_enc=?,access_token_expires_at=?,last_refresh_at=?,last_error=NULL WHERE provider=?').bind(await seal(env,data.access_token),expires,now,DRIVE_PROVIDER).run();
 return {token:data.access_token,row};
}

// ---- Google Drive: chamadas ----
async function driveFetch(token,fetchImpl,path,init={}){
 const response=await fetchImpl(path.startsWith('http')?path:DRIVE_API+path,{...init,headers:{Authorization:'Bearer '+token,...(init.headers||{})}});
 return response;
}
async function driveJson(token,fetchImpl,path,init){const r=await driveFetch(token,fetchImpl,path,init);const data=await r.json().catch(()=>({}));if(!r.ok)throw new StorageError(driveMessage(r.status,data),r.status===401||r.status===403?503:502,'drive_'+r.status);return data;}
function driveMessage(status,data){const reason=data?.error?.errors?.[0]?.reason||data?.error?.status||'';if(status===401)return 'Acesso ao Google Drive expirou. Tente novamente.';if(status===403&&/storageQuotaExceeded|quota/i.test(reason+JSON.stringify(data?.error?.message||'')))return 'Sem espaço disponível no Google Drive institucional. Nenhuma foto foi gravada.';if(status===403)return 'O Google Drive recusou a operação (permissão insuficiente).';if(status===404)return 'Arquivo ou pasta não encontrado no Google Drive.';if(status===429||status>=500)return 'Google Drive temporariamente indisponível. Tente novamente.';return 'Falha ao comunicar com o Google Drive ('+status+').';}
const q=v=>String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
export async function createFolder(token,fetchImpl,name,parent){return driveJson(token,fetchImpl,'/files?fields=id,name&supportsAllDrives=true',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:'application/vnd.google-apps.folder',...(parent?{parents:[parent]}:{})})});}
export async function findByProperty(token,fetchImpl,key,value,extra=''){const data=await driveJson(token,fetchImpl,'/files?q='+encodeURIComponent(`appProperties has { key='${q(key)}' and value='${q(value)}' } and trashed=false${extra}`)+'&fields=files(id,name,size,parents)&pageSize=5&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true');return data.files||[];}
export async function multipartUpload(token,fetchImpl,{name,mime,bytes,parents,appProperties,description}){
 const boundary='semed-'+crypto.randomUUID(),meta=JSON.stringify({name,mimeType:mime,parents,appProperties,description});
 const head=new TextEncoder().encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`),tail=new TextEncoder().encode(`\r\n--${boundary}--`);
 const body=new Uint8Array(head.byteLength+bytes.byteLength+tail.byteLength);body.set(head,0);body.set(new Uint8Array(bytes),head.byteLength);body.set(tail,head.byteLength+bytes.byteLength);
 return driveJson(token,fetchImpl,DRIVE_UPLOAD+'?uploadType=multipart&fields=id,name,size,md5Checksum&supportsAllDrives=true',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
}
export async function deleteFile(token,fetchImpl,id){const r=await driveFetch(token,fetchImpl,'/files/'+encodeURIComponent(id)+'?supportsAllDrives=true',{method:'DELETE'});if(r.ok||r.status===404)return true;const data=await r.json().catch(()=>({}));throw new StorageError(driveMessage(r.status,data),502,'drive_'+r.status);}
export async function about(token,fetchImpl){return driveJson(token,fetchImpl,'/about?fields=user(emailAddress,displayName),storageQuota');}
export async function fileMeta(token,fetchImpl,id){const r=await driveFetch(token,fetchImpl,'/files/'+encodeURIComponent(id)+'?fields=id,name,trashed,mimeType&supportsAllDrives=true');if(!r.ok)return null;const d=await r.json().catch(()=>null);return d&&!d.trashed?d:null;}

const safeName=v=>String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9 ._-]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
const ext=mime=>mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';

// ---- provedores ----
function r2Store(bucket){
 return {provider:R2_PROVIDER,async enabled(){return !!bucket;},async status(){return {provider:R2_PROVIDER,enabled:!!bucket};},
  async put({key,bytes,mime,photoId}){if(!bucket)throw new StorageError('Armazenamento de fotos ainda indisponível. Nenhum upload confirmado.');await bucket.put(key,bytes,{httpMetadata:{contentType:mime},customMetadata:{photoId}});return {ref:null,provider:R2_PROVIDER};},
  async get(row){if(!bucket)throw new StorageError('Fotografias indisponíveis.');const object=await bucket.get(row.object_key);return object?{body:object.body}:null;},
  async delete(row){if(!bucket)throw new StorageError('Armazenamento indisponível.');if(row.storage_provider&&row.storage_provider!==R2_PROVIDER)throw new StorageError('Arquivo pertence a outro provedor ('+row.storage_provider+').',409,'provider_mismatch');await bucket.delete(row.object_key);return true;}};
}
function driveStore(env,db,fetchImpl){
 let cached=null;const row=async()=>cached??=await integrationRow(db);
 const ready=async()=>{if(!driveConfigured(env))return false;const r=await row();return !!(r&&r.refresh_token_enc&&!r.revoked_at&&r.folder_id);};
 const tok=()=>accessToken(env,db,{fetchImpl});
 async function unitFolder(token,unitId,unitName,rootFolder){
  const hit=await db.prepare('SELECT folder_id FROM integration_folders WHERE provider=? AND scope_key=?').bind(DRIVE_PROVIDER,'unit:'+unitId).first();if(hit)return hit.folder_id;
  const found=await findByProperty(token,fetchImpl,'semedUnitId',unitId,` and mimeType='application/vnd.google-apps.folder'`);
  let id=found[0]?.id;
  if(!id){const created=await driveJson(token,fetchImpl,'/files?fields=id&supportsAllDrives=true',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:(safeName(unitName)||'Unidade')+' ['+unitId.slice(0,8)+']',mimeType:'application/vnd.google-apps.folder',parents:[rootFolder],appProperties:{semedUnitId:unitId}})});id=created.id;}
  await db.prepare('INSERT OR IGNORE INTO integration_folders(provider,scope_key,folder_id,created_at) VALUES(?,?,?,?)').bind(DRIVE_PROVIDER,'unit:'+unitId,id,Date.now()).run();return id;
 }
 return {provider:DRIVE_PROVIDER,enabled:ready,
  async status(){const r=await row();return {provider:DRIVE_PROVIDER,configured:driveConfigured(env),enabled:await ready(),connected:!!(r&&r.refresh_token_enc&&!r.revoked_at),accountEmail:r?.account_email||null,folderId:r?.folder_id||null,folderName:r?.folder_name||null,connectedAt:r?.connected_at||null,lastRefreshAt:r?.last_refresh_at||null,lastTestAt:r?.last_test_at||null,lastTestResult:r?.last_test_result||null,revokedAt:r?.revoked_at||null,lastError:r?.last_error||null};},
  async put({key,bytes,mime,photoId,unitId,unitName,inspectionId,targetKind,targetId,sha256}){
   if(!await ready())throw new StorageError('Armazenamento de fotos ainda indisponível. Nenhum upload confirmado.',503,'not_connected');
   const {token,row:r}=await tok();
   // Idempotência: uma tentativa anterior pode ter gravado o arquivo sem confirmar no D1.
   const existing=await findByProperty(token,fetchImpl,'semedPhotoId',photoId);if(existing[0])return {ref:existing[0].id,provider:DRIVE_PROVIDER,reused:true};
   const parent=await unitFolder(token,unitId,unitName,r.folder_id);
   const file=await multipartUpload(token,fetchImpl,{name:`${targetKind}_${photoId}.${ext(mime)}`,mime,bytes,parents:[parent],appProperties:{semedPhotoId:photoId,semedUnitId:unitId,semedInspectionId:inspectionId,semedTargetKind:targetKind,semedTargetId:targetId,semedSha256:sha256,semedKey:key},description:'Inventário Tecnológico SEMED · evidência de coleta · '+targetKind});
   return {ref:file.id,provider:DRIVE_PROVIDER,reused:false};
  },
  async get(row){if(!await ready())throw new StorageError('Fotografias indisponíveis.',503,'not_connected');if(!row.storage_ref)return null;const {token}=await tok();const r=await driveFetch(token,fetchImpl,'/files/'+encodeURIComponent(row.storage_ref)+'?alt=media&supportsAllDrives=true');if(r.status===404)return null;if(!r.ok)throw new StorageError(driveMessage(r.status,await r.json().catch(()=>({}))),502,'drive_'+r.status);return {body:r.body};},
  async delete(row){if(row.storage_provider&&row.storage_provider!==DRIVE_PROVIDER)throw new StorageError('Arquivo pertence a outro provedor ('+row.storage_provider+').',409,'provider_mismatch');if(!await ready())throw new StorageError('Armazenamento indisponível.',503,'not_connected');if(!row.storage_ref)return true;const {token}=await tok();return deleteFile(token,fetchImpl,row.storage_ref);},
  async selfTest(actor){const {token,row:r}=await tok();const started=Date.now();const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII='),c=>c.charCodeAt(0));const name='TESTE_CONEXAO_SEMED_'+new Date(started).toISOString().replace(/[:.]/g,'-')+'.png';let result;try{const file=await multipartUpload(token,fetchImpl,{name,mime:'image/png',bytes:png,parents:[r.folder_id],appProperties:{semedTest:'1'},description:'Arquivo de teste da integração; pode ser removido.'});await deleteFile(token,fetchImpl,file.id);result={ok:true,fileId:file.id,name,durationMs:Date.now()-started};}catch(error){result={ok:false,error:error.message,durationMs:Date.now()-started};}await db.batch([db.prepare('UPDATE integration_tokens SET last_test_at=?,last_test_result=? WHERE provider=?').bind(started,result.ok?'ok':'erro: '+result.error,DRIVE_PROVIDER),logIntegration(db,result.ok?'self_test_ok':'self_test_failed',actor,result.ok?name:result.error)]);cached=null;return result;}};
}
function disabledStore(reason){return {provider:null,reason,async enabled(){return false;},async status(){return {provider:null,enabled:false,reason};},async put(){throw new StorageError('Armazenamento de fotos ainda indisponível. Nenhum upload confirmado.',503,'disabled');},async get(){throw new StorageError('Fotografias indisponíveis.',503,'disabled');},async delete(){throw new StorageError('Armazenamento indisponível.',503,'disabled');}};}

// Ponto único de escolha do provedor. `photos` mantém compatibilidade com chamadas antigas que passavam o binding R2.
export function photoStore(env,{db=env?.DB,fetchImpl=fetch,photos}={}){
 if(photos)return r2Store(photos);
 const provider=providerFor(env||{});
 if(provider===DRIVE_PROVIDER)return db?driveStore(env,db,fetchImpl):disabledStore('Banco indisponível para a integração Google Drive.');
 if(provider===R2_PROVIDER)return r2Store(env.PHOTOS);
 return disabledStore(env?.PHOTO_STORAGE_PROVIDER?'Provedor de fotos desconhecido: '+env.PHOTO_STORAGE_PROVIDER:'Nenhum armazenamento de fotos configurado.');
}
