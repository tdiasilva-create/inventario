// Confirmação explícita; cancelar/Esc nunca executam a operação.
export function confirmCollection(message, {title='Confirmar ação', confirmLabel='Confirmar', cancelLabel='Cancelar'}={}) {
 return new Promise(resolve=>{
  const previous=document.activeElement, dialog=document.createElement('dialog');
  dialog.className='collector-confirm';
  dialog.setAttribute('aria-labelledby','collector-confirm-title');
  dialog.setAttribute('aria-describedby','collector-confirm-message');
  dialog.innerHTML='<h2 id="collector-confirm-title" tabindex="-1"></h2><p id="collector-confirm-message"></p><div class="dialog-actions"><button type="button" class="secondary" data-cancel>Cancelar</button><button type="button" class="primary" data-confirm></button></div>';
  dialog.querySelector('h2').textContent=title;
  dialog.querySelector('p').textContent=message;
  dialog.querySelector('[data-confirm]').textContent=confirmLabel;
  dialog.querySelector('[data-cancel]').textContent=cancelLabel;
  let finished=false;
  const finish=value=>{if(finished)return;finished=true;dialog.close();dialog.remove();resolve(value);setTimeout(()=>{if(previous?.isConnected&&!previous.disabled)previous.focus({preventScroll:true});},0);};
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  dialog.querySelector('[data-cancel]').onclick=()=>finish(false);
  dialog.querySelector('[data-confirm]').onclick=()=>finish(true);
  document.body.append(dialog);dialog.showModal();dialog.querySelector('h2').focus();
 });
}
