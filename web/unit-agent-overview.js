import {isOutOfScope} from './unit-schema.js';

const labels={linked:'Com agente vinculado',unlinked:'Sem agente vinculado'};
const normalize=value=>String(value??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').trim();
export function unitAgentGroups(catalogue,fleet){
 if(!Array.isArray(fleet?.units))throw Error('Consulta de vínculos indisponível');
 const counts=new Map();
 for(const row of fleet.units){
  if(!row?.id||counts.has(row.id)||!Number.isSafeInteger(row.linked)||row.linked<0||!Number.isSafeInteger(row.computers)||row.linked>row.computers)throw Error('Consulta de vínculos inválida');
  counts.set(row.id,row.linked);
 }
 const groups={linked:[],unlinked:[]};
 for(const unit of new Map(catalogue.map(u=>[u.id,u])).values()){
  if(isOutOfScope(unit.unit_type))continue;
  if(!counts.has(unit.id))throw Error('Consulta de vínculos incompleta');
  const linked=counts.get(unit.id);
  groups[linked?'linked':'unlinked'].push({id:unit.id,name:unit.name,linked});
 }
 for(const list of Object.values(groups))list.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
 return groups;
}
export function findAgentUnits(units,query){const q=normalize(query);return units.filter(u=>normalize(u.name).includes(q));}

// Shared 60-second fleet event; no fetch, timer, storage or new D1 read.
export function createUnitAgentOverview(){
 let catalogue=[],loaded=false,fleet=null,error=false,opened=null;
 function snapshot(){if(!loaded||!fleet||error)return null;try{return unitAgentGroups(catalogue,fleet);}catch{return null;}}
 function close(){opened?.dialog.close();}
 function drawList(result){
  if(!opened)return;
  const {state,body,input,status}=opened,all=result?.[state],items=all?findAgentUnits(all,input.value):null;
  status.textContent=items?`${items.length} de ${all.length} unidade(s).`:'Lista indisponível. Aguardando atualização dos vínculos.';
  const signature=JSON.stringify(items);
  if(opened.signature===signature)return;opened.signature=signature;
  const scroll=body.scrollTop,focusId=body.contains(document.activeElement)?document.activeElement?.dataset.unitId:null;
  if(items?.length){
   const list=document.createElement('ul');
   for(const unit of items){
    const li=document.createElement('li'),link=document.createElement('a'),count=document.createElement('small');
    link.href='/unidade?id='+encodeURIComponent(unit.id);link.dataset.unitId=unit.id;link.textContent=unit.name;
    count.textContent=unit.linked+' computador(es) com agente vinculado';li.append(link,count);list.append(li);
   }
   body.replaceChildren(list);
  }else{
   const p=document.createElement('p');p.textContent=!items?'A contagem não será tratada como zero até a consulta se recuperar.':all.length?'Nenhuma unidade encontrada para esse nome.':'Nenhuma unidade neste grupo nos filtros do Panorama.';body.replaceChildren(p);
  }
  if(focusId){const target=[...body.querySelectorAll('a')].find(a=>a.dataset.unitId===focusId);(target||input).focus({preventScroll:true});}
  body.scrollTop=scroll;
 }
 function show(state,trigger){
  if(opened||!snapshot())return;
  const dialog=document.createElement('dialog');dialog.className='unit-agent-dialog';dialog.setAttribute('aria-labelledby','unit-agent-title');
  dialog.innerHTML='<header class="dialog-head"><h2 id="unit-agent-title"></h2><button type="button" class="btn">Fechar</button></header><div class="unit-agent-search"><label for="unit-agent-query">Buscar unidade por nome</label><input id="unit-agent-query" type="search" maxlength="120" placeholder="Digite o nome da unidade" autofocus><p role="status" aria-live="polite"></p></div><div class="unit-agent-list"></div>';
  dialog.querySelector('h2').textContent=labels[state];
  opened={dialog,state,trigger,body:dialog.querySelector('.unit-agent-list'),input:dialog.querySelector('input'),status:dialog.querySelector('[role=status]')};
  opened.input.addEventListener('input',()=>drawList(snapshot()));
  dialog.querySelector('button').addEventListener('click',close);
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}});
  dialog.addEventListener('close',()=>{dialog.remove();if(opened?.dialog===dialog)opened=null;if(trigger.isConnected)trigger.focus({preventScroll:true});},{once:true});
  document.body.append(dialog);drawList(snapshot());dialog.showModal();
 }
 function draw(){
  const result=snapshot(),host=document.getElementById('panorama-agent-links');
  if(!host){close();return;}
  for(const button of host.querySelectorAll('[data-unit-agent-group]')){
   const state=button.dataset.unitAgentGroup;
   button.querySelector('strong').textContent=result?result[state].length.toLocaleString('pt-BR'):'—';button.disabled=!result;
   button.setAttribute('aria-label',labels[state]+(result?': '+result[state].length+' unidade(s)':': consulta indisponível'));
   button.onclick=()=>show(state,button);
  }
  host.querySelector('[data-unit-agent-status]').textContent=result?'Unidades nos filtros do Panorama · vínculos atuais, mesmo offline.':!loaded?'Cadastro de unidades indisponível.':error||fleet?'Consulta de vínculos indisponível.':'Consultando vínculos…';
  if(opened&&!opened.trigger.isConnected){close();return;}drawList(result);
 }
 window.addEventListener('semed:fleet-presence',event=>{error=!!event.detail?.error;fleet=error?null:event.detail?.fleet||null;draw();});
 return {
  markup:()=>'<section id="panorama-agent-links" class="unit-agent-overview" aria-label="Agentes por unidade"><h3>Agentes por unidade</h3><div class="unit-agent-metrics">'+Object.entries(labels).map(([state,label])=>'<button type="button" data-unit-agent-group="'+state+'" aria-haspopup="dialog" disabled><strong>—</strong><span>'+label+'</span></button>').join('')+'</div><p data-unit-agent-status>Consultando vínculos…</p></section>',
  attach(units,ready){catalogue=units;loaded=ready;draw();}
 };
}
