// Real /app + collector with isolated Worker/SQLite. Outer frame models the native
// WebView's usable rectangle; this is NOT an Android emulator or physical GPS test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const pw=require('./helpers/playwright.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),op=await session(f,f.operator),errors=[],checks=[],out='private-data/release-app-insets-104';fs.mkdirSync(out,{recursive:true});
 let origin;
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',ASSETS:{fetch:async req=>{
  const file=path.resolve('web','.'+new URL(req.url).pathname);
  if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});
  return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'}});
 }}};
 const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const h=new Headers(req.headers);h.set('Cookie',op.cookie);const r=await worker.fetch(new Request(origin+req.url,{method:req.method,headers:h,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);const responseHeaders=new Headers(r.headers);/* Test-only wrapper stands in for the native parent. Production /app forbids framing. */if(req.url==='/app'){responseHeaders.delete('Content-Security-Policy');responseHeaders.delete('X-Frame-Options');}res.writeHead(r.status,Object.fromEntries(responseHeaders));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 const browser=await pw.chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:800},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.stack));
  await page.route('**/viewport-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#16191d}#native{position:fixed;inset:0}#web{display:block;width:100%;height:100%;border:0}#nav{position:fixed;bottom:0;left:0;right:0;height:48px;background:#d1d1d1;display:grid;place-items:center;color:#111;font:12px Arial}#caption{position:fixed;top:0;color:white;font:10px Arial}</style><div id="native"><iframe id="web" src="/app"></iframe></div><div id="caption">TESTE LOCAL · área Android simulada</div><div id="nav">|||　 ○　 ‹</div>`}));
  await page.goto(origin+'/viewport-test');const app=page.frameLocator('#web'),ui=app.frameLocator('iframe[name=semed-collect]');
  await app.locator('[data-open=collect]').click();await ui.getByRole('button',{name:/Unidade sem inventário/}).click();
  const next=()=>ui.locator('[data-action=companion]');await next().waitFor();
  const bounds=async button=>{const r=await button.boundingBox();assert.ok(r);return r;};
  // Reproduce the report: native navigation overlays an unpadded WebView.
  let r=await bounds(next());assert.ok(r.y+r.height>752,'Baseline must reproduce the covered button');await page.screenshot({path:out+'/antes-area-simulada.png'});
  const scenarios=[
   {name:'360-botoes',w:360,h:800,top:28,bottom:48,left:0,right:0},
   {name:'412-gestos',w:412,h:915,top:32,bottom:24,left:0,right:0},
   {name:'320-compacto',w:320,h:640,top:24,bottom:48,left:0,right:0},
   {name:'800-paisagem-direita',w:800,h:360,top:24,bottom:0,left:32,right:48},
   {name:'800-paisagem-esquerda',w:800,h:360,top:24,bottom:0,left:48,right:32},
   {name:'800-tablet',w:800,h:1280,top:24,bottom:48,left:0,right:0}
  ];
  async function fit(s){await page.setViewportSize({width:s.w,height:s.h});await page.evaluate(s=>{document.querySelector('#native').style.padding=`${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`;const n=document.querySelector('#nav');n.style.height=s.bottom+'px';n.style.display=s.bottom?'grid':'none';},s);await page.waitForTimeout(80);}
  async function within(button,s){const b=await bounds(button);assert.ok(b.x>=s.left&&b.x+b.width<=s.w-s.right+1,JSON.stringify({s,b}));assert.ok(b.y>=s.top&&b.y+b.height<=s.h-s.bottom+1,JSON.stringify({s,b}));await button.click({trial:true});return b;}
  for(const s of scenarios){await fit(s);checks.push({name:s.name,button:await within(next(),s)});await page.screenshot({path:out+'/'+s.name+'.png'});}
  const portrait=scenarios[0];await fit(portrait);await next().click();await ui.locator('[data-action=cards]').click();await ui.locator('[data-action=open][data-topic=F]').click();await ui.locator('[data-action=new]').click();
  const remote=ui.getByLabel('AnyDesk (opcional)',{exact:true});await remote.fill('123456');
  await fit({...portrait,bottom:320});await remote.focus();await page.waitForTimeout(120);
  await within(remote,{...portrait,bottom:320});assert.equal(await remote.inputValue(),'123456');
  await within(ui.locator('.keyboard-save'),{...portrait,bottom:320});await ui.locator('[data-action=close-keyboard]').click();await fit(portrait);
  await within(ui.getByRole('button',{name:'Salvar equipamento',exact:true}),portrait);assert.equal(await remote.inputValue(),'123456');
  checks.push({name:'teclado-simulado',focusedInputVisible:true,compactSaveVisible:true,footerRestored:true,valuePreserved:true});
  await page.screenshot({path:out+'/depois-ficha-area-simulada.png'});
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipments').get().n,0);assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/viewport-checks.json',JSON.stringify({simulation:true,androidRuntimeTest:false,checks},null,2));console.log(JSON.stringify({passed:true,scenarios:checks.length,baselineCovered:true,androidRuntimeTest:false}));
 }finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
