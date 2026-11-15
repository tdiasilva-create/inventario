// Keep the page shell, map and independently managed widgets alive between updates.
// Templates are produced by the existing escaped render functions, never by API HTML.
const islands='#unit-equipment-map,.map-panel,[data-equipment-consultation],[data-result-summary],[data-schools-online],[data-schools-offline],[data-result-alerts],[data-monitor-summary],#received-findings,#progress-content,#progress-overview,#computer-report,#work-plan';
const key=node=>node.nodeType===1?(node.id||node.getAttribute('data-layout-block')||
 (node.matches('[data-equipment-consultation]')?'equipment-consultation:'+node.getAttribute('data-equipment-consultation'):null)):null;
function patch(old,next){
 if(old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){old.replaceWith(next);return;}
 if(old.nodeType!==1){if(old.nodeValue!==next.nodeValue)old.nodeValue=next.nodeValue;return;}
 if(old.matches('.map-panel'))return;
 for(const a of [...old.attributes])if(!next.hasAttribute(a.name)&&!(old.tagName==='DETAILS'&&a.name==='open'))old.removeAttribute(a.name);
 for(const a of next.attributes)if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
 if(old.matches(islands))return;
 if(old instanceof HTMLInputElement&&next.hasAttribute('value')&&old!==document.activeElement)old.value=next.value;
 children(old,next);
}
function children(parent,next){
 const keyed=new Map([...parent.children].map(n=>[key(n),n]).filter(([k])=>k));
 let cursor=parent.firstChild;
 for(const desired of [...next.childNodes]){
  const k=key(desired);let existing=k?keyed.get(k):cursor;
  if(existing&&(!k&&key(existing)))existing=null;
  if(!existing){parent.insertBefore(desired,cursor);continue;}
  if(existing!==cursor)parent.insertBefore(existing,cursor);
  patch(existing,desired);
  // A replacement uses desired; otherwise existing is still attached.
  cursor=(existing.parentNode===parent?existing:desired).nextSibling;
 }
 while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next;}
}
export function updateBlocks(container,html){
 const template=document.createElement('template');template.innerHTML=html;
 children(container,template.content);
}
