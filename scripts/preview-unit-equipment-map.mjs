// CUA preview only. In-memory synthetic database, localhost. Explicit --allow-edits permits two DEMO actions only.
import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
import {unitEquipmentMapFixture} from '../tests/helpers/unit-equipment-map.mjs';
import {session} from '../tests/helpers/agent-client.mjs';
import worker from '../server/worker.mjs';
const f=unitEquipmentMapFixture(),base=resolve('dist/painel'),out=resolve('private-data/mapa-setores-d121-2026-11-15');mkdirSync(out,{recursive:true});
const auth=await session(f,f.root),image=readFileSync(resolve(out,'demonstracao.png'));
f.sqlite.prepare('UPDATE collection_photos SET size=?').run(image.length);
const env={DB:f.db,APP_KIND:'panel',AUTH_PEPPER:'TEST-ONLY',AGENT_NETWORK_TESTS_PROVIDER:'cloudflare',PHOTO_STORAGE_PROVIDER:'r2',PHOTOS:{get:async()=>({body:image})},ASSETS:{fetch:async request=>{
 const path=resolve(base,'.'+new URL(request.url).pathname);if(!path.startsWith(base+sep))return new Response('',{status:404});
 try{return new Response(readFileSync(path),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'})[extname(path)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}}};
writeFileSync(resolve(out,'fixture.json'),JSON.stringify({unit:f.unit,room:f.room,second:f.second,empty:f.empty,first:f.items[0].id,moved:f.moved,orphan:f.orphan,otherUnit:f.ids.assigned}));
const page='/unidade?id='+f.unit;
let previewSignalFailure=false;
http.createServer(async(req,res)=>{
 try{
  const editing=req.method==='POST'&&process.argv.includes('--allow-edits')&&['/api/root/equipment-name','/api/root/equipment-delete'].includes(req.url);
  if(req.method!=='GET'&&!editing){res.writeHead(405).end('Preview is read-only');return;}
  if(req.url.startsWith('/preview-presence?')){
   const state=new URL(req.url,'http://localhost').searchParams.get('state');
   if(!['online','offline','failure'].includes(state)){res.writeHead(400).end('Invalid preview state');return;}
   previewSignalFailure=state==='failure';
   const at=new Date(Date.now()-(state==='offline'?3600000:0)).toISOString();
   f.sqlite.prepare("UPDATE agent_presence SET data_json=json_set(data_json,'$.last_live_contact_at',?,'$.last_reason','heartbeat') WHERE device_id=?").run(at,f.device);
   res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({demo:true,state}));return;
  }
  if(previewSignalFailure&&req.url.startsWith('/api/inventory/panel-status')){res.writeHead(503,{'Content-Type':'application/json'}).end(JSON.stringify({error:'DEMONSTRAÇÃO: falha de leitura simulada'}));return;}
  if(req.url==='/'){res.writeHead(302,{Location:page}).end();return;}
  if(req.url==='/preview-compact'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><meta charset="utf-8"><h1 style="font:16px sans-serif">DEMONSTRAÇÃO · viewport interno 390 × 844</h1><iframe title="Painel compacto de demonstração" style="width:390px;height:844px;border:1px solid #bbb" src="'+page+'"></iframe>');return;}
  const role=new URL(req.url,'http://localhost').searchParams.get('previewRole');if(['root','visualizador'].includes(role))f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);
  const chunks=[];if(editing)for await(const chunk of req)chunks.push(chunk);
  const request=new Request('https://panel.test'+req.url,{method:req.method,headers:{Cookie:auth.cookie,...(editing?{'Content-Type':'application/json','Origin':'https://panel.test','X-CSRF-Token':req.headers['x-csrf-token']||''}:{})},...(editing?{body:Buffer.concat(chunks)}:{})}),start=Date.now();
  const response=await worker.fetch(request,env,{waitUntil:()=>{}});
  if(req.url.startsWith('/api/'))appendFileSync(resolve(out,'preview-requests.jsonl'),JSON.stringify({path:req.url,status:response.status,ms:Date.now()-start})+'\n');
  const headers=Object.fromEntries(response.headers);delete headers['content-security-policy'];delete headers['x-frame-options']; // local embedding only, never application code
  res.writeHead(response.status,headers);res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e.message);res.writeHead(500).end('Erro na demonstração isolada');}
}).listen(8798,'127.0.0.1',()=>console.log('DEMONSTRAÇÃO: http://127.0.0.1:8798'+page));
