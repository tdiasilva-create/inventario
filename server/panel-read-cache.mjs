import {digest} from './security.mjs';
import {databaseIdentity} from './request-timing.mjs';

// D-110. Every caller must authenticate/authorize BEFORE reaching this helper.
// Only stable catalogue data is memoized; never sessions, live presence or GPS.
export const revisionSql='SELECT epoch,revision FROM panel_read_versions WHERE name=?';
const token=row=>{if(!row)throw Error('Panel read revision unavailable');return row.epoch+':'+row.revision;};
export async function readRevision(db,name){return token(await db.prepare(revisionSql).bind(name).first());}
export async function conditionalResults(request,url,user,db){
 const revision=await readRevision(db,'results');
 // Different users, query scopes and representation versions never share validators.
 const etag='"'+await digest(JSON.stringify(['results-d110',user.id,user.role,url.searchParams.get('unitId')||'',revision]))+'"';
 const unchanged=request.headers.get('If-None-Match')===etag;
 return {revision,etag,unchanged,response:unchanged?new Response(null,{status:304,headers:{ETag:etag,'Cache-Control':'private, no-store','Vary':'Cookie'}}):null};
}
export async function finishResults(response,validation,db){
 // A concurrent write must not give a mixed response a reusable validator.
 if(await readRevision(db,'results')!==validation.revision)return response;
 const headers=new Headers(response.headers);headers.set('ETag',validation.etag);headers.set('Cache-Control','private, no-store');headers.set('Vary','Cookie');
 return new Response(response.body,{status:response.status,headers});
}

const catalogues=new WeakMap();
export async function readFleetStatic(db,catalogueSql,membersSql){
 const revision=await readRevision(db,'fleet'),identity=databaseIdentity(db);
 const previous=catalogues.get(identity);
 if(previous?.revision===revision)return previous.promise;
 const entry={revision,promise:null};
 entry.promise=(async()=>{
  // D1 batch is transactional. Revision and both sources come from one snapshot.
  const [version,units,members]=await db.batch([db.prepare(revisionSql).bind('fleet'),db.prepare(catalogueSql),db.prepare(membersSql)]);
  const actual=token(version.results[0]);
  if(actual!==revision&&catalogues.get(identity)===entry)catalogues.delete(identity);
  const result={units:units.results,members:members.results};
  // Bound retained memory per binding/isolate. Cold starts are safe and measured separately.
  if(JSON.stringify(result).length>2000000&&catalogues.get(identity)===entry)catalogues.delete(identity);
  return result;
 })().catch(error=>{if(catalogues.get(identity)===entry)catalogues.delete(identity);throw error;});
 catalogues.set(identity,entry);
 return entry.promise;
}
