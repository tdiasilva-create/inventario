import {panelShell,bindPanelShell} from './panel-shell.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s),labels={not_started:'Não iniciada',in_progress:'Em andamento · PARCIAL',preserved:'Visita anterior preservada'};
let controller,sequence=0,data=null;
const parameters=()=>{const s=new URLSearchParams(location.search);return {q:s.get('q')||'',state:s.get('state')||'',offset:s.get('offset')||'0'};};
async function read(path,signal){const r=await fetch(path,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)}),v=await r.json().catch(()=>({}));if(!r.ok)throw Error(r.status===401?'Sua sessão expirou. Entre novamente.':v.error||'Não foi possível consultar. Tente novamente.');return v;}
function render(){
 $('#pending-status').textContent=`${data.total} unidade(s) com coleta pendente${parameters().q||parameters().state?' neste filtro':''}. Atualizado às ${new Date(data.server_time).toLocaleTimeString('pt-BR')}.`;
 $('#pending-results').innerHTML=data.items.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Unidade</th><th>Tipo / INEP</th><th>Coleta</th><th>Consulta</th></tr></thead><tbody>${data.items.map(u=>`<tr><td><a href="/unidade?id=${encodeURIComponent(u.unit_id)}">${esc(u.name)}</a></td><td>${esc(u.unit_type)}<br><small>INEP ${esc(u.code||'—')}</small></td><td>${esc(labels[u.state])}</td><td>${u.inspection_id?`<a class="ops-btn" href="/coletas-em-andamento?vistoria=${encodeURIComponent(u.inspection_id)}">Ver coleta parcial</a>`:`<a class="ops-btn" href="/unidade?id=${encodeURIComponent(u.unit_id)}">Ver unidade</a>`}</td></tr>`).join('')}</tbody></table></div><nav class="global-search-pages" aria-label="Páginas de coletas pendentes"><span>${data.offset+1}–${data.offset+data.items.length} de ${data.total}</span><button data-collection-page="${Math.max(0,data.offset-data.pageSize)}" ${data.offset===0?'disabled':''}>Anterior</button><button data-collection-page="${data.nextOffset??0}" ${data.nextOffset===null?'disabled':''}>Próxima</button></nav>`:'<p class="global-empty">Nenhuma coleta pendente para esta consulta.</p>';
}
async function load({reset=false}={}){
 const seq=++sequence;controller?.abort();controller=new AbortController();const params=parameters();
 if(reset){$('#pending-filter [name=q]').value=params.q;$('#pending-filter [name=state]').value=params.state;$('#pending-results').innerHTML='';$('#pending-status').textContent='Consultando…';}
 $('#pending-results').setAttribute('aria-busy','true');
 try{const result=await read('/api/inventory/pending-collections?'+new URLSearchParams(params),controller.signal);if(seq!==sequence)return;
  if(result.offset>0&&result.offset>=result.total){params.offset=String(Math.max(0,Math.ceil(result.total/result.pageSize)-1)*result.pageSize);history.replaceState(null,'','/coletas-pendentes?'+new URLSearchParams(params));return load();}
  data=result;$('#pending-error').hidden=true;render();
 }catch(e){if(seq!==sequence||e.name==='AbortError')return;$('#pending-error').hidden=false;$('#pending-error-text').textContent=e.message;$('#pending-status').textContent='A atualização não foi concluída. Os resultados anteriores, se presentes, podem estar desatualizados.';}
 finally{if(seq===sequence)$('#pending-results').setAttribute('aria-busy','false');}
}
async function init(){try{
 const user=await read('/api/auth/me');if(!user.canView||user.mustChange){location.assign('/conta');return;}
 $('#dashboard').innerHTML=panelShell(user,`<div class="ops-header"><div><h2>Coletas pendentes</h2><p>Toda a rede · cada unidade conta uma vez.</p><p>Unidades ativas elegíveis sem coleta concluída ou com uma revisita aberta. Obras e unidades fora do escopo da coleta não entram nesta lista.</p><p>Rascunhos confirmados no servidor são parciais. A coleta e sua conclusão continuam no coletor.</p></div><button class="ops-btn" data-collection-refresh>Atualizar lista</button></div><section class="panel pending-list"><form id="pending-filter" class="pending-list-filters"><label>Unidade ou INEP<input type="search" name="q" maxlength="120"></label><label>Situação<select name="state"><option value="">Todas</option><option value="not_started">Não iniciada</option><option value="in_progress">Em andamento</option><option value="preserved">Visita anterior preservada</option></select></label><button type="submit" class="ops-btn">Filtrar</button></form><p id="pending-status" role="status"></p><div id="pending-error" class="global-search-error" role="alert" hidden><p id="pending-error-text"></p><button data-collection-refresh>Tentar novamente</button> <a href="/login">Entrar no painel</a></div><div id="pending-results"></div></section>`);
 $('#pending-filter').addEventListener('submit',e=>{e.preventDefault();history.pushState(null,'','/coletas-pendentes?'+new URLSearchParams({q:e.target.elements.q.value.trim(),state:e.target.elements.state.value,offset:0}));load({reset:true});});
 $('#content').addEventListener('click',e=>{const page=e.target.closest('[data-collection-page]');if(page){history.pushState(null,'','/coletas-pendentes?'+new URLSearchParams({...parameters(),offset:page.dataset.collectionPage}));load();}if(e.target.closest('[data-collection-refresh]'))load();});
 window.addEventListener('popstate',()=>load({reset:true}));
 // Reutiliza o ciclo de 15 s da moldura. Nenhuma visita é criada por esta consulta.
 window.addEventListener('semed:pending-summary',()=>load());
 await load({reset:true});bindPanelShell(user);
 }catch(e){$('#dashboard').innerHTML=`<main class="global-search-error"><h1>Coletas pendentes indisponíveis</h1><p>${esc(e.message)}</p><a href="/coletas-pendentes">Tentar novamente</a> · <a href="/login">Entrar no painel</a></main>`;}}
init();
