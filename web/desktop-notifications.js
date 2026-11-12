import {createHardwareAttention} from './hardware-attention.js';
import {subscribePanelStatus,refreshPanelStatus} from './panel-status.js';
const date=v=>v?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'medium'}).format(new Date(v)):'Ainda não executada';
export const monitorLabels={communicating:'Online · comunicando',communicating_with_failure:'Online · falha na leitura do inventário',no_recent_communication:'Sem comunicação recente',reported_shutdown:'Desligamento informado pelo agente',reported_suspend:'Suspensão informada pelo agente',never_communicated:'Aguardando primeiro contato',revoked:'Agente revogado',not_linked:'Sem vínculo ativo para monitoramento',unknown:'Status desconhecido'};
let stop=null;
export function startNotifications(user){
 stop?.();if(!user||user.mustChange||!['root','admin','visualizador'].includes(user.role))return;
 const bell=document.querySelector('[data-action="notifications"]');if(!bell)return;
 let data=null,error='';
 const attention=createHardwareAttention(user,refreshPanelStatus);
 const badge=document.createElement('span');badge.className='monitor-count';badge.hidden=true;bell.append(badge);
 function paint(){
  const count=data?.hardware?.pending||0;
  badge.textContent=error?'!':count>99?'99+':String(count);badge.hidden=!count&&!error;
  bell.setAttribute('aria-label','Notificações de hardware'+(error?' · consulta indisponível':count?' · '+count+' aguardando parecer':''));
  bell.title=error||(document.hidden?'Atualização pausada enquanto esta aba está em segundo plano. Última leitura preservada.':'Alterações de hardware aguardando parecer');
  document.querySelectorAll('[data-monitor-summary]').forEach(n=>n.textContent=error||count+' alteração(ões) de hardware aguardando parecer.');
 }
 const unsubscribe=subscribePanelStatus(result=>{
  try{if(result.error)throw Error(result.error);data=result.data.monitoring;error='';
   for(const s of data.statuses){for(const node of document.querySelectorAll('[data-monitor-equipment="'+CSS.escape(s.equipment_id)+'"]')){node.textContent=monitorLabels[s.state]||s.state;node.dataset.state=s.state;node.title='Último contato: '+date(s.last_live_contact_at);}}
   window.dispatchEvent(new CustomEvent('semed:monitoring',{detail:data}));
  }catch(e){error=e.message;document.querySelectorAll('[data-monitor-equipment]').forEach(n=>{n.textContent='Status desatualizado · aguardando conexão';n.dataset.state='unknown';});window.dispatchEvent(new CustomEvent('semed:monitoring-error',{detail:{message:error}}));}
  finally{paint();}
 });
 function open(e){e?.stopImmediatePropagation();window.dispatchEvent(new CustomEvent('semed:hardware-open',{detail:{state:'pending'}}));}
 const visibility=()=>paint();bell.addEventListener('click',open);document.addEventListener('visibilitychange',visibility);
 stop=()=>{unsubscribe();attention.destroy();bell.removeEventListener('click',open);document.removeEventListener('visibilitychange',visibility);badge.remove();};
}
