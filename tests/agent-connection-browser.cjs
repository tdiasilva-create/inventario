const assert=require('node:assert/strict'),fs=require('node:fs'),panelBrowser=require('./helpers/panel-browser.cjs');
(async()=>{
 const h=await panelBrowser(),{f,env,page,origin,errors}=h,{connectionFixture}=await import('./helpers/agent-connection.mjs'),x=await connectionFixture(f,env);
 const out='docs/05-qualidade/evidencias/conexao-agentes-2026-11-11';fs.mkdirSync(out,{recursive:true});
 let reads=0,writes=0;page.on('request',r=>{if(r.url().includes('/api/inventory/agent-status'))reads++;if(r.method()==='POST')writes++;});
 await page.route('https://**/*',r=>r.fulfill({status:204,body:''}));
 async function shot(name){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/'+name+'.png',fullPage:!(await page.locator('dialog[open]').count()),animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
 try{
  await page.setViewportSize({width:1366,height:900});await page.clock.install();
  await page.goto(origin+'/computadores?unidade='+x.unit);await page.locator('.ops-machine[data-id="'+x.items[0].id+'"]').waitFor();assert.equal(reads,0,'lista não consulta IP por máquina');
  await page.locator('.ops-machine[data-id="'+x.items[0].id+'"]').click();await page.locator('.agent-connection').waitFor();assert.match(await page.locator('.agent-connection').textContent(),/Aguardando a próxima comunicação/);
  assert.equal((await x.send(1)).status,200);await page.locator('[data-connection-refresh]').click();await page.getByText('198.51.100.25',{exact:true}).waitFor();
  assert.equal(await page.locator('[data-connection=public]').textContent(),'198.51.100.25');assert.match(await page.locator('[data-connection=internal]').textContent(),/192\.168\.10\.25/);assert.doesNotMatch(await page.locator('[data-connection=internal]').textContent(),/198\.51/);assert.match(await page.locator('[data-connection=provider]').textContent(),/REDE TESTE ISOLADO/);
  await shot('01-computador-conexao-desktop');await page.setViewportSize({width:390,height:844});await shot('02-computador-conexao-390');await page.setViewportSize({width:1366,height:900});
  await x.send(2,{ip:'2001:db8::27',cf:{asOrganization:'REDE <img src=x onerror=alert(1)> TESTE',asn:64513}});
  await page.clock.fastForward(15001);await page.getByText('2001:db8::27',{exact:true}).waitFor();assert.equal(await page.locator('.agent-connection img').count(),0);assert.match(await page.locator('[data-connection=provider]').textContent(),/<img src=x/);
  await page.route('**/api/inventory/agent-status?**',r=>r.fulfill({status:503,json:{message:'FALHA TESTE ISOLADO'}}));await page.locator('[data-connection-refresh]').click();await page.getByRole('alert').filter({hasText:'FALHA TESTE ISOLADO'}).waitFor();assert.equal(await page.locator('[data-connection=public]').textContent(),'2001:db8::27');
  await page.unroute('**/api/inventory/agent-status?**');await page.locator('[data-connection-refresh]').click();await page.getByRole('alert').filter({hasText:'FALHA TESTE ISOLADO'}).waitFor({state:'hidden'});
  await page.locator('.ops-dialog [data-op=close]').click();const closedReads=reads;await page.clock.fastForward(16000);assert.equal(reads,closedReads,'fechar interrompe polling');
  await page.locator('.ops-machine[data-id="'+x.items[1].id+'"]').click();await page.getByText(/Sem agente vinculado. IP público/).waitFor();assert.equal(await page.locator('[data-connection=public]').count(),0);await page.locator('.ops-dialog [data-op=close]').click();
  await x.send(3,{cf:{asn:64512}});
  await page.goto(origin+'/equipamentos');await page.locator('.matrix [data-action=select-unit][data-unit="'+x.unit+'"]').click();await page.locator('[data-equipment-id="'+x.items[0].id+'"] h4 button').click();await page.locator('.eq-detail [data-connection=public]').waitFor();assert.equal(await page.locator('.eq-detail [data-connection=public]').textContent(),'198.51.100.25');assert.match(await page.locator('.eq-detail [data-connection=provider]').textContent(),/Não identificado/);await page.locator('.agent-connection').scrollIntoViewIfNeeded();await shot('03-ficha-equipamento');
  await page.goto(origin+'/configuracoes');await page.locator('[data-action=agent-status][data-equipment="'+x.items[0].id+'"]').click();await page.locator('dialog[open] [data-connection=public]').waitFor();assert.match(await page.locator('dialog[open] [data-connection=internal]').textContent(),/192\.168\.10\.25/);await shot('04-dados-agente');
  assert.equal(writes,0,'navegação não escreve dados');assert.deepEqual(errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,fixture:'Worker real + SQLite isolado; heartbeat assinado sem mudança no protocolo',widths:[1366,390],screenshots:4,autoRefresh:true,errorRecovery:true,publicInternalSeparated:true,manual:true,providerEscaped:true,writes,errors},null,2));console.log('PASS: conexão em Computadores, ficha de Equipamentos e Dados do agente; 4 screenshots, polling, falha/retomada e IPs separados.');
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
