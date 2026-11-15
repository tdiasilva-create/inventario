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
  if(mode==='hold-after')await g.release;
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

  // ------------------------------------------------ R1-A: mesma conta; outra sessão grava conteúdo DIFERENTE enquanto o pedido
  // desta tela nunca chega ao Worker (as repetições automáticas do navegador também caem).
  {const e=await createSaved('ORIGINAL · MESA A');await edit(e.id,'MINHA EDICAO · MESA C');
   gate('/api/collector/equipment-save',{sequence:['drop-request'],until:'/api/collector/equipment-lock'});
   const otherVersion=await otherSessionSaves(op,e.id,'OUTRA ABA · MESA B');
   await saveButton().click();
   const dialog=page.getByRole('dialog',{name:'Ficha alterada em outra sessão'});await dialog.waitFor();
   const text=await dialog.innerText();await shot('r1a-conflito-mesma-conta');
   await dialog.getByRole('button',{name:'Manter minhas respostas',exact:true}).click();await dialog.waitFor({state:'detached'});
   const stored=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id),st=await status(),field=await position().inputValue();
   record('R1-A conflito da mesma conta não vira confirmação',/sua conta/.test(text)&&stored.position_label==='OUTRA ABA · MESA B'&&stored.version===otherVersion&&field==='MINHA EDICAO · MESA C'&&/conflito/i.test(st)&&!/recebid|confirmad/i.test(st),{dialog:text.slice(0,90),stored,status:st,field});
   // Salvar de novo sem recarregar: o servidor preserva as duas versões e recusa; nada é sobrescrito.
   await saveButton().click();await dialog.waitFor();await shot('r1a-segundo-salvar');await dialog.getByRole('button',{name:'Recarregar do servidor',exact:true}).click();await dialog.waitFor({state:'detached'});
   await page.waitForFunction(()=>/recarregada do servidor/i.test(document.querySelector('.save-state')?.textContent||''));
   const after=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id),conflictsLogged=sql('SELECT COUNT(*) n FROM collection_conflicts WHERE entity_id=?',e.id).n,reloaded=await position().inputValue();
   record('R1-A salvar sem recarregar não sobrescreve; recarregar traz o servidor',after.version===otherVersion&&after.position_label==='OUTRA ABA · MESA B'&&conflictsLogged>=1&&reloaded==='OUTRA ABA · MESA B',{after,conflictsLogged,reloaded});
   await position().fill('APOS RECARGA · MESA D');await blur();await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   const finalRow=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id);
   record('R1-A salvar após recarregar grava uma versão acima',finalRow.version===otherVersion+1&&finalRow.position_label==='APOS RECARGA · MESA D',finalRow);}

  // ------------------------------------------------ R1-B: outro USUÁRIO grava enquanto esta tela edita (trava vencida).
  {const e=await createSaved('ORIGINAL · MESA E');await edit(e.id,'MINHA EDICAO · MESA F');
   f.sqlite.prepare('UPDATE equipment_locks SET expires_at=0 WHERE equipment_id=?').run(e.id);
   const otherVersion=await otherSessionSaves(root,e.id,'ROOT · MESA G');
   f.sqlite.prepare('UPDATE equipment_locks SET expires_at=0 WHERE equipment_id=?').run(e.id);
   await saveButton().click();const dialog=page.getByRole('dialog',{name:'Ficha alterada em outra sessão'});await dialog.waitFor();const text=await dialog.innerText();await shot('r1b-conflito-outro-usuario');
   await dialog.getByRole('button',{name:'Manter minhas respostas',exact:true}).click();await dialog.waitFor({state:'detached'});
   const stored=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id),st=await status(),field=await position().inputValue();
   record('R1-B conflito com outro usuário preserva as duas versões',!/sua conta/.test(text)&&stored.version===otherVersion&&stored.position_label==='ROOT · MESA G'&&field==='MINHA EDICAO · MESA F'&&!/recebid|confirmad/i.test(st),{dialog:text.slice(0,70),stored,status:st,field});
   await backToList();}

  // ------------------------------------------------ R1-C: resposta perdida DEPOIS de o servidor gravar (ficha existente).
  // C1: a repetição automática do navegador chega ao servidor e recebe 409 de versão com o MESMO conteúdo → confirmado, sem diálogo.
  {const e=await createSaved('ORIGINAL · MESA H');await edit(e.id,'PERDIDA · MESA I');
   gate('/api/collector/equipment-save',{sequence:['drop-response'],once:true});const mark=requests.length;
   await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   const stored=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id),st=await status();
   record('R1-C1 resposta perdida após gravar · repetição com 409 de versão e mesmo conteúdo é confirmada',stored.version===2&&stored.position_label==='PERDIDA · MESA I'&&/confirmado após a falha/i.test(st)&&saves200(mark)===1&&!(await page.getByRole('dialog').count()),{stored,status:st,log:requests.slice(mark)});}
  // C2: a repetição também cai; a reconciliação pela trava encontra versão+1, mesmo usuário, mesmo conteúdo → confirmado.
  {const e=await createSaved('ORIGINAL · MESA J');await edit(e.id,'PERDIDA · MESA K');
   gate('/api/collector/equipment-save',{sequence:['drop-response','drop-request'],until:'/api/collector/equipment-lock'});const mark=requests.length;
   await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   const stored=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id),st=await status();
   record('R1-C2 resposta perdida após gravar · reconciliação pela trava confirma o mesmo conteúdo',stored.version===2&&stored.position_label==='PERDIDA · MESA K'&&/confirmado após a falha/i.test(st)&&saves200(mark)===1,{stored,status:st,log:requests.slice(mark)});}

  // ------------------------------------------------ R1-D: falha ANTES de o servidor processar, sem concorrência → reenvio único.
  {const e=await createSaved('ORIGINAL · MESA L');await edit(e.id,'ANTES · MESA M');
   gate('/api/collector/equipment-save',{sequence:['drop-request'],until:'/api/collector/equipment-lock'});const mark=requests.length;
   await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   const stored=sql('SELECT version,position_label FROM equipments WHERE id=?',e.id),st=await status();
   record('R1-D falha antes de gravar · reenvio único após consultar a trava',stored.version===2&&stored.position_label==='ANTES · MESA M'&&saves200(mark)===1&&/recebid/i.test(st),{stored,status:st,saves:saves200(mark)});}

  // ------------------------------------------------ R1-E: ficha NOVA, resposta perdida após gravar → 1 registro, confirmada.
  {await manual('NOVA PERDIDA · MESA N');gate('/api/collector/equipment-save',{sequence:['drop-response'],once:true});const mark=requests.length;
   await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   const rows=all("SELECT version,position_label FROM equipments WHERE position_label='NOVA PERDIDA · MESA N'"),st=await status();
   record('R1-E ficha nova com resposta perdida · um registro, confirmada após a falha',rows.length===1&&rows[0].version===1&&/confirmado após a falha/i.test(st)&&saves200(mark)===1,{rows,status:st,log:requests.slice(mark).filter(x=>/equipment/.test(x.path))});}

  // ------------------------------------------------ R2-A: foto numa ficha nova; navegação DURANTE a preparação; trocar unidade recusado.
  {await manual('FOTO · FICHA SEM SALVAR');const unsavedId=await monoId();
   await page.evaluate(()=>{window.__holdImage=true;});
   await page.locator('input[data-photo]').last().setInputFiles(png);await page.waitForFunction(()=>window.__preparing);
   const mark=requests.length;await cards();
   await page.getByRole('button',{name:'Trocar unidade',exact:true}).click();await page.locator('.notice.error').waitFor();const refusal=await page.locator('.notice.error').innerText();
   await page.evaluate(()=>{window.__holdImage=false;window.__preparing=false;window.__releaseImage();});
   await page.waitForFunction(()=>/Fotografia recebida|Foto recebida/.test(document.querySelector('.save-state')?.textContent||''));
   const photoRows=all("SELECT target_id,status FROM collection_photos WHERE target_kind='equipment'"),draft=sql('SELECT id,version,data_json FROM equipments WHERE id=?',unsavedId);
   await page.locator('[data-action=resume]').click();await page.locator('.photo-thumb').first().waitFor();await shot('r2a-foto-apos-navegacao');
   const failed=await page.locator('.photo-thumb.failed').count(),thumbs=await page.locator('[data-action=view-photo]').count();
   record('R2-A navegar durante a preparação mantém a ficha alvo e cria o rascunho dela',/Aguarde o envio/.test(refusal)&&photoRows.length===1&&photoRows[0].target_id===unsavedId&&photoRows[0].status==='ready'&&!!draft&&JSON.parse(draft.data_json).draft===true&&failed===0&&thumbs===1,{refusal,photoRows,draft:draft&&{version:draft.version},log:requests.slice(mark)});
   await saveButton().click();await page.locator('.equipment-card').first().waitFor();}

  // ------------------------------------------------ R2-B: durante a preparação, criar OUTRA ficha espera; nada vai para a ficha errada.
  {await manual('FOTO · ORIGEM');const originId=await monoId();
   await page.evaluate(()=>{window.__holdImage=true;});await page.locator('input[data-photo]').last().setInputFiles(png);await page.waitForFunction(()=>window.__preparing);
   await backToList();
   const newClick=page.locator('[data-action=new]').click();
   await page.waitForFunction(()=>/Aguardando o envio da foto/.test(document.querySelector('.save-state')?.textContent||''));
   await page.evaluate(()=>{window.__holdImage=false;window.__preparing=false;window.__releaseImage();});
   await newClick;await discardIfAsked();await page.locator('.mono-id').waitFor();const newId=await monoId();
   const photoRows=all("SELECT target_id FROM collection_photos WHERE target_kind='equipment' AND target_id IN (?,?)",originId,newId),originRow=sql('SELECT id FROM equipments WHERE id=?',originId),newRow=sql('SELECT id FROM equipments WHERE id=?',newId);
   await shot('r2b-nova-ficha-apos-espera');
   record('R2-B criar outra ficha aguarda a foto e não grava rascunho na ficha errada',newId!==originId&&photoRows.length===1&&photoRows[0].target_id===originId&&!!originRow&&!newRow,{originId,newId,photoRows});
   await backToList();}

  // ------------------------------------------------ R2-C: navegação DURANTE o envio (resposta do upload retida).
  {await manual('FOTO · ENVIO LENTO');const id=await monoId();
   const g=gate('/api/collector/photo-upload',{sequence:['hold-after'],once:true});await page.locator('input[data-photo]').last().setInputFiles(png);await g.started;
   await cards();g.open();await page.waitForFunction(()=>/Fotografia recebida|Foto recebida/.test(document.querySelector('.save-state')?.textContent||''));
   const rows=all("SELECT target_id FROM collection_photos WHERE target_kind='equipment' AND target_id=?",id);
   record('R2-C navegar durante o envio mantém o alvo',rows.length===1,{id,rows});
   await page.locator('[data-action=resume]').click();await saveButton().waitFor();await saveButton().click();await page.locator('.equipment-card').first().waitFor();}

  // ------------------------------------------------ R3-A: miniatura retida + releitura da visita (cadastro de ambiente) → sem duplicar.
  {await cards();await page.locator('[data-action=facade]').click();await page.locator('input[data-photo]').last().waitFor({state:'attached'});
   const g=gate('/api/collector/photo-thumb',{sequence:['hold-after'],once:true});await page.locator('input[data-photo]').last().setInputFiles(png);await g.started;
   await cards();await open('B');await page.getByLabel('Nome do ambiente',{exact:true}).fill('AMBIENTE DURANTE FOTO');await page.getByRole('button',{name:'Adicionar ambiente',exact:true}).click();await page.getByText('AMBIENTE DURANTE FOTO',{exact:true}).waitFor();
   g.open();await page.waitForFunction(()=>/Fotografia recebida/.test(document.querySelector('.save-state')?.textContent||''));
   await cards();await page.locator('[data-action=facade]').click();await page.locator('[data-action=view-photo]').first().waitFor();
   const ids=await page.locator('[data-action=view-photo]').evaluateAll(els=>els.map(x=>x.dataset.photoId)),ready=sql("SELECT COUNT(*) n FROM collection_photos WHERE target_kind='facade' AND status='ready'").n,count=await page.locator('.photos-block h3 small').innerText();
   await shot('r3a-sem-duplicacao');
   record('R3-A releitura durante o envio não duplica a foto',ids.length===1&&ready===1&&/^1 recebida/.test(count),{ids,ready,count});}

  // ------------------------------------------------ R3-B: leitura ATRASADA da visita (iniciada antes de a foto chegar) não apaga a confirmação.
  {const up=gate('/api/collector/photo-upload',{sequence:['hold-before'],once:true});await page.locator('input[data-photo]').last().setInputFiles(png);await up.started;
   const read=gate('/api/collector/inspection',{sequence:['hold-after'],once:true});
   await cards();await open('B');await page.getByLabel('Nome do ambiente',{exact:true}).fill('AMBIENTE LEITURA ATRASADA');await page.getByRole('button',{name:'Adicionar ambiente',exact:true}).click();await read.started;
   up.open();await page.waitForFunction(()=>/Fotografia recebida/.test(document.querySelector('.save-state')?.textContent||''));
   read.open();await page.getByText('AMBIENTE LEITURA ATRASADA',{exact:true}).waitFor();
   await cards();await page.locator('[data-action=facade]').click();await page.locator('[data-action=view-photo]').first().waitFor();
   const ids=await page.locator('[data-action=view-photo]').evaluateAll(els=>els.map(x=>x.dataset.photoId)),ready=sql("SELECT COUNT(*) n FROM collection_photos WHERE target_kind='facade' AND status='ready'").n;
   record('R3-B leitura atrasada da visita não apaga a foto confirmada',ids.length===2&&new Set(ids).size===2&&ready===2,{ids,ready});
   await page.locator('[data-action=remove-photo]').first().click();const confirm=page.getByRole('dialog',{name:'Remover foto'});await confirm.waitFor();await confirm.getByRole('button',{name:'Remover',exact:true}).click();await confirm.waitFor({state:'detached'});
   await page.waitForFunction(()=>document.querySelectorAll('[data-action=view-photo]').length===1);
   const left=sql("SELECT COUNT(*) n FROM collection_photos WHERE target_kind='facade' AND status='ready'").n;
   record('R3-C remoção após os cenários mantém a contagem coerente',left===1,{left});}

  // ================================================================ R1-F: outra sessão da MESMA conta grava um RASCUNHO com as mesmas respostas.
  // (a) caminho da reconciliação pela trava (pedido e repetições nunca chegam ao Worker)
  {await cards();await open('F');const e=await createSaved('ORIGINAL · MESA P');await edit(e.id,'MINHA EDICAO · MESA Q');await blur();
   // a outra sessão precisa do MESMO conteúdo que esta tela vai enviar: grava a edição como rascunho a partir do estado atual + posição nova
   const held=await humanFetch(worker,env,origin,op,'/api/collector/equipment-lock',{inspectionId,id:e.id});assert.equal(held.status,200);
   const d=held.data.equipment.data;const other=await humanFetch(worker,env,origin,op,'/api/collector/equipment-save',{inspectionId,id:e.id,version:held.data.equipment.version,lockToken:held.data.token,environmentId:d.environment,draft:true,data:{...d,position_label:'MINHA EDICAO · MESA Q'}});assert.equal(other.status,200,JSON.stringify(other.data));
   gate('/api/collector/equipment-save',{sequence:['drop-request'],until:'/api/collector/equipment-lock'});
   await saveButton().click();const dialog=page.getByRole('dialog',{name:'Ficha alterada em outra sessão'});await dialog.waitFor();const text=await dialog.innerText();await shot('r1f-rascunho-nao-e-salvamento');
   await dialog.getByRole('button',{name:'Manter minhas respostas',exact:true}).click();await dialog.waitFor({state:'detached'});
   const stored=sql('SELECT version,position_label,data_json FROM equipments WHERE id=?',e.id),st=await status();
   record('R1-F-a rascunho concorrente com o mesmo conteúdo NÃO é confirmado como salvamento',/rascunho/i.test(text)&&stored.version===other.data.version&&JSON.parse(stored.data_json).draft===true&&!/recebid|confirmad/i.test(st)&&/conflito/i.test(st),{dialog:text.slice(0,110),stored:{version:stored.version,draft:JSON.parse(stored.data_json).draft},status:st});
   // recarregar traz o rascunho; salvar então conclui a ficha (sem rascunho)
   await saveButton().click();await dialog.waitFor();await dialog.getByRole('button',{name:'Recarregar do servidor',exact:true}).click();await dialog.waitFor({state:'detached'});
   await page.waitForFunction(()=>/recarregada do servidor/i.test(document.querySelector('.save-state')?.textContent||''));
   await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   const after=sql('SELECT version,position_label,data_json FROM equipments WHERE id=?',e.id);
   record('R1-F-a após recarregar, Salvar grava a ficha completa',after.version===other.data.version+1&&!JSON.parse(after.data_json).draft&&after.position_label==='MINHA EDICAO · MESA Q',{version:after.version,draft:JSON.parse(after.data_json).draft});}
  // (b) caminho do 409 de versão (a repetição automática do navegador chega ao Worker depois do rascunho concorrente)
  {const e=await createSaved('ORIGINAL · MESA R');await edit(e.id,'MINHA EDICAO · MESA S');await blur();
   const held=await humanFetch(worker,env,origin,op,'/api/collector/equipment-lock',{inspectionId,id:e.id});assert.equal(held.status,200);
   const d=held.data.equipment.data;const other=await humanFetch(worker,env,origin,op,'/api/collector/equipment-save',{inspectionId,id:e.id,version:held.data.equipment.version,lockToken:held.data.token,environmentId:d.environment,draft:true,data:{...d,position_label:'MINHA EDICAO · MESA S'}});assert.equal(other.status,200,JSON.stringify(other.data));
   gate('/api/collector/equipment-save',{sequence:['drop-request','pass'],until:'/api/collector/equipment-lock'});const mark=requests.length;
   await saveButton().click();const dialog=page.getByRole('dialog',{name:'Ficha alterada em outra sessão'});await dialog.waitFor();
   await dialog.getByRole('button',{name:'Manter minhas respostas',exact:true}).click();await dialog.waitFor({state:'detached'});
   const stored=sql('SELECT version,data_json FROM equipments WHERE id=?',e.id),st=await status(),log=requests.slice(mark).filter(x=>/equipment-save/.test(x.path));
   record('R1-F-b 409 de versão com rascunho concorrente NÃO é confirmado',JSON.parse(stored.data_json).draft===true&&stored.version===other.data.version&&!/recebid|confirmad/i.test(st)&&log.some(x=>x.status===409),{status:st,log});
   await backToList();}

  // ================================================================ R4: foto selecionada que FALHOU não pode ficar para trás.
  {const inspectionBefore=sql('SELECT state FROM inspections WHERE id=?',inspectionId).state;
   // ficha de "outro equipamento" com foto que falha (503 do armazenamento)
   await cards();await open('O');await page.locator('[data-action=new]').click();await discardIfAsked();await page.getByLabel('Qual equipamento? (opcional)').fill('TESTE · Foto pendente');await blur();await saveButton().click();await page.locator('.equipment-card').first().waitFor();
   await page.locator('[data-action=edit]').first().click();await page.locator('input[data-photo]').last().waitFor({state:'attached'});
   const fail=gate('/api/collector/photo-upload',{sequence:['fail-503']});await page.locator('input[data-photo]').last().setInputFiles(png);await page.locator('.photo-thumb.failed').waitFor();await shot('r4-foto-falhou');
   await backToList();
   // concluir o assunto com a foto pendente nesse assunto → recusa com o alvo
   await page.getByRole('button',{name:'Marcar assunto como concluído',exact:true}).click();await page.locator('.notice.error').waitFor();const refusal=await page.locator('.notice.error').innerText();
   const sectionO=sql('SELECT state FROM inspection_sections WHERE inspection_id=? AND section=?',inspectionId,'O').state;
   record('R4-A concluir assunto com foto não recebida é recusado apontando a ficha',/TESTE · Foto pendente/.test(refusal)&&/Reenvie ou descarte/.test(refusal)&&sectionO!=='Concluído',{refusal,sectionO});
   // segunda foto pendente: fachada (também 503)
   await cards();await page.locator('[data-action=facade]').click();await page.locator('input[data-photo]').last().setInputFiles(png);await page.locator('.photo-thumb.failed').waitFor();await cards();
   // demais assuntos concluídos pelas APIs reais (isola o efeito da foto; não contorna revisão nem conclusão)
   for(const [section,answers]of Object.entries({A:{},C:{exists:'Não'},D:{networks:[]},H:{occurrences:[]}})){const row=sql('SELECT version FROM inspection_sections WHERE inspection_id=? AND section=?',inspectionId,section);const r=await humanFetch(worker,env,origin,op,'/api/collector/section-save',{inspectionId,section,answers,version:row.version,complete:true});assert.equal(r.status,200,JSON.stringify(r.data));}
   // fichas deixadas em rascunho pelos cenários R2 (foto antes de Salvar) são concluídas pela API real, como o operador faria
   for(const row of all("SELECT id,data_json,environment_id FROM equipments WHERE inspection_id=? AND json_extract(data_json,'$.draft')=1",inspectionId)){const held=await humanFetch(worker,env,origin,op,'/api/collector/equipment-lock',{inspectionId,id:row.id});assert.equal(held.status,200);const d={...held.data.equipment.data};delete d.draft;const r=await humanFetch(worker,env,origin,op,'/api/collector/equipment-save',{inspectionId,id:row.id,version:held.data.equipment.version,lockToken:held.data.token,environmentId:d.environment,data:d});assert.equal(r.status,200,'conclusão de rascunho: '+JSON.stringify(r.data));}
   for(const section of ['B','F','G','O']){const row=sql('SELECT version FROM inspection_sections WHERE inspection_id=? AND section=?',inspectionId,section);const r=await humanFetch(worker,env,origin,op,'/api/collector/inventory-section',{inspectionId,section,version:row.version});assert.equal(r.status,200,JSON.stringify(r.data));}
   await page.getByRole('button',{name:'Revisar visita',exact:true}).click();await page.locator('[data-action=finish]').waitFor();
   const localItems=page.locator('.pending-item[data-code=FOTO_LOCAL_PENDENTE]');const n=await localItems.count(),disabled=await page.locator('[data-action=finish]').isDisabled(),countText=await page.locator('.pending-count').innerText();await shot('r4-revisao-fotos-pendentes');
   record('R4-B revisão mostra as fotos não recebidas com o alvo e bloqueia a conclusão',n===2&&disabled&&/Faltam 2 pendências/i.test(countText)&&sql('SELECT state FROM inspections WHERE id=?',inspectionId).state==='open',{n,disabled,countText});
   // descartar explicitamente a prévia opcional da fachada libera essa pendência
   await page.getByRole('button',{name:'Descartar prévia · Fachada da unidade',exact:true}).click();const drop=page.getByRole('dialog',{name:'Descartar prévia'});await drop.waitFor();await drop.getByRole('button',{name:'Descartar',exact:true}).click();await drop.waitFor({state:'detached'});
   await page.waitForFunction(()=>document.querySelectorAll('.pending-item[data-code=FOTO_LOCAL_PENDENTE]').length===1);
   record('R4-C descartar a prévia opcional libera a pendência',await page.locator('[data-action=finish]').isDisabled()===true&&(await localItems.count())===1,{left:await localItems.count()});
   // abrir a ficha exata pela revisão. Como o assunto O foi concluído pela API (atalho do teste; na UI a conclusão é recusada
   // enquanto a foto está pendente), a ficha abre em somente leitura: reabrir o assunto, reenviar com o armazenamento de volta,
   // concluir o assunto de novo e voltar à revisão: conclusão liberada.
   await localItems.first().getByRole('button',{name:'Abrir ficha',exact:true}).click();await page.locator('.photo-thumb.failed').waitFor();
   const readOnly=await page.locator('fieldset.locked').count();
   await page.getByRole('button',{name:'Reabrir assunto',exact:true}).click();const reopen=page.getByRole('dialog',{name:'Confirmar ação'});await reopen.waitFor();await reopen.getByRole('button',{name:'Confirmar',exact:true}).click();await reopen.waitFor({state:'detached'});
   await page.locator('[data-action=edit]').first().waitFor();await page.locator('[data-action=edit]').first().click();await page.locator('.photo-thumb.failed').waitFor();
   gates.delete('/api/collector/photo-upload');await page.getByRole('button',{name:/Reenviar foto/}).click();await page.waitForFunction(()=>/Fotografia recebida|Foto recebida/.test(document.querySelector('.save-state')?.textContent||''));
   await backToList();await page.getByRole('button',{name:'Marcar assunto como concluído',exact:true}).click();await page.locator('.cards').waitFor();
   await page.getByRole('button',{name:'Revisar visita',exact:true}).click();await page.locator('[data-action=finish]').waitFor();
   const enabled=!(await page.locator('[data-action=finish]').isDisabled()),leftover=await localItems.count();
   await page.locator('[data-action=finish]').click();const confirm=page.getByRole('dialog',{name:'Concluir visita'});await confirm.waitFor();await confirm.getByRole('button',{name:'Concluir visita',exact:true}).click();
   await page.waitForFunction(()=>/Visita concluída/.test(document.querySelector('.save-state')?.textContent||''));
   const finalState=sql('SELECT state FROM inspections WHERE id=?',inspectionId).state,photos=all("SELECT target_kind FROM collection_photos WHERE status='ready' ORDER BY target_kind");
   record('R4-D reenvio bem-sucedido libera; conclusão manual funciona; nenhuma foto abandonada',inspectionBefore==='open'&&readOnly===1&&enabled&&leftover===0&&finalState==='completed'&&photos.filter(p=>p.target_kind==='equipment').length>=1&&photos.filter(p=>p.target_kind==='facade').length===1,{finalState,photos});}

  // ================================================================ R4 no /app (Coleta embutida no shell, como o APK 1.0.3)
  {const app=await browser.newPage({viewport:{width:390,height:844}});app.setDefaultTimeout(15000);app.on('pageerror',e=>errors.push(e.stack));
   try{
   await app.goto(originApp+'/app');await app.locator('nav [data-area=collect]').waitFor();await app.locator('nav [data-area=collect]').click();
   const col=app.frameLocator('iframe[name=semed-collect]');await col.locator('[data-tab=received]').click();await col.getByRole('button',{name:/Unidade atribuída com inventário/}).click();await col.locator('[data-action=cards]').waitFor();
   gate('/api/collector/photo-upload',{sequence:['fail-503']});await col.locator('input[data-photo]').last().setInputFiles(png);await col.locator('.photo-thumb.failed').waitFor();
   await col.locator('[data-action=cards]').click();await col.getByRole('button',{name:'Revisar visita',exact:true}).click();await col.locator('[data-action=finish]').waitFor();
   const n=await col.locator('.pending-item[data-code=FOTO_LOCAL_PENDENTE]').count(),disabled=await col.locator('[data-action=finish]').isDisabled();
   if(out)await app.screenshot({path:path.join(out,'r4-app-embutido.png'),fullPage:true});
   await col.getByRole('button',{name:'Descartar prévia · Fachada da unidade',exact:true}).click();const drop=col.getByRole('dialog',{name:'Descartar prévia'});await drop.waitFor();await drop.getByRole('button',{name:'Descartar',exact:true}).click();await drop.waitFor({state:'detached'});
   const after=await col.locator('.pending-item[data-code=FOTO_LOCAL_PENDENTE]').count();gates.delete('/api/collector/photo-upload');await app.close();
   record('R4-E a Coleta embutida no /app aplica a mesma pendência local e o mesmo descarte',n===1&&disabled&&after===0,{n,disabled,after});
   }catch(e){if(out){await app.screenshot({path:path.join(out,'falha-app.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'falha-app.json'),JSON.stringify({error:String(e&&e.stack||e),frame:await app.frameLocator('iframe[name=semed-collect]').locator('body').innerText().catch(()=>null)},null,2));}throw e;}}

  assert.deepEqual(errors,[]);
 }catch(e){if(out){await page.screenshot({path:path.join(out,'falha.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'falha.json'),JSON.stringify({error:String(e&&e.stack||e),requests:requests.slice(-40),results},null,2));}throw e;}
 finally{if(out)fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({fixture:'Worker real + SQLite isolado',physicalAndroid:false,results,errors},null,2));await browser.close();await new Promise(r=>server.close(r));await new Promise(r=>serverApp.close(r));f.sqlite.close();}
 console.log('collector-concurrency-browser: '+results.length+' verificações passaram');
})().catch(e=>{console.error(e);process.exitCode=1;});
