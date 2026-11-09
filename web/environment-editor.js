// Shared correction form. The operation ID survives retries in this open dialog.
export function editEnvironmentName({environment,save}){
 const previous=document.activeElement,dialog=document.createElement('dialog');
 dialog.className='environment-name-editor';dialog.setAttribute('aria-labelledby','environment-name-title');
 dialog.innerHTML=`<h2 id="environment-name-title">Editar nome do ambiente</h2><p>Computadores e fotos continuarão vinculados a este mesmo ambiente.</p><form><label for="environment-new-name">Nome do ambiente</label><input id="environment-new-name" name="name" maxlength="180" required autocomplete="off" enterkeyhint="done"><p class="environment-name-message" role="alert" hidden></p><button type="button" data-current hidden>Carregar nome atual</button><div class="environment-name-actions"><button type="button" data-cancel>Cancelar</button><button type="submit">Salvar nome</button></div><p role="status" data-status></p></form>`;
 const input=dialog.querySelector('input'),message=dialog.querySelector('[role=alert]'),status=dialog.querySelector('[data-status]'),reload=dialog.querySelector('[data-current]');
 input.value=environment.name;let room={...environment},busy=false,command=null,server=null;
 return new Promise(resolve=>{
  function close(value){dialog.close();dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});resolve(value);}
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close(null);});
  dialog.querySelector('[data-cancel]').onclick=()=>{if(!busy)close(null);};
  reload.onclick=()=>{if(!server||busy)return;room=server;input.value=server.name;command=null;server=null;reload.hidden=true;message.hidden=true;input.focus();};
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();if(busy)return;
   const name=input.value.trim();if(!name){input.setCustomValidity('Informe o nome do ambiente.');input.reportValidity();return;}
   const payload={id:room.id,version:room.name_version,name};
   if(!command||JSON.stringify(command.payload)!==JSON.stringify(payload))command={payload,operationId:crypto.randomUUID()};
   busy=true;input.readOnly=true;message.hidden=true;status.textContent='Salvando nome…';for(const b of dialog.querySelectorAll('button'))b.disabled=true;
   try{const result=await save({...payload,operationId:command.operationId});close(result.environment);}
   catch(error){message.textContent=error.message;message.hidden=false;status.textContent='Alteração não confirmada. O texto digitado foi preservado.';server=error.server;if(server){message.textContent+=' Nome atual: '+server.name+'.';reload.hidden=false;}}
   finally{busy=false;input.readOnly=false;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}
  };
  input.addEventListener('input',()=>input.setCustomValidity(''));
  document.body.append(dialog);dialog.showModal();input.focus();input.select();
 });
}
