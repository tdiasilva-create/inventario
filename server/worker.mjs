import {importRoutes} from './import-units.mjs';
import {random,digest,hashPassword,equal,canManage,canView,validatePassword} from './security.mjs';
import {unitRoutes} from './units.mjs';
import {collectorRoutes} from './collector.mjs';
import {googleRoutes,googleCallback} from './google-auth.mjs';
import {photoStore} from './photo-storage.mjs';
import {handleAgentMachine,handleAgentHuman,manutencaoAgentes} from './agentes/index.mjs';
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const fail=(message,status=400)=>json({error:message},status);
const cookie=(token,seconds)=>`__Host-semed=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;
const audit=(db,id,event)=>db.prepare('INSERT INTO audit(user_id,event,created_at) VALUES(?,?,?)').bind(id,event,Date.now());
async function current(request,db){const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-semed='))?.slice(13);if(!token||!/^[a-f0-9]{64}$/.test(token))return null;return db.prepare('SELECT u.*,s.token_hash,s.csrf,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1 AND s.credential_version=u.credential_version').bind(await digest(token),Date.now()).first();}
async function body(request){const path=new URL(request.url).pathname,limit=path==='/api/root/import-preview'?262144:path.startsWith('/api/collector/')?65536:path==='/api/root/assignments'?16384:4096;if(Number(request.headers.get('content-length')||0)>limit)throw Error('body');const text=await request.text();if(new TextEncoder().encode(text).length>limit)throw Error('body');return JSON.parse(text);}
async function config(db){const rows=await db.prepare('SELECT key,value FROM settings').all();const s=Object.fromEntries(rows.results.map(x=>[x.key,x.value]));return s;}
async function handle(request,env){const url=new URL(request.url),path=url.pathname,db=env.DB;
 if(!['GET','HEAD','POST'].includes(request.method))return fail('Método não permitido.',405);
 // Agente Windows (proposta D-053): rotas de MÁQUINA autenticadas por assinatura ECDSA; não usam cookie, CSRF nem Origin.
 // Lista fechada em server/agentes/index.mjs; as rotas humanas do módulo seguem o fluxo normal de sessão abaixo.
 if(db){const machine=await handleAgentMachine(request,url,env);if(machine)return machine;}
 if(request.method==='POST'&&(request.headers.get('Origin')!==url.origin||!(path==='/api/collector/photo-upload'?['image/jpeg','image/png','image/webp'].includes(request.headers.get('Content-Type')):request.headers.get('Content-Type')?.startsWith('application/json'))))return fail('Origem ou conteúdo inválido.',403);
 const publicPaths=new Set(['/login','/login.html','/login.css','/login.js','/assets/prefeitura-paco.png','/assets/paisagem-login-v2.png','/assets/login-network.svg','/robots.txt']);
 if(publicPaths.has(path)){const target=new URL(request.url);if(path==='/login'||path==='/login.html')target.pathname=env.APP_KIND==='collector'?'/collector-login.html':'/login.html';if(env.APP_KIND==='collector'&&path==='/login.js')target.pathname='/collector-login.js';return env.ASSETS.fetch(new Request(target,request));}
 if(env.APP_KIND==='collector'&&['/collector.css','/vendor/figtree/Figtree.ttf','/collector-favicon.svg','/tokens.css','/assets/paisagem-coleta.jpg','/vendor/chakra-petch/ChakraPetch-400.woff2','/vendor/chakra-petch/ChakraPetch-500.woff2','/vendor/chakra-petch/ChakraPetch-600.woff2','/vendor/chakra-petch/ChakraPetch-700.woff2','/vendor/barlow/Barlow-400.woff2','/vendor/barlow/Barlow-500.woff2','/vendor/barlow/Barlow-600.woff2','/vendor/barlow/Barlow-700.woff2','/vendor/jetbrains-mono/JetBrainsMono-Variable.woff2'].includes(path))return env.ASSETS.fetch(request);
 if(!env.AUTH_PEPPER||!db)return fail('Acesso temporariamente indisponível.',503);
 if(path==='/api/auth/login'&&request.method==='POST'){
  const data=await body(request);const username=typeof data.username==='string'?data.username.trim().toLowerCase():'';const password=typeof data.password==='string'?data.password:'';if(!/^[a-z0-9._-]{2,80}$/.test(username)||password.length>256)return fail('Usuário ou senha inválidos.',401);
  const ip=request.headers.get('CF-Connecting-IP')||'local';const key=await digest(ip+'|'+username),ipKey=await digest('ip|'+ip);const now=Date.now();
  const blocked=await db.prepare('SELECT MAX(blocked_until) AS until FROM attempts WHERE key IN (?,?)').bind(key,ipKey).first();if(blocked?.until>now)return fail('Aguarde antes de tentar novamente.',429);
  const user=await db.prepare('SELECT * FROM users WHERE username=?').bind(username).first();const calculated=await hashPassword(password,user?.salt||'unknown-user-fixed-salt',env.AUTH_PEPPER);
  if(!user||!user.active||!equal(calculated,user.password_hash)||(user.must_change&&user.temporary_expires<now)){
   const statements=[key,ipKey].map(k=>db.prepare('INSERT INTO attempts(key,count,blocked_until,updated_at) VALUES(?,1,0,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN updated_at<? THEN 1 ELSE MIN(count+1,20) END,blocked_until=CASE WHEN updated_at<? THEN 0 ELSE ?+MIN(900000,1000*(1 << MIN(count,9))) END,updated_at=?').bind(k,now,now-900000,now-900000,now,now));await db.batch([...statements,audit(db,user?.id||null,'login_failed')]);return fail('Usuário ou senha inválidos.',401);
  }
  const settings=await config(db);if(!settings.session_seconds)return fail('Prazo de sessão ainda não configurado.',503);
  const token=random(),csrf=random();await db.batch([db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,expires_at,created_at,credential_version,user_agent) VALUES(?,?,?,?,?,?,?)').bind(await digest(token),user.id,csrf,now+settings.session_seconds*1000,now,user.credential_version,(request.headers.get('User-Agent')||'').slice(0,300)),db.prepare('DELETE FROM attempts WHERE key=?').bind(key),db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),db.prepare('UPDATE users SET last_login_at=? WHERE id=?').bind(now,user.id),audit(db,user.id,'login_success')]);
  return json({redirect:user.must_change?'/conta':env.APP_KIND==='collector'?'/':canView(user.role)?'/':'/conta'},200,{'Set-Cookie':cookie(token,settings.session_seconds)});
 }
 // Retorno do Google: navegação de outro site, sem cookie de sessão; validado por estado + cookie Lax (ver google-auth.mjs).
 if(env.APP_KIND!=='collector'){const callback=await googleCallback(request,url,env,{audit});if(callback)return callback;}
 const user=await current(request,db);
 if(!user){if(path.startsWith('/api/'))return fail('Autenticação necessária.',401);return new Response(null,{status:302,headers:{Location:'/login','Cache-Control':'no-store'}});}
 if(request.method==='POST'&&!equal(request.headers.get('X-CSRF-Token')||'',user.csrf))return fail('Solicitação inválida.',403);
 if(path==='/api/auth/me')return json({username:user.username,role:user.role,mustChange:!!user.must_change,csrf:user.csrf,canView:canView(user.role),displayName:user.display_name});
 if(path==='/api/auth/logout'&&request.method==='POST'){await db.batch([db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(user.token_hash),audit(db,user.id,'logout')]);return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
 if(path==='/api/auth/password'&&request.method==='POST'){
  const data=await body(request);if(typeof data.currentPassword!=='string'||data.currentPassword.length>256||!equal(await hashPassword(data.currentPassword,user.salt,env.AUTH_PEPPER),user.password_hash))return fail('Senha atual inválida.',403);
  const error=await validatePassword(data.password);if(error)return fail(error);if(data.password===data.currentPassword)return fail('Escolha uma senha diferente da provisória.');const salt=random(),hash=await hashPassword(data.password,salt,env.AUTH_PEPPER);
  const result=await db.batch([db.prepare('UPDATE users SET credential_version=credential_version+1,password_hash=?,salt=?,must_change=0,temporary_expires=NULL WHERE id=? AND password_hash=?').bind(hash,salt,user.id,user.password_hash),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),audit(db,user.id,'password_changed')]);if(!result[0].meta.changes)return fail('Credencial alterada em outra sessão. Entre novamente.',409);return json({ok:true,redirect:'/login'},200,{'Set-Cookie':cookie('',0)});
 }
 if(user.must_change&&path!=='/conta'&&path!=='/account.js'&&path!=='/account.css'&&!['/collector-account.js','/collector.css','/vendor/figtree/Figtree.ttf','/tokens.css','/assets/paisagem-coleta.jpg','/vendor/chakra-petch/ChakraPetch-400.woff2','/vendor/chakra-petch/ChakraPetch-500.woff2','/vendor/chakra-petch/ChakraPetch-600.woff2','/vendor/chakra-petch/ChakraPetch-700.woff2','/vendor/barlow/Barlow-400.woff2','/vendor/barlow/Barlow-500.woff2','/vendor/barlow/Barlow-600.woff2','/vendor/barlow/Barlow-700.woff2','/vendor/jetbrains-mono/JetBrainsMono-Variable.woff2','/admin-units.js','/panel-shell.js','/account-shell.js','/panel-refinement.css','/desktop-icons.js','/desktop.css','/unit-schema.js','/spreadsheet-io.js','/vendor/leaflet/leaflet.js','/vendor/leaflet/leaflet.css'].includes(path))return path.startsWith('/api/')?fail('Troque a senha provisória.',403):new Response(null,{status:302,headers:{Location:'/conta','Cache-Control':'no-store'}});
 if(path==='/api/auth/sessions'&&request.method==='GET'){const rows=await db.prepare('SELECT token_hash,created_at,expires_at,user_agent FROM sessions WHERE user_id=? AND expires_at>?').bind(user.id,Date.now()).all();return json({sessions:rows.results.map(s=>({id:s.token_hash,createdAt:s.created_at,expiresAt:s.expires_at,device:s.user_agent||'Dispositivo não informado',current:s.token_hash===user.token_hash}))});}
 if(path==='/api/auth/revoke'&&request.method==='POST'){const data=await body(request);await db.batch([db.prepare('DELETE FROM sessions WHERE token_hash=? AND user_id=?').bind(String(data.id),user.id),audit(db,user.id,'session_revoked')]);return json({ok:true});}
 // Rotas humanas do módulo de agentes (sessão + CSRF já verificados): antes de collectorRoutes/unitRoutes, que respondem 404 a caminhos desconhecidos.
 const agentHuman=await handleAgentHuman(request,url,user,env);if(agentHuman)return agentHuman;
 const collectionResponse=await collectorRoutes(request,url,user,env,{json,fail,body});if(collectionResponse)return collectionResponse;
 // Integração Google Drive (somente root; o coletor não expõe estas rotas). Antes de unitRoutes, que responde 404 a /api/root/* desconhecidos.
 if(env.APP_KIND!=='collector'){const googleResponse=await googleRoutes(request,url,user,env,{json,fail,audit});if(googleResponse)return googleResponse;}
 const importResponse=await importRoutes(request,url,user,db,{json,fail,body,audit});if(importResponse)return importResponse;
 const unitResponse=await unitRoutes(request,url,user,db,{json,fail,body,audit,store:photoStore(env,{db})});if(unitResponse)return unitResponse;
 if(path.startsWith('/api/admin/')){
  if(!['root','admin'].includes(user.role))return fail('Sem permissão.',403);
  if(path==='/api/admin/users'&&request.method==='GET'){const rows=await db.prepare('SELECT id,username,display_name,role,active,must_change,last_login_at FROM users').all();return json({users:rows.results.filter(x=>canManage(user.role,x.role))});}
  if(path==='/api/admin/create'&&request.method==='POST'){
   if(user.role!=='root')return fail('Somente root cria usuários.',403);
   const data=await body(request),username=typeof data.username==='string'?data.username.trim().toLowerCase():'';
   if(!/^[a-z0-9._-]{2,80}$/.test(username)||!['root','admin','operador','visualizador'].includes(data.role))return fail('Informe usuário válido e perfil.');
   if(!canManage(user.role,data.role))return fail('Sem permissão para criar este perfil.',403);
   const settings=await config(db);if(!settings.temporary_seconds)return fail('Prazo provisório não configurado.',503);
   if(await db.prepare('SELECT id FROM users WHERE username=?').bind(username).first())return fail('Nome de usuário já cadastrado.',409);
   const id=crypto.randomUUID(),temporary=random(),salt=random();
   await db.batch([db.prepare('INSERT INTO users(id,username,role,password_hash,salt,temporary_expires,created_at,display_name) VALUES(?,?,?,?,?,?,?,?)').bind(id,username,data.role,await hashPassword(temporary,salt,env.AUTH_PEPPER),salt,Date.now()+settings.temporary_seconds*1000,Date.now(),typeof data.displayName==='string'?data.displayName.trim().slice(0,180):''),audit(db,user.id,'user_created:'+id)]);
   return json({temporaryPassword:temporary,expiresIn:settings.temporary_seconds},201);
  }
  if(path==='/api/admin/status'&&request.method==='POST'){
   const data=await body(request);const target=await db.prepare('SELECT id,role FROM users WHERE id=?').bind(String(data.id)).first();
   if(!target||!canManage(user.role,target.role)||target.id===user.id||typeof data.active!=='boolean')return fail('Operação não permitida.',403);
   await db.batch([db.prepare('UPDATE users SET active=? WHERE id=?').bind(data.active?1:0,target.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id),audit(db,user.id,(data.active?'activated:':'deactivated:')+target.id)]);return json({ok:true});
  }
  if(path==='/api/admin/settings'&&request.method==='GET'){if(user.role!=='root')return fail('Sem permissão.',403);return json(await config(db));}
  if(path==='/api/admin/settings'&&request.method==='POST'){
   if(user.role!=='root')return fail('Sem permissão.',403);const data=await body(request);
   if(!Number.isInteger(data.session_seconds)||data.session_seconds<900||data.session_seconds>86400||!Number.isInteger(data.temporary_seconds)||data.temporary_seconds<3600||data.temporary_seconds>172800)return fail('Sessão: 15 minutos a 24 horas. Senha provisória: 1 a 48 horas.');
   await db.batch([db.prepare('UPDATE settings SET value=? WHERE key=?').bind(data.session_seconds,'session_seconds'),db.prepare('UPDATE settings SET value=? WHERE key=?').bind(data.temporary_seconds,'temporary_seconds'),audit(db,user.id,'security_settings_changed')]);return json({ok:true});
  }
  if(path==='/api/admin/audit'&&request.method==='GET'){if(user.role!=='root')return fail('Sem permissão.',403);const rows=await db.prepare('SELECT a.id,u.username,a.event,a.created_at FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 100').all();return json({events:rows.results});}
  if(path==='/api/admin/reset'&&request.method==='POST'){
   const data=await body(request);const target=await db.prepare('SELECT * FROM users WHERE id=?').bind(String(data.id)).first();if(!target||!canManage(user.role,target.role)||target.id===user.id)return fail('Operação não permitida.',403);const settings=await config(db);if(!settings.temporary_seconds)return fail('Prazo provisório não configurado.',503);const temporary=random(),salt=random();await db.batch([db.prepare('UPDATE users SET credential_version=credential_version+1,password_hash=?,salt=?,must_change=1,temporary_expires=? WHERE id=?').bind(await hashPassword(temporary,salt,env.AUTH_PEPPER),salt,Date.now()+settings.temporary_seconds*1000,target.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id),audit(db,user.id,'reset:'+target.id)]);return json({temporaryPassword:temporary,expiresIn:settings.temporary_seconds});
  }
  if(path==='/api/admin/revoke'&&request.method==='POST'){const data=await body(request);const target=await db.prepare('SELECT id,role FROM users WHERE id=?').bind(String(data.id)).first();if(!target||!canManage(user.role,target.role))return fail('Sem permissão.',403);await db.batch([db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id),audit(db,user.id,'admin_revoke:'+target.id)]);return json({ok:true});}
  return fail('Operação indisponível.',404);
 }
 if(path.startsWith('/api/'))return fail('Operação não implementada.',404);
 const adminPaths=['/cadastro-unidades','/operadores-unidades','/seguranca'];
 if(path==='/administracao')return new Response(null,{status:302,headers:{Location:'/cadastro-unidades'}});
 if(adminPaths.includes(path)&&user.role!=='root')return fail('Sem permissão.',403);
 if(path==='/usuarios'&&!['root','admin'].includes(user.role))return fail('Sem permissão.',403);
 if(path==='/conta'&&env.APP_KIND==='collector')return env.ASSETS.fetch(new Request(new URL('/collector-account.html',url),request));
 if(['/conta','/cadastro-unidades','/usuarios','/operadores-unidades','/seguranca'].includes(path))return env.ASSETS.fetch(new Request(new URL('/account.html',url),request));
 const accountAssets=['/account.js','/account.css','/admin-units.js','/panel-shell.js','/account-shell.js','/panel-refinement.css','/unit-schema.js','/spreadsheet-io.js','/vendor/exceljs/exceljs.min.js','/vendor/leaflet/leaflet.js','/vendor/leaflet/leaflet.css','/desktop-icons.js','/desktop.css'];
 if(accountAssets.includes(path))return env.ASSETS.fetch(request);
 if(env.APP_KIND==='collector'){
  if(!['root','admin','operador'].includes(user.role))return fail('Este perfil é somente de visualização. Acesse o painel desktop.',403);
  const target=new URL(request.url);if(['/','/coleta','/coleta.html'].includes(path))target.pathname='/collector.html';if(path==='/visita')target.pathname='/visit.html';if(path==='/coleta-v2')target.pathname='/collector-v2.html';if(path==='/coleta-v3')target.pathname='/collector-v3.html';
  if(['/collector-v3.html','/collector-v3.js','/collector-v3-schema.js','/collector-v3.css','/collector-drafts.js','/collector-ui.js','/collector-v2.html','/collector-v2.js','/collector-v2-schema.js','/collector-qr.js','/vendor/jsqr/jsQR.js','/visit.html','/visit.js','/visit-schema.js','/collector.html','/collector.js','/collector-schema.js','/collector-unit-list.js','/collector-navigation.js','/collector-errors.js','/collector-favicon.svg','/collector.css','/tokens.css','/assets/paisagem-coleta.jpg','/vendor/chakra-petch/ChakraPetch-400.woff2','/vendor/chakra-petch/ChakraPetch-500.woff2','/vendor/chakra-petch/ChakraPetch-600.woff2','/vendor/chakra-petch/ChakraPetch-700.woff2','/vendor/barlow/Barlow-400.woff2','/vendor/barlow/Barlow-500.woff2','/vendor/barlow/Barlow-600.woff2','/vendor/barlow/Barlow-700.woff2','/vendor/jetbrains-mono/JetBrainsMono-Variable.woff2','/collector-account.js','/desktop-icons.js'].includes(target.pathname))return env.ASSETS.fetch(new Request(target,request));
  return fail('Endereço do coletor não encontrado.',404);
 }
 if(!canView(user.role))return new Response(null,{status:302,headers:{Location:'/conta','Cache-Control':'no-store'}});
 const pages=['/','/coletas-em-andamento','/panorama','/mapa','/unidades','/ambientes','/equipamentos','/ocorrencias','/relatorios','/planejamento','/exportar','/configuracoes','/unidade'];
 const assetUrl=new URL(request.url);if(pages.includes(path))assetUrl.pathname='/index.html';
 const response=await env.ASSETS.fetch(new Request(assetUrl,request));
 return response;
}
// Manutenção agendada do módulo de agentes (retenção de snapshots/heartbeats, nonces, recibos, limites, desafios vencidos).
// Disparada pelo cron do Worker do painel (wrangler.jsonc → triggers.crons); também disponível ao root em POST /api/root/agent-maintenance.
// Preserva sempre o snapshot atual, a linha de base e o histórico de vínculos/localização/auditoria (ver D1Store.purgeExpired).
export async function scheduled(event,env,ctx){if(!env.DB)return;const run=manutencaoAgentes(env,Date.now()).catch(()=>null);if(ctx?.waitUntil)ctx.waitUntil(run);return run;}
export default {scheduled,async fetch(request,env){let response;try{response=await handle(request,env);}catch(error){response=error.message==='body'?fail('A requisição excedeu o tamanho permitido.',413):error instanceof SyntaxError?fail('Conteúdo JSON inválido.',400):fail(env.DEBUG_COLLECTION==='1'?String(error.message):'Não foi possível concluir. Tente novamente.',503);}response=new Response(response.body,response);response.headers.set('Cache-Control','no-store');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','same-origin');response.headers.set('X-Frame-Options','DENY');return response;}};




