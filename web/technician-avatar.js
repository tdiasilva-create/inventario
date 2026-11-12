import {confirmAction} from './panel-confirm.js';
export const avatarUrl=(userId,imageId)=>'/api/dispatch/avatar?'+new URLSearchParams({userId,imageId});
export function avatarElement(name,userId,imageId){
 const box=document.createElement('span');box.className='technician-avatar';
 const initials=document.createElement('span');initials.textContent=String(name||'Técnico').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();initials.setAttribute('aria-hidden','true');box.append(initials);
 if(imageId){const image=document.createElement('img');image.alt='';image.src=avatarUrl(userId,imageId);image.decoding='async';image.onerror=()=>image.remove();box.append(image);}
 return box;
}
async function prepare(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Escolha uma imagem PNG, JPEG ou WebP de até 10 MB.');
 const image=await createImageBitmap(file),canvas=document.createElement('canvas');
 try{
  if(image.width*image.height>20000000)throw Error('A imagem é muito grande. Use uma versão menor.');
  canvas.width=canvas.height=128;const scale=Math.min(128/image.width,128/image.height),w=image.width*scale,h=image.height*scale;
  canvas.getContext('2d').drawImage(image,(128-w)/2,(128-h)/2,w,h);
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob||blob.size>65536)throw Error('Não foi possível preparar a miniatura. Escolha outra imagem.');return blob;
 }finally{image.close();canvas.width=canvas.height=0;}
}
export async function editTechnicianAvatar(userId,csrf,onSaved){
 const d=document.createElement('dialog');d.className='ops-dialog avatar-dialog';
 d.innerHTML='<h2>Imagem do técnico</h2><p data-name></p><div data-preview></div><label>Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp"></label><p class="muted">PNG, JPEG ou WebP, até 10 MB. Confira a prévia antes de salvar.</p><p role="status" data-status></p><div class="ops-actions"><button class="ops-btn" data-save disabled>Salvar imagem</button><button class="ops-btn" data-remove disabled>Remover imagem</button><button class="ops-btn" data-close>Fechar</button></div>';
 document.body.append(d);const q=s=>d.querySelector(s);let info,blob,pending,busy=false,localUrl;
 const message=(s,error=false)=>{q('[data-status]').textContent=s;q('[data-status]').classList.toggle('ops-error',error);};
 const controls=()=>{q('input').disabled=busy||!info;q('[data-save]').disabled=busy||!blob;q('[data-remove]').disabled=busy||!info?.imageId;q('[data-close]').disabled=busy;};
 const release=()=>{if(localUrl){URL.revokeObjectURL(localUrl);localUrl=null;}};
 const preview=()=>{release();const el=avatarElement(info?.name,userId,blob?null:info?.imageId);if(blob){const img=document.createElement('img');img.alt='Prévia da imagem escolhida';img.src=localUrl=URL.createObjectURL(blob);el.append(img);}q('[data-preview]').replaceChildren(el);};
 async function reload(){const r=await fetch('/api/dispatch/avatar-info?userId='+encodeURIComponent(userId));const value=await r.json();if(!r.ok)throw Error(value.error||'Não foi possível consultar a imagem.');info=value;q('[data-name]').textContent=info.name;preview();controls();}
 q('[data-close]').onclick=()=>d.close();d.oncancel=e=>{if(busy)e.preventDefault();};d.onclose=()=>{release();d.remove();};
 q('input').onchange=async()=>{const file=q('input').files?.[0];if(!file)return;busy=true;controls();try{const prepared=await prepare(file);blob=prepared;pending=null;preview();message('Prévia pronta. Clique em Salvar imagem.');}catch(e){message(e.message,true);}finally{busy=false;controls();}};
 async function save(remove){
  if(busy||!info)return;if(remove&&!await confirmAction('Remover a imagem deste técnico? O mapa passará a mostrar suas iniciais.'))return;
  busy=true;controls();message(remove?'Removendo imagem…':'Enviando imagem…');
  pending=pending?.remove===remove?pending:{remove,id:crypto.randomUUID(),version:info.version};
  try{
   const headers={'X-CSRF-Token':csrf},url='/api/dispatch/'+(remove?'avatar-remove':'avatar');let body;
   if(remove){headers['Content-Type']='application/json';body=JSON.stringify({userId,operationId:pending.id,version:pending.version});}
   else{Object.assign(headers,{'Content-Type':'image/png','X-User-Id':userId,'X-Operation-Id':pending.id,'X-Avatar-Version':String(pending.version)});body=blob;}
   const r=await fetch(url,{method:'POST',headers,body,signal:AbortSignal.timeout(60000)}),result=await r.json();
   if(!r.ok)throw Error(result.error||'Não foi possível salvar a imagem.');
   blob=null;pending=null;q('input').value='';
   try{await reload();await onSaved?.();message(remove?'Imagem removida. O mapa usará as iniciais.':'Imagem salva. O mapa será atualizado automaticamente.');}
   catch{message('Alteração salva. Reabra este cadastro para atualizar a prévia.',true);}
  }catch(e){message(e.name==='TimeoutError'?'Não recebemos confirmação. Tente salvar novamente para conferir o mesmo envio.':e.message,true);}
  finally{busy=false;controls();}
 }
 q('[data-save]').onclick=()=>save(false);q('[data-remove]').onclick=()=>save(true);controls();d.showModal();
 try{await reload();}catch(e){message(e.message,true);controls();}
}
