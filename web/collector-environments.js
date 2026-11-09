// D-074: consulta atual da unidade, sem substituir a ficha em preenchimento.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalized=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');

export function chooseEnvironment({load,create,selected}){
 const previous=document.activeElement,dialog=document.createElement('dialog');
 dialog.className='environment-picker';dialog.setAttribute('aria-labelledby','environment-picker-title');
 dialog.innerHTML=`<header><h2 id="environment-picker-title" tabindex="-1">Selecionar ambiente</h2><button type="button" data-room="close" class="text-button" aria-label="Fechar seleção de ambiente">Fechar</button></header>
 <p>Ambientes cadastrados nesta unidade. Selecione onde está o equipamento.</p>
 <label class="field"><span>Buscar ambiente</span><input type="search" data-room-search placeholder="Filtrar por nome" autocomplete="off" enterkeyhint="search"></label>
 <div class="environment-picker-toolbar"><span data-room-status role="status"></span><button type="button" data-room="refresh" class="text-button">Atualizar lista</button></div>
 <p data-room-error class="field-error" role="alert" hidden></p><div data-room-list class="environment-picker-list"></div>
 <button type="button" data-room="new" class="secondary">+ Cadastrar novo ambiente</button>
 <form data-room-form hidden><label class="field"><span>Nome do novo ambiente</span><input name="name" required maxlength="180" autocomplete="off" placeholder="Ex.: Laboratório de informática"></label><p class="help">Confira a lista antes de criar. Nomes iguais reutilizam o cadastro existente.</p><div class="inline-actions"><button type="submit" class="primary">Cadastrar e selecionar</button><button type="button" data-room="cancel-new" class="text-button">Cancelar novo cadastro</button></div></form>`;
 const $=s=>dialog.querySelector(s);let rooms=[],loading=false,saving=false,closed=false,loaded=false;
 const message=text=>{$('[data-room-error]').textContent=text;$('[data-room-error]').hidden=!text;};
 const status=text=>{$('[data-room-status]').textContent=text;};
 function draw(){
  const q=normalized($('[data-room-search]').value.trim()),matches=rooms.filter(r=>normalized(r.name).includes(q));
  $('[data-room-list]').innerHTML=matches.map(r=>`<button type="button" data-room-id="${esc(r.id)}" class="environment-option" aria-pressed="${r.id===selected}"><span>${esc(r.name)}</span>${r.id===selected?'<small>Selecionado</small>':''}</button>`).join('')||`<p class="help">${loading?'Consultando ambientes…':!loaded?'Use Atualizar lista para consultar os ambientes.':rooms.length?'Nenhum ambiente corresponde à busca.':'Nenhum ambiente cadastrado nesta unidade.'}</p>`;
 }
 async function refresh(){
  if(loading||closed)return;loading=true;message('');status('Atualizando…');$('[data-room=refresh]').disabled=true;
  if(!rooms.length)draw();
  try{const result=await load();if(closed)return;rooms=result;loaded=true;status(`${rooms.length} ambiente(s) · lista atualizada`);}
  catch(error){if(!closed){message('Não foi possível atualizar a lista. '+error.message);status(rooms.length?'Exibindo a última lista recebida':'Lista não recebida');}}
  finally{loading=false;if(!closed){$('[data-room=refresh]').disabled=saving;draw();}}
 }
 return new Promise(resolve=>{
  function finish(value){if(closed)return;closed=true;dialog.close();dialog.remove();previous?.focus({preventScroll:true});resolve(value);}
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!saving)finish(null);});
  dialog.addEventListener('click',e=>{
   if(saving)return;
   const option=e.target.closest('[data-room-id]');if(option){finish(rooms.find(r=>r.id===option.dataset.roomId));return;}
   const action=e.target.closest('[data-room]')?.dataset.room;
   if(action==='close')finish(null);
   if(action==='refresh')refresh();
   if(action==='new'){$('[data-room-form]').hidden=false;$('[data-room=new]').hidden=true;$('[name=name]').focus();}
   if(action==='cancel-new'){$('[data-room-form]').hidden=true;$('[data-room=new]').hidden=false;$('[data-room=new]').focus();}
  });
  $('[data-room-search]').addEventListener('input',draw);
  $('[data-room-form]').addEventListener('submit',async e=>{
   e.preventDefault();if(saving)return;const name=$('[name=name]').value.trim();if(!name)return;
   saving=true;message('');status('Cadastrando ambiente…');
   for(const button of dialog.querySelectorAll('button'))button.disabled=true;
   try{const room=await create(name);finish(room);}
   catch(error){message(error.message);status('Cadastro não confirmado. Você pode tentar novamente.');}
   finally{saving=false;if(!closed)for(const button of dialog.querySelectorAll('button'))button.disabled=loading&&button.dataset.room==='refresh';}
  });
  document.body.append(dialog);dialog.showModal();$('#environment-picker-title').focus();refresh();
 });
}
