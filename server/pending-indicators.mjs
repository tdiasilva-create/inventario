import {collectionScopeSql} from './unit-scope.mjs';
// Uma unidade é uma pendência, mesmo com visitas antigas preservadas. Revisita aberta volta à fila.
export const collectionCTE=`WITH pending AS (
 SELECT u.id AS unit_id,u.name,u.code,u.unit_type,i.id AS inspection_id,i.updated_at,
 CASE WHEN i.id IS NOT NULL THEN 'in_progress'
 WHEN EXISTS(SELECT 1 FROM inspections old WHERE old.unit_id=u.id AND old.state='paused') THEN 'preserved'
 ELSE 'not_started' END AS state
 FROM units u LEFT JOIN inspections i ON i.unit_id=u.id AND i.state='open'
 WHERE u.active=1 AND ${collectionScopeSql('u')}
 AND (i.id IS NOT NULL OR NOT EXISTS(SELECT 1 FROM inspections done WHERE done.unit_id=u.id AND done.state='completed'))
)`;
// Mesma elegibilidade de D-081; leitura individual da notificação não é parecer.
export const hardwarePendingFrom=`FROM agent_notifications n
 JOIN units u ON u.id=n.unit_id JOIN equipments e ON e.id=n.equipment_id AND e.unit_id=n.unit_id
 LEFT JOIN agent_hardware_reviews hr ON hr.notification_id=n.id
 WHERE n.kind='hardware_change' AND hr.notification_id IS NULL`;
export const collectionCountsSql='SELECT state,total FROM panel_collection_counts WHERE total>0';
export async function readPendingSummary(db,hardwareTotal){
 const statements=[db.prepare(collectionCountsSql),db.prepare("SELECT unit_id,COUNT(*) AS total FROM service_requests WHERE status!='Concluída' GROUP BY unit_id ORDER BY unit_id")];
 if(hardwareTotal===undefined)statements.push(db.prepare('SELECT COUNT(*) AS total '+hardwarePendingFrom));
 const [collections,demands,hardware]=await db.batch(statements);
 const states={not_started:0,in_progress:0,preserved:0};for(const row of collections.results)states[row.state]=row.total;
 return {collections:{total:Object.values(states).reduce((a,b)=>a+b,0),...states},demands:{total:demands.results.reduce((sum,row)=>sum+row.total,0),units:demands.results},hardware:{total:hardwareTotal??hardware.results[0].total},scope:'network',server_time:new Date().toISOString()};
}
export async function pendingIndicatorsRoutes(request,url,user,env,{json,fail}){
 const path=url.pathname;
 if(!['/api/inventory/pending-summary','/api/inventory/pending-collections'].includes(path))return null;
 if(!user)return fail('Autenticação necessária.',401);
 if(env.APP_KIND==='collector'||!['root','admin','visualizador'].includes(user.role))return fail('Consulta disponível somente no painel.',403);
 if(request.method!=='GET')return fail('Consulta somente para leitura.',405);
 const db=env.DB;
 if(path.endsWith('/pending-summary')){
  return json(await readPendingSummary(db));
 }
 const offset=Number(url.searchParams.get('offset')||0),state=url.searchParams.get('state')||'',q=(url.searchParams.get('q')||'').trim();
 if(!Number.isSafeInteger(offset)||offset<0||!['','not_started','in_progress','preserved'].includes(state)||q.length>120)return fail('Filtros inválidos.');
 const where=(state?' AND state=?':'')+(q?" AND instr(lower(name||' '||COALESCE(code,'')),lower(?))>0":''),args=[...(state?[state]:[]),...(q?[q]:[])];
 const [total,page]=await db.batch([
  db.prepare(collectionCTE+' SELECT COUNT(*) AS total FROM pending WHERE 1=1'+where).bind(...args),
  db.prepare(collectionCTE+' SELECT * FROM pending WHERE 1=1'+where+' ORDER BY name COLLATE NOCASE,unit_id LIMIT 50 OFFSET ?').bind(...args,offset)
 ]);
 return json({items:page.results,total:total.results[0].total,offset,pageSize:50,nextOffset:offset+page.results.length<total.results[0].total?offset+50:null,server_time:new Date().toISOString()});
}
