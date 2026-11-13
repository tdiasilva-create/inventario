import {digest} from './security.mjs';

export const trackingCredential=v=>v&&typeof v==='object'&&typeof v.id==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v.id)&&typeof v.token==='string'&&/^[a-f0-9]{64}$/.test(v.token);
export const freshTrackingPosition=(p,now)=>p&&['latitude','longitude','accuracy','observedAt'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k]))&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180&&p.accuracy>0&&p.accuracy<=5000&&p.observedAt>=now-90000&&p.observedAt<=now+30000;
export const openTrackingQueue=`EXISTS(SELECT 1 FROM dispatch_open_counts qc WHERE qc.user_id=t.user_id AND qc.open_count>0)`;
export const trackingGuard=`t.ended_at IS NULL AND EXISTS(SELECT 1 FROM users tu JOIN dispatch_technicians tc ON tc.user_id=tu.id WHERE tu.id=t.user_id AND tu.active=1 AND tc.enabled=1 AND tu.credential_version=t.credential_version) AND ${openTrackingQueue}`;

// Called before cookie authentication, for these TWO exact native-only endpoints.
// This capability can only update its own last fix or end itself. It cannot read
// requests, coordinates, other users or the inventory and never extends a login.
export async function trackingMachineRoutes(request,url,env,{json,fail,body}){
 const stop=url.pathname==='/api/technician/tracking-stop';
 if(!stop&&url.pathname!=='/api/technician/tracking-heartbeat')return null;
 if(env.APP_KIND==='collector')return fail('Este módulo não pertence ao coletor.',403);
 if(request.method!=='POST')return fail('Método não permitido.',405);
 if(!request.headers.get('Content-Type')?.startsWith('application/json')||(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin))return fail('Origem ou conteúdo inválido.',403);
 const match=/^SEMED-Tracking ([a-f0-9-]{36})\.([a-f0-9]{64})$/i.exec(request.headers.get('Authorization')||'');
 if(!match)return fail('Credencial de localização necessária.',401);
 const id=match[1],hash=await digest(match[2]),db=env.DB,now=Date.now();
 if(stop){
  // Idempotent, including after expiration of the UI session. Do not disclose IDs.
  await db.prepare("UPDATE dispatch_tracking SET ended_at=?,end_reason='signed_out' WHERE id=? AND token_hash=? AND ended_at IS NULL").bind(now,id,hash).run();
  return json({ok:true,active:false});
 }
 const a=await body(request);
 if(a.position!==undefined&&!freshTrackingPosition(a.position,now))return fail('Localização atual indisponível.',422);
 const query=`SELECT t.id FROM dispatch_tracking t WHERE t.id=? AND t.token_hash=? AND ${trackingGuard}`;
 if(!await db.prepare(query).bind(id,hash).first())return fail('Acompanhamento encerrado. Abra o app para conferir sua fila.',410);
 if(a.position){
  const p=a.position;
  // Guard again in the same statement as the write: assignment/credentials can
  // be revoked after the read. Same/older fixes never revive an old position.
  const out=await db.prepare(`INSERT INTO dispatch_tracking_positions
   SELECT t.id,?,?,?,?,? FROM dispatch_tracking t WHERE t.id=? AND t.token_hash=? AND ${trackingGuard}
   ON CONFLICT(tracking_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,accuracy=excluded.accuracy,observed_at=excluded.observed_at,received_at=excluded.received_at
   WHERE excluded.observed_at>dispatch_tracking_positions.observed_at AND excluded.received_at-dispatch_tracking_positions.received_at>=15000`)
   .bind(p.latitude,p.longitude,p.accuracy,p.observedAt,now,id,hash).run();
  if(!out.meta.changes&&!await db.prepare(query).bind(id,hash).first())return fail('Acompanhamento encerrado.',410);
 }
 return json({ok:true,active:true,serverTime:now});
}

export async function cleanTracking(db,now){
 await db.batch([
  db.prepare(`UPDATE dispatch_tracking AS t SET ended_at=?,end_reason='authorization_ended' WHERE t.ended_at IS NULL AND NOT (${trackingGuard})`).bind(now),
  db.prepare('DELETE FROM dispatch_tracking_positions WHERE received_at<? OR observed_at<?').bind(now-180000,now-180000),
  db.prepare('DELETE FROM dispatch_tracking_routes WHERE expires_at<=?').bind(now)
 ]);
}
