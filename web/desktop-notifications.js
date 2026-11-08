const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'medium'}).format(new Date(v)):'Ainda não executada';
function hardwareValue(value){
 if(Array.isArray(value))return '<ul>'+value.map(v=>'<li>'+hardwareValue(v)+'</li>').join('')+'</ul>';
 const labels={bytes:'Capacidade',modelo:'Modelo',fabricante:'Fabricante',nucleos:'Núcleos',serie:'Série',tipo:'Tipo',identificador:'Identificador PCI'};
 return Object.entries(value||{}).filter(([,v])=>v!==''&&v!==null).map(([k,v])=>'<div><span>'+esc(labels[k]||k)+': </span><b>'+esc(k==='bytes'?new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(v/1073741824)+' GiB':v)+'</b></div>').join('');
}
export const monitorLabels={communicating:'Online · comunicando',communicating_with_failure:'Online · falha na leitura do inventário',no_recent_communication:'Sem comunicação recente',reported_shutdown:'Desligamento informado pelo agente',reported_suspend:'Suspensão informada pelo agente',never_communicated:'Aguardando primeiro contato',revoked:'Agente revogado',not_linked:'Sem vínculo ativo para monitoramento',unknown:'Status desconhecido'};
let stop=null;
export function startNotifications(user){
 stop?.();if(!user||user.mustChange||!['root','admin','visualizador'].includes(user.role))return;
 if(!document.querySelector('link[href="/desktop-notifications.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/desktop-notifications.css';document.head.append(css);}
 const bell=document.querySelector('[data-action="notifications"]');if(!bell)return;
 let dialog=null,timer=null,busy=false,pending=false,offset=0,unread=false,data=null,error='',lastSignature='',controller=null,closed=false;
 const badge=document.createElement('span');badge.className='monitor-count';badge.hidden=true;bell.append(badge);
 function item(n){return `<article class="monitor-item" data-notification="${esc(n.id)}"><h3>${n.kind==='hardware_change'?'Alteração de hardware detectada':'Perda de comunicação'} ${n.read_at?'':'<span class="unread">Não lida</span>'}</h3><p><b>${esc(n.unit_name)}</b> · ${esc(n.environment_name||'Ambiente não informado')}${n.partial?' · PARCIAL (cadastro ainda não publicado)':''}</p><code>Equipamento ${esc(n.equipment_id)}</code>${n.kind==='communication_lost'?`<p>${n.resolved_at?esc(n.resolution)+' · '+date(n.resolved_at):'Sem contato recente. Verifique rede, energia e serviço do agente.'}</p><p>Último contato: ${date(n.observed_at)} · prazo: ${Math.round(n.details.threshold_seconds/60)} minutos.</p>`:`<p>Observado pelo agente: ${date(n.observed_at)}</p><details data-expand="${esc(n.id)}"><summary>Ver peças e valores anteriores / novos</summary>${n.details.changes.map(c=>`<h4>${esc(c.label)}</h4><div class="monitor-comparison"><div><p>Anterior · ${date(c.previous_collected_at)}</p>${hardwareValue(c.before)}</div><div><p>Novo</p>${hardwareValue(c.after)}</div></div>`).join('')}</details><p>Diferença reportada pelo agente; confirme fisicamente a intervenção.</p>`}<p class="monitor-meta">Detectado no servidor: ${date(n.detected_at)}</p><div class="monitor-actions"><a href="${n.partial?'/planejamento':'/panorama?id='+encodeURIComponent(n.unit_id)+'&equipment='+encodeURIComponent(n.equipment_id)}" data-monitor-link>Ver ${n.partial?'coleta em andamento':'equipamento'}</a>${n.read_at?'Lida':`<button data-read="${esc(n.id)}">Marcar como lida</button>`}</div></article>`;}
 function paint(){
  badge.textContent=data?.unread>99?'99+':String(data?.unread||0);badge.hidden=!data?.unread&&!error;if(error)badge.textContent='!';bell.setAttribute('aria-label','Notificações'+(data?.unread?' · '+data.unread+' não lidas':''));bell.title=error||'Notificações de hardware e comunicação';
  document.querySelectorAll('[data-monitor-summary]').forEach(n=>n.textContent=error||`${data?.unread||0} notificação(ões) não lida(s) · ${data?.communication_lost||0} perda(s) de comunicação.`);
  if(!dialog?.open)return;
  const meta=dialog.querySelector('[data-monitor-meta]');const stale=!data?.monitor_last_success_at||Date.now()-data.monitor_last_success_at>180000;
  meta.classList.toggle('monitor-error',!!error||stale);meta.textContent=error||`${data?.unread||0} não lida(s) · ${data?.communication_lost||0} perda(s) de comunicação aberta(s). Verificação automática: ${date(data?.monitor_last_success_at)}.${stale?' A verificação está atrasada; os alertas podem estar desatualizados.':' Atualização da tela a cada 15 segundos.'}`;
  const signature=JSON.stringify(data?.items||[]);if(signature!==lastSignature){const list=dialog.querySelector('.monitor-list'),expanded=[...list.querySelectorAll('details[open]')].map(n=>n.dataset.expand),focus=list.contains(document.activeElement)?document.activeElement.dataset.read:null,top=dialog.scrollTop;
   list.innerHTML=data?.items.length?data.items.map(item).join(''):'<p>Nenhuma notificação neste filtro.</p>';expanded.forEach(id=>list.querySelector(`[data-expand="${CSS.escape(id)}"]`)?.setAttribute('open',''));if(focus)list.querySelector(`[data-read="${CSS.escape(focus)}"]`)?.focus({preventScroll:true});dialog.scrollTop=top;lastSignature=signature;
  }
  dialog.querySelector('[data-previous]').disabled=offset===0;dialog.querySelector('[data-next]').disabled=data?.nextOffset==null;
 }
 async function poll(){if(closed||document.hidden)return;if(busy){pending=true;return;}pending=false;busy=true;clearTimeout(timer);controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  try{const ids=[...new Set([...document.querySelectorAll('[data-monitor-equipment]')].map(el=>el.dataset.monitorEquipment))].slice(0,50);
   const r=await fetch('/api/inventory/monitoring?'+new URLSearchParams({offset,unread:unread?'1':'0',equipmentIds:ids.join(',')}),{signal:controller.signal});if(!r.ok)throw Error(r.status===401?'Sessão expirada. Entre novamente.':'Não foi possível atualizar as notificações. Tente novamente.');data=await r.json();error='';
   for(const s of data.statuses){for(const node of document.querySelectorAll(`[data-monitor-equipment="${CSS.escape(s.equipment_id)}"]`)){node.textContent=monitorLabels[s.state]||s.state;node.dataset.state=s.state;node.title='Último contato: '+date(s.last_live_contact_at);}}
   window.dispatchEvent(new CustomEvent('semed:monitoring',{detail:data}));
  }catch(e){if(!closed){error=e.name==='AbortError'?'Atualização demorou demais. Tentaremos novamente.':e.message;document.querySelectorAll('[data-monitor-equipment]').forEach(n=>{n.textContent='Status desatualizado · aguardando conexão';n.dataset.state='unknown';});}}
  finally{clearTimeout(timeout);busy=false;if(!closed){paint();timer=setTimeout(poll,pending?0:error?30000:15000);}}
 }
 function open(e){e?.stopImmediatePropagation();if(dialog?.open)return;dialog=document.createElement('dialog');dialog.className='monitor-dialog';dialog.setAttribute('aria-labelledby','monitor-title');dialog.innerHTML='<header><button class="monitor-close" aria-label="Fechar notificações">Fechar ×</button><h2 id="monitor-title">Notificações dos computadores</h2><div class="monitor-toolbar"><label><input type="checkbox" data-unread> Somente não lidas</label><button data-refresh>Atualizar agora</button></div><p class="monitor-meta" data-monitor-meta role="status">Consultando…</p><p class="monitor-meta">Ausência de comunicação não comprova que o computador está desligado. Suspensão e desligamento informados são estados distintos.</p></header><div class="monitor-list"></div><div class="monitor-pagination"><button data-previous>← Anteriores</button><button data-next>Próximas →</button></div>';document.body.append(dialog);lastSignature='';dialog.showModal();dialog.querySelector('[data-unread]').checked=unread;paint();poll();
  dialog.addEventListener('close',()=>{dialog.remove();dialog=null;bell.focus();});
  dialog.onclick=async ev=>{const b=ev.target.closest('button');if(ev.target.closest('[data-monitor-link]')){ev.stopPropagation();return;}if(!b)return;
   if(b.matches('.monitor-close')){dialog.close();return;}
   if(b.dataset.read){b.disabled=true;try{const r=await fetch('/api/inventory/notifications/read',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':user.csrf},body:JSON.stringify({id:b.dataset.read})});if(!r.ok)throw Error('Não foi possível registrar a leitura.');await poll();}catch(e){error=e.message;paint();}finally{b.disabled=false;}return;}
   if(b.matches('[data-previous]'))offset=Math.max(0,offset-25);if(b.matches('[data-next]'))offset=data.nextOffset;poll();
  };
  dialog.querySelector('[data-unread]').onchange=e=>{unread=e.target.checked;offset=0;poll();};
 }
 const visibility=()=>{if(document.hidden){clearTimeout(timer);controller?.abort();}else poll();};
 const refresh=()=>poll();bell.addEventListener('click',open);document.addEventListener('visibilitychange',visibility);window.addEventListener('semed:equipment-list',refresh);poll();
 stop=()=>{closed=true;clearTimeout(timer);controller?.abort();bell.removeEventListener('click',open);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('semed:equipment-list',refresh);dialog?.close();badge.remove();};
}
