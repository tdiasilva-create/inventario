import {readPanelJson} from './desktop-request.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>v&&Number.isFinite(Date.parse(v))?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Fortaleza',dateStyle:'short',timeStyle:'medium'}).format(new Date(v)):'Ainda não recebido';
export function renderAgentConnection(agent){
 if(!agent)return '<section class="agent-connection"><h4>Conexão de rede</h4><p>Sem agente vinculado. IP público e provedor não são inferidos do cadastro manual.</p></section>';
 if(agent.link?.ended_at)return '<section class="agent-connection"><h4>Conexão de rede</h4><p>Vínculo encerrado. A conexão atual dessa instalação não pertence a esta ficha.</p></section>';
 const p=agent.presence||{},c=p.network_observation,section=agent.current_inventory?.sections?.network,network=section?.data;
 const adapters=network?.addresses_collected===false?[]:(Array.isArray(network?.adapters)?network.adapters:[]);
 const internal=adapters.slice(0,32).map(a=>{
  const ips=[...new Set(['ipv4','ipv6','ip_addresses'].flatMap(k=>Array.isArray(a?.[k])?a[k]:[]).filter(v=>typeof v==='string'&&v.length<=64))];
  return ips.length?'<li><strong>'+esc(a.name||a.description||'Interface')+'</strong>: '+ips.map(ip=>'<code>'+esc(ip)+'</code>').join(' · ')+'</li>':'';
 }).filter(Boolean).join('');
 return `<section class="agent-connection"><h4>Conexão de rede</h4><dl class="agent-connection-fields"><dt>IP público</dt><dd data-connection="public">${c?.public_ip?'<code>'+esc(c.public_ip)+'</code>':'Ainda não recebido'}</dd><dt>Provedor / rede identificada</dt><dd data-connection="provider">${esc(c?.provider||'Não identificado')}${c?.asn?'<small>AS'+esc(c.asn)+'</small>':''}</dd><dt>Último contato do agente</dt><dd data-connection="contact">${esc(time(p.last_live_contact_at))}</dd></dl>${c?'<p>IP e rede observados nessa conexão em '+esc(time(c.observed_at))+'. A rede identificada pode diferir do provedor contratado; VPN/proxy podem alterar esses dados.</p>':'<p>Aguardando a próxima comunicação válida do agente para identificar o IP público e o provedor.</p>'}<h5>IP interno / interfaces de rede</h5><div data-connection="internal">${internal?'<ul>'+internal+'</ul><p>Endereços reportados pelo agente · coletados em '+esc(time(section.collected_at||agent.current_inventory.collected_at))+'.</p>':'<p>IP interno não informado pelo agente.</p>'}</div></section>`;
}

// Only the open computer sheet polls; no per-machine requests while listing units.
export function mountAgentConnection(container,equipmentId){
 let stopped=false,busy=false,current=null,controller=null;
 const paint=error=>{container.innerHTML=(current?renderAgentConnection(current.agent):'<p>Conexão ainda não disponível.</p>')+(error?'<p role="alert">'+esc(error)+(current?' A leitura anterior foi mantida.':'')+'</p>':'')+'<button type="button" class="ops-btn" data-connection-refresh>Atualizar conexão</button>';container.querySelector('button').onclick=()=>load();};
 async function load(){
  if(stopped||busy||document.hidden||!container.isConnected)return;
  busy=true;controller=new AbortController();
  try{const data=await readPanelJson('/api/inventory/agent-status?'+new URLSearchParams({equipmentId}),{signal:controller.signal});if(data.equipment_id!==equipmentId)throw Error('A resposta não corresponde a este computador.');if(!stopped){current=data;paint();}}
  catch(e){if(!stopped&&!controller.signal.aborted)paint(e.message);}
  finally{busy=false;}
 }
 const visible=()=>{if(document.hidden)controller?.abort();else load();};
 container.innerHTML='<p>Consultando conexão do computador…</p>';load();
 const interval=setInterval(load,15000);document.addEventListener('visibilitychange',visible);
 return ()=>{stopped=true;controller?.abort();clearInterval(interval);document.removeEventListener('visibilitychange',visible);};
}
