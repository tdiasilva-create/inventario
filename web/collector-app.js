// Embedded module only. The independent browser collector keeps its existing routes.
export function mobileHost(){try{return parent!==window&&parent.location.origin===location.origin?parent.semedApp:null;}catch{return null;}}
export function collectorPath(path){
 if(!location.pathname.startsWith('/app/coleta'))return path;
 const u=new URL(path,location.origin),paths={'/':'/app/coleta','/coleta-v3':'/app/coleta/v3','/coleta-v2':'/app/coleta/v2','/visita':'/app/coleta/visita','/login':'/app','/conta':'/app'};
 return (paths[u.pathname]||u.pathname)+u.search+u.hash;
}
export function sessionExpired(){mobileHost()?.sessionExpired();}
export function installCollectorApp({pending,resume,back}){
 if(!mobileHost())return;
 window.semedAppPending=pending;
 window.semedAppResume=resume;
 window.semedHandleBack=()=>{
  const qr=document.querySelector('[data-qr="cancel"]');if(qr){qr.click();return true;}
  const dialog=document.querySelector('dialog[open]');if(dialog){dialog.dispatchEvent(new Event('cancel',{cancelable:true}));return true;}
  if(back){back();return true;}return false;
 };
 addEventListener('semed-area-hide',()=>document.querySelector('[data-qr="cancel"]')?.click());
 // Native/browser logout is shared; never end tracking while merely changing area.
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a){const u=new URL(a.href,location.href);if(u.origin===location.origin){const mapped=collectorPath(u.pathname+u.search);if(mapped!==u.pathname+u.search){e.preventDefault();e.stopImmediatePropagation();if(mapped==='/app')sessionExpired();else location.assign(mapped);return;}}}const b=e.target.closest('[data-action="logout"]');if(b){e.preventDefault();e.stopImmediatePropagation();mobileHost().logout();}},true);
}
