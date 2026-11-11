import {readPanelJson} from './desktop-request.js';
import {downloadTable} from './desktop-exports.js';
import {presenceLabels} from './desktop-inventory.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=v=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}):'Não recebido';
const columns=['Unidade','Hostname','IP público','Provedor / rede identificada','Último contato (Fortaleza)'];
const note='Toda a rede · computadores com vínculo atual de agente e dados já recebidos, inclusive sem comunicação recente. Esta é a última informação disponível na emissão, sem filtro dos últimos sete dias ou histórico de trocas de provedor. A rede identificada pode diferir do provedor contratado.';
let current=null;
function table(items){return `<div class="management-table-scroll"><table class="data-table management-table provider-table"><thead><tr>${columns.map(c=>'<th>'+esc(c)+'</th>').join('')}</tr></thead><tbody>${items.map(r=>`<tr><td><b>${esc(r.unit_name)}</b>${r.unit_active?'':'<small>Unidade inativa</small>'}${r.partial?'<small>PARCIAL · cadastro em andamento</small>':''}</td><td>${esc(r.hostname||'Não recebido')}<small class="provider-equipment-id">ID: ${esc(r.id)}</small></td><td><code>${esc(r.public_ip||'Não recebido')}</code>${r.observed_at?'<small>Observado em '+esc(when(r.observed_at))+'</small>':''}</td><td>${esc(r.provider||'Não identificado')}${r.asn?'<small>AS'+esc(r.asn)+'</small>':''}</td><td>${esc(when(r.last_contact_at))}<small>${esc(presenceLabels[r.presence_state]||'Estado não informado')}</small></td></tr>`).join('')}</tbody></table></div>`;}
export function showProviderReport(trigger){
 if(current?.isConnected){current.focus();return;}
 const d=document.createElement('dialog');current=d;d.className='report-print-dialog provider-report-dialog';d.setAttribute('aria-labelledby','provider-report-title');
 d.innerHTML=`<header class="report-print-controls"><button type="button" data-provider-refresh>Atualizar relatório</button><button type="button" data-provider-export="XLSX" disabled>Baixar Excel</button><button type="button" data-provider-export="CSV" disabled>Baixar CSV</button><button type="button" data-provider-print disabled>Imprimir / salvar PDF</button><button type="button" data-provider-close>Fechar</button></header><h2 id="provider-report-title">Relatório semanal de provedores</h2><p class="management-note">${esc(note)}</p><p data-provider-status role="status">Consultando toda a rede…</p><p data-provider-error class="ops-error" role="alert" hidden></p><div data-provider-results></div>`;
 document.body.append(d);d.showModal();const $=s=>d.querySelector(s);let data=null,busy=false,exporting=false,controller=null;
 const error=message=>{const e=$('[data-provider-error]');e.textContent=message||'';e.hidden=!message;};
 const actions=()=>{d.querySelectorAll('[data-provider-export],[data-provider-print]').forEach(b=>b.disabled=!data||!data.total||busy||exporting);$('[data-provider-refresh]').disabled=busy||exporting;};
 async function load(){
  if(busy||exporting)return;busy=true;data=null;error('');actions();$('[data-provider-results]').innerHTML='';$('[data-provider-status]').textContent='Consultando toda a rede…';controller=new AbortController();
  try{const result=await readPanelJson('/api/inventory/provider-report',{signal:controller.signal,timeoutMs:30000});
   if(result.complete!==true||result.scope!=='all-linked-with-data'||!Array.isArray(result.items)||result.items.length!==result.total||new Set(result.items.map(r=>r.id)).size!==result.total||!Number.isFinite(Date.parse(result.server_time)))throw Error('Resposta incompleta. Atualize o relatório; nenhum arquivo foi gerado.');
   if(!d.isConnected)return;data=result;$('[data-provider-status]').textContent=`Emitido em ${when(data.server_time)} · ${data.total} computador(es) · ${data.totals.units} unidade(s) · ${data.totals.with_provider} com provedor identificado · ${data.totals.without_provider} sem provedor identificado.`;
   $('[data-provider-results]').innerHTML=data.total?table(data.items):'<p>Nenhum computador com vínculo atual de agente e dados recebidos foi encontrado. Cadastros manuais e vínculos encerrados não entram neste relatório.</p>';
  }catch(e){data=null;if(d.isConnected&&!controller.signal.aborted){error(e.message);$('[data-provider-status]').textContent='Não foi possível gerar o relatório.';}}
  finally{busy=false;if(d.isConnected)actions();}
 }
 async function download(format){if(!data||busy||exporting)return;exporting=true;error('');actions();try{
  const rows=data.items.map(r=>[r.unit_name,r.hostname||'Não recebido',r.public_ip||'Não recebido',r.provider||'Não identificado',when(r.last_contact_at)]);
  // File and on-screen preview use exactly the same reading, even after later heartbeats.
  const stamp=new Date(new Date(data.server_time).getTime()-3*3600000).toISOString().slice(0,19).replace('T','_').replaceAll(':','-');
  await downloadTable(columns,rows,format,'SEMED_PROVEDORES_'+stamp);
 }catch(e){if(d.isConnected)error(e.message);}finally{exporting=false;if(d.isConnected)actions();}}
 $('[data-provider-close]').onclick=()=>d.close();$('[data-provider-refresh]').onclick=load;
 $('[data-provider-print]').onclick=()=>{if(data&&!busy&&!exporting)window.print();};
 d.querySelectorAll('[data-provider-export]').forEach(b=>b.onclick=()=>download(b.dataset.providerExport));
 d.addEventListener('close',()=>{controller?.abort();d.remove();if(current===d)current=null;if(trigger?.isConnected)trigger.focus();},{once:true});load();
}
