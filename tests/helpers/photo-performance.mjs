// Isolated fixtures and counters; never uses network, credentials or remote D1.
import {collectorFixture} from './collector-db.mjs';
import {fakeGoogle,testEnv} from './fake-drive.mjs';
import {googleRoutes,googleCallback} from '../../server/google-auth.mjs';
import {collectorRoutes} from '../../server/collector.mjs';
import {photoGalleryRead} from '../../server/photo-gallery.mjs';
export const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64');
export async function photoFixture(){
 const f=collectorFixture(),google=fakeGoogle(),original=f.db;
 const counters={sql:0,batches:0,integrationReads:0};
 const wrap=(s,sql)=>({bind:(...p)=>wrap(s.bind(...p),sql),...Object.fromEntries(['first','all','run'].map(method=>[method,async()=>{counters.sql++;if(sql.startsWith('SELECT * FROM integration_tokens'))counters.integrationReads++;return s[method]();}]))});
 f.db={prepare:sql=>wrap(original.prepare(sql),sql),batch:async statements=>{counters.batches++;return original.batch(statements);}};
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',...testEnv()};
 const startUrl=new URL('http://painel.test/api/root/google/start');
 const start=await googleRoutes(new Request(startUrl),startUrl,f.root,env,{...f.helpers,fetchImpl:google.fetch});
 const callbackUrl=new URL('http://painel.test/api/root/google/callback?code=CODE-VALIDO&state='+new URL(start.headers.get('Location')).searchParams.get('state'));
 const connected=await googleCallback(new Request(callbackUrl,{headers:{Cookie:start.headers.get('Set-Cookie').split(';')[0]}}),callbackUrl,env,{audit:f.helpers.audit,fetchImpl:google.fetch});
 if(connected.status!==200)throw Error('Fixture OAuth failed');
 const call=(path,data)=>{const url=new URL('http://painel.test/api/collector/'+path),request=new Request(url,data?{method:'POST',body:JSON.stringify(data)}:{});return collectorRoutes(request,url,f.operator,env,f.helpers);};
 const realFetch=globalThis.fetch;globalThis.fetch=google.fetch;
 const started=await call('visit-start',{unitId:f.ids.pending});const {inspection}=await started.json();
 const upload=(id=crypto.randomUUID())=>{const url=new URL('http://painel.test/api/collector/photo-upload');return collectorRoutes(new Request(url,{method:'POST',headers:{'Content-Type':'image/png','X-Photo-Id':id,'X-Inspection-Id':inspection.id,'X-Target-Kind':'facade','X-Target-Id':f.ids.pending},body:png}),url,f.operator,env,f.helpers);};
 const read=(id,etag,gallery=false)=>{const url=new URL('http://painel.test'+(gallery?'/api/inventory/photo?id=':'/api/collector/photo?id=')+id),request=new Request(url,{headers:etag?{'If-None-Match':etag}:{}});return gallery?photoGalleryRead(request,url,f.root,env,f.helpers):collectorRoutes(request,url,f.operator,env,f.helpers);};
 const measure=async(action)=>{counters.sql=0;counters.batches=0;counters.integrationReads=0;const before=google.calls.length,response=await action();return {response,sql:counters.sql,batches:counters.batches,integrationReads:counters.integrationReads,drive:google.calls.length-before};};
 return {...f,google,env,inspection,upload,read,measure,close(){globalThis.fetch=realFetch;f.sqlite.close();}};
}
