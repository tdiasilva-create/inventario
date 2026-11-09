// Medição isolada (SQLite em memória + Drive simulado): quantas consultas D1 e chamadas ao Drive cada operação de foto gera.
// Executar a partir da raiz do repositório: node docs/08-revisao-producao-2026-11-08/evidencias/medir-fotos.mjs
import {collectorFixture} from '../../../tests/helpers/collector-db.mjs';
import {fakeGoogle,testEnv} from '../../../tests/helpers/fake-drive.mjs';
import {googleRoutes,googleCallback} from '../../../server/google-auth.mjs';
import {collectorRoutes} from '../../../server/collector.mjs';
import {photoGalleryRead} from '../../../server/photo-gallery.mjs';
import {inProgressPhotoRead} from '../../../server/in-progress-photos.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64');
const f=collectorFixture(),google=fakeGoogle(),env={DB:f.db,...testEnv()};
// Instrumenta o adaptador D1 do fixture: conta prepare() executados (first/all/run) e statements em batch.
let d1=0;const rawPrepare=f.db.prepare;f.db.prepare=function(sql){const s=rawPrepare.call(this,sql);const wrap=o=>({...o,bind:(...p)=>wrap(o.bind(...p)),first:async()=>{d1++;return o.first();},all:async()=>{d1++;return o.all();},run:async()=>{d1++;return o.run();}});return wrap(s);};
const rawBatch=f.db.batch;f.db.batch=async st=>{d1+=st.length;return rawBatch(st);};
const driveCalls=()=>google.calls.length;
const req=(path,data,init={})=>new Request('http://painel.test'+path,data?{method:'POST',body:JSON.stringify(data),...init}:init);
async function connect(){const start=await googleRoutes(req('/api/root/google/start'),new URL('http://painel.test/api/root/google/start'),f.root,env,{...f.helpers,fetchImpl:google.fetch});const location=new URL(start.headers.get('Location'));const state=location.searchParams.get('state'),cookie=start.headers.get('Set-Cookie').split(';')[0];const cb=new URL('http://painel.test/api/root/google/callback?code=CODE-VALIDO&state='+state+'&scope=https://www.googleapis.com/auth/drive.file');await googleCallback(new Request(cb,{headers:{Cookie:cookie}}),cb,env,{audit:f.helpers.audit,fetchImpl:google.fetch});}
const call=async(path,data,user=f.operator)=>{const r=req('/api/collector/'+path,data);return collectorRoutes(r,new URL(r.url),user,env,f.helpers);};
const upload=(i,kind,target,id,user=f.operator)=>collectorRoutes(new Request('http://t/api/collector/photo-upload',{method:'POST',headers:{'Content-Type':'image/png','X-Photo-Id':id,'X-Inspection-Id':i,'X-Target-Kind':kind,'X-Target-Id':target},body:png}),new URL('http://t/api/collector/photo-upload'),user,env,f.helpers);
const measure=async(label,fn)=>{const a=d1,b=driveCalls();const t=performance.now();const r=await fn();console.log(`${label.padEnd(58)} D1=${String(d1-a).padStart(2)}  Drive=${String(driveCalls()-b).padStart(2)}  status=${r?.status??'-'}`);return r;};
globalThis.fetch=google.fetch;
await connect();
const {inspection:i}=await (await call('v3-start',{unitId:f.ids.pending})).json();
const facadeId=crypto.randomUUID(),p2=crypto.randomUUID();
await measure('upload 1ª foto (fachada) — rota photo-upload',()=>upload(i.id,'facade',f.ids.pending,facadeId));
await measure('upload 2ª foto (mesma unidade, pasta já em cache D1)',()=>upload(i.id,'facade',f.ids.pending,p2));
await measure('GET /api/collector/photo (coletor, operador)',()=>collectorRoutes(req('/api/collector/photo?id='+facadeId),new URL('http://t/api/collector/photo?id='+facadeId),f.operator,env,f.helpers));
await measure('GET /api/inventory/in-progress-photo (painel, root)',()=>inProgressPhotoRead(req('/api/inventory/in-progress-photo?id='+i.id+'&photoId='+facadeId),new URL('http://t/api/inventory/in-progress-photo?id='+i.id+'&photoId='+facadeId),f.root,env,f.helpers));
await measure('GET /api/inventory/photo (galeria D-064, root)',()=>photoGalleryRead(req('/api/inventory/photo?id='+facadeId),new URL('http://t/api/inventory/photo?id='+facadeId),f.root,env,f.helpers));
await measure('GET /api/collector/inspection (abre a coleta; inclui v2Evidence)',()=>collectorRoutes(req('/api/collector/inspection?id='+i.id),new URL('http://t/api/collector/inspection?id='+i.id),f.operator,env,f.helpers));
console.log('\n(Não inclui a consulta de sessão feita em worker.mjs:current() nem a de handleAgentMachine; some +1 por requisição autenticada.)');
f.sqlite.close();
