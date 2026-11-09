// Real Worker + in-memory SQLite + local object binding. No external services.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const pw=require('./helpers/playwright.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),root=await session(f,f.root),out='docs/05-qualidade/evidencias/desempenho-fase1-2026-11-09',errors=[];fs.mkdirSync(out,{recursive:true});
 const visit=crypto.randomUUID(),occurrence=crypto.randomUUID(),photo=crypto.randomUUID(),at=Date.now();
 const picture=fs.readFileSync('web/assets/paisagem-login-v2.webp'),hash=createHash('sha256').update(picture).digest('hex');
 f.sqlite.prepare("INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at,state,completed_at) VALUES(?,?,?,?,?,'completed',?)").run(visit,f.ids.pending,f.root.id,at,at,at);
 const statement=f.sqlite.prepare('INSERT INTO inspection_sections(inspection_id,section,data_json,updated_by,updated_at) VALUES(?,?,?,?,?)');
 statement.run(visit,'C',JSON.stringify({occurrences:[{id:occurrence,description:'TESTE ISOLADO · Evidência ilustrativa de desempenho',environments:[]}]}),f.root.id,at);
 f.sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,'ready')").run(photo,f.ids.pending,visit,'occurrence',occurrence,'TEST-ONLY','image/webp',picture.length,hash,f.root.id,at);
 let objectReads=0,activeSession=root;const requests=[];
 const env={DB:f.db,AUTH_PEPPER:'TEST',PHOTOS:{get:async()=>{objectReads++;return {body:picture,size:picture.length};}},ASSETS:{fetch:async req=>{
  const file=path.resolve('dist/painel','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('dist/painel')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});
  const bytes=fs.readFileSync(file),etag='"'+createHash('sha256').update(bytes).digest('hex')+'"',unchanged=req.headers.get('If-None-Match')===etag;
  return new Response(unchanged?null:bytes,{status:unchanged?304:200,headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.json':'application/json'})[path.extname(file)]||'application/octet-stream','ETag':etag}});
 }}};
 const server=http.createServer(async(req,res)=>{try{const headers=new Headers(req.headers);if(activeSession)headers.set('Cookie',activeSession.cookie);else headers.delete('Cookie');const response=await worker.fetch(new Request(new URL(req.url,'http://127.0.0.1:'+server.address().port),{headers}),env),bytes=Buffer.from(await response.arrayBuffer());requests.push({path:req.url,status:response.status,bytes:bytes.length});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(bytes);}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,browser=await pw.chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(10000);
 try{
  await page.clock.install();await page.goto(origin+'/ocorrencias');const img=page.locator('[data-result-photo] img');await img.waitFor();await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());
  await page.evaluate(()=>{window.savedImage=document.querySelector('[data-result-photo] img');window.savedSelect=document.querySelector('#findings-unit');});
  const before=objectReads;await page.locator('#findings-unit').focus();
  const received=page.waitForResponse(r=>r.url().includes('/api/inventory/findings'));
  await page.clock.fastForward(15100);await received;
  assert.equal(await page.evaluate(()=>window.savedImage===document.querySelector('[data-result-photo] img')),true);
  assert.equal(await page.evaluate(()=>document.activeElement===window.savedSelect),true);assert.equal(objectReads,before);
  await page.screenshot({path:out+'/ocorrencias-atualizacao.png',fullPage:true});
  await page.locator('[data-result-photo]').click();await page.locator('.photo-viewer img').evaluate(el=>el.decode());assert.equal(await page.locator('.photo-viewer').count(),1);assert.equal(objectReads,before+1,'foto antiga: URL integral distinta da miniatura carrega uma vez');
  await page.screenshot({path:out+'/foto-ampliada.png'});await page.keyboard.press('Escape');
  // New data must still update; unchanged blocks retain their nodes.
  f.sqlite.prepare('UPDATE inspection_sections SET data_json=? WHERE inspection_id=? AND section=?').run(JSON.stringify({occurrences:[{id:occurrence,description:'TESTE ISOLADO · Registro atualizado',environments:[]}]}),visit,'C');
  await page.locator('[data-results=refresh]').click();await page.getByText('TESTE ISOLADO · Registro atualizado',{exact:true}).waitFor();
  await page.reload();await page.locator('[data-result-photo] img').scrollIntoViewIfNeeded();await page.locator('[data-result-photo] img').evaluate(el=>el.decode());assert.equal(objectReads,before+1,'reload faz 304 autenticado');
  // Removing the server session forbids even a warm cached photo.
  activeSession=null;const forbidden=await page.evaluate(async id=>{const r=await fetch('/api/collector/photo?id='+id);return r.status;},photo);assert.equal(forbidden,401);
  await page.goto(origin+'/login');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:out+'/login-identidade-preservada.png'});const marker=requests.length;
  await page.reload();await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');
  const repeats=requests.slice(marker).filter(r=>r.path.includes('paisagem-coleta.jpg'));assert.ok(repeats.length>0);assert.ok(repeats.every(r=>r.status===304&&r.bytes===0));
  // D-065 uses the shared JPEG. The converted WebP remains the legacy CSS fallback.
  for(let n=0;n<2;n++)assert.equal(await page.evaluate(async()=>{const r=await fetch('/assets/paisagem-login-v2.webp');await r.arrayBuffer();return r.status;}),200);
  assert.deepEqual(requests.filter(r=>r.path==='/assets/paisagem-login-v2.webp').map(r=>r.status),[200,304]);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/requests.json',JSON.stringify(requests,null,2));
  console.log('OK: polling mantém imagem/foco, atualização real aparece, viewer, revalidação sem objeto, sessão revogada, login JPEG e fallback WebP 304.');
 }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});throw e;}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
