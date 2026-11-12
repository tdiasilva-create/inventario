// One live read per tab for the bell, map and pending indicators. No persisted cache.
const listeners=new Set();
let stop=null,inflight=null,queued=false,last=null;
function emit(value){last=value;for(const listener of listeners)listener(value);}
export function refreshPanelStatus(){return update(true);}
async function update(force=false){
 if(!stop||document.hidden)return;
 if(inflight){if(force)queued=true;return inflight.promise;}
 const request=new AbortController(),entry={controller:request,promise:null};inflight=entry;
 entry.promise=(async()=>{
  const timeout=setTimeout(()=>request.abort('timeout'),12000);
  try{
   const ids=[...new Set([...document.querySelectorAll('[data-monitor-equipment]')].map(el=>el.dataset.monitorEquipment))].sort().slice(0,50);
   const r=await fetch('/api/inventory/panel-status?'+new URLSearchParams({equipmentIds:ids.join(',')}),{signal:request.signal,cache:'no-store'});
   if(!r.ok)throw Error(r.status===401?'Sessão expirada. Entre novamente.':'Não foi possível atualizar os indicadores. Tente novamente.');
   const data=await r.json();if(request.signal.aborted)return;
   if(!data.pending||!data.monitoring)throw Error('Indicadores indisponíveis. Tente atualizar.');
   emit({data,error:'',checkedAt:new Date()});
  }catch(e){if(!['hidden','stopped'].includes(request.signal.reason))emit({data:last?.data||null,error:request.signal.reason==='timeout'?'Atualização demorou demais. Tentaremos novamente.':e.message,checkedAt:last?.checkedAt||null});}
  finally{clearTimeout(timeout);if(inflight===entry)inflight=null;if(queued&&stop&&!document.hidden){queued=false;void update();}}
 })();return entry.promise;
}
export function subscribePanelStatus(listener){
 listeners.add(listener);
 if(!stop){
  const visibility=()=>{if(document.hidden){queued=false;inflight?.controller.abort('hidden');}else void update(true);};
  const refresh=()=>void update(true),timer=setInterval(()=>void update(),15000);
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('semed:equipment-list',refresh);
  window.addEventListener('semed:pending-refresh',refresh);
  stop=()=>{clearInterval(timer);inflight?.controller.abort('stopped');document.removeEventListener('visibilitychange',visibility);window.removeEventListener('semed:equipment-list',refresh);window.removeEventListener('semed:pending-refresh',refresh);};
  queueMicrotask(()=>void update(true));
 }
 if(last)listener(last);
 return ()=>{listeners.delete(listener);if(!listeners.size){stop?.();stop=null;last=null;queued=false;}};
}
