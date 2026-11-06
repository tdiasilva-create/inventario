// Painel real + Worker + SQLite isolado. Não acessa a conta Cloudflare nem usa credenciais reais.
const fs=require('node:fs'),http=require('node:http'),{resolve,extname}=require('node:path'),assert=require('node:assert/strict');
const pw=require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),root=await session(f,f.root),errors=[];
 const assets={fetch:async req=>{const p=new URL(req.url).pathname,file=resolve('web','.'+p);if(p==='/runtime-config.js')return new Response("export const collectorUrl='/coleta';export const authEnabled=true;",{headers:{'Content-Type':'text/javascript'}});if(!file.startsWith(resolve('web'))||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.ttf':'font/ttf'})[extname(file)]||'application/octet-stream'}});}};
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'painel',AGENTES_EXIGIR_AUTORIZACAO:'nao',ASSETS:assets};
 const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',root.cookie);const r=await worker.fetch(new Request(new URL(req.url,'http://127.0.0.1:'+server.address().port),{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1672,height:1000}});
 page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(15000);const out='docs/05-qualidade/evidencias/cadastro-automatico-2026-11-05';fs.mkdirSync(out,{recursive:true});
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/configuracoes');await page.getByText('Agentes Windows — cadastro automático',{exact:true}).waitFor();
  assert.equal(await page.locator('#agents-grant-form').count(),0);assert.equal(await page.getByRole('button',{name:'Gerar código de autorização'}).count(),0);
  await page.getByText('Agentes Windows — cadastro automático',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:out+'/painel-cadastro-automatico.png'});
  await page.getByRole('button',{name:'Executar manutenção agora'}).click();await page.getByText(/Manutenção executada/).waitFor();
  // Falha de carga não deve mostrar formulário de lote como se fosse a política vigente.
  await page.route('**/api/root/agent-devices*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Falha de teste isolado'})}));
  await page.getByRole('button',{name:'Atualizar',exact:true}).last().click();await page.getByText('Falha de teste isolado',{exact:true}).waitFor();assert.equal(await page.locator('#agents-grant-form').count(),0);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser.json',JSON.stringify({ok:true,scope:'Worker real + SQLite isolado + Edge headless; sem teste físico do EXE',checks:['política automática','sem formulário de lotes','manutenção','falha de carga explícita'],errors},null,2));console.log('OK: painel de cadastro automático, manutenção e erro de carga.');
 }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});throw e;}finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exit(1);});
