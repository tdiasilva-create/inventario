// TP-18/08/19: Worker real e SQLite isolado; nenhuma escrita em produção.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,env,errors}=h;
 const {hardwareChange}=await import('./helpers/hardware-change.mjs'),seed=await hardwareChange(f,env);
 const out='docs/05-qualidade/evidencias/painel-assincrono-2026-11-11';fs.mkdirSync(out,{recursive:true});
 const writes=[],held=[];let mode='pass',calls=0;
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});
 const shot=async name=>{
  await page.evaluate(()=>{let n=document.getElementById('test-label');if(!n){n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Dados sintéticos · Sem escrita em produção';n.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;padding:4px;text-align:center;font:12px sans-serif;pointer-events:none';document.body.append(n);}});
  await page.screenshot({path:out+'/'+name+'.png'});
 };
 const refresh=()=>page.evaluate(()=>window.dispatchEvent(new Event('semed:equipment-list')));
 const hide=value=>page.evaluate(v=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>v});document.dispatchEvent(new Event('visibilitychange'));},value);
 const release=()=>{for(const resolve of held.splice(0))resolve();};
 const until=async check=>{const end=Date.now()+6000;while(!check()){if(Date.now()>end)throw Error('Consulta esperada não iniciou');await new Promise(r=>setTimeout(r,20));}};
 async function gate(route){calls++;const current=mode;if(current==='hold'){await new Promise(resolve=>held.push(resolve));try{await route.continue();}catch{}}else if(current==='pass')await route.continue();else await route.fulfill({status:Number(current),contentType:'application/json',body:'{}'});}
 const badge=()=>page.locator('.monitor-count');
 try{
  await page.goto(origin+'/panorama?id='+seed.unit+'&equipment='+seed.items[0].id);
  await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='1');
  await page.waitForFunction(()=>document.querySelector('[data-monitor-equipment]')?.textContent.includes('Online'));
  await page.evaluate(()=>{window.testMonitoringErrors=0;window.addEventListener('semed:monitoring-error',()=>window.testMonitoringErrors++);});
  const status=await page.locator('[data-monitor-equipment]').first().textContent();
  await page.route('**/api/inventory/monitoring?**',gate);
  await hide(true);await refresh();assert.equal(calls,0);assert.equal(await badge().textContent(),'1');
  mode='hold';await hide(false);await until(()=>held.length===1);
  assert.equal(held.length,1);await hide(true);
  await page.waitForFunction(()=>document.querySelector('[data-action=notifications]')?.title.includes('pausada'));
  assert.equal(await badge().textContent(),'1');assert.equal(await page.locator('[data-monitor-equipment]').first().textContent(),status);
  assert.equal(await page.evaluate(()=>window.testMonitoringErrors),0);
  release();mode='pass';const visibleResponse=page.waitForResponse('**/api/inventory/monitoring?**');await hide(false);
  await visibleResponse;
  assert.equal(await badge().textContent(),'1');
  // Retorno à aba antes do finally do cancelamento: a consulta deve ser retomada.
  mode='hold';await refresh();await until(()=>held.length===1);
  mode='pass';const resumed=page.waitForResponse('**/api/inventory/monitoring?**');
  await page.evaluate(()=>{for(const hidden of [true,false]){Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});document.dispatchEvent(new Event('visibilitychange'));}});
  release();await resumed;assert.equal(await page.evaluate(()=>window.testMonitoringErrors),0);
  // Falhas reais continuam visíveis; ocultar a aba não apaga um erro anterior.
  mode='503';await refresh();await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='!');
  await hide(true);assert.equal(await badge().textContent(),'!');mode='pass';await hide(false);
  await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='1');
  mode='hold';await refresh();await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='!',{},{timeout:18000});
  assert.match(await page.locator('[data-action=notifications]').first().getAttribute('title'),/demorou/);
  release();mode='pass';await refresh();await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='1');
  mode='401';await refresh();await page.waitForFunction(()=>document.querySelector('[data-action=notifications]')?.title.includes('Sessão expirada'));
  mode='pass';await refresh();await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='1');
  await page.unroute('**/api/inventory/monitoring?**',gate);
  // Todos os sete indicadores ficam visíveis, sem rolagem horizontal escondida.
  for(const width of [1366,1200,809,390]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>window.scrollTo(0,0));
   const layout=await page.locator('.pulse').evaluate(el=>{const b=el.getBoundingClientRect();return {width:innerWidth,box:{left:b.left,right:b.right,top:b.top,bottom:b.bottom},items:[...el.querySelectorAll('.pulse-item')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,text:n.textContent};}),scroll:el.scrollWidth,client:el.clientWidth};});
   assert.equal(layout.items.length,7);assert.ok(layout.scroll<=layout.client+1);assert.ok(layout.box.top>=0&&layout.box.bottom<=900);
   for(const r of layout.items){assert.ok(r.left>=layout.box.left-1&&r.right<=layout.box.right+1&&r.right<=width+1,r.text);assert.ok(r.top>=layout.box.top&&r.bottom<=layout.box.bottom,r.text);}
   await shot('indicadores-'+width);
  }
  assert.equal(await page.locator('.pulse a[href="/computadores?estado=comunicando"]').count(),1);
  await page.locator('.pulse [data-pending-hardware]').focus();await page.keyboard.press('Enter');await page.locator('.hardware-dialog[open]').waitFor();await page.getByRole('button',{name:'Fechar aviso de hardware'}).click();
  await page.setViewportSize({width:1366,height:900});await page.goto(origin+'/configuracoes');
  const trigger=page.locator('[data-action=agent-status][data-equipment="'+seed.items[0].id+'"]');await trigger.waitFor();
  await page.waitForFunction(()=>!document.querySelector('#content')?.textContent.includes('Consultando'));
  const agentRoute='**/api/inventory/agent-status?**';calls=0;mode='hold';await page.route(agentRoute,gate);
  await trigger.click();await page.getByRole('status').filter({hasText:'Consultando dados do agente'}).waitFor();
  await until(()=>calls===1);assert.equal(await trigger.isDisabled(),true);assert.equal(await page.locator('dialog .dialog-body').getAttribute('aria-busy'),'true');await shot('agente-carregando');
  release();await page.locator('dialog dd').filter({hasText:'TESTE-PC-001'}).waitFor();assert.equal(await page.locator('dialog .dialog-body').getAttribute('aria-busy'),null);
  await shot('agente-recebido');await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
  // Fechar a janela cancela; a resposta atrasada não deve reabri-la.
  await trigger.click();await page.locator('[aria-busy=true]').waitFor();await until(()=>held.length===1);await page.keyboard.press('Escape');release();
  await page.locator('dialog').waitFor({state:'detached'});assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await trigger.isDisabled(),false);
  mode='503';await trigger.click();await page.locator('dialog [role=alert]').waitFor();assert.equal(await page.locator('dialog [aria-busy=true]').count(),0);
  mode='pass';await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await page.locator('dialog dd').filter({hasText:'TESTE-PC-001'}).waitFor();await page.keyboard.press('Escape');
  mode='hold';await trigger.click();await page.locator('dialog [role=alert]').waitFor({timeout:22000});assert.match(await page.locator('dialog').innerText(),/demorou mais que o esperado/);await shot('agente-tempo-esgotado');await page.keyboard.press('Escape');release();
  mode='401';await trigger.click();await page.locator('dialog').getByText('Sua sessão expirou. Entre novamente no painel.',{exact:true}).waitFor();await page.keyboard.press('Escape');
  await page.unroute(agentRoute,gate);
  // O mesmo comando nas coletas parciais mantém ficha oficial e localização parcial separadas.
  f.sqlite.prepare("UPDATE inspections SET state='open',completed_at=NULL WHERE id=?").run(seed.visit);
  f.sqlite.prepare("UPDATE equipments SET updated_at=?,position_label='Mesa parcial de teste',data_json=json_set(data_json,'$.position_label','Mesa parcial de teste') WHERE id=?").run(Date.now()+1000,seed.items[0].id);
  await page.goto(origin+'/coletas-em-andamento?vistoria='+seed.visit);
  const partial=page.locator('[data-action=agent-status][data-equipment="'+seed.items[0].id+'"]');await partial.waitFor();
  mode='hold';await page.route(agentRoute,gate);await partial.click();await until(()=>held.length===1);
  await page.locator('dialog [role=status]').waitFor();release();await page.locator('dialog dd').filter({hasText:'TESTE-PC-001'}).waitFor();
  assert.match(await page.locator('dialog').innerText(),/PARCIAL/);await page.keyboard.press('Escape');await page.unroute(agentRoute,gate);
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  const result={passed:true,hiddenAbortPreservesRead:true,quickReturn:true,trueErrorsAndTimeouts:true,allSevenIndicatorsVisible:[1366,1200,809,390],immediateAgentFeedback:true,closeCancels:true,retryAndSession:true,writeRequests:writes.length,errors};
  fs.writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{release();await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
