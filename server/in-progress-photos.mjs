import {photoReadColumns,readPhotoAndStore} from './photo-read.mjs';
import {thumbnailResponse} from './photo-thumbnails.mjs';
import {describePhotos} from './photo-labels.mjs';
import {photoNotModified,photoResponse} from './photo-response.mjs';
import {StorageError} from './photo-storage.mjs';

const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/i.test(value);
function cursorValue(value){
 if(!value)return null;
 try{const v=JSON.parse(atob(value));return Array.isArray(v)&&v.length===2&&Number.isSafeInteger(v[0])&&uuid(v[1])?v:false;}catch{return false;}
}

// D-045: leitura de evidências recebidas, separada dos resultados oficiais.
export async function inProgressPhotoRead(request,url,user,env,{json,fail}){
 if(!['/api/inventory/in-progress-photos','/api/inventory/in-progress-photo'].includes(url.pathname))return null;
 if(!user)return fail('Autenticação necessária.',401);
 if(!['root','admin','visualizador'].includes(user.role))return fail('Consulta gerencial não permitida.',403);
 if(request.method!=='GET')return fail('Acompanhamento disponível somente para consulta.',405);
 const id=url.searchParams.get('id');if(!uuid(id))return fail('Vistoria inválida.');
 const db=env.DB,photoId=url.searchParams.get('photoId');
 const binary=url.pathname.endsWith('-photo');if(binary&&!uuid(photoId))return fail('Fotografia inválida.');
 const photo=binary?await readPhotoAndStore(env,db.prepare(`SELECT ${photoReadColumns(request)},i.state AS inspection_state FROM collection_photos p JOIN inspections i ON i.id=p.inspection_id AND i.unit_id=p.unit_id JOIN units u ON u.id=p.unit_id WHERE p.id=? AND i.id=? AND u.active=1 AND u.unit_type<>'Escola conveniada' AND p.status='ready'`).bind(photoId,id)):null;
 const joined=photo?.row;
 if(binary&&!joined)return fail('Fotografia recebida não encontrada nesta coleta.',404);
 const inspection=binary?{id,unit_id:joined.unit_id,state:joined.inspection_state}:await db.prepare("SELECT i.id,i.unit_id,i.state FROM inspections i JOIN units u ON u.id=i.unit_id WHERE i.id=? AND u.active=1 AND u.unit_type NOT IN (\'Escola conveniada\')").bind(id).first();
 if(!inspection)return fail('Vistoria indisponível.',404);
 if(url.pathname.endsWith('-photos')){
  if(inspection.state!=='open')return json({completed:true,items:[],ready:0,pending:0,nextCursor:null});
  const cursor=cursorValue(url.searchParams.get('cursor'));if(cursor===false)return fail('Página inválida.');
  const rows=(await db.prepare(`SELECT p.id,p.target_kind,p.target_id,p.status,p.created_at,
    COALESCE(NULLIF(u.display_name,''),u.username,'Usuário indisponível') AS created_by_name,
    e.name AS environment_name,COALESCE(json_extract(eq.data_json,'$.asset'),'') AS asset,
    eq.category AS equipment_category
    FROM collection_photos p LEFT JOIN users u ON u.id=p.created_by
    LEFT JOIN environments e ON p.target_kind='environment' AND e.id=p.target_id AND e.unit_id=p.unit_id
    LEFT JOIN inventory_equipment_all eq ON p.target_kind='equipment' AND eq.id=p.target_id AND eq.unit_id=p.unit_id
    WHERE p.inspection_id=? AND p.unit_id=? AND p.status IN ('ready','pending')
    ${cursor?'AND (p.created_at<? OR (p.created_at=? AND p.id<?))':''}
    ORDER BY p.created_at DESC,p.id DESC LIMIT 51`).bind(id,inspection.unit_id,...(cursor?[cursor[0],cursor[0],cursor[1]]:[])).all()).results;
  const counts=(await db.prepare('SELECT status,COUNT(*) AS total FROM collection_photos WHERE inspection_id=? AND unit_id=? GROUP BY status').bind(id,inspection.unit_id).all()).results;
  const page=rows.slice(0,50),last=page.at(-1);
  return json({items:await describePhotos(db,page),ready:counts.find(r=>r.status==='ready')?.total||0,pending:counts.find(r=>r.status==='pending')?.total||0,nextCursor:rows.length>50?btoa(JSON.stringify([last.created_at,last.id])):null});
 }

 if(inspection.state!=='open')return fail('Vistoria concluída. Consulte a galeria oficial da unidade.',409);
 const row=joined;
 if(!row)return fail('Fotografia recebida não encontrada nesta coleta.',404);
 try{
  const store=photo.store;
  if(!await store.enabled())return fail('Armazenamento de fotografias indisponível.',503);
  if(row.storage_provider&&store.provider!==row.storage_provider)return fail('O provedor desta fotografia não está ativo.',503);
  const thumbnail=thumbnailResponse(request,row);if(thumbnail)return thumbnail;const unchanged=photoNotModified(request,row);if(unchanged)return unchanged;const object=await store.get(row);if(!object)return fail('Arquivo da fotografia não encontrado.',404);
  return photoResponse(row,object);
 }catch(error){if(error instanceof StorageError)return fail(error.message,error.status);throw error;}
}
