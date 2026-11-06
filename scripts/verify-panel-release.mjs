// Public release checks after authentication integration: private assets must not be public.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2];if(!base)throw Error('Informe URL publicada.');const checks=[];
for(const path of ['/login','/login.html','/login.css','/login.js','/assets/prefeitura-paco.png','/assets/paisagem-login-v2.png','/assets/login-network.svg']){const r=await fetch(new URL(path,base),{redirect:'manual'});assert.equal(r.status,200,path);checks.push({path,status:r.status});}
for(const path of ['/panorama','/mapa','/unidades','/ambientes','/equipamentos','/ocorrencias','/relatorios','/planejamento','/exportar','/configuracoes','/operadores-unidades','/seguranca','/panel-shell.js','/unit-schema.js','/spreadsheet-io.js','/vendor/exceljs/exceljs.min.js','/','/index.html','/desktop.js','/account.html','/account.js','/conta','/administracao','/cadastro-unidades','/usuarios','/admin-units.js','/data/map-v33.json','/assets/referencia-visual.png','/.env','/.dev.vars','/private-data/ACESSOS_INICIAIS_SEMED.txt','/server/worker.mjs','/%64esktop.js']){const r=await fetch(new URL(path,base),{redirect:'manual'});assert.equal(r.status,302,path);assert.equal(r.headers.get('location'),'/login');checks.push({path,status:r.status});}
for(const path of ['/api/auth/me','/api/admin/users','/api/inspections','/api/root/units','/api/root/assignments','/api/units']){const r=await fetch(new URL(path,base),{redirect:'manual'});assert.equal(r.status,401,path);checks.push({path,status:r.status});}
await mkdir('docs/05-qualidade/evidencias/auth',{recursive:true});await writeFile('docs/05-qualidade/evidencias/auth/release.json',JSON.stringify({status:'PASS',base,checks},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length}));



