import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';

export async function bundleDesktop(destination){
 const pages={'index.html':'desktop','operations.html':'operations','account.html':'account-entry','panel-search.html':'panel-search','pending-collections.html':'pending-collections','communication-log.html':'communication-log','dispatch.html':'dispatch','collection-control.html':'collection-control'};
 const result=await build({absWorkingDir:destination,entryPoints:Object.values(pages).map(n=>n+'.js'),bundle:true,format:'esm',target:'es2022',platform:'browser',outdir:resolve(destination,'bundles'),entryNames:'[name]-[hash]',minify:true,metafile:true,legalComments:'eof',plugins:[{name:'lazy-vendor',setup(b){b.onResolve({filter:/vendor\/heic-to\/heic-to.min.js$/},()=>({path:'/vendor/heic-to/heic-to.min.js',external:true}));}}]});
 const entries=Object.fromEntries(Object.entries(result.metafile.outputs).filter(([,v])=>v.entryPoint).map(([p,v])=>[v.entryPoint.replace(/\.js$/,''),'/'+p.replaceAll('\\','/')]));
 // Version only code/styles, never HTML/API/photographs. URL changes when bytes change.
 const css=await readFile(resolve(destination,'painel.css'));
 const cssPath='bundles/painel-'+createHash('sha256').update(css).digest('hex').slice(0,16)+'.css';
 await mkdir(resolve(destination,'bundles'),{recursive:true});await writeFile(resolve(destination,cssPath),css);
 for(const [page,entry] of Object.entries(pages)){
  const file=resolve(destination,page);let html=await readFile(file,'utf8');
  html=html.replace('href="/painel.css"','href="/'+cssPath+'"');
  if(entry==='account-entry')html=html.replace(/<script type="module" src="\/(?:account-shell|account|admin-units)\.js"><\/script>/g,'');
  else html=html.replace('<script type="module" src="/'+entry+'.js"></script>','');
  if(!entries[entry])throw Error('Entrada sem bundle: '+entry);
  html=html.replace('</body>','<script type="module" src="'+entries[entry]+'"></script></body>');
  await writeFile(file,html);
 }
 await writeFile(resolve(destination,'..','painel-bundles.json'),JSON.stringify({entries,cssPath,metafile:result.metafile},null,2)+'\n');
 return [...Object.keys(result.metafile.outputs).map(p=>relative(destination,resolve(destination,p)).replaceAll('\\','/')),cssPath];
}
