// D116: cancel keeps the local equipment; explicit discard navigates without a second native prompt.
// Real Worker + isolated SQLite; no production records or native GPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require('./helpers/playwright.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),op=await session(f,f.operator),errors=[],results=[];
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'});
 try{for(const embedded of [false,true]){
  const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',...(embedded?{}:{APP_KIND:'collector'}),ASSETS:{fetch:async req=>{
   const file=path.resolve('web','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});
   return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'}});
  }}};
  let origin;const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',op.cookie);const r=await worker.fetch(new Request(origin+req.url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
  const page=await browser.newPage({viewport:{width:390,height:844}}),dialogs=[];page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.stack));page.on('dialog',async d=>{dialogs.push(d.type());await d.dismiss();});
  try{
   await page.goto(origin+(embedded?'/app':'/'));if(embedded)await page.locator('[data-open=collect]').click();
   const ui=embedded?page.frameLocator('iframe[name=semed-collect]'):page;
   await ui.getByRole('button',{name:/Unidade sem inventário/}).click();await ui.locator('[data-action=cards]').click();await ui.locator('[data-action=open][data-topic=F]').click();await ui.locator('[data-action=new]').click();
   await ui.getByLabel('AnyDesk (opcional)',{exact:true}).fill('123456');await ui.locator('[data-action=cards]').click();await ui.locator('[data-action=units]').click();
   let confirm=ui.getByRole('dialog',{name:'Trocar de unidade?'});await confirm.getByRole('button',{name:'Cancelar',exact:true}).click();await ui.locator('[data-action=resume]').click();assert.equal(await ui.getByLabel('AnyDesk (opcional)',{exact:true}).inputValue(),'123456');
   await ui.locator('[data-action=cards]').click();await ui.locator('[data-action=units]').click();await confirm.getByRole('button',{name:'Descartar e trocar',exact:true}).click();
   const returned=await ui.getByRole('heading',{name:'Selecione a unidade',exact:true}).waitFor({timeout:4000}).then(()=>true,()=>false);
   assert.deepEqual(dialogs,[],`Second native unload prompt (embedded=${embedded}); returned=${returned}`);
   assert.equal(returned,true);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipments').get().n,0);
   results.push({embedded,cancelPreserves:true,discardReturns:true,noEquipmentCreated:true});
  }finally{await page.close();await new Promise(r=>server.close(r));}
 }}finally{await browser.close();f.sqlite.close();}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
