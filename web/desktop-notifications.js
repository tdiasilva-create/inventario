import {createHardwareAttention} from './hardware-attention.js';
const date=v=>v?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'medium'}).format(new Date(v)):'Ainda não executada';
export const monitorLabels={communicating:'Online · comunicando',communicating_with_failure:'Online · falha na leitura do inventário',no_recent_communication:'Sem comunicação recente',reported_shutdown:'Desligamento informado pelo agente',reported_suspend:'Suspensão informada pelo agente',never_communicated:'Aguardando primeiro contato',revoked:'Agente revogado',not_linked:'Sem vínculo ativo para monitoramento',unknown:'Status desconhecido'};
let stop=null;
export function startNotifications(user){
 stop?.();if(!user||user.mustChange||!['root','admin','visualizador'].includes(user.role))return;
 const bell=document.querySelector('[data-action="notifications"]');if(!bell)return;
 let timer=null,busy=false,pending=false,data=null,error='',controller=null,closed=false;
 const attention=createHardwareAttention(user,()=>poll());
 const badge=document.createElement('span');badge.className='monitor-count';badge.hidden=true;bell.append(badge);
 function paint(){
  const count=data?.hardware?.pending||0;
  badge.textContent=error?'!':count>99?'99+':String(count);badge.hidden=!count&&!error;
  bell.setAttribute('aria-label','Notificações de hardware'+(error?' · consulta indisponível':count?' · '+count+' aguardando parecer':''));
  bell.title=error||'Alterações de hardware aguardando parecer';
  document.querySelectorAll('[data-monitor-summary]').forEach(n=>n.textContent=error||count+' alteração(ões) de hardware aguardando parecer.');
 }
 async function poll(){if(closed||document.hidden)return;if(busy){pending=true;return;}pending=false;busy=true;clearTimeout(timer);controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  try{const ids=[...new Set([...document.querySelectorAll('[data-monitor-equipment]')].map(el=>el.dataset.monitorEquipment))].slice(0,50);
   const r=await fetch('/api/inventory/monitoring?'+new URLSearchParams({equipmentIds:ids.join(',')}),{signal:controller.signal});if(!r.ok)throw Error(r.status===401?'Sessão expirada. Entre novamente.':'Não foi possível atualizar as notificações. Tente novamente.');data=await r.json();error='';
   for(const s of data.statuses){for(const node of document.querySelectorAll('[data-monitor-equipment="'+CSS.escape(s.equipment_id)+'"]')){node.textContent=monitorLabels[s.state]||s.state;node.dataset.state=s.state;node.title='Último contato: '+date(s.last_live_contact_at);}}
   window.dispatchEvent(new CustomEvent('semed:monitoring',{detail:data}));
  }catch(e){if(!closed){error=e.name==='AbortError'?'Atualização demorou demais. Tentaremos novamente.':e.message;document.querySelectorAll('[data-monitor-equipment]').forEach(n=>{n.textContent='Status desatualizado · aguardando conexão';n.dataset.state='unknown';});window.dispatchEvent(new CustomEvent('semed:monitoring-error',{detail:{message:error}}));}}
  finally{clearTimeout(timeout);busy=false;if(!closed){paint();timer=setTimeout(poll,pending?0:error?30000:15000);}}
 }
 function open(e){e?.stopImmediatePropagation();window.dispatchEvent(new CustomEvent('semed:hardware-open',{detail:{state:'pending'}}));}
 const visibility=()=>{if(document.hidden){clearTimeout(timer);controller?.abort();}else poll();};
 const refresh=()=>poll();bell.addEventListener('click',open);document.addEventListener('visibilitychange',visibility);window.addEventListener('semed:equipment-list',refresh);poll();
 stop=()=>{closed=true;attention.destroy();clearTimeout(timer);controller?.abort();bell.removeEventListener('click',open);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('semed:equipment-list',refresh);badge.remove();};
}
