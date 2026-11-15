// Handoff evidence only: real UI/Worker + isolated SQLite, no external requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('../tests/helpers/playwright.cjs');
(async()=>{
 const {authFixture,temporaryPassword,panelOrigin}=await import('../tests/helpers/auth-fixture.mjs');
 const worker=(await import('../server/worker.mjs')).default,{session,humanFetch}=await import('../tests/helpers/agent-client.mjs');
 const f=await authFixture(),objects=new Map(),errors=[],requests=[],shots=[],observations=[];
 const out='private-data/entregas/coletor-refino-2026-11-14';fs.mkdirSync(out+'/EVIDENCIAS',{recursive:true});
 f.sqlite.prepare('UPDATE users SET must_change=0').run();
 const root=await session(f,f.root),call=(p,d)=>humanFetch(worker,f.env,panelOrigin,root,p,d);
 let rev=()=>f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision;
 assert.equal((await call('/api/dispatch/technician',{userId:f.root.id,enabled:true,operationId:crypto.randomUUID(),revision:rev()})).status,200);
 const requestId=crypto.randomUUID();
 assert.equal((await call('/api/operations/request-save',{id:requestId,operationId:crypto.randomUUID(),version:0,unitId:f.ids.pending,equipmentId:null,description:'TESTE ISOLADO · conferir rede do laboratório',kind:'Visita técnica',source:'Painel',requester:'',responsible:'',scheduledDate:'',note:'',status:'Aberta'})).status,201);
 assert.equal((await call('/api/dispatch/assign',{id:requestId,userIds:[f.root.id],operationId:crypto.randomUUID(),revision:rev()})).status,200);
 f.env.PHOTOS={put:async(k,b)=>objects.set(k,b),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)};
 f.env.ASSETS={fetch:async req=>{const file=path.resolve('web','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});}};
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext({viewport:{width:390,height:844}});
 let holdPhoto=false,releasePhoto;
 await context.route('**/*',async route=>{const start=performance.now();try{const r=route.request(),u=new URL(r.url());assert.equal(u.origin,panelOrigin,'No external requests');if(holdPhoto&&u.pathname==='/api/collector/photo-upload')await new Promise(resolve=>releasePhoto=resolve);const response=await worker.fetch(new Request(u,{method:r.method(),headers:await r.allHeaders(),...(r.method()==='POST'?{body:r.postDataBuffer()}:{})}),f.env);requests.push({path:u.pathname,method:r.method(),status:response.status,ms:Math.round(performance.now()-start)});await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}catch(e){errors.push(e.message);await route.abort();}});
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.SemedNative={hasQueueTracking:()=>false,signedIn:()=>{},signedOut:()=>{},stopQueueTracking:()=>{},stopTracking:()=>{}};if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('TESTE ISOLADO: sem câmera física','NotAllowedError');};});
 const shot=async(name,description)=>{await page.screenshot({path:out+'/EVIDENCIAS/'+name+'.png',fullPage:true});shots.push({file:name+'.png',description,viewport:page.viewportSize(),fullPage:true});};
 const col=()=>page.frameLocator('iframe[name=semed-collect]');
 const cards=async()=>{await col().locator('[data-action=cards]').click();await col().locator('.cards').waitFor();};
 const open=async g=>{await col().locator(`[data-action=open][data-topic=${g}]`).click();};
 const blur=async()=>{await col().locator('body').evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(100);};
 const png={name:'TESTE-ISOLADO.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64')};
 try{
  await page.goto(panelOrigin+'/app');await page.locator('#login').waitFor();await shot('01-login','Entrada compartilhada atual, antes de autenticar.');
  await page.locator('#login [name=username]').fill('root');await page.locator('#login [name=password]').fill(temporaryPassword);await page.locator('#login button').click();await page.locator('[data-open=collect]').waitFor();await shot('02-areas','Escolha de área, mesma conta habilitada para ambas na fixture.');
  await page.locator('nav [data-area=technician]').click();await page.frameLocator('iframe[name=semed-technician]').locator('.task').first().waitFor();await shot('03-referencia-tecnico','Referência real do frontend técnico aprovado, demanda sintética, sem aceite/GPS.');
  await page.locator('nav [data-area=collect]').click();await col().getByRole('heading',{name:'Selecione a unidade',exact:true}).waitFor();await shot('04-lista','Lista inicial da coleta, seleção de unidade oficial simulada.');
  await col().getByRole('button',{name:/Unidade sem inventário/}).click();await col().getByRole('heading',{name:'Fachada da unidade',exact:true}).first().waitFor();await shot('05-fachada','Fachada antes do envio, câmera/galeria.');
  holdPhoto=true;await col().locator('input[data-photo]').last().setInputFiles(png);
  await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelector('.save-state')?.textContent.includes('Enviando'));
  await shot('06-foto-enviando','Upload deliberadamente retido na fixture para observar ações durante envio.');
  const back=col().locator('[data-action=cards]');const backEnabled=await back.isEnabled();await back.click();
  const remainsFacade=await col().locator('#collector').getAttribute('data-screen')==='facade';
  observations.push({id:'OBS-01',classification:'REPRODUZIDO_LOCAL',description:'Durante photoBusy, Voltar aparece habilitado, mas clique é ignorado.',backEnabled,remainsFacade,artificialNetworkDelay:true});
  assert.ok(backEnabled&&remainsFacade);holdPhoto=false;releasePhoto();
  await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelector('.save-state')?.textContent.includes('Fotografia recebida'));
  await cards();await shot('07-categorias','Oito assuntos, estados manuais atuais.');
  await open('A');await shot('08-acompanhante','Nome e função opcionais.');await cards();
  await open('C');await col().getByLabel('A unidade possui serviço de internet?').selectOption('Sim');await col().getByLabel('Quantos links foram identificados?').selectOption('1');await col().getByRole('button',{name:'+ Adicionar registro'}).click();await shot('09-internet','Campos de um link; conteúdo completo também exportado em TXT.');await cards();
  await open('D');await col().getByRole('button',{name:'+ Adicionar registro'}).click();await shot('10-wifi','SSID/observações; não registrar senhas em texto comum.');await cards();
  await open('B');await shot('11-ambientes','Catálogo de ambientes, edição e fotos.');await cards();
  await open('F');await shot('12-lista-computadores','Lista e busca, antes de criar ficha.');await col().getByRole('button',{name:'+ Adicionar computador'}).click();await shot('13-computador-novo','Ficha nova: QR/manual, posição, foto e campos.');
  await col().getByRole('button',{name:'Ler QR Code',exact:true}).click();await col().locator('.qr-status').filter({hasText:'Permissão de câmera negada'}).waitFor();await shot('14-qr-negado','Negação de câmera simulada; galeria como alternativa.');await col().locator('[data-qr=cancel]').first().click();
  await col().getByRole('button',{name:'Cadastrar sem agente',exact:true}).click();await shot('15-manual','Modo manual exige motivo, regras atuais.');
  await col().locator('[data-field=anydesk]').fill('001234567');await shot('16-digitacao','Foco real de navegador; não é teclado Android físico.');
  const sizing=await page.evaluate(()=>{const f=document.querySelector('iframe[name=semed-collect]'),r=f.getBoundingClientRect();return{viewport:innerHeight,frameHeight:Math.round(r.height),shellHeight:Math.round(r.top)};});
  observations.push({id:'OBS-02',classification:'MEDIDO_LOCAL',description:'Altura ocupada pelo shell antes do cabeçalho próprio do coletor.',...sizing});
  await page.setViewportSize({width:390,height:470});await shot('17-altura-reduzida','Simulação de viewport curto; não comprova comportamento de teclado físico.');await page.setViewportSize({width:390,height:844});await blur();
  await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await col().locator('.notice.error').waitFor();await shot('18-validacao','Salvar ficha incompleta: mensagens e foco atuais.');
  await cards();await open('G');await col().getByRole('button',{name:'+ Adicionar impressora'}).click();await col().locator('dialog[open] [data-confirm]').click().catch(()=>{});
  // Exact confirmation controls differ from browser-native confirm; use dialog button text.
  if(await col().locator('dialog[open]').count())await col().locator('dialog[open] button').last().click();
  await col().getByRole('heading',{name:'Impressora',exact:true}).first().waitFor();await shot('19-impressora','Ficha impressora e fotografia obrigatória para conclusão.');
  await cards();await col().getByRole('button',{name:'Revisar visita'}).click();await col().getByRole('heading',{name:'Confira antes de concluir'}).waitFor();await shot('20-revisao','Revisão com pendências estruturadas; não conclui automaticamente.');
  await page.setViewportSize({width:360,height:800});await shot('21-revisao-360','Revisão com largura 360.');await page.setViewportSize({width:812,height:375});await shot('22-revisao-paisagem','Revisão em paisagem 812×375.');
  assert.deepEqual(errors,[]);
 }catch(e){await shot('FALHA',e.message).catch(()=>{});throw e;}
 finally{fs.writeFileSync(out+'/capturas.json',JSON.stringify({at:new Date().toISOString(),source:'Worker real e SQLite isolado; assets web atuais; nenhum acesso externo',physicalDevice:false,shots,observations,errors,requests},null,2));await browser.close();f.sqlite.close();}
 console.log(JSON.stringify({out,shots:shots.length,observations,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
