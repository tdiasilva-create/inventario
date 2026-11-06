// D-064: consulta paginada de fotos recebidas; não publica nem modifica coletas.
import {photoStore,StorageError} from './photo-storage.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const kinds=['facade','environment','equipment','answer','occurrence'];
const from=`FROM collection_photos p JOIN units u ON u.id=p.unit_id JOIN inspections i ON i.id=p.inspection_id AND i.unit_id=p.unit_id`;
const eligible=`u.active=1 AND p.status='ready' AND i.state IN ('open','paused','completed') AND (i.state<>'completed' OR p.target_kind<>'equipment' OR EXISTS(SELECT 1 FROM inventory_equipment_all eq WHERE eq.id=p.target_id AND eq.unit_id=p.unit_id AND eq.published_json IS NOT NULL))`;
export async function photoGalleryRead(request,url,user,env,{json,fail}){
 if(!['/api/inventory/photos','/api/inventory/photo'].includes(url.pathname))return null;
 if(!user)return fail('Autenticação necessária.',401);
 if(!['root','admin','visualizador'].includes(user.role))return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Galeria disponível somente para consulta.',405);
 if(url.pathname==='/api/inventory/photo'){
  const id=url.searchParams.get('id');if(!uuid(id))return fail('Fotografia inválida.');
  const row=await env.DB.prepare(`SELECT p.* ${from} WHERE ${eligible} AND p.id=?`).bind(id).first();
  if(!row)return fail('Fotografia recebida não encontrada.',404);
  try{const store=photoStore(env);if(!await store.enabled())return fail('Armazenamento de fotografias indisponível.',503);if(row.storage_provider&&row.storage_provider!==store.provider)return fail('O provedor desta fotografia não está ativo.',503);const object=await store.get(row);if(!object)return fail('Arquivo da fotografia não encontrado.',404);return new Response(object.body,{headers:{'Content-Type':row.mime_type,'Cache-Control':'private, no-store','Content-Disposition':'inline','X-Content-Type-Options':'nosniff'}});}catch(e){if(e instanceof StorageError)return fail(e.message,e.status);throw e;}
 }
 const unit=url.searchParams.get('unitId')||'',kind=url.searchParams.get('kind')||'',scope=url.searchParams.get('scope')||'all';
 if((unit&&!uuid(unit))||(kind&&!kinds.includes(kind))||!['all','published','partial','paused'].includes(scope))return fail('Filtros de fotografias inválidos.');
 let cursor=null;try{if(url.searchParams.get('cursor')){cursor=JSON.parse(atob(url.searchParams.get('cursor')));if(!Array.isArray(cursor)||cursor.length!==2||!Number.isSafeInteger(cursor[0])||!uuid(cursor[1]))throw Error();}}catch{return fail('Página inválida.');}
 const where=`WHERE ${eligible} ${unit?'AND p.unit_id=?':''} ${kind?'AND p.target_kind=?':''} ${scope==='published'?"AND i.state='completed'":scope==='partial'?"AND i.state='open'":scope==='paused'?"AND i.state='paused'":''}`;
 const params=[...(unit?[unit]:[]),...(kind?[kind]:[])];
 const rows=(await env.DB.prepare(`SELECT p.id,p.unit_id,u.name AS unit_name,p.inspection_id,i.state AS inspection_state,p.target_kind,p.target_id,p.created_at,
 COALESCE(NULLIF(author.display_name,''),author.username,'Usuário indisponível') AS created_by_name
 ${from} LEFT JOIN users author ON author.id=p.created_by ${where}
 ${cursor?'AND (p.created_at<? OR (p.created_at=? AND p.id<?))':''}
 ORDER BY p.created_at DESC,p.id DESC LIMIT 49`).bind(...params,...(cursor?[cursor[0],cursor[0],cursor[1]]:[])).all()).results;
 const counts=(await env.DB.prepare(`SELECT i.state,COUNT(*) AS total ${from} ${where} GROUP BY i.state`).bind(...params).all()).results;
 const items=rows.slice(0,48),last=items.at(-1);
 return json({items,published:counts.find(x=>x.state==='completed')?.total||0,partial:counts.find(x=>x.state==='open')?.total||0,paused:counts.find(x=>x.state==='paused')?.total||0,nextCursor:rows.length>48?btoa(JSON.stringify([last.created_at,last.id])):null});
}
