// Teste de navegador (fora do npm test): ficha V2 em modo Agente + vínculo por QR Code, passando pelo Worker REAL
// (sessão, Origin, CSRF, rotas de máquina assinadas e rotas humanas do módulo de agentes). Dados fictícios em banco isolado.
// O QR é gerado com `qrcode` (devDependency) e decodificado pelo leitor LOCAL do coletor (web/vendor/jsqr) a partir de
// uma imagem — mesmo caminho usado quando a câmera não está disponível. Nada é enviado para fora do servidor de teste.
const {join,resolve}=require('node:path'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const QRCode=require('qrcode');
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{agentIdentity,enroll,session,humanFetch,heartbeatBody,machinePost}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),errors=[];
 const env={DB:f.db,AUTH_PEPPER:'pepper-isolado',APP_KIND:'collector',PHOTOS:{put:async()=>{},get:async()=>null,delete:async()=>{}},ASSETS:{fetch:async req=>{const p=new URL(req.url).pathname,file=resolve('web','.'+p);if(!file.startsWith(resolve('web'))||!fs.existsSync(file))return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf'})[require('node:path').extname(file)]||'application/octet-stream'}});}}};
 const op=await session(f,f.operator),root=await session(f,f.root);
 // O navegador não guarda cookie __Host- em http://127.0.0.1; o servidor de teste injeta a sessão do operador em cada pedido.
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',op.cookie);const response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await pw.chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.stack));page.on('dialog',d=>d.accept());page.setDefaultTimeout(15000);
 const out='docs/05-qualidade/evidencias/coleta-v2-qr-2026-11-04';fs.mkdirSync(out,{recursive:true});
 try{
  // Autorização de instalação (root) e cadastro assinado do "agente" (máquina), como o EXE faria. QR temporário fictício.
  const grant=await humanFetch(worker,env,origin,root,'/api/root/agent-install-grants',{expires_in_seconds:3600,max_uses:2});assert.equal(grant.status,201,JSON.stringify(grant.data));
  const identity=await agentIdentity();const {enrollment}=await enroll(worker,env,origin,identity,grant.data.grant_code);assert.equal(enrollment.status,201,JSON.stringify(enrollment.data));
  const qrText=JSON.stringify({type:'semed.agent.pairing',version:1,enrollment_id:enrollment.data.enrollment_id,pairing_code:enrollment.data.pairing_code,expires_at:enrollment.data.expires_at});
  const qrPng=await QRCode.toBuffer(qrText,{errorCorrectionLevel:'M',scale:6,margin:4});fs.writeFileSync(out+'/qr-ficticio.png',qrPng);
  // Coleta V2: fachada → ambiente → ficha de computador em modo Agente.
  await page.goto(origin);await page.getByRole('button',{name:/Unidade sem inventário/}).click();await page.getByRole('heading',{name:'Comece pela fachada'}).waitFor();
  const png={name:'TESTE.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKxkAAAAASUVORK5CYII=','base64')};
  await page.locator('input[data-photo]').last().setInputFiles(png);await page.getByRole('button',{name:'Continuar · acompanhante'}).click();await page.getByLabel('Há alguém acompanhando a coleta?').selectOption('Não');await page.getByRole('button',{name:'Marcar como concluído',exact:true}).click();
  await page.getByRole('button',{name:/Computadores Pendente/}).click();
  await page.getByLabel('Situação desta categoria nesta visita (opcional)').waitFor();
  await page.getByRole('button',{name:'+ Adicionar computador'}).click();
  await page.getByLabel('Tipo de equipamento').selectOption('desktop');
  await page.getByLabel('Como será cadastrado?').selectOption('Agente');
  await page.getByText('Vincular pelo QR Code').waitFor();await page.screenshot({path:out+'/01-ficha-modo-agente.png',fullPage:true});
  // [REV-05] Ler QR imediatamente na etapa 1: nada é gravado antes de abrir o leitor e nenhum campo não pertinente bloqueia a prévia.
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM equipments').get().n,0,'nenhuma ficha gravada antes do leitor');
  await page.getByRole('button',{name:'Ler QR Code do agente'}).click();await page.locator('.qr-scanner').waitFor();await page.screenshot({path:out+'/02-leitor-qr.png'});
  // Cancelar e reabrir funciona; leitura pela imagem (câmera indisponível no headless): leitor local → prévia do servidor.
  await page.getByRole('button',{name:'Cancelar'}).click();assert.equal(await page.locator('.qr-scanner').count(),0);
  await page.getByRole('button',{name:'Ler QR Code do agente'}).click();await page.locator('.qr-scanner').waitFor();
  await page.locator('input[data-qr="file"]').setInputFiles({name:'qr.png',mimeType:'image/png',buffer:qrPng});
  await page.getByText('Confira a máquina antes de vincular').waitFor();assert.equal(await page.locator('.qr-scanner').count(),0,'leitor fechado após decodificar');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM equipments').get().n,0,'prévia não grava ficha');
  const bodyText=await page.locator('body').innerText();assert.match(bodyText,/PC-TESTE-ISOLADO/);assert.match(bodyText,new RegExp(enrollment.data.visual_code.replace('-','-')));
  // Ambiente informado DENTRO da prévia (mesmo campo da etapa 2): cadastrar pelo botão do cartão e voltar com a prévia preservada.
  await page.locator('.agent-preview').getByRole('button',{name:'+ Cadastrar ambiente'}).click();await page.getByLabel(/Nome do ambiente/).fill('Laboratório de Informática');await page.getByRole('button',{name:'Cadastrar ambiente'}).click();await page.locator('article.summary-card strong',{hasText:'Laboratório de Informática'}).waitFor();
  // Nome parecido: o coletor pergunta (confirm aceito pelo teste) e envia confirmSimilar.
  await page.getByLabel(/Nome do ambiente/).fill('Laboratorio de informatica');await page.getByRole('button',{name:'Cadastrar ambiente'}).click();await page.locator('article.summary-card strong',{hasText:'Laboratorio de informatica'}).waitFor();assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM environments').get().n,2);
  await page.getByRole('button',{name:'Voltar ao preenchimento'}).click();await page.getByText('Confira a máquina antes de vincular').waitFor();
  await page.locator('.agent-preview select[data-field="environment"]').selectOption({label:'Laboratório de Informática'});
  await page.screenshot({path:out+'/03-previa-conferencia.png',fullPage:true});
  // Confirmação sem marcar a conferência e sem posição é recusada no aparelho; depois vínculo real (rascunho mínimo + trava + claim).
  await page.getByRole('button',{name:'Confirmar vínculo'}).click();await page.getByText(/Confirme que o código de conferência/).waitFor();
  await page.locator('input[data-field="_pairing.confirmed"]').check();await page.getByRole('button',{name:'Confirmar vínculo'}).click();await page.getByText(/Informe a posição no ambiente/).waitFor();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM equipments').get().n,0,'recusas locais não gravam nada');
  await page.locator('input[data-field="_pairing.positionLabel"]').fill('Bancada 1 / PC 1');await page.getByRole('button',{name:'Confirmar vínculo'}).click();
  await page.getByText('Computador vinculado ao agente').waitFor();await page.screenshot({path:out+'/04-vinculado.png',fullPage:true});
  const link=f.sqlite.prepare('SELECT l.equipment_id,l.ended_at,e.position_label,e.location_state,e.version,e.data_json FROM agent_equipment_links l JOIN equipments e ON e.id=l.equipment_id').all();assert.equal(link.length,1);assert.equal(link[0].ended_at,null);assert.equal(link[0].position_label,'Bancada 1 / PC 1');assert.equal(link[0].location_state,'confirmada_em_visita');assert.equal(JSON.parse(link[0].data_json).registration,'Agente');
  assert.equal(JSON.parse(link[0].data_json).draft,true,'ficha ainda é rascunho até a conferência completa');
  // Rascunho impede concluir o assunto F (validação de conclusão não foi enfraquecida).
  const sess=await session(f,f.operator);const insp=f.sqlite.prepare("SELECT id FROM inspections WHERE unit_id=? AND state='open'").get(f.ids.pending).id;const fv=f.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='F'").get(insp).version;
  const blockedDraft=await humanFetch(worker,env,origin,sess,'/api/collector/inventory-section',{inspectionId:insp,section:'F',version:fv});assert.equal(blockedDraft.status,409);assert.equal(blockedDraft.data.pendingDrafts,1);
  // Completar as etapas 2 a 4 e salvar: validação completa, marca de rascunho removida, mesmo ID permanente.
  await page.getByRole('button',{name:'Próximo →'}).click();await page.getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');
  await page.getByRole('button',{name:'Próximo →'}).click();
  await page.getByLabel('Conservação física').selectOption('Bom');await page.getByLabel('Funcionamento observado').selectOption({label:'Funcionando normalmente'});await page.getByLabel('Situação de uso').selectOption('Em uso');
  // Salvar a ficha depois do vínculo deve usar a versão nova (sem conflito) e manter o vínculo.
  await page.getByRole('button',{name:'Próximo →'}).click();await page.getByRole('button',{name:/Salvar equipamento/}).click();
  await page.getByText('Agente vinculado',{exact:true}).waitFor();await page.screenshot({path:out+'/05-lista-vinculado.png',fullPage:true});
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM equipments').get().n,1,'nenhuma ficha duplicada');assert.equal(JSON.parse(f.sqlite.prepare('SELECT data_json FROM equipments').get().data_json).draft,undefined,'marca de rascunho removida pela validação completa');
  // Segundo computador em modo Agente sem vínculo bloqueia a conclusão do assunto; cadastro manual não bloqueia.
  await page.locator('.equipment-card',{hasText:'Agente vinculado'}).getByRole('button',{name:'Conferir / editar e fotografar'}).click();assert.equal(await page.getByLabel('Como será cadastrado?').isDisabled(),true,'modo bloqueado na ficha vinculada');await page.getByRole('button',{name:'← Voltar',exact:true}).click();
  await page.getByRole('button',{name:'+ Adicionar computador'}).click();await page.getByLabel('Tipo de equipamento').selectOption('notebook');await page.getByLabel('Como será cadastrado?').selectOption('Agente');
  await page.getByRole('button',{name:'Próximo →'}).click();await page.locator('select[data-field="environment"]').selectOption({label:'Laboratório de Informática'});await page.getByLabel('Situação do patrimônio').selectOption('Sem patrimônio');
  await page.getByRole('button',{name:'Próximo →'}).click();await page.getByLabel('Conservação física').selectOption('Bom');await page.getByLabel('Funcionamento observado').selectOption('Funcionando');await page.getByLabel('Situação de uso').selectOption('Em uso');await page.getByRole('button',{name:'Próximo →'}).click();await page.getByRole('button',{name:/Salvar equipamento/}).click();
  await page.getByText('Vínculo do agente pendente').waitFor();
  await page.getByLabel('Situação desta categoria nesta visita (opcional)').selectOption('Não cadastrado nesta visita');
  await page.getByRole('button',{name:'Marcar assunto como concluído'}).click();await page.getByText(/sem vínculo confirmado/).waitFor();await page.screenshot({path:out+'/06-bloqueio-sem-vinculo.png',fullPage:true});
  // Troca para cadastro manual com motivo libera a conclusão; 7.C1 fica gravado.
  assert.ok(await page.locator('.equipment-card',{hasText:'Agente vinculado'}).count(),'card do vinculado');await page.locator('.equipment-card',{hasText:'Vínculo do agente pendente'}).getByRole('button',{name:'Conferir / editar e fotografar'}).click();await page.getByLabel('Como será cadastrado?').selectOption('Manual');await page.getByLabel('Motivo da ausência do agente').selectOption('Instalação falhou');
  await page.getByRole('button',{name:'Próximo →'}).click();await page.getByRole('button',{name:'Próximo →'}).click();await page.getByRole('button',{name:'Próximo →'}).click();await page.getByRole('button',{name:/Salvar equipamento/}).click();await page.getByText('Sem agente (cadastro manual)').waitFor();
  await page.getByRole('button',{name:'Marcar assunto como concluído'}).click();await page.getByRole('button',{name:/Computadores Concluído/}).waitFor();
  const sectionF=JSON.parse(f.sqlite.prepare("SELECT data_json FROM inspection_sections WHERE section='F'").get().data_json);assert.equal(sectionF.categoryStatus,'Não cadastrado nesta visita');
  // Telemetria do agente já vinculado chega pela mesma ficha.
  const es=await machinePost(worker,env,origin,identity,'/api/agent/v1/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId});assert.equal(es.data.state,'linked');assert.equal(es.data.link.equipment_id,link[0].equipment_id);
  const cf=await machinePost(worker,env,origin,identity,'/api/agent/v1/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId,link_id:es.data.link.link_id});assert.equal(cf.status,200,JSON.stringify(cf.data));
  const hb=await machinePost(worker,env,origin,identity,'/api/agent/v1/heartbeat',heartbeatBody(identity,{sequence:1}));assert.equal(hb.status,200,JSON.stringify(hb.data));assert.equal(hb.data.presence_updated,true);
  const st=await humanFetch(worker,env,origin,root,'/api/inventory/agent-status?equipmentId='+link[0].equipment_id,undefined);assert.equal(st.status,200,JSON.stringify(st.data));assert.equal(st.data.agent?.device_id,identity.deviceId,'status do agente disponível para a ficha');assert.ok(st.data.agent.presence||st.data.agent.last_seen_at||st.data.agent.presence_state,'presença registrada');
  console.log('OK: ficha V2 em modo Agente, QR decodificado localmente, prévia, vínculo confirmado pelo servidor, bloqueio sem vínculo, manual com motivo, 7.C1.');
  if(errors.length)throw Error('Erros de página/servidor:\n'+errors.join('\n'));
 }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});console.error(await page.locator('body').innerText());throw e;}finally{await browser.close();await new Promise(r=>server.close(r));f.sqlite.close();}
})().catch(e=>{console.error(e);process.exit(1);});
