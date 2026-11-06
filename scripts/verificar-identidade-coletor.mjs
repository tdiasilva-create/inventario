// Sondas públicas, somente leitura: nenhum login, cadastro ou upload em produção.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {join} from 'node:path';
const base=process.argv[2];if(!base)throw Error('Informe a URL do coletor publicado.');
const out=process.argv[3]||'docs/05-qualidade/evidencias/identidade-2026-11-05';await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),checks=[];
for(const [url,file] of [['/login','collector-login.html'],['/collector.css','collector.css'],['/tokens.css','tokens.css'],['/collector-favicon.svg','collector-favicon.svg'],['/assets/paisagem-coleta.jpg','assets/paisagem-coleta.jpg'],['/vendor/chakra-petch/ChakraPetch-700.woff2','vendor/chakra-petch/ChakraPetch-700.woff2'],['/vendor/barlow/Barlow-400.woff2','vendor/barlow/Barlow-400.woff2'],['/vendor/jetbrains-mono/JetBrainsMono-Variable.woff2','vendor/jetbrains-mono/JetBrainsMono-Variable.woff2']]){
 const r=await fetch(new URL(url,base),{redirect:'manual'});assert.equal(r.status,200,url);const sha=hash(Buffer.from(await r.arrayBuffer()));assert.equal(sha,hash(await readFile('dist/coletor/'+file)),url+' corresponde ao build');checks.push({path:url,status:r.status,sha256:sha,contentType:r.headers.get('content-type')});
}
for(const url of ['/','/coleta-v3','/collector-v3.js','/collector-ui.js','/collector-v3.css','/api/auth/me','/api/collector/units','/api/collector/photo?id=TESTE-INEXISTENTE']){const r=await fetch(new URL(url,base),{redirect:'manual'});assert.equal(r.status,url.startsWith('/api/')?401:302,url);checks.push({path:url,status:r.status});}
const pw=createRequire(import.meta.url)(join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await pw.chromium.launch({headless:true,channel:'msedge'});
try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(new URL('/login',base).href);await page.getByRole('heading',{name:'Coleta em campo'}).waitFor();await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.fonts.check('700 32px "Chakra Petch"')));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:out+'/15-login-producao-390.png',fullPage:true});assert.deepEqual(errors,[]);}
finally{await browser.close();}
await writeFile(out+'/publicacao.json',JSON.stringify({passed:true,at:new Date().toISOString(),base,readOnly:true,authenticatedProductionTest:false,checks},null,2));console.log(JSON.stringify({passed:true,checks:checks.length,base}));
