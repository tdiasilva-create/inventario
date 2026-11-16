// Confirmação explícita; cancelar/Esc nunca executam a operação.
export function confirmCollection(message, {title='Confirmar ação', confirmLabel='Confirmar', cancelLabel='Cancelar',comparison}={}) {
 return new Promise(resolve=>{
  const previous=document.activeElement, dialog=document.createElement('dialog');
  dialog.className='collector-confirm';
  dialog.setAttribute('aria-labelledby','collector-confirm-title');
  dialog.setAttribute('aria-describedby','collector-confirm-message');
  dialog.innerHTML='<h2 id="collector-confirm-title" tabindex="-1"></h2><p id="collector-confirm-message"></p><div class="dialog-actions"><button type="button" class="secondary" data-cancel>Cancelar</button><button type="button" class="primary" data-confirm></button></div>';
  dialog.querySelector('h2').textContent=title;
  dialog.querySelector('p').textContent=message;
  if(comparison){const block=document.createElement('div');for(const [label,value]of Object.entries(comparison)){const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent=label;pre.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';details.append(summary,pre);block.append(details);}dialog.querySelector('.dialog-actions').before(block);}
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
