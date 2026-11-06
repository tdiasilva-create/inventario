import {icon} from './desktop-icons.js';
export const escapePhoto=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const photoKinds={facade:'Fachada da unidade',environment:'Ambiente',equipment:'Equipamento',answer:'Evidência da resposta',occurrence:'Ocorrência'};
export const photoCaption=p=>photoKinds[p.target_kind]||'Fotografia da coleta';
export const photoDate=v=>v?new Date(v).toLocaleString('pt-BR'):'Data não informada';
export const photoSource=p=>'/api/inventory/photo?id='+encodeURIComponent(p.id);
export const photoState=p=>p.inspection_state==='paused'?'PARCIAL · COLETA PAUSADA':p.inspection_state==='open'?'PARCIAL · EM ANDAMENTO':'COLETA CONCLUÍDA';
if(!document.querySelector('link[href="/desktop-photos.css"]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/desktop-photos.css';document.head.append(style);}
// Uma mesma janela para fotos oficiais, parciais e miniaturas do panorama.
export function openPhotoViewer(items,index=0,trigger=document.activeElement){
 if(!items.length)return;
 document.querySelector('.photo-viewer')?.close();
 const dialog=document.createElement('dialog');dialog.className='photo-viewer photo-theme';dialog.setAttribute('aria-labelledby','photo-viewer-title');
 dialog.innerHTML=`<header class="photo-viewer-head"><div><span class="photo-eyebrow">SEMED · REGISTRO FOTOGRÁFICO</span><h2 id="photo-viewer-title"></h2></div><button type="button" class="photo-icon" data-viewer="close" aria-label="Fechar fotografia">${icon('close')}</button></header><div class="photo-viewer-body"><div class="photo-stage"><img alt=""><p class="photo-image-error" hidden>Não foi possível carregar esta fotografia.<br><button type="button" class="photo-button" data-viewer="retry">Tentar novamente</button></p></div><aside class="photo-context"></aside></div><footer class="photo-viewer-footer"><button type="button" class="photo-button photo-secondary" data-viewer="prev">← Anterior</button><span class="photo-position" aria-live="polite"></span><button type="button" class="photo-button photo-secondary" data-viewer="next">Próxima →</button></footer>`;
 const img=dialog.querySelector('img'),error=dialog.querySelector('.photo-image-error');
 img.addEventListener('error',()=>{img.hidden=true;error.hidden=false;});
 img.addEventListener('load',()=>{img.hidden=false;error.hidden=true;});
 function paint(){const p=items[index],partial=p.inspection_state==='open'||p.inspection_state==='paused';dialog.querySelector('h2').textContent=photoCaption(p);img.hidden=false;error.hidden=true;img.alt=photoCaption(p)+(p.unit_name?' · '+p.unit_name:'');img.src=p.src||photoSource(p);
  dialog.querySelector('.photo-context').innerHTML=`<span class="photo-badge ${partial?'is-partial':''}">${escapePhoto(photoState(p))}</span><h3>${escapePhoto(p.unit_name||'Unidade selecionada')}</h3><p>${p.inspection_state==='paused'?'Registro preservado de uma coleta pausada. Não compõe os indicadores oficiais.':partial?'Foto recebida; a coleta ainda não compõe os indicadores oficiais.':'Fotografia de uma coleta confirmada pelo servidor.'}</p><dl><dt>Recebida em</dt><dd>${escapePhoto(photoDate(p.created_at))}</dd><dt>Registrada por</dt><dd>${escapePhoto(p.created_by_name||'Consulte o registro da coleta')}</dd><dt>Vínculo</dt><dd>${escapePhoto(photoCaption(p))}</dd>${p.target_id?'<dt>ID do item vinculado</dt><dd class="photo-id">'+escapePhoto(p.target_id)+'</dd>':''}</dl>${p.unit_id&&p.inspection_state!=='paused'?'<a class="photo-text-link" href="'+(partial?'/coletas-em-andamento?vistoria='+encodeURIComponent(p.inspection_id):'/unidade?id='+encodeURIComponent(p.unit_id))+'">'+(partial?'Abrir coleta em andamento':'Abrir unidade')+' →</a>':''}`;
  dialog.querySelector('.photo-position').textContent=`${index+1} de ${items.length} nesta página`;dialog.querySelector('[data-viewer="prev"]').disabled=index===0;dialog.querySelector('[data-viewer="next"]').disabled=index===items.length-1;
 }
 dialog.addEventListener('click',e=>{if(e.target.closest('.photo-context a')){dialog.close();return;}const action=e.target.closest('[data-viewer]')?.dataset.viewer;if(action==='close')dialog.close();if(action==='prev'&&index>0){index--;paint();}if(action==='next'&&index<items.length-1){index++;paint();}if(action==='retry'){img.hidden=false;error.hidden=true;img.src=(items[index].src||photoSource(items[index]))+'&retry='+Date.now();}});
 dialog.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)&&!e.target.matches('input,select,textarea')){e.preventDefault();dialog.querySelector(`[data-viewer="${e.key==='ArrowLeft'?'prev':'next'}"]`).click();}});
 dialog.addEventListener('close',()=>{dialog.remove();if(trigger?.isConnected)trigger.focus();},{once:true});document.body.append(dialog);paint();dialog.showModal();dialog.querySelector('[data-viewer="close"]').focus();
}
