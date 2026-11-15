const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const x=await require('./helpers/panel-browser.cjs')();
 try{
  const {connectionFixture}=await import('./helpers/agent-connection.mjs'),{heartbeatBody,machinePost}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
  x.env.APP_KIND='panel';x.env.AGENT_NETWORK_TESTS_PROVIDER='cloudflare';const agent=await connectionFixture(x.f,x.env);
  x.f.sqlite.prepare("UPDATE units SET name='DEMO LOCAL · Escola de teste' WHERE id=(SELECT unit_id FROM inventory_equipment_all WHERE id=?)").run(agent.items[0].id);
  const hb=heartbeatBody(agent.identity,{sequence:1});hb.network_test_protocol=1;hb.agent_version='0.1.9';
  await machinePost(worker,x.env,x.origin,agent.identity,'/api/agent/v1/heartbeat',hb,{ip:'198.51.100.25',cf:{asOrganization:'REDE DEMO',asn:64512}});
  await x.page.goto(x.origin+'/testes-internet');await x.page.locator('[data-computer]:enabled').first().waitFor();
  await x.page.locator('[data-computer]:enabled').first().click();await x.page.locator('#network-request').click();
  await x.page.getByText('Pedido registrado.',{exact:false}).waitFor();assert.equal(x.f.sqlite.prepare('SELECT count(*) n FROM agent_network_tests').get().n,1);
  await x.page.locator('[data-details]').click();assert.equal(await x.page.locator('#network-detail').evaluate(d=>d.open),true);await x.page.getByRole('button',{name:'Fechar',exact:true}).click();
  await x.page.locator('[data-cancel]').click();await x.page.waitForFunction(()=>document.querySelector('#network-history')?.textContent.includes('Cancelado'));
  assert.equal(x.f.sqlite.prepare('SELECT state FROM agent_network_tests').get().state,'cancelled');
  await x.page.locator('#network-search').fill('NENHUMA123');await x.page.locator('#network-search-form button').click();await x.page.getByText('Nenhum computador com vínculo ativo corresponde à busca.').waitFor();
  await x.page.locator('#network-search').fill('');await x.page.locator('#network-search-form button').click();await x.page.locator('[data-computer]:enabled').first().waitFor();
  delete x.env.AGENT_NETWORK_TESTS_PROVIDER;await x.page.locator('#network-refresh').click();await x.page.getByText('Serviço de medição ainda não habilitado.',{exact:false}).waitFor();await x.page.locator('[data-computer]:enabled').first().click();assert.equal(await x.page.locator('#network-request').isDisabled(),true);
  x.env.AGENT_NETWORK_TESTS_PROVIDER='cloudflare';await x.page.locator('#network-refresh').click();await x.page.getByText('Teste solicitado somente por root.',{exact:false}).waitFor();
  await x.page.mouse.move(900,600);await x.page.evaluate(()=>document.fonts.ready);await x.page.waitForTimeout(300);

  fs.mkdirSync('docs/05-qualidade/evidencias/internet-d118',{recursive:true});await x.page.screenshot({animations:'disabled',path:'docs/05-qualidade/evidencias/internet-d118/painel-desktop-demo.png',fullPage:true});
  await x.page.setViewportSize({width:390,height:844});await x.page.screenshot({animations:'disabled',path:'docs/05-qualidade/evidencias/internet-d118/painel-mobile-demo.png',fullPage:true});
  assert.deepEqual(x.errors,[]);console.log('PASS: pedido real no Worker local, cancelamento, detalhes, busca, recurso desligado e layout 390/1672; sem dados oficiais.');
 }finally{await x.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
