// D126: isolated real Worker + SQLite; never writes to production.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,env,errors}=h;
 const {session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const root=await session(f,f.root),tech=await session(f,f.operator);
 const call=(path,data,s=root)=>humanFetch(worker,env,origin,s,path,data);
 const revision=()=>f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision;
 const cmd=x=>({operationId:crypto.randomUUID(),revision:revision(),...x});
 const unit=f.ids.pending;
 f.sqlite.prepare('UPDATE units SET latitude=-2.528,longitude=-44.108,unit_type=?,students_total=450,seats_available=20 WHERE id=?').run('Escola municipal',unit);
 const make=async description=>{const id=crypto.randomUUID();const r=await call('/api/operations/request-save',{id,version:0,operationId:crypto.randomUUID(),unitId:unit,equipmentId:null,description,kind:'Visita técnica',source:'Painel',requester:'',responsible:'',scheduledDate:'',note:'',status:'Aberta'});assert.equal(r.status,201);return id;};
 const out='docs/05-qualidade/evidencias/demandas-d126-2026-11-16';fs.mkdirSync(out,{recursive:true});
 const screenshot=async name=>{await page.evaluate(()=>{if(document.getElementById('local-label'))return;const n=document.createElement('div');n.id='local-label';n.textContent='TESTE LOCAL · Dados sintéticos · Sem alteração de produção';n.style.cssText='position:fixed;bottom:0;left:0;right:0;text-align:center;background:#16191d;color:white;z-index:99999;padding:7px;pointer-events:none';document.body.append(n);});await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  const id=await make('TESTE ISOLADO · Revisar computadores'),next=await make('TESTE ISOLADO · Instalar impressora');
  await call('/api/dispatch/technician',cmd({userId:f.operator.id,enabled:true}));
  for(const task of [id,next])await call('/api/dispatch/assign',cmd({id:task,userIds:[f.operator.id]}));
  await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');
  const ring=page.locator('.demand-map-notice[data-unit-id="'+unit+'"]');await ring.waitFor();
  assert.equal(await ring.getAttribute('data-attending'),'false');
  const accept=await call('/api/technician/accept',cmd({id,version:1,tracking:{id:crypto.randomUUID(),token:require('node:crypto').randomBytes(32).toString('hex')},position:{latitude:-2.53,longitude:-44.11,accuracy:10,observedAt:Date.now()}}),tech);assert.equal(accept.status,200);
  await page.clock.fastForward(16000);await page.waitForFunction(id=>document.querySelector('.demand-map-notice[data-unit-id="'+id+'"]')?.dataset.attending==='true',unit);
  assert.equal(await ring.evaluate(e=>getComputedStyle(e).color),'rgb(37, 99, 235)');assert.match(await ring.getAttribute('aria-label'),/A caminho ou em atendimento/);
  assert.equal(await page.locator('.unit-map-marker[data-unit-id="'+unit+'"]').getAttribute('fill'),'#7523C9');await screenshot('mapa-aceite');
  await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();await screenshot('mapa-ampliado');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await ring.locator('.demand-map-ring').evaluate(e=>getComputedStyle(e).animationName),'none');await page.keyboard.press('Escape');
  await ring.focus();await page.keyboard.press('Enter');await page.waitForURL('**/demandas?unidade='+unit);
  const button=page.locator('[data-op=delete-request][data-id="'+id+'"]');await button.waitFor();await button.click();
  let dialog=page.locator('.ops-dialog[open]');assert.match(await dialog.innerText(),/localização continua/);await screenshot('confirmacao-exclusao');
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_deletions').get().n,0);
  await button.click();dialog=page.locator('.ops-dialog[open]');await dialog.locator('[name=reason]').fill('Duplicidade identificada · teste local');await dialog.locator('[name=confirm]').check();await dialog.getByRole('button',{name:'Excluir demanda',exact:true}).click();
  await page.locator('#request-saved').waitFor();assert.match(await page.locator('#request-saved').innerText(),/Histórico preservado/);assert.equal(await page.locator('.ops-dialog[open]').count(),0);assert.equal(await button.count(),0);await screenshot('lista-apos-exclusao');
  await page.locator('#request-filters [name=status]').selectOption('deleted');await page.getByRole('button',{name:'Filtrar',exact:true}).click();await page.locator('[data-op=request][data-id="'+id+'"]').waitFor();await screenshot('historico-excluidas');
  await page.locator('[data-op=request][data-id="'+id+'"]').click();dialog=page.locator('.ops-dialog[open]');assert.match(await dialog.innerText(),/Duplicidade identificada/);assert.equal(await dialog.getByRole('button',{name:'Salvar demanda'}).count(),0);assert.equal(await dialog.locator('textarea[name=description]').isDisabled(),true);await screenshot('historico-preservado');await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
  await page.goto(origin+'/panorama');await ring.waitFor();assert.equal(await ring.getAttribute('data-attending'),'false');assert.equal(await ring.evaluate(e=>getComputedStyle(e).color),'rgb(0, 109, 119)');
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/demandas');await page.locator('[data-op=delete-request]').waitFor();await screenshot('lista-mobile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  f.sqlite.prepare("UPDATE users SET role='admin' WHERE id=?").run(f.root.id);await page.reload();await page.locator('#request-filters').waitFor();assert.equal(await page.locator('[data-op=delete-request]').count(),0);assert.equal(await page.locator('option[value=deleted]').count(),0);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,scope:'LOCAL ISOLADO',errors},null,2));console.log('D126 browser: sinalização, tela cheia, teclado, movimento reduzido, exclusão/arquivo, admin e 390px OK');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
