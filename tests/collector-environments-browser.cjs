const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const pw=require('./helpers/playwright.cjs'),selectEnvironment=require('./helpers/select-environment.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),second={id:crypto.randomUUID(),username:'operador-2-teste',role:'operador'};
 f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(second.id,second.username,second.role,'TEST','TEST',Date.now());
 const sessions=[await session(f,f.operator),await session(f,second)],errors=[],requests=[],out='docs/05-qualidade/evidencias/ambientes-compartilhados-2026-11-09';fs.mkdirSync(out,{recursive:true});let failList=false;
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector',ASSETS:{fetch:async req=>{
  const file=path.resolve('web','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});
  return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});
 }}};
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1:'+server.address().port),chunks=[];for await(const c of req)chunks.push(c);
  requests.push({method:req.method,path:url.pathname});
  const headers=new Headers(req.headers);headers.set('Cookie',sessions[Number(req.headers['x-test-actor']||0)].cookie);
  const response=failList&&url.pathname==='/api/collector/environments'?Response.json({error:'TESTE: conexão interrompida'},{status:503}):await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const visit=(await humanFetch(worker,env,origin,sessions[0],'/api/collector/v3-start',{unitId:f.ids.pending})).data.inspection;
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),pages=[];
 for(let n=0;n<2;n++){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,extraHTTPHeaders:{'X-Test-Actor':String(n)}}),page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.stack));pages.push(page);
 }
 const [a,b]=pages,shot=async(p,name)=>{await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:out+'/'+name+'.png',fullPage:true});};
 try{
  await a.goto(origin+'/coleta-v3?vistoria='+visit.id+'&tela=environment&assunto=B');
  await b.goto(origin+'/coleta-v3?vistoria='+visit.id+'&tela=inventory&assunto=F');await b.getByRole('button',{name:'+ Adicionar computador'}).click();
  await b.getByRole('button',{name:'Cadastrar sem agente',exact:true}).click();await b.getByLabel('Motivo da ausência do agente').selectOption('Sistema incompatível');await b.getByLabel(/Posição no ambiente/).fill('PC 07');
  await b.getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');await b.getByLabel('Funcionamento observado').selectOption('Funcionando');
  await b.getByLabel(/Posição no ambiente/).evaluate(el=>el.blur());
  await b.getByRole('button',{name:'Salvar equipamento',exact:true}).click();
  await b.waitForFunction(()=>document.activeElement?.dataset.field==='environmentName');
  assert.equal(await b.locator('[data-action=choose-environment]').getAttribute('aria-invalid'),'true');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environments').get().n,0);
  // Segundo navegador já estava aberto quando o primeiro cadastrou o ambiente.
  await a.getByLabel('Nome do ambiente',{exact:true}).fill('Laboratório de informática');await a.getByRole('button',{name:'Adicionar ambiente',exact:true}).click();await a.getByText('Laboratório de informática',{exact:true}).waitFor();
  const writes=requests.filter(r=>r.method==='POST').length;
  await b.locator('[data-action=choose-environment]').click();const dialog=b.getByRole('dialog',{name:'Selecionar ambiente'});
  await dialog.getByText(/lista atualizada/).waitFor();await dialog.getByText('Laboratório de informática',{exact:true}).waitFor();
  assert.equal(await b.evaluate(()=>document.activeElement.id),'environment-picker-title','Não abrir teclado automaticamente');
  assert.equal(requests.filter(r=>r.method==='POST').length,writes,'Abrir lista é somente leitura');await shot(b,'01-selecao-compartilhada');
  await dialog.locator('[data-room-id]').click();await dialog.waitFor({state:'detached'});assert.equal(await b.getByLabel(/Posição no ambiente/).inputValue(),'PC 07');
  await a.getByLabel('Nome do ambiente',{exact:true}).fill('Secretaria');await a.getByRole('button',{name:'Adicionar ambiente',exact:true}).click();await a.getByText('Secretaria',{exact:true}).waitFor();
  await b.locator('[data-action=choose-environment]').click();await dialog.getByText('Secretaria',{exact:true}).waitFor();
  await dialog.getByLabel('Buscar ambiente').fill('lab');assert.equal(await dialog.locator('[data-room-id]').count(),1);
  failList=true;await dialog.getByRole('button',{name:'Atualizar lista',exact:true}).click();await dialog.getByRole('alert').getByText(/Não foi possível atualizar/).waitFor();
  failList=false;await dialog.getByRole('button',{name:'Atualizar lista',exact:true}).click();await dialog.getByText(/lista atualizada/).waitFor();
  await dialog.getByRole('button',{name:'Fechar seleção de ambiente'}).click();await dialog.waitFor({state:'detached'});assert.match(await b.locator('[data-action=choose-environment]').innerText(),/Laboratório/);
  await b.waitForFunction(()=>document.activeElement?.dataset.action==='choose-environment');
  // Cadastro pela ficha: normalização reaproveita ID e não perde outros campos.
  await selectEnvironment(b,'  LABORATORIO DE INFORMATICA  ');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environments').get().n,2);
  assert.equal(await b.getByLabel(/Posição no ambiente/).inputValue(),'PC 07');await shot(b,'02-ficha-com-ambiente');
  await b.getByRole('button',{name:'Salvar equipamento',exact:true}).click();await b.locator('.equipment-card').waitFor();
  const saved=f.sqlite.prepare('SELECT * FROM equipments').get(),room=f.sqlite.prepare('SELECT * FROM environments WHERE name=?').get('Laboratório de informática');assert.equal(saved.environment_id,room.id);assert.equal(saved.created_by,second.id);
  assert.equal(saved.published_json,null);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environments').get().n,2);
  await b.getByRole('button',{name:'Editar',exact:true}).click();assert.match(await b.locator('[data-action=choose-environment]').innerText(),/Laboratório/);
  await b.setViewportSize({width:360,height:640});await b.locator('[data-action=choose-environment]').click();await dialog.getByText(/lista atualizada/).waitFor();assert.ok(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot(b,'03-selecao-360');
  await b.setViewportSize({width:812,height:375});assert.ok(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot(b,'04-selecao-paisagem');
  await dialog.getByRole('button',{name:'Fechar seleção de ambiente'}).click();
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,twoOperators:true,photosOrOfficialDataWritten:false,physicalDevicesTested:false,errors},null,2));console.log(JSON.stringify({passed:true,out}));
 }catch(e){await shot(b,'falha');console.error(e);console.error(errors);process.exitCode=1;}
 finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})();
