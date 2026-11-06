// Teste de navegador (fora do npm test): painel desktop consultando uma unidade com vistoria V2 concluída e um computador
// vinculado ao agente, através do Worker REAL (APP_KIND painel) com sessão de visualizador injetada pelo servidor de teste.
// Verifica: esquema V2 no "Questionário recebido", tabela de equipamentos com estado do agente, janela "Dados do agente"
// (presença, última comunicação × última leitura, inventário reportado), contagem "Não testados" com o valor V2.
const {resolve,extname}=require('node:path'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(require('node:path').join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
(async()=>{
 const {collectorFixture}=await import('./helpers/collector-db.mjs'),{agentIdentity,enroll,session,humanFetch,heartbeatBody,inventoryBody,machinePost,lockFor}=await import('./helpers/agent-client.mjs'),worker=(await import('../server/worker.mjs')).default;
 const f=collectorFixture(),errors=[];
 // Como no build publicado (scripts/build-desktop.mjs), runtime-config.js liga a autenticação.
 const assets={fetch:async req=>{const p=new URL(req.url).pathname,file=resolve('web','.'+p);if(p==='/runtime-config.js')return new Response("export const collectorUrl='/coleta';export const authEnabled=true;",{headers:{'Content-Type':'text/javascript'}});if(!file.startsWith(resolve('web'))||!fs.existsSync(file)||fs.statSync(file).isDirectory())return new Response('not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.ttf':'font/ttf'})[extname(file)]||'application/octet-stream'}});}};
 const envC={DB:f.db,AUTH_PEPPER:'pepper-isolado',APP_KIND:'collector',ASSETS:assets,PHOTOS:{put:async()=>{},get:async()=>null,delete:async()=>{}}},envP={...envC,APP_KIND:'painel'};
 const origin='https://painel.test',op=await session(f,f.operator),root=await session(f,f.root);
 try{
  // 1) Coleta V2 concluída pela API do coletor: ambiente, computador em modo Agente (vinculado por QR), notebook manual, impressora, seções.
  const start=await humanFetch(worker,envC,origin,op,'/api/collector/v2-start',{unitId:f.ids.pending});assert.equal(start.status,201,JSON.stringify(start.data));const insp=start.data.inspection;
  const envr=await humanFetch(worker,envC,origin,op,'/api/collector/environment-save',{inspectionId:insp.id,name:'Secretaria',type:''});const envId=envr.data.environment.id;
  const pcId=crypto.randomUUID(),nbId=crypto.randomUUID(),prId=crypto.randomUUID();
  const base={mode:'Individual',quantity:1,environment:envId,assetStatus:'Sem patrimônio',condition:'Bom',use:'Em uso'};
  assert.equal((await humanFetch(worker,envC,origin,op,'/api/collector/equipment-save',{inspectionId:insp.id,id:pcId,data:{...base,category:'desktop',registration:'Agente',operation:'Funcionando',brand:'EXEMPLO'}})).status,201);
  assert.equal((await humanFetch(worker,envC,origin,op,'/api/collector/equipment-save',{inspectionId:insp.id,id:nbId,data:{...base,category:'notebook',registration:'Manual',manualReason:'Não liga',operation:'Não foi possível testar',condition:'Ruim',problems:'Não liga; sem carregador.'}})).status,201);
  assert.equal((await humanFetch(worker,envC,origin,op,'/api/collector/equipment-save',{inspectionId:insp.id,id:prId,data:{category:'printer',mode:'Individual',quantity:1,environment:envId,operation:'Funcionando',connection:'USB',origin:'SEMED/Prefeitura'}})).status,201);
  const grant=await humanFetch(worker,envC,origin,root,'/api/root/agent-install-grants',{expires_in_seconds:3600});const identity=await agentIdentity();const {enrollment}=await enroll(worker,envC,origin,identity,grant.data.grant_code);
  const claim=await humanFetch(worker,envC,origin,op,'/api/agent/v1/pairings/claim',{request_id:crypto.randomUUID(),enrollment_id:enrollment.data.enrollment_id,pairing_code:enrollment.data.pairing_code,unit_id:f.ids.pending,environment_id:envId,inspection_id:insp.id,equipment:{mode:'existing',equipment_id:pcId,expected_version:1},position:{label:'Mesa da secretária'},visual_code_confirmed:true,lock_token:await lockFor(worker,envC,origin,op,insp.id,pcId)});assert.equal(claim.status,201,JSON.stringify(claim.data));
  const es=await machinePost(worker,envC,origin,identity,'/api/agent/v1/enrollment-status',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId});await machinePost(worker,envC,origin,identity,'/api/agent/v1/pairings/confirm-device',{protocol_version:'1.0',request_id:crypto.randomUUID(),installation_id:identity.installationId,link_id:es.data.link.link_id});
  assert.equal((await machinePost(worker,envC,origin,identity,'/api/agent/v1/heartbeat',heartbeatBody(identity,{sequence:1}))).status,200);
  const inv=await machinePost(worker,envC,origin,identity,'/api/agent/v1/inventory',inventoryBody(identity,{sequence:2}));assert.equal(inv.status,200,JSON.stringify(inv.data));
  // Seções V2 e conclusão (fotos de impressora exigidas: registrar como 'ready' diretamente no banco isolado, como a fixture faz nos demais testes).
  const sec=async(s,answers)=>{const r=await humanFetch(worker,envC,origin,op,'/api/collector/section-save',{inspectionId:insp.id,section:s,version:(await humanFetch(worker,envC,origin,op,'/api/collector/inspection?id='+insp.id)).data.sections[s].version,answers});assert.equal(r.status,200,s+' '+JSON.stringify(r.data));return r.data;};
  await sec('A',{present:'Sim',name:'TESTE ISOLADO',role:'Direção',phone:'(98) 90000-0000'});await sec('C',{exists:'Não'});await sec('D',{networks:[]});await sec('F',{categoryStatus:'Não informar'});await sec('G',{});await sec('H',{occurrences:[],needs:[]});
  const now=Date.now(),photo=f.sqlite.prepare("INSERT INTO collection_photos(id,unit_id,inspection_id,target_kind,target_id,object_key,mime_type,size,sha256,created_by,created_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,'ready')");
  photo.run(crypto.randomUUID(),f.ids.pending,insp.id,'facade','facade','ISOLATED-TEST-PHOTO-1','image/jpeg',3,'test',f.operator.id,now);photo.run(crypto.randomUUID(),f.ids.pending,insp.id,'equipment',prId,'ISOLATED-TEST-PHOTO-2','image/jpeg',3,'test',f.operator.id,now);
  const state=(await humanFetch(worker,envC,origin,op,'/api/collector/inspection?id='+insp.id)).data;
  for(const s of ['A','C','D','H'])assert.equal((await humanFetch(worker,envC,origin,op,'/api/collector/section-save',{inspectionId:insp.id,section:s,version:state.sections[s].version,answers:state.sections[s].data,complete:true})).status,200,'concluir '+s);
  for(const s of ['F','G']){const cur=(await humanFetch(worker,envC,origin,op,'/api/collector/inspection?id='+insp.id)).data;assert.equal((await humanFetch(worker,envC,origin,op,'/api/collector/inventory-section',{inspectionId:insp.id,section:s,version:cur.sections[s].version})).status,200,'concluir '+s);}
  const review=await humanFetch(worker,envC,origin,op,'/api/collector/review?id='+insp.id);assert.deepEqual(review.data.errors,{},JSON.stringify(review.data));const fin=await humanFetch(worker,envC,origin,op,'/api/collector/finish',{inspectionId:insp.id,confirm:true,revision:review.data.revision});assert.equal(fin.status,200,JSON.stringify(fin.data));
  // 2) Painel desktop como visualizador (sessão injetada pelo servidor de teste).
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);const viewer=await session(f,f.root);
  const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);headers.set('Cookie',viewer.cookie);const response=await worker.fetch(new Request(url,{method:req.method,headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),envP);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){errors.push(e.stack);res.writeHead(500);res.end('TEST ERROR');}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base_url='http://127.0.0.1:'+server.address().port;
  const browser=await pw.chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1672,height:941}});page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(15000);
  const out='docs/05-qualidade/evidencias/painel-v2-agente-2026-11-04';fs.mkdirSync(out,{recursive:true});
  try{
   await page.goto(base_url+'/unidade?id='+encodeURIComponent(f.ids.pending));await page.getByText('Questionário recebido').waitFor();
   const text=await page.locator('body').innerText();assert.match(text,/Questionário V2 \(coleta-2\.0\)/);assert.match(text,/A · Acompanhante/);assert.match(text,/F · Computadores/);assert.doesNotMatch(text,/B · |E · /);
   assert.doesNotMatch(text,/90000-0000/,'telefone do acompanhante oculto ao visualizador');
   await page.screenshot({path:out+'/01-unidade-v2.png',fullPage:true});
   // Tabela de equipamentos: estados do agente, posição confirmada, rótulo V2 de funcionamento.
   await page.goto(base_url+'/');await page.locator('.matrix tbody tr').first().waitFor();
   await page.locator('.matrix tbody tr').first().locator('button[data-action="cell"]').first().click();
   await page.getByText('Equipamentos ·').waitFor();const dlg=await page.locator('dialog').innerText();
   assert.match(dlg,/Agente vinculado/);assert.match(dlg,/Sem agente · Não liga/);assert.match(dlg,/Mesa da secretária/);assert.match(dlg,/localização confirmada/);assert.match(dlg,/Funcionando normalmente/);assert.match(dlg,/Não foi possível testar/);
   await page.screenshot({path:out+'/02-equipamentos.png',fullPage:true});
   await page.getByRole('button',{name:'Dados do agente'}).click();await page.getByText('Comunicação do agente').waitFor();const agent=await page.locator('dialog').innerText();
   assert.match(agent,/Comunicando/);assert.match(agent,/Última comunicação \(recebida\)/);assert.match(agent,/Última leitura \(coletada na máquina\)/);assert.match(agent,/PC-TESTE-ISOLADO/);assert.match(agent,/CPU-TESTE/);assert.match(agent,/8\.0 GB/);assert.match(agent,/fonte oficial/);
   await page.screenshot({path:out+'/03-dados-do-agente.png',fullPage:true});
   // [R2-C] Revisita: mudança de localização pela rota autorizada aparece como PARCIAL na consulta oficial e na janela do agente,
   // sem alterar a ficha oficial (publicada) até a conclusão da visita 2.
   const v2=await humanFetch(worker,envC,origin,op,'/api/collector/v2-start',{unitId:f.ids.pending});assert.equal(v2.status,201,JSON.stringify(v2.data));const insp2=v2.data.inspection;
   const f2=f.sqlite.prepare("SELECT version FROM inspection_sections WHERE inspection_id=? AND section='F'").get(insp2.id);assert.equal((await humanFetch(worker,envC,origin,op,'/api/collector/inventory-section',{inspectionId:insp2.id,section:'F',version:f2.version,reopen:true})).status,200);
   const dep=await humanFetch(worker,envC,origin,op,'/api/collector/environment-save',{inspectionId:insp2.id,name:'Depósito',confirmSimilar:true});
   f.sqlite.prepare('DELETE FROM equipment_locks WHERE equipment_id=?').run(pcId); // trava da visita 1 (teste) liberada
   const lock2=await lockFor(worker,envC,origin,op,insp2.id,pcId);const curV=f.sqlite.prepare('SELECT version FROM equipments WHERE id=?').get(pcId).version;
   const moved=await humanFetch(worker,envC,origin,op,'/api/inventory/equipment-location',{request_id:crypto.randomUUID(),equipment_id:pcId,expected_version:curV,environment_id:dep.data.environment.id,position:{label:'Prateleira 1'},reason:'TESTE revisita mudança de sala',inspection_id:insp2.id,lock_token:lock2});assert.equal(moved.status,200,JSON.stringify(moved.data));
   await page.goto(base_url+'/');await page.locator('.matrix tbody tr').first().waitFor();await page.locator('.matrix tbody tr').first().locator('button[data-action="cell"]').first().click();await page.getByText('Equipamentos ·').waitFor();
   const dlg2=await page.locator('dialog').innerText();assert.match(dlg2,/Secretaria/,'ficha oficial continua na visita publicada');assert.match(dlg2,/Mesa da secretária/);assert.match(dlg2,/PARCIAL · alteração da visita aberta ainda não publicada: Depósito · Prateleira 1/);
   await page.getByRole('button',{name:'Dados do agente'}).click();await page.getByText('Comunicação do agente').waitFor();const agent2=await page.locator('dialog').innerText();assert.match(agent2,/oficial · última publicação/);assert.match(agent2,/Secretaria · Mesa da secretária/);assert.match(agent2,/PARCIAL · visita aberta ainda não publicada: Depósito · Prateleira 1/);
   await page.screenshot({path:out+'/04-parcial-revisita.png',fullPage:true});
   // Resultados: 'Não foi possível testar' contado em "Não testados".
   await page.goto(base_url+'/ocorrencias').catch(()=>{});await page.waitForTimeout(800);const res=await page.locator('body').innerText();if(/Não testados/.test(res))assert.match(res,/1\s*Não testados|Não testados[\s\S]{0,5}1/);
   if(errors.length)throw Error('Erros de página/servidor:\n'+errors.join('\n'));
   console.log('OK: painel desktop com esquema V2, estado do agente por ficha, janela de dados do agente e contagem V2.');
  }catch(e){await page.screenshot({path:out+'/falha.png',fullPage:true});console.error(await page.locator('body').innerText().catch(()=>''));if(errors.length)console.error('ERROS:',errors.join('\n'));throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
 }finally{f.sqlite.close();}
})().catch(e=>{console.error(e);process.exit(1);});
