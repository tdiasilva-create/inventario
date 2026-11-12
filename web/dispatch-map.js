import {avatarElement} from './technician-avatar.js';
import {readPanelJson} from './desktop-request.js';
const distance=(a,b)=>{const rad=Math.PI/180,h=Math.sin((a[0]-b[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((a[1]-b[1])*rad/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));};
export function mountDispatchMap(map,container){
 const L=window.L,group=L.layerGroup().addTo(map);
 let stopped=false,busy=false,last=null,calculating=false,retryTimer,routeAbort;
 const routes=new Map(),avatars=new Map(),status=document.createElement('span');
 // Keep updates accessible without an overlay covering the map.
 status.className='dispatch-map-status';status.setAttribute('role','status');container.append(status);
 const attribution='Rotas: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">OSRM / OSM</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Corrigir mapa</a>';
 map.attributionControl?.addAttribution(attribution);
 const fresh=p=>p.fresh&&Date.now()-p.observed_at<=180000&&typeof p.latitude==='number'&&typeof p.longitude==='number';
 const valid=(r,p)=>r&&r.routeKey===p.routeKey&&r.attendanceId===p.id&&r.expiresAt>Date.now()&&distance(r.origin,[p.latitude,p.longitude])<75;
 const visible=()=>last?.positions.filter(fresh)||[];
 function paint(){
  group.clearLayers();if(!last||stopped||document.hidden)return;
  const positions=visible(),messages=[];let ready=0;
  for(const p of positions){
   const key=p.name+':'+(p.avatar_id||'');let cached=avatars.get(p.user_id);
   if(!cached||cached.key!==key){cached={key,node:avatarElement(p.name,p.user_id,p.avatar_id)};avatars.set(p.user_id,cached);}
   const marker=L.marker([p.latitude,p.longitude],{icon:L.divIcon({html:cached.node,className:'dispatch-technician-marker',iconSize:[48,48],iconAnchor:[24,76]}),zIndexOffset:1000,keyboard:true,title:p.name,alt:p.name}).addTo(group),text=document.createElement('div');
   text.textContent=p.name+' · demanda #'+p.number+' · '+(p.unit_name||'Unidade')+' · posição '+new Date(p.observed_at).toLocaleTimeString('pt-BR')+' · precisão aproximada '+Math.round(p.accuracy)+' m';marker.bindTooltip(text);
   const r=routes.get(p.user_id);
   if(valid(r,p)&&r.status==='ready'){
    L.polyline(r.geometry.coordinates.map(([lon,lat])=>[lat,lon]),{color:'#006D77',weight:2,dashArray:'5 7',className:'dispatch-route-line',interactive:false}).addTo(group);ready++;
   }else if(valid(r,p)&&r.status==='unavailable'){
    const detail=r.message+(r.requestNumbers?.length?' Demandas '+r.requestNumbers.map(n=>'#'+n).join(', ')+'.':'');
    messages.push(p.name+': '+detail);text.append(document.createElement('br'),document.createTextNode(detail));
   }
  }
  for(const id of routes.keys())if(!last.positions.some(p=>p.user_id===id&&fresh(p)))routes.delete(id);
  for(const id of avatars.keys())if(!last.positions.some(p=>p.user_id===id&&fresh(p)))avatars.delete(id);
  const stale=last.positions.filter(p=>!fresh(p)).length;
  status.textContent=positions.length+' técnico(s) com posição recente'+(stale?' · '+stale+' sem posição atual':'')+(ready?' · '+ready+' roteiro(s) pelas ruas, na ordem do root.':'')+(positions.length>ready+messages.length?' Calculando ruas…':'')+(messages.length?' '+messages.join(' '):'');
 }
 function schedule(ms=0){clearTimeout(retryTimer);if(!stopped&&!document.hidden)retryTimer=setTimeout(calculate,ms);}
 async function calculate(){
  if(stopped||document.hidden||calculating||!last)return;
  const p=visible().find(p=>!valid(routes.get(p.user_id),p));if(!p)return;
  calculating=true;routeAbort=new AbortController();const timeout=setTimeout(()=>routeAbort?.abort(),13000);let delay=1300;
  try{
   const r=await readPanelJson('/api/dispatch/road-route?technician='+encodeURIComponent(p.user_id),{signal:routeAbort.signal,timeoutMs:13000});
   const current=last?.positions.find(x=>x.user_id===p.user_id);
   if(stopped||document.hidden||!current||current.routeKey!==p.routeKey||!fresh(current))return;
   if(r.status==='waiting')delay=Math.max(1300,Math.min(10000,r.retryAfterMs||1800));
   else if(r.status==='changed'||r.code==='NO_POSITION'){delay=3000;await update();}
   else if(r.routeKey===current.routeKey){routes.set(p.user_id,{...r,expiresAt:r.expiresAt||Date.now()+30000});}
  }catch{
   if(stopped||document.hidden)return;
   routes.set(p.user_id,{status:'unavailable',attendanceId:p.id,routeKey:p.routeKey,origin:[p.latitude,p.longitude],expiresAt:Date.now()+30000,message:'Cálculo das ruas indisponível. Aguardando nova tentativa.'});
  }finally{clearTimeout(timeout);calculating=false;routeAbort=null;paint();schedule(delay);}
 }
 async function update(){
  if(stopped||busy||document.hidden)return;busy=true;
  try{const value=await readPanelJson('/api/dispatch/map',{timeoutMs:12000});if(stopped||document.hidden)return;last=value;paint();schedule();}
  catch{if(stopped)return;last=null;routes.clear();avatars.clear();group.clearLayers();status.textContent='Localização indisponível. Aguardando atualização.';}
  finally{busy=false;}
 }
 const onVisible=()=>{if(document.hidden){routeAbort?.abort();clearTimeout(retryTimer);group.clearLayers();}else update();};
 document.addEventListener('visibilitychange',onVisible);const timer=setInterval(update,15000);update();
 return ()=>{stopped=true;clearInterval(timer);clearTimeout(retryTimer);routeAbort?.abort();avatars.clear();document.removeEventListener('visibilitychange',onVisible);group.remove();status.remove();map.attributionControl?.removeAttribution(attribution);};
}
