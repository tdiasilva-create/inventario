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
 const control=document.createElement('div');control.className='map-agent-filter';
 const toggle=document.createElement('button');toggle.type='button';toggle.dataset.agentFilter='';toggle.setAttribute('aria-pressed','false');
 toggle.title='Mostrar unidades sem nenhum agente vinculado que informou suporte aos testes de internet (0.1.9 ou compatível). Um computador compatível é suficiente, mesmo offline.';
 const message=document.createElement('small');message.setAttribute('role','status');message.id='map-agent-filter-status';toggle.setAttribute('aria-describedby',message.id);
 control.append(toggle,message);toolbar.prepend(control);panel.classList.add('has-agent-filter');
 function layout(){panel.style.setProperty('--map-controls-bottom',(toolbar.offsetTop+toolbar.offsetHeight+8)+'px');}
 const observer=new ResizeObserver(layout);observer.observe(toolbar);
 function filter(units){
  let missing=null;
  try{missing=unitsWithoutInternetAgent(units,fleet);latestIds=new Set(missing.map(u=>u.id));unavailable=fleetError;}catch{unavailable=true;}
  toggle.disabled=!enabled&&(!missing||fleetError);toggle.setAttribute('aria-pressed',String(enabled));
  const mapped=missing?.filter(coordinatesForUnit).length;
  toggle.textContent=(enabled?'Filtro ativo: ':'')+'Sem agente 0.1.9'+(mapped!=null?' ('+mapped+')':'');
  const noCoordinates=missing?missing.length-mapped:0;
  message.textContent=unavailable?(fleet||fleetError?'Consulta indisponível'+(enabled&&latestIds?' · última leitura preservada.':'. Aguarde a atualização.'):'Consultando agentes…'):enabled?(mapped?'':'Nenhuma unidade neste filtro.')+(noCoordinates?' '+noCoordinates+' sem coordenadas, fora do mapa.':''):'';
  message.hidden=!message.textContent;
  panel.dataset.agentFilter=enabled?'missing':'all';panel.dataset.agentFilterState=unavailable?'unavailable':'ready';
  const visible=enabled?units.filter(u=>latestIds?.has(u.id)&&[true,1].includes(u.active)&&!isOutOfScope(u.unit_type)):units;
  visibleKey=JSON.stringify([enabled,visible.map(u=>u.id)]);return visible;
 }
 const update=()=>{const before=visibleKey;onChange();if(before!==visibleKey)document.querySelector('.unit-search')?.dispatchEvent(new Event('semed:close-unit-search'));layout();};
 toggle.onclick=()=>{enabled=!enabled;update();};listeners.add(update);
 return {filter,layout,isActive:()=>enabled,search(units){if(!enabled)return units;try{return unitsWithoutInternetAgent(units,fleet);}catch{return units.filter(u=>latestIds?.has(u.id));}},dispose(){listeners.delete(update);observer.disconnect();control.remove();panel.classList.remove('has-agent-filter');panel.style.removeProperty('--map-controls-bottom');delete panel.dataset.agentFilter;delete panel.dataset.agentFilterState;}};
}
