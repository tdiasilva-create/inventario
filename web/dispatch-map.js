export function mountDispatchMap(map,container){
 const L=window.L,group=L.layerGroup().addTo(map),control=L.control({position:'topleft'});let stopped=false,busy=false,selected='';
 const box=document.createElement('div');box.className='dispatch-map-control';box.style.marginLeft='48px';const label=document.createElement('label');label.textContent='Atendimentos técnicos';const select=document.createElement('select');select.setAttribute('aria-label','Roteiro do técnico');const status=document.createElement('small');status.setAttribute('role','status');box.append(label,select,status);L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);control.onAdd=()=>box;control.addTo(map);let last=null;
 const coords=(lat,lon)=>typeof lat==='number'&&Number.isFinite(lat)&&Math.abs(lat)<=90&&typeof lon==='number'&&Number.isFinite(lon)&&Math.abs(lon)<=180;
 function paint(){group.clearLayers();if(!last)return;const people=new Map();for(const r of last.routes)people.set(r.user_id,last.positions.find(p=>p.user_id===r.user_id)?.name||r.technician_name||'Técnico');for(const p of last.positions)people.set(p.user_id,p.name);
  if(selected&&!people.has(selected))selected='';select.replaceChildren(new Option('Todos os técnicos', ''),...[...people].map(([id,name])=>new Option(name,id)));select.value=selected;
  let fresh=0;for(const p of last.positions){if(selected&&p.user_id!==selected)continue;const current=p.fresh&&Date.now()-p.observed_at<=180000;if(!current||!coords(p.latitude,p.longitude))continue;fresh++;
   const marker=L.circleMarker([p.latitude,p.longitude],{radius:7,color:'#fff',weight:2,fillColor:'#006D77',fillOpacity:1}).addTo(group);const text=document.createElement('div');text.textContent=p.name+' · demanda #'+p.number+' · '+(p.unit_name||'Unidade')+' · posição '+new Date(p.observed_at).toLocaleTimeString('pt-BR')+' · precisão aproximada '+Math.round(p.accuracy)+' m';marker.bindTooltip(text);
   const route=last.routes.filter(r=>r.user_id===p.user_id),active=route.find(r=>r.id===p.request_id);const remaining=[...(active?[active]:[]),...route.filter(r=>r.id!==p.request_id)];let segment=[[p.latitude,p.longitude]];
   // No invented road geometry: straight connectors of the visit sequence. A missing
   // coordinate breaks the segment, rather than silently routing past that unit.
   const draw=()=>{if(segment.length>1)L.polyline(segment,{color:'#006D77',weight:2,dashArray:'5 7',className:'dispatch-route-line',interactive:false}).addTo(group);};
   for(const r of remaining){if(coords(r.latitude,r.longitude))segment.push([r.latitude,r.longitude]);else{draw();segment=[];}}draw();
  }
  const stale=last.positions.filter(p=>(!selected||p.user_id===selected)&&(!p.fresh||Date.now()-p.observed_at>180000)).length;
  status.textContent=fresh+' técnico(s) com posição recente'+(stale?' · '+stale+' sem posição atual':'')+' · tracejado indica sequência, não vias.';
 }
 async function update(){if(stopped||busy||document.hidden)return;busy=true;try{const r=await fetch('/api/dispatch/map',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Acompanhamento indisponível');const value=await r.json();if(stopped)return;last=value;paint();}catch{if(stopped)return;group.clearLayers();status.textContent='Localização indisponível. Aguardando atualização.';}finally{busy=false;}}
 select.onchange=()=>{selected=select.value;paint();};const onVisible=()=>{if(document.hidden)group.clearLayers();else update();};document.addEventListener('visibilitychange',onVisible);const timer=setInterval(update,15000);update();return ()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);group.remove();control.remove();};
}
