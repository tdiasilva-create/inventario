import {readPanelJson} from './desktop-request.js';
const INTERVAL=300000;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v).toLocaleString('pt-BR');
const pct=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
const time=v=>v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Fortaleza',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Ainda não recebida';
const messages={NOT_CONFIGURED:'Integração de métricas ainda não configurada.',WAITING_ANALYTICS:'Aguardando a primeira leitura da Cloudflare.',NEW_PERIOD_PENDING:'Novo período iniciado. Aguardando sua primeira leitura.',ANALYTICS_PERMISSION:'A Cloudflare não autorizou a leitura das métricas.',ANALYTICS_UNAVAILABLE:'Não foi possível atualizar as métricas da Cloudflare.',INVALID_ANALYTICS:'A Cloudflare retornou métricas incompletas.',CACHE_UNAVAILABLE:'A leitura compartilhada está indisponível.'};
const levels={normal:'Dentro do limite',warning:'Atenção · 70%',high:'Uso elevado · 85%',critical:'Próximo do limite · 95%',limit:'Limite informado atingido',unknown:'Sem leitura atual'};
let state={data:null,error:null},activeUser=null,dialog=null;
function current(){
 const data=state.data;
 if(!data)return null;
 // A suspended tab must not show yesterday's reading as today's quota.
 if(Date.now()>=data.period.end)return {...data,metrics:null,percent:null,level:'unknown',stale:true,error:'NEW_PERIOD_PENDING'};
 return data;
}
export function usageMeterHtml(user){
 if(user?.role!=='root'||user.mustChange)return '';
 const data=current(),stale=!!state.error||data?.stale;
 const value=data?.metrics?`${pct(data.percent)}%${stale?' · !':''}`:state.error||data?.error?'indisponível':'…';
 return `<span class="pulse-item d1-usage-pill" data-level="${esc(data?.level||'unknown')}"><button type="button" data-d1-usage title="${esc(levels[data?.level||'unknown'])} · uso diário de D1 da conta${stale?' · última leitura, atualização pendente':''}" aria-label="Uso diário do D1: ${esc(value)}. ${esc(levels[data?.level||'unknown'])}" aria-haspopup="dialog"><small>D1</small><b>${esc(value)}</b></button></span>`;
}
function details(){
 const d=current(),error=state.error||messages[d?.error],stale=!!state.error||d?.stale;
 const metric=(key,label)=>{
  const m=d?.metrics?.[key];if(!m)return `<section><h3>${label}</h3><p>Sem leitura deste período.</p></section>`;
  const estimate=!stale&&m.estimatedLimitAt&&m.estimatedLimitAt<d.period.end?`Se o ritmo da última hora continuar, o limite pode ser alcançado em ${time(m.estimatedLimitAt)}.`:'Sem previsão de esgotamento antes da renovação pelo ritmo medido.';
  return `<section data-level="${m.level}"><h3>${label} <b>${pct(m.percent)}%</b></h3><progress max="100" value="${Math.min(100,m.percent)}" aria-label="${label}: ${pct(m.percent)}%"></progress><p><strong>${n(m.used)}</strong> de ${n(m.limit)} linhas</p><p>${n(m.remaining)} linhas restantes · ${esc(levels[m.level])}</p>${!stale&&m.estimatedLimitAt?`<p class="usage-secondary">${estimate}</p>`:''}</section>`;
 };
 const history=(d?.history||[]).slice().reverse().map(h=>`<tr><td>${time(Date.parse(h.date)+86400000)}</td><td>${n(h.rowsRead)}</td><td>${n(h.rowsWritten)}</td></tr>`).join('');
 return `<header><h2 id="d1-usage-title">Uso diário do D1</h2><button type="button" data-close-usage aria-label="Fechar medidor">Fechar</button></header>
 <p>Plano gratuito · todos os bancos D1 da conta da Secretaria.</p>
 ${error||stale?`<p class="usage-warning" role="status">${esc(error||'Leitura desatualizada.')} ${d?.metrics?'Os valores abaixo são a última leitura recebida.':''}</p>`:''}
 <div class="usage-metrics">${metric('rowsRead','Leituras')}${metric('rowsWritten','Gravações')}</div>
 <p><strong>Renovação da franquia: ${d?time(d.period.end):'21h'} (Fortaleza).</strong></p>
 <p>Última leitura: ${time(d?.updatedAt)} · atualização a cada 5 minutos.</p>
 <p class="usage-secondary">Avisos em 70%, 85% e 95%. As métricas podem chegar com atraso. A previsão é uma estimativa pelo ritmo recente; o medidor avisa, mas não impede o bloqueio do limite gratuito.</p>
 <details><summary>Histórico recente de consumo</summary><p class="usage-secondary">Cada período vai das 21h do dia anterior às 21h indicadas. O período atual ainda está em andamento.</p><div class="usage-table"><table><thead><tr><th>Fim do período (Fortaleza)</th><th>Linhas lidas</th><th>Linhas gravadas</th></tr></thead><tbody>${history||'<tr><td colspan="3">Sem histórico recebido.</td></tr>'}</tbody></table></div></details>`;
}
function paintDialog(){if(!dialog?.open)return;const expanded=dialog.querySelector('details')?.open,focused=dialog.contains(document.activeElement),onSummary=document.activeElement?.tagName==='SUMMARY';dialog.querySelector('[data-usage-content]').innerHTML=details();if(expanded)dialog.querySelector('details').open=true;dialog.querySelector('[data-close-usage]').onclick=()=>dialog.close();if(focused)dialog.querySelector(onSummary?'summary':'[data-close-usage]').focus({preventScroll:true});}
function openUsage(){
 if(activeUser?.role!=='root')return;
 if(dialog?.open)return;dialog?.remove();dialog=document.createElement('dialog');dialog.className='d1-usage-dialog';dialog.setAttribute('aria-labelledby','d1-usage-title');dialog.innerHTML='<div data-usage-content></div>';document.body.append(dialog);
 dialog.addEventListener('close',()=>{dialog.remove();dialog=null;document.querySelector('[data-d1-usage]')?.focus({preventScroll:true});},{once:true});dialog.showModal();paintDialog();dialog.querySelector('[data-close-usage]').focus();
}
export function startUsageMeter(user,onChange){
 activeUser=user;state={data:null,error:null};
 if(user?.role!=='root'||user.mustChange)return ()=>{};
 let busy=false,last=0;const controller=new AbortController(),signal=controller.signal;
 async function update(){
  if(signal.aborted||document.hidden||busy||Date.now()-last<INTERVAL)return;
  busy=true;last=Date.now();
  try{const data=await readPanelJson('/api/root/d1-usage',{signal});if(signal.aborted)return;if(!data.period||!Array.isArray(data.history))throw Error('Resposta de métricas inválida.');state={data,error:null};}
  catch(e){if(signal.aborted)return;state.error=e.message;}
  finally{busy=false;if(!signal.aborted){onChange();paintDialog();}}
 }
 document.querySelector('#panel-pulse')?.addEventListener('click',e=>{if(e.target.closest('[data-d1-usage]'))openUsage();},{signal});
 const timer=setInterval(update,INTERVAL);document.addEventListener('visibilitychange',()=>{if(!document.hidden){onChange();update();}},{signal});update();
 return ()=>{clearInterval(timer);controller.abort();dialog?.close();activeUser=null;};
}
