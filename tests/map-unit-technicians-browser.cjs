// D132: real Worker/SQLite and browser, all records isolated and synthetic.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,f,env,origin}=h;
 const {session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const {routeResponse}=await import('./helpers/routing-provider.mjs');env.ROUTING_FETCH=async url=>routeResponse(url);
 const root=await session(f,f.root),tech=await session(f,f.operator),unit=f.ids.pending,other=f.ids.progress;
 const call=(path,data,s=root)=>humanFetch(worker,env,origin,s,path,data),cmd=x=>({operationId:crypto.randomUUID(),revision:f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision,...x});
 const out='docs/05-qualidade/evidencias/tecnicos-tooltip-d132-2026-11-24';fs.mkdirSync(out,{recursive:true});
 const shot=async name=>{await page.evaluate(()=>{if(document.getElementById('test-label'))return;const e=document.createElement('div');e.id='test-label';e.textContent='TESTE LOCAL · Dados sintéticos · Sem alteração de produção';e.style.cssText='position:fixed;bottom:0;left:8px;z-index:99999;background:#16191d;color:white;padding:6px;font:12px sans-serif;pointer-events:none';document.body.append(e);});await page.screenshot({path:out+'/'+name+'.png'});};
 const make=async unitId=>{const id=crypto.randomUUID();const r=await call('/api/operations/request-save',{id,version:0,operationId:crypto.randomUUID(),unitId,equipmentId:null,description:'TESTE · Revisar computadores',kind:'Visita técnica',source:'Painel',requester:'',responsible:'Texto livre não é técnico designado',scheduledDate:'',note:'',status:'Aberta'});assert.equal(r.status,201);return id;};
 const marker=id=>page.locator('.unit-map-marker[data-unit-id="'+id+'"]'),ring=id=>page.locator('.demand-map-notice[data-unit-id="'+id+'"]'),tooltip=page.locator('.leaflet-tooltip:visible');
 const waitLabel=async text=>page.waitForFunction(({id,text})=>document.querySelector('.unit-map-marker[data-unit-id="'+id+'"]')?.getAttribute('aria-label')?.includes(text),{id:unit,text});
 const poll=async()=>{await page.clock.fastForward(16000);};
 try{
  f.sqlite.prepare("UPDATE units SET name='TESTE · Escola Aurora',latitude=-2.528,longitude=-44.108,unit_type='Escola municipal',students_total=450,seats_available=20 WHERE id=?").run(unit);
  f.sqlite.prepare("UPDATE units SET name='TESTE · Escola sem designação',latitude=-2.542,longitude=-44.126,unit_type='Escola municipal' WHERE id=?").run(other);
  for(const [u,name] of [[f.root,'Bruno · TESTE'],[f.operator,'Ana · TESTE']]){f.sqlite.prepare('UPDATE users SET display_name=? WHERE id=?').run(name,u.id);assert.equal((await call('/api/dispatch/technician',cmd({userId:u.id,enabled:true}))).status,200);}
  const id=await make(unit),next=await make(unit);await make(other);
  await call('/api/dispatch/assign',cmd({id,userIds:[f.operator.id,f.root.id]}));await call('/api/dispatch/assign',cmd({id:next,userIds:[f.operator.id]}));
  await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');await waitLabel('Técnicos designados: Ana · TESTE; Bruno · TESTE');
  const before=h.requests.filter(r=>r.path==='/api/dispatch/map').length;
  await ring(unit).hover();await tooltip.filter({hasText:'Técnicos designados:'}).waitFor();assert.equal((await tooltip.innerText()).match(/Ana · TESTE/g).length,1,'deduplicação entre demandas');assert.doesNotMatch(await tooltip.innerText(),/Aceite confirmado|Texto livre/);
  await page.mouse.move(10,10);await ring(unit).hover();assert.equal(h.requests.filter(r=>r.path==='/api/dispatch/map').length,before,'hover não faz requisição');
  await shot('01-designados');await page.locator('[data-action=map-expand]').click();await ring(unit).hover();await shot('02-mapa-ampliado');
  assert.equal((await call('/api/technician/accept',cmd({id,version:f.sqlite.prepare('SELECT version FROM service_requests WHERE id=?').get(id).version,position:{latitude:-2.53,longitude:-44.11,accuracy:10,observedAt:Date.now()}}),tech)).status,200);
  await poll();await waitLabel('Aceite confirmado: Ana · TESTE');await tooltip.filter({hasText:'Aceite confirmado: Ana · TESTE'}).waitFor();await shot('03-aceite');
  await page.route('**/api/dispatch/map',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"TESTE indisponível"}'}));await poll();await waitLabel('última leitura; atualização indisponível');await tooltip.filter({hasText:'última leitura; atualização indisponível'}).waitFor();assert.match(await tooltip.innerText(),/Ana · TESTE; Bruno · TESTE/);
  await page.unroute('**/api/dispatch/map');await call('/api/dispatch/assign',cmd({id,userIds:[f.root.id]}));await call('/api/dispatch/assign',cmd({id:next,userIds:[]}));await poll();await waitLabel('Técnico designado: Bruno · TESTE');
  assert.doesNotMatch(await marker(unit).getAttribute('aria-label'),/Ana|Aceite confirmado|indisponível/);await tooltip.filter({hasText:'Técnico designado: Bruno · TESTE'}).waitFor();
  await ring(other).hover();await tooltip.filter({hasText:'Técnico ainda não designado.'}).waitFor();
  f.sqlite.prepare('UPDATE users SET display_name=? WHERE id=?').run('<img src=x onerror=alert(1)>',f.root.id);await poll();await waitLabel('<img src=x onerror=alert(1)>');await ring(unit).hover();await tooltip.filter({hasText:'<img src=x onerror=alert(1)>'}).waitFor();assert.equal(await tooltip.locator('img').count(),0,'nome tratado como texto');
  f.sqlite.prepare("UPDATE users SET display_name='Bruno · TESTE' WHERE id=?").run(f.root.id);await poll();await waitLabel('Técnico designado: Bruno · TESTE');
  await page.setViewportSize({width:390,height:844});await ring(unit).hover();await shot('04-390');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:1672,height:1050});await page.route('**/api/dispatch/map',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"TESTE indisponível"}'}));await page.reload();await waitLabel('Designações: consulta indisponível.');assert.doesNotMatch(await marker(unit).getAttribute('aria-label'),/ainda não designado/);await page.unroute('**/api/dispatch/map');
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);const count=h.requests.filter(r=>r.path==='/api/dispatch/map').length;await page.reload();await marker(unit).waitFor();await poll();assert.doesNotMatch(await marker(unit).getAttribute('aria-label'),/Técnic|Aceite confirmado/);assert.equal(h.requests.filter(r=>r.path==='/api/dispatch/map').length,count);
  assert.deepEqual(h.errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,localOnly:true,hoverRequests:0,assignmentsWithoutGPS:true,acceptance:true,liveTooltipRefresh:true,staleExplicit:true,permissions:true,textEscaped:true,errors:h.errors},null,2));console.log('D132 navegador PASS: designados, aceite, tooltip aberto atualizado, falhas, sem consulta por hover, root e 390px.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
