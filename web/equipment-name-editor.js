const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function request(url,csrf,data){
 const response=await fetch(url,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(15000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const error=Error(result.error||'Não foi possível confirmar a alteração. Tente novamente.');error.server=result.server;throw error;}
 return result;
}
export async function editEquipmentName({id,unitId,csrf}){
 const previous=document.activeElement;
 const loaded=await request('/api/root/equipment-name?'+new URLSearchParams({id,unitId}));
 let record=loaded.equipment,busy=false,command=null,current=null;
 const dialog=document.createElement('dialog');dialog.className='environment-name-editor equipment-name-editor';dialog.setAttribute('aria-labelledby','equipment-name-title');
 dialog.innerHTML=`<h2 id="equipment-name-title">Editar nome do equipamento</h2><p>Nome exibido no painel. O hostname do agente, as fotos, a unidade e a localização são preservados.</p><form><label for="equipment-new-name">Nome do computador ou impressora</label><input id="equipment-new-name" name="name" maxlength="180" required autocomplete="off" placeholder="Ex.: Computador 05 ou Impressora da secretaria"><p role="alert" hidden></p><button type="button" data-current hidden>Carregar nome atual</button><div class="environment-name-actions"><button type="button" data-cancel>Cancelar</button><button type="submit">Salvar nome</button></div><p role="status"></p></form><details><summary>Histórico de nomes</summary>${loaded.history.length?'<ol>'+loaded.history.map(e=>`<li>${esc(e.before_name||'Sem nome personalizado')} → <strong>${esc(e.after_name)}</strong><br><small>${esc(e.actor_name)} · ${esc(new Date(e.created_at).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'}))}</small></li>`).join('')+'</ol><p>Até 20 alterações mais recentes.</p>':'<p>Nenhuma alteração de nome registrada.</p>'}</details>`;
 const input=dialog.querySelector('input'),message=dialog.querySelector('[role=alert]'),status=dialog.querySelector('[role=status]'),reload=dialog.querySelector('[data-current]');input.value=record.name||'';
 return new Promise(resolve=>{
  const close=result=>{dialog.close();dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});resolve(result);};
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close(null);});
  dialog.querySelector('[data-cancel]').onclick=()=>{if(!busy)close(null);};
  reload.onclick=()=>{if(!current||busy)return;record=current;input.value=record.name||'';command=null;current=null;reload.hidden=true;message.hidden=true;status.textContent='';input.focus();};
  input.oninput=()=>input.setCustomValidity('');
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();if(busy)return;
   const name=input.value.trim();if(!name){input.setCustomValidity('Informe o nome do equipamento.');input.reportValidity();return;}
   const payload={id,unitId,version:record.name_version,name};
   if(!command||JSON.stringify(command.payload)!==JSON.stringify(payload))command={payload,operationId:crypto.randomUUID()};
   busy=true;input.readOnly=true;message.hidden=true;reload.hidden=true;status.textContent='Salvando nome…';for(const b of dialog.querySelectorAll('button'))b.disabled=true;
   try{const result=await request('/api/root/equipment-name',csrf,{...payload,operationId:command.operationId});close(result.equipment);}
   catch(error){message.textContent=error.message;message.hidden=false;status.textContent='Alteração não confirmada. Seu texto foi preservado.';current=error.server;if(current){message.textContent+=' Nome atual: '+(current.name||'Sem nome personalizado')+'.';reload.hidden=false;}}
   finally{busy=false;input.readOnly=false;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}
  };
  document.body.append(dialog);dialog.showModal();input.focus();input.select();
 });
}
