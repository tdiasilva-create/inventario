import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

// Keep the unbundled files for already-open clients. Only code/styles have an immutable URL.
export async function bundleCollector(destination){
 const result=await build({absWorkingDir:destination,entryPoints:['collector.js','collector-v3.js'],bundle:true,format:'esm',target:'es2022',platform:'browser',outdir:resolve(destination,'collector-bundles'),entryNames:'[name]-[hash]',minify:true,metafile:true,legalComments:'eof',plugins:[{name:'lazy-heic',setup(b){b.onResolve({filter:/vendor\/heic-to\/heic-to.min.js$/},()=>({path:'/vendor/heic-to/heic-to.min.js',external:true}));}}]});
 const entries=Object.fromEntries(Object.entries(result.metafile.outputs).filter(([,v])=>v.entryPoint).map(([p,v])=>[v.entryPoint.replace(/\.js$/,''),p.replaceAll('\\','/')]));
 const files=Object.keys(result.metafile.outputs).map(p=>p.replaceAll('\\','/'));
 await mkdir(resolve(destination,'collector-bundles'),{recursive:true});
 for(const name of ['collector','collector-v3']){
  // Tokens use root-relative font URLs; preserve cascade and rules exactly.
  const css=(await Promise.all(['tokens.css','collector.css',...(name==='collector-v3'?['collector-v3.css']:[])].map(f=>readFile(resolve(destination,f),'utf8')))).join('\n');
  const cssPath='collector-bundles/'+name+'-'+createHash('sha256').update(css).digest('hex').slice(0,16)+'.css';
  await writeFile(resolve(destination,cssPath),css);files.push(cssPath);
  const file=resolve(destination,name+'.html');let html=await readFile(file,'utf8');
  html=html.replace(/<link rel="stylesheet" href="\/(?:tokens|collector|collector-v3)\.css">/g,'');
  html=html.replace('</head>','<link rel="stylesheet" href="/'+cssPath+'"></head>');
  if(!entries[name])throw Error('Coleta sem bundle: '+name);
  html=html.replace('src="/'+name+'.js"','src="/'+entries[name]+'"');await writeFile(file,html);
 }
 await writeFile(resolve(destination,'..',destination.endsWith('coletor')?'coletor-bundles.json':'painel-coletor-bundles.json'),JSON.stringify({entries,files,metafile:result.metafile},null,2)+'\n');
 return files;
}
