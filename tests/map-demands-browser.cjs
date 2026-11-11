// D-094: Worker real + SQLite isolado. Nenhum teste modifica a conta oficial.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{f,env,page,origin,errors}=h;
 const {hardwareChange}=await import('./helpers/hardware-change.mjs'),hardware=await hardwareChange(f,env);
 const {seedMapDemands}=await import('./helpers/map-demands.mjs'),seed=seedMapDemands(f),unit=f.ids.pending;
 f.sqlite.prepare('UPDATE units SET students_total=1234,seats_available=0 WHERE id=?').run(unit);
 f.sqlite.prepare('UPDATE units SET students_total=NULL,seats_available=17 WHERE id=?').run(f.ids.progress);
 f.sqlite.prepare('UPDATE units SET students_total=0,seats_available=NULL WHERE id=?').run(f.ids.blocked);
 const out='docs/05-qualidade/evidencias/demandas-mapa-2026-11-11';fs.mkdirSync(out,{recursive:true});const writes=[];
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});
 const ring=id=>page.locator('.demand-map-notice[data-unit-id="'+id+'"]');
 const tick=async()=>{await page.clock.fastForward(16000);};
 const expectCount=(id,count)=>page.waitForFunction(({id,count})=>document.querySelector('.demand-map-notice[data-unit-id="'+id+'"]')?.dataset.demands===String(count),{id,count});
 const shot=async name=>{await page.evaluate(()=>{let n=document.getElementById('test-label');if(!n){n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Demandas sintéticas · Sem escrita em produção';n.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;padding:5px;text-align:center;font:12px sans-serif;pointer-events:none';document.body.append(n);}});await page.screenshot({path:out+'/'+name+'.png'});};
 const anchored=()=>page.evaluate(()=>[...document.querySelectorAll('.demand-map-notice')].every(a=>{const b=document.querySelector('.unit-map-marker[data-unit-id="'+a.dataset.unitId+'"]');if(!b)return false;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.abs(x.x+x.width/2-y.x-y.width/2)<2&&Math.abs(x.y+x.height/2-y.y-y.height/2)<2;}));
 const untilAnchored=async()=>{const end=Date.now()+6000;while(!await anchored()){if(Date.now()>end){const boxes=await page.evaluate(()=>[...document.querySelectorAll('.demand-map-notice,.unit-map-marker')].map(e=>({id:e.dataset.unitId,cls:e.getAttribute('class'),bounds:e.getBoundingClientRect().toJSON(),style:e.getAttribute('style'),d:e.getAttribute('d')})));fs.writeFileSync(out+'/alinhamento-falha.json',JSON.stringify(boxes,null,2));throw Error('Anel fora da coordenada do marcador após zoom');}await new Promise(r=>setTimeout(r,50));}};
 try{
  await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');await expectCount(unit,2);await expectCount(f.ids.progress,1);
  assert.equal(await page.locator('.demand-map-notice').count(),2);assert.equal(await page.locator('dialog[open]').count(),0);
  assert.equal(await ring(unit).evaluate(e=>getComputedStyle(e).color),'rgb(0, 109, 119)');
  assert.equal(await ring(unit).locator('.demand-map-ring').evaluate(e=>getComputedStyle(e).animationName),'demand-map-pulse');
  assert.equal(await ring(unit).evaluate(e=>e.getBoundingClientRect().width),48);await untilAnchored();
  assert.match(await ring(unit).getAttribute('title'),/2 demanda\(s\) aberta/);
  assert.equal(await page.locator('.unit-map-marker[data-unit-id="'+unit+'"]').getAttribute('fill'),'#7523C9');
  assert.equal(await page.locator('.unit-map-marker[data-unit-id="'+f.ids.progress+'"]').getAttribute('fill'),'#EAB308');
  await page.locator('.hardware-map-notice[data-unit-id="'+unit+'"]').waitFor();
  await page.clock.runFor(500);await shot('aneis-e-hardware');
  // D-095: valores de cadastro e prioridade da demanda, inclusive sobre hardware.
  await page.locator('.hardware-map-notice').hover();await page.locator('.unit-map-tooltip:visible').waitFor();assert.match(await page.locator('.unit-map-tooltip:visible').innerText(),/Alunos: 1\.234\nVagas disponíveis: 0/);const tooltipBox=await page.locator('.unit-map-tooltip:visible').boundingBox(),mapBox=await page.locator('#municipal-map').boundingBox();assert.ok(tooltipBox.width>150&&tooltipBox.height<180,'texto não pode virar coluna estreita ou esconder informações');assert.ok(tooltipBox.y>=mapBox.y&&tooltipBox.x>=mapBox.x&&tooltipBox.x+tooltipBox.width<=mapBox.x+mapBox.width,'informações visíveis dentro do mapa');await shot('hover-alunos-vagas');
  await page.locator('.hardware-map-notice').focus();await page.keyboard.press('Enter');await page.waitForURL('**/demandas?unidade='+unit);assert.equal(await page.locator('.hardware-dialog[open]').count(),0);await page.waitForFunction(id=>document.querySelector('#request-filters input[name=unit]')?.value===id,unit);assert.equal(await page.locator('#request-filters input[name=unit]').inputValue(),unit);
  await page.goto(origin+'/panorama');await expectCount(unit,2);
  const plain=()=>page.locator('.unit-map-marker[data-unit-id="'+f.ids.blocked+'"]');await plain().hover();assert.match(await page.locator('.unit-map-tooltip:visible').innerText(),/Alunos: 0\nVagas disponíveis: Não informado/);await plain().click();await page.waitForURL('**/unidade?id='+f.ids.blocked);await page.locator('.detail-banner').waitFor();assert.equal(await page.locator('.nav-item[href="/unidades"]').getAttribute('aria-current'),'page');await page.reload();await page.locator('.detail-banner').waitFor();assert.match(await page.locator('.detail-banner').innerText(),new RegExp(f.ids.blocked));await shot('unidade-selecionada');
  await page.goto(origin+'/panorama');await expectCount(unit,2);
  await page.getByRole('button',{name:/^Notificações de hardware/}).click();await page.locator('.hardware-card').waitFor();assert.match(await page.locator('.hardware-dialog').innerText(),/32 GiB/);await page.getByRole('button',{name:'Fechar aviso de hardware'}).click();
  await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();await page.clock.runFor(400);await untilAnchored();
  await page.getByRole('button',{name:'Ampliar área do mapa',exact:true}).click();await page.clock.runFor(400);await untilAnchored();await shot('mapa-ampliado');await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await ring(unit).locator('.demand-map-ring').evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  // Falha mantém a última leitura, explicitamente desatualizada, sem inventar zero.
  await page.route('**/api/inventory/pending-summary',r=>r.fulfill({status:503,body:'{}'}));await tick();
  await page.waitForFunction(()=>document.querySelector('.demand-map-notice')?.dataset.stale==='true');assert.equal(await ring(unit).getAttribute('data-demands'),'2');
  await page.locator('.unit-map-legend summary').click();await page.getByText('Demandas: consulta indisponível. Última leitura preservada.',{exact:true}).waitFor();await shot('leitura-desatualizada');
  await page.unroute('**/api/inventory/pending-summary');await tick();await page.waitForFunction(()=>document.querySelector('.demand-map-notice')?.dataset.stale==='false');await page.locator('.unit-map-legend summary').click();
  // Concluir uma de duas não remove o anel; concluir a última remove. Reabrir restaura.
  f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE id=?").run(seed.ids[0]);await tick();await expectCount(unit,1);
  f.sqlite.prepare("UPDATE service_requests SET status='Concluída' WHERE unit_id=?").run(unit);await tick();await ring(unit).waitFor({state:'detached'});assert.equal(await ring(f.ids.progress).count(),1);assert.equal(await page.locator('.hardware-map-notice').count(),1,'hardware sem parecer continua');
  await page.locator('.hardware-map-notice').focus();await page.keyboard.press('Enter');await page.waitForURL('**/unidade?id='+unit);await page.locator('.detail-banner').waitFor();assert.equal(await page.locator('.hardware-dialog[open]').count(),0);await page.goto(origin+'/panorama');await ring(f.ids.progress).waitFor();
  f.sqlite.prepare("UPDATE service_requests SET status='Em atendimento' WHERE id=?").run(seed.ids[0]);await tick();await expectCount(unit,1);
  await ring(f.ids.progress).focus();await page.keyboard.press('Enter');await page.waitForURL('**/demandas?unidade='+f.ids.progress);await page.locator('#ops-body').getByText('TESTE · Visita à unidade',{exact:true}).waitFor();assert.equal(await page.locator('#request-filters input[name=unit]').inputValue(),f.ids.progress);await shot('central-filtrada');
  // Mapa da Rede, visualizador e movimento reduzido mantêm a mesma sinalização.
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);await page.goto(origin+'/mapa');await expectCount(unit,1);
  await page.setViewportSize({width:390,height:844});await page.clock.runFor(400);await page.getByRole('button',{name:'Enquadrar mapa',exact:true}).click();await page.locator('.map-panel').scrollIntoViewIfNeeded();await page.clock.runFor(400);await untilAnchored();await shot('mapa-390');
  await ring(f.ids.progress).focus();await page.keyboard.press('Enter');await page.waitForURL('**/demandas?unidade='+f.ids.progress);await page.locator('#ops-body').getByText('TESTE · Visita à unidade',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Registrar demanda',exact:true}).count(),0);
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);const result={passed:true,allOpenStates:true,perUnitCounts:true,noFabricatedCoordinates:true,hardwareCoexists:true,teal:'#006D77',size:48,pollingSeconds:15,completionReopening:true,errorPreservesRead:true,clickFiltersCentral:true,hoverStudentsSeats:true,nullVersusZero:true,unitDetailSelected:true,hardwareBellPreserved:true,reducedMotion:true,viewer:true,writeRequests:0,errors};fs.writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
