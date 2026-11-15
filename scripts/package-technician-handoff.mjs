// Creates a curated source/document handoff. Never exports private credentials,
// production database, APKs, signing keys or unselected assets.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve('.'),base=resolve('private-data/entregas/app-tecnico-2026-11-13');
const docs='docs/06-entregas/app-tecnico-2026-11-13';
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
const selected=new Set([
 '00_LEIA_ANTES_DE_TUDO.md','AGENTS.md','package.json','pnpm-lock.yaml',
 'docs/00-governanca/REGRAS_DE_PRECEDENCIA.md','docs/00-governanca/DECISOES.md',
 'docs/03-painel-desktop/ROTEIRO_TECNICO_D105.md',
 'docs/03-painel-desktop/ROTAS_PELAS_RUAS_D106.md',
 'docs/03-painel-desktop/AVATARES_TECNICOS_D107.md',
 'docs/04-dados-apis/ORCAMENTO_D1_D108.md',
 'docs/04-dados-apis/REVALIDACAO_LEITURAS_D110.md',
 'docs/07-operacao/11_ESTADO_ATUAL_D110.md',
 'docs/06-entregas/ROTEIRO_TESTES_TECNICO_D105.txt',
 'web/technician.html','web/technician.css','web/technician.js',
 'web/dispatch.html','web/dispatch.js','web/dispatch-map.js','web/technician-avatar.js',
 'web/painel-favicon.svg','web/tokens.css',
 'server/technical-dispatch.mjs','server/worker.mjs','server/security.mjs',
 'server/service-desk.mjs','server/dispatch-road-routing.mjs','server/technician-avatars.mjs',
 'scripts/build-technician-android.mjs','scripts/build-desktop.mjs',
 'scripts/verify-technical-release.mjs','scripts/capture-technician-handoff.cjs',
 'scripts/package-technician-handoff.mjs',
 'tests/technical-dispatch.test.mjs','tests/technical-dispatch-browser.cjs',
 'tests/dispatch-road-routing.test.mjs','tests/dispatch-road-routing-browser.cjs',
 'tests/dispatch-road-routing-runtime.cjs','tests/technician-avatars.test.mjs',
 'tests/technician-avatars-browser.cjs','tests/helpers/collector-db.mjs',
 'tests/helpers/panel-browser.cjs','tests/helpers/agent-client.mjs',
 'tests/helpers/playwright.cjs','tests/helpers/routing-provider.mjs',
]);
for(const dir of ['android/technician','migrations','web/vendor/barlow','web/vendor/chakra-petch']){
 for(const file of walk(resolve(dir)))selected.add(relative(root,file).split(sep).join('/'));
}
mkdirSync(base,{recursive:true});const manifest=[];
for(const file of [...selected].sort()){
 if(/(^|\/)(private-data|\.git|node_modules)(\/|$)|\.(apk|exe|keystore|jks|db|sqlite|env)$/i.test(file))throw Error('Forbidden source '+file);
 const source=resolve(file);if(!source.startsWith(root+sep)||!existsSync(source))throw Error('Missing/unexpected source '+file);
 const bytes=readFileSync(source);if(/gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(bytes.toString('utf8')))throw Error('Credential pattern in '+file);
 const target=join(base,'FONTES',file);mkdirSync(resolve(target,'..'),{recursive:true});copyFileSync(source,target);
 if(hash(readFileSync(target))!==hash(bytes))throw Error('Copy mismatch '+file);
 manifest.push({source:file,copy:'FONTES/'+file,bytes:bytes.length,sha256:hash(bytes)});
}
const textFiles=readdirSync(docs).filter(n=>n.endsWith('.txt')).sort();
for(const name of textFiles)copyFileSync(join(docs,name),join(base,name));
const compiled='COMPILADO_APP_TECNICO_SEMED_2026-11-13.txt';
writeFileSync(join(base,compiled),'\ufeff'+textFiles.map(n=>'\n'+'='.repeat(78)+'\nARQUIVO: '+n+'\n'+'='.repeat(78)+'\n\n'+readFileSync(join(docs,n),'utf8')).join('\n\n'),'utf8');
const captures=JSON.parse(readFileSync(join(base,'capturas.json'),'utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
writeFileSync(join(base,'GALERIA.html'),`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SEMED Técnico — referência atual</title><style>body{font:16px/1.5 system-ui;background:#f3f4f5;color:#16191d;margin:0}header{background:#fff;border-top:5px solid #ff4b1e;padding:24px}main{padding:24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}article{background:#fff;padding:16px;border:1px solid #d9dde1;border-radius:8px}h1{margin:0}h2{font-size:18px}img{display:block;width:auto;max-width:100%;max-height:650px;margin:auto;object-fit:contain;object-position:top}a{color:#b70029}small{display:block;color:#626b74}p{max-width:1000px}</style><header><h1>SEMED Técnico — aparência atual</h1><p>16 capturas locais do frontend atual. Dados sintéticos; GPS simulado. Não são proposta visual nova, produção ou teste Android físico. Clique na imagem para abrir em tamanho completo.</p><a href="${compiled}">Abrir compilado TXT completo</a></header><main>${captures.screenshots.map(s=>`<article><h2>${escape(s.file)}</h2><p>${escape(s.description)}</p><small>Viewport ${s.viewport.width} × ${s.viewport.height} · ${s.fullPage?'página completa':'somente viewport'}</small><a href="EVIDENCIAS/${s.file}"><img src="EVIDENCIAS/${s.file}" alt="${escape(s.description)}" loading="lazy"></a></article>`).join('')}</main></html>`);
writeFileSync(join(base,'MANIFESTO_FONTES.json'),JSON.stringify({generatedAt:new Date().toISOString(),baseCommit:git('rev-parse','HEAD'),branch:git('branch','--show-current'),repository:'https://github.com/tdiasilva-create/inventario',scope:'Recorte documental, não clone completo; novo tracking adiado',sources:manifest},null,2)+'\n');
const manifestPath=join(base,'MANIFESTO_ARQUIVOS.sha256');
const entries=walk(base).filter(p=>p!==manifestPath).sort().map(p=>({file:relative(base,p).split(sep).join('/'),sha256:hash(readFileSync(p))}));
writeFileSync(manifestPath,entries.map(e=>e.sha256+'  '+e.file).join('\n')+'\n');
for(const e of entries)if(hash(readFileSync(join(base,e.file)))!==e.sha256)throw Error('Package hash mismatch '+e.file);
const combined=readFileSync(join(base,compiled),'utf8');
console.log(JSON.stringify({output:base,sources:manifest.length,files:entries.length+1,screenshots:captures.screenshots.length,compiledBytes:Buffer.byteLength(combined),compiledLines:combined.split('\n').length,manifestVerified:true}));
