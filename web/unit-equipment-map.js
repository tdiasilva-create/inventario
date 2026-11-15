import {icon} from './desktop-icons.js';
import {categories} from './collector-schema.js';
import {readPanelJson} from './desktop-request.js';
import {equipmentSignal} from './equipment-signal.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const type=item=>item.data.category==='other'?item.data.customCategory||'Outro equipamento':categories.find(c=>c[0]===item.data.category)?.[1]||(item.data.category==='computer'?'Computador':item.data.category||'Equipamento');
const name=item=>item.display_name||item.hostname||item.data.position_label||type(item);
const glyph=item=>({computer:'monitor',desktop:'monitor',notebook:'laptop',tablet:'tablet',printer:'print',projector:'projector',tv:'tv',router:'network',switch:'network',ap:'network'})[item.data.category]||'box';
const count=r=>`${r.records} cadastro${r.records===1?'':'s'} · ${r.items} ${r.items===1?'item':'itens'}`;
const button=(label,action,attrs='')=>`<button type="button" class="btn secondary" data-sector-action="${action}" ${attrs}>${label}</button>`;
const message=(text,error=false)=>`<p class="sector-message" role="${error?'alert':'status'}">${esc(text)}</p>`;
const isComputer=item=>['computer','desktop','notebook'].includes(item.data.category);
const signal=item=>{if(!isComputer(item))return '';const s=equipmentSignal(item);return `<span class="sector-signal" data-sector-monitor="${esc(item.id)}" data-signal="${s.color}" role="img" aria-label="${esc(s.label)}" title="${esc(s.title)}"><span aria-hidden="true"></span></span>`;};

export function createUnitEquipmentMap({onOpenEquipment=()=>{},onRefresh=()=>{}}={}) {
 let unit=null,data=null,error='',busy=false,mode='chart',selected=null,mounted=null,controller=null,epoch=0;
 const pages=new Map(),opened=new Set(),requests=new Map();
 const host=()=>document.querySelector('#unit-equipment-map');
 function reset(){epoch++;controller?.abort();for(const request of requests.values())request.abort();requests.clear();pages.clear();opened.clear();data=null;selected=null;error='';busy=false;}
 function equipment(item,sector){return `<li><button type="button" class="sector-equipment ${selected?.item.id===item.id?'is-selected':''}" data-sector-action="select" data-sector="${esc(sector.id)}" data-id="${esc(item.id)}" aria-pressed="${selected?.item.id===item.id}" aria-haspopup="dialog" title="${esc(name(item))} · ${esc(sector.name)} · ID ${esc(item.id)}${isComputer(item)?' · '+esc(equipmentSignal(item).title):''}">${icon(glyph(item))}<span class="sector-equipment-name"><strong>${esc(name(item))}</strong><small>${esc(type(item))}${item.data.mode==='Lote'?' · Lote: '+esc(item.data.quantity)+' itens':''}</small>${item.record_partial?'<span class="eq-badge">PARCIAL</span>':''}</span>${signal(item)}</button></li>`;}
 function sectorCard(sector){const page=pages.get(sector.id),open=opened.has(sector.id);return `<article class="sector-card" data-sector-card="${esc(sector.id)}"><h4><button type="button" data-sector-action="toggle" data-sector="${esc(sector.id)}" aria-expanded="${open}" aria-controls="sector-body-${esc(sector.id)}">${icon('rooms')}<span>${esc(sector.name)}<small>${esc(count(sector))}</small></span><span aria-hidden="true">${open?'−':'+'}</span></button></h4><div id="sector-body-${esc(sector.id)}" class="sector-body" ${open?'':'hidden'}>${page?.loading?message('Carregando equipamentos…'):page?.error?message(page.error,true)+button('Tentar novamente','page',`data-sector="${esc(sector.id)}" data-offset="${page.offset}"`):page?.items?`${page.items.length?'<ul class="sector-equipment-list">'+page.items.map(item=>equipment(item,sector)).join('')+'</ul>':message('Nenhum equipamento cadastrado.')}<div class="sector-paging">${page.total>50?button('Anterior','page',`data-sector="${esc(sector.id)}" data-offset="${Math.max(0,page.offset-50)}" ${page.offset?'':'disabled'}`)+`<small>Página ${Math.floor(page.offset/50)+1}</small>`+button('Próxima','page',`data-sector="${esc(sector.id)}" data-offset="${page.nextOffset??0}" ${page.nextOffset===null?'disabled':''}`):''}</div>`:message(sector.records?'Selecione o setor para consultar.':'Nenhum equipamento cadastrado.')}</div>${!open?`<p class="sector-hint">${sector.records?'Clique para ver os equipamentos':'Nenhum equipamento cadastrado'}</p>`:''}</article>`;}
 function html(){return `<header class="sector-heading"><div><h2>Mapa de Setores e Equipamentos</h2><p>Dados atuais salvos, incluindo coletas parciais. Relação de localização dos cadastros.</p></div><div class="sector-actions"><div class="sector-modes" role="group" aria-label="Visualização dos setores">${button('Organograma','chart',`aria-pressed="${mode==='chart'}"`)}${button('Lista','list',`aria-pressed="${mode==='list'}"`)}</div>${button('Atualizar','reload',busy?'disabled':'')}</div></header><p class="sector-legend"><span><i data-signal="online"></i>Online</span><span><i data-signal="offline"></i>Offline</span><span><i data-signal="unknown"></i>Sem agente / sem informação</span></p>${error?message(error,true)+button('Tentar novamente','reload'):busy?message('Consultando setores e equipamentos…'):data?`<div class="sector-viewport" tabindex="0" aria-label="Organização dos setores e equipamentos da unidade"><div class="sector-layout sector-layout--${mode}"><div class="sector-unit">${icon('building')}<div><strong>${esc(unit.name)}</strong><small>${data.sectors.filter(r=>r.id!=='unassigned').length} ${data.sectors.filter(r=>r.id!=='unassigned').length===1?'ambiente':'ambientes'} · ${esc(count(data))}</small></div></div>${data.sectors.length?'<div class="sector-branches">'+data.sectors.map(sectorCard).join('')+'</div>':'<p class="sector-message">Nenhum ambiente ou equipamento cadastrado nesta unidade.</p>'}</div></div><p class="sector-footnote">Cada cadastro aparece uma vez. Lotes mantêm a quantidade de itens informada. Use Atualizar para consultar novas alterações.</p>`:''}`;}
 function paint(){const node=host();if(!node)return;const focus=document.activeElement,inside=node.contains(focus),action=inside?focus.dataset.sectorAction:null,sector=focus?.dataset?.sector,id=focus?.dataset?.id;
  const scroll=node.querySelector('.sector-viewport')?.scrollLeft||0;
  node.innerHTML=html();
  const viewport=node.querySelector('.sector-viewport');if(viewport)viewport.scrollLeft=scroll;
  if(action)node.querySelector(`[data-sector-action="${CSS.escape(action)}"]${sector?`[data-sector="${CSS.escape(sector)}"]`:''}${id?`[data-id="${CSS.escape(id)}"]`:''}`)?.focus({preventScroll:true});
 }
 async function load(){reset();const turn=epoch;controller=new AbortController();busy=true;paint();try{const next=await readPanelJson('/api/inventory/unit-equipment-map?'+new URLSearchParams({unitId:unit.id}),{signal:controller.signal});if(turn===epoch)data=next;}catch(e){if(turn===epoch&&e.name!=='AbortError')error=e.message;}finally{if(turn===epoch){busy=false;paint();}}}
 async function loadSector(sectorId,offset=0){
  const turn=epoch,request=new AbortController();requests.get(sectorId)?.abort();requests.set(sectorId,request);pages.set(sectorId,{loading:true,offset});paint();
  try{const page=await readPanelJson('/api/inventory/equipment?'+new URLSearchParams({unitId:unit.id,scope:'current',sectorId,offset}),{signal:request.signal});if(turn!==epoch||requests.get(sectorId)!==request)return;
   if(offset>0&&offset>=page.total)return loadSector(sectorId,Math.max(0,Math.ceil(page.total/50)-1)*50);
   for(const item of page.items)item.signalCheckedAt=Date.parse(page.server_time)||0;
   pages.set(sectorId,page);const sector=data.sectors.find(s=>s.id===sectorId);sector.records=page.total;sector.items=page.totalItems;data.records=page.unitTotal;data.items=page.unitItems;
   if(selected?.sector.id===sectorId){const updated=page.items.find(i=>i.id===selected.item.id);selected=updated?{sector,item:updated}:null;}
  }catch(e){if(turn===epoch&&requests.get(sectorId)===request&&e.name!=='AbortError')pages.set(sectorId,{error:e.message,offset});}
  finally{if(turn===epoch&&requests.get(sectorId)===request){requests.delete(sectorId);paint();}}
 }
 // Update only signals: preserve focus, scrolling, selected photos and open equipment details.
 function updateSignals(){const node=host();if(!unit||!node)return;for(const [sectorId,page] of pages){for(const item of page.items||[]){
  if(!isComputer(item))continue;const s=equipmentSignal(item);
  for(const dot of node.querySelectorAll('[data-sector-monitor="'+CSS.escape(item.id)+'"]')){dot.dataset.signal=s.color;dot.setAttribute('aria-label',s.label);dot.title=s.title;const card=dot.closest('[data-sector-action="select"]');if(card)card.title=name(item)+' · '+(data.sectors.find(r=>r.id===sectorId)?.name||'')+' · ID '+item.id+' · '+s.title;}
  const detail=node.querySelector('[data-sector-status="'+CSS.escape(item.id)+'"]');if(detail){detail.textContent=s.label;detail.title=s.title;}
 }}}
 window.addEventListener('semed:monitoring',event=>{
  if(!unit||!host())return;const checkedAt=Date.parse(event.detail?.server_time)||0,statuses=new Map((event.detail?.statuses||[]).map(s=>[s.equipment_id,s]));
  for(const page of pages.values())for(const item of page.items||[]){const status=statuses.get(item.id);if(!status||checkedAt<(item.signalCheckedAt||0))continue;item.monitorState=status.state;item.last_contact_at=status.last_live_contact_at;item.signalCheckedAt=checkedAt;item.signalError=false;}
  updateSignals();
 });
 window.addEventListener('semed:monitoring-error',()=>{if(!unit||!host())return;for(const page of pages.values())for(const item of page.items||[])item.signalError=true;updateSignals();});
 function attach(nextUnit){
  if(!nextUnit){if(unit){reset();unit=null;mounted=null;}return;}
  const changed=unit?.id!==nextUnit.id;unit=nextUnit;const node=host();if(!node)return;
  if(node!==mounted){mounted=node;node.onclick=async e=>{const target=e.target.closest('[data-sector-action]');if(!target)return;const action=target.dataset.sectorAction,sectorId=target.dataset.sector;
   if(action==='chart'||action==='list'){mode=action;paint();}
   else if(action==='reload'){onRefresh();load();}
   else if(action==='toggle'){if(opened.has(sectorId)){opened.delete(sectorId);paint();}else{opened.add(sectorId);if(!pages.has(sectorId))loadSector(sectorId);else paint();}}
   else if(action==='page')loadSector(sectorId,Number(target.dataset.offset));
   else if(action==='select'){const item=pages.get(sectorId)?.items?.find(i=>i.id===target.dataset.id),sector=data.sectors.find(s=>s.id===sectorId);if(!item||!sector)return;selected={item,sector};paint();onOpenEquipment(unit,item.id);}
  };paint();}
  if(changed)load();
 }
 return {markup:()=>'<section class="panel unit-equipment-map" id="unit-equipment-map" aria-label="Mapa de Setores e Equipamentos"></section>',attach,focusSelection:()=>host()?.querySelector(selected?'[data-sector-action="select"][data-id="'+CSS.escape(selected.item.id)+'"]':'[data-sector-action="toggle"]')?.focus({preventScroll:true}),
 changed(change){if(change.unitId!==unit?.id)return;for(const [sectorId,page]of pages){const item=page.items?.find(i=>i.id===change.id);if(!item)continue;if(change.type==='rename'){item.display_name=change.name;paint();}else if(change.type==='delete'){if(selected?.item.id===item.id)selected=null;loadSector(sectorId,page.offset);}break;}},reload:()=>unit&&load()};
}
