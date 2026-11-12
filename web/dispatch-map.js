const distance=(a,b)=>{const rad=Math.PI/180,h=Math.sin((a[0]-b[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((a[1]-b[1])*rad/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));};
export function mountDispatchMap(map,container){
 const L=window.L,group=L.layerGroup().addTo(map),control=L.control({position:'topleft'});
 let stopped=false,busy=false,selected='',last=null,calculating=false,retryTimer,routeAbort;
 const routes=new Map(),box=document.createElement('div');box.className='dispatch-map-control';box.style.marginLeft='48px';
 const label=document.createElement('label');label.textContent='Atendimentos técnicos';
 const select=document.createElement('select');select.setAttribute('aria-label','Roteiro do técnico');
 const status=document.createElement('small');status.setAttribute('role','status');box.append(label,select,status);
 L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);control.onAdd=()=>box;control.addTo(map);
 const attribution='Rotas: <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener">OSRM / OSM</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener">Corrigir mapa</a>';
 map.attributionControl?.addAttribution(attribution);
 const fresh=p=>p.fresh&&Date.now()-p.observed_at<=180000&&typeof p.latitude==='number'&&typeof p.longitude==='number';
 const valid=(r,p)=>r&&r.routeKey===p.routeKey&&r.attendanceId===p.id&&r.expiresAt>Date.now()&&distance(r.origin,[p.latitude,p.longitude])<75;
 const visible=()=>last?.positions.filter(p=>(!selected||p.user_id===selected)&&fresh(p))||[];
 function paint(){
  group.clearLayers();if(!last||stopped||document.hidden)return;
  const people=new Map();for(const r of last.routes)people.set(r.user_id,last.positions.find(p=>p.user_id===r.user_id)?.name||r.technician_name||'Técnico');for(const p of last.positions)people.set(p.user_id,p.name);
  if(selected&&!people.has(selected))selected='';select.replaceChildren(new Option('Todos os técnicos',''),...[...people].map(([id,name])=>new Option(name,id)));select.value=selected;
  const positions=visible(),messages=[];let ready=0;
  for(const p of positions){
   const marker=L.circleMarker([p.latitude,p.longitude],{radius:7,color:'#fff',weight:2,fillColor:'#006D77',fillOpacity:1}).addTo(group),text=document.createElement('div');
   text.textContent=p.name+' · demanda #'+p.number+' · '+(p.unit_name||'Unidade')+' · posição '+new Date(p.observed_at).toLocaleTimeString('pt-BR')+' · precisão aproximada '+Math.round(p.accuracy)+' m';marker.bindTooltip(text);
   const r=routes.get(p.user_id);
   if(valid(r,p)&&r.status==='ready'){
    L.polyline(r.geometry.coordinates.map(([lon,lat])=>[lat,lon]),{color:'#006D77',weight:2,dashArray:'5 7',className:'dispatch-route-line',interactive:false}).addTo(group);ready++;
   }else if(valid(r,p)&&r.status==='unavailable')messages.push(p.name+': '+r.message+(r.requestNumbers?.length?' Demandas '+r.requestNumbers.map(n=>'#'+n).join(', ')+'.':''));
  }
  for(const id of routes.keys())if(!last.positions.some(p=>p.user_id===id&&fresh(p)))routes.delete(id);
  const stale=last.positions.filter(p=>(!selected||p.user_id===selected)&&!fresh(p)).length;
  status.textContent=positions.length+' técnico(s) com posição recente'+(stale?' · '+stale+' sem posição atual':'')+(ready?' · '+ready+' roteiro(s) pelas ruas, na ordem do root.':'')+(positions.length>ready+messages.length?' Calculando ruas…':'')+(messages.length?' '+messages.join(' '):'');
 }
 function schedule(ms=0){clearTimeout(retryTimer);if(!stopped&&!document.hidden)retryTimer=setTimeout(calculate,ms);}
 async function calculate(){
  if(stopped||document.hidden||calculating||!last)return;
  const p=visible().find(p=>!valid(routes.get(p.user_id),p));if(!p)return;
  calculating=true;routeAbort=new AbortController();const timeout=setTimeout(()=>routeAbort?.abort(),13000);let delay=1300;
  try{
   const response=await fetch('/api/dispatch/road-route?technician='+encodeURIComponent(p.user_id),{signal:routeAbort.signal});
   if(!response.ok)throw Error('routing');const r=await response.json();
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
  try{const r=await fetch('/api/dispatch/map',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('map');const value=await r.json();if(stopped||document.hidden)return;last=value;paint();schedule();}
  catch{if(stopped)return;last=null;routes.clear();group.clearLayers();status.textContent='Localização indisponível. Aguardando atualização.';}
  finally{busy=false;}
 }
 select.onchange=()=>{selected=select.value;paint();schedule();};
 const onVisible=()=>{if(document.hidden){routeAbort?.abort();clearTimeout(retryTimer);group.clearLayers();}else update();};
 document.addEventListener('visibilitychange',onVisible);const timer=setInterval(update,15000);update();
 return ()=>{stopped=true;clearInterval(timer);clearTimeout(retryTimer);routeAbort?.abort();document.removeEventListener('visibilitychange',onVisible);group.remove();control.remove();map.attributionControl?.removeAttribution(attribution);};
}
