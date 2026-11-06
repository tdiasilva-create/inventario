import {copyFile,mkdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('.'),destination=resolve(root,'dist','painel');
if(!destination.startsWith(root+sep)||destination===root||destination!==join(root,'dist','painel'))throw new Error('Destino de build fora do diretório permitido.');
// Only this verified build directory is replaced; never web/, docs/, or repository files.
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
const files=['index.html','desktop.js','desktop.css','desktop-icons.js','desktop-data.js','desktop-map.js','desktop-map.css','desktop-metrics.css','metric-icons.js','map-geography.js','runtime-config.js','data/map-v33.json','data/map-examples.json','vendor/leaflet/leaflet.js','vendor/leaflet/leaflet.css','vendor/leaflet/LICENSE.txt'];
files.push('login.html','login.css','login.js','assets/prefeitura-paco.png','assets/paisagem-login-v2.png','assets/login-network.svg');
files.push('desktop-progress.js','desktop-progress-photos.js','desktop-progress-photos.css','desktop-results.js');
files.push('collector-v3-schema.js','desktop-inventory.js','desktop-agents.js','collector-schema.js','collector-v2-schema.js','visit-schema.js');
files.push('account.html','account.js','account.css','admin-units.js','panel-shell.js','account-shell.js','panel-refinement.css','unit-schema.js','spreadsheet-io.js','vendor/exceljs/exceljs.min.js','vendor/exceljs/LICENSE.txt');
files.push('desktop-photos.js','desktop-photos.css','photo-viewer.js','vendor/chakra-petch/ChakraPetch-600.woff2','vendor/chakra-petch/LICENSE','vendor/barlow/Barlow-400.woff2','vendor/barlow/Barlow-600.woff2','vendor/barlow/LICENSE');
const manifest=[];
for(const file of files){
 const target=join(destination,file);await mkdir(resolve(target,'..'),{recursive:true});
 if(file==='runtime-config.js')await writeFile(target,'// The collector will have its own address: inventario-semed-lumiar.\nexport const collectorUrl="https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev";\nexport const authEnabled=true;\n');
 else await copyFile(join(root,'web',file),target);
 const bytes=await readFile(target);manifest.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(join(destination,'404.html'),'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Painel SEMED — endereço não encontrado</title><body style="background:#041927;color:#e5f5ff;font:16px Segoe UI,sans-serif;padding:60px;line-height:1.7"><h1>Endereço não encontrado</h1><p>Este endereço atende ao Painel Desktop SEMED de Paço do Lumiar.</p><p>O coletor atende no endereço próprio inventario-semed-lumiar.</p><a style="color:#42caff" href="/">Voltar ao painel</a></body></html>');
await writeFile(join(destination,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Robots-Tag: noindex, nofollow\n');
await writeFile(join(destination,'robots.txt'),'User-agent: *\nDisallow: /\n');
// Build evidence stays outside the published assets.
await writeFile(join(root,'dist','painel-manifest.json'),JSON.stringify({application:'painel-semed-paco',kind:'desktop-awaiting-official-data',collector:'inventario-semed-lumiar (future, not published)',files:manifest},null,2)+'\n');
if(files.some(f=>['app.js','domain.js','coleta.html','styles.css'].includes(f)))throw new Error('Coletor incluído no pacote do painel.');
console.log(JSON.stringify({destination,files:files.length+3,bytes:manifest.reduce((s,f)=>s+f.bytes,0),collectorIncluded:false}));

