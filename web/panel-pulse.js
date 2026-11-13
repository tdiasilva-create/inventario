import {startUsageMeter,usageMeterHtml} from './panel-usage.js';
import {sharedPanelJson} from './desktop-request.js';
// Comunicação: leitura por minuto. Providências: consulta compartilhada de 15 s (D-085).
import {getPendingState} from './desktop-demand-count.js';
let stop=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>new Intl.NumberFormat('pt-BR').format(n);
const item=(label,value,tone,href,title,hardware=false)=>`<span class="pulse-item" data-tone="${tone}" ${title?`title="${esc(title)}"`:''}><i></i>${hardware?'<button type="button" data-pending-hardware>':href?`<a href="${href}">`:''}<small>${label}</small><b>${esc(value)}</b>${hardware?'</button>':href?'</a>':''}</span>`;
const count=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Contagem indisponível');return n;};
export function startPulse(user){
 stopPulse();const node=document.querySelector('#panel-pulse');
 if(!node||user?.mustChange||!['root','admin','visualizador'].includes(user?.role))return;
 let busy=false,sum=null,fleetError=false,at='—';const controller=new AbortController(),signal=controller.signal;
 function paint(){
  if(signal.aborted||!node.isConnected)return;const pending=getPendingState(),ready=pending.data&&!pending.error;
  const focused=node.contains(document.activeElement)?document.activeElement:null,focusHref=focused?.getAttribute('href'),focusHardware=focused?.hasAttribute('data-pending-hardware'),focusUsage=focused?.hasAttribute('data-d1-usage');
  const value=k=>ready?num(pending.data[k].total):'—',tone=k=>ready&&pending.data[k].total?'bad':'idle';
  node.dataset.state=fleetError?'erro':sum?'ok':'loading';
  const html=item('Comunicando',sum?num(sum.online):'—',sum?.online?'ok':'idle','/computadores?estado=comunicando',sum?num(sum.computers)+' computador(es) cadastrado(s)':'Consultando comunicação')
   +item('Sem comunicação',sum?num(sum.lost):'—',sum?.lost?'bad':'idle','/computadores?estado=sem-comunicacao','Sem contato com o agente no prazo de monitoramento')
   +item('Sem agente',sum?num(sum.unlinked):'—','idle','/computadores?estado=sem-agente','Computadores sem agente vinculado')
   +item('Coletas pendentes',value('collections'),tone('collections'),'/coletas-pendentes',pending.error||'Toda a rede · unidades sem conclusão ou com revisita aberta')
   +item('Demandas abertas',value('demands'),tone('demands'),'/demandas',pending.error||'Toda a rede · atendimentos não concluídos')
   +item('Hardware aguardando parecer',value('hardware'),tone('hardware'),'',pending.error||'Toda a rede · alterações sem decisão de root ou admin',true)
   +usageMeterHtml(user)
   +item('Comunicação',fleetError?'falha ao consultar':at,'idle','',fleetError?'Nova tentativa em até 1 minuto':'Última consulta de comunicação');
  if(node.innerHTML===html)return;node.innerHTML=html;
  if(focusUsage)node.querySelector('[data-d1-usage]')?.focus({preventScroll:true});else if(focusHardware)node.querySelector('[data-pending-hardware]')?.focus({preventScroll:true});else if(focusHref)node.querySelector('a[href="'+CSS.escape(focusHref)+'"]')?.focus({preventScroll:true});
 }
 async function update(){
  if(busy||document.hidden||signal.aborted)return;busy=true;
  try{const fleet=await sharedPanelJson('/api/operations/units');if(!Array.isArray(fleet.units))throw Error();const totals=fleet.units.reduce((c,u)=>{for(const k of Object.keys(c))c[k]+=count(u[k]);return c;},{computers:0,online:0,lost:0,unlinked:0});if(signal.aborted||!node.isConnected)return;sum=totals;fleetError=false;at=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});window.dispatchEvent(new CustomEvent('semed:fleet-presence',{detail:{fleet}}));}
  catch{if(signal.aborted||!node.isConnected)return;sum=null;fleetError=true;window.dispatchEvent(new CustomEvent('semed:fleet-presence',{detail:{error:true}}));}
  finally{busy=false;paint();}
 }
 const timer=setInterval(update,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();},{signal});window.addEventListener('semed:pending-summary',paint,{signal});
 const stopUsage=startUsageMeter(user,paint);
 stop=()=>{clearInterval(timer);controller.abort();stopUsage();};paint();update();
}
export function stopPulse(){stop?.();stop=null;}
