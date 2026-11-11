// Gravações exclusivamente no Worker/SQLite isolado do teste.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),seed=seedEquipmentConsultation(f);
 const folder='docs/05-qualidade/evidencias/demandas-salvar-2026-11-11';fs.mkdirSync(folder,{recursive:true});
 const form=page.locator('#request-form'),notice=page.locator('#request-saved');let navigations=0,detailReads=0,writes=0;
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
 page.on('request',r=>{const url=new URL(r.url());if(url.pathname==='/api/operations/requests'&&url.searchParams.has('id'))detailReads++;if(url.pathname==='/api/operations/request-save')writes++;});
 const shot=async name=>{await page.evaluate(()=>{if(document.querySelector('#test-label'))return;const b=document.createElement('div');b.id='test-label';b.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';b.style.cssText='position:fixed;bottom:0;z-index:99999;background:#16191d;color:white;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(b);});await page.screenshot({path:folder+'/'+name+'.png'});};
 try{
  await page.clock.install({time:Date.now()});await page.goto(origin+'/demandas?unidade='+seed.unit);await page.locator('#request-unit-search input[role=combobox]').waitFor();await page.getByRole('button',{name:'Registrar demanda',exact:true}).click();
  const description='TESTE ISOLADO · reposição de teclado';await form.locator('[name=description]').fill(description);
  // Falha antes de gravar: sem sucesso falso, dados continuam no formulário.
  await page.route('**/api/operations/request-save',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'TESTE · falha antes do envio'})}));
  await form.getByRole('button',{name:'Salvar demanda',exact:true}).click();await form.locator('[role=alert]').filter({hasText:'falha antes do envio'}).waitFor();assert.equal(await notice.count(),0);assert.equal(await form.locator('[name=description]').inputValue(),description);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,0);await page.unroute('**/api/operations/request-save');
  // Servidor grava, mas a resposta se perde. Repetir deve manter a mesma operação.
  await page.route('**/api/operations/request-save',async r=>{await r.fetch();await r.abort('connectionreset');});
  await form.getByRole('button',{name:'Salvar demanda',exact:true}).click();await form.locator('[role=alert]').filter({hasText:'Se houve falha de conexão'}).waitFor();await page.waitForFunction(()=>!document.querySelector('#request-form [type=submit]').disabled);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);assert.equal(await form.locator('[name=description]').inputValue(),description);assert.equal(await notice.count(),0);await page.unroute('**/api/operations/request-save');
  // ACK confirmado + atualização da lista indisponível: confirmar o salvamento, sem reabrir.
  await page.route('**/api/operations/requests?*',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await form.getByRole('button',{name:'Salvar demanda',exact:true}).click();await page.locator('.ops-dialog').waitFor({state:'detached'});await notice.filter({hasText:'Demanda #1 registrada com sucesso.'}).waitFor();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events').get().n,1);assert.equal(detailReads,0);assert.equal(navigations,1);assert.equal(await notice.evaluate(n=>n===document.activeElement),true);assert.match(await page.locator('#ops-feedback').innerText(),/Não foi possível atualizar/);
  await page.unroute('**/api/operations/requests?*');await page.getByRole('button',{name:'Atualizar',exact:true}).click();await page.locator('.ops-request').waitFor();await page.clock.fastForward(16000);assert.equal(await page.locator('.ops-dialog').count(),0);assert.equal(detailReads,0);await shot('01-salvou-sem-reabrir');
  // Consulta só por ação explícita. Editar também fecha e atualiza a lista.
  await notice.getByRole('button',{name:'Ver demanda',exact:true}).click();await page.getByRole('heading',{name:'Demanda #1',exact:true}).waitFor();assert.equal(detailReads,1);await form.locator('[name=status]').selectOption('Concluída');await form.locator('[name=note]').fill('TESTE · teclado substituído');await form.getByRole('button',{name:'Salvar demanda',exact:true}).click();await page.locator('.ops-dialog').waitFor({state:'detached'});await notice.filter({hasText:'Demanda #1 atualizada com sucesso.'}).waitFor();
  assert.equal(f.sqlite.prepare('SELECT status FROM service_requests').get().status,'Concluída');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_request_events').get().n,2);assert.equal(await page.locator('.ops-request').count(),0);assert.equal(detailReads,1);assert.equal(navigations,1);assert.equal(writes,4);
  await page.setViewportSize({width:390,height:844});await shot('02-atualizou-390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual(h.errors,[]);console.log(JSON.stringify({passed:true,createCloses:true,editCloses:true,noAutomaticReopen:true,noPageNavigation:true,manualDetails:true,successPersists:true,failedSaveKeepsForm:true,lostReplyIdempotent:true,listFailureSeparated:true,historyPreserved:true,mobile:true}));
 }catch(error){await shot('falha');throw error;}finally{await h.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
