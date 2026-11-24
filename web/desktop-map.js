import {geolocatedUnits} from './map-geography.js';
import {mountDispatchMap} from './dispatch-map.js';
import {icon} from './desktop-icons.js';
import {unitMapColor} from './unit-map-palette.js';
import {getPendingState} from './desktop-demand-count.js';
import {mountMapRoutePlanner} from './map-route-planner.js';
import {mountMapAgentFilter} from './map-agent-filter.js';
import {mapUnitTechnicians,unitTechniciansText} from './map-unit-technicians.js';
let current=null,generation=0;
let hardwareUnits=new Map(),paintFrame=null;
function schedulePaint(){if(!current||paintFrame!==null)return;paintFrame=requestAnimationFrame(()=>{paintFrame=null;paintHardware();});}
window.addEventListener('semed:monitoring',e=>{hardwareUnits=new Map((e.detail?.hardware?.units||[]).map(u=>[u.unit_id,u]));schedulePaint();});
window.addEventListener('semed:pending-summary',schedulePaint);
const openDemandCount=id=>getPendingState().data?.demands?.units?.find(u=>u.unit_id===id)?.total||0;
const mapFigure=value=>Number.isSafeInteger(value)&&value>=0?value.toLocaleString('pt-BR'):'Não informado';
const tooltipOptions={className:'v33-tooltip unit-map-tooltip',direction:'top'};
// Unidades próximas continuam nas coordenadas reais. O clique ambíguo pede
// uma escolha explícita em vez de favorecer o último marcador desenhado.
function selectMapUnit(context,id,event){
 if(current!==context||!context.markers.has(id))return;
 const origin=context.markers.get(id),point=context.map.latLngToContainerPoint(origin.marker.getLatLng());
 const radius=entry=>entry.demandNotice?24:entry.notice?16:entry.marker.getRadius()+2;
 const nearby=[...context.markers.entries()].filter(([,entry])=>context.map.latLngToContainerPoint(entry.marker.getLatLng()).distanceTo(point)<=radius(origin)+radius(entry));
 const choose=unitId=>{
  if(current!==context||!context.markers.has(unitId))return;
  context.map.closePopup();
  if(context.planner?.choose(unitId))return;
  // D-095: demanda aberta tem prioridade; nos demais casos abrir a unidade.
  // Pareceres de hardware continuam disponíveis pelo sino.
  if(openDemandCount(unitId)>0)window.location.assign('/demandas?unidade='+encodeURIComponent(unitId));
  else context.onSelect(unitId);
 };
 // Teclado já identifica um marcador pelo nome; não depende da área atingida.
 if(nearby.length===1||event?.keyboard){choose(id);return;}
 context.map.closePopup();origin.marker.closeTooltip();
 const content=document.createElement('section');content.className='map-unit-choices';content.setAttribute('aria-label','Escolher unidade neste ponto');
 content.style.maxHeight=Math.max(100,context.container.clientHeight-180)+'px';
 const title=document.createElement('strong');title.textContent='Qual unidade deseja consultar?';content.append(title);
 const hint=document.createElement('p');hint.textContent='Há unidades próximas neste ponto do mapa.';content.append(hint);
 for(const [unitId,entry] of nearby.sort((a,b)=>a[1].name.localeCompare(b[1].name,'pt-BR'))){
  const button=document.createElement('button');button.type='button';button.dataset.mapChoice=unitId;
  const name=document.createElement('strong');name.textContent=entry.name;
  const type=document.createElement('small');type.textContent=entry.type;
  const alert=hardwareUnits.get(unitId);if(alert?.pending)type.textContent+=' · Hardware aguardando parecer';else if(alert?.demands)type.textContent+=' · Demanda de hardware em atendimento';
  const count=openDemandCount(unitId);if(count)type.textContent+=' · '+count+' demanda(s) aberta(s)';
  button.append(name,type);button.addEventListener('click',()=>choose(unitId));content.append(button);
 }
 content.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();context.map.closePopup();origin.marker.getElement()?.focus();}});
 const popup=window.L.popup({className:'unit-choice-popup',maxWidth:340,minWidth:220,autoPanPadding:[24,32]}).setLatLng(origin.marker.getLatLng()).setContent(content);
 context.choice={popup,originId:id,ids:nearby.map(([unitId])=>unitId)};popup.on('remove',()=>{if(context.choice?.popup===popup)context.choice=null;});popup.openOn(context.map);
 content.querySelector('button')?.focus({preventScroll:true});
}
function paintHardware(){
 if(!current)return;const context=current;
 const pendingState=getPendingState(),demandRows=pendingState.data?.demands?.units,demandReady=Array.isArray(demandRows);
 const counts=new Map((demandReady?demandRows:[]).map(u=>[u.unit_id,u.total]));
 const acceptedCounts=new Map((demandReady?demandRows:[]).map(u=>[u.unit_id,u.accepted||0]));
 const mapStatus=context.container.closest('.map-panel').querySelector('[data-map-demand-status]');
 if(mapStatus){const hidden=demandReady&&!pendingState.error,message=pendingState.error?'Demandas: consulta indisponível. Última leitura preservada.':'Consultando demandas abertas…';if(mapStatus.hidden!==hidden)mapStatus.hidden=hidden;if(mapStatus.textContent!==message)mapStatus.textContent=message;}
 for(const [id,entry] of context.markers){const alert=hardwareUnits.get(id),pending=alert?.pending||0,demands=alert?.demands||0;
  const openDemands=counts.get(id)||0,accepted=acceptedCounts.get(id)||0,node=entry.marker.getElement(),position=entry.marker.getLatLng();
  const technicianText=unitTechniciansText(context.technicians,id,openDemands);
  const paintKey=JSON.stringify([entry.name,entry.type,entry.color,entry.students,entry.seats,pending,demands,openDemands,accepted,technicianText,!!pendingState.error,position.lat,position.lng]);
  if(entry.paintKey===paintKey&&entry.paintedNode===node)continue;
  entry.paintKey=paintKey;entry.paintedNode=node;
  entry.label.textContent=entry.name+' · '+entry.type+'\nAlunos: '+mapFigure(entry.students)+'\nVagas disponíveis: '+mapFigure(entry.seats)+(pending?'\n'+pending+' alteração(ões) de hardware aguardando decisão':'')+(openDemands?'\n'+openDemands+' demanda(s) aberta(s)':'');
  if(pendingState.error&&openDemands)entry.label.textContent+=' · Demandas: última leitura, atualização indisponível';
  if(accepted)entry.label.textContent+='\n'+accepted+' atendimento(s) aceito(s) · A caminho ou em atendimento';
  if(technicianText)entry.label.textContent+='\n'+technicianText;
  if(entry.marker.options.fillColor!==entry.color)entry.marker.setStyle({fillColor:entry.color});
  if(node){node.dataset.unitId=id;node.dataset.unitType=entry.type;node.dataset.hardwareState=pending?'pending':demands?'demand':'none';node.setAttribute('aria-label',entry.label.textContent);node.setAttribute('role','button');node.setAttribute('tabindex','0');node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();entry.marker.fire('click',{keyboard:true});}};}
  // O aviso pertence à coordenada da unidade; nunca à posição fixa da tela.
  if(pending||demands){
   const state=pending?'pending':'demand';
   if(!entry.notice){entry.notice=window.L.marker(entry.marker.getLatLng(),{keyboard:true,riseOnHover:true,zIndexOffset:700,icon:window.L.divIcon({className:'hardware-map-notice',iconSize:[32,32],iconAnchor:[16,16],html:'<span class="hardware-map-halo" aria-hidden="true"></span><span class="hardware-map-badge" aria-hidden="true"></span>'})}).addTo(context.unitGroup);entry.notice.on('click',e=>selectMapUnit(context,id,e));entry.notice.bindTooltip(()=>entry.label.cloneNode(true),tooltipOptions);}
   entry.notice.setLatLng(entry.marker.getLatLng());const badge=entry.notice.getElement();if(!badge)continue;badge.dataset.state=state;badge.dataset.unitId=id;badge.style.setProperty('--unit-color',entry.color);const hint=openDemands?'Abrir demandas desta unidade':'Abrir cadastro desta unidade';badge.setAttribute('aria-label',entry.label.textContent+' · '+hint);badge.title=entry.label.textContent+' · '+hint;badge.onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();entry.notice.fire('click',{keyboard:true});}};
  }else if(entry.notice){context.unitGroup.removeLayer(entry.notice);entry.notice=null;}
  // Anel externo de todas as demandas, sem modificar a categoria no centro.
  // Centro e anel seguem o mesmo destino aprovado em D-095.
  if(openDemands){
   if(!entry.demandNotice){entry.demandNotice=window.L.marker(entry.marker.getLatLng(),{keyboard:true,zIndexOffset:600,icon:window.L.divIcon({className:'demand-map-notice',iconSize:[48,48],iconAnchor:[24,24],html:'<span class="demand-map-ring" aria-hidden="true"></span>'})}).addTo(context.unitGroup);entry.demandNotice.on('click',e=>selectMapUnit(context,id,e));entry.demandNotice.bindTooltip(()=>entry.label.cloneNode(true),tooltipOptions);}
   entry.demandNotice.setLatLng(entry.marker.getLatLng());const ring=entry.demandNotice.getElement();
   if(ring){ring.dataset.unitId=id;ring.dataset.demands=String(openDemands);ring.dataset.attending=String(accepted>0);ring.dataset.stale=String(!!pendingState.error);ring.setAttribute('role','button');ring.setAttribute('aria-label',entry.label.textContent+' · Abrir demandas desta unidade');ring.title=entry.label.textContent+' · Abrir demandas desta unidade';ring.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();entry.demandNotice.fire('click',{keyboard:true});}};}
  }else if(entry.demandNotice){context.unitGroup.removeLayer(entry.demandNotice);entry.demandNotice=null;}
  for(const target of [entry.marker,entry.notice,entry.demandNotice])if(target?.isTooltipOpen())target.setTooltipContent(target===entry.marker?entry.label:()=>entry.label.cloneNode(true));
 }
}
const preference={base:'streets',boundary:false,camera:null,examples:true};
const geometryPromise=fetch('/data/map-v33.json').then(r=>{if(!r.ok)throw new Error('Geometria indisponível');return r.json();});
const examplesPromise=fetch('/data/map-examples.json').then(r=>{if(!r.ok)throw new Error('Exemplos indisponíveis');return r.json();}).catch(()=>null);
const basemaps={
 satellite:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attribution:'Imagens © Esri, Maxar, Earthstar Geographics, GIS User Community'},
 streets:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',attribution:'Mapa © Esri, HERE, Garmin, <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}
};
export function unmountMap(){
 generation++;
 if(paintFrame!==null){cancelAnimationFrame(paintFrame);paintFrame=null;}
 if(!current)return;
 collapseMap({restoreFocus:false,force:true});current.planner?.dispose();current.agentFilter?.dispose();
 preference.camera={center:current.map.getCenter(),zoom:current.map.getZoom()};
 current.stopDispatch?.();current.observer?.disconnect();current.map.remove();current=null;
}
function status(text,error=false){
 if(!current)return;
 const node=current.container.closest('.map-panel').querySelector('.cartography-status');
 if(node){node.textContent=text;node.classList.toggle('error',error);}
}
function baseStatus(){
 if(!current)return;
 const count=current.markerCount;
 if(current.agentFilter?.isActive()&&!count){status('Nenhuma unidade com coordenadas neste filtro');return;}
 const examples=current.exampleCount?`${preference.examples?current.exampleCount:0} locais de referência`:'Nenhuma unidade cadastrada';
 status(`Paço do Lumiar · ${count?count+' unidade(s) com coordenadas':examples}`);
}
function switchBase(){
 if(!current)return;
 const context=current;
 if(context.layer){context.map.removeLayer(context.layer);context.layer.off();}
 const source=basemaps[preference.base];
 let loaded=0,failed=0;
 context.container.dataset.mapLoading='true';
 status('Carregando cartografia…');
 const layer=window.L.tileLayer(source.url,{attribution:source.attribution,maxZoom:19,detectRetina:false});context.layer=layer;
 layer.on('tileload',()=>{loaded++;if(current===context)baseStatus();});
 layer.on('tileerror',()=>{failed++;if(current===context)status(loaded?'Parte da cartografia está indisponível.':'Não foi possível carregar a base. Tente a outra camada.',true);});
 layer.on('load',()=>{if(current!==context)return;context.container.dataset.mapLoading='false';if(!failed&&loaded)baseStatus();else if(failed)status(loaded?'Parte da cartografia está indisponível.':'Base indisponível · contorno preservado; tente Ruas ou Satélite.',true);});
 layer.addTo(context.map);
 context.container.dataset.mapBase=preference.base;
 context.container.closest('.map-panel').querySelectorAll('[data-map-base]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapBase===preference.base)));
}
export async function mountMap(container,{units=[],selected=null,onSelect=()=>{},focus=null,technical=false,identity=()=>null}={}){
 if(current?.container===container){current.onSelect=onSelect;updateMarkers(units,selected);if(focus)focusUnit(focus);return;}
 const token=++generation;
 try{
  const [data,examples]=await Promise.all([geometryPromise,examplesPromise]);
  if(token!==generation||!container.isConnected)return;
  const L=window.L;if(!L)throw new Error('Biblioteca cartográfica indisponível');
  const map=L.map(container,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,minZoom:8,maxZoom:19,preferCanvas:false});
  const context={map,container,geometry:data,layer:null,boundary:null,observer:null,markerCount:0,examplesData:examples,exampleCount:0,examplesLayer:L.layerGroup(),markers:new Map(),unitGroup:L.featureGroup().addTo(map),onSelect};current=context;
  if(technical){
   context.technicians={enabled:true,ready:false,error:false,units:new Map()};
   context.stopDispatch=mountDispatchMap(map,container,{onAssignments:result=>{
    if(current!==context)return;
    try{if(result.error)throw Error();context.technicians={enabled:true,ready:true,error:false,units:mapUnitTechnicians(result.routes)};}
    catch{context.technicians={...context.technicians,error:true};}
    schedulePaint();
   }});
  }
  if(technical&&container.closest('.panorama'))context.planner=mountMapRoutePlanner(context,identity);
  if(container.closest('.panorama')&&identity())context.agentFilter=mountMapAgentFilter(context,()=>updateMarkers(context.sourceUnits||[],context.selected));
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  context.boundary=L.polygon(data.ring,{color:'#ff4b1e',weight:2,opacity:.95,fillColor:'#ff4b1e',fillOpacity:.06,dashArray:'5 4'});
  context.boundary.bindTooltip('Área de referência do município',{className:'v33-tooltip',sticky:true});
  if(preference.boundary)context.boundary.addTo(map);
  updateMarkers(units,selected);
  for(const {unit:place,coordinates} of geolocatedUnits(examples?.records||[])){
   const marker=L.marker(coordinates,{keyboard:true,title:place.name,alt:place.name,icon:L.divIcon({className:'institutional-marker',html:icon('building'),iconSize:[30,36],iconAnchor:[15,36],popupAnchor:[0,-32]})});
   const tooltip=document.createElement('span');tooltip.textContent=place.name;
   marker.bindTooltip(tooltip,{className:'v33-tooltip',direction:'top',offset:[0,-28]});
   const popup=document.createElement('div');popup.className='institutional-popup';
   const heading=document.createElement('strong');heading.textContent=place.name;popup.append(heading);
   for(const text of [place.type,place.officialName&&place.officialName!==place.name?place.officialName:null,place.pole,place.neighborhood,'Exemplo da planilha fornecida · sem vínculo com o inventário']){
    if(!text)continue;const p=document.createElement('p');p.textContent=text;popup.append(p);
   }
   const source=document.createElement('a');source.textContent='Consultar fonte na planilha';source.href=examples.sourceUrl;source.target='_blank';source.rel='noopener';popup.append(source);
   marker.bindPopup(popup,{className:'institutional-leaflet-popup',maxWidth:260,autoPanPaddingTopLeft:L.point(55,70),autoPanPaddingBottomRight:L.point(15,85)});marker.addTo(context.examplesLayer);context.exampleCount++;
  }
  if(preference.examples)context.examplesLayer.addTo(map);
  if(preference.camera)map.setView(preference.camera.center,preference.camera.zoom,{animate:false});
  else frameMunicipality(context);
  if(focus)focusUnit(focus);
  paintHardware();
  L.control.scale({position:'bottomleft',imperial:false,maxWidth:100}).addTo(map);
  context.observer=new ResizeObserver(()=>map.invalidateSize({pan:!!context.expanded,animate:false}));context.observer.observe(container);
  const update=()=>{container.dataset.mapZoom=String(map.getZoom());};map.on('zoomend',update);update();
  container.dataset.markerCount=String(context.markerCount);container.dataset.exampleCount=String(context.exampleCount);container.dataset.mapReady='true';
  switchBase();updateBoundaryButton();updateExamplesButton();
 }catch{
  if(token!==generation||!container.isConnected)return;
  container.textContent='Não foi possível inicializar o mapa. Recarregue a página para tentar novamente.';
  container.dataset.mapReady='error';
 }
}
export function updateMarkers(units,selected){
 if(!current)return;const context=current,keep=new Set();
 context.sourceUnits=units;context.selected=selected;
 if(context.agentFilter)units=context.agentFilter.filter(units);
 for(const {unit,coordinates} of geolocatedUnits(units)){
  keep.add(unit.id);let entry=context.markers.get(unit.id);
  const type=unit.unit_type||unit.type||'Tipo não informado',color=unitMapColor(type);
  if(!entry){const marker=window.L.circleMarker(coordinates,{className:'unit-map-marker',color:'#fff',weight:2,fillColor:color,fillOpacity:1});
   const label=document.createElement('span');marker.bindTooltip(label,tooltipOptions);marker.on('click',e=>selectMapUnit(context,unit.id,e));marker.addTo(context.unitGroup);
   entry={marker,label};context.markers.set(unit.id,entry);
  }
  entry.selected=unit.id===selected;entry.name=unit.name||unit.nome||'Unidade sem nome';entry.type=type;entry.color=color;entry.students=unit.students_total;entry.seats=unit.seats_available;if(!entry.marker.getLatLng().equals(window.L.latLng(coordinates)))entry.marker.setLatLng(coordinates);if(entry.marker.getRadius()!==(entry.selected?9:6))entry.marker.setRadius(entry.selected?9:6);

 }
 for(const [id,entry]of context.markers)if(!keep.has(id)){context.unitGroup.removeLayer(entry.marker);if(entry.notice)context.unitGroup.removeLayer(entry.notice);if(entry.demandNotice)context.unitGroup.removeLayer(entry.demandNotice);context.markers.delete(id);}
 if(context.choice?.ids.some(id=>!keep.has(id)))context.map.closePopup();
 context.markerCount=keep.size;context.container.dataset.markerCount=String(keep.size);baseStatus();
 paintHardware();
 context.planner?.refreshMarkers();
}
export function focusUnit(id){const entry=current?.markers.get(id);for(const [otherId,other]of current?.markers||[]){if(otherId!==id)other.marker.closeTooltip();}if(!entry){if(current)frameMunicipality(current);return false;}current.map.setView(entry.marker.getLatLng(),15,{animate:false});entry.marker.openTooltip();return true;}
export function filterMapSearchUnits(units){return current?.agentFilter?.search(units)||units;}
export function zoomMap(direction){if(current)direction>0?current.map.zoomIn():current.map.zoomOut();}
// PAN-02: ampliar o mesmo mapa, preservando seleção, marcadores e atualizações.
export function expandMap(){
 const context=current,panel=context?.container.closest('.panorama .map-panel');
 if(!panel||context.expanded)return;
 const previous={center:context.map.getCenter(),zoom:context.map.getZoom(),wheel:context.map.scrollWheelZoom.enabled(),focus:document.activeElement,background:[]};
 context.expanded=previous;
 // Move the same search field inside the dialog, before making the header inert.
 const search=document.querySelector('.header .unit-search');
 if(search){previous.search={node:search,parent:search.parentElement,next:search.nextSibling};search.dispatchEvent(new Event('semed:close-unit-search'));panel.append(search);search.classList.add('map-unit-search');}
 for(let node=panel;node.parentElement&&node!==document.body;node=node.parentElement){
  for(const sibling of node.parentElement.children){if(sibling===node||sibling.inert)continue;sibling.inert=true;previous.background.push(sibling);}
 }
 panel.classList.add('map-expanded');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 document.body.classList.add('map-expanded-open');
 context.map.invalidateSize({pan:false});context.map.setView(previous.center,previous.zoom,{animate:false});
 context.map.scrollWheelZoom.enable();
 context.agentFilter?.layout();
 previous.onKey=e=>{
  // Diálogos de hardware/fotos continuam na camada superior, com seu próprio foco.
  if(document.querySelector('dialog[open]'))return;
  if(e.key==='Escape'&&panel.querySelector('.unit-search input[aria-expanded="true"]')){e.preventDefault();e.stopImmediatePropagation();panel.querySelector('.unit-search').dispatchEvent(new Event('semed:close-unit-search'));return;}
  if(e.key==='Escape'&&context.choice){e.preventDefault();e.stopImmediatePropagation();const entry=context.markers.get(context.choice.originId);context.map.closePopup();entry?.marker.getElement()?.focus();return;}
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();collapseMap();return;}
  if(e.key!=='Tab')return;
  const focusable=[...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')].filter(n=>n.getClientRects().length);
  const first=focusable[0],last=focusable.at(-1),active=document.activeElement;
  if(!panel.contains(active)||(e.shiftKey?active===first:active===last)){e.preventDefault();(e.shiftKey?last:first)?.focus();}
 };
 document.addEventListener('keydown',previous.onKey,true);
 panel.querySelector('[data-action="map-collapse"]').focus({preventScroll:true});
}
export function collapseMap({restoreFocus=true,force=false}={}){
 const context=current,previous=context?.expanded;if(!previous)return;
 if(!force&&context.planner?.isActive()){void context.planner.requestClose(()=>collapseMap({restoreFocus,force:true}));return;}
 const panel=context.container.closest('.map-panel');
 delete context.expanded;document.removeEventListener('keydown',previous.onKey,true);
 panel.classList.remove('map-expanded');panel.removeAttribute('role');panel.removeAttribute('aria-modal');
 document.body.classList.remove('map-expanded-open');
 for(const node of previous.background)node.inert=false;
 if(previous.search){const {node,parent,next}=previous.search;node.dispatchEvent(new Event('semed:close-unit-search'));node.classList.remove('map-unit-search');parent.insertBefore(node,next?.parentNode===parent?next:null);}
 context.map.scrollWheelZoom[previous.wheel?'enable':'disable']();
 context.agentFilter?.layout();
 context.map.invalidateSize({pan:false});context.map.setView(previous.center,previous.zoom,{animate:false});
 if(restoreFocus&&previous.focus?.isConnected)previous.focus.focus({preventScroll:true});
}
function frameMunicipality(context){
 context.map.fitBounds(context.boundary.getBounds(),{padding:[24,32],maxZoom:12,animate:false});
}
export function fitMap(){
 if(current)frameMunicipality(current);
}
export function changeBasemap(base){if(!basemaps[base]||preference.base===base)return;preference.base=base;switchBase();}
function updateBoundaryButton(){current?.container.closest('.map-panel').querySelector('[data-action="map-boundary"]')?.setAttribute('aria-pressed',String(preference.boundary));}
export function toggleMapBoundary(){
 preference.boundary=!preference.boundary;
 if(current){if(preference.boundary)current.boundary.addTo(current.map);else current.map.removeLayer(current.boundary);updateBoundaryButton();}
 return preference.boundary;
}
function updateExamplesButton(){current?.container.closest('.map-panel').querySelector('[data-action="map-examples"]')?.setAttribute('aria-pressed',String(preference.examples));}
export function toggleMapExamples(){
 preference.examples=!preference.examples;
 if(current){if(preference.examples)current.examplesLayer.addTo(current.map);else current.map.removeLayer(current.examplesLayer);updateExamplesButton();baseStatus();}
}


