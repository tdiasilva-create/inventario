// Isola a correção sobre o Worker publicado, mantendo a V2 local fora desta entrega.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='private-data/partial-photos-release';
const original=await readFile(dir+'/worker.js','utf8');
const anchor='async function inProgressRead(request, url, user, env, { json: json2, fail: fail2 }) {';
if(original.split(anchor).length!==2)throw Error('A versão publicada não corresponde ao ponto de integração esperado.');
if(original.includes('collector-v2'))throw Error('Baseline inesperada com V2.');
await writeFile(dir+'/worker-patched.js',"import {inProgressPhotoRead} from './in-progress-photos.mjs';\n"+original.replace(anchor,anchor+'\n const photoResponse=await inProgressPhotoRead(request,url,user,env,{json:json2,fail:fail2});if(photoResponse)return photoResponse;'));
for(const f of ['in-progress-photos.mjs','photo-storage.mjs'])await copyFile('server/'+f,dir+'/'+f);
const photoJs=await readFile('web/desktop-progress-photos.js','utf8'),photoCss=await readFile('web/desktop-progress-photos.css','utf8');
const transforms=[
 ['export function createProgressView({onCompleted=async()=>{}}={}){','export function createProgressView({onCompleted=async()=>{}}={}){\n const photographs=createProgressPhotos();'],
 [' function draw(){',' function draw(){\n  photographs.detach();'],
 ['\n }\n async function refresh(force=false)','\n  photographs.mount();\n }\n async function refresh(force=false)'],
 ["  error='';lastChecked=Date.now();","  await photographs.refresh(selected&&detail?.inspection.state==='open'?selected:null);\n  error='';lastChecked=Date.now();"]
];
const wrapper=`import original from './worker-patched.js';
const extra={
 '/desktop-progress-photos.js':${JSON.stringify(photoJs)},
 '/desktop-progress-photos.css':${JSON.stringify(photoCss)}
};
const changes=${JSON.stringify(transforms)};
export function patchAsset(path,text){
 if(path==='/desktop-progress.js'){
  text=text.replace(/\\r\\n/g,'\\n');
  for(const [before,after] of changes){if(text.split(before).length!==2)throw Error('Baseline do acompanhamento divergente.');text=text.replace(before,after);}
  return "import {createProgressPhotos} from './desktop-progress-photos.js';\\n"+text;
 }
 if(path==='/desktop.js')return text.replace('Sem fotografias recebidas.','Sem fotografias de vistorias concluídas.<br><a href="/coletas-em-andamento">Ver fotos e dados das coletas em andamento</a>');
 return text;
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||(!Object.hasOwn(extra,path)&&!['/desktop-progress.js','/desktop.js'].includes(path)))return original.fetch(request,env);
 const url=new URL(request.url);if(Object.hasOwn(extra,path))url.pathname='/desktop-progress.js';
 const headers=new Headers(request.headers);headers.delete('If-None-Match');headers.delete('If-Modified-Since');
 const response=await original.fetch(new Request(url,{method:'GET',headers}),env);
 if(response.status!==200)return response;
 try{
  const content=Object.hasOwn(extra,path)?extra[path]:patchAsset(path,await response.text());
  const output=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])output.delete(key);
  output.set('Content-Type',path.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8');
  return new Response(content,{status:200,headers:output});
 }catch{return new Response('Atualização da galeria indisponível.',{status:503,headers:{'Cache-Control':'no-store'}});}
}};
`;
await writeFile(dir+'/entry.mjs',wrapper);
const settings=JSON.parse(await readFile(dir+'/settings.json','utf8'));
const config={name:'painel-semed-paco',account_id:'ce059c2b3e50037922a441a66814090d',compatibility_date:settings.compatibility_date,main:'entry.mjs',workers_dev:true,preview_urls:false,keep_vars:true,
 d1_databases:[{binding:'DB',database_name:'semed-inventario-auth',database_id:'acb9a3dc-f667-44cf-a4f3-127641860f3e'}],
 unsafe:{metadata:{keep_assets:true,keep_bindings:['assets','secret_text','secret_key','plain_text','json']}}};
await writeFile(dir+'/wrangler.json',JSON.stringify(config,null,2));
await writeFile(dir+'/release.json',JSON.stringify({baseline:'c49b5260-5a00-48ef-b3e6-1a7a8091b39c',sha256:createHash('sha256').update(original).digest('hex'),changes:['private partial-photo endpoints','partial-photo gallery','official empty-state clarification'],v2Included:false,existingAssetsPreserved:true},null,2));
console.log({prepared:true,v2Included:false,existingAssetsPreserved:true});
