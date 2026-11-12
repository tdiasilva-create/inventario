import {photoStore,providerFor,DRIVE_PROVIDER} from './photo-storage.mjs';
// Original requests never transfer the thumbnail BLOB from D1 to the Worker.
export function photoReadColumns(request){
 const columns='p.id,p.unit_id,p.inspection_id,p.target_kind,p.target_id,p.object_key,p.mime_type,p.size,p.sha256,p.created_by,p.created_at,p.status,p.storage_provider,p.storage_ref';
 return columns+(new URL(request.url).searchParams.get('size')==='thumb'?',p.thumb_blob,p.thumb_sha256,p.thumb_source_sha256':'');
}
export async function readPhotoAndStore(env,statement){
 if(providerFor(env)!==DRIVE_PROVIDER)return {row:await statement.first(),store:photoStore(env)};
 // Fresh reads on EVERY request, in one D1 batch. No authorization cache.
 const [photo,integration]=await env.DB.batch([statement,env.DB.prepare('SELECT * FROM integration_tokens WHERE provider=?').bind(DRIVE_PROVIDER)]);
 return {row:photo.results[0]||null,store:photoStore(env,{integration:integration.results[0]||null})};
}
