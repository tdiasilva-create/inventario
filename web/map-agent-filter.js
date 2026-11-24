import {coordinatesForUnit} from './map-geography.js';
import {isOutOfScope} from './unit-schema.js';

// Capability comes from the signed heartbeat. Offline is not an outdated agent.
export function unitsWithoutInternetAgent(units,fleet){
 if(!Array.isArray(fleet?.units))throw Error('Consulta de agentes indisponível');
 const rows=new Map();
 for(const row of fleet.units){if(!row?.id||rows.has(row.id))throw Error('Consulta de agentes inválida');rows.set(row.id,row);}
 return [...new Map(units.map(u=>[u.id,u])).values()].filter(unit=>{
  if(![true,1].includes(unit.active)||isOutOfScope(unit.unit_type))return false;
  const row=rows.get(unit.id),count=row?.internet_test_capable;
  if(!Number.isSafeInteger(count)||count<0||!Number.isSafeInteger(row.linked)||count>row.linked)throw Error('Consulta de agentes incompleta');
  return count===0;
 });
}

let fleet=null,fleetError=false;
const listeners=new Set();
if(typeof window!=='undefined')window.addEventListener('semed:fleet-presence',event=>{
 fleetError=!!event.detail?.error;
 if(!fleetError)fleet=event.detail?.fleet||null;
 for(const update of listeners)update();
});

// Independent map control. Does not open the route planner or perform requests.
export function mountMapAgentFilter(context,onChange){
 const panel=context.container.closest('.map-panel'),toolbar=panel.querySelector('.cartography-controls');
 let enabled=false,latestIds=null,unavailable=false,visibleKey='';
 const group=document.createElement('div');group.className='map-disclosures';
 const legend=panel.querySelector('.unit-map-legend');legend.before(group);
 const control=document.createElement('details');control.className='map-agent-filter';
 const summary=document.createElement('summary');summary.textContent='Agente 0.1.9';
 const label=document.createElement('label');label.className='map-agent-filter-option';
 const toggle=document.createElement('input');toggle.type='checkbox';toggle.dataset.agentFilter='';
 const caption=document.createElement('span');
 toggle.title='Mostrar unidades sem nenhum agente vinculado que informou suporte aos testes de internet (0.1.9 ou compatível). Um computador compatível é suficiente, mesmo offline.';
 const message=document.createElement('small');message.setAttribute('role','status');message.id='map-agent-filter-status';toggle.setAttribute('aria-describedby',message.id);
 label.append(toggle,caption);control.append(summary,label,message);group.append(legend,control);panel.classList.add('has-agent-filter');
 const closeOther=event=>{if(event.target.open)(event.target===control?legend:control).open=false;};
 control.addEventListener('toggle',closeOther);legend.addEventListener('toggle',closeOther);
 function layout(){panel.style.setProperty('--map-controls-bottom',(toolbar.offsetTop+toolbar.offsetHeight+8)+'px');}
 const observer=new ResizeObserver(layout);observer.observe(toolbar);
 function filter(units){
  let missing=null;
  try{missing=unitsWithoutInternetAgent(units,fleet);latestIds=new Set(missing.map(u=>u.id));unavailable=fleetError;}catch{unavailable=true;}
  toggle.disabled=!enabled&&(!missing||fleetError);toggle.checked=enabled;
  const mapped=missing?.filter(coordinatesForUnit).length;
  caption.textContent='Sem agente 0.1.9'+(mapped!=null?' ('+mapped+')':'');
  summary.textContent='Agente 0.1.9'+(unavailable&&fleet?' · indisponível':'');
  summary.title=enabled?'Filtro ativo: somente unidades sem agente compatível':'Filtrar unidades pela capacidade do agente';
  summary.setAttribute('aria-label',summary.textContent+(enabled?' · filtro ativo':''));
  control.classList.toggle('filter-enabled',enabled);
  const noCoordinates=missing?missing.length-mapped:0;
  message.textContent=unavailable?(fleet||fleetError?'Consulta indisponível'+(enabled&&latestIds?' · última leitura preservada.':'. Aguarde a atualização.'):'Consultando agentes…'):enabled?(mapped?'':'Nenhuma unidade neste filtro.')+(noCoordinates?' '+noCoordinates+' sem coordenadas, fora do mapa.':''):'';
  message.hidden=!message.textContent;
  panel.dataset.agentFilter=enabled?'missing':'all';panel.dataset.agentFilterState=unavailable?'unavailable':'ready';
  const visible=enabled?units.filter(u=>latestIds?.has(u.id)&&[true,1].includes(u.active)&&!isOutOfScope(u.unit_type)):units;
  visibleKey=JSON.stringify([enabled,visible.map(u=>u.id)]);return visible;
 }
 const update=()=>{const before=visibleKey;onChange();if(before!==visibleKey)document.querySelector('.unit-search')?.dispatchEvent(new Event('semed:close-unit-search'));layout();};
 toggle.onchange=()=>{enabled=toggle.checked;update();};listeners.add(update);
 return {filter,layout,isActive:()=>enabled,search(units){if(!enabled)return units;try{return unitsWithoutInternetAgent(units,fleet);}catch{return units.filter(u=>latestIds?.has(u.id));}},dispose(){listeners.delete(update);observer.disconnect();legend.removeEventListener('toggle',closeOther);group.before(legend);group.remove();panel.classList.remove('has-agent-filter');panel.style.removeProperty('--map-controls-bottom');delete panel.dataset.agentFilter;delete panel.dataset.agentFilterState;}};
}
