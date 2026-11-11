// Worker real + SQLite em memória; nenhuma escrita em produção.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,env}=h;
 const {hardwareChange}=await import('./helpers/hardware-change.mjs');const s=await hardwareChange(f,env);
 f.sqlite.prepare('UPDATE units SET latitude=-2.54,longitude=-44.17 WHERE active=1').run();
 const out='docs/05-qualidade/evidencias/panorama-mapa-2026-11-10';fs.mkdirSync(out,{recursive:true});
 const map=page.locator('#municipal-map'),expand=page.locator('[data-action=map-expand]'),back=page.locator('[data-action=map-collapse]');
 const zoom=()=>map.getAttribute('data-map-zoom');
 const wheel=async delta=>{const b=await map.boundingBox();await page.mouse.move(b.x+b.width*.55,b.y+b.height*.5);await page.mouse.wheel(0,delta);await page.clock.runFor(800);};
 const state=()=>page.evaluate(()=>({zoom:document.querySelector('#municipal-map').dataset.mapZoom,base:document.querySelector('#municipal-map').dataset.mapBase,markers:[...document.querySelectorAll('.unit-map-marker')].map(n=>({id:n.dataset.unitId,path:n.getAttribute('d'),color:n.getAttribute('fill')})),counts:[...document.querySelectorAll('.map-operation strong')].map(n=>n.textContent)}));
 const shot=async name=>{await page.evaluate(()=>{if(document.querySelector('#test-label'))return;const n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';n.style.cssText='position:fixed;bottom:0;z-index:99999;background:#16191d;color:white;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(n);});await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');await map.locator(':scope[data-map-ready=true]').waitFor();
  await page.locator('.hardware-map-notice').waitFor();await page.waitForFunction(()=>document.querySelector('[data-schools-online] strong')?.textContent!=='—');await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(1000);
  const baseline=await state(),size=await page.locator('.map-operation').boundingBox(),normal=await page.locator('.map-panel').boundingBox();
  const markerCenter=()=>page.locator('.hardware-map-notice').evaluate(n=>{const r=n.getBoundingClientRect(),m=document.querySelector('#municipal-map').getBoundingClientRect();return [r.x+r.width/2-m.x,r.y+r.height/2-m.y];});const originalCenter=await markerCenter();
  const natural=await page.locator('.map-operation').evaluate(n=>({w:n.offsetWidth,h:n.offsetHeight}));
  assert.ok(Math.abs(size.width/natural.w-.7)<.003);assert.ok(Math.abs(size.height/natural.h-.7)<.003);
  assert.equal(await back.isVisible(),false);await wheel(-300);assert.equal(await zoom(),baseline.zoom,'roda desativada no cartão normal');await shot('panorama-depois');
  await expand.click();const handle=await map.elementHandle();assert.equal(new URL(page.url()).pathname,'/panorama');
  assert.equal(await page.locator('.map-expanded[aria-modal=true]').count(),1);assert.equal(await back.isVisible(),true);
  const full=await page.locator('.map-expanded').boundingBox();assert.deepEqual(full,{x:0,y:0,width:1672,height:1050});assert.equal(await zoom(),baseline.zoom);
  assert.equal(await page.evaluate(()=>!!document.elementFromPoint(300,20).closest('.map-expanded')),true,'mapa cobre o cabeçalho e o menu');
  await wheel(-350);assert.ok(Number(await zoom())>Number(baseline.zoom),'roda amplia no modo expandido');
  const z=await zoom();await page.clock.fastForward(61000);assert.equal(await zoom(),z);assert.equal(await handle.evaluate(n=>n===document.querySelector('#municipal-map')),true,'atualização mantém o mapa');
  assert.equal(await page.locator('.map-expanded').count(),1);await shot('mapa-ampliado');
  // A seleção mantém o mapa expandido e abre o diálogo existente sobre ele.
  await page.locator('.hardware-map-notice').click();await page.locator('.hardware-card').waitFor();assert.match(await page.locator('.hardware-dialog').innerText(),/TESTE-PC-001/);
  await shot('hardware-no-mapa-ampliado');await page.keyboard.press('Escape');assert.equal(await page.locator('.hardware-dialog[open]').count(),0);assert.equal(await page.locator('.map-expanded').count(),1);
  await back.click();assert.equal(await page.locator('.map-expanded').count(),0);assert.equal(await zoom(),baseline.zoom);assert.deepEqual(await page.locator('.map-panel').boundingBox(),normal);
  assert.deepEqual(await markerCenter(),originalCenter,'restaura o enquadramento original');
  // Clicar na unidade pode mudar apenas o destaque; geografia, cor e contagem persistem.
  const restored=await state();assert.equal(restored.base,baseline.base);assert.deepEqual(restored.counts,baseline.counts);assert.deepEqual(restored.markers.map(n=>[n.id,n.color]),baseline.markers.map(n=>[n.id,n.color]));
  assert.equal(await expand.evaluate(n=>n===document.activeElement),true);await wheel(-300);assert.equal(await zoom(),baseline.zoom);
  await expand.click();await page.keyboard.press('Escape');assert.equal(await page.locator('.map-expanded').count(),0);assert.equal(await page.locator('[inert]').count(),0);
  // Limpeza ao navegar e comportamento original da página Mapa da Rede.
  await expand.click();await page.evaluate(()=>{history.pushState({},'', '/mapa');window.dispatchEvent(new PopStateEvent('popstate'));});await page.locator('.large-map-grid').waitFor();await map.locator(':scope[data-map-ready=true]').waitFor();
  assert.equal(await page.locator('body.map-expanded-open').count(),0);assert.equal(await page.locator('[inert]').count(),0);assert.equal(await page.locator('.map-expanded').count(),0);
  await page.waitForFunction(()=>document.querySelector('[data-schools-online] strong')?.textContent!=='—');const separate=await page.locator('.map-operation').boundingBox();assert.ok(Math.abs(size.width/separate.width-.7)<.001);assert.ok(Math.abs(size.height/separate.height-.7)<.001);
  const mz=await zoom();await wheel(-300);assert.equal(await zoom(),mz);await shot('mapa-da-rede-preservado');
  await page.goto(origin+'/panorama');await map.locator(':scope[data-map-ready=true]').waitFor();
  await page.setViewportSize({width:390,height:844});await expand.click();await shot('mapa-ampliado-390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok((await back.boundingBox()).x>=0);await back.click();
  await page.setViewportSize({width:812,height:375});await expand.click();assert.deepEqual(await page.locator('.map-expanded').boundingBox(),{x:0,y:0,width:812,height:375});await shot('mapa-ampliado-paisagem');await page.keyboard.press('Escape');
  assert.deepEqual(h.errors,[]);const result={passed:true,size,normal,separate,scale:.7,wheel:true,returnButton:true,escape:true,updates:true,hardwareModal:true,otherMapUnchanged:true,mobile:true,landscape:true};fs.writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
