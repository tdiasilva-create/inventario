import {assetResponse} from './asset-response.mjs';
import {collectorPages,collectorAssets,mobileAssets,canCollect} from '../shared/mobile-assets.mjs';
export {canCollect};
export async function mobilePublic(request,env){
 const path=new URL(request.url).pathname;
 if(env.APP_KIND==='collector'||request.method!=='GET'&&request.method!=='HEAD')return null;
 if(path!=='/app'&&!mobileAssets.map(f=>'/'+f).includes(path))return null;
 const url=new URL(request.url);if(path==='/app')url.pathname='/mobile-app.html';
 const r=await assetResponse(new Request(url,request),env);
 r.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'");
 r.headers.set('Permissions-Policy','camera=(self), geolocation=(self), microphone=()');return r;
}
export async function mobileCollector(request,env,user){
 if(env.APP_KIND==='collector')return null;
 const url=new URL(request.url),page=collectorPages[url.pathname],asset=collectorAssets.includes(url.pathname.slice(1));
 if(!page&&!asset)return null;
 if(!page&&!canCollect(user.role))return null;
 if(!canCollect(user.role))return new Response('Perfil sem permissão de coleta.',{status:403});
 if(page)url.pathname='/'+page;
 const r=await assetResponse(new Request(url,request),env);
 if(page){
  r.headers.set('X-Frame-Options','SAMEORIGIN');
  r.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'");
  r.headers.set('Permissions-Policy','camera=(self), geolocation=(), microphone=()');
 }
 return r;
}
