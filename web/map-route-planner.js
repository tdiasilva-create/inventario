import {readPanelJson} from './desktop-request.js';
import {confirmAction} from './panel-confirm.js';

const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action,cls='btn')=>{const b=node('button',text,cls);b.type='button';b.onclick=action;return b;};

// All draft edits are local. Opening/changing technician and an explicit road
// preview are the only reads; nothing is saved before the final submit.
export function mountMapRoutePlanner(context,identity){
 const {map,container,markers}=context,panel=container.closest('.map-panel'),L=window.L;
 let active=false,stops=[],busy=false,uncertain=null,revision=null,optionsBusy=false,previewBusy=false,previewVersion=0,readVersion=0,stopped=false,dragged=null,coordinateKey='';
 const group=L.layerGroup().addTo(map),preview=L.layerGroup().addTo(map);
 const start=button('Criar rota',open,'map-route-start btn');start.dataset.routeStart='';panel.querySelector('.cartography-controls').prepend(start);
 const aside=node('aside',null,'map-route-planner');aside.hidden=true;aside.setAttribute('aria-labelledby','map-route-title');
 aside.innerHTML='<header><span class="map-route-kicker">ORGANIZAR ATENDIMENTOS</span><h2 id="map-route-title">Criar rota</h2><p>Selecione as unidades no mapa e defina o que fazer em cada uma.</p><div class="map-route-steps" aria-label="Etapas"><span>1 · Unidades</span><span>2 · Atividades</span><span>3 · Técnico</span></div></header><form><div class="map-route-scroll"><div class="map-route-selection"><strong data-count>Nenhuma unidade selecionada</strong><small>Clique nos marcadores. Arraste os cartões ou use as setas para ordenar.</small></div><ol class="map-route-stops"></ol><div data-preview-actions></div><p data-preview-message class="help" role="status"></p><section class="map-route-assignment"><label for="map-route-technician">Técnico responsável</label><select id="map-route-technician" required><option value="">Selecione um técnico</option></select><button type="button" class="btn" data-refresh>Atualizar técnicos e fila</button><p data-priority>Após o atendimento atual, antes das demais pendências.</p></section></div><footer><p data-message role="status"></p><button type="submit" class="btn primary" data-submit>Criar rota e atribuir</button><button type="button" class="btn" data-cancel>Cancelar</button></footer></form>';
 panel.append(aside);const form=aside.querySelector('form'),list=aside.querySelector('ol'),select=aside.querySelector('select'),message=aside.querySelector('[data-message]'),submit=aside.querySelector('[data-submit]'),refresh=aside.querySelector('[data-refresh]'),cancel=aside.querySelector('[data-cancel]'),previewMessage=aside.querySelector('[data-preview-message]');
 form.querySelector('footer').before(aside.querySelector('.map-route-assignment'));
 const previewButton=button('Ver trajeto entre unidades',showPreview);aside.querySelector('[data-preview-actions]').append(previewButton);
 const beforeUnload=e=>{if(active&&(stops.length||uncertain)){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);
 const locked=()=>busy||!!uncertain;
 function controls(){
  const lock=locked();for(const n of list.querySelectorAll('textarea,select,button'))n.disabled=lock;
  for(const n of list.querySelectorAll('[data-route-drag]'))n.draggable=!lock;
  select.disabled=lock||optionsBusy;refresh.disabled=lock||optionsBusy;cancel.disabled=lock;
  previewButton.disabled=lock||previewBusy||stops.length<2;
  submit.disabled=busy||(!uncertain&&(optionsBusy||revision===null||!select.value||!stops.length));
  submit.textContent=busy?'Criando e atribuindo…':uncertain?'Conferir envio / tentar novamente':'Criar rota e atribuir';
  aside.querySelector('[data-count]').textContent=stops.length?stops.length+' unidade(s) selecionada(s)':'Nenhuma unidade selecionada';
 }
 function invalidatePreview(){previewVersion++;preview.clearLayers();previewMessage.textContent='';}
 function badges(){
  group.clearLayers();if(!active)return;
  stops.forEach((s,i)=>{const entry=markers.get(s.unitId);if(!entry)return;const badge=L.marker(entry.marker.getLatLng(),{interactive:false,keyboard:false,zIndexOffset:1000,icon:L.divIcon({className:'map-route-number',iconSize:[24,24],iconAnchor:[-6,30],html:String(i+1)})});badge.addTo(group);});
 }
 function renderStops(focusId){
  list.replaceChildren();
  for(const [i,s] of stops.entries()){
   const li=node('li',null,'map-route-stop');li.dataset.routeUnit=s.unitId;
   const top=node('div',null,'map-route-stop-heading'),number=node('span',String(i+1),'map-route-stop-number'),name=node('strong',s.name);
   const drag=button('⠿',()=>{});drag.dataset.routeDrag='';drag.draggable=true;drag.title='Arrastar para alterar a ordem';drag.setAttribute('aria-label','Arrastar '+s.name);
   drag.ondragstart=e=>{if(locked()){e.preventDefault();return;}dragged=s.unitId;e.dataTransfer.setData('text/plain',s.unitId);e.dataTransfer.effectAllowed='move';};drag.ondragend=()=>{dragged=null;};
   li.ondragover=e=>{if(dragged&&!locked())e.preventDefault();};li.ondrop=e=>{e.preventDefault();if(dragged&&!locked())move(dragged,i);dragged=null;};
   const actions=node('div',null,'map-route-stop-actions');
   for(const [text,offset,label] of [['↑',-1,'Subir'],['↓',1,'Descer']]){const b=button(text,()=>move(s.unitId,i+offset));b.setAttribute('aria-label',label+' '+s.name);if(i+offset<0||i+offset>=stops.length)b.hidden=true;actions.append(b);}
   const remove=button('×',()=>removeStop(s.unitId));remove.setAttribute('aria-label','Remover '+s.name);actions.append(remove);
   top.append(drag,number,name,actions);li.append(top);
   const label=node('label','O que fazer nesta unidade?');label.htmlFor='route-activity-'+s.unitId;
   const description=node('textarea');description.id=label.htmlFor;description.rows=2;description.required=true;description.maxLength=2000;description.value=s.description;description.placeholder='Descreva o atendimento necessário';description.oninput=()=>{s.description=description.value;};
   const typeDetails=node('details'),typeSummary=node('summary','Tipo: '+s.kind),typeLabel=node('label','Tipo de demanda');typeLabel.htmlFor='route-kind-'+s.unitId;
   const type=node('select');type.id=typeLabel.htmlFor;for(const k of ['Visita técnica','Manutenção','Reposição de insumo','Outro'])type.append(new Option(k,k));type.value=s.kind;type.onchange=()=>{s.kind=type.value;typeSummary.textContent='Tipo: '+s.kind;};
   typeDetails.append(typeSummary,typeLabel,type);li.append(label,description,typeDetails);list.append(li);
  }
  coordinateKey=currentCoordinates();badges();controls();if(focusId)list.querySelector('[data-route-unit="'+CSS.escape(focusId)+'"] textarea')?.focus({preventScroll:true});
 }
 function move(id,index){if(locked()||index<0||index>=stops.length)return;const from=stops.findIndex(s=>s.unitId===id);if(from<0||from===index)return;const [s]=stops.splice(from,1);stops.splice(index,0,s);invalidatePreview();renderStops();list.querySelector('[data-route-unit="'+CSS.escape(id)+'"] [data-route-drag]')?.focus({preventScroll:true});}
 async function removeStop(id){if(locked())return;const s=stops.find(s=>s.unitId===id);if(!s)return;if(s.description.trim()&&!await confirmAction('Remover '+s.name+' desta rota e descartar a atividade preenchida?'))return;if(locked()||!active)return;stops=stops.filter(s=>s.unitId!==id);invalidatePreview();renderStops();}
 async function loadOptions(){
  if(locked())return;const version=++readVersion,wanted=select.value;optionsBusy=true;revision=null;message.textContent='Consultando técnicos e sequência atual…';controls();
  try{
   const data=await readPanelJson('/api/dispatch/map-route-options'+(wanted?'?technicianId='+encodeURIComponent(wanted):''));if(stopped||version!==readVersion)return;
   select.replaceChildren(new Option('Selecione um técnico',''));for(const t of data.technicians)select.append(new Option(t.display_name||t.username,t.id));select.value=wanted;revision=data.revision;
   aside.querySelector('[data-priority]').textContent=data.active?'Atendimento #'+data.active.number+' preservado. Esta rota entrará em seguida, antes das demais pendências.':wanted&&select.value?'Esta rota entrará antes das '+data.pending+' demanda(s) pendente(s).':'Após o atendimento atual, antes das demais pendências.';
   message.textContent=data.technicians.length?'Cada unidade criará uma demanda atribuída ao técnico escolhido.':'Nenhum técnico habilitado. Habilite uma conta em Central → Organizar atendimentos → Técnicos.';
  }catch(e){if(!stopped&&version===readVersion)message.textContent=e.message;}
  finally{if(version===readVersion){optionsBusy=false;controls();}}
 }
 function open(){if(active||!context.expanded)return;active=true;panel.querySelector('.map-route-success')?.remove();aside.hidden=false;panel.classList.add('map-route-open');start.setAttribute('aria-pressed','true');renderStops();void loadOptions();select.focus({preventScroll:true});}
 function reset(){active=false;readVersion++;stops=[];revision=null;uncertain=null;select.value='';optionsBusy=false;aside.hidden=true;panel.classList.remove('map-route-open');start.setAttribute('aria-pressed','false');invalidatePreview();badges();start.focus({preventScroll:true});}
 async function requestClose(done=()=>{}){
  if(locked())return;if(stops.length&&!await confirmAction('Cancelar esta rota? As unidades e atividades ainda não enviadas serão descartadas.'))return;
  if(locked()||stopped)return;reset();done();
 }
 function choose(unitId){
  if(!active)return false;if(locked())return true;
  const entry=markers.get(unitId);if(!entry)return true;
  if(stops.some(s=>s.unitId===unitId)){message.textContent='Esta unidade já está na rota. Use Remover no cartão para retirá-la.';return true;}
  if(stops.length>=99){message.textContent='Limite de 99 unidades por roteiro.';return true;}
  stops.push({unitId,name:entry.name,description:'',kind:'Visita técnica'});invalidatePreview();renderStops();message.textContent='Unidade adicionada. Continue selecionando no mapa ou preencha a atividade.';return true;
 }
 async function showPreview(){
  if(previewBusy||locked()||stops.length<2)return;const version=++previewVersion;previewBusy=true;preview.clearLayers();previewMessage.textContent='Calculando ruas na ordem escolhida…';controls();
  try{
   const response=await fetch('/api/dispatch/map-route-preview',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':identity()?.csrf||''},body:JSON.stringify({stops:stops.map(s=>({unitId:s.unitId}))}),signal:AbortSignal.timeout(15000)}),result=await response.json();if(stopped||version!==previewVersion)return;
   if(!response.ok)throw Error(result.error||'Prévia indisponível.');
   if(result.status==='ready'){L.geoJSON(result.geometry,{style:{color:'#006D77',weight:3,dashArray:'6 6',opacity:.9,interactive:false}}).addTo(preview);map.fitBounds(preview.getLayers()[0].getBounds(),{padding:[48,48],maxZoom:15,animate:false});previewMessage.textContent='Prévia entre unidades · '+(result.distance/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' km. Após o aceite, o acompanhamento parte da posição do técnico.';}
   else previewMessage.textContent=result.message||'Prévia indisponível.';
  }catch(e){if(!stopped&&version===previewVersion)previewMessage.textContent=e.message;}
  finally{previewBusy=false;if(!stopped)controls();}
 }
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||(!uncertain&&(revision===null||optionsBusy||!select.value||!stops.length)))return;
  if(!uncertain){const empty=stops.find(s=>!s.description.trim());if(empty){message.textContent='Descreva a atividade de todas as unidades.';list.querySelector('#route-activity-'+CSS.escape(empty.unitId))?.focus();return;}uncertain={operationId:crypto.randomUUID(),revision,technicianId:select.value,stops:stops.map(({unitId,description,kind})=>({unitId,description:description.trim(),kind}))};}
  busy=true;message.textContent='Criando demandas e atribuindo o técnico…';controls();
  try{
   const response=await fetch('/api/dispatch/map-route-create',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':identity()?.csrf||''},body:JSON.stringify(uncertain),signal:AbortSignal.timeout(20000)}),data=await response.json();if(stopped)return;
   if(!response.ok){if(response.status<500){uncertain=null;revision=null;}throw Error(data.error||'Não foi possível confirmar o envio.');}
   busy=false;uncertain=null;reset();const notice=node('div',data.requests.length+' demanda(s) criada(s) e atribuída(s). O técnico receberá os avisos no aplicativo.','map-route-success');notice.setAttribute('role','status');const close=button('Fechar',()=>notice.remove());notice.append(close);panel.querySelector('.map-route-success')?.remove();panel.append(notice);close.focus({preventScroll:true});window.dispatchEvent(new Event('semed:pending-refresh'));
  }catch(error){if(!stopped)message.textContent=error.message+(uncertain?' Confira o mesmo envio pelo botão abaixo. A sequência está preservada para evitar duplicidades.':' Atualize técnicos e fila antes de tentar novamente.');}
  finally{busy=false;if(!stopped)controls();}
 };
 select.onchange=loadOptions;refresh.onclick=loadOptions;cancel.onclick=()=>requestClose();
 const currentCoordinates=()=>JSON.stringify(stops.map(s=>{const entry=markers.get(s.unitId);return [s.unitId,entry?.marker.getLatLng(),entry?.name];}));
 function refreshMarkers(){
  if(!active)return;
  const next=currentCoordinates();
  if(coordinateKey&&coordinateKey!==next){invalidatePreview();for(const s of stops){const entry=markers.get(s.unitId),label=list.querySelector('[data-route-unit="'+CSS.escape(s.unitId)+'"] strong');if(entry){s.name=entry.name;if(label)label.textContent=s.name;}else if(label)label.textContent=s.name+' · indisponível no mapa';}}
  coordinateKey=next;badges();
 }
 return {choose,isActive:()=>active,requestClose,refreshMarkers,dispose(){stopped=true;readVersion++;previewVersion++;window.removeEventListener('beforeunload',beforeUnload);group.remove();preview.remove();aside.remove();start.remove();panel.classList.remove('map-route-open');}};
}
