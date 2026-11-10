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
 let catalogue=[],loaded=false,fleet=null,error=false;
 function content(state='online'){
  let value='—',subtitle=!loaded?'Cadastro indisponível':error?'Comunicação indisponível':!fleet?'Consultando agentes…':'Comunicação dos agentes · filtros do painel';
  if(loaded&&fleet&&!error){try{value=schoolsPresence(catalogue,fleet)[state].toLocaleString('pt-BR');}catch{subtitle='Comunicação indisponível';}}
  return '<strong>'+value+'</strong><span>Escolas '+(state==='offline'?'offline':'online')+'<small>'+subtitle+'</small></span>';
 }
 function draw(){
  for(const node of document.querySelectorAll('[data-schools-online],[data-schools-offline]')){
   const html=content(node.hasAttribute('data-schools-offline')?'offline':'online');
   if(node.innerHTML!==html)node.innerHTML=html;
   const minutes=Number.isFinite(fleet?.threshold_seconds)?Math.round(fleet.threshold_seconds/60):null;
   node.title='Escolas municipais, militares e creches ativas. Online: pelo menos um computador com agente comunicando'+(minutes?' no prazo de '+minutes+' minutos':'')+'. Cada escola conta uma vez. Offline: nenhum agente comunicando, inclusive escolas sem agente cadastrado. Isso não comprova falta de internet. O log registra perdas somente após mais de 48 horas.';
  }
 }
 window.addEventListener('semed:fleet-presence',event=>{
  error=!!event.detail?.error;fleet=error?null:event.detail?.fleet||null;draw();
 });
 return {markup:content,attach(units,ready){catalogue=units;loaded=ready;draw();}};
}
