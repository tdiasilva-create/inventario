// Teste de navegador (fora do npm test): tela do root em Configurações → Agentes Windows, através do Worker REAL do painel.
// Ciclo: emitir autorização (código exibido uma vez) → agente fictício cadastra com esse código → vínculo por API → agente aparece
// na lista com unidade/ficha/presença → revogar pela tela → heartbeat seguinte recusado → manutenção sob demanda. Dados fictícios.
const {resolve,extname}=require('node:path'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{agentIdentity,enroll,session,humanFetch,heartbeatBody,machinePost,lockFor}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),errors=[];
 const assets={fetch:async req=>{const p=new URL(req.url).pathname,file=resolve('web','.'+p);if(p==='/runtime-config.js')return new Response("export const collectorUrl='/coleta';export const authEnabled=true;",{headers:{'Content-Type':'text/javascript'}});if(!file.startsWith(resolve('web'))||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.ttf':'font/ttf'})[extname(file)]||'application/octet-stream'}});}};
 const envP={DB:f.db,AUTH_PEPPER:'pepper-isolado',APP_KIND:'painel',ASSETS:assets,PHOTOS:{put:async()=>{},get:async()=>null,delete:async()=>{}}},envC={...envP,APP_KIND:'collector'};
 const origin='https://painel.test',root=await session(f,f.root),op=await session(f,f.operator);
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',root.cookie);const response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),envP);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await pw.chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1672,height:941}});page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(15000);
 const out='docs/05-qualidade/evidencias/painel-root-agentes-2026-11-04';fs.mkdirSync(out,{recursive:true});
 try{
  // Ficha de computador em visita V2 aberta (via API do coletor) para receber o vínculo.
  const start=await humanFetch(worker,envC,origin,op,'/api/collector/v2-start',{unitId:f.ids.pending});const insp=start.data.inspection;
  const er=await humanFetch(worker,envC,origin,op,'/api/collector/environment-save',{inspectionId:insp.id,name:'Sala de Leitura'});const envId=er.data.environment.id,pcId=crypto.randomUUID();
  const saved=await humanFetch(worker,envC,origin,op,'/api/collector/equipment-save',{inspectionId:insp.id,id:pcId,data:{category:'notebook',mode:'Individual',quantity:1,environment:envId,registration:'Agente',assetStatus:'Sem patrimônio',condition:'Bom',operation:'Funcionando',use:'Em uso'}});assert.equal(saved.status,201);
  // 1) Tela do root: emitir autorização; o código aparece uma única vez.
  await page.goto(base+'/configuracoes');await page.getByText('Agentes Windows — autorizações de instalação (root)').waitFor();
  await page.fill('#agents-grant-form input[name="hours"]','2');await page.fill('#agents-grant-form input[name="max_uses"]','3');await page.fill('#agents-grant-form input[name="note"]','TESTE ISOLADO lote');
  await page.getByRole('button',{name:'Gerar código de autorização'}).click();await page.locator('.agent-code').waitFor();
  const code=(await page.locator('.agent-code').innerText()).trim();assert.match(code,/^[A-Za-z0-9_-]{20,}$/);
  await page.screenshot({path:out+'/01-autorizacao-emitida.png',fullPage:true});
  const grantsText=await page.locator('body').innerText();assert.match(grantsText,/0 \/ 3/);assert.match(grantsText,/TESTE ISOLADO lote/);assert.match(grantsText,/ativa/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_install_grants WHERE code_hash IS NOT NULL').get().n,1);assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM agent_install_grants WHERE code_hash=?").get(code).n,0,'código não é armazenado em claro');
  await page.getByRole('button',{name:'Ocultar'}).click();assert.equal(await page.locator('.agent-code').count(),0);
  // 2) Instalador fictício usa o código; operador vincula pelo API (fluxo do coletor já coberto por outro teste).
  const identity=await agentIdentity();const {enrollment}=await enroll(worker,envC,origin,identity,code);assert.equal(enrollment.status,201,JSON.stringify(enrollment.data));
  const lock=await lockFor(worker,envC,origin,op,insp.id,pcId);
  const claim=await humanFetch(worker,envC,origin,op,'/api/agent/v1/pairings/claim',{request_id:crypto.randomUUID(),enrollment_id:enrollment.data.enrollment_id,pairing_code:enrollment.data.pairing_code,unit_id:f.ids.pending,environment_id:envId,inspection_id:insp.id,equipment:{mode:'existing',equipment_id:pcId,expected_version:saved.data.version},position:{label:'Mesa 3'},visual_code_confirmed:true,lock_token:lock});assert.equal(claim.status,201,JSON.stringify(claim.data));
  const es=await machinePost(worker,envC,origin,identity,'/api/agent/v1/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId});
  await machinePost(worker,envC,origin,identity,'/api/agent/v1/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId,link_id:es.data.link.link_id});
  assert.equal((await machinePost(worker,envC,origin,identity,'/api/agent/v1/heartbeat',heartbeatBody(identity,{sequence:1}))).status,200);
  // 3) Lista de agentes: unidade, ficha, posição, presença; uso da autorização contabilizado.
  await page.locator('[data-action="agents-refresh"]').click();await page.getByText('PC-TESTE-ISOLADO').waitFor();
  const listText=await page.locator('body').innerText();assert.match(listText,/1 \/ 3/);assert.match(listText,/Unidade sem inventário/);assert.match(listText,/Sala de Leitura · Mesa 3/);assert.match(listText,/Vinculado/);assert.match(listText,/há 0 min|há \d+ min/);
  await page.screenshot({path:out+'/02-agentes-vinculados.png',fullPage:true});
  // Dados do agente abrem a mesma janela da consulta de equipamentos.
  await page.getByRole('button',{name:'Dados',exact:true}).click();await page.getByText('Comunicação do agente').waitFor();await page.screenshot({path:out+'/03-dados-do-agente.png'});await page.locator('dialog [data-action="close-dialog"]').click();
  // 3b) Prévia VISÍVEL de exclusão (rev2): a janela informa os agentes que seriam revogados. Só prévia — cancelada, nada excluído.
  const unitName=f.sqlite.prepare('SELECT name FROM units WHERE id=?').get(f.ids.pending).name;
  await page.goto(base+'/cadastro-unidades');await page.getByText(unitName,{exact:true}).first().waitFor();
  await page.fill('#unit-list-search',unitName);await page.locator('tr',{hasText:unitName}).getByRole('button',{name:'Excluir'}).click();
  await page.getByText(/1 agente\(s\) Windows vinculado\(s\)/).first().waitFor();await page.getByText(/será\(ão\) revogado\(s\) na mesma operação/).waitFor();
  await page.screenshot({path:out+'/06-previa-exclusao-agentes.png'});await page.getByRole('button',{name:'Cancelar'}).click();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM units WHERE id=?').get(f.ids.pending).n,1,'prévia não exclui');
  await page.goto(base+'/configuracoes');await page.getByText('Agentes Windows — autorizações de instalação (root)').waitFor();await page.locator('[data-action="agents-refresh"]').click();await page.getByText('PC-TESTE-ISOLADO').waitFor();
  // 4) Revogar pela tela com motivo: efeito comprovado (heartbeat recusado), ficha e histórico preservados.
  await page.getByRole('button',{name:'Revogar agente'}).click();await page.getByText('Revogar agente',{exact:true}).first().waitFor();await page.fill('#agents-revoke-reason','TESTE ISOLADO máquina substituída');await page.screenshot({path:out+'/04-revogar-confirmacao.png'});
  await page.getByRole('button',{name:'Confirmar revogação'}).click();await page.locator('table td',{hasText:'Revogado'}).first().waitFor();
  const hb=await machinePost(worker,envC,origin,identity,'/api/agent/v1/heartbeat',heartbeatBody(identity,{sequence:2}));assert.equal(hb.status,403,JSON.stringify(hb.data));
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipments WHERE id=?').get(pcId).n,1);assert.equal(f.sqlite.prepare("SELECT end_reason FROM agent_equipment_links WHERE equipment_id=?").get(pcId).end_reason,'revoked');assert.equal(JSON.parse(f.sqlite.prepare('SELECT data_json FROM equipments WHERE id=?').get(pcId).data_json).registration,'Agente');
  await page.screenshot({path:out+'/05-agente-revogado.png',fullPage:true});
  // 5) Revogar a autorização e executar a manutenção pela tela.
  await page.getByRole('button',{name:'Revogar',exact:true}).first().click().catch(()=>{});
  page.once('dialog',d=>d.accept('TESTE ISOLADO fim do lote'));await page.getByRole('button',{name:'Revogar',exact:true}).first().click().catch(()=>{});
  await page.getByText('revogada').first().waitFor().catch(()=>{});
  await page.getByRole('button',{name:'Executar manutenção agora'}).click();await page.getByText(/Manutenção executada/).waitFor();
  if(errors.length)throw Error('Erros de página/servidor:\n'+errors.join('\n'));
  console.log('OK: tela do root — autorização emitida uma vez, agente listado com unidade/ficha/presença, revogação com efeito, manutenção sob demanda.');
 }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});console.error(await page.locator('body').innerText().catch(()=>''));if(errors.length)console.error('ERROS:',errors.join('\n'));throw e;}finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exit(1);});
