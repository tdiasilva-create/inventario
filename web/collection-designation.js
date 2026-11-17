import {readPanelJson} from './desktop-request.js';
const element=(tag,text,className)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(className)n.className=className;return n;};
const requestLink=(id,text)=>{const a=element('a',text,'btn');a.href='/demandas?demanda='+encodeURIComponent(id);return a;};
// Explicit reads only: opening/refreshing this list, opening a form, or confirming a write.
export function createCollectionDesignations({identity,onChange,restoreFocus}){
 let generation=0,controller=null,tasks=new Map(),ids=[],loading=false,error='',queriedAt=null,form=null;
 const isRoot=()=>identity()?.role==='root';
 async function refresh(unitIds=ids){
  if(!isRoot())return;ids=[...new Set(unitIds)];const current=++generation;controller?.abort();controller=new AbortController();const signal=controller.signal;
  loading=true;error='';onChange();const next=new Map();
  try{for(let start=0;start<ids.length;start+=200){const result=await readPanelJson('/api/dispatch/collection-tasks?unitIds='+encodeURIComponent(JSON.stringify(ids.slice(start,start+200))),{signal});for(const task of result.tasks)if(!next.has(task.unitId))next.set(task.unitId,task);}
   if(current!==generation)return;tasks=next;queriedAt=new Date();
  }catch(e){if(current!==generation)return;tasks=new Map();error=e.message;}
  finally{if(current===generation){loading=false;onChange();}}
 }
 function dismiss(){if(form&&!form.busy)form.dialog.close();}
 function closeForm(){if(form){form.abort.abort();form.dialog.close();form=null;}}
 function dispose(){generation++;controller?.abort();closeForm();tasks=new Map();ids=[];error='';loading=false;queriedAt=null;}
 function taskSummary(task){return task.technicians.length?task.technicians.map(t=>t.name+(t.available?'':' (indisponível)')).join(' e '):'Sem técnico atribuído';}
 function decorate(row,unit,type){
  if(!isRoot())return;
  const actions=element('div',null,'collection-designation-actions');
  if(type==='Obra em andamento'){actions.append(element('small','Coleta indisponível para obras.'));row.append(actions);return;}
  const task=tasks.get(unit.id);
  if(task&&!loading&&!error){actions.append(element('small','Coleta designada — '+taskSummary(task)),requestLink(task.id,'Ver demanda #'+task.number));}
  else{const button=element('button',loading?'Consultando…':error?'Verificar designação':'Designar coleta','btn');button.type='button';button.disabled=loading;button.dataset.unitId=unit.id;button.setAttribute('aria-label',(error?'Verificar designação':'Designar coleta')+' · '+unit.name);button.onclick=()=>show(unit,button);actions.append(button);}
  row.append(actions);
 }
 async function show(unit,trigger){
  if(form||!isRoot())return;
  const dialog=element('dialog',null,'collection-designation-dialog');dialog.setAttribute('aria-labelledby','collection-designation-title');
  dialog.innerHTML='<header class="dialog-head"><h2 id="collection-designation-title">Designar coleta</h2><button type="button" class="btn" data-close>Fechar</button></header><div class="collection-designation-body"><strong data-unit></strong><p data-message role="status">Consultando a unidade e os técnicos…</p><div data-content></div></div>';
  dialog.querySelector('[data-unit]').textContent=unit.name;document.body.append(dialog);
  const current={dialog,abort:new AbortController(),busy:false,payload:null};form=current;
  const message=dialog.querySelector('[data-message]'),content=dialog.querySelector('[data-content]');
  dialog.querySelector('[data-close]').onclick=dismiss;
  dialog.oncancel=e=>{e.preventDefault();dismiss();};
  dialog.addEventListener('close',()=>{current.abort.abort();dialog.remove();if(form===current)form=null;if(trigger.isConnected)trigger.focus({preventScroll:true});else restoreFocus();},{once:true});
  dialog.showModal();
  try{
   const data=await readPanelJson('/api/dispatch/collection-options?unitId='+encodeURIComponent(unit.id),{signal:current.abort.signal});if(form!==current)return;
   if(data.task){tasks.set(unit.id,data.task);onChange();message.textContent='Já existe uma coleta designada — '+taskSummary(data.task)+'.';content.append(requestLink(data.task.id,'Ver demanda #'+data.task.number));return;}
   if(data.unit.linked){message.textContent='Esta unidade já possui agente vinculado. Atualize o Panorama para conferir.';return;}
   if(!data.technicians.length){message.textContent='Não há técnico habilitado com permissão de coleta. O root pode habilitar uma conta de operador ou administrador em Organizar atendimentos → Técnicos.';const link=element('a','Organizar atendimentos','btn');link.href='/roteiro-demandas';content.append(link);return;}
   message.textContent='A demanda entrará no final da fila. O técnico receberá um aviso e iniciará o atendimento pelo aplicativo.';
   const fields=element('form');fields.innerHTML='<label for="collection-technician">Técnico responsável</label><select id="collection-technician" required><option value="">Selecione um técnico</option></select><label for="collection-instructions">Orientação para a visita (opcional)</label><textarea id="collection-instructions" maxlength="1000" rows="3" placeholder="Ex.: conferir computadores da secretaria e do laboratório"></textarea><p class="help">O vínculo com o agente será feito na unidade. Designar a visita não conclui a coleta.</p><button type="submit" class="btn primary">Criar demanda e designar</button>';
   const select=fields.querySelector('select'),notes=fields.querySelector('textarea'),submit=fields.querySelector('button');
   for(const technician of data.technicians){const option=element('option',technician.display_name||technician.username);option.value=technician.id;select.append(option);}
   content.append(fields);select.focus();
   fields.onsubmit=async event=>{
    event.preventDefault();if(current.busy)return;
    current.payload??={operationId:crypto.randomUUID(),unitId:unit.id,technicianId:select.value,notes:notes.value.trim()};
    current.busy=true;select.disabled=true;notes.disabled=true;submit.disabled=true;dialog.querySelector('[data-close]').disabled=true;message.textContent='Criando a demanda e atribuindo o técnico…';
    try{
     const response=await fetch('/api/dispatch/collection-designate',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':identity()?.csrf||''},body:JSON.stringify(current.payload),signal:AbortSignal.timeout(20000)});
     const result=await response.json();if(form!==current)return;
     if(!response.ok){
      if(result.existing){tasks.set(unit.id,result.existing);onChange();message.textContent=result.error;content.replaceChildren(requestLink(result.existing.id,'Ver demanda #'+result.existing.number));return;}
      if(response.status<500){current.payload=null;select.disabled=false;notes.disabled=false;}
      throw Error(result.error||'Não foi possível confirmar a designação.');
     }
     message.textContent='Demanda #'+result.request.number+' confirmada. O aviso foi registrado para o técnico.';
     content.replaceChildren(requestLink(result.request.id,'Ver demanda #'+result.request.number));
     window.dispatchEvent(new Event('semed:pending-refresh'));void refresh();
    }catch(e){if(form!==current)return;message.textContent=(e.message||'Não foi possível confirmar o envio.')+(current.payload?' Tente novamente para conferir o mesmo envio, sem duplicar a demanda.':'');submit.textContent=current.payload?'Conferir envio / tentar novamente':'Criar demanda e designar';}
    finally{current.busy=false;if(form===current){submit.disabled=false;dialog.querySelector('[data-close]').disabled=false;}}
   };
  }catch(e){if(form===current)message.textContent=e.message;}
 }
 return {refresh,decorate,dispose,status:()=>loading?'Consultando designações…':error?'Designações indisponíveis. Use Atualizar designações ou Verificar designação.':queriedAt?'Designações consultadas às '+queriedAt.toLocaleTimeString('pt-BR')+'.':'',isRoot};
}
