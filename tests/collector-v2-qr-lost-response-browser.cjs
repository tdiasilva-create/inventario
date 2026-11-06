// Teste de navegador (fora do npm test) — R2-A: a resposta do claim é PERDIDA depois do commit no servidor (o pedido chega ao
// Worker real e grava; o navegador nunca recebe a resposta). A interface não pode anunciar sucesso; ao repetir, deve conferir o
// recibo do mesmo request_id e mostrar o vínculo real, sem duplicar ficha nem vínculo. Depois, o mesmo para falha ANTES do envio.
const {resolve,extname}=require('node:path'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const QRCode=require('qrcode');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{agentIdentity,enroll,session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),errors=[];
 const env={DB:f.db,AUTH_PEPPER:'pepper-isolado',APP_KIND:'collector',PHOTOS:{put:async()=>{},get:async()=>null,delete:async()=>{}},ASSETS:{fetch:async req=>{const p=new URL(req.url).pathname,file=resolve('web','.'+p);if(!file.startsWith(resolve('web'))||!fs.existsSync(file))return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'})[extname(file)]||'application/octet-stream'}});}}};
 const op=await session(f,f.operator),root=await session(f,f.root),origin='https://coletor.test';
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',op.cookie);const response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await pw.chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.stack));page.on('dialog',d=>d.accept());page.setDefaultTimeout(15000);
 const out='docs/05-qualidade/evidencias/coleta-v2-qr-resposta-perdida-2026-11-04';fs.mkdirSync(out,{recursive:true});
 try{
  const enrollFor=async()=>{const grant=await humanFetch(worker,env,origin,root,'/api/root/agent-install-grants',{expires_in_seconds:3600});const identity=await agentIdentity();const {enrollment}=await enroll(worker,env,origin,identity,grant.data.grant_code);assert.equal(enrollment.status,201);return QRCode.toBuffer(JSON.stringify({type:'semed.agent.pairing',version:1,enrollment_id:enrollment.data.enrollment_id,pairing_code:enrollment.data.pairing_code,expires_at:enrollment.data.expires_at}),{errorCorrectionLevel:'M',scale:6,margin:4});};
  // Interceptação: o 1º claim chega ao servidor (route.fetch) e a resposta é descartada (abort) → resultado desconhecido no navegador.
  let mode='after',claimHits=0;
  await page.route('**/api/agent/v1/pairings/claim',async route=>{claimHits++;if(mode==='after'){mode=null;await route.fetch();await route.abort('connectionreset');return;}if(mode==='before'){mode=null;await route.abort('connectionfailed');return;}await route.continue();});
  await page.goto(base);await page.getByRole('button',{name:/Unidade sem inventário/}).click();await page.getByRole('heading',{name:'Comece pela fachada'}).waitFor();
  const png={name:'TESTE.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64')};
  await page.locator('input[data-photo]').last().setInputFiles(png);await page.getByRole('button',{name:'Continuar · acompanhante'}).click();await page.getByLabel('Há alguém acompanhando a coleta?').selectOption('Não');await page.getByRole('button',{name:'Marcar como concluído',exact:true}).click();
  const startFicha=async()=>{await page.getByRole('button',{name:'+ Adicionar computador'}).click();await page.getByLabel('Tipo de equipamento').selectOption('desktop');await page.getByLabel('Como será cadastrado?').selectOption('Agente');await page.getByRole('button',{name:'Ler QR Code do agente'}).click();await page.locator('input[data-qr="file"]').setInputFiles({name:'qr.png',mimeType:'image/png',buffer:await enrollFor()});await page.getByText('Confira a máquina antes de vincular').waitFor();};
  await page.getByRole('button',{name:/Computadores Pendente/}).click();await startFicha();
  await page.locator('.agent-preview').getByRole('button',{name:'+ Cadastrar ambiente'}).click();await page.getByLabel(/Nome do ambiente/).fill('Sala 1');await page.getByRole('button',{name:'Cadastrar ambiente'}).click();await page.locator('article.summary-card strong',{hasText:'Sala 1'}).waitFor();await page.getByRole('button',{name:'Voltar ao preenchimento'}).click();
  await page.locator('.agent-preview select[data-field="environment"]').selectOption({label:'Sala 1'});await page.locator('input[data-field="_pairing.positionLabel"]').fill('PC 1');await page.locator('input[data-field="_pairing.confirmed"]').check();
  // 1) Resposta perdida DEPOIS do commit.
  await page.getByRole('button',{name:'Confirmar vínculo'}).click();
  await page.getByText(/resultado é desconhecido/i).waitFor();assert.equal(await page.getByText('Computador vinculado ao agente').count(),0,'nenhum sucesso falso');
  await page.getByRole('button',{name:'Verificar / repetir confirmação'}).waitFor();await page.screenshot({path:out+'/01-resultado-desconhecido.png',fullPage:true});
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,1,'o servidor gravou o vínculo');assert.equal(claimHits,1);
  const eqBefore=f.sqlite.prepare('SELECT id,version FROM equipments').all();assert.equal(eqBefore.length,1);
  await page.getByRole('button',{name:'Verificar / repetir confirmação'}).click();
  await page.getByText('Computador vinculado ao agente').waitFor();await page.screenshot({path:out+'/02-reconciliado-pelo-recibo.png',fullPage:true});
  assert.equal(claimHits,1,'o recibo resolveu sem novo claim');
  const eqAfter=f.sqlite.prepare('SELECT id,version FROM equipments').all();assert.deepEqual(eqAfter,eqBefore,'nenhuma gravação extra');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,1);
  // Completa a ficha e salva (validação completa), depois volta à lista.
  await page.getByRole('button',{name:'Próximo →'}).click();await page.getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');await page.getByRole('button',{name:'Próximo →'}).click();
  await page.getByLabel('Conservação física').selectOption('Bom');await page.getByLabel('Funcionamento observado').selectOption({label:'Funcionando normalmente'});await page.getByLabel('Situação de uso').selectOption('Em uso');await page.getByRole('button',{name:'Próximo →'}).click();await page.getByRole('button',{name:/Salvar equipamento/}).click();
  await page.getByText('Agente vinculado',{exact:true}).waitFor();
  // 2) Falha ANTES do envio (rede cai): nada gravado; repetir envia o mesmo comando e vincula uma vez.
  mode='before';await startFicha();
  await page.locator('.agent-preview select[data-field="environment"]').selectOption({label:'Sala 1'});await page.locator('input[data-field="_pairing.positionLabel"]').fill('PC 2');await page.locator('input[data-field="_pairing.confirmed"]').check();
  await page.getByRole('button',{name:'Confirmar vínculo'}).click();await page.getByText(/resultado é desconhecido/i).waitFor();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,1,'nada gravado antes do envio');
  await page.getByRole('button',{name:'Verificar / repetir confirmação'}).click();await page.getByText('Computador vinculado ao agente').waitFor();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links').get().n,2);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipments').get().n,2,'uma ficha por computador');
  assert.equal(claimHits,3,'1 perdido-após + 1 abortado-antes + 1 efetivo');
  if(errors.length)throw Error('Erros de página/servidor:\n'+errors.join('\n'));
  console.log('OK: resposta perdida após commit → sem sucesso falso → recibo reconcilia; falha antes do envio → repetição vincula uma vez; zero duplicação.');
 }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});console.error(await page.locator('body').innerText().catch(()=>''));if(errors.length)console.error('ERROS:',errors.join('\n'));throw e;}finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exit(1);});
