// Small independent viewer; does not import desktop layouts into the collector.
export function viewCollectorPhoto(photo,trigger){
 const dialog=document.createElement('dialog');dialog.className='collector-photo-viewer';
 const title=document.createElement('h2');title.textContent=photo.label||'Fotografia da coleta';
 const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Fechar fotografia';close.onclick=()=>dialog.close();
 const img=document.createElement('img');img.alt=title.textContent;img.decoding='async';
 const preview=trigger?.querySelector('img');if(preview?.getAttribute('src'))img.src=preview.currentSrc||preview.src;
 const info=document.createElement('p');info.textContent=[photo.created_at?new Date(photo.created_at).toLocaleString('pt-BR'):null,photo.created_by_name].filter(Boolean).join(' · ');
 const status=document.createElement('p');status.role='status';
 const retry=document.createElement('button');retry.type='button';retry.className='secondary';retry.textContent='Tentar foto completa novamente';retry.hidden=true;
 let original=null,timer=null,closed=false;
 function load(){
  clearTimeout(timer);if(original){original.onload=original.onerror=null;original.removeAttribute('src');}
  const candidate=new Image();original=candidate;retry.hidden=true;status.textContent='Carregando foto completa…';
  const failed=()=>{if(closed||original!==candidate)return;clearTimeout(timer);candidate.onload=candidate.onerror=null;candidate.removeAttribute('src');status.textContent='A foto completa não carregou. A miniatura continua disponível.';retry.hidden=false;};
  candidate.onload=()=>{if(closed||original!==candidate)return;clearTimeout(timer);img.src=candidate.src;status.textContent='';};candidate.onerror=failed;
  timer=setTimeout(failed,30000);candidate.src='/api/collector/photo?id='+encodeURIComponent(photo.id);
 }
 retry.onclick=load;
 dialog.append(close,title,img,status,retry,info);dialog.addEventListener('close',()=>{closed=true;clearTimeout(timer);if(original){original.onload=original.onerror=null;original.removeAttribute('src');}dialog.remove();if(trigger?.isConnected)trigger.focus();},{once:true});document.body.append(dialog);dialog.showModal();close.focus();load();
}
