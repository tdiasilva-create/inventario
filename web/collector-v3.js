// Coleta SEMED — questionário coleta-3.0 (D-057) no navegador e dentro do app /app (D-115).
// Refinamento de 14/11/2026: mesmas rotas, mesmo catálogo, mesmos IDs e regras; muda a apresentação, o estado por objeto,
// o envio de fotos em segundo plano, a retomada da ficha (trava expirada, resposta perdida, conflito) e a revisão explicável.
import {collectorPath,mobileHost,sessionExpired,installCollectorApp} from './collector-app.js';
import {confirmCollection} from './collector-dialog.js';
import {preparePhoto,photoHash} from './photo-prepare.js';
import {viewCollectorPhoto} from './collector-photo-viewer.js';
import {createPhotoPreviews} from './collector-photo-previews.js';
import {topics,v3Sections as v2Sections,v3EquipmentFields as v2EquipmentFields,questionnaireVersion,problemSummary,registrationLabels,computerOperationLabels} from './collector-v3-schema.js';
import {createDraftQueue} from './collector-drafts.js';
import {editEnvironmentName} from './environment-editor.js';
import {chooseEnvironment} from './collector-environments.js';
import {scanPairingQr,parsePairingQr} from './collector-qr.js';
import {shown} from './collector-schema.js';
import {icon} from './desktop-icons.js';
import {updateScreen,installInputExperience} from './collector-ui.js';
import {readCollectorJson} from './collector-request.js';

const app=document.querySelector('#collector');
const readyPreviews=createPhotoPreviews({onEvict:(id,url)=>{for(const img of app.querySelectorAll('img'))if(img.getAttribute('src')===url)img.src='/api/collector/photo?id='+encodeURIComponent(id)+'&size=thumb';}});
addEventListener('pagehide',()=>readyPreviews.clear());
app.addEventListener('error',event=>{const img=event.target;if(!img.matches?.('.photo-open img')||img.dataset.originalFallback)return;const id=img.closest('[data-photo-id]')?.dataset.photoId;if(!id)return;img.dataset.originalFallback='1';img.src='/api/collector/photo?id='+encodeURIComponent(id);},true);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={desktop:'Desktop',notebook:'Notebook',computer:'Computador',printer:'Impressora',other:'Outro equipamento',...registrationLabels};
const topicName=g=>topics.find(t=>t[0]===g)?.[1]||g;

// ---------------------------------------------------------------------------------------------------------------------
// Estado da aba (nunca é offline durável; ver LIM-03 do pacote)
// ---------------------------------------------------------------------------------------------------------------------
let me,collection,screen='facade',topic='A',step=0,answers={},dirty=false,timer,busy=false,error='',errorSession=false,fields={};
let items=[],cursor=null,nextCursor=null,reviewData,query='',filter='',appliedQuery='';
let item=null,lock=null,lockAt=0,itemVersion=0,itemSaved=false,pairing=null;
let fromReview=false,inlinePending=null,renderedContext='',inventoryScroll=0,inventorySnapshot=null;
let loadingScreen=null,actionSerial=0;
// 'Rascunho no servidor' é a marca de "nada em curso": o texto exibido depende da tela (statusText()).
let status='Rascunho no servidor',caps={};
const previews=new Map();          // chave "kind:id" → prévias ainda não recebidas
const uploads=new Map();           // chave "kind:id" → envio em curso {promise,total,done}
const preparing=new Map();         // chave "kind:id" → promessa da preparação (redução/miniatura) em curso
const targets=new Map();           // chave "equipment:id" → objeto da ficha fixado na SELEÇÃO da foto (R2: não depende da tela atual)
const receivedPhotos=new Map();    // id da foto → {record,at}: confirmações desta aba, para uma leitura atrasada da visita não as apagar (R3)
const LOCK_TTL=180000,LOCK_FRESH=120000; // trava do servidor: 3 min; renovar antes de salvar quando passou de 2 min
const ux=installInputExperience(app);
const contextKey=()=>collection?.inspection.id+':'+screen+':'+topic+(screen==='equipment'?':'+item?.id:'');
const sectionLocked=()=>collection?.inspection?.state==='open'&&collection.sections[topic]?.state==='Concluído'&&['group','inventory','environment','equipment'].includes(screen);
const button=(label,action,attrs='',cls='primary')=>`<button type="button" class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
const simbolo=g=>{const t=topics.find(t=>t[0]===g);return t?`<span class="simbolo tile-${t[3]||'laranja'}">${icon(t[2])}</span>`:'';};

// ---------------------------------------------------------------------------------------------------------------------
// Rede
// ---------------------------------------------------------------------------------------------------------------------
async function api(path,data,options={}){
 const {response:r,value:v}=await readCollectorJson(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json','X-CSRF-Token':me.csrf}:{},body:data?JSON.stringify(data):undefined,...options});
 if(r.status===401){sessionExpired();throw Object.assign(Error('Sua sessão expirou ou não foi reconhecida. Entre de novo com o mesmo usuário e volte aqui; o que ainda não foi enviado continua nesta tela.'),v,{httpStatus:401,session:true});}
 if(!r.ok)throw Object.assign(Error(v.error||v.message||'Operação não confirmada.'),v,{httpStatus:r.status});
 return v;
}
async function load({review=false}={}){
 await drafts.flushAll({skipConflicts:true});
 const started=Date.now();
 collection=await api('/api/collector/inspection?id='+collection.inspection.id+(review?'&review=1':''));
 if(review)reviewData=collection.review??await api('/api/collector/review?id='+collection.inspection.id);
 if(collection.inspection.questionnaire_version!==questionnaireVersion){location.replace(collectorPath('/?vistoria='+collection.inspection.id));return;}
 // R3: uma foto confirmada DEPOIS de esta leitura começar não pode estar na resposta; reaplica em vez de apagar a confirmação.
 for(const [id,{record,at}]of receivedPhotos){if(at<started-300000){receivedPhotos.delete(id);continue;}if(at>started&&!collection.photos.some(p=>p.id===id))collection.photos.push(record);}
 readyPreviews.retain(new Set(collection.photos.map(p=>p.id)));
 // Entrada da fila já existente e LIMPA (nada local por enviar) adota a versão/respostas que o servidor acabou de devolver; antes,
 // ficava na versão antiga e save() a devolvia à linha — e reabrir/concluir o assunto após OUTRA sessão o ter alterado falhava
 // com "Cartão alterado em outra sessão" até recarregar a página (achado no caminho de R4). Com alteração local pendente, nada muda:
 // o envio com a versão antiga continua caindo na proteção de conflito do servidor.
 for(const [g,row]of Object.entries(collection.sections)){const d=drafts.entry(collection.inspection.id,g,row.version,row.data);if(!d.pending&&JSON.stringify(d.local)===d.confirmed&&(d.version!==row.version||d.confirmed!==JSON.stringify(row.data))){d.version=row.version;d.local=structuredClone(row.data);d.confirmed=JSON.stringify(row.data);d.state=row.state;}}
 answers=structuredClone(collection.sections[topic]?.data||{});dirty=false;
}
function route(){const u=new URL(location.href);u.search='';u.searchParams.set('vistoria',collection.inspection.id);u.searchParams.set('tela',screen==='equipment'?'inventory':screen);u.searchParams.set('assunto',topic);return u;}

// ---------------------------------------------------------------------------------------------------------------------
// Estado por objeto (faixa abaixo do cabeçalho)
// ---------------------------------------------------------------------------------------------------------------------
let lastStatus='',statusAt=0,statusTimer=null,statusHops=0;
const inFlight=()=>uploads.size>0||preparing.size>0||drafts.hasPending()||/Enviando|Salvando|Aguardando|Verificando|Preparando/.test(status);
// Confirmações e avisos ficam na faixa por 8 s (ou até a próxima navegação); depois a faixa volta ao estado do objeto.
function touchStatus(){if(status!==lastStatus){lastStatus=status;statusAt=Date.now();statusHops=0;clearTimeout(statusTimer);if(status!=='Rascunho no servidor')statusTimer=setTimeout(paintStatus,8300);}}
function ageStatus(limit){touchStatus();if(status!=='Rascunho no servidor'&&Date.now()-statusAt>limit&&!inFlight()){status='Rascunho no servidor';lastStatus=status;}}
// Uma confirmação acompanha no máximo UMA troca de tela (a ação que a gerou costuma navegar em seguida); na segunda, cai.
function hopStatus(){touchStatus();if(status==='Rascunho no servidor'||inFlight())return;statusHops++;if(statusHops>1||Date.now()-statusAt>800){status='Rascunho no servidor';lastStatus=status;}}
function statusText(){
 ageStatus(8000);
 if(status!=='Rascunho no servidor')return status;
 if(screen==='equipment'&&item){
  if(!itemVersion)return 'Ficha nova · ainda não enviada';
  if(item.data.draft)return 'Rascunho recebido · falta salvar a ficha';
  return itemSaved?'Ficha salva no servidor':'Ficha com alterações não enviadas';
 }
 if(screen==='group'){if(drafts.failed())return 'Há alterações não enviadas';if(drafts.hasPending())return 'Salvando…';if(dirty)return 'Alterações neste assunto · salvando em instantes';return 'Respostas salvas no servidor';}
 if(screen==='review')return 'Revisão feita pelo servidor';
 if(collection?.inspection?.state!=='open')return 'Visita concluída';
 return 'Visita em andamento · salva no servidor';
}
function statusTone(text){
 if(/^Ficha nova/.test(text))return 'idle';
 if(/não enviad|não confirmad|desconhecid|não salv|falhou|expir/i.test(text))return 'warn';
 if(/Salvando|Enviando|Preparando|Aguardando|Verificando/i.test(text))return 'busy';
 if(/recebid|salv[ao]s? no servidor|confirmad|vinculad|registrad|cadastrad|atualizad|concluída e/i.test(text))return 'ok';
 return 'idle';
}
function statusMarkup(){const text=statusText(),tone=statusTone(text);return `<p class="save-state" role="status" data-tone="${tone}">${icon(tone==='warn'?'alert':tone==='busy'?'clock':tone==='ok'?'check':'clipboard')}<span>${esc(text)}</span></p>`;}
function paintStatus(){const el=app.querySelector('.save-state');if(!el)return;const text=statusText(),tone=statusTone(text);if(el.dataset.tone!==tone){const t=document.createElement('template');t.innerHTML=statusMarkup();el.replaceWith(t.content.firstElementChild);return;}el.querySelector('span').textContent=text;}
function setStatus(text){status=text;paintStatus();}

// ---------------------------------------------------------------------------------------------------------------------
// Cabeçalho, rodapé e campos
// ---------------------------------------------------------------------------------------------------------------------
function keyboardSave(){
 if(sectionLocked()||collection.inspection.state!=='open')return '';
 if(screen==='equipment'||screen==='group')return button('Salvar',screen==='equipment'?'save-item':'save','aria-label="Salvar sem fechar o teclado"','keyboard-save');
 if(screen==='environment')return '<button type="submit" form="environment-form" class="keyboard-save">Salvar</button>';
 return '';
}
function screenTitle(){
 if(screen==='cards')return 'Coleta da unidade';if(screen==='facade')return 'Fachada da unidade';if(screen==='environment')return 'Ambientes';if(screen==='review')return 'Revisão da visita';
 if(screen==='equipment')return item.data.category==='printer'?'Impressora':item.data.category==='other'?'Outro equipamento':'Computador';
 return topicName(topic);
}
function header(){
 return `<header class="app-header"><div class="header-row">${screen!=='cards'?button(icon('back'),'cards','aria-label="← Voltar às categorias" title="Voltar às categorias"','category-return'):''}<div class="header-title"><h1>${esc(screenTitle())}</h1><small title="${esc(collection.unit.name)}">${esc(collection.unit.name)}</small></div>${keyboardSave()}${button(icon('down')+'<span>Fechar teclado</span>','close-keyboard','aria-label="Fechar teclado"','keyboard-dismiss')}</div>${statusMarkup()}</header>`;
}
const footer=html=>`<footer class="collection-footer">${html}</footer>`;
function data(){return screen==='equipment'?item.data:answers;}
function read(path){return path.split('.').reduce((v,k)=>v?.[k],data());}
function write(path,value){const keys=path.split('.');let v=data();for(const k of keys.slice(0,-1)){if(['__proto__','constructor','prototype'].includes(k))return;v=v[k];}v[keys.at(-1)]=value;}
const fieldInput=(key,label,value='',type='text')=>`<label class="field"><span>${esc(label)}</span><input data-field="${key}" type="${type}" value="${esc(value)}" autocomplete="off" enterkeyhint="next"></label>`;
// Identidade legível de um registro repetido (C: provedor; D: SSID; H: categoria) no lugar de "Registro n" sozinho.
function rowTitle(f,r,i){const id=f.key==='links'?r.provider:f.key==='networks'?r.ssid:f.key==='occurrences'?r.type:'';const base=f.key==='links'?'Link':f.key==='networks'?'Rede':f.key==='occurrences'?'Problema':'Registro';return id?`${base} ${i+1} · ${id}`:`${base} ${i+1}`;}
function draw(f,path=f.key,obj=data()){
 if(!f||!shown(f,obj,{}))return '';
 const value=(f.key==='category'&&obj[f.key]==='computer')?'':obj[f.key]??'',required=typeof f.required==='function'?f.required(obj,{}):f.required,mark=required?' *':'',label=esc(f.label)+mark;
 let html='';
 if(f.key==='environmentName'&&screen==='equipment')html=`<div class="field"><span id="equipment-environment-label">Ambiente *</span>${button(`<span>${esc(value||'Selecionar ambiente')}</span>${icon('down')}`,'choose-environment','data-field="environmentName" aria-labelledby="equipment-environment-label" aria-haspopup="dialog"','environment-select')}<small class="help">Ambiente já cadastrado na unidade, ou cadastre um novo na lista.</small></div>`;
 else if(f.type==='rows'){const list=Array.isArray(value)?value:[];html=`<h3 class="block">${label}</h3>${list.map((r,i)=>`<article class="repeat-row"><h4>${esc(rowTitle(f,r,i))}</h4>${f.children.map(child=>draw(child,`${path}.${i}.${child.key}`,r)).join('')}${topic==='D'?'<p class="help">Não informe senhas nas observações; o armazenamento protegido ainda não existe.</p>':''}${f.key==='occurrences'?photos('occurrence',r.id,'Foto da ocorrência (opcional)',{compact:true}):''}${button('Remover este registro','remove-row',`data-path="${path}" data-index="${i}"`,'text-button')}</article>`).join('')}${list.length?'':'<p class="help">Nenhum registro ainda.</p>'}${button(icon('plus')+' Adicionar registro','add-row',`data-path="${path}" aria-label="+ Adicionar registro"`,'secondary')}`;}
 else if(f.type==='select'){const options=f.options.filter(o=>f.key!=='category'||(topic==='G'?o==='printer':o!=='printer')).map(o=>[o,names[o]||o]);const labelOf=([v,n])=>f.key==='operation'&&screen==='equipment'&&item?.data.category!=='printer'?(computerOperationLabels[v]||n):n;html=`<label class="field"><span>${label}</span><select data-field="${path}" ${f.key==='registration'&&screen==='equipment'&&item?.agent_linked?'disabled title="Computador vinculado ao agente; o vínculo só é desfeito por reconciliação administrativa."':''}><option value="">Selecione</option>${options.map(o=>`<option value="${esc(o[0])}" ${value===o[0]?'selected':''}>${esc(labelOf(o))}</option>`).join('')}</select></label>`;}
 else if(f.type==='textarea')html=`<label class="field"><span>${label}</span><textarea data-field="${path}" maxlength="4000">${esc(value)}</textarea></label>`;
 else if(f.type==='digits')html=`<label class="field"><span>${label}</span><input data-field="${path}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4000" autocomplete="off" enterkeyhint="next" value="${esc(value)}"></label>`;
 else html=fieldInput(path,f.label+mark,value,f.type==='decimal'||f.type==='number'?'number':f.type==='datetime-local'?'datetime-local':'text');
 if(fields[path]){const errorId='field-error-'+path.replace(/[^a-z0-9_-]/gi,'-');html=html.replace(/<(input|select|textarea|button)\b/,`<$1 aria-invalid="true" aria-describedby="${errorId}"`);html+=`<p id="${errorId}" class="field-error" role="alert">${icon('alert')}<span>${esc(fields[path])}</span></p>`;}
 return html;
}
// Resumo de erros de campo: lista curta com salto para cada campo; o detalhe continua embaixo de cada um.
function errorSummary(){
 const keys=Object.keys(fields);if(keys.length<2)return '';
 const labelOf=key=>{const base=key.split('.')[0],f=screen==='equipment'?v2EquipmentFields.find(f=>f.key===base):(v2Sections[topic]||[]).find(f=>f.key===base);const parts=key.split('.');let label=f?.label||base;if(f?.type==='rows'&&parts.length>=3){const child=f.children.find(c=>c.key===parts[2]);label=`${rowTitle(f,read(`${base}.${parts[1]}`)||{},Number(parts[1]))} · ${child?.label||parts[2]}`;}return label.replace(/\s*\(.*?\)\s*$/,'');};
 return `<nav class="error-summary" aria-label="Campos a corrigir"><strong>${keys.length} campos precisam de atenção</strong><ul>${keys.map(k=>`<li>${button(esc(labelOf(k)),'focus-field',`data-path="${esc(k)}"`,'text-button')}</li>`).join('')}</ul></nav>`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Fotografias (câmera/galeria, prévia, envio em segundo plano, histórico)
// ---------------------------------------------------------------------------------------------------------------------
function uploadState(key){const u=uploads.get(key);return u?{sending:true,done:u.done,total:u.total}:null;}
function photos(kind,id,label,{compact=false,primary=false}={}){
 const key=kind+':'+id,sent=collection.photos.filter(p=>p.target_kind===kind&&p.target_id===id&&p.status==='ready'),pending=previews.get(key)||[],up=uploadState(key),prep=preparing.has(key);
 const canSend=collection.inspection.state==='open';
 const thumbs=sent.map(p=>`<figure data-ui-key="photo:${p.id}" class="photo-thumb ${p.current?'':'historic'}"><button type="button" class="photo-open" data-action="view-photo" data-photo-id="${p.id}" aria-label="Ampliar ${esc(p.label||label)}"><img src="${readyPreviews.get(p.id)||'/api/collector/photo?id='+p.id+'&size=thumb'}" alt="${esc(p.label||label)}" width="160" height="120" loading="lazy" decoding="async"></button><figcaption><span class="photo-tag ${p.current?'now':'old'}">${p.current?'Nesta visita':'Visita anterior'}</span><span class="photo-date">${esc(p.created_at?new Date(p.created_at).toLocaleDateString('pt-BR'):'')}</span>${p.current&&canSend?button('Remover','remove-photo',`data-photo-id="${p.id}" aria-label="Remover foto"`,'text-button'):''}</figcaption></figure>`).join('')
  +pending.map((p,i)=>{const state=p.error?'failed':up&&p===pending[0]&&!p.queued?'sending':up?'queued':'waiting';return `<figure data-ui-key="preview:${p.id}" class="photo-thumb preview ${state}"><img src="${p.url}" alt="Prévia ainda não enviada"><figcaption><span class="photo-tag ${state}">${state==='sending'?'Enviando…':state==='queued'?'Na fila':state==='failed'?'Falhou':'Não enviada'}</span>${state==='sending'||state==='queued'?'':button('Remover','remove-preview',`data-key="${esc(key)}" data-index="${i}" aria-label="Remover prévia"`,'text-button')}</figcaption></figure>`;}).join('');
 const controls=!canSend?'':(prep||up)?`<div class="photo-actions"><span class="photo-progress" role="status">${icon('clock')} ${prep?'Preparando foto…':`Enviando foto ${Math.min(up.done+1,up.total)} de ${up.total}…`}</span></div>`:`<div class="photo-actions"><label class="${primary?'primary':'secondary'} photo-control">${icon('camera')}<span>Câmera</span><input type="file" accept="image/*" capture="environment" data-photo="${key}" aria-label="Fotografar · ${esc(label)}"></label><label class="secondary photo-control"><span>Galeria</span><input type="file" accept="image/*" multiple data-photo="${key}" aria-label="Escolher da galeria · ${esc(label)}"></label>${pending.length&&!up&&!prep?button(icon('export')+' Reenviar foto','upload',`data-key="${key}" ${!caps.photosEnabled?'disabled':''}`,'secondary'):''}</div>`;
 const serverPending=collection.photos.filter(p=>p.target_kind===kind&&p.target_id===id&&p.current&&p.status!=='ready'&&!pending.some(local=>local.id===p.id));
 const waiting=serverPending.map(p=>`<p class="notice">Envio de foto ainda sem confirmação · ${esc(p.created_by_name||'operador da visita')}. ${canSend&&p.created_by===me.id?button('Descartar envio pendente','remove-photo',`data-photo-id="${p.id}"`,'text-button'):'A pessoa que enviou deve reenviar ou descartar explicitamente.'}</p>`).join('');
 const failure=pending.find(p=>p.error)?.error;
 return `<section class="photos-block ${compact?'compact':''}" data-ui-key="photos:${esc(key)}"><h3 class="block">${esc(label)}${sent.length||pending.length?` <small>${sent.length} recebida(s)${pending.length?' · '+pending.length+' por enviar':''}</small>`:''}</h3>${thumbs?`<div class="photos">${thumbs}</div>`:''}${waiting}${controls}${failure?`<p class="field-error" role="alert">${icon('alert')}<span>${esc(failure)} A prévia continua aqui; toque em Reenviar foto.</span></p>`:''}${!caps.photosEnabled?'<p class="notice">Armazenamento de fotos indisponível no momento: a prévia fica só nesta aba e não conta como enviada.</p>':''}${compact?'':'<p class="help">Até cinco fotos por registro nesta visita. Prévias não enviadas se perdem ao fechar o aplicativo.</p>'}</section>`;
}
async function preparePhotos(input){
 const key=input.dataset.photo,list=previews.get(key)||[],sent=collection.photos.filter(p=>p.target_kind+':'+p.target_id===key&&p.status==='ready'&&p.current).length,files=[...input.files];
 if(sent+list.length+files.length>5)throw Error('Máximo de cinco fotos por registro nesta visita.');
 // R2: o alvo da foto é fixado AQUI, na seleção. Compressão e miniatura demoram; se o operador navegar nesse meio-tempo,
 // a foto continua pertencendo a esta ficha (e o rascunho mínimo é criado para ela), não à tela que estiver aberta depois.
 const [kind,id]=key.split(':');if(kind==='equipment'&&item?.id===id)targets.set(key,item);
 const job=(async()=>{
  for(const file of files){
   const prepared=await preparePhoto(file),total=[...previews.values()].flat().reduce((sum,p)=>sum+p.blob.size+(p.thumbnail?.size||0),0)+prepared.blob.size+prepared.thumbnail.size;
   if(total>40*1024*1024)throw Error('Envie as prévias que já estão aqui antes de selecionar mais fotografias.');
   list.push({id:crypto.randomUUID(),blob:prepared.blob,thumbnail:prepared.thumbnail,url:URL.createObjectURL(prepared.blob),error:null});previews.set(key,list);
   if(!list[0].error)startUpload(key);
  }
 })();
 preparing.set(key,job);render();
 try{await job;}finally{if(preparing.get(key)===job)preparing.delete(key);if(renderedContext===contextKey())render();}
 if(renderedContext===contextKey())render();
 if(list.length&&!list[0].error)startUpload(key);
}
// O envio corre em segundo plano: navegar entre telas da mesma visita não o interrompe nem o perde; o alvo (visita, ficha,
// prévia) vem de `targets`, fixado na seleção. Trocar de unidade, trocar/criar ficha e as ações de conclusão aguardam (settleUploads).
function startUpload(key){
 if(uploads.has(key))return uploads.get(key).promise;
 const list=previews.get(key)||[];if(!list.length)return Promise.resolve();
 const target=targets.get(key)||null;
 const entry={total:list.length,done:0,promise:null};
 entry.promise=runUpload(key,target,entry).catch(e=>{const p=(previews.get(key)||[])[0];if(p)p.error=e.message;if(e.session)errorSession=true;setStatus(e.session?'Foto não enviada · sessão expirada':'Foto não enviada: '+e.message);}).finally(()=>{if(uploads.get(key)===entry)uploads.delete(key);if(renderedContext===contextKey())render();else paintStatus();const remaining=previews.get(key)||[];if(remaining.length&&!remaining[0].error)startUpload(key);});
 uploads.set(key,entry);setStatus('Enviando foto 1 de '+entry.total+'…');render();return entry.promise;
}
async function runUpload(key,target,entry){
 if(!caps.photosEnabled)throw Error('Armazenamento indisponível; nenhuma foto foi enviada.');
 const inspectionId=collection.inspection.id,[kind,id]=key.split(':');
 // Ficha nova: o servidor exige o registro antes da foto → rascunho mínimo da FICHA ALVO (não da ficha aberta agora).
 if(kind==='equipment'&&target&&!(item===target?itemVersion:target.version))await saveDraft(target);
 else if(kind!=='equipment')await save();
 let thumbnailPending=false;const list=previews.get(key)||[];
 while(list.length){
  const p=list[0];p.error=null;entry.total=entry.done+list.length;setStatus('Enviando foto '+(entry.done+1)+' de '+entry.total+'…');
  const received=await api('/api/collector/photo-upload',null,{method:'POST',headers:{'Content-Type':p.blob.type,'X-CSRF-Token':me.csrf,'X-Photo-Id':p.id,'X-Inspection-Id':inspectionId,'X-Target-Kind':kind,'X-Target-Id':id},body:p.blob});
  if(received.status!=='ready')throw Error('O servidor ainda não confirmou o recebimento desta foto.');
  try{if(p.thumbnail)await api('/api/collector/photo-thumb',null,{method:'POST',headers:{'Content-Type':'image/jpeg','X-CSRF-Token':me.csrf,'X-Photo-Id':p.id,'X-Inspection-Id':inspectionId,'X-Source-SHA256':received.sha256||await photoHash(p.blob)},body:p.thumbnail});}catch{thumbnailPending=true;}
  if(p.thumbnail)readyPreviews.set(p.id,p.thumbnail);
  URL.revokeObjectURL(p.url);list.shift();entry.done++;
  // Registro local da foto recebida, idempotente por ID (R3): uma leitura da visita feita durante o envio pode já tê-la trazido.
  // A próxima leitura (navegação) traz os rótulos completos do servidor.
  const record={id:p.id,target_kind:kind,target_id:id,status:'ready',current:true,inspection_id:inspectionId,created_at:new Date().toISOString()};
  const at=collection.photos.findIndex(x=>x.id===p.id);if(at>=0)collection.photos[at]={...collection.photos[at],...record,created_at:collection.photos[at].created_at||record.created_at};else collection.photos.push(record);
  receivedPhotos.set(p.id,{record,at:Date.now()});
  if(renderedContext===contextKey())render();
 }
 setStatus(thumbnailPending?'Foto recebida. Miniatura pendente; a foto completa está disponível.':'Fotografia recebida pelo servidor');
}
// Barreira: aguarda preparação E envio das fotos (da chave indicada ou de todas). Preparação conta como pendência (R2):
// trocar/criar ficha, concluir, revisar e trocar de unidade só seguem depois.
// strict=false: só espera o que está em curso (trocar/criar ficha, abrir a revisão). strict=true: além de esperar, recusa se
// sobrou prévia não recebida — falha já encerrada, fila parada, armazenamento indisponível — MESMO sem envio ativo (R4).
async function settleUploads(filterKey=null,label='Aguardando o envio da foto…',{strict=true}={}){
 const mine=([k])=>!filterKey||k===filterKey;let waited=false;
 for(let round=0;round<20;round++){
  const prep=[...preparing.entries()].filter(mine),pending=[...uploads.entries()].filter(mine);if(!prep.length&&!pending.length)break;
  waited=true;setStatus(label);await Promise.all([...prep.map(([,p])=>p.catch(()=>{})),...pending.map(([,u])=>u.promise)]);
 }
 if(waited&&status===label)status='Rascunho no servidor';
 if(!strict)return;
 const left=[...previews.entries()].filter(([k,l])=>mine([k])&&l.length);
 if(left.length)throw Object.assign(Error(left.some(([,l])=>l.some(p=>p.error))?'Uma foto não foi recebida pelo servidor. Reenvie ou descarte a prévia antes de continuar.':'Há foto selecionada ainda não enviada. Reenvie ou descarte a prévia antes de continuar.'),{localPhotos:left.map(([k])=>k)});
}
// R4: fotos que o navegador conhece e o servidor não (prévias selecionadas e não recebidas). A revisão do servidor não as vê;
// aqui entram como pendência que impede a conclusão, apontando o alvo exato. Foto continua OPCIONAL: a obrigação é resolver
// a tentativa pendente (reenviar ou descartar), não ter foto.
function localPhotoPending(){
 const list=[];
 for(const [key,l]of previews){
  if(!l.length)continue;
  const [kind,id]=key.split(':'),failed=l.find(p=>p.error),sending=uploads.has(key)||preparing.has(key);
  const message=sending?'Foto em envio; aguarde terminar.':failed?'Foto não recebida: '+String(failed.error).trim().replace(/[.!]?$/,'.')+' Reenvie ou descarte a prévia.':'Foto selecionada e ainda não enviada. Reenvie ou descarte a prévia.';
  let section,label,action;
  if(kind==='facade'){section='facade';label='Fachada da unidade';action='open-facade';}
  else if(kind==='equipment'){const e=targets.get(key)||(item?.id===id?item:null)||items.find(x=>x.id===id)||inventorySnapshot?.items.find(x=>x.id===id)||null;const c=e?.data?.category;section=c==='printer'?'G':c==='other'?'O':'F';label=e?equipmentTitle(e):'Ficha de equipamento';action='open-equipment';}
  else if(kind==='environment'){section='B';label=collection.environments.find(x=>x.id===id)?.name||'Ambiente';action='open-section';}
  else{section='H';label='Ocorrência';action='open-section';}
  list.push({code:'FOTO_LOCAL_PENDENTE',section,kind,id,label,message,action,blocking:true,local:true,key,count:l.length,sending});
 }
 return list;
}

// ---------------------------------------------------------------------------------------------------------------------
// Telas
// ---------------------------------------------------------------------------------------------------------------------
function facade(){
 const sent=collection.photos.filter(p=>p.target_kind==='facade'&&p.target_id===collection.unit.id&&p.status==='ready'),current=sent.some(p=>p.current);
 return `<span class="simbolo tile-preto">${icon('camera')}</span><h2>Fachada da unidade</h2><p class="lead">${current?'Foto desta visita recebida. Você pode seguir para o acompanhante.':sent.length?'Há fotografia de fachada de visita anterior; ela continua disponível. Envie a desta visita se for o caso.':'Fotografe a entrada da unidade antes de começar. É a primeira exigência para concluir a visita.'}</p>${photos('facade',collection.unit.id,'Fachada',{primary:!current&&!sent.length})}`;
}
function cardState(g){const s=collection.sections[g]?.state;return `<span class="state ${s==='Concluído'?'done':s==='Em andamento'?'working':''}">${esc(s||'Pendente')}</span>`;}
function cards(){
 const facadePhotos=collection.photos.filter(p=>p.target_kind==='facade'&&p.status==='ready'),facadeNow=facadePhotos.some(p=>p.current);
 // D-116: só o estado de cada assunto; sem contador "N de 8" e sem porcentagem geral.
 return `<h2>Coleta da unidade</h2><p class="lead">${collection.inspection.state==='open'?'Preencha na ordem que preferir; a fachada vem primeiro. Cada assunto mostra o próprio estado.':'Esta visita foi encerrada; os dados estão no painel. Para atualizar a unidade, inicie outra visita.'}</p><div class="cards"><button class="category-card facade-card" data-action="facade"><span class="category-icon tile tile-preto">${icon('camera')}</span><strong>Fachada</strong><span class="state ${facadeNow?'done':facadePhotos.length?'working':''}">${facadeNow?'Foto recebida':facadePhotos.length?'Foto anterior':'Falta a foto'}</span></button>${topics.map(([g,name,ico,cor])=>`<button class="category-card" data-action="open" data-topic="${g}"><span class="category-icon tile tile-${cor||'laranja'}">${icon(ico)}</span><strong>${esc(name)}</strong>${cardState(g)}</button>`).join('')}</div>${item?`<div class="notice resume">${icon('clipboard')}<span>Há uma ficha de ${esc(item.data.category==='printer'?'impressora':item.data.category==='other'?'outro equipamento':'computador')} em preenchimento${itemSaved?'':' com alterações não enviadas'}.</span>${button('Retomar ficha em preenchimento','resume','','secondary')}</div>`:''}${button('Trocar unidade','units','','text-button')}<p class="help">Dados e fotos chegam ao servidor só com conexão.</p>`;
}
function preservedLinks(){return topic==='C'&&answers.exists==='Não'&&answers.links?.length?`<p class="notice">${icon('clipboard')}<span>${answers.links.length} link(s) continuam guardados; voltam se marcar Sim. Nenhum link foi apagado.</span></p>`:'';}
function groupForm(){return `${simbolo(topic)}<h2>${esc(topicName(topic))}</h2>${topic==='H'?summary():''}${errorSummary()}${(v2Sections[topic]||[]).map(f=>draw(f)).join('')}${preservedLinks()}`;}
function summary(){const sections=Object.fromEntries(Object.entries(collection.sections).map(([k,v])=>[k,v.data]));const list=problemSummary(sections,items);return `<section class="summary-card"><h3 class="block">Problemas já registrados</h3>${list.length?list.map(p=>`<p><strong>${esc(p.source)}</strong><br>${esc(p.description)}</p>`).join(''):'<p class="help">Nenhum problema registrado nos outros assuntos.</p>'}<p class="help">Registre aqui só o que não entrou nos assuntos anteriores. Necessidades não entram na contagem de equipamentos.</p></section>`;}
function equipmentTitle(e){const room=collection.environments.find(r=>r.id===e.data.environment)?.name||e.data.environmentName||'';const d=e.data;if(d.category==='other')return d.customCategory||'Outro equipamento';if(d.category==='printer')return [room,[d.brand,d.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')||'Impressora';return [room,d.position_label].filter(Boolean).join(' · ')||names[d.category]||'Computador';}
function equipmentRow(e){
 const d=e.data,computer=['computer','desktop','notebook'].includes(d.category);
 const meta=[computer?names[d.category]||'Computador':d.category==='printer'?'Impressora':(collection.environments.find(r=>r.id===d.environment)?.name||d.environmentName||''),d.operation].filter(Boolean).join(' · ');
 const chips=[computer?`<span class="chip ${e.agent_linked?'linked':d.registration==='Agente'?'pending':'manual'}">${e.agent_linked?'Agente vinculado':d.registration==='Agente'?'Vínculo pendente':'Cadastro manual'}</span>`:'',d.draft?'<span class="badge-draft">Rascunho — falta salvar a ficha</span>':''].join('');
 return `<article class="equipment-card" data-ui-key="equipment:${e.id}"><span class="equipment-icon">${icon(d.category==='notebook'?'laptop':d.category==='printer'?'print':d.category==='other'?'box':'monitor')}</span><div class="equipment-info"><h3>${esc(equipmentTitle(e))}</h3>${meta?`<p>${esc(meta)}</p>`:''}${chips?`<div class="chips">${chips}</div>`:''}</div>${sectionLocked()?button('Ver','edit',`data-id="${e.id}"`,'text-button'):button(d.draft?'Abrir e salvar':'Editar','edit',`data-id="${e.id}"`,'text-button')}</article>`;
}
function inventory(){
 return `<h2 class="sr">${esc(topicName(topic))}</h2><form id="equipment-search" class="equipment-search" role="search"><label class="sr" for="equipment-query">Filtrar esta lista</label><input id="equipment-query" data-field="_query" type="search" enterkeyhint="search" autocomplete="off" placeholder="Marca, modelo ou patrimônio" aria-describedby="equipment-search-help" value="${esc(query)}"><button type="submit" aria-label="Buscar">${icon('search')}</button>${button('×','clear-search',`aria-label="Limpar busca" ${query||appliedQuery?'':'hidden'}`,'clear-search')}</form><div class="inventory-toolbar"><span>${items.length} equipamento(s) ${appliedQuery?'encontrado(s)':'carregado(s)'}${nextCursor?' · há mais':''}</span><details id="equipment-search-help" class="search-help"><summary>O que a busca encontra</summary><p>Patrimônio, série, marca, modelo, categoria e descrição de Outros, nesta unidade. Ambiente, posição, nome do computador, AnyDesk e RustDesk não são pesquisados.</p></details></div>${pendingList(inlinePending,(inlinePending?.length||0)+' pendência(s) antes de concluir este assunto')}${items.map(equipmentRow).join('')}${!items.length?`<div class="empty">${icon(topic==='G'?'print':topic==='O'?'box':'monitor')}<strong>Nenhum equipamento nesta página.</strong><span>${appliedQuery?'Nada corresponde à busca; limpe-a ou confira o termo.':sectionLocked()?'':'Use "+ Adicionar" para registrar o primeiro.'}</span></div>`:''}${nextCursor?button('Mostrar mais · '+items.length+' carregados','next-page','','secondary'):''}${button('Atualizar lista','refresh-list','','text-button')}<p class="help">Registros de visitas anteriores permanecem no inventário; esta lista mostra o que já existe na unidade.</p>`;
}
function fichaState(){
 const d=item.data,parts=[];
 if(!itemVersion)parts.push(['nova','Ficha nova — ainda não enviada ao servidor.']);else if(d.draft)parts.push(['draft','Rascunho recebido no servidor — falta salvar a ficha.']);else if(itemSaved)parts.push(['saved','Ficha salva — recebida pelo servidor.']);
 if(itemVersion&&!itemSaved)parts.push(['dirty','Alterações não enviadas nesta ficha.']);
 if(!['printer','other'].includes(d.category))parts.push([item.agent_linked?'linked':d.registration==='Manual'?'manual':'nolink',item.agent_linked?'Agente vinculado.':d.registration==='Manual'?'Cadastro manual (sem agente).':'Agente ainda não vinculado.']);
 return `<p class="ficha-state" role="status">${parts.map(([k,t])=>`<span data-state="${k}">${esc(t)}</span>`).join('')}</p>`;
}
// Blocos de leitura: só títulos entre grupos de campos; a ordem do catálogo (collector-v3-schema.js) é mantida.
const blockOf={category:'Cadastro',environmentName:'Localização',position_label:'Localização',anydesk:'Acesso remoto',rustdesk:'Acesso remoto',assetStatus:'Patrimônio e origem',computerOrigin:'Patrimônio e origem',brand:'Identificação',model:'Identificação',operation:'Funcionamento',problems:'Funcionamento',origin:'Origem e conexão',acquisition:'Origem e conexão',supplies:'Origem e conexão',connection:'Origem e conexão',ip:'Origem e conexão',customCategory:'Identificação'};
function equipmentForm(){
 const d=item.data,printer=d.category==='printer',other=d.category==='other';let block='';
 const parts=[];
 for(const f of v2EquipmentFields){
  if(f.key==='registration'||f.key==='manualReason')continue;
  if(!shown(f,d,{}))continue;
  const b=blockOf[f.key]||'';if(b&&b!==block){block=b;parts.push(`<h3 class="block">${esc(b)}</h3>`);}
  parts.push(draw(f));
  if(f.key==='category'&&!printer&&!other)parts.push(agentBlock());
  if(printer&&f.key==='environmentName')parts.push(photos('equipment',item.id,'Foto da impressora'));
  if(!printer&&!other&&f.key==='position_label')parts.push(photos('equipment',item.id,'Foto do computador (opcional)',{compact:true}));
 }
 if(other)parts.push(photos('equipment',item.id,'Fotografia (opcional)',{compact:true}));
 return `<h2>${printer?'Impressora':other?'Outro equipamento':'Computador'}</h2>${fichaState()}${errorSummary()}${parts.join('')}<p class="help mono-id">ID permanente ${esc(item.id)}</p>`;
}
function agentBlock(){
 const d=item.data;
 if(item.agent_linked)return `<section class="agent-linked"><strong>${icon('check')} Agente vinculado</strong><p>As informações deste computador chegam à mesma ficha no painel.</p></section>`;
 let content=`<div class="agent-choice" role="group" aria-label="Forma de cadastro"><p class="help">Com o agente instalado, leia o QR exibido na tela do computador. Sem agente, informe o motivo.</p><div class="inline-actions">${button(icon('target')+' Ler QR Code','qr-scan','aria-label="Ler QR Code" aria-pressed="'+(d.registration!=='Manual')+'"',d.registration!=='Manual'?'secondary selected':'secondary')}${button('Cadastrar sem agente','manual','aria-pressed="'+(d.registration==='Manual')+'"',d.registration==='Manual'?'secondary selected':'secondary')}</div></div>`;
 if(d.registration==='Manual')content+=draw(v2EquipmentFields.find(f=>f.key==='manualReason'));
 if(pairing?.preview){const v=pairing.preview.summary||{};content+=`<section class="summary-card agent-preview"><h3 class="block">Computador identificado</h3><dl class="inventory-answers"><dt>Nome</dt><dd>${esc(v.hostname||'Não informado')}</dd><dt>Modelo</dt><dd>${esc([v.manufacturer,v.model].filter(Boolean).join(' · ')||'Não informado')}</dd><dt>Processador</dt><dd>${esc(v.cpu_name||'Não informado')}</dd><dt>Memória</dt><dd>${v.installed_memory_bytes?(v.installed_memory_bytes/1073741824).toFixed(1)+' GB':'Não informada'}</dd><dt>Sistema</dt><dd>${esc(v.os_caption||'Não informado')}</dd></dl><p>Informe o ambiente e a posição abaixo e confirme o vínculo.</p>${pairing.locationChange?`<p class="notice">${icon('pin')}<span>A ficha estava em ${esc(pairing.locationChange.current)}. Confirmar registra a mudança no histórico.</span></p>`:''}<div class="inline-actions">${button(pairing.command?.unknown?'Verificar envio anterior':'Vincular este computador','qr-confirm')}${button('Cancelar leitura','qr-cancel','','text-button')}</div></section>`;}
 return content;
}
function environments(){
 return `${simbolo('B')}<h2>Ambientes da unidade</h2><p class="lead">Os ambientes ficam disponíveis nas fichas dos equipamentos. Cadastrar ambientes não conclui o assunto.</p><form id="environment-form" class="environment-add"><label class="field"><span>Nome do ambiente</span><input name="name" required maxlength="180" placeholder="Ex.: Secretaria" autocomplete="off" enterkeyhint="done"></label><button class="primary" type="submit">Adicionar ambiente</button></form><div class="inventory-toolbar"><span>${collection.environments.length} ambiente(s) cadastrado(s)</span>${button('Atualizar ambientes','refresh-environments','','text-button')}</div>${collection.environments.map(e=>`<article class="environment-row" data-ui-key="environment:${e.id}"><div class="environment-head"><strong>${esc(e.name)}</strong>${collection.inspection.state==='open'?button('Editar nome','rename-environment',`data-id="${e.id}" aria-label="Editar nome de ${esc(e.name)}"`,'text-button'):''}</div>${photos('environment',e.id,'Foto do ambiente (opcional)',{compact:true})}</article>`).join('')||`<div class="empty">${icon('rooms')}<strong>Nenhum ambiente cadastrado.</strong><span>Comece pelos ambientes onde há equipamentos.</span></div>`}`;
}
// Revisão: cada pendência vem do servidor (reviewV3). Aqui só se apresenta: campos como etiquetas legíveis e o botão que
// abre o registro exato. Contagem é de ações, nunca porcentagem.
const pendingActionLabel=p=>p.local?(p.kind==='facade'?'Abrir fachada':p.kind==='equipment'?'Abrir ficha':'Abrir assunto'):p.action==='open-facade'?'Enviar fachada':p.action==='open-section'?'Abrir assunto':p.action==='complete-section'?'Abrir e concluir':p.code==='FOTO_OBRIGATORIA_PENDENTE'?'Enviar foto':p.code==='VINCULO_AGENTE_PENDENTE'?'Abrir ficha e vincular':'Abrir ficha';
function fieldChips(p){
 const keys=Object.keys(p.fields||{});if(!keys.length)return '';
 const labels=keys.map(k=>{if(p.kind==='equipment')return p.fields[k];const parts=k.split('.'),f=(v2Sections[p.section]||[]).find(f=>f.key===parts[0]);if(!f)return k;if(f.type==='rows'&&parts.length>=3){const child=f.children.find(c=>c.key===parts[2]);return `${f.key==='links'?'Link':f.key==='networks'?'Rede':'Registro'} ${Number(parts[1])+1}: ${(child?.label||parts[2]).replace(/\s*\(.*?\)\s*$/,'')}`;}return f.label.replace(/\s*\(.*?\)\s*$/,'');});
 const unique=[...new Set(labels)];
 return `<ul class="chips" aria-label="Campos pendentes">${unique.slice(0,8).map(l=>`<li class="chip">${esc(l)}</li>`).join('')}${unique.length>8?`<li class="chip">+${unique.length-8}</li>`:''}</ul>`;
}
const pendingItem=p=>`<li class="pending-item" data-code="${esc(p.code)}"><div><strong>${esc(p.kind==='section'?(p.code==='ASSUNTO_NAO_CONCLUIDO'?'Marcar como concluído':'Respostas que faltam'):p.label)}</strong>${p.fields&&Object.keys(p.fields).length?fieldChips(p):`<span>${esc(p.message)}</span>`}</div>${button(pendingActionLabel(p),'fix-pending',`data-section="${esc(p.section)}" data-kind="${esc(p.kind)}" data-id="${esc(p.id||'')}" data-target="${esc(p.action)}" data-fields="${esc(JSON.stringify(p.fields||{}))}"`,'secondary')}${p.local&&!p.sending?button('Descartar prévia','drop-local-photo',`data-key="${esc(p.key)}" aria-label="Descartar prévia · ${esc(p.label)}"`,'text-button'):''}</li>`;
function pendingList(list,title){if(!list?.length)return '';const groups=new Map();for(const p of list){const key=p.section==='facade'?'Fachada':topicName(p.section);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}return `<section class="pending" aria-live="polite"><h3 class="block">${esc(title)}</h3>${[...groups].map(([name,items])=>`<h4>${esc(name)}</h4><ul class="pending-list">${items.map(pendingItem).join('')}</ul>`).join('')}</section>`;}
function reviewSummary(){const a=collection.sections.A?.data||{};return `<section class="summary-card"><h3 class="block">Resumo da visita</h3><dl class="inventory-answers"><dt>Acompanhante</dt><dd>${esc([a.name,a.role].filter(Boolean).join(' · ')||'Não informado')}</dd><dt>Ambientes</dt><dd>${collection.environments.length} cadastrado(s)</dd>${topics.map(([g,name])=>`<dt>${esc(name)}</dt><dd>${esc(collection.sections[g]?.state||'Pendente')}</dd>`).join('')}</dl></section>`;}
function review(){
 const pending=reviewData?.pending,local=localPhotoPending(),blocking=[...(pending?pending.filter(p=>p.blocking!==false):[]),...local],errors=Object.keys(reviewData?.errors||{}).length+local.length;
 return `<h2>Confira antes de concluir</h2><p class="lead">Dados já recebidos aparecem no painel como parciais. Concluir encerra a visita para alterações; não declara inventário completo — isso é classificado no painel.</p>${blocking.length?`<p class="pending-count">${blocking.length===1?'Falta 1 pendência':'Faltam '+blocking.length+' pendências'} para concluir esta visita</p>`+pendingList(blocking,'O que ainda falta'):''}${pending?'':Object.entries(reviewData?.errors||{}).map(([g,message])=>`<section class="summary-card"><h3 class="block">${esc(topicName(g)||'Fotografia / revisão')}</h3><p class="field-error">${icon('alert')}<span>${esc(message)}</span></p>${button('Corrigir','fix',`data-error="${esc(g)}"`,'secondary')}</section>`).join('')}${!errors?`<p class="notice success">${icon('check')}<span>Requisitos recebidos e validados pelo servidor. A conclusão é manual: confirme no botão abaixo.</span></p>`:''}${reviewSummary()}${reviewData?.missing?'<p class="help">'+reviewData.missing+' equipamento(s) não localizado(s) no histórico, com justificativa.</p>':''}`;
}
function render(){
 if(!collection?.unit)return;
 let content=screen==='cards'?cards():screen==='facade'?facade():screen==='group'?groupForm():screen==='inventory'?inventory():screen==='equipment'?equipmentForm():screen==='environment'?environments():review();
 let actions='';const open=collection.inspection.state==='open';
 if(!open)actions=button('Voltar à lista de unidades','units','','secondary');
 else if(screen==='cards')actions=button('Revisar visita','review');
 else if(screen==='facade')actions=button('Continuar · acompanhante','companion','',collection.photos.some(p=>p.target_kind==='facade'&&p.status==='ready')?'primary':'secondary');
 else if(screen==='group')actions=button('Salvar rascunho','save','','secondary')+button('Concluir assunto','complete');
 else if(screen==='inventory')actions=button('Concluir assunto','complete-inventory','aria-label="Marcar assunto como concluído"','secondary')+button(icon('plus')+' Adicionar','new',`aria-label="${topic==='G'?'+ Adicionar impressora':topic==='O'?'+ Adicionar outro equipamento':'+ Adicionar computador'}"`);
 else if(screen==='equipment')actions=button(fromReview?'Voltar à revisão':'Voltar à lista','item-previous','','secondary')+button('Salvar equipamento','save-item');
 else if(screen==='environment')actions=button('Concluir ambientes','complete-inventory');
 else if(screen==='review'){const local=localPhotoPending().length,blocked=Object.keys(reviewData?.errors||{}).length+local,count=(reviewData?.pending?reviewData.pending.filter(p=>p.blocking!==false).length:Object.keys(reviewData?.errors||{}).length)+local;actions=(blocked?`<span class="footer-note">${count===1?'A pendência acima impede a conclusão':'As '+count+' pendências acima impedem a conclusão'}</span>`:'')+button('Confirmar conclusão','finish',blocked?'disabled aria-disabled="true"':'');}
 if(sectionLocked()){content=lockedNotice()+(screen==='inventory'?content:`<fieldset class="locked" disabled>${content}</fieldset>`);actions=screen==='equipment'?button('Voltar à lista','item-previous','','secondary'):'<span class="footer-note">Assunto concluído · somente leitura</span>';}
 if(loadingScreen){content=`<div class="collection-loading" role="status" aria-live="polite"><span class="loading-dot" aria-hidden="true"></span><p>Carregando ${esc(topicName(topic).toLowerCase())}…</p><small>Você pode voltar às categorias enquanto aguarda.</small></div>`;actions='';}
 if(screen==='group'&&sectionRecovery.has(collection.inspection.id+':'+topic))content=button('Consultar minhas respostas anteriores','view-section-copy','','secondary')+content;
 const context=contextKey();app.dataset.screen=screen;
 const errorBlock=error?`<div class="notice error" role="alert">${icon('alert')}<div><span>${esc(error)}</span>${errorSession?'<div class="session-actions">'+(mobileHost()?'':'<a href="/login" target="_blank" rel="noopener" class="text-button">Entrar novamente em outra aba</a>')+button('Já entrei · retomar','recover-session','','secondary')+'</div>':''}${!errorSession&&screen==='group'&&drafts.failed()?'<div class="session-actions">'+(drafts.failed().error?.conflict?button('Comparar e recuperar assunto','resolve-section-conflict','','secondary'):button('Tentar enviar de novo','save','','secondary'))+'</div>':''}</div></div>`:'';
 updateScreen(app,header()+`<main class="content" ${loadingScreen?'aria-busy="true"':''}>${errorBlock}${content}</main>`+footer(actions),renderedContext===context);
 renderedContext=context;ux.sync();
}
const lockedNotice=()=>sectionLocked()?`<div class="notice locked" role="status">${icon('check')}<div><strong>${esc(topicName(topic))} concluído.</strong> Para alterar, reabra o assunto; depois será preciso concluí-lo de novo.</div>${button('Reabrir assunto','reopen','','secondary')}</div>`:'';
function repaint({scroll='auto'}={}){const changed=renderedContext!==contextKey();if(changed)hopStatus();render();history.replaceState(null,'',route());if(typeof scroll==='number')scrollTo(0,scroll);else if(scroll==='top'||changed)scrollTo(0,0);}

// ---------------------------------------------------------------------------------------------------------------------
// Rascunhos por assunto (A/C/D/H): fila da aba, payload congelado, reconciliação em resposta perdida
// ---------------------------------------------------------------------------------------------------------------------
const drafts=createDraftQueue({send:p=>api('/api/collector/section-save',p),reconcile:async(i,g)=>(await api('/api/collector/inspection?id='+i)).sections[g],onState:()=>{status=drafts.failed()?'Há alterações não enviadas':'Rascunho no servidor';paintStatus();}});
async function save(){clearTimeout(timer);if(dirty&&['group','facade','inventory'].includes(screen)){const row=collection.sections[topic];drafts.set(collection.inspection.id,topic,row.version,answers);row.data=structuredClone(answers);dirty=false;}await drafts.flushAll();for(const [g,row]of Object.entries(collection.sections)){const d=drafts.get(collection.inspection.id,g);if(d){row.version=d.version;row.state=d.state||row.state;}}}
function readableSectionAnswers(g,data){
 const describe=(defs,row)=>defs.filter(f=>row[f.key]!==undefined&&row[f.key]!==null&&row[f.key]!=='').map(f=>f.label+': '+(f.children&&Array.isArray(row[f.key])?'\n'+row[f.key].map((r,n)=>'Item '+(n+1)+'\n'+describe(f.children,r)).join('\n'):Array.isArray(row[f.key])?row[f.key].join(', '):String(row[f.key]))).join('\n');
 return describe(v2Sections[g]||[],data)||'Nenhuma resposta preenchida.';
}
async function resolveSectionConflict(){
 clearTimeout(timer);const entry=drafts.failed();if(!entry?.error?.conflict)return;
 const fresh=(await api('/api/collector/inspection?id='+entry.i)).sections[entry.g];
 if(!fresh)throw Error('Assunto não encontrado. Suas respostas continuam nesta aba.');
 const local=structuredClone(entry.local);
 if(!await confirmCollection('Outra sessão gravou este assunto. Compare as respostas abaixo. Recarregar usa a versão do servidor; a cópia do seu texto continua disponível nesta aba para consulta, sem envio automático.',{title:'Comparar '+topicName(entry.g),confirmLabel:'Recarregar do servidor',cancelLabel:'Manter minhas respostas',comparison:{'Minhas respostas não enviadas':readableSectionAnswers(entry.g,local),'Respostas atuais do servidor':readableSectionAnswers(entry.g,fresh.data)}}))return;
 entry.recoveryCopy=local;sectionRecovery.set(entry.i+':'+entry.g,local);
 drafts.adopt(entry.i,entry.g,fresh);collection.sections[entry.g]=fresh;
 if(screen==='group'&&topic===entry.g){answers=structuredClone(fresh.data);dirty=false;}
 error='';fields={};status='Assunto recuperado. Confira antes de editar ou concluir.';
}
const sectionRecovery=new Map();
function saveSoon(){save().then(()=>{if(error&&!errorSession&&!drafts.failed()){error='';render();}}).catch(e=>{error=e.message;errorSession=!!e.session;status='Há alterações não enviadas';if(e.session||renderedContext===contextKey())render();else paintStatus();});}

// ---------------------------------------------------------------------------------------------------------------------
// Navegação entre telas
// ---------------------------------------------------------------------------------------------------------------------
async function leave(){if(screen==='equipment'&&item){item.resumeStep=0;item.resumeTopic=topic;}saveSoon();if(lock){const token=lock,id=item?.id;lock=null;lockAt=0;if(id)api('/api/collector/equipment-unlock',{id,token}).catch(()=>{});}fields={};error='';errorSession=false;}
async function open(g){
 if(collection.inspection.state!=='open')throw Error('Visita concluída. Inicie outra visita para atualizar.');
 await leave();fromReview=false;inlinePending=null;topic=g;answers=structuredClone(collection.sections[g].data);
 if(collection.sections[g].state==='Concluído'){
  if(!await confirmCollection('Reabrir '+topicName(g)+'? Depois será preciso marcá-lo como concluído de novo.')){screen='cards';repaint();return;}
  await save();await api(['B','F','G','O'].includes(g)?'/api/collector/inventory-section':'/api/collector/section-save',{inspectionId:collection.inspection.id,section:g,version:collection.sections[g].version,answers,reopen:true});drafts.forget(collection.inspection.id,g);await load();
 }
 step=0;screen=g==='B'?'environment':['F','G','O'].includes(g)?'inventory':'group';
 const serial=actionSerial,valid=()=>serial===actionSerial;
 if(screen==='inventory'||g==='B'||g==='H'){
  if(screen==='inventory'){cursor=null;filter='';query='';appliedQuery='';inventoryScroll=0;items=[];nextCursor=null;}
  loadingScreen={serial};repaint();
  try{if(screen==='inventory')await loadItems({valid});else if(g==='B')await loadEnvironments(valid);else await loadSummaryItems(valid);}
  catch(e){if(valid())throw e;}
  finally{if(valid())loadingScreen=null;}
  if(!valid())return;
 }
 repaint();
}
async function openFacade(){await leave();topic='A';answers=structuredClone(collection.sections.A.data);screen='facade';}
async function resumeEquipment(){
 if(itemVersion){const r=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:item.id});if(r.equipment.version!==itemVersion){api('/api/collector/equipment-unlock',{id:item.id,token:r.token}).catch(()=>{});lock=null;throw Object.assign(Error('Outra sessão alterou este equipamento. Suas respostas continuam nesta tela.'),{conflict:true,server:r.equipment.data});}lock=r.token;lockAt=Date.now();}
 topic=item.resumeTopic||(item.data.category==='printer'?'G':item.data.category==='other'?'O':'F');screen='equipment';
}
async function openEquipment(id,section){
 if(collection.inspection.state!=='open')throw Error('Visita concluída. Inicie outra visita para atualizar.');
 if(item?.id===id&&!itemSaved){await resumeEquipment();return true;}
 if(item&&item.id!==id&&(uploads.has('equipment:'+item.id)||preparing.has('equipment:'+item.id)))await settleUploads('equipment:'+item.id,undefined,{strict:false});
 if(item&&item.id!==id&&!itemSaved&&!await confirmCollection('A ficha em preenchimento tem alterações que ainda não foram enviadas. Abrir outra descarta essas alterações.',{title:'Descartar alterações?',confirmLabel:'Descartar e abrir'}))return false;
 await leave();
 if(section&&section!==topic){topic=section;answers=structuredClone(collection.sections[topic]?.data||{});}
 if(!collection.environments?.length)await loadEnvironments();
 const r=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id});
 item=r.equipment;itemVersion=item.version;lock=r.token;lockAt=Date.now();itemSaved=true;
 item.data={mode:'Individual',quantity:1,registration:'Manual',assetStatus:item.data.asset?'Possui patrimônio':'Não identificado',...item.data};
 item.data.environmentName=collection.environments.find(e=>e.id===item.data.environment)?.name||item.data.environmentName||'';
 if(item.data.assetStatus==='Informar número')item.data.assetStatus='Possui patrimônio';
 pairing=null;screen='equipment';step=0;return true;
}
async function loadEnvironments(valid=()=>true){const r=await api('/api/collector/environments?inspectionId='+collection.inspection.id);if(valid())collection.environments=r.environments;return r.environments;}
async function selectEnvironment(){
 const target=item;
 const room=await chooseEnvironment({selected:target.data.environment,load:loadEnvironments,create:async name=>{const r=await api('/api/collector/environment-save',{inspectionId:collection.inspection.id,name,type:''});if(!collection.environments.some(e=>e.id===r.environment.id))collection.environments.push(r.environment);return r.environment;}});
 if(room&&item===target){item.data.environment=room.id;item.data.environmentName=room.name;itemSaved=false;delete fields.environmentName;delete fields.environment;}
}
const inventoryKey=()=>collection.inspection.id+':'+topic+':'+appliedQuery+':'+filter;
function rememberInventory(){inventorySnapshot={key:inventoryKey(),items:structuredClone(items),nextCursor,cursor};}
async function loadItems({append=false,restore=false,valid=()=>true}={}){
 if(restore&&inventorySnapshot?.key===inventoryKey()){items=structuredClone(inventorySnapshot.items);nextCursor=inventorySnapshot.nextCursor;cursor=inventorySnapshot.cursor;return;}
 const r=await api('/api/collector/equipment-list?'+new URLSearchParams({unitId:collection.unit.id,inspectionId:collection.inspection.id,category:topic==='G'?'printer':topic==='O'?'other':filter||'computers',q:appliedQuery,cursor:append?nextCursor||'':''}));
 if(!valid())return;
 items=append?[...new Map([...items,...r.items].map(e=>[e.id,e])).values()]:r.items;nextCursor=r.nextCursor;rememberInventory();
}
function updateSavedInventory(){
 if(inventorySnapshot?.key!==inventoryKey())return;
 const entry={...structuredClone(item),version:itemVersion,position_label:item.data.position_label};
 const list=inventorySnapshot.items,index=list.findIndex(e=>e.id===item.id);
 if(index>=0)list[index]=entry;else if(!appliedQuery)list.unshift(entry);
}
async function loadSummaryItems(valid=()=>true){const r=await api('/api/collector/v2-problems?inspectionId='+collection.inspection.id);if(!valid())return;items=r.equipment;if(r.hasMore)status='Resumo dos primeiros 100 equipamentos com problemas';}
// Concluir um assunto com foto selecionada e não recebida numa ficha/ambiente/ocorrência DESSE assunto: recusa com o alvo.
function settleTopicPhotos(){
 const mine=localPhotoPending().filter(p=>p.section===topic);if(!mine.length)return;
 throw Object.assign(Error((mine.length===1?'Há uma foto selecionada e não recebida em ':'Há fotos selecionadas e não recebidas em ')+mine.map(p=>p.label).join('; ')+'. Reenvie ou descarte a prévia antes de concluir o assunto.'),{localPhotos:mine.map(p=>p.key)});
}
async function newItem(){
 // Primeiro a foto em curso da ficha atual termina (ela cria o rascunho dessa ficha no servidor, que então deixa de ser
 // "não enviada"); só depois se pergunta sobre descartar o que ainda estiver sem envio.
 if(item&&(uploads.has('equipment:'+item.id)||preparing.has('equipment:'+item.id)))await settleUploads('equipment:'+item.id,undefined,{strict:false});
 if(item&&!itemSaved&&!await confirmCollection('A ficha em preenchimento tem alterações que ainda não foram enviadas. Criar outra descarta essas alterações.',{title:'Descartar alterações?',confirmLabel:'Descartar e criar nova'}))return;
 item={id:crypto.randomUUID(),version:0,data:{category:topic==='G'?'printer':topic==='O'?'other':'computer',mode:'Individual',quantity:1,...(topic==='G'||topic==='O'?{}:{registration:'Agente'})}};
 itemVersion=0;itemSaved=false;pairing=null;step=0;lock=null;lockAt=0;screen='equipment';repaint();
}

// ---------------------------------------------------------------------------------------------------------------------
// Ficha de equipamento: salvar, rascunho mínimo, trava, resposta perdida e conflito
// ---------------------------------------------------------------------------------------------------------------------
async function relock(target){
 const l=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:target.id,token:lock||''});
 lock=l.token;lockAt=Date.now();
 if(l.equipment.version!==itemVersion)throw Object.assign(Error('Outra sessão alterou esta ficha enquanto você editava.'),{conflict:true,server:l.equipment.data,fresh:l});
 return l;
}
// Rascunho mínimo da ficha ALVO (pode não ser a ficha aberta: foto selecionada e navegação em seguida, R2). Só a ficha
// aberta mexe nos globais de versão/trava; a trava só é obtida se a edição dela está na tela.
async function saveDraft(target=item){
 const own=item===target,submitted=structuredClone(target.data);
 const body=target.pendingDraft||{inspectionId:collection.inspection.id,id:target.id,version:own?itemVersion:target.version||0,lockToken:own?lock:null,environmentId:submitted.environment||'',draft:true,data:{...submitted,registration:submitted.category==='printer'||submitted.category==='other'?'Manual':submitted.registration}};
 target.pendingDraft=body;
 let r;try{r=await api('/api/collector/equipment-save',body);}catch(e){if(e.unknown||e.httpStatus===409)r=await reconcileDraft(target,body);else{delete target.pendingDraft;throw e;}}
 delete target.pendingDraft;
 const unchanged=sameAsServer(target.data,{...body.data,draft:false});
 target.version=r.version;target.data.draft=true;
 if(r.environment&&target.data.environmentName===body.data.environmentName){target.data.environment=r.environment.id;target.data.environmentName=r.environment.name;}
 if(!own)return;
 itemVersion=r.version;itemSaved=unchanged;status='Rascunho da ficha recebido no servidor';
 if(!lock&&screen==='equipment'){const l=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:target.id});lock=l.token;lockAt=Date.now();}
}
async function reconcileDraft(target,body){
 const l=await api('/api/collector/equipment-lock',{inspectionId:body.inspectionId,id:target.id});
 const fresh=l.equipment,same=fresh.version===body.version+1&&fresh.updated_by===me.id&&fresh.data?.draft===true&&sameAsServer(body.data,{...fresh.data,draft:false});
 if(item===target){lock=l.token;lockAt=Date.now();}
 if(!same){if(item!==target)await api('/api/collector/equipment-unlock',{id:target.id,token:l.token}).catch(()=>{});throw Object.assign(Error('A ficha foi alterada durante o envio da foto. Suas respostas e a prévia continuam nesta tela.'),{conflict:true,server:fresh.data,fresh:l});}
 if(item!==target)await api('/api/collector/equipment-unlock',{id:target.id,token:l.token}).catch(()=>{});
 return {version:fresh.version,environment:{id:fresh.environment_id,name:fresh.data.environmentName},reconciled:true};
}
// R1 (revisão independente 14/11): versão+1 e autor identificam UMA gravação desta conta, não ESTA operação — outra aba/aparelho
// da mesma conta pode ter gravado outro conteúdo. Só é confirmação quando todos os campos graváveis do corpo congelado coincidem
// com a representação canônica que o servidor devolveu; o que não se comprova vira conflito com as respostas locais preservadas.
const canon=v=>v==null?'':typeof v==='object'?JSON.stringify(v):String(v).trim();
function savedKeys(d){return ['category','mode','quantity',...(d.category==='other'?[]:['environment']),...v2EquipmentFields.filter(f=>f.key!=='environmentName'&&(!f.when||f.when(d))).map(f=>f.key)];}
function sameAsServer(payload,stored){
 if(!stored||typeof stored!=='object')return false;
 // R1-F: um rascunho (draft:true) com as mesmas respostas NÃO é o salvamento completo que esta tela enviou.
 if(stored.draft)return false;
 const expected={...payload,quantity:payload.mode==='Individual'?1:Number(payload.quantity)};
 return savedKeys(payload).every(k=>canon(expected[k])===canon(stored[k]));
}
// Resposta perdida: antes de reenviar, pergunta ao servidor (a trava devolve a ficha atual). Se a versão não avançou, reenvia o
// MESMO corpo; se avançou uma vez, por este usuário, com o MESMO conteúdo, a gravação aconteceu; qualquer outra coisa é conflito.
async function reconcileSave(target,body){
 let l;try{l=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:target.id,token:lock||''});}
 catch(e){if(e.httpStatus===403&&!body.version)return api('/api/collector/equipment-save',{...body,lockToken:lock});throw e;}
 lock=l.token;lockAt=Date.now();const fresh=l.equipment;
 if(fresh.version===body.version)return api('/api/collector/equipment-save',{...body,lockToken:lock});
 const sameAccount=fresh.version===body.version+1&&fresh.updated_by===me.id;
 if(sameAccount&&sameAsServer(body.data,fresh.data))return {version:fresh.version,environment:{id:fresh.environment_id||body.data.environment,name:fresh.data?.environmentName||body.data.environmentName},reconciled:true};
 throw Object.assign(Error(sameAccount?(fresh.data?.draft?'Outra sessão da sua conta gravou esta ficha como rascunho enquanto o envio estava sem resposta; a ficha ainda não está salva.':'Outra sessão da sua conta gravou esta ficha com respostas diferentes enquanto o envio estava sem resposta.'):'Outra sessão alterou esta ficha enquanto o envio estava sem resposta.'),{conflict:true,server:fresh.data,fresh:l});
}
async function resolveConflict(target,e){
 // Contrato existente (servidor: "Recarregue para comparar antes de salvar"): não há sobrescrita; gravar exige recarregar.
 const keep=!await confirmCollection((e.message||'Outra sessão alterou esta ficha.')+' Suas respostas continuam nesta tela. Recarregar traz os dados do servidor para cá e descarta o que você digitou; Manter deixa tudo como está para você comparar e copiar — para gravar, recarregue antes.',{title:'Ficha alterada em outra sessão',confirmLabel:'Recarregar do servidor',cancelLabel:'Manter minhas respostas'});
 if(item!==target)return;
 if(keep){status='Ficha não salva · conflito com outra sessão; recarregue antes de salvar';return;}
 await reloadFromServer();status='Ficha recarregada do servidor; confira e salve de novo se precisar';
}
async function saveItem({keepEditing=true}={}){
 if(item.pendingDraft)await saveDraft(item);
 const target=item,payload=structuredClone(target.data);delete payload.draft;
 const submitted=JSON.stringify(payload);
 const body={inspectionId:collection.inspection.id,id:target.id,version:itemVersion,lockToken:lock,environmentId:payload.environment||'',data:payload};
 let r;
 try{
  if(itemVersion&&lock&&Date.now()-lockAt>LOCK_FRESH)await relock(target);
  try{r=await api('/api/collector/equipment-save',{...body,lockToken:lock});}
  catch(e){
   if(e.unknown)r=await reconcileSave(target,body);
   // 409 de trava: numa ficha já existente a trava expirou (renovar e repetir); numa ficha nova significa que o primeiro
   // envio chegou mas a resposta se perdeu (o navegador pode reenviar o POST sozinho): reconciliar antes de qualquer reenvio.
   else if(e.httpStatus===409&&/edição exclusiva/i.test(e.message)){if(itemVersion){await relock(target);r=await api('/api/collector/equipment-save',{...body,lockToken:lock});}else r=await reconcileSave(target,body);}
   // 409 de versão logo após a gravação: o navegador pode reenviar sozinho um POST cuja resposta se perdeu. Se o servidor guarda
   // exatamente este conteúdo, uma versão acima, gravado por este usuário, a operação aconteceu; qualquer diferença é conflito.
   else if(e.httpStatus===409&&e.conflict&&e.server&&e.server.version===body.version+1&&e.server.updated_by===me.id&&sameAsServer(payload,JSON.parse(e.server.data_json||'{}')))r={version:e.server.version,environment:{id:e.server.environment_id||payload.environment,name:payload.environmentName},reconciled:true};
   else throw e;
  }
 }catch(e){if(e.conflict&&item===target){await resolveConflict(target,e);return false;}throw e;}
 const local={...target.data};delete local.draft;const unchanged=JSON.stringify(local)===submitted;
 itemVersion=r.version;target.version=r.version;
 if(r.environment&&target.data.environment===payload.environment){target.data.environment=r.environment.id;target.data.environmentName=r.environment.name||target.data.environmentName;}
 delete target.data.draft;itemSaved=unchanged;status=unchanged?(r.reconciled?'Equipamento recebido · confirmado após a falha de rede':'Equipamento recebido no servidor'):'Há novas alterações nesta ficha; salve novamente.';
 // A trava só é necessária se a edição continua (vínculo/posição em seguida); ao sair da ficha ela seria liberada logo depois.
 if(!lock&&keepEditing){const l=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:target.id});lock=l.token;lockAt=Date.now();}
 if(unchanged)updateSavedInventory();
 // O assunto F/G/O sai de Pendente no servidor ao gravar a primeira ficha; refletir sem reler a visita inteira.
 const row=collection.sections[topic];if(row&&row.state==='Pendente')row.state='Em andamento';
 return unchanged;
}
async function reloadFromServer(){const l=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:item.id,token:lock||''});const fresh=l.equipment;item={...item,...fresh,data:{mode:'Individual',quantity:1,...fresh.data}};item.data.environmentName=collection.environments.find(e=>e.id===item.data.environment)?.name||item.data.environmentName||'';itemVersion=fresh.version;lock=l.token;lockAt=Date.now();itemSaved=true;pairing=null;}
function refreshFichaState(){const el=app.querySelector('.ficha-state');if(el&&item&&screen==='equipment')el.outerHTML=fichaState();paintStatus();}

// ---------------------------------------------------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------------------------------------------------
async function recoverSession(){
 const authenticated=await api('/api/auth/me');
 if(authenticated.username!==me.username)throw Object.assign(Error('Entre com o mesmo usuário desta coleta ('+me.username+'). As respostas permanecem nesta tela.'),{session:true});
 if(!['root','admin','operador'].includes(authenticated.role))throw Error('Perfil sem permissão de coleta.');
 me=authenticated;
 if(itemVersion&&item&&screen==='equipment'){
  const r=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:item.id});
  if(r.equipment.version!==itemVersion){api('/api/collector/equipment-unlock',{id:item.id,token:r.token}).catch(()=>{});lock=null;throw Object.assign(Error('Outra sessão alterou esta ficha. Suas respostas continuam nesta tela; confira o conflito antes de salvar.'),{conflict:true,server:r.equipment.data});}
  lock=r.token;lockAt=Date.now();
 }
 errorSession=false;error='';status='Sessão recuperada. Confira as respostas e toque em Salvar.';
}
function showError(e){
 if(e.session)sessionExpired();
 const n=Object.keys(e.fields||{}).length;
 status=e.session?'Alterações não enviadas':e.unknown?'Resultado desconhecido · nada foi apagado':n?(n===1?'Não salvo: 1 campo precisa de atenção':'Não salvo: '+n+' campos precisam de atenção'):'Operação não confirmada';
 error=e.message||'Não foi possível concluir a operação. Suas respostas continuam nesta tela.';errorSession=!!e.session;fields=e.fields||{};
 if(Array.isArray(e.pending)&&screen==='inventory')inlinePending=e.pending;
 render();ux.focusError();
}

// ---------------------------------------------------------------------------------------------------------------------
// QR / agente
// ---------------------------------------------------------------------------------------------------------------------
const qrMessages={PAIRING_EXPIRED:'Este QR venceu. Gere um novo QR na tela do computador e leia de novo.',PAIRING_CONSUMED:'Este QR já foi usado. Gere um novo QR na máquina.',PAIRING_LOCKED:'Tentativas excedidas para este QR. Gere um novo QR na máquina.',ENROLLMENT_NOT_FOUND:'Este QR não corresponde a um pedido de pareamento. Gere um novo na máquina.',PAIRING_CODE_INVALID:'Código do QR inválido. Gere um novo QR na máquina.',DEVICE_REVOKED:'Este agente foi revogado pelo root. Reinstale ou autorize novamente antes de vincular.'};
async function scanAgentQr(){
 item.data.registration='Agente';
 const text=await scanPairingQr();if(!text)return;
 const qr=parsePairingQr(text);
 if(qr.expires_at&&Date.parse(qr.expires_at)<=Date.now())throw Error(qrMessages.PAIRING_EXPIRED);
 let preview;try{preview=await api('/api/agent/v1/pairings/preview',{enrollment_id:qr.enrollment_id,pairing_code:qr.pairing_code,unit_id:collection.unit.id});}
 catch(e){if(qrMessages[e.code])throw Error(qrMessages[e.code]);throw e;}
 const suggested=(preview.equipment_suggestions||[]).find(x=>x.equipment_id===item.id);
 pairing={qr,preview,requestId:crypto.randomUUID(),positionLabel:item.data.position_label||item.position_label||'',positionDescription:item.position_description||'',confirmed:false,locationChange:null,reason:'',alreadyLinked:!!suggested?.already_linked};
 if(pairing.alreadyLinked){pairing=null;throw Error('Esta ficha já possui um agente ativo. Use reconciliação administrativa (root) antes de vincular outro.');}
 status='QR lido neste aparelho; vínculo ainda não confirmado';
}
const UNKNOWN_MSG='Sem resposta do servidor: o resultado é desconhecido. Toque de novo em "Verificar envio anterior" — o mesmo comando será conferido e repetido, sem duplicar nada.';
function resolveCommand(kind){if(!pairing)return;pairing[kind]=null;if(kind==='command')pairing.requestId=crypto.randomUUID();}
async function lookupReceipt(statusPath,requestId){try{return await api(statusPath+'?request_id='+encodeURIComponent(requestId));}catch(e){if(e.unknown)throw Error(UNKNOWN_MSG);throw e;}}
async function sendCommand(kind,path,statusPath){
 const cmd=pairing[kind];if(!cmd)throw Error('Nenhum comando pendente.');
 if(cmd.unknown){const receipt=await lookupReceipt(statusPath,cmd.body.request_id);if(receipt.found){cmd.unknown=false;return receipt.body;}}
 try{const r=await api(path,cmd.body);cmd.unknown=false;return r;}
 catch(e){
  if(e.unknown){cmd.unknown=true;status='Resultado desconhecido: confirme de novo para verificar';throw Error(UNKNOWN_MSG);}
  if(e.code==='REQUEST_ID_CONFLICT'){cmd.unknown=true;const receipt=await lookupReceipt(statusPath,cmd.body.request_id);if(receipt.found){cmd.unknown=false;return receipt.body;}throw Error(UNKNOWN_MSG);}
  if(e.code==='LOCK_REQUIRED'){const l=await api('/api/collector/equipment-lock',{inspectionId:collection.inspection.id,id:item.id,token:lock});lock=l.token;lockAt=Date.now();cmd.body={...cmd.body,lock_token:lock};try{const r=await api(path,cmd.body);cmd.unknown=false;return r;}catch(e2){if(e2.unknown){cmd.unknown=true;throw Error(UNKNOWN_MSG);}throw e2;}}
  throw e;
 }
}
function applyClaim(r,label){item.agent_linked=true;item.agent_link={link_id:r.link_id,linked_at:r.linked_at};item.position_label=r.position?.label||label;item.data.position_label=item.position_label;item.location_state=r.location_state;item.data.registration='Agente';itemVersion=r.equipment_version;pairing=null;status=r.duplicate?'Computador vinculado · confirmado pelo servidor (recibo do comando anterior)':'Computador vinculado · confirmado pelo servidor';}
async function confirmPosition(){
 pairing??={};
 if(!pairing.positionCommand){
  const label=String(item.data.position_label||'').trim();if(!label)throw Object.assign(Error('Informe a posição no ambiente.'),{fields:{position_label:'Informe a posição (ex.: Bancada 2 / PC 7).'}});if(!item.data.environment)throw Object.assign(Error('Selecione o ambiente da ficha.'),{fields:{environmentName:'Selecione o ambiente.'}});if(!itemSaved)await saveItem();
  pairing.positionCommand={unknown:false,label,body:{request_id:crypto.randomUUID(),equipment_id:item.id,expected_version:itemVersion,environment_id:item.data.environment,position:{label,description:String(pairing.positionDescription||'').trim()||undefined},reason:'Posição confirmada na visita pelo coletor',inspection_id:collection.inspection.id,lock_token:lock||''}};
 }
 const label=pairing.positionCommand.label;
 try{const r=await sendCommand('positionCommand','/api/inventory/equipment-location','/api/inventory/equipment-location-status');item.position_label=label;item.location_state=r.location?.location_state||'confirmada_em_visita';itemVersion=r.equipment_version;pairing=null;status='Posição confirmada · registrada pelo servidor';}
 catch(e){
  if(e.message===UNKNOWN_MSG)throw e;
  resolveCommand('positionCommand');
  if(e.code==='EQUIPMENT_VERSION_CONFLICT'){await reloadFromServer();throw Error('A ficha foi alterada em outra sessão. Dados do servidor recarregados; confira a posição e confirme novamente.');}
  if(e.code==='EQUIPMENT_LOCKED')throw Error('Outro usuário está editando esta ficha. Aguarde a liberação.');
  if(e.code==='SECTION_COMPLETED')throw Error('O assunto Computadores desta visita está concluído. Volte às categorias e reabra Computadores antes de mover a ficha.');
  throw e;}
}
async function confirmAgentLink(){
 if(!pairing?.preview)throw Error('Leia o QR do agente primeiro.');
 if(!pairing.command){
  if(!item.data.environment)throw Object.assign(Error('Selecione o ambiente da ficha antes de vincular.'),{fields:{environmentName:'Selecione o ambiente.'}});
  const label=String(item.data.position_label||'').trim();if(!label)throw Object.assign(Error('Informe a posição no ambiente antes de vincular.'),{fields:{position_label:'Informe a posição (ex.: Bancada 2 / PC 7).'}});
  if(!itemVersion||item.data.draft===true)await saveDraft();else if(!itemSaved)await saveItem();
  const body={request_id:pairing.requestId,enrollment_id:pairing.qr.enrollment_id,pairing_code:pairing.qr.pairing_code,unit_id:collection.unit.id,environment_id:item.data.environment,inspection_id:collection.inspection.id,equipment:{mode:'existing',equipment_id:item.id,expected_version:itemVersion},position:{label,description:String(pairing.positionDescription||'').trim()||undefined},lock_token:lock||''};
  pairing.command={unknown:false,label,body};
 }
 const label=pairing.command.label;
 try{const r=await sendCommand('command','/api/agent/v1/pairings/claim','/api/agent/v1/pairings/claim-status');applyClaim(r,label);await load();}
 catch(e){
  if(e.message===UNKNOWN_MSG)throw e;
  resolveCommand('command');
  if(e.code==='LOCATION_MISMATCH'){const cur=e.details?.current_location;pairing.locationChange={current:[cur?.environment_name,cur?.position_label].filter(Boolean).join(' · ')||'localização anterior'};throw Error('A ficha estava registrada em outro ambiente/posição. Confira e confirme novamente para registrar a mudança.');}
  if(e.code==='EQUIPMENT_VERSION_CONFLICT'){await reloadFromServer();throw Error('A ficha foi alterada em outra sessão. Os dados do servidor foram recarregados e substituíram as respostas não salvas desta aba; confira e confirme novamente.');}
  if(e.code==='EQUIPMENT_LOCKED')throw Error('Outro usuário está editando esta ficha. Aguarde a liberação e tente de novo.');
  if(e.code==='SECTION_COMPLETED')throw Error('O assunto Computadores desta visita está concluído. Volte às categorias e reabra Computadores (confirmação explícita) antes de vincular.');
  if(qrMessages[e.code]){pairing=null;throw Error(qrMessages[e.code]);}
  throw e;
 }
}

// ---------------------------------------------------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------------------------------------------------
app.addEventListener('input',e=>{
 if(renderedContext!==contextKey()||!app.contains(e.target)||sectionLocked())return;if(!e.target.dataset.field)return;
 const key=e.target.dataset.field;
 if(key==='_query'){query=e.target.value;const clear=app.querySelector('.clear-search');if(clear)clear.hidden=!(query||appliedQuery);return;}
 if(key.startsWith('_pairing.')){pairing??={};pairing[key.slice(9)]=e.target.value;return;}
 write(key,e.target.value);
 if(fields[key]){delete fields[key];}
 if(screen==='equipment'){itemSaved=false;if(!inFlight())status='Rascunho no servidor';refreshFichaState();}
 else{dirty=true;if(!inFlight())status='Rascunho no servidor';paintStatus();clearTimeout(timer);timer=setTimeout(saveSoon,600);}
});
app.addEventListener('change',e=>{
 if(renderedContext!==contextKey()||!app.contains(e.target)||sectionLocked())return;
 if(e.target.dataset.field==='_query'){query=e.target.value;return;}
 if(e.target.dataset.field?.startsWith('_pairing.')){pairing??={};pairing[e.target.dataset.field.slice(9)]=e.target.type==='checkbox'?e.target.checked:e.target.value;return;}
 if(e.target.dataset.field){const key=e.target.dataset.field;write(key,e.target.value);delete fields[key];if(screen==='equipment')itemSaved=false;else{dirty=true;clearTimeout(timer);timer=setTimeout(saveSoon,600);}if(e.target.tagName==='SELECT'||/\.(provider|ssid)$/.test(key))render();else if(screen==='equipment')refreshFichaState();}
 if(e.target.id==='category-filter'){filter=e.target.value;cursor=null;loadItems().then(render).catch(showError);}
 if(e.target.dataset.photo){const input=e.target;preparePhotos(input).catch(showError).finally(()=>{input.value='';});}
});
async function searchInventory(){if(busy||screen!=='inventory')return;busy=true;const input=app.querySelector('[data-field="_query"]');query=input.value;appliedQuery=query.trim();cursor=null;input.blur();try{await loadItems();repaint();}catch(e){showError(e);}finally{busy=false;}}
app.addEventListener('search',e=>{if(e.target.dataset.field==='_query'&&!e.target.value)searchInventory();});
app.addEventListener('submit',async e=>{
 if(e.target.id==='equipment-search'){e.preventDefault();await searchInventory();return;}
 if(e.target.id!=='environment-form')return;e.preventDefault();if(busy)return;busy=true;
 const submit=e.target.querySelector('button[type=submit]');if(submit){submit.disabled=true;submit.textContent='Cadastrando…';}
 try{const form=new FormData(e.target),payload={inspectionId:collection.inspection.id,name:form.get('name'),type:''};let r;
  try{r=await api('/api/collector/environment-save',payload);}
  catch(err){if(!Array.isArray(err.similar)||!err.similar.length)throw err;if(!await confirmCollection('Já existe ambiente com nome parecido nesta unidade:\n• '+err.similar.map(x=>x.name).join('\n• ')+'\n\nCadastrar mesmo assim como um ambiente diferente?',{title:'Nome parecido',confirmLabel:'Cadastrar mesmo assim'}))throw Error('Cadastro cancelado. Selecione o ambiente existente ou ajuste o nome.');r=await api('/api/collector/environment-save',{...payload,confirmSimilar:true});}
  await load();status=r.existing?'Ambiente existente reutilizado':'Ambiente cadastrado no servidor';render();
 }catch(err){showError(err);}finally{busy=false;const b=app.querySelector('#environment-form button[type=submit]');if(b){b.disabled=false;b.textContent='Adicionar ambiente';}}
});
const busyLabel={save:'Salvando…','save-item':'Salvando…',complete:'Concluindo…','complete-inventory':'Concluindo…',finish:'Concluindo…',review:'Conferindo…','qr-confirm':'Vinculando…','position-confirm':'Confirmando…',new:'Abrindo…',edit:'Abrindo…',resume:'Abrindo…','next-page':'Carregando…','refresh-list':'Atualizando…','refresh-environments':'Atualizando…',upload:'Enviando…'};
app.addEventListener('click',async e=>{
 const t=e.target.closest('[data-action]');if(!t||t.dataset.action==='close-keyboard')return;
 const a=t.dataset.action;
 if(busy){if(a==='cards'&&loadingScreen){actionSerial++;loadingScreen=null;busy=false;screen='cards';fromReview=false;inlinePending=null;repaint();}return;}
 if(a==='focus-field'){const el=app.querySelector(`[data-field="${CSS.escape(t.dataset.path)}"]`);if(el){el.focus({preventScroll:true});ux.ensureVisible(el);}return;}
 const serial=++actionSerial;busy=true;t.disabled=true;const originalLabel=t.innerHTML;if(busyLabel[a]&&!t.classList.contains('text-button'))t.textContent=busyLabel[a];
 let restoreScroll;if(screen==='inventory'&&['edit','new'].includes(a)){inventoryScroll=scrollY;rememberInventory();}
 error='';errorSession=false;if(!['focus-field'].includes(a))fields={};
 try{
  if(a==='cards'){await leave();fromReview=false;inlinePending=null;screen='cards';}
  else if(a==='facade')await openFacade();
  else if(a==='companion')await open('A');
  else if(a==='open')await open(t.dataset.topic);
  else if(a==='save'){await save();if(drafts.failed())throw drafts.failed().error;}
  else if(a==='view-section-copy')await confirmCollection('Cópia das respostas anteriores, mantida somente nesta aba. Você pode selecionar e copiar o texto. Nenhum dado será enviado.',{title:'Minhas respostas anteriores',confirmLabel:'Fechar',comparison:{Respostas:readableSectionAnswers(topic,sectionRecovery.get(collection.inspection.id+':'+topic))}});
  else if(a==='resolve-section-conflict')await resolveSectionConflict();
  else if(a==='recover-session'){if(mobileHost())sessionExpired();else await recoverSession();}
  else if(a==='complete'){await settleUploads(null,undefined,{strict:false});settleTopicPhotos();await save();await api('/api/collector/section-save',{inspectionId:collection.inspection.id,section:topic,version:collection.sections[topic].version,answers,complete:true});drafts.forget(collection.inspection.id,topic);await load();screen='cards';status='Assunto concluído · recebido pelo servidor';}
  else if(a==='add-row'){const list=read(t.dataset.path)||[];list.push({id:crypto.randomUUID()});write(t.dataset.path,list);dirty=true;saveSoon();}
  else if(a==='remove-row'){if(await confirmCollection('Remover este registro? A alteração fica no histórico da visita.',{title:'Remover registro',confirmLabel:'Remover'})){read(t.dataset.path).splice(Number(t.dataset.index),1);dirty=true;saveSoon();}}
  else if(a==='choose-environment')await selectEnvironment();
  else if(a==='refresh-environments'){await loadEnvironments();status='Lista de ambientes atualizada';}
  else if(a==='rename-environment'){
   await loadEnvironments();const room=collection.environments.find(e=>e.id===t.dataset.id);if(!room)throw Error('Ambiente não encontrado. Atualize a lista.');
   const renamed=await editEnvironmentName({environment:room,save:payload=>api('/api/collector/environment-rename',{...payload,inspectionId:collection.inspection.id})});
   if(renamed){collection.environments=collection.environments.map(e=>e.id===renamed.id?renamed:e);if(item?.data.environment===renamed.id)item.data.environmentName=renamed.name;status='Nome do ambiente atualizado no servidor';}
  }
  else if(a==='search'){appliedQuery=query.trim();cursor=null;await loadItems();}
  else if(a==='clear-search'){query='';appliedQuery='';cursor=null;await loadItems();}
  else if(a==='next-page'){await loadItems({append:true});}
  else if(a==='refresh-list'){cursor=null;await loadItems();status='Lista atualizada';}
  else if(a==='new'){await newItem();}
  else if(a==='edit'){await openEquipment(t.dataset.id,topic);}
  else if(a==='resume'){await resumeEquipment();}
  else if(a==='manual'){item.data.registration='Manual';pairing=null;itemSaved=false;}
  else if(a==='qr-scan'){await scanAgentQr();}
  else if(a==='qr-cancel'){if(pairing?.command?.unknown&&!await confirmCollection('O último envio ficou sem resposta e ainda não foi verificado. Cancelar mesmo assim? O vínculo pode ter sido gravado; confira a ficha depois.',{title:'Envio sem resposta',confirmLabel:'Cancelar leitura'}))return;pairing=null;}
  else if(a==='qr-confirm'){await confirmAgentLink();}
  else if(a==='position-confirm'){await confirmPosition();}
  else if(a==='item-previous'){await leave();if(fromReview){fromReview=false;reviewData=await api('/api/collector/review?id='+collection.inspection.id);screen='review';}else{screen='inventory';await loadItems({restore:true});restoreScroll=inventoryScroll;}}
  else if(a==='save-item'){
   await settleUploads('equipment:'+item.id,undefined,{strict:false});// a prévia que sobrou é reenviada logo após salvar
   if(!await saveItem({keepEditing:false})){render();return;}
   if(previews.get('equipment:'+item.id)?.length){targets.set('equipment:'+item.id,item);await startUpload('equipment:'+item.id);await settleUploads('equipment:'+item.id);}
   await leave();item=null;
   if(fromReview){fromReview=false;reviewData=await api('/api/collector/review?id='+collection.inspection.id);screen='review';status='Ficha salva · revisão atualizada';}
   else{screen='inventory';inlinePending=null;await loadItems({restore:true});restoreScroll=inventoryScroll;}
  }
  else if(a==='complete-inventory'){await settleUploads(null,undefined,{strict:false});settleTopicPhotos();await save();await api('/api/collector/inventory-section',{inspectionId:collection.inspection.id,section:topic,version:collection.sections[topic].version});drafts.forget(collection.inspection.id,topic);inlinePending=null;await load();screen='cards';status='Assunto concluído · recebido pelo servidor';}
  else if(a==='upload'){const key=t.dataset.key;if(key.startsWith('equipment:')&&item?.id===key.slice(10))targets.set(key,item);await startUpload(key);}
  else if(a==='view-photo'){const photo=collection.photos.find(p=>p.id===t.dataset.photoId);if(photo)viewCollectorPhoto(photo,t);}
  else if(a==='remove-photo'){if(await confirmCollection('Remover esta fotografia? Ela sai da visita atual; o histórico anterior não é alterado.',{title:'Remover foto',confirmLabel:'Remover'})){await api('/api/collector/photo-remove',{id:t.dataset.photoId});collection.photos=collection.photos.filter(p=>p.id!==t.dataset.photoId);receivedPhotos.delete(t.dataset.photoId);readyPreviews.remove(t.dataset.photoId);status='Foto removida no servidor';}}
  else if(a==='remove-preview'){const list=previews.get(t.dataset.key)||[],index=Number(t.dataset.index),p=list[index];if(p&&await confirmCollection('Descartar este envio? A prévia só será removida após conferir o registro no servidor.',{title:'Descartar foto pendente',confirmLabel:'Descartar'})){try{await api('/api/collector/photo-remove',{id:p.id});}catch(e){if(e.httpStatus!==404)throw e;}list.splice(index,1);URL.revokeObjectURL(p.url);collection.photos=collection.photos.filter(x=>x.id!==p.id);}}
  else if(a==='review'){await settleUploads(null,undefined,{strict:false});await leave();await load({review:true});screen='review';}
  else if(a==='drop-local-photo'){const key=t.dataset.key,l=previews.get(key)||[];if(!l.length)return;if(!await confirmCollection((l.length===1?'Descartar esta prévia?':'Descartar estas '+l.length+' prévias?')+' Ela'+(l.length===1?'':'s')+' não foi'+(l.length===1?'':'ram')+' recebida'+(l.length===1?'':'s')+' pelo servidor e não poderá'+(l.length===1?'':'ão')+' ser recuperada'+(l.length===1?'':'s')+'. A foto é opcional; nada mais muda.',{title:'Descartar prévia',confirmLabel:'Descartar'}))return;for(const p of l)URL.revokeObjectURL(p.url);previews.delete(key);targets.delete(key);status='Prévia descartada · nada foi enviado';}
  else if(a==='fix'){const key=t.dataset.error;if(key.startsWith('photo:')){await open('G');}else if(['facade','facadeChanged'].includes(key)){await openFacade();}else if(topics.some(t=>t[0]===key))await open(key);}
  else if(a==='reopen'){const g=topic;if(screen==='equipment')await leave();await open(g);}
  else if(a==='fix-pending'){
   const {section,kind,id,target}=t.dataset;let wanted={};try{wanted=JSON.parse(t.dataset.fields||'{}')||{};}catch{}
   if(target==='open-facade')await openFacade();
   else if(kind==='equipment'&&id){const cameFromReview=screen==='review';if(await openEquipment(id,section))fromReview=cameFromReview;}
   else if(topics.some(x=>x[0]===section))await open(section);
   // Destaca os campos que o servidor apontou e leva o foco ao primeiro deles.
   const keys=Object.keys(wanted);if(keys.length&&['group','equipment'].includes(screen)){fields=Object.fromEntries(keys.map(k=>[k,/^(Preencha|Responda|Informe|Registre|Selecione|Confira|Use|Escolha)\b/.test(String(wanted[k]))?wanted[k]:'Falta responder: '+String(wanted[k]).replace(/\s*\(.*?\)\s*$/,'')+'.']));render();history.replaceState(null,'',route());ux.focusError();return;}
  }
  else if(a==='finish'){
   await settleUploads();// estrito: nenhuma foto selecionada pode ficar para trás (R4)
   if(!await confirmCollection('Confirmar a conclusão desta visita com os dados recebidos pelo servidor? Depois disso a visita não aceita mais alterações.',{title:'Concluir visita',confirmLabel:'Concluir visita'}))return;
   let r;try{r=await api('/api/collector/finish',{inspectionId:collection.inspection.id,confirm:true,revision:reviewData.revision});}
   catch(err){if(!err.unknown)throw err;const check=await api('/api/collector/review?id='+collection.inspection.id);if(!check.completed)throw err;r=check;}
   if(r.completed){await load();status='Visita concluída e recebida';screen='cards';}
  }
  else if(a==='units'){
   if(uploads.size||preparing.size)throw Error('Aguarde o envio das fotos antes de trocar de unidade.');
   if([...previews.values()].some(l=>l.length))throw Error('Envie ou remova as prévias antes de trocar de unidade.');
   if(item&&!itemSaved&&!await confirmCollection('A ficha em preenchimento tem alterações não enviadas. Trocar de unidade descarta essas alterações.',{title:'Trocar de unidade?',confirmLabel:'Descartar e trocar'}))return;
   // Só descarta a ficha local após confirmar a saída e receber os demais rascunhos.
   // Sem limpar item, beforeunload repetia a confirmação e podia impedir a navegação.
   await save();await leave();item=null;pairing=null;itemSaved=false;
   location.assign(collectorPath('/'));return;
  }
  if(serial===actionSerial)repaint({scroll:restoreScroll??'auto'});
 }catch(err){if(serial===actionSerial){if(t.isConnected&&busyLabel[a])t.innerHTML=originalLabel;showError(err);}}
 finally{if(serial===actionSerial){busy=false;if(t.isConnected){t.disabled=false;if(busyLabel[a]&&t.textContent===busyLabel[a])t.innerHTML=originalLabel;if(a==='choose-environment')t.focus({preventScroll:true});}}}
});
addEventListener('beforeunload',e=>{if(uploads.size||preparing.size||dirty||drafts.hasPending()||item&&!itemSaved||[...previews.values()].some(l=>l.length)){e.preventDefault();e.returnValue='';}});

// ---------------------------------------------------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------------------------------------------------
async function boot(){
 try{
  me=await api('/api/auth/me');if(!['root','admin','operador'].includes(me.role))throw Error('Perfil sem permissão de coleta.');
  const u=new URL(location.href),id=u.searchParams.get('vistoria');if(!id){location.replace(collectorPath('/'));return;}
  collection={inspection:{id}};topic=u.searchParams.get('assunto')||'A';if(!topics.some(t=>t[0]===topic))topic='A';
  await Promise.all([load({review:u.searchParams.get('tela')==='review'}),api('/api/collector/capabilities').then(value=>{caps=value;})]);
  screen=['facade','cards','group','inventory','environment','review'].includes(u.searchParams.get('tela'))?u.searchParams.get('tela'):'facade';step=0;
  if(screen==='group'&&['F','G','O'].includes(topic))screen='inventory';
  if(topic==='B'&&['group','inventory'].includes(screen))screen='environment';
  if(collection.inspection.state!=='open')screen='cards';
  if(screen==='facade'){topic='A';answers=structuredClone(collection.sections.A.data);}
  if(screen==='inventory')await loadItems();if(topic==='H')await loadSummaryItems();
  repaint();
 }catch(e){app.innerHTML=`<main class="content boot-error"><span class="simbolo tile-vermelho">${icon('alert')}</span><h1>Não foi possível abrir a coleta</h1><p role="alert">${esc(e.message)}</p><a class="secondary" href="${collectorPath('/')}">Voltar à lista de unidades</a></main>`;}
}
boot();
installCollectorApp({pending:()=>uploads.size>0||preparing.size>0||dirty||drafts.hasPending()||item&&!itemSaved||[...previews.values()].some(l=>l.length),resume:async()=>{if(!me||!collection?.unit){await boot();return;}await recoverSession();render();},back:()=>{if(screen==='cards')mobileHost()?.home();else app.querySelector('[data-action=cards]')?.click();}});
