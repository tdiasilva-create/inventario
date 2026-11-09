// Regressão D-071: menus devem carregar o documento da rota, não Configurações.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('./helpers/playwright.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),root=await session(f,f.root),errors=[],out='docs/05-qualidade/evidencias/navegacao-painel-2026-11-08';fs.mkdirSync(out,{recursive:true});
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'painel',AGENTES_EXIGIR_AUTORIZACAO:'nao',ASSETS:{fetch:async req=>{const file=path.resolve('dist/painel','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('dist/painel')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream'}});}}};
 const server=http.createServer(async(req,res)=>{try{const headers=new Headers(req.headers);headers.set('Cookie',root.cookie);const response=await worker.fetch(new Request(new URL(req.url,'http://127.0.0.1:'+server.address().port),{headers}),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.stack));
 const nav=name=>page.locator('.navigation').getByRole('link',{name,exact:true});
 try{
  await page.goto(origin+'/panorama');await page.locator('.unit-category-counts').waitFor();
  await nav('Computadores').click();await page.getByRole('heading',{name:'Computadores por unidade',exact:true}).waitFor();await page.locator('#ops-unit-list button').first().waitFor();
  assert.equal(await page.getByRole('heading',{name:'Configurações',exact:true}).count(),0);await page.screenshot({path:out+'/computadores-menu.png'});
  await page.goBack();await page.getByRole('heading',{name:'Unidades por categoria',exact:true}).waitFor();
  await page.goForward();await page.getByRole('heading',{name:'Computadores por unidade',exact:true}).waitFor();
  await nav('Panorama').click();await page.locator('.unit-category-counts').waitFor();
  await page.locator('.navigation a[href="/demandas"]').click();await page.getByRole('heading',{name:'Central de demandas',exact:true}).waitFor();await page.locator('#ops-body').getByText(/Nenhuma demanda/).waitFor();await page.screenshot({path:out+'/demandas-menu.png'});
  await nav('Configurações').click();await page.getByRole('heading',{name:'Agentes Windows — cadastro automático',exact:true}).waitFor();assert.doesNotMatch(await page.locator('#content').innerText(),/Consultando/);
  await nav('Computadores').click();await page.getByRole('heading',{name:'Computadores por unidade',exact:true}).waitFor();
  await nav('Configurações').click();await page.getByRole('heading',{name:'Agentes Windows — cadastro automático',exact:true}).waitFor();
  await page.locator('.navigation a[href="/demandas"]').click();await page.getByRole('heading',{name:'Central de demandas',exact:true}).waitFor();
  // Um endpoint antigo sem resposta não pode impedir a exibição de agentes/modo.
  await page.route('**/api/root/agent-install-grants',()=>{});
  await page.goto(origin+'/configuracoes');await page.getByRole('heading',{name:'Agentes Windows — cadastro automático',exact:true}).waitFor();
  assert.doesNotMatch(await page.locator('#content').innerText(),/Consultando/);
  await page.locator('#agents-q').fill('Filtro durante a espera');await page.locator('[data-action=agents-filter]').click();await page.getByText('Nenhum agente neste filtro.',{exact:true}).waitFor();assert.equal(await page.locator('#agents-q').inputValue(),'Filtro durante a espera');
  await page.goto(origin+'/panorama');await page.unroute('**/api/root/agent-install-grants');
  // Sem resposta: espera limitada, sem sucesso fictício, erro e nova tentativa.
  const counts={google:0,devices:0};
  await page.route('**/api/root/google/status',()=>{counts.google++;});
  await page.route('**/api/root/agent-devices?*',()=>{counts.devices++;});
  await page.goto(origin+'/configuracoes');
  await page.getByText(/A consulta demorou mais que o esperado/).nth(1).waitFor({timeout:22000});
  assert.doesNotMatch(await page.locator('#content').innerText(),/Consultando/);assert.deepEqual(counts,{google:1,devices:1});assert.equal(await page.locator('#agents-grant-form').count(),0);
  await page.screenshot({path:out+'/consultas-interrompidas.png'});
  await page.unroute('**/api/root/google/status');await page.unroute('**/api/root/agent-devices?*');
  await page.locator('[data-action=google-refresh]').click();await page.locator('[data-action=agents-refresh]').last().click();
  await page.getByRole('heading',{name:'Agentes Windows — cadastro automático',exact:true}).waitFor();await page.getByText('Nenhum agente neste filtro.',{exact:true}).waitFor();
  assert.equal(await page.locator('.field-error').count(),0);assert.doesNotMatch(await page.locator('#content').innerText(),/Consultando/);
  // Sessão expirada deve ser explícita e não parecer carregamento permanente.
  for(const route of ['**/api/root/google/status','**/api/root/agent-devices?*'])await page.route(route,r=>r.fulfill({status:401,contentType:'application/json',body:'{}'}));
  await page.reload();await page.getByText('Sua sessão expirou. Entre novamente no painel.',{exact:true}).nth(1).waitFor();assert.doesNotMatch(await page.locator('#content').innerText(),/Consultando/);
  assert.deepEqual(errors,[]);console.log('OK: menus, voltar/avançar, consultas independentes, timeout, nova tentativa e sessão expirada.');
 }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});throw e;}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
