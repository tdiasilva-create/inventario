import {icon} from './desktop-icons.js';
import {startNotifications} from './desktop-notifications.js';
import {startDemandCount} from './desktop-demand-count.js';
import {startPulse} from './panel-pulse.js';
import {unitSearchMarkup,bindUnitSearch} from './panel-unit-search.js';
// Moldura do painel — estrutura "Mesa de dados" (10/11/2026): trilho de ícones que expande ao passar o mouse
// (ou fixado pelo usuário), cabeçalho de uma linha com busca ampla e faixa de pulso da rede em todas as páginas.
// Itens e grupos do menu são os mesmos de antes (Consulta · Gestão · Administração), por decisão do responsável.
// Only these routes are rendered by desktop.js without loading another document.
export const desktopPageRoutes={'Coletas em andamento':'/coletas-em-andamento','Panorama':'/panorama','Mapa da Rede':'/mapa','Unidades':'/unidades','Ambientes':'/ambientes','Equipamentos':'/equipamentos','Ocorrências':'/ocorrencias','Relatórios':'/relatorios','Planejamento':'/planejamento','Exportar dados':'/exportar','Configurações':'/configuracoes','Detalhe da Unidade':'/unidade'};
export const pageRoutes={...desktopPageRoutes,'Computadores':'/computadores','Central de demandas':'/demandas','Log de comunicação':'/log-comunicacao','Controle das coletas':'/controle-coletas'};
export const roleNames={root:'Root (superadministrador)',admin:'Administrador',operador:'Operador',visualizador:'Visualizador'};
export const panelVersion='v1.2 · 10/11/2026';
const RAIL_KEY='painel:trilho';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const navItem=(glyph,name,href)=>{const active=location.pathname===href;return `<a class="nav-item${active?' active':''}" href="${href}" title="${esc(name)}" ${active?'aria-current="page"':''}>${icon(glyph)}<span>${esc(name)}</span></a>`;};
function railPinned(){try{return localStorage.getItem(RAIL_KEY)==='aberto';}catch{return false;}}
export function panelShell(user,content=''){
const consult=[['home','Panorama'],['clipboard','Controle das coletas'],['map','Mapa da Rede'],['building','Unidades'],['rooms','Ambientes'],['cpu','Computadores'],['clipboard','Log de comunicação'],['monitor','Equipamentos'],['alert','Ocorrências'],['chart','Relatórios']];
const admin=user?.role==='root'?[['building','Cadastro','/cadastro-unidades'],['users','Usuários','/usuarios'],['clipboard','Operadores × unidades','/operadores-unidades'],['shield','Segurança e auditoria','/seguranca'],['gear','Configurações','/configuracoes']]:user?.role==='admin'?[['users','Usuários','/usuarios'],['gear','Configurações','/configuracoes']]:[];
if(user?.role==='root')admin.splice(2,0,['wifi','Testes de internet','/testes-internet']);
const pulse=['root','admin','visualizador'].includes(user?.role)?'<div class="pulse" id="panel-pulse" aria-label="Estado da rede" aria-live="polite"><span class="pulse-item" data-tone="idle"><i></i><small>Rede</small><b>consultando…</b></span></div>':'';
return `<aside class="sidebar${railPinned()?' pinned':''}" aria-label="Menu do painel"><div class="identity"><div class="symbol">${icon('shield')}${icon('building','symbol-inner')}</div><div><strong>SEMED</strong><small>Secretaria Municipal<br>de Educação</small></div></div><nav class="navigation" aria-label="Navegação principal"><h2 class="nav-group">Consulta</h2>${user?.role==='operador'?navItem('building','Minhas unidades','/conta'):consult.map(([i,n])=>navItem(i,n,pageRoutes[n])).join('')}${user?.role!=='operador'?`<h2 class="nav-group">Gestão</h2>${navItem('clipboard','Central de demandas','/demandas')}${navItem('sliders','Planejamento','/planejamento')}${navItem('export','Exportar dados','/exportar')}`:''}${admin.length?'<h2 class="nav-group">Administração</h2>'+admin.map(([i,n,p])=>navItem(i,n,p)).join(''):''}</nav><button class="rail-pin" type="button" data-action="rail-pin" aria-pressed="${railPinned()}" title="Manter o menu aberto">${icon('rail')}<span>Menu fixo</span></button></aside><div class="layout"><header class="header"><button class="icon-button menu-toggle" data-action="menu" aria-label="Abrir menu" aria-expanded="false">${icon('menu')}</button><div><h1>Inventário Tecnológico SEMED</h1><h2>Centro de Inteligência Tecnológica</h2></div>${['root','admin','visualizador'].includes(user?.role)?unitSearchMarkup():''}<button class="icon-button notification" data-action="notifications" aria-label="Notificações">${icon('bell')}</button><div class="profile-wrap"><button class="profile" id="profile-toggle" aria-expanded="false" aria-controls="profile-menu"><span class="avatar">${esc(user?.username?.slice(0,2).toUpperCase()||'—')}</span><span><strong>${esc(user?.displayName||user?.username||'Acesso local')}</strong><small>${esc(roleNames[user?.role]||'Desenvolvimento local')}</small></span>${icon('down')}</button><div id="profile-menu" class="profile-menu" hidden><a href="/conta">Minha conta</a><button id="shell-logout">Sair</button></div></div></header>${pulse}<main class="workspace" id="content">${content}</main><footer class="demo-ribbon" id="mode-note">Inventário Tecnológico SEMED · ${panelVersion}</footer></div><div id="live" class="sr" aria-live="polite"></div>`;
}
export function bindPanelShell(user,{unitSearch}={}){
 startDemandCount(user);
 startNotifications(user);
 startPulse(user);
 const sidebar=document.querySelector('.sidebar'),toggle=document.querySelector('.menu-toggle');
 const profile=document.querySelector('#profile-toggle'),profileMenu=document.querySelector('#profile-menu');
 const closeProfile=(restore=false)=>{if(!profileMenu||profileMenu.hidden)return;profileMenu.hidden=true;profile?.setAttribute('aria-expanded','false');if(restore)profile?.focus();};
 const closeActions=(except=null)=>{for(const menu of document.querySelectorAll('details.actions-menu[open]'))if(menu!==except)menu.open=false;};
 profile?.addEventListener('click',()=>{const open=profileMenu.hidden;closeActions();profileMenu.hidden=!open;profile.setAttribute('aria-expanded',String(open));});
 document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap'))closeProfile();closeActions(e.target.closest('details.actions-menu'));});
 document.addEventListener('toggle',e=>{if(e.target.matches('details.actions-menu')&&e.target.open){closeActions(e.target);closeProfile();}},true);
 // Ao focar outro resumo, aguardar o clique/toggle: fechar antes do mouseup
 // deslocaria as linhas da tabela e faria o clique acertar o lugar errado.
 document.addEventListener('focusin',e=>{if(!e.target.closest('.profile-wrap'))closeProfile();if(!e.target.closest('details.actions-menu'))closeActions();});
 document.querySelector('#shell-logout')?.addEventListener('click',async()=>{try{const r=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':user?.csrf||''},body:'{}'});if(!r.ok)throw Error();location.assign('/login');}catch{const p=document.createElement('p');p.role='alert';p.textContent='Não foi possível sair. Tente novamente.';document.querySelector('#profile-menu').append(p);}});
 toggle?.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
 sidebar?.querySelector('[data-action="rail-pin"]')?.addEventListener('click',e=>{const pinned=sidebar.classList.toggle('pinned');e.currentTarget.setAttribute('aria-pressed',String(pinned));try{localStorage.setItem(RAIL_KEY,pinned?'aberto':'fechado');}catch{}});
 bindUnitSearch(document.querySelector('.unit-search'),unitSearch);
 const closeMenu=()=>{sidebar?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Abrir menu');};
 sidebar?.addEventListener('click',e=>{if(e.target.closest('.nav-item')&&sidebar.classList.contains('open'))closeMenu();});
 document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;
  if(e.key==='Escape'&&profileMenu&&!profileMenu.hidden){e.preventDefault();closeProfile(true);return;}
  if(e.key==='Escape'){const actions=document.querySelector('details.actions-menu[open]');if(actions){e.preventDefault();closeActions();actions.querySelector('summary')?.focus();return;}}
  if(e.key==='Escape'&&sidebar?.classList.contains('open')){closeMenu();toggle?.focus();}
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&!document.activeElement?.isContentEditable){const input=document.querySelector('.search input');if(input?.getClientRects().length){e.preventDefault();input.focus();input.select();}}
 });
}
