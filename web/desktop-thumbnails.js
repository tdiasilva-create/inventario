import {preparePhoto,photoHash} from './photo-prepare.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createThumbnailMaintenance({csrf,render}){
 let force=false,busy=false,started=false,cursor=null,more=false,done=0,processed=0,failures=[],message='';
 async function request(path,options={}){const response=await fetch(path,{...options,cache:'no-store',signal:AbortSignal.timeout(30000)});if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error||'Não foi possível preparar a miniatura.');}return response;}
 async function run(restart,rebuild=false){
  if(busy)return;busy=true;started=true;message='Consultando fotografias sem miniatura…';if(restart){force=rebuild;cursor=null;done=processed=0;failures=[];}render();
  try{const page=await(await request('/api/root/photo-thumbnails?'+new URLSearchParams({cursor:cursor||'',...(force?{force:'1'}:{})}))).json();
   for(const photo of page.items){message='Preparando fotografia '+(processed+1)+' · '+photo.unit_name;render();
    try{const response=await request('/api/inventory/photo?id='+encodeURIComponent(photo.id)),blob=await response.blob();if(await photoHash(blob)!==photo.sha256)throw Error('O arquivo não corresponde ao hash registrado. Original preservado.');
     const thumb=await preparePhoto(blob,{thumbnailOnly:true});
     await request('/api/root/photo-thumbnails'+(force?'?force=1':''),{method:'POST',headers:{'Content-Type':'image/jpeg','X-CSRF-Token':csrf(),'X-Photo-Id':photo.id,'X-Inspection-Id':photo.inspection_id,'X-Source-SHA256':photo.sha256},body:thumb.blob});done++;
    }catch(error){failures.push({id:photo.id,message:error.message});}processed++;render();
   }
   cursor=page.nextCursor;more=!!cursor;message=more?'Lote concluído. Continue para preparar até mais 20 fotografias.':'Consulta concluída. Novas fotos ou falhas podem ser verificadas novamente.';
  }catch(error){message=error.message;}finally{busy=false;render();}
 }
 document.addEventListener('click',e=>{const action=e.target.closest('[data-thumbnails]')?.dataset.thumbnails;if(action)run(action!=='continue',action==='rebuild');});
 return {block(){return `<section class="panel" aria-label="Miniaturas de fotografias"><div class="dialog-body"><h3>Miniaturas de fotografias</h3><p>Prepara imagens pequenas para abrir as listas mais rápido. As fotos completas permanecem no armazenamento privado. Até 20 fotografias por lote; mantenha esta aba aberta durante o preparo.</p><div class="actions"><button type="button" class="btn secondary" data-thumbnails="rebuild" ${busy?'disabled':''}>Recriar miniaturas existentes</button><button type="button" class="btn secondary" data-thumbnails="${more?'continue':'start'}" ${busy?'disabled':''}>${more?'Continuar geração de miniaturas':'Gerar miniaturas pendentes'}</button>${more&&!busy?'<button type="button" class="btn secondary" data-thumbnails="start">Verificar novamente desde o início</button>':''}</div><p role="status" aria-live="polite">${esc(message)}${started?' '+done+' miniatura(s) preparada(s) de '+processed+' processada(s).':''}</p>${failures.length?'<details><summary>'+failures.length+' foto(s) não preparada(s); originais preservados</summary><ul>'+failures.slice(-20).map(f=>'<li>'+esc(f.id)+' · '+esc(f.message)+'</li>').join('')+'</ul><p>Ao terminar os lotes, use Gerar miniaturas pendentes para tentar essas fotos novamente.</p></details>':''}</div></section>`;}};
}
