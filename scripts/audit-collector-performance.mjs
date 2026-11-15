// Diagnostic only. Full Worker, in-memory SQLite and fake Drive; no production mode.
// Run: node scripts/audit-collector-performance.mjs [--serve]
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {AsyncLocalStorage} from 'node:async_hooks';
import worker from '../server/worker.mjs';
import {photoFixture,png} from '../tests/helpers/photo-performance.mjs';
import {session,humanFetch} from '../tests/helpers/agent-client.mjs';
const dir=process.env.SEMED_AUDIT_DIR||'private-data/audit-coleta-2026-11-15';mkdirSync(dir,{recursive:true});
const f=await photoFixture(),sess=await session(f,f.root),origin='https://painel.test';
const env={...f.env,APP_KIND:'panel'};
const start=await humanFetch(worker,env,origin,sess,'/api/collector/v3-start',{unitId:f.ids.pending,preservePrevious:true});
assert.equal(start.status,201);const inspectionId=start.data.inspection.id;
// Real handlers, synthetic image, fake Google. All writes confined to SQLite memory.
const photoIds=[];
for(let i=0;i<5;i++){
 const id=crypto.randomUUID();photoIds.push(id);
 const r=await worker.fetch(new Request(origin+'/api/collector/photo-upload',{method:'POST',headers:{Cookie:sess.cookie,Origin:origin,'X-CSRF-Token':sess.csrf,'Content-Type':'image/png','X-Photo-Id':id,'X-Inspection-Id':inspectionId,'X-Target-Kind':'facade','X-Target-Id':f.ids.pending},body:png}),env);
 assert.equal(r.status,201,await r.clone().text());
 // Read-path fixture only: bytes are synthetic. Dimensions are not being tested here.
 const thumbHash=Buffer.from(await crypto.subtle.digest('SHA-256',png)).toString('hex');
 f.sqlite.prepare("UPDATE collection_photos SET thumb_blob=?,thumb_sha256=?,thumb_source_sha256=sha256,thumb_mime='image/jpeg',thumb_width=1,thumb_height=1 WHERE id=?").run(png,thumbHash,id);
}
const als=new AsyncLocalStorage(),base=f.db,unwrap=new WeakMap();let delayMs=0;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function counted(s,sql){const p={bind:(...args)=>counted(s.bind(...args),sql)};for(const method of ['first','all','run'])p[method]=async()=>{
 const m=als.getStore();if(m){m.calls++;m.sql.push(sql.replace(/\s+/g,' '));if(delayMs)await pause(delayMs);}return s[method]();
};unwrap.set(p,s);return p;}
env.DB={prepare:sql=>counted(base.prepare(sql),sql),batch:async statements=>{const m=als.getStore();if(m){m.calls++;m.batchStatements+=statements.length;if(delayMs)await pause(delayMs);}return base.batch(statements.map(s=>unwrap.get(s)||s));}};
env.ASSETS={fetch:async request=>{const pathname=new URL(request.url).pathname,file=path.resolve(process.env.SEMED_AUDIT_ASSETS||'web','.'+pathname);if(!file.startsWith(path.resolve(process.env.SEMED_AUDIT_ASSETS||'web')+path.sep)||!existsSync(file))return new Response('not found',{status:404});return new Response(readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});}};
async function measure(route,{method='GET',body,headers={}}={}){
 const m={route:new URL(origin+route).pathname,method,calls:0,batchStatements:0,sql:[],delayPerBindingMs:delayMs},t=performance.now(),drive=f.google.calls.length;
 const response=await als.run(m,()=>worker.fetch(new Request(origin+route,{method,headers:{Cookie:sess.cookie,...(method==='POST'?{Origin:origin,'X-CSRF-Token':sess.csrf,'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env));
 const bytes=Buffer.from(await response.arrayBuffer());Object.assign(m,{elapsedMs:+(performance.now()-t).toFixed(1),status:response.status,bytes:bytes.length,googleCalls:f.google.calls.length-drive,cacheControl:response.headers.get('Cache-Control'),serverTiming:response.headers.get('Server-Timing')});
 return {m,response,bytes};
}
const rows=[];
for(const delay of [0,100]){delayMs=delay;for(const [name,route,options]of [
 ['mobile_me','/api/mobile/me'],['collector_js','/collector.js'],['v3_js','/collector-v3.js'],['auth_me','/api/auth/me'],['capabilities','/api/collector/capabilities'],
 ['resume_existing','/api/collector/v3-start',{method:'POST',body:{unitId:f.ids.pending}}],
 ['inspection','/api/collector/inspection?id='+inspectionId],['inspection_review','/api/collector/inspection?id='+inspectionId+'&review=1'],['environments','/api/collector/environments?inspectionId='+inspectionId],
 ['equipment_list','/api/collector/equipment-list?'+new URLSearchParams({unitId:f.ids.pending,inspectionId,category:'computers'})],
 ['review','/api/collector/review?id='+inspectionId],
 ['thumbnail','/api/collector/photo?id='+photoIds[0]+'&size=thumb'],['original','/api/collector/photo?id='+photoIds[0]]
 ]){const {m}=await measure(route,options);assert.equal(m.status,200,name);rows.push({name,...m});}}
const thumb=await measure('/api/collector/photo?id='+photoIds[0]+'&size=thumb');
const conditional=await measure('/api/collector/photo?id='+photoIds[0]+'&size=thumb',{headers:{'If-None-Match':thumb.response.headers.get('ETag')}});assert.equal(conditional.m.status,304);rows.push({name:'thumbnail_conditional',...conditional.m});
function dependencies(entry,seen=new Set()){if(seen.has(entry))return seen;seen.add(entry);const text=readFileSync('web/'+entry,'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*)['"](\.\/[^'"]+)['"]/g)){const next=path.posix.normalize(path.posix.join(path.posix.dirname(entry),m[1]));if(existsSync('web/'+next))dependencies(next,seen);}return seen;}
const entries=Object.fromEntries(['mobile-app.js','collector.js','collector-v3.js'].map(name=>{const files=[...dependencies(name)];return [name,{files,count:files.length,uncompressedBytes:files.reduce((sum,file)=>sum+readFileSync('web/'+file).length,0)}];}));
const report={generatedAt:new Date().toISOString(),method:'Full Worker + isolated SQLite/fake Drive. Delay 100ms per D1 binding is a sensitivity simulation, NOT production latency. Session included. No physical Android.',rows,entries};
writeFileSync(dir+'/isolated-api.json',JSON.stringify(report,null,2));console.log(JSON.stringify({rows:rows.map(({sql,serverTiming,...r})=>r),entries},null,2));
if(!process.argv.includes('--serve')){f.close();process.exit(0);}
// Leave capacity for camera/gallery exercises in the isolated UI, after measuring the five-photo fixture.
for(const id of photoIds.slice(1))f.sqlite.prepare('DELETE FROM collection_photos WHERE id=?').run(id);
delayMs=100;const uiEvents=[];let requestId=0;
writeFileSync(dir+'/local-http.ndjson','');
writeFileSync(dir+'/ui-events.json','[]');
const instrument=`(()=>{const p=document.createElement('pre');p.id='audit-metrics';p.style='font:11px monospace;white-space:pre-wrap;background:#fff3cd;color:#222;padding:6px;border:1px solid #777;position:relative;z-index:2000';document.body.append(p);const rows=[];function log(x){rows.push(x);p.textContent='TESTE LOCAL · SQLite/Drive simulados · 100ms por chamada D1\\n'+rows.slice(-10).map(x=>JSON.stringify(x)).join('\\n');fetch('/__audit/event',{method:'POST',body:JSON.stringify(x)}).catch(()=>{});}let pending=null;const heading=()=>document.querySelector('#collector h1')?.textContent||document.querySelector('h1')?.textContent||'';document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;pending={at:performance.now(),before:heading(),button:b.textContent.trim(),action:b.dataset.action,topic:b.dataset.topic};log({event:'click',button:pending.button,action:pending.action,topic:pending.topic});},true);new MutationObserver(()=>{if(pending&&heading()!==pending.before){log({event:'heading_changed',button:pending.button,after:heading(),ms:+(performance.now()-pending.at).toFixed(1)});pending=null;}}).observe(document.querySelector('#collector')||document.querySelector('main')||document.body,{childList:true,subtree:true,characterData:true});try{new PerformanceObserver(l=>l.getEntries().forEach(e=>log({event:'longtask',durationMs:+e.duration.toFixed(1)}))).observe({type:'longtask',buffered:true});}catch{};window.addEventListener('load',()=>setTimeout(()=>{const rs=performance.getEntriesByType('resource');log({event:'resources',count:rs.length,fetches:rs.filter(x=>x.initiatorType==='fetch').map(x=>({path:new URL(x.name).pathname,ms:+x.duration.toFixed(1)}))});},2000));})();`;
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:8797');let raw=Buffer.alloc(0);for await(const chunk of req)raw=Buffer.concat([raw,chunk]);
 if(url.pathname==='/__audit/event'){uiEvents.push(JSON.parse(raw.toString()));writeFileSync(dir+'/ui-events.json',JSON.stringify(uiEvents,null,2));res.writeHead(204);res.end();return;}
 if(url.pathname==='/audit-instrument.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(instrument);return;}
 if(url.pathname==='/'){res.writeHead(302,{Location:'/app/coleta/v3?'+new URLSearchParams({vistoria:inspectionId,tela:'cards'})});res.end();return;}
 const controlsFile=path.join(dir,'ui-controls.json'),controls=existsSync(controlsFile)?JSON.parse(readFileSync(controlsFile,'utf8')):{};
 if(controls.delays?.[url.pathname])await pause(controls.delays[url.pathname]);
 if(controls.failures?.includes(url.pathname)){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'TESTE ISOLADO: falha de rede simulada.'}));return;}
 const id=++requestId,t=performance.now(),m={route:url.pathname,method:req.method,calls:0,batchStatements:0,sql:[],delayPerBindingMs:delayMs};
 const headers=new Headers(req.headers);headers.set('Cookie',sess.cookie);if(req.method==='POST'){headers.set('Origin',origin);headers.set('X-CSRF-Token',sess.csrf);}headers.delete('host');
 const r=await als.run(m,()=>worker.fetch(new Request(origin+url.pathname+url.search,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:raw}: {})}),env));
 const h=Object.fromEntries(r.headers);delete h['content-length'];delete h['content-encoding'];let bytes=Buffer.from(await r.arrayBuffer());
 if(h['content-type']?.includes('text/html'))bytes=Buffer.from(bytes.toString().replace('</body>','<script src="/audit-instrument.js"></script></body>'));
 Object.assign(m,{id,elapsedMs:+(performance.now()-t).toFixed(1),status:r.status,bytes:bytes.length});delete m.sql;
 const {appendFileSync}=await import('node:fs');appendFileSync(dir+'/local-http.ndjson',JSON.stringify(m)+'\n');res.writeHead(r.status,h);res.end(bytes);
 }catch(e){res.writeHead(500);res.end(String(e.stack));}});
server.listen(8797,'127.0.0.1',()=>console.log('DIAGNOSTIC LOCAL ONLY http://127.0.0.1:8797 — no real credentials, data or network'));
process.on('SIGINT',()=>server.close(()=>{f.close();process.exit();}));
