// Regressões de concorrência, perda de resposta e fotos pendentes no coletor V3 (R1/R2/R3 da revisão independente de 14/11/2026;
// R1-F e R4 da revisão da rev2).
// Worker real + SQLite em memória; navegador local. A sonda do revisor PASSAVA ao reproduzir os defeitos; aqui os asserts
// exigem o comportamento seguro: nenhuma confirmação falsa, nenhuma sobrescrita silenciosa, nenhum descarte de respostas,
// foto sempre vinculada à ficha escolhida na seleção, nenhuma duplicação de apresentação.
// Uso: SEMED_TEST_BROWSER=chromium node tests/collector-concurrency-browser.cjs   (SEMED_CONCURRENCY_OUT=<pasta> grava capturas)
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require('./helpers/playwright.cjs'),selectEnvironment=require('./helpers/select-environment.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),op=await session(f,f.operator),root=await session(f,f.root),objects=new Map(),errors=[],requests=[];
 const out=process.env.SEMED_CONCURRENCY_OUT?path.resolve(process.env.SEMED_CONCURRENCY_OUT):null;if(out)fs.mkdirSync(out,{recursive:true});
 let origin;
 // Portões por rota. modo por chegada (sequence[n], repetindo o último): 'drop-request' (nunca chega ao Worker),
 // 'drop-response' (Worker processa; resposta cai), 'hold-before' (espera antes de processar), 'hold-after' (processa; espera para responder).
 // once: só a primeira chegada; until: desarma quando outra rota chega. started/open: sincronização com o teste.
 const gates=new Map();
 const gate=(pathname,spec)=>{const g={hits:0,...spec};g.release=new Promise(r=>g.open=r);g.started=new Promise(r=>g.begin=r);gates.set(pathname,g);return g;};
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector',PHOTOS:{put:async(k,b)=>objects.set(k,b),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)},ASSETS:{fetch:async req=>{
  const p=new URL(req.url).pathname;if(p==='/runtime-config.js')return new Response("export const collectorUrl='/coleta';export const authEnabled=true;",{headers:{'Content-Type':'text/javascript'}});
  const file=path.resolve('web','.'+p);if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file))return new Response('not found',{status:404});
  return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});
 }}};
 const makeServer=(envFor,originFor)=>http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,originFor()),chunks=[];for await(const c of req)chunks.push(c);const bytes=Buffer.concat(chunks);
  for(const [p,g]of gates)if(g.until===url.pathname)gates.delete(p);
  const g=gates.get(url.pathname);let mode=null;
  if(g){const n=g.hits++;g.begin();mode=g.sequence[Math.min(n,g.sequence.length-1)];if(g.once)gates.delete(url.pathname);
   if(mode==='drop-request'){requests.push({path:url.pathname,dropped:'request'});res.destroy();return;}
   if(mode==='fail-503'){requests.push({path:url.pathname,status:503,injected:true});res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'TESTE · falha temporária no armazenamento'}));return;}
   if(mode==='hold-before')await g.release;
  }
  const headers=new Headers(req.headers);headers.set('Cookie',op.cookie);
  const response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:bytes}:{})}),envFor);
  requests.push({path:url.pathname,method:req.method,status:response.status});
  if(mode==='drop-response'){await response.arrayBuffer();requests.push({path:url.pathname,dropped:'response'});res.destroy();return;}
  if(mode==='hold-after'||mode==='hold-drop')await g.release;if(mode==='hold-drop'){res.destroy();return;}
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){errors.push(e.stack);res.writeHead(500);res.end('LOCAL TEST ERROR');}});
 const server=makeServer(env,()=>origin);await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 // Segundo servidor: mesma base de dados, APP_KIND de painel → serve o shell /app com a Coleta embutida (iframe), como o APK 1.0.3.
 let originApp;const envApp={...env,APP_KIND:undefined};const serverApp=makeServer(envApp,()=>originApp);await new Promise(r=>serverApp.listen(0,'127.0.0.1',r));originApp='http://127.0.0.1:'+serverApp.address().port;
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.stack));
 await page.addInitScript(()=>{const original=window.createImageBitmap.bind(window);window.__holdImage=false;window.createImageBitmap=async(...args)=>{if(window.__holdImage){window.__preparing=true;await new Promise(r=>window.__releaseImage=r);}return original(...args);};});
 const png={name:'TESTE.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64')};
 const sql=(q,...a)=>f.sqlite.prepare(q).get(...a),all=(q,...a)=>f.sqlite.prepare(q).all(...a);
 const blur=async()=>{await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(150);};
 const cards=async()=>{await page.locator('[data-action=cards]').click();await page.locator('.cards').waitFor();};
 const open=async g=>{await page.locator(`[data-action=open][data-topic=${g}]`).click();};
 const status=()=>page.locator('.save-state').innerText();
 const saveButton=()=>page.getByRole('button',{name:'Salvar equipamento',exact:true});
 const position=()=>page.getByLabel(/Posição no ambiente/);
 const monoId=async()=>(await page.locator('.mono-id').innerText()).replace(/^ID permanente\s*/,'').trim();
 const discardIfAsked=async()=>{const d=page.getByRole('dialog',{name:'Descartar alterações?'});if(await d.waitFor({timeout:800}).then(()=>true,()=>false)){await d.getByRole('button',{name:/^Descartar/}).click();await d.waitFor({state:'detached'});}};
 const manual=async label=>{await page.locator('[data-action=new]').click();await discardIfAsked();await page.locator('[data-action=manual]').waitFor();await page.locator('[data-action=manual]').click();await selectEnvironment(page,'Sala TESTE');await position().fill(label);await page.getByLabel('Motivo da ausência do agente').selectOption('Sistema incompatível');await page.getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');await page.getByLabel('Funcionamento observado').selectOption('Funcionando');await blur();};
 const backToList=async()=>{await page.getByRole('button',{name:'Voltar à lista',exact:true}).click();await page.locator('[data-action=new]').waitFor();};
 const createSaved=async label=>{await manual(label);await saveButton().click();await page.locator('.equipment-card').first().waitFor();return sql('SELECT id,version FROM equipments WHERE position_label=?',label);};
 const edit=async(id,label)=>{await page.locator(`[data-action=edit][data-id="${id}"]`).click();await discardIfAsked();await position().waitFor();await position().fill(label);await blur();};
 const shot=async name=>{if(out)await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
 const otherSessionSaves=async(sess,id,label)=>{const held=await humanFetch(worker,env,origin,sess,'/api/collector/equipment-lock',{inspectionId,id});assert.equal(held.status,200,'outra sessão obtém a trava: '+JSON.stringify(held.data));const r=await humanFetch(worker,env,origin,sess,'/api/collector/equipment-save',{inspectionId,id,version:held.data.equipment.version,lockToken:held.data.token,environmentId:held.data.equipment.data.environment,data:{...held.data.equipment.data,position_label:label}});assert.equal(r.status,200,'outra sessão grava: '+JSON.stringify(r.data));return r.data.version;};
 const otherSessionSavesDraft=async(sess,id)=>{const held=await humanFetch(worker,env,origin,sess,'/api/collector/equipment-lock',{inspectionId,id});assert.equal(held.status,200);const d=held.data.equipment.data;const r=await humanFetch(worker,env,origin,sess,'/api/collector/equipment-save',{inspectionId,id,version:held.data.equipment.version,lockToken:held.data.token,environmentId:d.environment,draft:true,data:{...d}});assert.equal(r.status,200,'outra sessão grava rascunho: '+JSON.stringify(r.data));return r.data.version;};
 const saves200=mark=>requests.slice(mark).filter(x=>x.path==='/api/collector/equipment-save'&&x.status>=200&&x.status<300).length;
 const results=[];const record=(id,ok,detail)=>{results.push({id,ok,...detail});console.log((ok?'PASSOU ':'FALHOU ')+id+' '+JSON.stringify(detail));assert.equal(ok,true,id);};
 let inspectionId;
 try{
  await page.goto(origin);await page.getByRole('button',{name:/Unidade sem inventário/}).click();await page.locator('[data-action=cards]').waitFor();await cards();await open('F');
  inspectionId=sql("SELECT id FROM inspections WHERE state='open' ORDER BY created_at DESC").id;
  await manual('D124 · ANTES');const id=await monoId();
  const lost=gate('/api/collector/equipment-save',{sequence:['hold-drop','normal']});
  await page.locator('input[data-photo]').last().setInputFiles(png);await lost.started;
  await position().fill('D124 · DIGITADO DURANTE ENVIO');await blur();lost.open();
  await page.waitForFunction(()=>document.querySelectorAll('.photo-tag.now').length===1);
  assert.equal(sql('SELECT count(*) n FROM equipments WHERE id=?',id).n,1);
  assert.equal(sql('SELECT count(*) n FROM collection_photos WHERE target_id=? AND status=?',id,'ready').n,1);
  assert.equal(await position().inputValue(),'D124 · DIGITADO DURANTE ENVIO');
  await saveButton().click();await page.locator('.equipment-card').first().waitFor();
  assert.equal(sql('SELECT position_label FROM equipments WHERE id=?',id).position_label,'D124 · DIGITADO DURANTE ENVIO');
  record('D124 rascunho com resposta perdida preserva edição e foto',true,{});
  await cards();await open('A');
  const other=await humanFetch(worker,env,origin,op,'/api/collector/section-save',{inspectionId,section:'A',version:1,answers:{name:'SERVIDOR'}});assert.equal(other.status,200);
  await page.locator('[data-field=name]').fill('RESPOSTA LOCAL');await blur();
  await page.getByRole('button',{name:'Comparar e recuperar assunto',exact:true}).waitFor();
  const mark=requests.length;await page.locator('[data-field=name]').fill('RESPOSTA LOCAL FINAL');await blur();await page.waitForTimeout(1200);
  assert.equal(requests.slice(mark).filter(x=>x.path==='/api/collector/section-save').length,0);
  await page.getByRole('button',{name:'Comparar e recuperar assunto',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:/Comparar/});await dialog.waitFor();
  await dialog.locator('summary').first().click();await shot('d124-comparacao-conflito');
  assert.match(await dialog.innerText(),/RESPOSTA LOCAL FINAL/);
  await dialog.getByRole('button',{name:'Recarregar do servidor',exact:true}).click();
  assert.equal(await page.locator('[data-field=name]').inputValue(),'SERVIDOR');
  await page.getByRole('button',{name:'Consultar minhas respostas anteriores',exact:true}).click();
  const copy=page.getByRole('dialog',{name:'Minhas respostas anteriores'});await copy.locator('summary').click();assert.match(await copy.innerText(),/RESPOSTA LOCAL FINAL/);await copy.getByRole('button',{name:'Fechar',exact:true}).click();
  record('D124 comparação recupera conflito sem apagar a cópia local',true,{});
  await cards();await page.locator('[data-action=facade]').click();
  await page.locator('input[data-photo]').last().setInputFiles({name:'arquivo-invalido.heic',mimeType:'image/heic',buffer:Buffer.from('INVALID HEIC TEST ONLY')});
  await page.locator('.notice.error').waitFor();assert.match(await page.locator('.notice.error').innerText(),/HEIC|HEIF|foto|imagem/i);
  await page.locator('input[data-photo]').last().waitFor({state:'attached'});assert.equal(await page.getByText('Preparando foto…',{exact:true}).count(),0);
  await shot('d124-heic-erro-recuperavel');
  await page.locator('input[data-photo]').last().setInputFiles(png);await page.waitForFunction(()=>document.querySelectorAll('.photo-tag.now').length===1);
  const facade=sql("SELECT id FROM collection_photos WHERE target_kind='facade'");f.sqlite.prepare("UPDATE collection_photos SET thumb_blob=?,thumb_sha256='invalid',thumb_source_sha256=sha256 WHERE id=?").run(new Uint8Array([1,2,3]),facade.id);
  await page.reload();await page.locator('.photo-open img').waitFor();await page.waitForFunction(()=>{const im=document.querySelector('.photo-open img');return im?.complete&&im.naturalWidth>0&&im.dataset.originalFallback==='1';});
  await shot('d124-fallback-original');record('D124 falha de conversão libera controles; miniatura corrompida usa original',true,{});
  if(fs.existsSync('private-data/test-example.heic')){
   const embedded=await browser.newPage({viewport:{width:390,height:844}});embedded.on('pageerror',e=>errors.push(e.stack));
   const response=await embedded.goto(originApp+'/app/coleta/v3?vistoria='+inspectionId+'&tela=facade');assert.match(response.headers()['content-security-policy'],/worker-src 'self' blob:/);
   await embedded.locator('input[data-photo]').last().setInputFiles(path.resolve('private-data/test-example.heic'));
   await embedded.waitForFunction(()=>document.querySelectorAll('.photo-tag.now').length===2);
   assert.equal(sql("SELECT count(*) n FROM collection_photos WHERE target_kind='facade' AND status='ready'").n,2);
   if(out)await embedded.screenshot({path:path.join(out,'d124-heic-app.png'),fullPage:true});await embedded.close();record('D124 HEIC válido recebido sob CSP do app unificado',true,{});
  }
  assert.deepEqual(errors,[]);
 }catch(e){if(out){await page.screenshot({path:path.join(out,'d124-falha.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'d124-falha.json'),JSON.stringify({error:String(e.stack||e),requests:requests.slice(-35)},null,2));}throw e;}
 finally{if(out)fs.writeFileSync(path.join(out,'d124-browser.json'),JSON.stringify({fixture:'Worker real + SQLite isolado',physicalAndroid:false,results,errors},null,2));await browser.close();await new Promise(r=>server.close(r));await new Promise(r=>serverApp.close(r));f.sqlite.close();}
 console.log('D124 browser: '+results.length+' cenários aprovados');
})().catch(e=>{console.error(e);process.exitCode=1;});
