import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const collector='https://inventario-semed-lumiar.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev',desktop='https://painel-semed-paco.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';
const checks=[];
for(const base of [collector,desktop]){const login=await fetch(base+'/login');assert.equal(login.status,200);const html=await login.text();assert.match(html,/SEMED/);const root=await fetch(base+'/',{redirect:'manual'});assert.equal(root.status,302);assert.equal(root.headers.get('location'),'/login');for(const path of ['/api/units','/api/inventory/summary','/api/inventory/in-progress','/api/inventory/in-progress-detail?id=unknown','/api/inventory/in-progress-equipment?id=unknown','/api/collector/inspection?id=unknown','/api/collector/photo?id=unknown'])assert.equal((await fetch(base+path)).status,401);checks.push(base+' · login HTTP 200, páginas privadas e APIs protegidas');}
assert.equal((await fetch(desktop+'/coletas-em-andamento',{redirect:'manual'})).status,302);
assert.match(await(await fetch(collector+'/login.js')).text(),/api\/auth\/login/);assert.equal((await fetch(collector+'/collector.css')).status,200);assert.equal((await fetch(collector+'/vendor/figtree/Figtree.ttf')).status,200);
await writeFile('docs/05-qualidade/evidencias/coletor-online/production-http.json',JSON.stringify({status:'PASS',checks,authenticatedProductionWrite:false},null,2));console.log(JSON.stringify({status:'PASS',checks}));

