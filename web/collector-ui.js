// D-062: atualizações na mesma tela mantêm os elementos, o foco e o cursor.
function nodeKey(node){
 if(node.nodeType!==1)return '';
 if(node.id)return 'id:'+node.id;
 if(node.dataset.uiKey)return node.dataset.uiKey;
 if(node.dataset.field)return 'field:'+node.dataset.field;
 if(node.matches('label.field')){const field=node.querySelector('[data-field]');if(field)return 'label:'+field.dataset.field;}
 if(node.dataset.photo)return 'photo-input:'+node.dataset.photo+':'+node.hasAttribute('capture');
 if(node.dataset.action)return 'action:'+node.dataset.action+':'+(node.dataset.id||node.dataset.topic||node.dataset.photoId||'');
 return '';
}
const compatible=(a,b)=>a.nodeType===b.nodeType&&(a.nodeType!==1||a.tagName===b.tagName);
function patchNode(current,next){
 if(current.nodeType!==1){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 for(const attr of [...current.attributes])if(!next.hasAttribute(attr.name))current.removeAttribute(attr.name);
 for(const attr of next.attributes)if(current.getAttribute(attr.name)!==attr.value)current.setAttribute(attr.name,attr.value);
 if(current.matches('input,textarea')){
  if(current.type!=='file'&&current.value!==next.value)current.value=next.value;
  return;
 }
 patchChildren(current,next);
 if(current.tagName==='SELECT'&&current.value!==next.value)current.value=next.value;
}
function patchChildren(parent,next){
 const keyed=new Map([...parent.childNodes].map(n=>[nodeKey(n),n]).filter(([key])=>key));
 let cursor=parent.firstChild;
 for(const expected of [...next.childNodes]){
  const key=nodeKey(expected);
  let current=key?keyed.get(key):cursor&&!nodeKey(cursor)&&compatible(cursor,expected)?cursor:null;
  if(current&&!compatible(current,expected))current=null;
  if(!current){current=expected.cloneNode(true);parent.insertBefore(current,cursor);}
  else{if(current!==cursor)parent.insertBefore(current,cursor);patchNode(current,expected);}
  cursor=current.nextSibling;
 }
 while(cursor){const nextSibling=cursor.nextSibling;cursor.remove();cursor=nextSibling;}
}
export function updateScreen(root,html,preserve){
 if(!preserve){root.innerHTML=html;return;}
 const template=document.createElement('template');template.innerHTML=html;
 patchChildren(root,template.content);
}

export function installInputExperience(root){
 let frame=0,visibilityFrame=0;
 const textInput=el=>el instanceof HTMLElement&&root.contains(el)&&el.matches('textarea,input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit])');
 const compact=()=>matchMedia('(pointer:coarse)').matches||innerWidth<700;
 function sync(){
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const typing=compact()&&textInput(document.activeElement);
   root.classList.toggle('is-typing',typing);
   const header=root.querySelector('.app-header');
   root.style.setProperty('--header-height',(header?.getBoundingClientRect().height||64)+'px');
  });
 }
 function ensureVisible(element=document.activeElement){
  if(!element?.isConnected||!root.contains(element))return;
  cancelAnimationFrame(visibilityFrame);visibilityFrame=requestAnimationFrame(()=>{
   const viewport=window.visualViewport,offset=viewport?.offsetTop||0,height=viewport?.height||innerHeight;
   const header=root.querySelector('.app-header')?.getBoundingClientRect(),footer=root.querySelector('.collection-footer');
   const footerHeight=footer&&getComputedStyle(footer).display!=='none'?footer.getBoundingClientRect().height:0;
   const top=offset+(header?.height||0)+12,bottom=offset+height-footerHeight-14;
   const rect=element.getBoundingClientRect(),label=element.closest('label'),errorId=element.getAttribute('aria-describedby');
   const message=errorId?document.getElementById(errorId):null;
   const begin=label?.getBoundingClientRect().top??rect.top,end=message?.getBoundingClientRect().bottom??rect.bottom;
   let delta=0;
   if(end-begin<=bottom-top){if(begin<top)delta=begin-top;else if(end>bottom)delta=end-bottom;}
   else if(rect.top<top)delta=rect.top-top;else if(rect.bottom>bottom)delta=rect.bottom-bottom;
   if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});
  });
 }
 root.addEventListener('focusin',e=>{sync();if(textInput(e.target))ensureVisible(e.target);});
 root.addEventListener('focusout',()=>setTimeout(sync,0));
 // Mantém o botão vivo até click, mesmo que o navegador focalize botões ao tocar.
 root.addEventListener('pointerdown',e=>{if(e.target.closest('[data-action=close-keyboard]'))e.preventDefault();});
 root.addEventListener('click',e=>{if(e.target.closest('[data-action=close-keyboard]')){document.activeElement?.blur();sync();}});
 root.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||e.isComposing||!textInput(e.target)||e.target.tagName==='TEXTAREA')return;
  if(e.target.dataset.field==='_query')return; // submit nativo da busca
  if(e.target.closest('#environment-form'))return; // submit explícito de ambiente
  e.preventDefault();
  const inputs=[...root.querySelectorAll('.content input:not([type=file]),.content select,.content textarea')].filter(el=>!el.disabled&&el.getClientRects().length);
  const next=inputs[inputs.indexOf(e.target)+1];
  if(next){next.focus({preventScroll:true});ensureVisible(next);}else e.target.blur();
 });
 const viewportChanged=()=>{sync();if(textInput(document.activeElement))ensureVisible();};
 window.visualViewport?.addEventListener('resize',viewportChanged);
 window.visualViewport?.addEventListener('scroll',()=>{if(textInput(document.activeElement))ensureVisible();});
 window.addEventListener('resize',viewportChanged);
 return {sync,ensureVisible,focusError(){
  const field=root.querySelector('[aria-invalid=true]');
  if(field){field.focus({preventScroll:true});sync();ensureVisible(field);}
  else{const notice=root.querySelector('.notice.error');if(notice){notice.tabIndex=-1;notice.focus({preventScroll:true});ensureVisible(notice);}}
 }};
}
