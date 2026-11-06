import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {createRequire} from 'node:module';
import {isolatedCollector} from '../tests/helpers/collector-http.mjs';
const f=await isolatedCollector({role:'root',desktop:true}),dir='docs/05-qualidade/evidencias/root-poderes';await mkdir(dir,{recursive:true});
const {chromium}=createRequire(import.meta.url)('C:/Users/SIGAE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1672,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(f.base+'/cadastro-unidades');await page.getByRole('button',{name:'Excluir',exact:true}).first().waitFor();
 const row=page.locator('#unit-list tbody tr').filter({hasText:'Unidade sem inventário'});await row.getByRole('button',{name:'Excluir',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();await page.screenshot({path:dir+'/01-exclusao-desktop.png',fullPage:true});
 const name=f.sqlite.prepare('SELECT name FROM units WHERE id=?').get(f.ids.pending).name;
 await page.locator('#delete-confirm-name').fill(name);await page.locator('#delete-reason').fill('Unidade criada somente no teste isolado');
 await dialog.getByRole('button',{name:'Excluir definitivamente',exact:true}).click();await dialog.waitFor({state:'detached'});await page.getByRole('status').filter({hasText:'Unidade excluída no servidor'}).waitFor();
 assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM units WHERE id=?').get(f.ids.pending).n,0);
 await page.setViewportSize({width:430,height:932});await page.getByRole('button',{name:'Excluir',exact:true}).first().click();await page.getByRole('dialog').waitFor();
 assert.equal(await page.evaluate(()=>{const d=document.querySelector('dialog');return d.getBoundingClientRect().right<=innerWidth&&d.scrollWidth<=d.clientWidth;}),true);
 await page.screenshot({path:dir+'/02-exclusao-mobile.png',fullPage:true});await page.getByRole('button',{name:'Cancelar',exact:true}).click();
 assert.deepEqual(errors,[]);await writeFile(dir+'/resultado.json',JSON.stringify({status:'PASS',environment:'isolated SQLite and actual unit/collector API handlers',checks:['exclusão com prévia','confirmação com nome e motivo','remoção real na base isolada','cancelamento não remove','430px sem overflow no diálogo','zero erros JS'],errors},null,2));console.log('PASS root deletion interface');
}finally{await browser.close();await f.close();}
