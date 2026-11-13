// Real browser + local Worker/SQLite, synthetic data only. No production writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs');
 const seed=seedEquipmentConsultation(h.f),responses=[];
 const out='docs/05-qualidade/evidencias/d1-read-cache-2026-11-12';fs.mkdirSync(out,{recursive:true});
 try{
  await page.route('https://**/*',r=>r.abort());
  page.on('response',r=>{if(new URL(r.url()).pathname==='/api/inventory/results')responses.push(r);});
  await page.clock.install({time:Date.now()});
  await page.goto(origin+'/panorama');
  await page.locator('#municipal-map[data-map-ready=true]').waitFor();
  await page.locator('#panel-pulse[data-state=ok]').waitFor();
  await page.waitForFunction(()=>!document.querySelector('.selected-panel')?.textContent.includes('Atualizando dados'));
  assert.equal(responses[0].status(),200);const initial=await responses[0].json();
  const next=async()=>{const wait=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/inventory/results');await page.clock.fastForward(15000);return wait;};
  assert.equal((await next()).status(),304);
  const map=await page.locator('#municipal-map').elementHandle();
  assert.equal((await next()).status(),304);
  assert.equal(await map.evaluate(el=>el===document.querySelector('#municipal-map')),true);
  h.f.sqlite.prepare("UPDATE equipments SET published_json=json_set(published_json,'$.operation','Não funciona') WHERE id=?").run(seed.items[0].id);
  const changed=await next();assert.equal(changed.status(),200);assert.notDeepEqual(await changed.json(),initial);
  assert.equal((await next()).status(),304);
  // Test the actual shared client module for HTTP failure and session invalidation.
  await page.route('**/test-read-client.js',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('web/desktop-request.js','utf8')}));
  const client=await page.evaluate(async()=>{const m=await import('/test-read-client.js');window.readCacheTest=m.readPanelJson;const a=await m.readPanelJson('/api/inventory/results');const b=await m.readPanelJson('/api/inventory/results');return JSON.stringify(a)===JSON.stringify(b);});
  assert.equal(client,true);
  await page.route('**/api/inventory/results',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'TESTE · falha de leitura'})}));
  assert.match(await page.evaluate(()=>readCacheTest('/api/inventory/results').then(()=>'',e=>e.message)),/falha de leitura/);
  await page.unroute('**/api/inventory/results');
  h.f.sqlite.prepare('UPDATE users SET active=0 WHERE id=?').run(h.f.root.id);
  assert.match(await page.evaluate(()=>readCacheTest('/api/inventory/results').then(()=>'',e=>e.message)),/sessão expirou/);
  h.f.sqlite.prepare('UPDATE users SET active=1 WHERE id=?').run(h.f.root.id);
  const fresh=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/inventory/results');
  await page.evaluate(()=>readCacheTest('/api/inventory/results'));assert.equal((await fresh).status(),200,'revoked session clears client validator');
  await page.evaluate(()=>{const tag=document.createElement('div');tag.textContent='TESTE LOCAL · Dados sintéticos · D-110';tag.style='position:fixed;bottom:0;right:0;background:white;padding:8px;z-index:99999';document.body.append(tag);});
  await page.screenshot({path:out+'/local-panorama.png'});
  assert.deepEqual(h.errors,[]);
  fs.writeFileSync(out+'/browser.json',JSON.stringify({passed:true,results:responses.map(r=>r.status()),checks:['real panel renders','unchanged 304','publication 200','map node preserved','503 explicit','401 clears validator','authorized return 200'],pageErrors:h.errors},null,2));
  console.log('D110 browser: PASS; revalidation, publication, explicit failures and auth recovery.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
