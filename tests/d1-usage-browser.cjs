// Actual Worker + isolated SQLite/KV. No production data or provider calls.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,env,origin,f,errors}=h;
 const {parseUsage}=await import('../server/d1-usage.mjs');
 let reads=0,writes=0,cache;const seed=(r,w)=>{
  const now=Date.now(),sum={rowsRead:r,rowsWritten:w};
  const account={current:[{sum}],recent:[{sum:{rowsRead:1000,rowsWritten:1}}],history:[{dimensions:{date:new Date(now).toISOString().slice(0,10)},sum}]};
  cache={attemptAt:now,error:null,snapshot:parseUsage({data:{viewer:{accounts:[account]}}},now)};
 };
 env.USAGE_ACCOUNT_ID='TEST';env.CLOUDFLARE_ANALYTICS_TOKEN='TEST-ONLY';env.USAGE_CACHE={get:async()=>{reads++;return structuredClone(cache);},put:async()=>{writes++;}};
 const out='docs/05-qualidade/evidencias/medidor-d1-2026-11-12';fs.mkdirSync(out,{recursive:true});
 const shot=async name=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/'+name+'.png'});};
 const ready=()=>page.waitForFunction(()=>document.querySelector('[data-d1-usage] b')?.textContent.includes('%'));
 try{
  seed(3500000,2000);await page.setViewportSize({width:1440,height:900});await page.clock.install();await page.goto(origin+'/panorama');await ready();
  assert.equal(await page.locator('[data-d1-usage] b').innerText(),'70%');assert.equal(await page.locator('.d1-usage-pill').getAttribute('data-level'),'warning');
  assert.equal(await page.locator('.d1-usage-pill').evaluate(e=>e.previousElementSibling.querySelector('button').hasAttribute('data-pending-hardware')),true);
  await shot('faixa-root-70');await page.locator('[data-d1-usage]').click();await page.getByRole('heading',{name:'Uso diário do D1',exact:true}).waitFor();
  assert.match(await page.locator('.d1-usage-dialog').innerText(),/3\.500\.000/);assert.match(await page.locator('.d1-usage-dialog').innerText(),/21:00/);
  await page.locator('.d1-usage-dialog summary').click();await shot('detalhes-root-70');
  const firstReads=reads;await page.clock.fastForward(299000);assert.equal(reads,firstReads,'no metrics poll alongside 15s/60s reads');
  seed(1000,85000);await page.clock.fastForward(1100);await page.waitForFunction(()=>document.querySelector('.d1-usage-pill').dataset.level==='high');assert.equal(reads,firstReads+1);assert.equal(await page.locator('.d1-usage-dialog details').getAttribute('open'),'');
  assert.equal(await page.locator('.d1-usage-dialog summary').evaluate(e=>e===document.activeElement),true,'preserve focus during update');
  seed(4750000,0);await page.clock.fastForward(300000);await page.waitForFunction(()=>document.querySelector('.d1-usage-pill').dataset.level==='critical');await shot('aviso-95');
  cache.error='ANALYTICS_UNAVAILABLE';await page.clock.fastForward(300000);await page.locator('.usage-warning').waitFor();assert.match(await page.locator('.d1-usage-dialog').innerText(),/4\.750\.000/);assert.match(await page.locator('[data-d1-usage]').innerText(),/!/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('[data-d1-usage]').evaluate(e=>e===document.activeElement),true);
  // Browser disconnected: retain the preceding count; do not display a zero.
  await page.route('**/api/root/d1-usage',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"Falha de teste isolado"}'}));await page.clock.fastForward(300000);await page.locator('[data-d1-usage]').click();await page.waitForFunction(()=>document.querySelector('.usage-warning')?.textContent.includes('Falha de teste'));assert.match(await page.locator('.d1-usage-dialog').innerText(),/4\.750\.000/);
  await page.unroute('**/api/root/d1-usage');await page.keyboard.press('Escape');
  // Hidden tab pauses; resume only when due. No stacked timers on rebind.
  await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}));const beforeHidden=reads;await page.clock.fastForward(600000);assert.equal(reads,beforeHidden);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>document.querySelector('[data-d1-usage] b').textContent.includes('%'));await page.waitForTimeout(100);assert.equal(reads,beforeHidden+1);
  // New period must show waiting, preserving history but not prior-day metrics.
  cache.snapshot.date='2000-01-01';await page.clock.fastForward(300000);await page.waitForFunction(()=>document.querySelector('[data-d1-usage] b').textContent==='indisponível');await page.locator('[data-d1-usage]').click();assert.match(await page.locator('.d1-usage-dialog').innerText(),/Sem leitura deste período/);await page.keyboard.press('Escape');
  seed(120000,100);await page.setViewportSize({width:390,height:844});await page.reload();await ready();await page.locator('[data-d1-usage]').click();await shot('medidor-390');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('.d1-usage-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.keyboard.press('Escape');
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);const beforeNonRoot=reads;await page.reload();await page.locator('#panel-pulse').waitFor();await page.clock.fastForward(310000);assert.equal(await page.locator('[data-d1-usage]').count(),0);assert.equal(reads,beforeNonRoot);
  assert.equal(writes,0,'meter GET never writes KV or calls provider');assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,rootOnly:true,thresholds:[70,85,95],fiveMinutePolling:true,hiddenPause:true,failureKeepsCounts:true,midnightReset:true,mobile:true,productionWrites:false}));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
