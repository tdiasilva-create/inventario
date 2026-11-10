// Pulso da rede (10/11/2026): uma linha, em todas as páginas do painel, com o que muda ao longo do dia.
// Lê rotas que já existem (D-070/D-071/D-045); não cria endpoint. Uma leitura por minuto, pausada com a aba oculta.
// Não mostra total de unidades (D-066: contagens só por tipo, no Panorama).
let stop=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>new Intl.NumberFormat('pt-BR').format(n);
const item=(label,value,tone,href,title)=>`<span class="pulse-item" data-tone="${tone}" ${title?`title="${esc(title)}"`:''}><i></i>${href?`<a href="${href}">`:''}<small>${label}</small><b>${esc(value)}</b>${href?'</a>':''}</span>`;
async function read(path,signal){const r=await fetch(path,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});if(!r.ok)throw Error(path);return r.json();}
const count=n=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Contagem indisponível');return n;};
export function startPulse(user){
 stopPulse();const node=document.querySelector('#panel-pulse');
 if(!node||user?.mustChange||!['root','admin','visualizador'].includes(user?.role))return;let busy=false;const controller=new AbortController(),signal=controller.signal;
 async function readFleet(){
  try{
   const fleet=await read('/api/operations/units',signal);
   if(!Array.isArray(fleet.units))throw Error('Rede indisponível');
   if(!signal.aborted&&node.isConnected)window.dispatchEvent(new CustomEvent('semed:fleet-presence',{detail:{fleet}}));
   return fleet;
  }catch(e){
   if(!signal.aborted&&node.isConnected)window.dispatchEvent(new CustomEvent('semed:fleet-presence',{detail:{error:true}}));
   throw e;
  }
 }
 async function update(){
  if(busy||document.hidden||signal.aborted)return;busy=true;
  try{
   const [fleet,queue,progress]=await Promise.all([readFleet(),read('/api/operations/queue-summary',signal),read('/api/inventory/in-progress?cursor=',signal)]);
   if(signal.aborted||!node.isConnected)return;
   if(!Array.isArray(fleet.units))throw Error('Rede indisponível');count(queue.pending);count(progress.total);
   const sum=fleet.units.reduce((c,u)=>{for(const k of Object.keys(c))c[k]+=count(u[k]);return c;},{computers:0,online:0,lost:0,unlinked:0});
   const at=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
   node.dataset.state='ok';
   node.innerHTML=item('Comunicando',num(sum.online),sum.online?'ok':'idle','/computadores?estado=comunicando',num(sum.computers)+' computador(es) cadastrado(s)')
    +item('Sem comunicação',num(sum.lost),sum.lost?'bad':'idle','/computadores?estado=sem-comunicacao','Sem contato com o agente no prazo de monitoramento')
    +item('Sem agente',num(sum.unlinked),'idle','/computadores?estado=sem-agente','Computadores sem agente vinculado')
    +item('Demandas pendentes',num(queue.pending),queue.pending?'bad':'idle','/demandas')
    +item('Coletas em andamento',num(progress.total),progress.total?'warn':'idle','/coletas-em-andamento','Rascunhos confirmados no servidor, rotulados PARCIAL')
    +item('Atualizado',at,'idle','',null);
  }catch(e){if(signal.aborted||!node.isConnected)return;node.dataset.state='erro';node.innerHTML=item('Rede','sem leitura','bad','',null)+item('Atualizado','falha ao consultar · tentando de novo em 1 min','idle','',null);}
  finally{busy=false;}
 }
 const onVisible=()=>{if(!document.hidden)update();};
 const timer=setInterval(update,60000);document.addEventListener('visibilitychange',onVisible,{signal});
 stop=()=>{clearInterval(timer);controller.abort();};update();
}
export function stopPulse(){stop?.();stop=null;}
