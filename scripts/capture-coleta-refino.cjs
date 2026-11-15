// Capturas e reproduções do refinamento da Coleta (14/11/2026): UI real dentro do shell /app, Worker real em processo,
// SQLite em memória com dados "TESTE ISOLADO". Nenhum acesso externo, nenhuma escrita em produção, nenhum APK.
// Uso: SEMED_TEST_BROWSER=chromium node scripts/capture-coleta-refino.cjs [pasta-de-saida]
// O mesmo roteiro roda sobre a base e sobre o código refinado, com os mesmos dados e viewports (antes/depois).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('../tests/helpers/playwright.cjs');
const QRCode=require('qrcode');
(async()=>{
 const {authFixture,temporaryPassword,panelOrigin}=await import('../tests/helpers/auth-fixture.mjs');
 const worker=(await import('../server/worker.mjs')).default,{session,humanFetch}=await import('../tests/helpers/agent-client.mjs');
 const f=await authFixture(),objects=new Map(),errors=[],requests=[],shots=[],observations=[],timings=[];
 const out=process.argv[2]||'private-data/entregas/coleta-refino-2026-11-14';fs.mkdirSync(out+'/EVIDENCIAS',{recursive:true});
 f.sqlite.prepare('UPDATE users SET must_change=0').run();
 const root=await session(f,f.root),call=(p,d)=>humanFetch(worker,f.env,panelOrigin,root,p,d);
 const rev=()=>f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision;
 assert.equal((await call('/api/dispatch/technician',{userId:f.root.id,enabled:true,operationId:crypto.randomUUID(),revision:rev()})).status,200);
 f.env.PHOTOS={put:async(k,b)=>objects.set(k,b),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)};
 f.env.ASSETS={fetch:async req=>{const file=path.resolve('web','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});}};
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 let holdPhoto=false,releasePhoto=null,dropNext=null,delayPath=null,delayMs=0;
 await context.route('**/*',async route=>{const start=performance.now();try{const r=route.request(),u=new URL(r.url());assert.equal(u.origin,panelOrigin,'No external requests');if(holdPhoto&&u.pathname==='/api/collector/photo-upload')await new Promise(resolve=>releasePhoto=resolve);const response=await worker.fetch(new Request(u,{method:r.method(),headers:await r.allHeaders(),...(r.method()==='POST'?{body:r.postDataBuffer()}:{})}),f.env);const entry={path:u.pathname,method:r.method(),status:response.status,ms:Math.round(performance.now()-start)};requests.push(entry);if(dropNext&&u.pathname===dropNext){dropNext=null;entry.dropped=true;await route.abort('connectionreset');return;}if(delayPath&&u.pathname===delayPath)await new Promise(r=>setTimeout(r,delayMs));await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}catch(e){errors.push(e.message);await route.abort();}});
 const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.SemedNative={hasQueueTracking:()=>false,signedIn:()=>{},signedOut:()=>{},stopQueueTracking:()=>{},stopTracking:()=>{},resumeQueueTracking:()=>{}};if(navigator.mediaDevices)navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('TESTE ISOLADO: sem câmera física','NotAllowedError');};});
 const shot=async(name,description,{full=false}={})=>{const file=name+'-'+page.viewportSize().width+'x'+page.viewportSize().height+'.png';await page.screenshot({path:out+'/EVIDENCIAS/'+file,fullPage:full});shots.push({file,description,viewport:page.viewportSize(),fullPage:full});};
 const col=()=>page.frameLocator('iframe[name=semed-collect]');
 const colDoc=()=>page.evaluateHandle(()=>document.querySelector('iframe[name=semed-collect]').contentDocument);
 const colText=async()=>(await colDoc()).evaluate(d=>d.querySelector('#collector')?.innerText||'');
 const saveState=async()=>(await colDoc()).evaluate(d=>d.querySelector('.save-state')?.textContent||'');
 const cards=async()=>{await col().locator('[data-action=cards]').click();await col().locator('.cards').waitFor();};
 const open=async g=>{await col().locator(`[data-action=open][data-topic=${g}]`).click();};
 const blur=async()=>{await (await colDoc()).evaluate(d=>d.activeElement?.blur());await page.waitForTimeout(120);};
 const countSince=(mark,filter=()=>true)=>requests.slice(mark).filter(r=>r.path.startsWith('/api/')&&filter(r)).map(r=>r.path+(r.method==='POST'?' POST':''));
 const measure=async(label,fn)=>{const mark=requests.length,t=performance.now();await fn();timings.push({action:label,ms:Math.round(performance.now()-t),requests:countSince(mark)});};
 const png={name:'TESTE-ISOLADO.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64')};
 const selectRoom=async name=>{await col().locator('[data-action=choose-environment]').click();const d=col().getByRole('dialog',{name:'Selecionar ambiente'});await d.getByText(/ambiente\(s\) · lista atualizada/).waitFor();const o=d.locator('[data-room-id]').filter({has:col().getByText(name,{exact:true})});if(await o.count())await o.click();else{await d.getByRole('button',{name:'+ Cadastrar novo ambiente',exact:true}).click();await d.getByLabel('Nome do novo ambiente').fill(name);await d.getByRole('button',{name:'Cadastrar e selecionar',exact:true}).click();}await d.waitFor({state:'detached'});};
 try{
  // ---- acesso e áreas ----
  await page.goto(panelOrigin+'/app');await page.locator('#login').waitFor();await shot('01-login','Entrada do app unificado antes de autenticar.');
  await page.locator('#login [name=username]').fill('root');await page.locator('#login [name=password]').fill(temporaryPassword);await page.locator('#login button').click();await page.locator('[data-open=collect]').waitFor();await shot('02-areas','Escolha de área (mesma conta habilitada para ambas na fixture).');
  await page.locator('nav [data-area=collect]').click();await col().getByRole('heading',{name:'Selecione a unidade',exact:true}).waitFor();await shot('03-lista-unidades','Lista inicial da Coleta dentro do shell.');
  const shell=await page.evaluate(()=>{const f=document.querySelector('iframe[name=semed-collect]'),r=f.getBoundingClientRect();return {viewport:innerHeight,shellHeight:Math.round(r.top),frameHeight:Math.round(r.height)};});
  // ---- fachada e OBS-01 ----
  await col().getByRole('button',{name:/Unidade sem inventário/}).click();await col().getByRole('heading',{name:'Fachada da unidade',exact:true}).first().waitFor();
  const header=await (await colDoc()).evaluate(d=>Math.round(d.querySelector('.app-header').getBoundingClientRect().height));
  observations.push({id:'OBS-02',kind:'MEDIDO_LOCAL',...shell,collectorHeader:header,chromeBeforeContent:shell.shellHeight+header,contentHeight:shell.viewport-shell.shellHeight-header});
  await shot('04-fachada','Fachada antes de qualquer foto.');
  holdPhoto=true;await col().locator('input[data-photo]').last().setInputFiles(png);
  await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelector('.save-state')?.textContent.includes('Enviando'));
  await shot('05-foto-enviando','Envio de foto retido na fixture: estado visível no bloco e na faixa.');
  const back=col().locator('[data-action=cards]');const t0=Date.now();await back.click();await page.waitForTimeout(700);
  const screenAfter=await (await colDoc()).evaluate(d=>d.querySelector('#collector').dataset.screen);
  observations.push({id:'OBS-01',kind:'REPRODUCAO',description:'Clique em Voltar às categorias durante o envio da foto.',navigatedWithinMs:Date.now()-t0,screenAfterClick:screenAfter,previewKept:true});
  if(screenAfter==='cards')await shot('05b-categorias-durante-envio','Navegação liberada durante o envio; a faixa continua informando o envio.');
  holdPhoto=false;releasePhoto?.();
  await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelector('.save-state')?.textContent.includes('recebida'));
  if(screenAfter!=='cards')await cards();await shot('06-categorias','Sequência de assuntos com o estado da fachada.');
  // ---- assuntos ----
  await measure('abrir assunto A',async()=>{await open('A');await col().getByLabel('Nome completo do acompanhante').waitFor();});
  await col().getByLabel('Nome completo do acompanhante').fill('TESTE ISOLADO · Acompanhante');await blur();await shot('07-acompanhante','Acompanhante (nome e função opcionais).');await cards();
  await open('C');await col().getByLabel('A unidade possui serviço de internet?').selectOption('Sim');await col().getByLabel('Quantos links foram identificados?').selectOption('1');await col().getByRole('button',{name:'+ Adicionar registro'}).click();await col().getByLabel(/Provedor/).fill('Provedor TESTE');await blur();await shot('08-internet','Link com identidade legível no título do registro.',{full:true});await cards();
  await open('D');await col().getByRole('button',{name:'+ Adicionar registro'}).click();await col().getByLabel(/Nome da rede/).fill('SEMED-TESTE');await blur();await shot('09-wifi','Rede Wi-Fi (SSID e observações).');await cards();
  await open('B');await col().getByLabel('Nome do ambiente',{exact:true}).fill('Secretaria');await col().getByRole('button',{name:'Adicionar ambiente',exact:true}).click();await col().getByText('Secretaria',{exact:true}).first().waitFor();await shot('10-ambientes','Catálogo de ambientes com cadastro e foto opcional.');await cards();
  // ---- computadores ----
  await measure('abrir assunto F (lista vazia)',async()=>{await open('F');await col().getByRole('button',{name:'+ Adicionar computador'}).waitFor();});
  await shot('11-lista-vazia','Lista de computadores vazia: ação principal no rodapé.');
  await col().getByRole('button',{name:'+ Adicionar computador'}).click();await col().locator('h2:text-is("Computador")').waitFor();await shot('12-ficha-nova','Ficha nova: cadastro, localização, acesso remoto, patrimônio, funcionamento.',{full:true});
  await col().getByRole('button',{name:'Ler QR Code',exact:true}).click();await col().locator('.qr-status').filter({hasText:'Permissão de câmera negada'}).waitFor();await shot('13-qr-negado','Câmera negada (simulação): galeria como alternativa.');
  const expiredQr=await QRCode.toBuffer(JSON.stringify({type:'semed.agent.pairing',version:1,enrollment_id:crypto.randomUUID(),pairing_code:'ABCDEFGHIJKLMNOPQRSTUV0123456789',expires_at:new Date(Date.now()-60000).toISOString()}),{scale:6});
  const qrMark=requests.length;await col().locator('input[data-qr="file"]').setInputFiles({name:'qr.png',mimeType:'image/png',buffer:expiredQr});await col().locator('.notice.error').waitFor();
  observations.push({id:'T07-QR-VENCIDO',kind:'REPRODUCAO',message:(await colText()).match(/[^\n]*(venc|expir)[^\n]*/i)?.[0]||null,requests:countSince(qrMark)});
  await shot('13b-qr-vencido','QR com validade vencida: mensagem específica.');
  await col().getByRole('button',{name:'Cadastrar sem agente',exact:true}).click();await shot('14-manual','Cadastro manual: motivo obrigatório.');
  await col().locator('[data-field=anydesk]').fill('001234567');await page.waitForTimeout(150);await shot('15-digitacao','Campo em foco (teclado simulado pelo navegador): Salvar e Fechar teclado no cabeçalho.');
  await page.setViewportSize({width:390,height:470});await col().locator('[data-field=anydesk]').focus();await page.waitForTimeout(200);
  const typing=await (await colDoc()).evaluate(d=>{const i=d.querySelector('[data-field=anydesk]'),r=i.getBoundingClientRect(),h=d.querySelector('.app-header').getBoundingClientRect();return {fieldTop:Math.round(r.top),fieldBottom:Math.round(r.bottom),headerBottom:Math.round(h.bottom),viewport:innerHeight,visible:r.top>=h.bottom&&r.bottom<=innerHeight};});
  observations.push({id:'T14-TECLADO-SIMULADO',kind:'MEDIDO_LOCAL',note:'Viewport curto simula o teclado; não é teclado Android real.',...typing});
  await shot('16-altura-reduzida','Viewport de 470px simulando teclado: campo, rótulo e Salvar visíveis.');
  await page.setViewportSize({width:390,height:844});await blur();
  await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await col().locator('.notice.error').waitFor();await shot('17-validacao','Salvar ficha incompleta: resumo dos campos e erro abaixo de cada um.',{full:true});
  await selectRoom('Secretaria');await col().getByLabel(/Posição no ambiente/).fill('Bancada 2 / PC 7');await col().getByLabel('Motivo da ausência do agente').selectOption('Sistema incompatível');await col().getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');await col().getByLabel('Funcionamento observado').selectOption('Funcionando');await blur();
  await measure('salvar ficha de computador',async()=>{await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await col().locator('.equipment-card').first().waitFor();});
  await shot('18-lista-com-ficha','Lista após salvar: ambiente · posição em destaque, selos de vínculo.');
  // ---- trava expirada e resposta perdida ----
  await col().getByRole('button',{name:'Editar',exact:true}).click();await col().getByLabel(/Posição no ambiente/).waitFor();
  const equipmentId=f.sqlite.prepare("SELECT id FROM equipments WHERE position_label='Bancada 2 / PC 7'").get().id;
  f.sqlite.prepare('UPDATE equipment_locks SET expires_at=? WHERE equipment_id=?').run(Date.now()-1000,equipmentId);
  await col().getByLabel(/Posição no ambiente/).fill('Bancada 2 / PC 7 (editada após 3 min)');await blur();
  const lockMark=requests.length;await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await page.waitForTimeout(1500);
  observations.push({id:'TRAVA-EXPIRADA',kind:'REPRODUCAO',saved:f.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(equipmentId).position_label,backOnList:await col().locator('.equipment-card').count(),requests:countSince(lockMark)});
  await shot('19-trava-expirada','Resultado após salvar com a trava de 3 min vencida.');
  if(!(await col().locator('.equipment-card').count())){await col().getByRole('button',{name:'Voltar à lista',exact:true}).click().catch(()=>{});await col().locator('dialog[open] [data-confirm]').click().catch(()=>{});}
  await col().getByRole('button',{name:'+ Adicionar computador'}).click();await col().locator('dialog[open] [data-confirm]').click({timeout:1500}).catch(()=>{});await col().getByRole('button',{name:'Cadastrar sem agente',exact:true}).click();await selectRoom('Secretaria');await col().getByLabel(/Posição no ambiente/).fill('PC-NOVO');await col().getByLabel('Motivo da ausência do agente').selectOption('Não liga');await col().getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');await col().getByLabel('Funcionamento observado').selectOption('Não funciona');await col().getByLabel('Descrição dos problemas').fill('TESTE ISOLADO · não liga');await blur();
  dropNext='/api/collector/equipment-save';const lostMark=requests.length;await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await page.waitForTimeout(2000);
  let onForm=await col().getByRole('button',{name:'Salvar equipamento',exact:true}).count();
  if(onForm){await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await page.waitForTimeout(1500);}
  observations.push({id:'RESPOSTA-PERDIDA',kind:'REPRODUCAO',operatorHadToRetry:!!onForm,rowsOnServer:f.sqlite.prepare("SELECT count(*) n FROM equipments WHERE position_label='PC-NOVO'").get().n,backOnList:await col().locator('.equipment-card').count(),status:await saveState(),requests:countSince(lostMark)});
  await shot('20-resposta-perdida','Resultado após a resposta do primeiro Salvar se perder.');
  if(await col().getByRole('button',{name:'Voltar à lista',exact:true}).count()){await col().getByRole('button',{name:'Voltar à lista',exact:true}).click();await col().locator('dialog[open] [data-confirm]').click({timeout:1500}).catch(()=>{});await col().locator('.equipment-card').first().waitFor();}
  // ---- conflito de versão ----
  if(await col().locator('.equipment-card').count()){
   if(!await col().locator('.equipment-card').filter({hasText:'PC-NOVO'}).count()){await col().getByRole('button',{name:'Atualizar lista',exact:true}).click();await col().locator('.equipment-card').filter({hasText:'PC-NOVO'}).waitFor();}
   await col().locator('.equipment-card').filter({hasText:'PC-NOVO'}).getByRole('button',{name:'Editar',exact:true}).click();await col().locator('dialog[open] [data-confirm]').click({timeout:1500}).catch(()=>{});await col().getByLabel(/Posição no ambiente/).waitFor();
   f.sqlite.prepare('UPDATE equipments SET version=version+1,updated_at=? WHERE position_label=?').run(Date.now(),'PC-NOVO');
   await col().getByLabel(/Posição no ambiente/).fill('PC-NOVO (minha edição)');await blur();await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await page.waitForTimeout(1200);
   const dialog=await col().locator('dialog[open]').count();
   observations.push({id:'CONFLITO-VERSAO',kind:'REPRODUCAO',dialogOffered:!!dialog,screen:(await colText()).match(/[^\n]*(outra sessão|Outra pessoa|Conflito)[^\n]*/i)?.[0]||null,localValueKept:(await col().getByLabel(/Posição no ambiente/).inputValue().catch(()=>''))});
   await shot('21-conflito','Outra sessão alterou a ficha: escolha explícita entre manter e recarregar.');
   if(dialog)await col().locator('dialog[open] [data-cancel]').click();
   await col().getByRole('button',{name:'Voltar à lista',exact:true}).click();await col().locator('dialog[open] [data-confirm]').click().catch(()=>{});await col().locator('.equipment-card').first().waitFor();
  }
  // ---- lista longa ----
  const room=f.sqlite.prepare("SELECT id FROM environments WHERE name='Secretaria'").get().id,inspection=f.sqlite.prepare("SELECT id FROM inspections WHERE unit_id=? AND state='open'").get(f.ids.pending).id,now=Date.now();
  const insert=f.sqlite.prepare("INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,data_json,search_text,created_by,created_at,updated_by,updated_at,position_label) VALUES(?,?,?,?,?,'','',?,?,?,?,?,?,?)");
  for(let i=1;i<=1000;i++){const data={category:'desktop',mode:'Individual',quantity:1,registration:'Manual',manualReason:'Sistema incompatível',environment:room,environmentName:'Secretaria',position_label:'PC-'+String(i).padStart(4,'0'),assetStatus:'Sem patrimônio',operation:'Funcionando',brand:'TESTE',model:'MODELO '+String(i).padStart(4,'0')};insert.run(crypto.randomUUID(),f.ids.pending,inspection,'desktop',room,JSON.stringify(data),'teste '+data.model.toLowerCase()+' desktop',f.root.id,now-i*1000,f.root.id,now-i*1000,data.position_label);}
  await measure('atualizar lista com 1000+ fichas (página 1)',async()=>{await col().getByRole('button',{name:'Atualizar lista',exact:true}).click();await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelectorAll('.equipment-card').length>=50);});
  await measure('mostrar mais (página 2)',async()=>{await col().getByRole('button',{name:/Mostrar mais/}).click();await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelectorAll('.equipment-card').length>=100);});
  await shot('22-lista-longa','1000+ fichas: 50 por página, "Mostrar mais", sem carregar tudo.');
  await measure('buscar na lista',async()=>{await col().getByLabel('Filtrar esta lista').fill('MODELO 0999');await col().getByLabel('Filtrar esta lista').press('Enter');await page.waitForFunction(()=>document.querySelector('iframe[name=semed-collect]').contentDocument.querySelectorAll('.equipment-card').length===1);});
  await col().getByRole('button',{name:'Limpar busca'}).click();await col().locator('.equipment-card').first().waitFor();
  // ---- impressora ----
  await cards();await open('G');await col().getByRole('button',{name:'+ Adicionar impressora'}).click();await col().locator('dialog[open] [data-confirm]').click().catch(()=>{});await col().locator('h2:text-is("Impressora")').waitFor();await shot('23-impressora','Ficha de impressora: foto obrigatória antes de concluir.',{full:true});
  // ---- revisão ----
  await cards();await measure('revisar visita',async()=>{await col().getByRole('button',{name:'Revisar visita'}).click();await col().getByRole('heading',{name:'Confira antes de concluir'}).waitFor();});
  await shot('24-revisao','Revisão: pendências por assunto, campos como etiquetas, ação que abre o registro exato.',{full:true});
  observations.push({id:'OBS-03',kind:'OBSERVADO',longestPendingText:Math.max(...(await (await colDoc()).evaluate(d=>[...d.querySelectorAll('.pending-item span, .pending-item .chip')].map(e=>e.textContent.length))),0)});
  await page.setViewportSize({width:360,height:800});await shot('25-revisao','Revisão em 360px.');await page.setViewportSize({width:812,height:375});await shot('26-revisao-paisagem','Revisão em paisagem 812×375.');await page.setViewportSize({width:390,height:844});
  const noOverflow=await (await colDoc()).evaluate(d=>d.documentElement.scrollWidth<=d.defaultView.innerWidth);observations.push({id:'G01-SEM-ROLAGEM-HORIZONTAL',ok:noOverflow});
  // abrir a pendência de Internet: deve levar ao campo exato
  const fix=col().locator('.pending-item[data-code=RESPOSTA_PENDENTE]').first().getByRole('button');await fix.click();await page.waitForTimeout(600);
  const focused=await (await colDoc()).evaluate(d=>({field:d.activeElement?.dataset?.field||d.activeElement?.tagName,invalid:d.querySelectorAll('[aria-invalid=true]').length}));
  observations.push({id:'REVISAO-ABRE-CAMPO',kind:'REPRODUCAO',...focused});
  await shot('27-pendencia-aberta','Da revisão para o campo que falta, já em foco.');
  // ---- sessão expirada dentro do app (401 no meio da ficha) ----
  await cards();await open('F');await col().locator('.equipment-card').first().getByRole('button',{name:'Editar',exact:true}).click();await col().locator('dialog[open] [data-confirm]').click({timeout:1500}).catch(()=>{});await col().getByLabel(/Posição no ambiente/).waitFor();
  await col().getByLabel(/Posição no ambiente/).fill('DIGITADO ANTES DO 401');await blur();
  f.sqlite.prepare('DELETE FROM sessions').run();
  await col().getByRole('button',{name:'Salvar equipamento',exact:true}).click();await page.locator('#login').waitFor();
  await shot('28-sessao-expirada','401 no meio da ficha: o shell pede a senha do mesmo usuário; a ficha fica na memória.');
  await page.locator('#login [name=password]').fill(temporaryPassword);await page.locator('#login button').click();await page.locator('iframe[name=semed-collect]').waitFor({state:'visible'});await page.waitForTimeout(800);
  const kept=await col().getByLabel(/Posição no ambiente/).inputValue().catch(()=>null);
  observations.push({id:'T12-401-RETOMADA',kind:'REPRODUCAO',valueKeptAfterRelogin:kept,status:await saveState()});
  await shot('29-sessao-retomada','Depois de entrar de novo: a ficha e o texto digitado continuam.');
  assert.deepEqual(errors,[]);
 }catch(e){await shot('FALHA',e.message).catch(()=>{});observations.push({id:'FALHA',message:e.message});console.error(e);process.exitCode=1;}
 finally{fs.writeFileSync(out+'/capturas.json',JSON.stringify({at:new Date().toISOString(),source:'Worker real e SQLite isolado; assets web atuais; nenhum acesso externo; nenhum aparelho físico',physicalDevice:false,shots,observations,timings,errors,requestsByPath:Object.entries(requests.filter(r=>r.path.startsWith('/api/')).reduce((m,r)=>(m[r.path+(r.method==='POST'?' POST':'')]=(m[r.path+(r.method==='POST'?' POST':'')]||0)+1,m),{})).sort((a,b)=>b[1]-a[1])},null,2));await browser.close();f.sqlite.close();}
 console.log(JSON.stringify({out,shots:shots.length,observations,timings,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
