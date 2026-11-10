import {panelShell,bindPanelShell} from './panel-shell.js';
import {createEquipmentConsultation} from './desktop-equipment.js';
import {equipmentLinkBadge} from './equipment-link-state.js';
import {categories} from './collector-schema.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const category=v=>categories.find(c=>c[0]===v)?.[1]||(v==='computer'?'Computador':'Equipamento');
let user,consultation,data,controller,sequence=0,opened='';
const parameters=()=>{const s=new URLSearchParams(location.search);return {q:(s.get('q')||'').trim(),unitOffset:s.get('unitOffset')||'0',equipmentOffset:s.get('equipmentOffset')||'0'};};
async function read(url,signal){
 const response=await fetch(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(response.status===401?'Sua sessão expirou. Entre novamente no painel.':response.status===403?'Seu perfil não tem acesso a esta consulta.':body.error||body.message||'Não foi possível consultar. Tente novamente.');
 return body;
}
function pagination(group,page){return page.total?`<nav class="global-search-pages" aria-label="Páginas de ${group==='units'?'unidades':'equipamentos'}"><span>${page.offset+1}–${page.offset+page.items.length} de ${page.total}</span><button data-search-page="${group}" data-offset="${Math.max(0,page.offset-page.pageSize)}" ${page.offset===0?'disabled':''}>Anterior</button><button data-search-page="${group}" data-offset="${page.nextOffset??0}" ${page.nextOffset===null?'disabled':''}>Próxima</button></nav>`:'';}
function render(){
 const units=data.units,equipment=data.equipment;
 $('#search-results').innerHTML=`<div class="global-search-groups"><section class="panel global-search-group" aria-labelledby="search-units-title"><h3 id="search-units-title">Unidades <span>${units.total}</span></h3>${units.items.length?'<ul>'+units.items.map(u=>`<li><a class="global-unit-result" href="/unidade?id=${encodeURIComponent(u.id)}"><strong>${esc(u.name)}</strong><span>${esc(u.unit_type||'Tipo não informado')} · INEP ${esc(u.code||'—')}</span><small>Gestor: ${esc(u.manager_name||'Não informado')}</small><span class="global-result-action">Abrir unidade →</span></a></li>`).join('')+'</ul>':'<p class="global-empty">Nenhuma unidade encontrada para esta busca.</p>'}${pagination('units',units)}</section><section class="panel global-search-group" aria-labelledby="search-equipment-title"><h3 id="search-equipment-title">Equipamentos <span>${equipment.total} ficha(s)</span></h3>${equipment.items.length?'<ul>'+equipment.items.map(e=>`<li class="global-equipment-result"><button class="global-equipment-open" data-search-equipment="${esc(e.id)}"><strong>${esc(e.display_name||e.hostname||e.position_label||category(e.category))}</strong><span>${esc(category(e.category))}${[e.brand,e.model].filter(Boolean).length?' · '+esc([e.brand,e.model].filter(Boolean).join(' ')):''}</span><span><b>${esc(e.unit_name)}</b> · ${esc(e.environment_name)}${e.position_label?' · '+esc(e.position_label):''}</span><small>Hostname: ${esc(e.hostname||'Não recebido')}</small><code>ID: ${esc(e.id)}</code><span class="global-result-action">Ver ficha e fotos →</span></button><div class="global-result-tags">${equipmentLinkBadge(e)}${e.partial?'<span class="eq-badge">PARCIAL · salvo em coleta</span>':'<span class="global-published">Publicado</span>'}</div>${e.anydesk||e.rustdesk?`<p class="global-remote">${e.anydesk?'AnyDesk: <code>'+esc(e.anydesk)+'</code>':''}${e.rustdesk?' RustDesk: <code>'+esc(e.rustdesk)+'</code>':''}</p>`:''}</li>`).join('')+'</ul>':'<p class="global-empty">Nenhum equipamento encontrado para esta busca.</p>'}${pagination('equipment',equipment)}</section></div>`;
 $('#search-status').textContent=`${units.total} unidade(s) e ${equipment.total} ficha(s) de equipamento encontradas. Atualizado às ${new Date(data.server_time).toLocaleTimeString('pt-BR')}.`;
}
async function load(){
 const seq=++sequence;controller?.abort();controller=new AbortController();
 const params=parameters(),input=$('.search input');input.value=params.q;
 $('#search-term').textContent=params.q?'Resultados para “'+params.q+'”':'Busca em toda a rede';
 $('#search-error').hidden=true;
 if(!params.q){data=null;$('#search-status').textContent='Digite pelo menos 2 caracteres na busca do cabeçalho e pressione Enter ou o botão de pesquisa.';$('#search-results').innerHTML='';return;}
 $('#search-results').setAttribute('aria-busy','true');$('#search-status').textContent='Buscando unidades e equipamentos…';$('#search-results').innerHTML='';
 try{const result=await read('/api/inventory/search?'+new URLSearchParams(params),controller.signal);if(seq!==sequence)return;
  // A exclusão/edição de outro usuário pode esvaziar a última página.
  let reset=false;for(const [group,key] of [['units','unitOffset'],['equipment','equipmentOffset']]){const p=result[group];if(p.offset>0&&p.offset>=p.total){params[key]=String(Math.max(0,Math.ceil(p.total/p.pageSize)-1)*p.pageSize);reset=true;}}
  if(reset){history.replaceState(null,'','/busca?'+new URLSearchParams(params));return load();}
  data=result;render();
 }catch(error){if(seq!==sequence||error.name==='AbortError')return;data=null;$('#search-status').textContent='A consulta não foi concluída.';$('#search-error').hidden=false;$('#search-error-text').textContent=error.message;}
 finally{if(seq===sequence)$('#search-results').setAttribute('aria-busy','false');}
}
function showConsultation(){
 $('#search-results').hidden=consultation.active;
 $('#search-consultation').innerHTML=consultation.markup();consultation.attach();
}
async function init(){
 try{
  user=await read('/api/auth/me');if(!user.canView||user.mustChangePassword){location.assign('/conta');return;}
  $('#dashboard').innerHTML=panelShell(user,`<div class="ops-header"><div><h2 id="search-term" tabindex="-1">Busca em toda a rede</h2><p>Unidades ativas e equipamentos cadastrados. Pesquise nome, hostname, ID, AnyDesk, RustDesk, série, patrimônio, marca ou modelo.</p><p>Unidades também podem ser encontradas por INEP ou gestor. Equipamentos com dados ainda não publicados aparecem como <strong>PARCIAL</strong>.</p></div><button type="button" class="ops-btn" data-search-refresh>Atualizar resultados</button></div><p id="search-status" role="status"></p><div id="search-error" class="global-search-error" role="alert" hidden><p id="search-error-text"></p><button data-search-refresh>Tentar novamente</button> <a href="/login">Entrar no painel</a></div><div id="search-results"></div><div id="search-consultation"></div>`);
  bindPanelShell(user);
  consultation=createEquipmentConsultation({scope:'current',closeLabel:'Voltar aos resultados',refresh:showConsultation,canRename:()=>user.role==='root',csrf:()=>user.csrf,onClose:async()=>{await load();const result=$(`[data-search-equipment="${CSS.escape(opened)}"]`);(result||$('#search-term')).focus();}});
  $('#content').addEventListener('click',event=>{
   const result=event.target.closest('[data-search-equipment]');if(result&&data){const equipment=data.equipment.items.find(e=>e.id===result.dataset.searchEquipment);if(!equipment)return;opened=equipment.id;consultation.open({id:equipment.unit_id,name:equipment.unit_name},'',equipment.id);return;}
   const page=event.target.closest('[data-search-page]');if(page){const params=parameters();params[page.dataset.searchPage==='units'?'unitOffset':'equipmentOffset']=page.dataset.offset;history.pushState(null,'','/busca?'+new URLSearchParams(params));load().then(()=>$('#search-term').focus());return;}
   if(event.target.closest('[data-search-refresh]')){consultation.hide();showConsultation();load();}
  });
  window.addEventListener('popstate',()=>{consultation.hide();showConsultation();load();});
  await load();
 }catch(error){$('#dashboard').innerHTML=`<main class="global-search-error"><h1>Busca indisponível</h1><p>${esc(error.message)}</p><a href="/busca${esc(location.search)}">Tentar novamente</a> · <a href="/login">Entrar no painel</a></main>`;}
}
init();
