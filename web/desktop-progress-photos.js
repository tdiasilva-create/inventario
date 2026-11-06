import {openPhotoViewer} from './photo-viewer.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>new Date(v).toLocaleString('pt-BR');
const labels={facade:'Fachada da unidade',environment:'Ambiente',equipment:'Equipamento',answer:'Evidência da resposta',occurrence:'Ocorrência'};
const caption=p=>[labels[p.target_kind]||'Evidência da coleta',p.environment_name||p.asset||p.equipment_category].filter(Boolean).join(' · ');
const style=document.createElement('link');style.rel='stylesheet';style.href='/desktop-progress-photos.css';document.head.append(style);
export function createProgressPhotos(){
 let selected=null,page={items:[],ready:0,pending:0,nextCursor:null},cursors=[null],error='',loading=false,sequence=0,held=null,lastMarkup='';
 const imageUrl=id=>'/api/inventory/in-progress-photo?'+new URLSearchParams({id:selected,photoId:id});
 function render(){
  if(!selected)return '';
  return '<section class="panel progress-photos photo-theme" aria-label="Fotografias da coleta em andamento"><div class="dialog-body"><div class="progress-heading"><h3>Fotografias recebidas nesta coleta</h3><span class="partial-badge">PARCIAL</span></div><p>'+page.ready+' recebida(s) · '+page.pending+' envio(s) ainda sem confirmação</p><p class="progress-photo-help">Fotos já enviadas ao servidor. A vistoria continua em andamento e não compõe os resultados oficiais.</p>'+(error?'<p class="progress-error" role="alert">'+esc(error)+'</p>':'')+'<div class="progress-photo-grid">'+page.items.map(p=>'<figure>'+(p.status==='ready'?'<button type="button" data-progress-photo="open" data-id="'+esc(p.id)+'" aria-label="Ampliar foto: '+esc(caption(p))+'"><img src="'+imageUrl(p.id)+'" alt="'+esc(caption(p))+'" loading="lazy"><span class="progress-photo-failure" hidden>Não foi possível abrir a imagem. Use Atualizar agora.</span></button>':'<div class="progress-photo-pending">Envio ainda não confirmado</div>')+'<figcaption><strong>'+esc(caption(p))+'</strong><span>'+esc(p.created_by_name)+' · '+date(p.created_at)+'</span><small>'+(p.status==='ready'?'Recebida pelo servidor':'Pendente de recebimento')+'</small></figcaption></figure>').join('')+'</div>'+(!page.items.length?'<p class="empty">'+(loading?'Consultando fotografias…':error?'A consulta de fotografias está indisponível.':'Nenhuma fotografia recebida nesta coleta ainda.')+'</p>':'')+'<div class="progress-pagination"><button type="button" class="btn" data-progress-photo="prev" '+(loading||cursors.length===1?'disabled':'')+'>Anteriores</button><button type="button" class="btn" data-progress-photo="next" '+(loading||!page.nextCursor?'disabled':'')+'>Próximas 50</button></div></div></section>';
 }
 function mount(){
  const target=document.querySelector('#progress-content');if(!target)return;
  const notice=target.querySelector('.detail-notice');if(notice?.textContent.includes('visualização de fotos parciais'))notice.remove();
  const markup=JSON.stringify([selected,page,error,cursors.length,page.items.length?false:loading]);
  if(selected&&markup===lastMarkup&&(held||target.querySelector('.progress-photos'))){if(held)target.querySelector('.progress-detail')?.after(held);held=null;const prev=target.querySelector('[data-progress-photo="prev"]'),next=target.querySelector('[data-progress-photo="next"]');if(prev)prev.disabled=loading||cursors.length===1;if(next)next.disabled=loading||!page.nextCursor;return;}
  target.querySelector('.progress-photos')?.remove();held=null;lastMarkup=markup;
  if(selected)target.querySelector('.progress-detail')?.insertAdjacentHTML('afterend',render());
 }
 async function refresh(id){
  if(id!==selected){selected=id;page={items:[],ready:0,pending:0,nextCursor:null};cursors=[null];error='';sequence++;}
  if(!id){mount();return;}
  const ticket=++sequence;loading=true;mount();
  try{const r=await fetch('/api/inventory/in-progress-photos?'+new URLSearchParams({id,cursor:cursors.at(-1)||''}),{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível consultar as fotografias.');if(ticket!==sequence)return;page=data;error='';}
  catch(e){if(ticket===sequence)error=e.message;}
  finally{if(ticket===sequence){loading=false;mount();}}
 }
 document.addEventListener('error',event=>{const img=event.target;if(!img.matches?.('.progress-photos img,.progress-photo-dialog img'))return;img.hidden=true;const warning=img.nextElementSibling;if(warning)warning.hidden=false;},true);
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-progress-photo]');if(!button||button.disabled)return;
  const action=button.dataset.progressPhoto;
  if(action==='prev'||action==='next'){if(action==='prev'&&cursors.length>1)cursors.pop();else if(action==='next'&&page.nextCursor)cursors.push(page.nextCursor);await refresh(selected);}
  if(action==='open'){
   const photo=page.items.find(p=>p.id===button.dataset.id&&p.status==='ready');if(!photo)return;
   const photos=page.items.filter(p=>p.status==='ready').map(p=>({...p,inspection_state:'open',inspection_id:selected,src:imageUrl(p.id)}));
   openPhotoViewer(photos,photos.findIndex(p=>p.id===photo.id),button);
  }
 });
 return {refresh,mount,detach(){held=document.querySelector('#progress-content .progress-photos');held?.remove();}};
}
