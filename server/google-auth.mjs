// Autorização OAuth 2.0 (fluxo de servidor web) da conta institucional para a pasta privada de fotografias.
// Somente root inicia/administra. O responsável autoriza na tela oficial do Google; o servidor guarda apenas tokens cifrados.
import {DRIVE_PROVIDER,DRIVE_SCOPE,DRIVE_FOLDER_NAME,driveConfigured,seal,open,integrationRow,logIntegration,createFolder,fileMeta,about,photoStore,StorageError} from './photo-storage.mjs';
import {digest} from './security.mjs';
const AUTH_URL='https://accounts.google.com/o/oauth2/v2/auth',TOKEN_URL='https://oauth2.googleapis.com/token',REVOKE_URL='https://oauth2.googleapis.com/revoke';
const OAUTH_COOKIE='__Host-semed-oauth',STATE_TTL=10*60*1000;
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const cookieValue=(request,name)=>(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';
const oauthCookie=(value,seconds)=>`${OAUTH_COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const redirectUri=url=>url.origin+'/api/root/google/callback';
// A volta do Google é uma navegação de outro site: o cookie de sessão (SameSite=Strict) não acompanha.
// Por isso a resposta é uma página com link, e a validação usa o estado gravado no D1 + cookie Lax de curta duração.
function resultPage(ok,title,detail){
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} • SEMED</title><body style="background:#041927;color:#e5f5ff;font:16px Segoe UI,sans-serif;padding:48px 24px;line-height:1.7;max-width:720px;margin:auto"><h1 style="font-size:24px;color:${ok?'#45df72':'#ffcf3e'}">${esc(title)}</h1><p>${esc(detail)}</p><p><a style="color:#42caff;font-weight:600" href="/configuracoes?google=${ok?'conectado':'erro'}">Voltar às Configurações do painel</a></p><p style="opacity:.7;font-size:14px">Inventário Tecnológico SEMED · Paço do Lumiar</p></body></html>`;
 return new Response(html,{status:ok?200:400,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Set-Cookie':oauthCookie('',0)}});
}
export async function googleRoutes(request,url,user,env,{json,fail,audit,fetchImpl=fetch,now=()=>Date.now()}){
 const p=url.pathname;if(!p.startsWith('/api/root/google/')||p==='/api/root/google/callback')return null;
 const db=env.DB;
 if(user.role!=='root')return fail('Somente root administra a integração com o Google Drive.',403);
 const store=photoStore(env,{db,fetchImpl});
 if(p==='/api/root/google/status'&&request.method==='GET'){
  const row=await integrationRow(db),events=(await db.prepare('SELECT event,detail,created_at FROM integration_events WHERE provider=? ORDER BY id DESC LIMIT 10').bind(DRIVE_PROVIDER).all()).results;
  return json({provider:String(env.PHOTO_STORAGE_PROVIDER||'').toLowerCase()||null,activeProvider:store.provider,photosEnabled:await store.enabled(),configured:driveConfigured(env),connected:!!(row&&row.refresh_token_enc&&!row.revoked_at),accountEmail:row?.account_email||null,accountName:row?.account_name||null,folderId:row?.folder_id||null,folderName:row?.folder_name||null,folderUrl:row?.folder_id?'https://drive.google.com/drive/folders/'+row.folder_id:null,scope:row?.scope||DRIVE_SCOPE,connectedAt:row?.connected_at||null,lastRefreshAt:row?.last_refresh_at||null,lastTestAt:row?.last_test_at||null,lastTestResult:row?.last_test_result||null,lastError:row?.last_error||null,revokedAt:row?.revoked_at||null,redirectUri:redirectUri(url),events,photoCount:(await db.prepare('SELECT COUNT(*) AS n FROM collection_photos WHERE storage_provider=? AND status=?').bind(DRIVE_PROVIDER,'ready').first()).n,pendingDeletions:(await db.prepare('SELECT COUNT(*) AS n FROM photo_deletion_queue').first()).n});
 }
 if(p==='/api/root/google/start'&&request.method==='GET'){
  if(!driveConfigured(env))return fail('Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_TOKEN_KEY no Worker antes de conectar.',503);
  const state=random(),nonce=random(),t=now();
  await db.batch([db.prepare('DELETE FROM integration_oauth_states WHERE expires_at<?').bind(t),db.prepare('INSERT INTO integration_oauth_states(state,provider,user_id,created_at,expires_at,nonce_hash) VALUES(?,?,?,?,?,?)').bind(state,DRIVE_PROVIDER,user.id,t,t+STATE_TTL,await digest(nonce)),logIntegration(db,'authorization_started',user.id,null)]);
  const params=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:redirectUri(url),response_type:'code',scope:DRIVE_SCOPE,access_type:'offline',prompt:'consent',include_granted_scopes:'false',state});
  if(env.GOOGLE_LOGIN_HINT)params.set('login_hint',env.GOOGLE_LOGIN_HINT);
  return new Response(null,{status:302,headers:{Location:AUTH_URL+'?'+params,'Cache-Control':'no-store','Set-Cookie':oauthCookie(nonce,STATE_TTL/1000)}});
 }
 if(p==='/api/root/google/test'&&request.method==='POST'){
  if(store.provider!==DRIVE_PROVIDER)return fail('O provedor ativo não é o Google Drive (PHOTO_STORAGE_PROVIDER).',409);
  if(!await store.enabled())return fail('Google Drive ainda não conectado.',409);
  try{const result=await store.selfTest(user.id);return json(result,result.ok?200:502);}catch(error){if(error instanceof StorageError)return fail(error.message,error.status);throw error;}
 }
 if(p==='/api/root/google/disconnect'&&request.method==='POST'){
  const row=await integrationRow(db);if(!row||!row.refresh_token_enc)return fail('Não há autorização ativa.',404);
  let revoked='não solicitado';
  try{const refresh=await open(env,row.refresh_token_enc);const r=await fetchImpl(REVOKE_URL+'?token='+encodeURIComponent(refresh),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'}});revoked=r.ok?'revogado no Google':'falha ao revogar no Google ('+r.status+')';}catch(error){revoked='falha ao revogar: '+error.message;}
  const t=now();
  await db.batch([db.prepare('UPDATE integration_tokens SET refresh_token_enc=NULL,access_token_enc=NULL,access_token_expires_at=NULL,revoked_at=? WHERE provider=?').bind(t,DRIVE_PROVIDER),logIntegration(db,'authorization_disconnected',user.id,revoked),audit(db,user.id,'google_drive_disconnected')]);
  return json({ok:true,revoked,note:'As fotografias já gravadas permanecem na pasta do Drive; o sistema deixa de ler e gravar até nova autorização.'});
 }
 return fail('Operação da integração não encontrada.',404);
}
// Chamada antes da autenticação de sessão (ver worker.mjs). Só aceita um estado emitido por root nos últimos 10 minutos,
// casado com o cookie Lax entregue no início do fluxo; qualquer falha encerra sem gravar nada.
export async function googleCallback(request,url,env,{audit,fetchImpl=fetch,now=()=>Date.now()}){
 if(url.pathname!=='/api/root/google/callback'||request.method!=='GET')return null;
 const db=env.DB,t=now(),state=url.searchParams.get('state')||'',nonce=cookieValue(request,OAUTH_COOKIE);
 const pending=/^[a-f0-9]{64}$/.test(state)?await db.prepare('SELECT * FROM integration_oauth_states WHERE state=? AND provider=?').bind(state,DRIVE_PROVIDER).first():null;
 if(!pending||pending.expires_at<t||!nonce||pending.nonce_hash!==await digest(nonce)){await logIntegration(db,'authorization_rejected',pending?.user_id||null,'estado ou cookie de autorização inválido/expirado').run();return resultPage(false,'Autorização não reconhecida','O pedido de autorização expirou ou não partiu desta sessão do painel. Volte às Configurações e inicie novamente.');}
 await db.prepare('DELETE FROM integration_oauth_states WHERE state=?').bind(state).run();
 const actor=pending.user_id;
 if(url.searchParams.get('error')){await logIntegration(db,'authorization_denied',actor,url.searchParams.get('error')).run();return resultPage(false,'Autorização não concedida','O Google informou: '+url.searchParams.get('error')+'. Nenhuma alteração foi feita.');}
 const code=url.searchParams.get('code');if(!code)return resultPage(false,'Autorização incompleta','O Google não enviou o código de autorização.');
 if(!driveConfigured(env))return resultPage(false,'Servidor sem configuração','Os segredos do Google não estão configurados no Worker.');
 const tokenResponse=await fetchImpl(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri(url),grant_type:'authorization_code'})});
 const tokens=await tokenResponse.json().catch(()=>({}));
 if(!tokenResponse.ok||!tokens.access_token){await logIntegration(db,'authorization_failed',actor,'token:'+(tokens.error||tokenResponse.status)).run();return resultPage(false,'Autorização não confirmada','O Google não confirmou a autorização ('+(tokens.error||tokenResponse.status)+'). Confira o URI de redirecionamento e as credenciais do cliente OAuth.');}
 if(!tokens.refresh_token){await logIntegration(db,'authorization_failed',actor,'sem refresh_token').run();return resultPage(false,'Token de renovação ausente','O Google não devolveu o token de renovação. Remova o acesso do aplicativo em myaccount.google.com → Segurança → Conexões de terceiros e autorize novamente.');}
 const granted=String(tokens.scope||'').split(/\s+/).filter(Boolean);
 if(!granted.includes(DRIVE_SCOPE)){await logIntegration(db,'authorization_failed',actor,'escopo:'+granted.join(',')).run();return resultPage(false,'Permissão insuficiente','A permissão drive.file não foi concedida. Nenhum token foi guardado.');}
 let info;try{info=await about(tokens.access_token,fetchImpl);}catch(error){await logIntegration(db,'authorization_failed',actor,'about:'+error.message).run();return resultPage(false,'Conta não identificada','Não foi possível identificar a conta autorizada: '+error.message);}
 const previous=await integrationRow(db);
 let folder=null;if(previous?.folder_id){const meta=await fileMeta(tokens.access_token,fetchImpl,previous.folder_id).catch(()=>null);if(meta&&meta.mimeType==='application/vnd.google-apps.folder')folder={id:meta.id,name:meta.name};}
 if(!folder){try{const created=await createFolder(tokens.access_token,fetchImpl,DRIVE_FOLDER_NAME);folder={id:created.id,name:created.name||DRIVE_FOLDER_NAME};}catch(error){await logIntegration(db,'authorization_failed',actor,'pasta:'+error.message).run();return resultPage(false,'Pasta não criada','A conta foi autorizada, mas a pasta privada não pôde ser criada: '+error.message+'. Nenhum token foi guardado.');}}
 const expires=t+Math.max(60,Number(tokens.expires_in)||3600)*1000;
 const refreshEnc=await seal(env,tokens.refresh_token),accessEnc=await seal(env,tokens.access_token);
 await db.batch([
  db.prepare('INSERT INTO integration_tokens(provider,account_email,account_name,scope,refresh_token_enc,access_token_enc,access_token_expires_at,folder_id,folder_name,connected_by,connected_at,last_refresh_at,revoked_at,last_error) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL) ON CONFLICT(provider) DO UPDATE SET account_email=excluded.account_email,account_name=excluded.account_name,scope=excluded.scope,refresh_token_enc=excluded.refresh_token_enc,access_token_enc=excluded.access_token_enc,access_token_expires_at=excluded.access_token_expires_at,folder_id=excluded.folder_id,folder_name=excluded.folder_name,connected_by=excluded.connected_by,connected_at=excluded.connected_at,last_refresh_at=excluded.last_refresh_at,revoked_at=NULL,last_error=NULL').bind(DRIVE_PROVIDER,info.user?.emailAddress||null,info.user?.displayName||null,granted.join(' '),refreshEnc,accessEnc,expires,folder.id,folder.name,actor,t,t),
  ...(previous?.folder_id&&previous.folder_id!==folder.id?[db.prepare('DELETE FROM integration_folders WHERE provider=?').bind(DRIVE_PROVIDER)]:[]),
  logIntegration(db,'authorization_connected',actor,(info.user?.emailAddress||'conta não identificada')+' · pasta '+folder.id),
  audit(db,actor,'google_drive_connected')
 ]);
 return resultPage(true,'Google Drive conectado','Conta '+(info.user?.emailAddress||'institucional')+' autorizada com escopo drive.file. Pasta privada: '+folder.name+'. Nenhuma credencial foi exibida ou gravada no navegador.');
}
