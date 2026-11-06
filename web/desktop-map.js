import {geolocatedUnits} from './map-geography.js';
import {icon} from './desktop-icons.js';
let current=null,generation=0;
const preference={base:'streets',boundary:false,camera:null,examples:true};
const geometryPromise=fetch('/data/map-v33.json').then(r=>{if(!r.ok)throw new Error('Geometria indisponível');return r.json();});
const examplesPromise=fetch('/data/map-examples.json').then(r=>{if(!r.ok)throw new Error('Exemplos indisponíveis');return r.json();}).catch(()=>null);
const basemaps={
 satellite:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attribution:'Imagens © Esri, Maxar, Earthstar Geographics, GIS User Community'},
 streets:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',attribution:'Mapa © Esri, HERE, Garmin, <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}
};
export function unmountMap(){
 generation++;
 if(!current)return;
 preference.camera={center:current.map.getCenter(),zoom:current.map.getZoom()};
 current.observer?.disconnect();current.map.remove();current=null;
}
function status(text,error=false){
 if(!current)return;
 const node=current.container.closest('.map-panel').querySelector('.cartography-status');
 if(node){node.textContent=text;node.classList.toggle('error',error);}
}
function baseStatus(){
 if(!current)return;
 const count=current.markerCount;
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
export async function mountMap(container,{units=[],selected=null,onSelect=()=>{}}={}){
 const token=++generation;
 try{
  const [data,examples]=await Promise.all([geometryPromise,examplesPromise]);
  if(token!==generation||!container.isConnected)return;
  const L=window.L;if(!L)throw new Error('Biblioteca cartográfica indisponível');
  const map=L.map(container,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,minZoom:8,maxZoom:19,preferCanvas:false});
  const context={map,container,geometry:data,layer:null,boundary:null,observer:null,markerCount:0,examplesData:examples,exampleCount:0,examplesLayer:L.layerGroup()};current=context;
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  context.boundary=L.polygon(data.ring,{color:'#55cff6',weight:2,opacity:.95,fillColor:'#1aaed1',fillOpacity:.06,dashArray:'5 4'});
  context.boundary.bindTooltip('Área de referência do município',{className:'v33-tooltip',sticky:true});
  if(preference.boundary)context.boundary.addTo(map);
  const unitGroup=L.featureGroup();
  for(const {unit,coordinates} of geolocatedUnits(units)){
   const marker=L.circleMarker(coordinates,{radius:unit.id===selected?9:6,color:'#d9f8ff',weight:2,fillColor:'#0e9fff',fillOpacity:1});
   const label=document.createElement('span');label.textContent=unit.name||unit.nome||'Unidade sem nome';
   marker.bindTooltip(label,{className:'v33-tooltip'});marker.on('click',()=>onSelect(unit.id));marker.addTo(unitGroup);context.markerCount++;
  }
  unitGroup.addTo(map);
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
  L.control.scale({position:'bottomleft',imperial:false,maxWidth:100}).addTo(map);
  context.observer=new ResizeObserver(()=>map.invalidateSize({pan:false}));context.observer.observe(container);
  const update=()=>{container.dataset.mapZoom=String(map.getZoom());};map.on('zoomend',update);update();
  container.dataset.markerCount=String(context.markerCount);container.dataset.exampleCount=String(context.exampleCount);container.dataset.mapReady='true';
  switchBase();updateBoundaryButton();updateExamplesButton();
 }catch{
  if(token!==generation||!container.isConnected)return;
  container.textContent='Não foi possível inicializar o mapa. Recarregue a página para tentar novamente.';
  container.dataset.mapReady='error';
 }
}
export function zoomMap(direction){if(current)direction>0?current.map.zoomIn():current.map.zoomOut();}
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


