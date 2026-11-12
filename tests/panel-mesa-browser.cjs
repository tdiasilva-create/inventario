// D-080: Worker real + SQLite isolado. Falhas HTTP injetadas apenas no navegador de teste.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{f,page,origin,errors}=h;
 const {seedLinkStates}=await import('./helpers/equipment-link-state.mjs'),s=seedLinkStates(f);
 const out='docs/05-qualidade/evidencias/mesa-dados-2026-11-10';fs.mkdirSync(out,{recursive:true});
 const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/'+name+'.png',animations:'disabled'});};
 const pulseReady=async()=>{await page.locator('#panel-pulse[data-state=ok]').waitFor();await page.waitForFunction(()=>document.querySelector('#panel-pulse a[href="/coletas-pendentes"] b')?.textContent!=='—');};
 const restartPulse=()=>page.evaluate(async()=>{document.dispatchEvent(new Event('visibilitychange'));});
 try{
  await page.setViewportSize({width:1440,height:900});await page.goto(origin+'/computadores?unidade='+s.unit);await pulseReady();
  await page.locator('.ops-machine [data-link-state=linked]').first().waitFor();
  const expected=await page.evaluate(async()=>{const fleet=await (await fetch('/api/operations/units')).json(),pending=await (await fetch('/api/inventory/pending-summary')).json();return [fleet.units.reduce((n,u)=>n+u.online,0),fleet.units.reduce((n,u)=>n+u.lost,0),fleet.units.reduce((n,u)=>n+u.unlinked,0),pending.collections.total,pending.demands.total,pending.hardware.total].map(n=>new Intl.NumberFormat('pt-BR').format(n));});
  assert.deepEqual((await page.locator('#panel-pulse b').allTextContents()).slice(0,6),expected);
  const badgeColor=state=>page.locator('.ops-machine [data-link-state='+state+']').first().evaluate(e=>getComputedStyle(e).backgroundColor);
  assert.notEqual(await badgeColor('linked'),await badgeColor('manual'));
  await shot('computadores-1440');
  await page.locator('.navigation a[href="/panorama"]').focus();
  await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().width>=231);
  assert.equal(await page.locator('.navigation a[href="/panorama"]>span').evaluate(e=>getComputedStyle(e).opacity),'1');
  await page.locator('[data-action=rail-pin]').click();
  assert.equal(await page.locator('.layout').evaluate(e=>getComputedStyle(e).marginLeft),'232px');
  await page.reload();await pulseReady();assert.equal(await page.locator('[data-action=rail-pin]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.layout').evaluate(e=>getComputedStyle(e).marginLeft),'232px');await shot('menu-fixo');
  await page.locator('[data-action=rail-pin]').click();await page.locator('h2').first().click();
  await page.keyboard.press('/');assert.equal(await page.locator('.search input').evaluate(e=>document.activeElement===e),true);
  // Rede indisponível não vira contagem zero nem erro infinito; a próxima leitura recupera.
  await page.route('**/api/inventory/panel-status?*',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"Falha isolada de teste"}'}));
  await page.evaluate(async()=>{document.querySelector('[data-pending-refresh]')?.click() || window.dispatchEvent(new Event('semed:pending-refresh'));});await page.waitForFunction(()=>document.querySelector('#panel-pulse a[href="/coletas-pendentes"] b').textContent==='—');assert.equal(await page.locator('#panel-pulse').getAttribute('data-state'),'ok');
  await page.unroute('**/api/inventory/panel-status?*');await page.evaluate(async()=>{document.querySelector('[data-pending-refresh]')?.click() || window.dispatchEvent(new Event('semed:pending-refresh'));});await pulseReady();
  await page.route('**/api/operations/units',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await restartPulse();await page.locator('#panel-pulse[data-state=erro]').waitFor();await page.unroute('**/api/operations/units');
  // Reinstalar a moldura cancela leituras e listeners antigos.
  await restartPulse();await restartPulse();await pulseReady();
  await page.goto(origin+'/panorama');await pulseReady();await page.locator('.panorama-matrix tbody tr').first().waitFor();await shot('panorama-1440');
  assert.equal(await page.locator('.panorama-edited>[data-layout-block]').count(),11);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'painel sem rolagem horizontal');
  await page.locator('[data-action=menu]').click();await page.locator('.sidebar.open').waitFor();await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-action=menu]').getAttribute('aria-label'),'Abrir menu');
  await page.locator('[data-action=menu]').click();await page.locator('.navigation a[href="/unidades"]').click();
  assert.equal(await page.locator('[data-action=menu]').getAttribute('aria-expanded'),'false');await shot('painel-390');
  for(const [width,height] of [[1440,900],[390,844]]){
   await page.setViewportSize({width,height});await page.goto(origin+'/login');await shot('login-'+width);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'login sem rolagem horizontal');
   assert.ok((await page.locator('#username').boundingBox()).height>=44);
   await page.getByLabel('Senha',{exact:true}).fill('TESTE ISOLADO');await page.getByRole('button',{name:'Mostrar senha'}).click();
   assert.equal(await page.locator('#password').getAttribute('type'),'text');await page.locator('#password').fill('');
   await page.getByRole('button',{name:'Esqueceu sua senha?'}).click();assert.equal(await page.locator('#reset-message').isVisible(),true);
  }
  await page.goto(origin+'/login?senha=alterada');assert.equal(await page.locator('#login-status').getAttribute('data-state'),'ok');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,pulseCounts:true,networkFailureRecovery:true,keyboardRail:true,pinnedReflow:true,mobileMenu:true,linkBadges:true,loginResponsive:true,productionWrites:false}));
 }catch(e){await shot('falha-mesa');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
