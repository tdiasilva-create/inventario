import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import ExcelJS from 'exceljs';
import {unitColumns} from '../web/unit-schema.js';
const require=createRequire(import.meta.url),{request,chromium}=require('C:/Users/SIGAE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='https://painel-semed-paco-validacao.secretaria-municipal-de-educa-o-de-pa-o-do-lumiar.workers.dev';
const credentials=JSON.parse(await readFile('private-data/local-credentials.json','utf8')),clients={},checks=[],errors=[];
let browser;
const dir='docs/05-qualidade/evidencias/revisao-28';await mkdir(dir,{recursive:true});
const stamp=Date.now(),codeBase=30000000+Math.floor(Math.random()*50000000);
async function post(c,path,data){return c.r.post(base+path,{headers:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':c.csrf||''},data});}
async function all(c){return (await (await c.r.get(base+'/api/root/units')).json()).units;}
try{
for(const u of credentials){const c={r:await request.newContext()};assert.equal((await post(c,'/api/auth/login',u)).status(),200);c.csrf=(await(await c.r.get(base+'/api/auth/me')).json()).csrf;clients[u.username]=c;}
const root=clients.root;
for(const role of ['operador','visualizador','admin']){assert.equal((await clients[role].r.get(base+'/api/root/units')).status(),403);assert.equal((await post(clients[role],'/api/root/import-preview',{rows:[]})).status(),403);}
const unit={name:'TESTE ISOLADO '+stamp,code:String(codeBase),unit_type:'Escola municipal',region:'Polo de teste',manager_name:'Gestor de teste',latitude:'-2,54',longitude:'-44,16',active:true};
const made=await post(root,'/api/root/unit-save',unit);assert.equal(made.status(),201,await made.text());const id=(await made.json()).id;
assert.equal((await post(root,'/api/root/unit-save',unit)).status(),409);
const bad=await post(root,'/api/root/unit-save',{...unit,name:'TESTE inválido',code:'123',latitude:-3});assert.equal(bad.status(),400);assert.ok((await bad.json()).fields.code);
const count=(await all(root)).length;
let preview=await(await post(root,'/api/root/import-preview',{rows:[{...unit,name:'TESTE inválido',code:'999'}]})).json();assert.equal(preview.valid,false);assert.equal(preview.batchId,null);assert.equal((await all(root)).length,count);
const rows=Array.from({length:16},(_,i)=>({...unit,name:'TESTE LOTE '+stamp+' '+String(i).padStart(2,'0'),code:String(codeBase+10+i)}));
preview=await(await post(root,'/api/root/import-preview',{rows})).json();assert.equal(preview.valid,true);assert.ok(preview.batchId);assert.equal((await all(root)).length,count);
const commit=await post(root,'/api/root/import-confirm',{batchId:preview.batchId});assert.equal(commit.status(),200,await commit.text());assert.equal((await all(root)).length,count+16);
const again=await(await post(root,'/api/root/import-confirm',{batchId:preview.batchId})).json();assert.equal(again.alreadyImported,true);assert.equal((await all(root)).length,count+16);
const users=(await(await root.r.get(base+'/api/admin/users')).json()).users,operator=users.find(u=>u.username==='operador'),self=users.find(u=>u.username==='root');
assert.equal((await post(root,'/api/root/assignments',{userId:operator.id,unitIds:[id]})).status(),200);assert.deepEqual((await(await clients.operador.r.get(base+'/api/units')).json()).units.map(u=>u.id),[id]);
assert.equal((await post(root,'/api/root/user-role',{userId:self.id,role:'operador'})).status(),403);
checks.push('API: validação, duplicação, permissões; prévia sem escrita, confirmação e repetição idempotente; atribuições e proteção do root');
browser=await chromium.launch({channel:'chrome',headless:true,args:['--renderer-process-limit=1','--disable-gpu']});
const context=await browser.newContext({storageState:await root.r.storageState(),viewport:{width:870,height:1372}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const routes=['panorama','mapa','unidades','ambientes','equipamentos','ocorrencias','relatorios','planejamento','exportar','configuracoes','cadastro-unidades','usuarios','conta','operadores-unidades','seguranca'];
for(const path of routes){await page.goto(base+'/'+path);await page.locator('.sidebar').waitFor({state:'attached'});await page.waitForTimeout(350);assert.equal(await page.locator('h1').first().innerText(),'Inventário Tecnológico SEMED');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+path);await page.screenshot({path:dir+'/'+path+'-870.png',fullPage:true});}
await page.setViewportSize({width:1672,height:941});await page.goto(base+'/panorama');await page.locator('.navigation a[href="/unidades"]').click();await page.waitForURL('**/unidades');await page.locator('.navigation a[href="/equipamentos"]').click();await page.waitForURL('**/equipamentos');await page.goBack();assert.ok(page.url().endsWith('/unidades'));await page.reload();await page.waitForFunction(()=>document.title.includes('Unidades'));assert.ok((await page.title()).includes('Unidades'));await page.goForward();assert.ok(page.url().endsWith('/equipamentos'));checks.push('15 rotas reais, F5, Voltar/Avançar, shell comum e sem transbordamento em 870×1372');
await page.goto(base+'/cadastro-unidades');await page.locator('#unit-name').waitFor();await page.locator('#unit-form .submit').click();await page.waitForTimeout(100);assert.ok(await page.locator('#error-name').innerText());
await page.locator('#unit-name').fill('TESTE FORM '+stamp);await page.locator('#unit-code').fill(String(codeBase+30));await page.locator('#unit-type').selectOption('Escola municipal');await page.locator('#unit-lat').fill('-2,55');await page.locator('#unit-lng').fill('-44,15');assert.equal(await page.locator('#unit-mini-map .leaflet-interactive').count(),1);await page.locator('#unit-form .submit').click();await page.getByText('Unidade salva no servidor.',{exact:true}).waitFor();await page.reload();await page.locator('#unit-list-search').fill('TESTE FORM '+stamp);await page.locator('#unit-list').getByText('TESTE FORM '+stamp,{exact:true}).waitFor();await page.locator('#unit-list').getByRole('button',{name:'Editar',exact:true}).click();assert.equal(await page.locator('#unit-code').inputValue(),String(codeBase+30));
await page.locator('#unit-list-search').fill('');await page.locator('#units-next').click();assert.ok((await page.locator('#units-page').innerText()).includes('Página 2'));
await page.locator('#unit-import summary').click();for(const model of ['csv','xlsx']){const download=page.waitForEvent('download');await page.locator('#model-'+model).click();const d=await download;assert.ok(d.suggestedFilename().endsWith('.'+model));}
const csv='\ufeff'+unitColumns.map(c=>c[1]).join(';')+'\r\n'+unitColumns.map(([k])=>k==='name'?'TESTE CSV '+stamp:k==='code'?String(codeBase+31):k==='active'?'Ativa':String(unit[k]??'')).join(';');await writeFile('private-data/review.csv',csv);await page.locator('#import-file').setInputFiles('private-data/review.csv');await page.locator('#import-preview').click();await page.locator('#import-confirm:not([disabled])').waitFor();assert.equal((await all(root)).some(u=>u.name==='TESTE CSV '+stamp),false);page.once('dialog',d=>d.accept());await page.locator('#import-confirm').click();await page.getByText('1 unidade(s) importada(s) com confirmação do servidor.',{exact:true}).waitFor();
const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Unidades');sheet.addRow(unitColumns.map(c=>c[1]));sheet.addRow(unitColumns.map(([k])=>k==='name'?'TESTE XLSX '+stamp:k==='code'?String(codeBase+32):k==='active'?'Ativa':String(unit[k]??'')));await book.xlsx.writeFile('private-data/review.xlsx');await page.locator('#import-file').setInputFiles('private-data/review.xlsx');await page.locator('#import-preview').click();await page.locator('#import-confirm:not([disabled])').waitFor();page.once('dialog',d=>d.accept());await page.locator('#import-confirm').click();await page.getByText('1 unidade(s) importada(s) com confirmação do servidor.',{exact:true}).waitFor();
checks.push('Formulário real, vírgula, mapa, erros em campos, persistência/F5, edição, paginação; modelos e importação CSV/XLSX com confirmação');
await page.goto(base+'/exportar');for(const format of ['CSV','XLSX']){await page.locator('#export-format').selectOption(format);const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar',exact:true}).click();assert.ok((await download).suggestedFilename().endsWith('.'+format.toLowerCase()));}
await page.goto(base+'/usuarios');await page.locator('#users table').waitFor();assert.equal(await page.locator('#users tbody tr').count(),4);await page.locator('#profile-toggle').click();assert.equal(await page.getByRole('link',{name:'Minha conta',exact:true}).isVisible(),true);
for(const size of [{width:1672,height:941},{width:390,height:844}]){await page.setViewportSize(size);for(const path of ['panorama','cadastro-unidades','usuarios','conta','mapa']){await page.goto(base+'/'+path);await page.locator('.sidebar').waitFor({state:'attached'});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+size.width+' '+path);await page.screenshot({path:dir+'/'+path+'-'+size.width+'.png',fullPage:true});}}
checks.push('Exportações CSV/XLSX, tabela de usuários, avatar; telas em 1672×941 e 390×844');assert.deepEqual(errors,[]);
await writeFile(dir+'/resultado.json',JSON.stringify({status:'PASS',environment:'Cloudflare Worker e D1 isolados; registros TESTE apenas neste ambiente',checks,errors},null,2));console.log(JSON.stringify({status:'PASS',checks}));
}catch(e){console.error(e.stack);process.exitCode=1;}finally{await browser?.close();for(const c of Object.values(clients))await c.r.dispose();}



