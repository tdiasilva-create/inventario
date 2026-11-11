import {readPanelJson} from './desktop-request.js';
import {downloadTable} from './desktop-exports.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=v=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}):'Não recebido';
const columns=['Nome da unidade','IP público','Provedor / rede identificada','Último contato (Fortaleza)'];
const note='Uma linha por unidade, usando o computador com informação de provedor mais recente, inclusive offline.';
let current=null;
function table(items){return `<div class="management-table-scroll"><table class="data-table management-table provider-table"><thead><tr>${columns.map(c=>'<th>'+esc(c)+'</th>').join('')}</tr></thead><tbody>${items.map(r=>`<tr><td><b>${esc(r.unit_name)}</b></td><td><code>${esc(r.public_ip||'Não recebido')}</code></td><td>${esc(r.provider||'Não identificado')}</td><td>${esc(when(r.last_contact_at))}</td></tr>`).join('')}</tbody></table></div>`;}
function validReport(r){return r.complete===true&&r.scope==='one-per-unit-with-agent-data'&&Array.isArray(r.items)&&r.items.length===r.total&&new Set(r.items.map(v=>v.unit_id)).size===r.total&&Number.isFinite(Date.parse(r.server_time))&&r.totals?.units===r.total&&r.totals.with_provider+r.totals.without_provider===r.total;}
export function showProviderReport(trigger){
 if(current?.isConnected){current.focus();return;}
 const d=document.createElement('dialog');current=d;d.className='report-print-dialog provider-report-dialog';d.setAttribute('aria-labelledby','provider-report-title');
 d.innerHTML=`<header class="report-print-controls"><button type="button" data-provider-current aria-pressed="true">Dados atuais</button><button type="button" data-provider-history aria-pressed="false">Histórico semanal</button><button type="button" data-provider-refresh>Atualizar consulta</button><button type="button" data-provider-export="XLSX" disabled>Baixar Excel</button><button type="button" data-provider-export="CSV" disabled>Baixar CSV</button><button type="button" data-provider-print disabled>Imprimir / salvar PDF</button><button type="button" data-provider-close>Fechar</button></header><h2 id="provider-report-title">Provedores por unidade</h2><p class="management-note" data-provider-note>${esc(note)}</p><p data-provider-status role="status">Consultando…</p><p data-provider-error class="ops-error" role="alert" hidden></p><div data-provider-results></div>`;
 document.body.append(d);d.showModal();const $=s=>d.querySelector(s);let data=null,busy=false,exporting=false,controller=null,view='current',offset=0;
 const error=message=>{const e=$('[data-provider-error]');e.textContent=message||'';e.hidden=!message;};
 const actions=()=>{
  d.querySelectorAll('[data-provider-export],[data-provider-print]').forEach(b=>b.disabled=!data||!data.total||busy||exporting);
  d.querySelectorAll('[data-provider-current],[data-provider-history],[data-provider-refresh]').forEach(b=>b.disabled=busy||exporting);
  $('[data-provider-refresh]').hidden=view==='saved';
  $('[data-provider-current]').setAttribute('aria-pressed',String(view==='current'));
  $('[data-provider-history]').setAttribute('aria-pressed',String(view!=='current'));
 };
 function history(r){
  const schedule=r.schedule;
  $('[data-provider-note]').textContent='Emissões automáticas toda segunda-feira às 08h (Fortaleza). Cada registro preserva os dados da emissão, sem alterações posteriores. O registro inicial marca o começo do histórico; não há reconstrução de semanas anteriores.';
  $('[data-provider-status]').textContent=`${r.total} relatório(s) arquivado(s). `+(schedule.initialized?`Próxima emissão prevista: ${when(schedule.next_due_at)}.`:'Preparando o registro inicial e o agendamento. Atualize em um minuto.');
  $('[data-provider-results]').innerHTML=(r.items.length?`<div class="management-table-scroll"><table class="data-table management-table"><thead><tr><th>Registro</th><th>Emitido em (Fortaleza)</th><th>Unidades</th><th>Com provedor</th><th>Ação</th></tr></thead><tbody>${r.items.map(x=>`<tr><td>${x.kind==='initial'?'Registro inicial':'Semanal · '+esc(when(x.scheduled_at))}${x.missed_weeks?'<small>'+esc(x.missed_weeks)+' semana(s) sem emissão anterior; sem dados retroativos.</small>':''}</td><td>${esc(when(x.generated_at))}</td><td>${esc(x.unit_count)}</td><td>${esc(x.with_provider)}</td><td><button type="button" data-provider-saved="${esc(x.id)}" aria-label="Abrir relatório de ${esc(when(x.generated_at))}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`:'<p>Nenhum relatório arquivado ainda. A consulta de Dados atuais continua disponível.</p>')+`<div class="provider-history-pages"><button type="button" data-provider-prev ${offset===0?'disabled':''}>Anterior</button><span>Página ${Math.floor(offset/20)+1}</span><button type="button" data-provider-next ${r.nextOffset===null?'disabled':''}>Próxima</button></div>`;
  d.querySelectorAll('[data-provider-saved]').forEach(b=>b.onclick=()=>load('saved',b.dataset.providerSaved));
  $('[data-provider-prev]').onclick=()=>load('history','',Math.max(0,offset-20));
  $('[data-provider-next]').onclick=()=>load('history','',r.nextOffset);
 }
 async function load(target='current',id='',page=0){
  if(busy||exporting)return;view=target;offset=page;busy=true;data=null;error('');actions();$('[data-provider-results]').innerHTML='';$('[data-provider-status]').textContent='Consultando…';controller=new AbortController();
  $('#provider-report-title').textContent=view==='history'?'Histórico semanal de provedores':view==='saved'?'Relatório de provedores arquivado':'Provedores por unidade · dados atuais';
  $('[data-provider-note]').textContent=note;
  const path=view==='history'?'/api/inventory/provider-reports?offset='+offset:view==='saved'?'/api/inventory/provider-report-saved?id='+encodeURIComponent(id):'/api/inventory/provider-report';
  try{const r=await readPanelJson(path,{signal:controller.signal,timeoutMs:30000});
   if(!d.isConnected)return;
   if(view==='history'){
    if(!Array.isArray(r.items)||!Number.isSafeInteger(r.total)||r.offset!==offset||!r.schedule)throw Error('Histórico incompleto. Atualize a consulta.');
    history(r);
   }else{
    if(!validReport(r)||view==='saved'&&r.archive?.id!==id)throw Error('Resposta incompleta. Atualize a consulta; nenhum arquivo foi gerado.');
    data=r;const archived=r.archive;
    $('[data-provider-status]').textContent=`${archived?'Arquivado em':'Consultado em'} ${when(r.server_time)} · ${r.total} unidade(s) · ${r.totals.with_provider} com provedor identificado · ${r.totals.without_provider} sem provedor identificado.`+(archived?(archived.kind==='initial'?' Registro inicial.':` Emissão programada para ${when(archived.scheduled_at)}.`)+(archived.missed_weeks?` ${archived.missed_weeks} semana(s) sem emissão anterior; não reconstruídas.`:''):'');
    $('[data-provider-results]').innerHTML=r.total?table(r.items):'<p>Nenhuma unidade com agente e dados recebidos foi encontrada. Cadastros manuais e vínculos encerrados não entram na consulta atual.</p>';
   }
  }catch(e){data=null;if(d.isConnected&&!controller.signal.aborted){error(e.message);$('[data-provider-status]').textContent='Não foi possível consultar. Os relatórios arquivados permanecem preservados.';}}
  finally{busy=false;if(d.isConnected)actions();}
 }
 async function download(format){if(!data||busy||exporting)return;exporting=true;error('');actions();try{
  const rows=data.items.map(r=>[r.unit_name,r.public_ip||'Não recebido',r.provider||'Não identificado',when(r.last_contact_at)]);
  const stamp=new Date(new Date(data.server_time).getTime()-3*3600000).toISOString().slice(0,19).replace('T','_').replaceAll(':','-');
  await downloadTable(columns,rows,format,'SEMED_PROVEDORES_UNIDADES_'+stamp);
 }catch(e){if(d.isConnected)error(e.message);}finally{exporting=false;if(d.isConnected)actions();}}
 $('[data-provider-close]').onclick=()=>d.close();$('[data-provider-refresh]').onclick=()=>load(view,'',offset);
 $('[data-provider-current]').onclick=()=>load('current');$('[data-provider-history]').onclick=()=>load('history');
 $('[data-provider-print]').onclick=()=>{if(data&&!busy&&!exporting)window.print();};
 d.querySelectorAll('[data-provider-export]').forEach(b=>b.onclick=()=>download(b.dataset.providerExport));
 d.addEventListener('close',()=>{controller?.abort();d.remove();if(current===d)current=null;if(trigger?.isConnected)trigger.focus();},{once:true});load();
}
