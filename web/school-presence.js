import {schoolTypes} from './unit-schema.js';

// D-083: uma escola conta uma vez, independentemente do número de computadores.
// Offline é ausência de agente comunicando, não um diagnóstico do link de internet.
export function schoolsPresence(catalogue,fleet){
 if(!Array.isArray(fleet?.units))throw Error('Consulta de comunicação indisponível');
 const rows=new Map();
 for(const row of fleet.units){
  if(!row?.id||rows.has(row.id))throw Error('Consulta de comunicação inválida');
  rows.set(row.id,row);
 }
 const schools=[];
 for(const unit of new Map(catalogue.map(u=>[u.id,u])).values()){
  if(![1,true].includes(unit.active)||!schoolTypes.includes(unit.unit_type))continue;
  const row=rows.get(unit.id);
  if(!row||!Number.isSafeInteger(row.online)||row.online<0)throw Error('Consulta de comunicação incompleta');
  schools.push({id:unit.id,state:row.online>0?'online':'offline'});
 }
 const online=schools.filter(u=>u.state==='online').length;
 return {online,offline:schools.length-online,schools};
}

export function createSchoolPresenceView(){
 let catalogue=[],loaded=false,fleet=null,error=false,opened=null;
 function snapshot(){
  if(!loaded||!fleet||error)return null;
  try{return schoolsPresence(catalogue,fleet);}catch{return null;}
 }
 function content(state='online'){
  let value='—',subtitle=!loaded?'Cadastro indisponível':error?'Comunicação indisponível':!fleet?'Consultando agentes…':'Comunicação dos agentes · filtros do painel';
  if(loaded&&fleet&&!error){try{value=schoolsPresence(catalogue,fleet)[state].toLocaleString('pt-BR');}catch{subtitle='Comunicação indisponível';}}
  return '<strong>'+value+'</strong><span>Escolas '+(state==='offline'?'offline':'online')+'<small>'+subtitle+'</small></span>';
 }
 function drawList(result){
  if(!opened)return;
  const {body,state}=opened,names=new Map(catalogue.map(u=>[u.id,u.name]));
  const items=result?.schools.filter(u=>u.state===state).map(u=>names.get(u.id)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const signature=JSON.stringify(items??null);
  if(opened.signature===signature)return;
  opened.signature=signature;
  const scroll=body.scrollTop;
  if(items?.length){
   const list=document.createElement('ul');
   for(const name of items){const item=document.createElement('li');item.textContent=name;list.append(item);}
   body.replaceChildren(list);
  }else{
   const message=document.createElement('p');message.setAttribute('role','status');
   message.textContent=items?'Nenhuma escola '+state+' nos filtros atuais.':'Lista indisponível. Aguardando atualização da comunicação.';
   body.replaceChildren(message);
  }
  body.scrollTop=scroll;
 }
 function show(state,trigger){
  if(opened||!snapshot())return;
  const dialog=document.createElement('dialog');dialog.className='school-presence-dialog';dialog.setAttribute('aria-labelledby','school-presence-title');
  dialog.innerHTML='<header class="dialog-head"><h2 id="school-presence-title">Escolas '+state+'</h2><button type="button" class="btn" autofocus>Fechar</button></header><div class="school-presence-list"></div>';
  opened={dialog,state,trigger,body:dialog.querySelector('.school-presence-list')};
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{dialog.remove();if(opened?.dialog===dialog)opened=null;if(trigger.isConnected)trigger.focus();},{once:true});
  document.body.append(dialog);drawList(snapshot());dialog.showModal();
 }
 function draw(){
  const result=snapshot();
  for(const node of document.querySelectorAll('[data-schools-online],[data-schools-offline]')){
   const state=node.hasAttribute('data-schools-offline')?'offline':'online',html=content(state);
   if(node.innerHTML!==html)node.innerHTML=html;
   node.disabled=!result;
   node.setAttribute('aria-label','Ver escolas '+state+(result?': '+result[state]:': consulta indisponível'));
   node.onclick=event=>{event.stopPropagation();show(state,node);};
   const minutes=Number.isFinite(fleet?.threshold_seconds)?Math.round(fleet.threshold_seconds/60):null;
   node.title='Escolas municipais, militares e creches ativas. Online: pelo menos um computador com agente comunicando'+(minutes?' no prazo de '+minutes+' minutos':'')+'. Cada escola conta uma vez. Offline: nenhum agente comunicando, inclusive escolas sem agente cadastrado. Isso não comprova falta de internet. O log registra perdas somente após mais de 48 horas.';
  }
  if(opened&&!opened.trigger.isConnected){opened.dialog.close();return;}
  drawList(result);
 }
 window.addEventListener('semed:fleet-presence',event=>{
  error=!!event.detail?.error;fleet=error?null:event.detail?.fleet||null;draw();
 });
 return {markup:content,attach(units,ready){catalogue=units;loaded=ready;draw();}};
}
