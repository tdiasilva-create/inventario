import {readPanelJson} from './desktop-request.js';
export const collectionLabels={none:'Sem dados',partial:'Coleta parcial',complete:'Coleta completa'};
export const collectionHref=status=>'/controle-coletas?status='+status;
let state={active:false,totals:null,error:'',checkedAt:null,loading:false},inflight=null,bound=false;
export const getCollectionOverview=()=>state;
const num=n=>new Intl.NumberFormat('pt-BR').format(n);
export function collectionOverview(){return `<section class="collection-overview" data-collection-overview aria-label="Controle das coletas em toda a rede"><header><h3>Controle das coletas · toda a rede</h3><button type="button" class="text-button" data-coverage-refresh>Atualizar classificações</button></header><div class="collection-overview-metrics">${Object.entries(collectionLabels).map(([status,label])=>`<a class="collection-overview-link" data-state="${status}" href="${collectionHref(status)}"><strong data-coverage-value="${status}">—</strong><span>${label}</span></a>`).join('')}</div><p>Unidades ativas elegíveis · mesma classificação do Controle das coletas. Completa permanece até o root alterar.</p><small data-coverage-time>Consultando classificações…</small><p data-coverage-error role="status" hidden></p></section>`;}
export function paintCollectionOverview(){
 document.querySelectorAll('[data-coverage-value]').forEach(n=>{n.textContent=state.totals?num(state.totals[n.dataset.coverageValue]):'—';});
 document.querySelectorAll('[data-coverage-time]').forEach(n=>{n.textContent=(state.loading?'Consultando… ':state.error?'Última leitura preservada. ':'')+(state.checkedAt?'Consultado em '+state.checkedAt.toLocaleString('pt-BR')+'. Use Atualizar classificações para novas contribuições.':'Ainda sem leitura confirmada.');});
 document.querySelectorAll('[data-coverage-error]').forEach(n=>{n.hidden=!state.error;n.textContent=state.error;});
 document.querySelectorAll('[data-coverage-refresh]').forEach(n=>{n.disabled=state.loading;});
 document.querySelectorAll('[data-collection-overview]').forEach(n=>{n.dataset.stale=String(!!state.error);});
}
function emit(){paintCollectionOverview();window.dispatchEvent(new Event('semed:collection-overview'));}
export function refreshCollectionOverview(){
 if(inflight)return inflight;
 if(!state.active)return Promise.resolve();
 state={...state,loading:true};emit();
 inflight=(async()=>{
  try{const data=await readPanelJson('/api/collection-control/summary');
   if(data.scope!=='network'||!Number.isSafeInteger(data.server_time)||Object.keys(collectionLabels).some(k=>!Number.isSafeInteger(data.totals?.[k])||data.totals[k]<0))throw Error('Classificações indisponíveis. Tente atualizar.');
   state={...state,totals:data.totals,error:'',checkedAt:new Date(data.server_time)};
  }catch(e){state={...state,error:e.message};}
  finally{state={...state,loading:false};inflight=null;emit();}
 })();return inflight;
}
export function attachCollectionOverview(active){
 if(!bound){document.addEventListener('click',e=>{if(e.target.closest('[data-coverage-refresh]'))void refreshCollectionOverview();});bound=true;}
 const entering=active&&!state.active,changed=active!==state.active;state={...state,active};paintCollectionOverview();
 if(changed)emit();if(entering)void refreshCollectionOverview();
}
