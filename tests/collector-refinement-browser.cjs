// D-089: Worker e SQLite isolados, sem escrita em produção.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const pw=require('./helpers/playwright.cjs');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{session,humanFetch}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),op=await session(f,f.operator),errors=[],requests=[];
 let activeSession=op,delayEquipmentResponse=0;
 const out=process.env.SEMED_TEST_EVIDENCE_DIR||'docs/05-qualidade/evidencias/coletor-refinamento-2026-11-10';fs.mkdirSync(out,{recursive:true});
 const env={DB:f.db,AUTH_PEPPER:'TEST-ONLY',APP_KIND:'collector',ASSETS:{fetch:async req=>{
  const file=path.resolve('web','.'+new URL(req.url).pathname);
  if(!file.startsWith(path.resolve('web')+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('Not found',{status:404});
  return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream'}});
 }}};
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1:'+server.address().port),chunks=[];for await(const c of req)chunks.push(c);
  const headers=new Headers(req.headers);headers.delete('Cookie');if(activeSession)headers.set('Cookie',activeSession.cookie);
  const response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);
  requests.push({path:url.pathname,method:req.method,status:response.status,...(response.status===400?{body:Buffer.concat(chunks).toString()}: {})});
  if(url.pathname==='/api/collector/equipment-save'&&delayEquipmentResponse)await new Promise(r=>setTimeout(r,delayEquipmentResponse));
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const api=(p,d)=>humanFetch(worker,env,origin,op,p,d);
 const browser=await pw.chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.stack));
 const shot=name=>page.screenshot({path:out+'/'+name+'.png'});
 const input=()=>page.getByLabel(/Posição no ambiente/);
 const closeKeyboard=async()=>{await page.evaluate(()=>document.activeElement?.blur());await page.waitForFunction(()=>!document.querySelector('#collector.is-typing'));};
 const clickDialog=async choice=>{const d=page.getByRole('dialog',{name:'Confirmar ação'});await d.waitFor();await d.getByRole('button',{name:choice,exact:true}).click();};
 const results={physicalKeyboardTest:false};
 try{
  const start=await api('/api/collector/v3-start',{unitId:f.ids.pending,preservePrevious:true}),inspectionId=start.data.inspection.id;
  const room=crypto.randomUUID();f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by,name_key) VALUES(?,?,?,?,?,?,?)').run(room,f.ids.pending,'Laboratório TESTE','',Date.now(),f.operator.id,'laboratório teste');
  const ids=[],now=Date.now();
  for(let i=1;i<=210;i++){
   const id=crypto.randomUUID();ids.push(id);const data={category:'desktop',mode:'Individual',quantity:1,registration:'Manual',manualReason:'Sistema incompatível',environment:room,environmentName:'Laboratório TESTE',position_label:'PC-'+String(i).padStart(3,'0'),assetStatus:'Sem patrimônio',operation:'Funcionando',brand:'TESTE',model:'MODELO '+String(i).padStart(3,'0')};
   f.sqlite.prepare("INSERT INTO equipments(id,unit_id,inspection_id,category,environment_id,asset,serial,data_json,search_text,created_by,created_at,updated_by,updated_at,position_label) VALUES(?,?,?,?,?,'','',?,?,?,?,?,?,?)").run(id,f.ids.pending,inspectionId,'desktop',room,JSON.stringify(data),'teste '+data.model.toLowerCase()+' desktop',f.operator.id,now+i,f.operator.id,now+i,data.position_label);
  }
  await page.goto(origin+'/coleta-v3?vistoria='+inspectionId+'&tela=inventory&assunto=F');
  await page.locator('.equipment-card').first().waitFor();assert.equal(await page.locator('.equipment-card').count(),50);
  assert.match(await page.getByLabel('Filtrar esta lista').getAttribute('placeholder'),/Marca, modelo/);
  await page.getByLabel('Filtrar esta lista').fill('PC-205');await page.getByLabel('Filtrar esta lista').press('Enter');
  await page.getByText('Nenhum equipamento nesta página.').waitFor();
  await page.getByRole('button',{name:'Limpar busca'}).click();await page.locator('.equipment-card').first().waitFor();
  await page.getByRole('button',{name:/Mostrar mais/}).click();await page.waitForFunction(()=>document.querySelectorAll('.equipment-card').length===100);
  const last=page.locator('.equipment-card').last(),lastId=(await last.getAttribute('data-ui-key')).split(':')[1];
  await last.scrollIntoViewIfNeeded();const beforeScroll=await page.evaluate(()=>scrollY);
  await last.getByRole('button',{name:'Editar',exact:true}).click();await input().fill('PC-111 AJUSTADO');
  await page.waitForFunction(()=>document.querySelector('#collector.is-typing'));assert.equal(await page.locator('.collection-footer').isVisible(),false);
  const compact=page.getByRole('button',{name:'Salvar sem fechar o teclado'});
  assert.equal(await compact.isVisible(),true);assert.ok((await compact.boundingBox()).height>=44);
  await page.setViewportSize({width:390,height:360});await input().focus();await page.waitForTimeout(100);
  const bounds=await input().boundingBox(),head=await page.locator('.app-header').boundingBox();
  assert.ok(bounds.y>=head.height&&bounds.y+bounds.height<=360,'Campo visível com viewport reduzido');
  await shot('01-salvar-com-teclado-viewport-reduzido');
  await compact.click();await page.locator('.equipment-card').first().waitFor();
  assert.equal(await page.locator('.equipment-card').count(),100);
  assert.equal(f.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(lastId).position_label,'PC-111 AJUSTADO');
  await page.setViewportSize({width:390,height:844});await page.locator('.equipment-card').last().scrollIntoViewIfNeeded();
  assert.ok(Math.abs((await page.evaluate(()=>scrollY))-beforeScroll)<150,'Retorno preserva posição nas páginas carregadas');
  results.paginationAndCompactSave=true;
  // Busca mantém o contrato atual e volta ao mesmo filtro depois da ficha.
  await page.getByLabel('Filtrar esta lista').fill('MODELO 005');await page.getByLabel('Filtrar esta lista').press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('.equipment-card').length===1);
  await page.getByRole('button',{name:'Editar',exact:true}).click();await input().fill('RESPOSTA LOCAL PRESERVADA');await closeKeyboard();
  await page.getByRole('button',{name:'Voltar à lista',exact:true}).click();await page.locator('.equipment-card').waitFor();
  assert.equal(await page.getByLabel('Filtrar esta lista').inputValue(),'MODELO 005');
  await page.getByRole('button',{name:'Editar',exact:true}).click();assert.equal(await input().inputValue(),'RESPOSTA LOCAL PRESERVADA');
  results.unsavedResume=true;
  // Sessão expirada: não navegar nem perder preenchimento. Nova sessão deve ser do mesmo usuário.
  activeSession=null;await input().fill('DADO ANTES DO LOGIN');
  await page.getByRole('button',{name:'Salvar sem fechar o teclado'}).click();await page.getByRole('link',{name:'Entrar novamente em outra aba'}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Entrar novamente em outra aba'}).getAttribute('target'),'_blank');
  assert.equal(await input().inputValue(),'DADO ANTES DO LOGIN');
  activeSession=await session(f,f.root);await page.getByRole('button',{name:'Já entrei · retomar'}).click();
  await page.getByText(/Entre com o mesmo usuário desta coleta/).waitFor();assert.equal(await input().inputValue(),'DADO ANTES DO LOGIN');
  activeSession=await session(f,f.operator);await page.getByRole('button',{name:'Já entrei · retomar'}).click();
  await page.getByText(/Sessão recuperada/).waitFor();await shot('02-sessao-recuperada');
  await closeKeyboard();await page.getByRole('button',{name:'Salvar equipamento',exact:true}).click();await page.locator('.equipment-card').waitFor();
  assert.equal(f.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(ids[4]).position_label,'DADO ANTES DO LOGIN');
  results.sessionRecoverySameUser=true;
  // Digitação nova após envio da ficha não pode desaparecer na resposta atrasada.
  await page.getByRole('button',{name:'Editar',exact:true}).click();await input().fill('ENVIADO PRIMEIRO');await closeKeyboard();
  delayEquipmentResponse=800;const sent=page.waitForRequest(r=>r.url().includes('/equipment-save'));
  await page.getByRole('button',{name:'Salvar equipamento',exact:true}).click();await sent;
  await input().fill('DIGITADO DURANTE ENVIO');
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent.includes('salve novamente'));
  assert.equal(await input().inputValue(),'DIGITADO DURANTE ENVIO');
  assert.equal(f.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(ids[4]).position_label,'ENVIADO PRIMEIRO');
  delayEquipmentResponse=0;await page.getByRole('button',{name:'Salvar sem fechar o teclado'}).click();await page.locator('.equipment-card').waitFor();
  assert.equal(f.sqlite.prepare('SELECT position_label FROM equipments WHERE id=?').get(ids[4]).position_label,'DIGITADO DURANTE ENVIO');
  results.typingDuringSave=true;
  // Assunto concluído por URL fica somente leitura. Cancelar/Esc não reabre, confirmar reabre.
  f.sqlite.prepare("UPDATE inspection_sections SET state='Concluído' WHERE inspection_id=? AND section='C'").run(inspectionId);
  await page.goto(origin+'/coleta-v3?vistoria='+inspectionId+'&tela=group&assunto=C');
  await page.getByRole('button',{name:'Reabrir assunto',exact:true}).waitFor();
  assert.equal(await page.getByLabel('A unidade possui serviço de internet?').isEnabled(),false);
  await page.getByRole('button',{name:'Reabrir assunto',exact:true}).click();await clickDialog('Cancelar');
  assert.equal(f.sqlite.prepare("SELECT state FROM inspection_sections WHERE inspection_id=? AND section='C'").get(inspectionId).state,'Concluído');
  await page.goto(origin+'/coleta-v3?vistoria='+inspectionId+'&tela=group&assunto=C');
  await page.getByRole('button',{name:'Reabrir assunto',exact:true}).click();
  await page.getByRole('dialog',{name:'Confirmar ação'}).waitFor();await page.keyboard.press('Escape');
  assert.equal(f.sqlite.prepare("SELECT state FROM inspection_sections WHERE inspection_id=? AND section='C'").get(inspectionId).state,'Concluído');
  await page.goto(origin+'/coleta-v3?vistoria='+inspectionId+'&tela=group&assunto=C');
  await page.getByRole('button',{name:'Reabrir assunto',exact:true}).click();await clickDialog('Confirmar');
  await page.waitForFunction(()=>!document.querySelector('[data-field=exists]')?.closest('fieldset[disabled]'));assert.equal(await page.getByLabel('A unidade possui serviço de internet?').isEnabled(),true);
  results.readOnlyAndReopen=true;
  await page.getByLabel('A unidade possui serviço de internet?').selectOption('Sim');
  await page.getByRole('button',{name:'+ Adicionar registro'}).click();
  await page.getByLabel('A unidade possui serviço de internet?').selectOption('Não');await page.getByText(/link.s. continuam guardados/).waitFor();
  await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();
  const section=JSON.parse(f.sqlite.prepare("SELECT data_json FROM inspection_sections WHERE inspection_id=? AND section='C'").get(inspectionId).data_json);
  assert.equal(section.exists,'Não');assert.equal(section.links.length,1);results.hiddenLinksPreserved=true;
  await shot('03-links-preservados');
  for(const width of [360,390,812]){await page.setViewportSize({width,height:width===812?375:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.getByRole('button',{name:'← Voltar às categorias'}).click();await page.getByRole('button',{name:'Revisar visita'}).click();
  await page.getByRole('heading',{name:'Confira antes de concluir'}).waitFor();assert.doesNotMatch(await page.locator('main').innerText(),/não conferido/);
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,...results},null,2));console.log(JSON.stringify({passed:true,...results}));
 }catch(e){await shot('falha').catch(()=>{});console.error(e);console.error(JSON.stringify(errors));console.error(JSON.stringify(requests.filter(r=>r.status===400)));process.exitCode=1;}
 finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})();
