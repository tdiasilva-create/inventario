import {digest} from './security.mjs';

const FRESH_MS=180000, CACHE_MS=120000, MOVEMENT_M=75, SNAP_M=500;
const PROVIDER='https://routing.openstreetmap.de/routed-car/route/v1/driving/';
export const routeCoordinates=(lat,lon)=>typeof lat==='number'&&Number.isFinite(lat)&&Math.abs(lat)<=90&&typeof lon==='number'&&Number.isFinite(lon)&&Math.abs(lon)<=180;
export function distanceMeters(a,b){
 const rad=Math.PI/180,dlat=(a[0]-b[0])*rad,dlon=(a[1]-b[1])*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dlon/2)**2;
 return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));
}
export async function readDispatchMap(db,now=Date.now()){
 const [positions,routes]=await db.batch([
  db.prepare(`SELECT t.id,t.request_id,t.user_id,COALESCE(NULLIF(u.display_name,''),u.username) AS name,p.latitude,p.longitude,p.accuracy,p.observed_at,p.received_at,r.number,r.unit_id,un.name AS unit_name,un.latitude AS destination_latitude,un.longitude AS destination_longitude FROM dispatch_attendances t JOIN dispatch_assignments a ON a.id=t.assignment_id AND a.ended_at IS NULL JOIN dispatch_technicians cap ON cap.user_id=t.user_id AND cap.enabled=1 JOIN users u ON u.id=t.user_id AND u.active=1 JOIN sessions s ON s.token_hash=t.session_hash AND s.expires_at>? AND s.credential_version=u.credential_version JOIN service_requests r ON r.id=t.request_id AND r.status!='Concluída' LEFT JOIN units un ON un.id=r.unit_id LEFT JOIN dispatch_positions p ON p.attendance_id=t.id WHERE t.ended_at IS NULL`).bind(now),
  db.prepare(`SELECT a.user_id,COALESCE(NULLIF(tech.display_name,''),tech.username) AS technician_name,r.id,r.number,r.unit_id,u.name,u.latitude,u.longitude,o.position FROM dispatch_assignments a JOIN dispatch_technicians cap ON cap.user_id=a.user_id AND cap.enabled=1 JOIN users tech ON tech.id=a.user_id AND tech.active=1 JOIN service_requests r ON r.id=a.request_id AND r.status!='Concluída' JOIN dispatch_order o ON o.request_id=r.id LEFT JOIN units u ON u.id=r.unit_id WHERE a.ended_at IS NULL ORDER BY o.position,r.number`)
 ]);
 const items=await Promise.all(positions.results.map(async p=>({...p,
  fresh:!!p.observed_at&&p.observed_at>=now-FRESH_MS&&p.received_at>=now-FRESH_MS,
  routeKey:await digest(JSON.stringify([p.id,...routes.results.filter(r=>r.user_id===p.user_id).map(r=>[r.id,r.unit_id,r.latitude,r.longitude])]))
 })));
 return {positions:items,routes:routes.results,serverTime:now};
}
async function context(db,userId){
 const map=await readDispatchMap(db),p=map.positions.find(p=>p.user_id===userId);
 if(!p?.fresh||!routeCoordinates(p.latitude,p.longitude))return null;
 return {p,stops:map.routes.filter(r=>r.user_id===userId)};
}
const unavailable=(code,message,extra={})=>({status:'unavailable',code,message,...extra});
function validateRoute(value,points){
 const r=value?.routes?.[0];
 if(value?.code!=='Ok'||!r||!Array.isArray(value.waypoints)||value.waypoints.length!==points.length||!Array.isArray(r.legs)||r.legs.length!==points.length-1)return null;
 if(r.geometry?.type!=='LineString'||!Array.isArray(r.geometry.coordinates)||r.geometry.coordinates.length<2||r.geometry.coordinates.length>80000)return null;
 if(!r.geometry.coordinates.every(c=>Array.isArray(c)&&c.length===2&&routeCoordinates(c[1],c[0]))||JSON.stringify(r.geometry).length>1500000)return null;
 if(!Number.isFinite(r.distance)||r.distance<0||!Number.isFinite(r.duration)||r.duration<0)return null;
 for(let i=0;i<points.length;i++){
  const w=value.waypoints[i];
  if(!Array.isArray(w?.location)||!routeCoordinates(w.location[1],w.location[0])||distanceMeters(points[i],[w.location[1],w.location[0]])>SNAP_M+5)return null;
 }
 // The public provider is not allowed to replace the origin/destination with arbitrary geometry.
 const line=r.geometry.coordinates;
 if(distanceMeters([line[0][1],line[0][0]],points[0])>SNAP_M+5||distanceMeters([line.at(-1)[1],line.at(-1)[0]],points.at(-1))>SNAP_M+5)return null;
 return {geometry:r.geometry,distance:r.distance,duration:r.duration};
}
async function limitedJson(response){
 if(Number(response.headers.get('content-length'))>2500000)throw Error('size');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2500000)throw Error('size');chunks.push(value);}}finally{await reader.cancel();}
 const all=new Uint8Array(size);let at=0;for(const chunk of chunks){all.set(chunk,at);at+=chunk.byteLength;}return JSON.parse(new TextDecoder().decode(all));
}
// Called only after the Worker's authentication, root authorization and app isolation.
export async function roadRoute(env,userId,{json}){
 const db=env.DB,c=await context(db,userId),now=Date.now();
 if(!c)return json(unavailable('NO_POSITION','Sem localização recente para calcular a rota.'));
 const {p,stops}=c,origin=[p.latitude,p.longitude],base={attendanceId:p.id,routeKey:p.routeKey,origin,observedAt:p.observed_at};
 if(!stops.length)return json({...base,...unavailable('NO_STOPS','Nenhuma demanda pendente neste roteiro.')});
 const missing=stops.filter(r=>!routeCoordinates(r.latitude,r.longitude));
 if(missing.length)return json({...base,...unavailable('MISSING_COORDINATES','Cadastre as coordenadas das unidades indicadas para calcular toda a sequência.',{requestNumbers:missing.map(r=>r.number)})});
 // Refuse requests above the provider bound explicitly; never silently skip stops.
 if(stops.length>99)return json({...base,...unavailable('TOO_MANY_STOPS','O roteiro ultrapassa 99 demandas. Reduza as atribuições pendentes para calcular as ruas.')});
 const cached=await db.prepare('SELECT * FROM dispatch_road_routes WHERE attendance_id=?').bind(p.id).first();
 if(cached&&cached.route_key===p.routeKey&&cached.expires_at>now&&distanceMeters(origin,[cached.origin_latitude,cached.origin_longitude])<MOVEMENT_M){
  return json({...JSON.parse(cached.response_json),cached:true});
 }
 // One durable gate across users, tabs and Worker isolates; no request burst on cold start.
 const token=crypto.randomUUID(),gate=await db.prepare('UPDATE dispatch_routing_gate SET next_at=?,lease_until=?,token=? WHERE id=1 AND next_at<=? AND lease_until<=?').bind(now+1200,now+15000,token,now,now).run();
 if(!gate.meta.changes)return json({...base,status:'waiting',message:'Aguardando cálculo das ruas.',retryAfterMs:1800});
 let result;
 try{
  const points=[origin,...stops.map(r=>[r.latitude,r.longitude])];
  const url=PROVIDER+points.map(([lat,lon])=>lon.toFixed(6)+','+lat.toFixed(6)).join(';')+'?overview=full&geometries=geojson&steps=false&alternatives=false&generate_hints=false&radiuses='+points.map(()=>SNAP_M).join(';');
  const response=await (env.ROUTING_FETCH||fetch)(url,{redirect:'error',signal:AbortSignal.timeout(9000),headers:{'User-Agent':'SEMED-Paco-Inventario/1.0 (+https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev)','Accept':'application/json'}});
  if(!response.ok){await response.body?.cancel();throw Error('provider');}
  const value=await limitedJson(response),route=validateRoute(value,points);
  result=route?{status:'ready',...route,provider:'OSRM / OpenStreetMap',requestIds:stops.map(r=>r.id)}:unavailable('NO_ROUTE','Não foi possível encontrar um trajeto por ruas para esta sequência. Confira as coordenadas das unidades.');
 }catch{result=unavailable('PROVIDER_UNAVAILABLE','Cálculo das ruas indisponível. Nova tentativa automática em instantes.');}
 finally{await db.prepare('UPDATE dispatch_routing_gate SET lease_until=0,token=NULL WHERE id=1 AND token=?').bind(token).run();}
 const current=await context(db,userId);
 if(!current||current.p.routeKey!==p.routeKey||distanceMeters(origin,[current.p.latitude,current.p.longitude])>=MOVEMENT_M)return json({...base,status:'changed',message:'Roteiro ou localização mudou durante o cálculo.'});
 const expiresAt=Date.now()+(result.status==='ready'?CACHE_MS:30000),out={...base,...result,calculatedAt:Date.now(),expiresAt,cached:false};
 await db.prepare(`INSERT INTO dispatch_road_routes(attendance_id,route_key,origin_latitude,origin_longitude,expires_at,response_json)
  SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM dispatch_attendances t JOIN dispatch_positions p ON p.attendance_id=t.id WHERE t.id=? AND t.ended_at IS NULL)
  ON CONFLICT(attendance_id) DO UPDATE SET route_key=excluded.route_key,origin_latitude=excluded.origin_latitude,origin_longitude=excluded.origin_longitude,expires_at=excluded.expires_at,response_json=excluded.response_json`).bind(p.id,p.routeKey,...origin,expiresAt,JSON.stringify(out),p.id).run();
 return json(out);
}
