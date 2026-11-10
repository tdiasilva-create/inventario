// Confirmation stays explicit; cancel and Escape never submit a mutation.
export function confirmAction(message){
 return new Promise(resolve=>{
  const previous=document.activeElement,d=document.createElement('dialog');d.className='root-delete-dialog panel-confirm';
  const heading=document.createElement('h2');heading.id='panel-confirm-title';heading.textContent='Confirmar ação';d.setAttribute('aria-labelledby',heading.id);
  const text=document.createElement('p');text.textContent=message;
  const actions=document.createElement('div');actions.className='ops-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='ops-btn';cancel.textContent='Cancelar';cancel.autofocus=true;
  const accept=document.createElement('button');accept.type='button';accept.className='ops-btn primary';accept.textContent='Confirmar';
  cancel.onclick=()=>d.close();accept.onclick=()=>d.close('confirmed');actions.append(cancel,accept);d.append(heading,text,actions);document.body.append(d);
  d.addEventListener('close',()=>{const confirmed=d.returnValue==='confirmed';d.remove();previous?.focus();resolve(confirmed);},{once:true});d.showModal();
 });
}
