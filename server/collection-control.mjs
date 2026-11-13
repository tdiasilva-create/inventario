import {collectionScopeSql} from './unit-scope.mjs';
const statuses=['none','partial','complete'];
const scope=`u.active=1 AND ${collectionScopeSql('u')}`;
const state=`COALESCE(r.status,CASE WHEN EXISTS(SELECT 1 FROM collection_data_presence p WHERE p.unit_id=u.id) THEN 'partial' ELSE 'none' END)`;
const base=`FROM units u LEFT JOIN unit_collection_reviews r ON r.unit_id=u.id WHERE ${scope}`;
const search=" AND (?='' OR instr(lower(u.name_key),?)>0 OR instr(lower(u.name),lower(?))>0)";
const searchArgs=q=>[q,q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),q];
async function collectionTotals(db,q=''){
 const rows=(await db.prepare(`SELECT ${state} status,COUNT(*) total ${base+search} GROUP BY 1`).bind(...searchArgs(q)).all()).results;
 return Object.fromEntries(statuses.map(s=>[s,Number(rows.find(r=>r.status===s)?.total||0)]));
}
export async function collectionControlRoutes(request,url,user,env,{json,fail,body}){
 if(!url.pathname.startsWith('/api/collection-control'))return null;
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Acesso restrito ao painel.',403);
 const db=env.DB,path=url.pathname;
 if(path==='/api/collection-control/summary'&&request.method==='GET')return json({totals:await collectionTotals(db),scope:'network',server_time:Date.now()});
 if(path==='/api/collection-control'&&request.method==='GET'){
  const q=(url.searchParams.get('q')||'').trim(),filter=url.searchParams.get('status')||'',offset=Number(url.searchParams.get('offset')||0);
  if(q.length>120||filter&&!statuses.includes(filter)||!Number.isSafeInteger(offset)||offset<0)return fail('Filtro inválido.');
  const where=base+search,totals=await collectionTotals(db,q);
  const rows=(await db.prepare(`SELECT u.id,u.name,u.unit_type,${state} status,COALESCE(r.version,0) version,r.actor_name,r.updated_at,
   EXISTS(SELECT 1 FROM collection_data_presence p WHERE p.unit_id=u.id) has_data,
   (SELECT id FROM inspections WHERE unit_id=u.id AND state='open' LIMIT 1) inspection_id
   ${where} AND (?='' OR ${state}=?) ORDER BY u.name COLLATE NOCASE,u.id LIMIT 50 OFFSET ?`).bind(...searchArgs(q),filter,filter,offset).all()).results;
  const total=filter?totals[filter]:Object.values(totals).reduce((a,b)=>a+b,0);
  return json({items:rows,totals,total,offset,pageSize:50,nextOffset:offset+50<total?offset+50:null,server_time:Date.now(),canEdit:user.role==='root'});
 }
 if(path==='/api/collection-control/history'&&request.method==='GET'){
  const unitId=url.searchParams.get('unitId'),offset=Number(url.searchParams.get('offset')||0);
  if(!Number.isSafeInteger(offset)||offset<0)return fail('Página inválida.');
  const unit=await db.prepare(`SELECT id,name FROM units u WHERE id=? AND ${scope}`).bind(unitId).first();if(!unit)return fail('Unidade indisponível.',404);
  const rows=(await db.prepare('SELECT * FROM unit_collection_review_history WHERE unit_id=? ORDER BY created_at DESC,operation_id DESC LIMIT 51 OFFSET ?').bind(unitId,offset).all()).results;
  return json({unit,items:rows.slice(0,50),nextOffset:rows.length>50?offset+50:null});
 }
 if(path==='/api/collection-control/classify'&&request.method==='POST'){
  if(user.role!=='root')return fail('Somente root pode classificar a coleta.',403);
  const data=await body(request);
  if(!['partial','complete'].includes(data.status)||!Number.isSafeInteger(data.version)||data.version<0||typeof data.unitId!=='string'||!/^[a-f0-9-]{36}$/i.test(data.operationId||''))return fail('Classificação inválida.');
  const receipt=await db.prepare('SELECT * FROM unit_collection_review_history WHERE operation_id=?').bind(data.operationId).first();
  if(receipt){if(receipt.actor_id!==user.id||receipt.unit_id!==data.unitId||receipt.after_status!==data.status||receipt.version!==data.version+1)return fail('Identificador de operação já utilizado.',409);return json({ok:true,replayed:true,version:receipt.version});}
  const unit=await db.prepare(`SELECT u.id ${base} AND u.id=?`).bind(data.unitId).first();if(!unit)return fail('Unidade indisponível para coleta.',404);
  const current=await db.prepare('SELECT status,version FROM unit_collection_reviews WHERE unit_id=?').bind(data.unitId).first();
  if((current?.version||0)!==data.version)return fail('A classificação foi alterada em outra sessão. Atualize a lista antes de decidir.',409);
  if(current?.status===data.status)return json({ok:true,unchanged:true,version:current.version});
  const now=Date.now(),name=user.display_name||user.username;
  // Optimistic write + audit trigger are atomic. No change to inspection/publication states.
  const result=await db.prepare(`INSERT INTO unit_collection_reviews(unit_id,status,version,actor_id,actor_name,updated_at,operation_id)
   SELECT id,?,1,?,?,?,? FROM units u WHERE id=? AND ${scope}
   ON CONFLICT(unit_id) DO UPDATE SET status=excluded.status,version=unit_collection_reviews.version+1,actor_id=excluded.actor_id,actor_name=excluded.actor_name,updated_at=excluded.updated_at,operation_id=excluded.operation_id WHERE unit_collection_reviews.version=?`).bind(data.status,user.id,name,now,data.operationId,data.unitId,data.version).run();
  if(!result.meta.changes){
   const retry=await db.prepare('SELECT * FROM unit_collection_review_history WHERE operation_id=?').bind(data.operationId).first();
   if(retry?.actor_id===user.id&&retry.unit_id===data.unitId&&retry.after_status===data.status&&retry.version===data.version+1)return json({ok:true,replayed:true,version:retry.version});
   return fail('A classificação mudou. Atualize a lista.',409);
  }
  return json({ok:true,version:data.version+1});
 }
 return fail('Endereço ou método inválido.',405);
}
