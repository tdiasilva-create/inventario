const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={technician:'Atendimento técnico',collect:'Coleta'},paths={technician:'/tecnico?app=1',collect:'/app/coleta'};
let user=null,owner=null,active=null,authRequired=false,switching=false;
const frames=new Map(),native=()=>window.SemedNative;
const message=text=>{$('#message').textContent=text||'';};
function tracking(){ $('#tracking').hidden=!native()?.hasQueueTracking?.(); }
async function api(path,data){
 const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json','X-CSRF-Token':user?.csrf||''}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)});
 const v=await r.json();if(!r.ok)throw Object.assign(Error(v.error||'Falha de comunicação.'),{status:r.status});return v;
}
function hideAreas(){for(const f of frames.values()){f.contentWindow.dispatchEvent(new Event('semed-area-hide'));f.hidden=true;}$('#areas').hidden=true;}
function auth(messageText=''){
 authRequired=true;hideAreas();$('nav').hidden=true;message(messageText);tracking();
 $('#logout').hidden=!owner&&!native()?.hasQueueTracking?.();
 $('#welcome').innerHTML=`<section class="access"><h1>SEMED</h1><p>Atendimento técnico e coleta de inventário em um só aplicativo.</p>${owner?'<p>Entre novamente com o mesmo usuário para retomar o preenchimento.</p>':''}<form id="login"><label>Usuário<input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(owner?.username||'')}" ${owner?'readonly':''}></label><label>Senha<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button class="primary">Entrar</button></form></section>`;
 $('#login').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;message('Verificando acesso…');try{await api('/api/auth/login',{username:f.elements.username.value,password:f.elements.password.value,application:'mobile'});f.elements.password.value='';await boot(true);}catch(err){message(err.message);b.disabled=false;}};
}
function password(){
 hideAreas();$('nav').hidden=true;$('#logout').hidden=false;
 $('#welcome').innerHTML='<section class="access"><h1>Defina sua senha</h1><p>Troque a senha provisória para acessar o aplicativo.</p><form id="password"><label>Senha provisória<input name="current" type="password" autocomplete="current-password" required></label><label>Senha definitiva<input name="next" type="password" minlength="6" maxlength="256" autocomplete="new-password" required></label><p>De 6 a 256 caracteres.</p><button class="primary">Salvar senha</button></form></section>';
 $('#password').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;try{await api('/api/auth/password',{currentPassword:f.elements.current.value,password:f.elements.next.value});native()?.stopQueueTracking?.();auth('Senha definida. Entre com sua nova senha.');}catch(err){message(err.message);b.disabled=false;}};
}
function menu(){
 hideAreas();active=null;$('#welcome').innerHTML=`<section><h1>Como deseja trabalhar?</h1><p>Escolha uma área. Você pode alternar sem sair da conta.</p>${Object.entries(titles).filter(([k])=>user[k]).map(([k,v])=>`<button class="area-card" data-open="${k}"><strong>${v}</strong><span>${k==='collect'?'Selecionar unidade, responder e fotografar equipamentos.':'Ver demandas, iniciar e registrar atendimentos.'}</span></button>`).join('')}</section>`;
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>open(b.dataset.open));
 document.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed','false'));
}
function capabilities(value){
 if(owner&&value.id!==owner.id)throw Object.assign(Error('A conta mudou. Entre com '+owner.username+' para preservar o preenchimento.'),{status:401});
 user=value;owner??={id:user.id,username:user.username};$('#account').textContent=user.displayName||user.username;
 for(const [k,f] of frames)if(!user[k]){f.remove();frames.delete(k);}
 document.querySelectorAll('[data-area]').forEach(b=>{b.hidden=!user[b.dataset.area];});
 native()?.resumeQueueTracking?.(user.id);
 if(user.technician)native()?.signedIn?.(user.username);
 $('#logout').hidden=false;$('nav').hidden=user.mustChange||!user.collect&&!user.technician;tracking();
}
async function open(area){
 if(switching||authRequired)return;switching=true;
 try{
  capabilities(await api('/api/mobile/me'));if(user.mustChange){password();return;}
  if(!user[area])throw Error('Sua conta não tem permissão para esta área.');
  hideAreas();active=area;$('#welcome').replaceChildren();$('#areas').hidden=false;message('');
  let frame=frames.get(area);
  if(!frame){frame=document.createElement('iframe');frame.title=titles[area];frame.name='semed-'+area;frame.allow=area==='collect'?'camera':'geolocation';frame.src=paths[area];frames.set(area,frame);$('#areas').append(frame);}
  frame.hidden=false;frame.contentWindow.dispatchEvent(new Event('semed-area-show'));
  document.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.area===area)));
 }catch(err){if(err.status===401)auth(err.message);else message(err.message);}finally{switching=false;}
}
async function boot(resume=false){
 try{
  capabilities(await api('/api/mobile/me'));authRequired=false;message('');
  if(user.mustChange){password();return;}
  if(!user.collect&&!user.technician){hideAreas();$('#welcome').innerHTML='<section><h1>Sem área disponível</h1><p>Solicite ao root a permissão adequada para sua conta.</p></section>';return;}
  if(resume){for(const f of frames.values()){if(f.contentWindow.location.pathname==='/app'){f.src=paths[[...frames].find(([,v])=>v===f)[0]];continue;}await f.contentWindow.semedAppResume?.();}}
  const previous=active;if(previous&&user[previous])await open(previous);else menu();
 }catch(err){if(err.status===401)auth();else message(err.message);}
}
async function logout(){
 const pending=[...frames.values()].some(f=>f.contentWindow.semedAppPending?.());
 // Identificação da conta acessível na saída (a barra oculta o nome abaixo de 600 px).
 $('#confirm-text').textContent='Conta: '+(user?.displayName||user?.username||owner?.username||'não identificada')+'. '+(pending?'Há preenchimento ou uma operação pendente nesta sessão. Sair descartará o que ainda não foi recebido pelo servidor. ':'')+'Sair encerra também o acompanhamento de localização das demandas. Para apenas mudar de área, use os botões acima.';
 const d=$('#confirm');if(d.open)return;d.showModal();
 $('#cancel-exit').onclick=()=>d.close();
 $('#confirm-exit').onclick=async()=>{
  const b=$('#confirm-exit');b.disabled=true;
  try{native()?.stopQueueTracking?.();try{await api('/api/auth/logout',{});}catch(err){if(err.status!==401)throw err;}
   native()?.signedOut?.();for(const f of frames.values())f.remove();frames.clear();owner=null;user=null;active=null;$('#account').textContent='';d.close();auth('Você saiu.');
  }catch(err){message(err.message+' Não foi possível encerrar a sessão; tente novamente.');d.close();}finally{b.disabled=false;}
 };
}
window.semedApp={home:menu,sessionExpired:()=>{if(!authRequired)auth('Sua sessão terminou. O preenchimento permanece aberto neste aplicativo.');},logout};
window.semedHandleBack=()=>{
 if($('#confirm').open){$('#confirm').close();return true;}
 if(authRequired&&owner)return true;
 if(authRequired)return false;
 if(active){const f=frames.get(active);if(f?.contentWindow.semedHandleBack?.())return true;menu();return true;}
 if([...frames.values()].some(f=>f.contentWindow.semedAppPending?.())){message('Há alterações não enviadas. Retorne à área em edição e salve antes de fechar.');return true;}
 return false;
};
window.addEventListener('beforeunload',e=>{if([...frames.values()].some(f=>f.contentWindow.semedAppPending?.())){e.preventDefault();e.returnValue='';}});
document.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>open(b.dataset.area));$('#logout').onclick=logout;
document.addEventListener('visibilitychange',()=>{tracking();});
// A private module may redirect here after expiry while navigating. Do not nest the app.
if(parent!==window&&parent.semedApp){parent.semedApp.sessionExpired();}else boot();

window.semedReceiveLocation=value=>frames.get("technician")?.contentWindow.semedReceiveLocation?.(value);
window.semedPauseCamera=()=>frames.get("collect")?.contentWindow.dispatchEvent(new Event("semed-area-hide"));
