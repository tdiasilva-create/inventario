// Run the actual routing module in workerd, not Node's Fetch implementation.
const assert=require('node:assert/strict'),fs=require('node:fs'),{createRequire}=require('node:module');
(async()=>{
 const {Miniflare,convertV4MiniflareOptions}=createRequire(require.resolve('wrangler'))('miniflare');
 const fixture=JSON.parse(fs.readFileSync('tests/fixtures/public-road-paco-d106.json','utf8'));
 const source=`import {roadRoute} from './server/dispatch-road-routing.mjs';
 export default {async fetch(request){
  const now=Date.now(),position={id:'attendance-test',request_id:'task-test',user_id:'user-test',latitude:-2.54,longitude:-44.17,observed_at:now,received_at:now},stop={id:'task-test',user_id:'user-test',unit_id:'unit-test',latitude:-2.535,longitude:-44.167};
  let calls=0,mode;
  const env={DB:{
   batch:async()=>[{results:[position]},{results:[stop]},{results:[]}],
   prepare:()=>({bind(){return this;},first:async()=>null,run:async()=>({meta:{changes:1}})})
  }};
  const redirect=new URL(request.url).searchParams.has('redirect');
  env.ROUTING_FETCH=async(url,init)=>{calls++;const outgoing=new Request(url,init);mode=outgoing.redirect;return redirect?new Response('',{status:302,headers:{Location:'https://must-not-follow.invalid/'}}):Response.json(${JSON.stringify(fixture)});};
  const response=await roadRoute(env,'user-test',{json:value=>Response.json(value)});return Response.json({result:await response.json(),calls,mode});
 }};`;
 const built=await require('esbuild').build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'routing-runtime-entry.mjs'},bundle:true,format:'esm',platform:'browser',write:false});
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-10-27',script:built.outputFiles[0].text}));
 try{
  const r=await(await mf.dispatchFetch('http://routing-test.local/')).json();assert.equal(r.result.status,'ready',JSON.stringify(r));assert.equal(r.mode,'manual');assert.equal(r.calls,1);assert.equal(r.result.geometry.coordinates.length,24);
  const redirect=await(await mf.dispatchFetch('http://routing-test.local/?redirect')).json();assert.equal(redirect.result.status,'unavailable');assert.equal(redirect.calls,1);assert.equal(redirect.result.geometry,undefined);
  console.log(JSON.stringify({passed:true,runtime:'Cloudflare workerd',manualRedirectSupported:true,realModuleReturnsRoute:true,geometryPoints:24,redirectRefused:true}));
 }finally{await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
