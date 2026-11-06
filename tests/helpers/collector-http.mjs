import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,sep} from 'node:path';
import {collectorFixture} from './collector-db.mjs';import {unitRoutes} from '../../server/units.mjs';import {collectorRoutes} from '../../server/collector.mjs';
export async function isolatedCollector({role='operador',desktop=false,extraEnv={}}={}){
 const fixture=collectorFixture(),root=resolve('web'),requests=[],user=role==='operador'?fixture.operator:{...fixture.root,role};
 const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);let response;requests.push({path:url.pathname,method:req.method});
 if(url.pathname==='/api/auth/me')response=Response.json({...user,csrf:'ISOLATED-TEST'});
 else if(url.pathname.startsWith('/api/')){const chunks=[];for await(const c of req)chunks.push(c);const request=new Request(url,{method:req.method,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});response=await unitRoutes(request,url,user,fixture.db,fixture.helpers)||await collectorRoutes(request,url,user,{DB:fixture.db,...extraEnv},fixture.helpers)||new Response('Not found',{status:404});}
 else if(desktop&&url.pathname==='/runtime-config.js')response=new Response('export const authEnabled=true;export const collectorUrl=null;',{headers:{'Content-Type':'text/javascript'}});
 else{const entry=desktop&&['/cadastro-unidades','/usuarios','/conta'].includes(url.pathname)?'account.html':desktop&&['/','/panorama','/coletas-em-andamento','/unidade'].includes(url.pathname)?'index.html':url.pathname==='/'?'collector.html':'.'+url.pathname,path=resolve(root,entry);if(!path.startsWith(root+sep))throw Error('Path');response=new Response(await readFile(path),{headers:{'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.woff2')?'font/woff2':path.endsWith('.jpg')?'image/jpeg':path.endsWith('.png')?'image/png':path.endsWith('.ttf')?'font/ttf':path.endsWith('.svg')?'image/svg+xml':'text/html'}});}
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500);res.end(String(e));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {...fixture,requests,base:'http://127.0.0.1:'+server.address().port,close:async()=>{await new Promise(r=>server.close(r));fixture.sqlite.close();}};
}
