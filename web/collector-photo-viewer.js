// Small independent viewer; does not import desktop layouts into the collector.
export function viewCollectorPhoto(photo,trigger){
 const dialog=document.createElement('dialog');dialog.className='collector-photo-viewer';
 const title=document.createElement('h2');title.textContent=photo.label||'Fotografia da coleta';
 const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Fechar fotografia';close.onclick=()=>dialog.close();
 const img=document.createElement('img');img.alt=title.textContent;img.src='/api/collector/photo?id='+encodeURIComponent(photo.id);img.decoding='async';
 const info=document.createElement('p');info.textContent=[photo.created_at?new Date(photo.created_at).toLocaleString('pt-BR'):null,photo.created_by_name].filter(Boolean).join(' · ');
 const status=document.createElement('p');status.role='status';status.textContent='Carregando foto completa…';img.onload=()=>{status.textContent='';};img.onerror=()=>{status.textContent='Não foi possível abrir a foto completa. Feche e tente novamente.';};
 dialog.append(close,title,img,status,info);dialog.addEventListener('close',()=>{dialog.remove();if(trigger?.isConnected)trigger.focus();},{once:true});document.body.append(dialog);dialog.showModal();close.focus();
}
