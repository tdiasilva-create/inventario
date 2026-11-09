const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),pw=require('./helpers/playwright.cjs');
(async()=>{
 const {authFixture,panelOrigin,collectorOrigin,temporaryPassword,personalPassword}=await import('./helpers/auth-fixture.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=await authFixture(),originalFetch=globalThis.fetch,errors=[],requests=[],out='docs/05-qualidade/evidencias/senhas-2026-11-09';fs.mkdirSync(out,{recursive:true});
 // All browser traffic is answered by the real Worker with isolated SQLite. No production requests.
 globalThis.fetch=async url=>{assert.match(String(url),/^https:\/\/api\.pwnedpasswords\.com\/range\/[A-F0-9]{5}$/);return new Response('FFFF:0\n');};
 f.env.ASSETS={fetch:async req=>{const file=path.resolve('web','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream'}});}};
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',async route=>{
  try{
   const request=route.request(),url=new URL(request.url());
   if(url.hostname==='server.arcgisonline.com')return route.fulfill({status:204,body:''}); // Map tiles are unrelated to authentication.
   assert.ok([panelOrigin,collectorOrigin].includes(url.origin),'Bloquear qualquer origem externa: '+url.origin);
   requests.push({method:request.method(),path:url.pathname,origin:url.origin});
   const response=await worker.fetch(new Request(url,{method:request.method(),headers:await request.allHeaders(),...(['POST','PUT'].includes(request.method())?{body:request.postDataBuffer()}: {})}),{...f.env,APP_KIND:url.origin===collectorOrigin?'collector':'panel'});
   await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  }catch(e){errors.push(e.stack);await route.abort();}
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));
 async function shot(name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Sem overflow horizontal');}
 async function login(origin,user,password){await page.goto(origin+'/login');const collector=origin===collectorOrigin;await page.locator(collector?'[name=username]':'#username').fill(user);await page.locator(collector?'[name=password]':'#password').fill(password);await page.getByRole('button',{name:/^Entrar/}).click();}
 try{
  await login(collectorOrigin,'operador',temporaryPassword);await page.waitForURL(collectorOrigin+'/conta');
  await page.locator('#change-password').waitFor({state:'visible'});await page.getByText(/Defina sua senha pessoal/).waitFor();assert.equal(await page.locator('#account-access').isVisible(),false);
  await page.locator('[name=currentPassword]').fill(temporaryPassword);await page.locator('[name=password]').fill(personalPassword);await page.locator('[name=confirm]').fill(personalPassword);await page.getByRole('button',{name:'Salvar nova senha'}).click();
  await page.waitForURL(collectorOrigin+'/login?senha=alterada');await page.getByText(/Senha definida com sucesso/).waitFor();await shot('01-confirmacao-coletor');
  await login(collectorOrigin,'operador',personalPassword);await page.waitForURL(collectorOrigin+'/');await page.getByRole('heading',{name:'Selecione a unidade'}).waitFor();
  await page.goto(collectorOrigin+'/conta');await page.getByText(/Sua senha já está definida/).waitFor();assert.equal(await page.locator('#change-password').isVisible(),false);await shot('02-conta-coletor');
  await page.getByRole('button',{name:'Alterar minha senha'}).click();await page.locator('#change-password').waitFor({state:'visible'});await page.getByRole('button',{name:'Alterar minha senha'}).click();assert.equal(await page.locator('#change-password').isVisible(),false);
  const posts=requests.filter(r=>r.path==='/api/auth/password').length;
  // Exercise the bfcache recovery handler; actual device history remains a physical-browser check.
  await Promise.all([page.waitForEvent('load'),page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})))]);
  await page.getByText(/Sua senha já está definida/).waitFor();assert.equal(await page.locator('#change-password').isVisible(),false);assert.equal(requests.filter(r=>r.path==='/api/auth/password').length,posts);
  await login(panelOrigin,'operador',personalPassword);await page.waitForURL(collectorOrigin+'/login?origem=painel');await page.getByText(/não é necessário definir outra senha/).waitFor();await shot('03-operador-no-endereco-correto');
  await page.goto(panelOrigin+'/conta');await page.getByText(/Seu perfil é operador/).waitFor();assert.equal(await page.locator('#password-form').isVisible(),false);assert.equal(await page.locator('#account-home').getAttribute('href'),collectorOrigin+'/');assert.equal(await page.locator('.sidebar').count(),0);await shot('04-conta-operador-painel');
  await login(panelOrigin,'root',temporaryPassword);await page.waitForURL(panelOrigin+'/conta');await page.locator('#password-form').waitFor({state:'visible'});
  await page.locator('#current').fill(temporaryPassword);await page.locator('#new-password').fill(personalPassword);await page.locator('#confirm').fill(personalPassword);await page.getByRole('button',{name:'Salvar nova senha'}).click();await page.waitForURL(panelOrigin+'/login?senha=alterada');
  await page.getByText('Senha alterada. Entre com sua nova senha.').waitFor();await login(panelOrigin,'root',personalPassword);await page.waitForURL(panelOrigin+'/');
  await page.goto(panelOrigin+'/conta');await page.getByText(/Sua senha já está definida/).waitFor();assert.equal(await page.locator('#password-form').isVisible(),false);
  await page.setViewportSize({width:1280,height:900});await shot('05-conta-root-painel');
  await page.getByRole('button',{name:'Alterar minha senha'}).click();await page.locator('#password-form').waitFor({state:'visible'});assert.equal(await page.locator('#first-access-note').isVisible(),false);
  assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM audit WHERE event='password_changed'").get().n,2,'Somente as duas trocas explícitas');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({status:'PASS',cases:['primeiro acesso coletor','mensagem de confirmação','reentrada sem nova troca','alteração voluntária','restauração da página','operador no painel','primeiro acesso root','conta do root'],database:'SQLite isolado; nenhuma chamada à produção',screenshots:5},null,2));console.log('PASS: fluxo de senha e navegação nos dois ambientes; 5 screenshots.');
 }finally{await browser.close();f.sqlite.close();globalThis.fetch=originalFetch;}
})().catch(e=>{console.error(e);process.exitCode=1;});
