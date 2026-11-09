const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),pw=require('./helpers/playwright.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),sessions=[await session(f,f.root),await session(f,f.operator)],errors=[],out='docs/05-qualidade/evidencias/editar-ambientes-2026-11-09';fs.mkdirSync(out,{recursive:true});let loseResponse=false;
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY'};
 const visit=(await humanFetch(worker,env,'https://test.local',sessions[1],'/api/collector/v3-start',{unitId:f.ids.pending})).data.inspection;
 const room=(await humanFetch(worker,env,'https://test.local',sessions[1],'/api/collector/environment-save',{inspectionId:visit.id,name:'Sala errda'})).data.environment;
 const server=http.createServer(async(req,res)=>{try{
  const origin='http://127.0.0.1:'+server.address().port,url=new URL(req.url,origin),actor=Number(req.headers['x-test-actor']||0),base=path.resolve(actor?'dist/coletor':'dist/painel');
  const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',sessions[actor].cookie);
  const assets={fetch:async r=>{const file=path.resolve(base,'.'+new URL(r.url).pathname);if(!file.startsWith(base+path.sep)||!fs.existsSync(file))return new Response('missing',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.json':'application/json'})[path.extname(file)]||'application/octet-stream'}});}};
  let response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),{...env,APP_KIND:actor?'collector':'panel',ASSETS:assets});
  if(loseResponse&&url.pathname==='/api/root/environment-rename'){loseResponse=false;response=Response.json({error:'TESTE: resposta interrompida após gravar'},{status:503});}
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),desktop=await browser.newPage({viewport:{width:1440,height:950},extraHTTPHeaders:{'X-Test-Actor':'0'}}),mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,extraHTTPHeaders:{'X-Test-Actor':'1'}});
 for(const page of [desktop,mobile]){page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.stack));}
 const dialog=page=>page.getByRole('dialog',{name:'Editar nome do ambiente'}),shot=async(page,name)=>{await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  await desktop.goto(origin+'/ambientes');await desktop.locator('#unit-picker').fill('TESTE ISOLADO · Unidade sem inventário');await desktop.locator('#unit-picker').dispatchEvent('change');
  await desktop.getByRole('button',{name:'Editar nome de Sala errda'}).click();await dialog(desktop).waitFor();
  await mobile.goto(origin+'/coleta-v3?vistoria='+visit.id+'&tela=environment&assunto=B');await mobile.getByRole('button',{name:'Editar nome de Sala errda'}).click();
  await dialog(mobile).getByLabel('Nome do ambiente',{exact:true}).fill('Sala de informática');await shot(mobile,'01-correcao-mobile');
  await mobile.setViewportSize({width:360,height:400});assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot(mobile,'02-altura-reduzida');
  await dialog(mobile).getByRole('button',{name:'Salvar nome',exact:true}).click();await dialog(mobile).waitFor({state:'detached'});await mobile.getByRole('button',{name:'Editar nome de Sala de informática'}).waitFor();
  // Root had opened the old version: preserve its attempted text and show the newer name.
  await dialog(desktop).getByLabel('Nome do ambiente',{exact:true}).fill('Laboratório principal');await dialog(desktop).getByRole('button',{name:'Salvar nome',exact:true}).click();
  await dialog(desktop).getByRole('alert').getByText(/alterado por outra pessoa/).waitFor();assert.equal(await dialog(desktop).getByLabel('Nome do ambiente',{exact:true}).inputValue(),'Laboratório principal');await shot(desktop,'03-conflito-preservado');
  await dialog(desktop).getByRole('button',{name:'Carregar nome atual'}).click();await dialog(desktop).getByLabel('Nome do ambiente',{exact:true}).fill('Laboratório principal');
  loseResponse=true;await dialog(desktop).getByRole('button',{name:'Salvar nome',exact:true}).click();await dialog(desktop).getByRole('alert').getByText(/resposta interrompida/).waitFor();
  const events=f.sqlite.prepare('SELECT COUNT(*) n FROM environment_name_events').get().n;
  await dialog(desktop).getByRole('button',{name:'Salvar nome',exact:true}).click();await dialog(desktop).waitFor({state:'detached'});await desktop.getByRole('button',{name:'Editar nome de Laboratório principal'}).waitFor();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environment_name_events').get().n,events);assert.equal(f.sqlite.prepare('SELECT id FROM environments').get().id,room.id);await shot(desktop,'04-painel-corrigido');
  await mobile.setViewportSize({width:390,height:844});await mobile.getByRole('button',{name:'Atualizar ambientes',exact:true}).click();await mobile.getByRole('button',{name:'Editar nome de Laboratório principal'}).click();
  await dialog(mobile).getByLabel('Nome do ambiente',{exact:true}).fill('Texto cancelado');await dialog(mobile).getByRole('button',{name:'Cancelar',exact:true}).click();await dialog(mobile).waitFor({state:'detached'});
  assert.equal(f.sqlite.prepare('SELECT name FROM environments').get().name,'Laboratório principal');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM environment_name_events').get().n,events);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,events,productionWrites:false,physicalKeyboardTested:false,errors},null,2));console.log(JSON.stringify({passed:true,out}));
 }catch(e){await shot(desktop,'falha-desktop');await shot(mobile,'falha-mobile');console.error(e);console.error(errors);process.exitCode=1;}
 finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})();
