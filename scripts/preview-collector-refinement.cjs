// Interactive isolated preview. All page requests are intercepted to the real Worker.
// No Cloudflare, Drive, production cookie, native GPS service or official records.
const fs=require('node:fs'),path=require('node:path'),pw=require('../tests/helpers/playwright.cjs');
(async()=>{
 const {authFixture,temporaryPassword,panelOrigin}=await import('../tests/helpers/auth-fixture.mjs');
 const worker=(await import('../server/worker.mjs')).default;
 const {session,humanFetch}=await import('../tests/helpers/agent-client.mjs');
 const f=await authFixture(),objects=new Map();f.sqlite.prepare('UPDATE users SET must_change=0').run();
 const root=await session(f,f.root);
 const r=await humanFetch(worker,f.env,panelOrigin,root,'/api/dispatch/technician',{userId:f.root.id,enabled:true,operationId:crypto.randomUUID(),revision:f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision});
 if(r.status!==200)throw Error('Fixture technician setup failed');
 f.env.PHOTOS={put:async(k,b)=>objects.set(k,b),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)};
 f.env.ASSETS={fetch:async req=>{const file=path.resolve('web','.'+new URL(req.url).pathname);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});}};
 const smoke=process.argv.includes('--smoke'),browser=await pw.chromium.launch({headless:smoke,channel:'msedge'});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',async route=>{try{const q=route.request(),url=new URL(q.url());if(url.origin!==panelOrigin)throw Error('External request blocked');const response=await worker.fetch(new Request(url,{method:q.method(),headers:await q.allHeaders(),...(q.method()==='POST'?{body:q.postDataBuffer()}:{})}),f.env);await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});}catch{await route.fulfill({status:502,body:'Prévia isolada: requisição externa/erro. Não é produção.'});}});
 const page=await context.newPage();await page.goto(panelOrigin+'/app');await page.locator('#login').waitFor();
 console.log('PRÉVIA ISOLADA EM RAM · nenhum dado oficial. Usuários: root (ambas áreas) ou operador (só Coleta).');
 console.log('Senha EXCLUSIVA DA FIXTURE: '+temporaryPassword);
 console.log('Não enviar informações reais. Fechar navegador encerra e descarta a base. Sem GPS nativo/Drive real.');
 if(smoke){await page.locator('#login [name=username]').fill('root');await page.locator('#login [name=password]').fill(temporaryPassword);await page.locator('#login button').click();await page.locator('[data-open=collect]').waitFor();await page.locator('[data-open=collect]').click();await page.frameLocator('iframe[name=semed-collect]').getByRole('heading',{name:'Selecione a unidade',exact:true}).waitFor();await browser.close();console.log('PASS preview smoke: login e lista com Worker real/SQLite em memória.');}
 else await new Promise(resolve=>browser.on('disconnected',resolve));
 f.sqlite.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
