// D-085: uma consulta compartilhada a cada 15 s; três conceitos, sem total misturado.
let stop=null,refresh=null;
let state={data:null,error:'',checkedAt:null};
const num=n=>new Intl.NumberFormat('pt-BR').format(n);
export const getPendingState=()=>state;
export function pendingIndicators(){return `<section class="pending-summary" data-pending-summary aria-label="Providências em toda a rede"><header><h3>Providências · toda a rede</h3><small data-pending-time>Consultando…</small><button type="button" class="text-button" data-pending-refresh>Atualizar</button></header><div class="pending-metrics"><a href="/coletas-pendentes" class="pending-metric"><strong data-pending-value="collections">—</strong><span>Coletas pendentes</span><small>Unidades sem conclusão ou com revisita aberta</small></a><a href="/demandas" class="pending-metric"><strong data-pending-value="demands">—</strong><span>Demandas abertas</span><small>Atendimentos ainda não concluídos</small></a><button type="button" class="pending-metric" data-pending-hardware><strong data-pending-value="hardware">—</strong><span>Hardware aguardando parecer</span><small>Alterações sem decisão de root ou admin</small></button></div><p data-pending-error role="status" hidden></p></section>`;}
export function paintPendingIndicators(){
 const ready=state.data&&!state.error;
 document.querySelectorAll('[data-pending-value]').forEach(n=>n.textContent=ready?num(state.data[n.dataset.pendingValue].total):'—');
 document.querySelectorAll('[data-pending-time]').forEach(n=>n.textContent=state.error?'Consulta indisponível':state.checkedAt?'Atualizado às '+state.checkedAt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'Consultando…');
 document.querySelectorAll('[data-pending-error]').forEach(n=>{n.hidden=!state.error;n.textContent=state.error;});
 document.querySelectorAll('[data-queue-summary]').forEach(n=>n.textContent=ready?'('+state.data.demands.total+')':'(—)');
 const a=document.querySelector('.navigation a[href="/demandas"]');if(a){let b=a.querySelector('[data-demand-count]');if(!b){b=document.createElement('small');b.dataset.demandCount='';a.append(b);}b.textContent=ready?(state.data.demands.total?String(state.data.demands.total):''):state.error?'!':'';b.title=ready?num(state.data.demands.total)+' demanda(s) aberta(s)':state.error||'Consultando demandas';b.setAttribute('aria-label',b.title);}
}
export function refreshPendingIndicators(){return refresh?.();}
export function startDemandCount(user){
 stop?.();stop=null;refresh=null;state={data:null,error:'',checkedAt:null};
 if(user?.mustChange||!['root','admin','visualizador'].includes(user?.role))return;
 const controller=new AbortController(),signal=controller.signal;let busy=false,queued=false;
 async function update(force=false){
  if(signal.aborted||document.hidden)return;if(busy){if(force)queued=true;return;}busy=true;
  try{const r=await fetch('/api/inventory/pending-summary',{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});if(!r.ok)throw Error(r.status===401?'Sessão expirada. Entre novamente.':'Não foi possível atualizar as pendências. Use Atualizar para tentar novamente.');const data=await r.json();for(const key of ['collections','demands','hardware'])if(!Number.isSafeInteger(data[key]?.total)||data[key].total<0)throw Error('Contagens indisponíveis. Tente atualizar.');if(signal.aborted)return;state={data,error:'',checkedAt:new Date()};}
  catch(e){if(signal.aborted)return;state={...state,error:e.message};}
  finally{busy=false;if(!signal.aborted){paintPendingIndicators();window.dispatchEvent(new CustomEvent('semed:pending-summary',{detail:state}));if(queued){queued=false;update();}}}
 }
 refresh=()=>update(true);
 const timer=setInterval(update,15000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();},{signal});
 window.addEventListener('semed:pending-refresh',()=>update(true),{signal});
 document.addEventListener('click',e=>{if(e.target.closest('[data-pending-refresh]'))update(true);if(e.target.closest('[data-pending-hardware]'))window.dispatchEvent(new CustomEvent('semed:hardware-open',{detail:{state:'pending'}}));},{signal});
 stop=()=>{clearInterval(timer);controller.abort();};update();
}
