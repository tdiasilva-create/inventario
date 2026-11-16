import {photoNotModified,photoResponse} from './photo-response.mjs';
import {photoStore} from './photo-storage.mjs';
import {operatorUnitAccess,operatorUnitParams} from './collector-access.mjs';
import {collectionScopeSql} from './unit-scope.mjs';
import {validThumbnail,thumbnailFrame} from './jpeg-thumbnail.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v);
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
// Invoke only AFTER photo state, profile, unit scope and active-provider checks.
export function thumbnailResponse(request,row){
 if(new URL(request.url).searchParams.get('size')!=='thumb'||!row.thumb_blob||row.thumb_source_sha256!==row.sha256||!row.thumb_sha256)return null;
 const bytes=row.thumb_blob instanceof ArrayBuffer?new Uint8Array(row.thumb_blob):new Uint8Array(row.thumb_blob);
 const thumbnail={sha256:row.thumb_sha256,mime_type:'image/jpeg'};
 return photoNotModified(request,thumbnail)||photoResponse(thumbnail,{body:bytes,contentLength:bytes.byteLength});
}
// Read dimensions from the JPEG frame, never trust dimensions/MIME sent by a client.
export const jpegDimensions=thumbnailFrame;
export async function thumbnailRoutes(request,url,user,env,{json,fail}){
 const backfill=url.pathname==='/api/root/photo-thumbnails',upload=url.pathname==='/api/collector/photo-thumb';
 if(!backfill&&!upload)return null;
 if(backfill&&(user.role!=='root'||env.APP_KIND==='collector'))return fail('Somente root no painel pode preparar fotografias antigas.',403);
 if(upload&&!['root','admin','operador'].includes(user.role))return fail('Perfil sem permissão de coleta.',403);
 const db=env.DB,force=backfill&&user.role==='root'&&url.searchParams.get('force')==='1';
 if(backfill&&request.method==='GET'){
  const cursor=url.searchParams.get('cursor')||'';let after=null;
  try{if(cursor){after=JSON.parse(atob(cursor));if(!Array.isArray(after)||after.length!==2||!Number.isSafeInteger(after[0])||!uuid(after[1]))throw Error();}}catch{return fail('Página inválida.');}
  const rows=(await db.prepare(`SELECT p.id,p.inspection_id,p.sha256,p.created_at,u.name AS unit_name
   FROM collection_photos p INDEXED BY ${force?'collection_photos_ready_date':'collection_photos_thumb_repair'} JOIN units u ON u.id=p.unit_id JOIN inspections i ON i.id=p.inspection_id AND i.unit_id=p.unit_id
   WHERE p.status='ready' ${force?'':'AND (p.thumb_blob IS NULL OR p.thumb_source_sha256 IS NOT p.sha256)'}
   AND u.active=1 AND u.unit_type<>'Escola conveniada' AND i.state IN ('open','paused','completed')
   AND (i.state<>'completed' OR p.target_kind<>'equipment' OR EXISTS(SELECT 1 FROM inventory_equipment_all e WHERE e.id=p.target_id AND e.unit_id=p.unit_id AND e.published_json IS NOT NULL))
   ${after?'AND (p.created_at,p.id)>(?,?)':''}
   ORDER BY p.created_at,p.id LIMIT 21`).bind(...(after?[after[0],after[1]]:[])).all()).results;
  const items=rows.slice(0,20),last=items.at(-1);return json({items,nextCursor:rows.length>20?btoa(JSON.stringify([last.created_at,last.id])):null});
 }
 if(request.method!=='POST')return fail('Método não permitido.',405);
 const id=request.headers.get('X-Photo-Id'),inspection=request.headers.get('X-Inspection-Id'),sourceHash=request.headers.get('X-Source-SHA256');
 if(!uuid(id)||!uuid(inspection)||!(/^[a-f0-9]{64}$/i.test(sourceHash||'')))return fail('Informe a fotografia, a visita e o hash da foto original.');
 const row=await db.prepare(`SELECT p.id,p.sha256,p.storage_provider,p.created_by,p.thumb_sha256,p.thumb_source_sha256,i.state
  FROM collection_photos p JOIN inspections i ON i.id=p.inspection_id AND i.unit_id=p.unit_id JOIN units u ON u.id=p.unit_id
  WHERE p.id=? AND p.inspection_id=? AND p.status='ready' AND u.active=1 AND u.unit_type<>'Escola conveniada'
  ${user.role!=='root'?'AND '+collectionScopeSql():''}
  ${user.role==='operador'?'AND '+operatorUnitAccess():''}`).bind(id,inspection,...(user.role==='operador'?operatorUnitParams(user):[])).first();
 if(!row)return fail('Fotografia recebida indisponível.',404);
 // Root maintenance may fill old photos without reopening a published visit; others only their own open visit photo.
 if(user.role!=='root'&&(row.created_by!==user.id||row.state!=='open'))return fail('Somente a miniatura de uma foto própria da visita aberta pode ser enviada.',403);
 if(row.sha256!==sourceHash)return fail('A fotografia original mudou. Atualize antes de preparar a miniatura.',409);
 const store=photoStore(env);if(!await store.enabled()||(row.storage_provider&&row.storage_provider!==store.provider))return fail('O armazenamento desta fotografia está indisponível.',503);
 if(request.headers.get('Content-Type')!=='image/jpeg')return fail('Miniatura deve ser JPEG.',415);
 if(Number(request.headers.get('Content-Length')||0)>65536)return fail('Miniatura limitada a 64 KB.',413);
 const reader=request.body?.getReader();if(!reader)return fail('Miniatura vazia.');
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();return fail('Miniatura limitada a 64 KB.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 const dimensions=await validThumbnail(bytes);if(!dimensions)return fail('Não foi possível ler a miniatura. Use uma imagem JPEG válida, de até 320 × 320 pixels. A foto original foi preservada.');
 const sha=await hash(bytes);
 if(!force&&row.thumb_sha256&&row.thumb_source_sha256===sourceHash)return json({id,status:'ready',thumbnail:true,repeated:true});
 const changed=await db.prepare(`UPDATE collection_photos SET thumb_blob=?,thumb_mime='image/jpeg',thumb_width=?,thumb_height=?,thumb_sha256=?,thumb_source_sha256=?,thumb_created_at=?,thumb_created_by=?
  WHERE id=? AND inspection_id=? AND status='ready' AND sha256=? ${force?'':'AND (thumb_blob IS NULL OR thumb_source_sha256 IS NOT sha256)'}
  AND EXISTS(SELECT 1 FROM units u WHERE u.id=collection_photos.unit_id AND u.active=1 AND u.unit_type<>'Escola conveniada')
  ${user.role!=='root'?"AND created_by=? AND EXISTS(SELECT 1 FROM inspections i JOIN units u ON u.id=i.unit_id WHERE i.id=collection_photos.inspection_id AND i.state='open' AND "+collectionScopeSql()+")":''}`)
  .bind(bytes.buffer,dimensions.width,dimensions.height,sha,sourceHash,Date.now(),user.id,id,inspection,sourceHash,...(user.role!=='root'?[user.id]:[])).run();
 if(!changed.meta.changes){const current=await db.prepare("SELECT thumb_sha256 FROM collection_photos WHERE id=? AND status='ready' AND sha256=? AND thumb_source_sha256=sha256").bind(id,sourceHash).first();if(current?.thumb_sha256)return json({id,status:'ready',thumbnail:true,repeated:true});return fail('Fotografia alterada durante o preparo. Atualize a página.',409);}
 return json({id,status:'ready',thumbnail:true,...dimensions},201);
}
