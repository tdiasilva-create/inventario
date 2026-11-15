// Documentary capture only: real Worker against an ephemeral SQLite fixture.
// No production URL, credentials, installation or Android signing is used.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const base=path.resolve('private-data/entregas/app-tecnico-2026-11-13');
 const shots=path.join(base,'EVIDENCIAS'),examples=path.join(base,'EXEMPLOS');
 fs.mkdirSync(shots,{recursive:true});fs.mkdirSync(examples,{recursive:true});
 const h=await require('../tests/helpers/panel-browser.cjs')();
 const {page,origin,f}=h,manifest=[];
 assert.equal(new URL(origin).hostname,'127.0.0.1');
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const shot=async(name,description)=>{
  await page.evaluate(()=>{document.querySelector('#handoff-label')?.remove();const p=document.createElement('div');p.id='handoff-label';p.textContent='TESTE LOCAL · dados sintéticos · GPS simulado';p.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;text-align:center;font:11px Arial;padding:5px;pointer-events:none';document.body.append(p);});
  const fullPage=await page.locator('dialog[open]').count()===0;
  await page.screenshot({path:path.join(shots,name+'.png'),fullPage,animations:'disabled'});
  manifest.push({file:name+'.png',description,viewport:page.viewportSize(),fullPage,source:'Frontend atual; Worker local e SQLite em memória'});
 };
 try{
  f.sqlite.prepare('UPDATE users SET display_name=? WHERE id=?').run('TESTE · Técnico Aurora',f.root.id);
  f.sqlite.prepare('UPDATE users SET display_name=? WHERE id=?').run('TESTE · Técnico Horizonte',f.operator.id);
  for(const [key,name,latitude,longitude] of [['pending','TESTE · Unidade Aurora',-2.54,-44.17],['progress','TESTE · Unidade Horizonte',-2.55,-44.18]])
   f.sqlite.prepare('UPDATE units SET name=?,latitude=?,longitude=? WHERE id=?').run(name,latitude,longitude,f.ids[key]);
  const me=await(await page.request.get(origin+'/api/auth/me')).json();
  const post=async(p,data)=>{const r=await page.request.post(origin+p,{headers:{Origin:origin,'X-CSRF-Token':me.csrf},data});assert.ok(r.ok(),await r.text());return r.json();};
  const cmd=x=>({operationId:crypto.randomUUID(),revision:f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision,...x});
  await post('/api/dispatch/technician',cmd({userId:f.root.id,enabled:true}));
  await post('/api/dispatch/technician',cmd({userId:f.operator.id,enabled:true}));
  for(const [unit,description,kind] of [['pending','TESTE · Conferir teclado e mouse do laboratório. Registrar o resultado da visita.','Manutenção'],['progress','TESTE · Verificar necessidade de reposição de toner na secretaria da unidade.','Reposição de insumo'],['pending','TESTE · Verificar sinal de internet nas salas e orientar a equipe local.','Visita técnica']]){
   const id=crypto.randomUUID();await post('/api/operations/request-save',{id,operationId:crypto.randomUUID(),version:0,unitId:f.ids[unit],equipmentId:null,description,kind,source:'Painel',requester:'',responsible:'',scheduledDate:'',note:'',status:'Aberta'});
   await post('/api/dispatch/assign',cmd({id,userIds:[f.root.id,f.operator.id]}));
  }
  const exportJSON=async(name,p)=>{const r=await page.request.get(origin+p);assert.ok(r.ok());fs.writeFileSync(path.join(examples,name+'.json'),JSON.stringify(await r.json(),null,2)+'\n');};
  await exportJSON('fila-sintetica','/api/technician/queue');
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/auth/me',r=>r.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Autenticação necessária.'})}));
  await page.goto(origin+'/tecnico');await page.locator('.login').waitFor();await shot('01-login','Login; 401 induzido apenas no teste, sem credenciais reais.');
  await page.unroute('**/api/auth/me');
  await page.route('**/api/auth/me',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({...me,mustChange:true})}));
  await page.reload();await page.getByRole('heading',{name:'Defina sua senha'}).waitFor();await shot('02-senha-provisoria','Tela atual de troca obrigatória; estado de teste induzido.');
  await page.unroute('**/api/auth/me');
  await page.reload();await page.locator('.task').first().waitFor();await shot('03-fila-390','Três demandas sintéticas, duas pessoas atribuídas por demanda.');
  await page.getByRole('button',{name:'Aceitar e iniciar'}).first().click();await page.waitForFunction(()=>document.querySelector('#status')?.classList.contains('error'));await shot('04-gps-indisponivel','Aceite sem permissão GPS no navegador; nenhum atendimento criado.');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_attendances').get().n,0);
  await page.context().grantPermissions(['geolocation'],{origin});await page.context().setGeolocation({latitude:-2.543,longitude:-44.172,accuracy:10});
  await page.getByRole('button',{name:'Aceitar e iniciar'}).first().click();await page.locator('.task.active').waitFor();await shot('05-atendimento-ativo','Aceite confirmado pelo Worker local; GPS do navegador simulado.');
  await exportJSON('atendimento-ativo-sintetico','/api/technician/active');
  await page.locator('.task.active').getByRole('button',{name:'Observação',exact:true}).click();await page.locator('dialog textarea').fill('TESTE LOCAL · Atendimento em andamento; conferindo periféricos.');await shot('06-observacao','Modal de observação, antes de confirmar.');
  await page.locator('dialog').getByRole('button',{name:'Cancelar'}).click();
  await page.locator('.task.active').getByRole('button',{name:'Impedimento',exact:true}).click();await page.locator('dialog textarea').fill('TESTE LOCAL · Aguardando acesso à sala.');await shot('07-impedimento','Modal de impedimento; não altera automaticamente status/GPS.');
  await page.locator('dialog').getByRole('button',{name:'Confirmar'}).click();await page.locator('dialog').waitFor({state:'detached'});await page.getByText('Atualizado às',{exact:false}).waitFor();
  await page.locator('.task.active').getByRole('button',{name:'Concluir atendimento',exact:true}).click();await page.locator('dialog').waitFor();await shot('08-confirmar-conclusao','Confirmação simples, sem relato obrigatório.');
  await page.locator('dialog').getByRole('button',{name:'Confirmar'}).click();await page.waitForFunction(()=>!document.querySelector('.task.active'));assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_positions').get().n,0);
  await page.getByRole('button',{name:'Concluídos',exact:true}).click();await page.locator('.task.done').waitFor();await shot('09-concluidos','Conclusão local e retirada da posição, mesmo com outras tarefas pendentes.');
  await exportJSON('historico-sintetico','/api/technician/queue?history=1');
  await page.getByRole('button',{name:/^Avisos/}).click();await page.locator('.notice').first().waitFor();await shot('10-avisos','Notificações sintéticas de habilitação, atribuição e ações.');
  await exportJSON('avisos-sinteticos','/api/technician/notifications');
  await page.getByRole('button',{name:'Fila',exact:true}).click();await page.locator('.task').first().waitFor();
  const {session,humanFetch}=await import('../tests/helpers/agent-client.mjs');
  const os=await session(f,f.operator),row=f.sqlite.prepare("SELECT * FROM service_requests WHERE status!='Concluída' ORDER BY number LIMIT 1").get();
  const result=await humanFetch((await import('../server/worker.mjs')).default,h.env,origin,os,'/api/technician/accept',{operationId:crypto.randomUUID(),id:row.id,version:row.version,note:'',position:{latitude:-2.543,longitude:-44.172,accuracy:10,observedAt:Date.now()}});assert.equal(result.status,200,JSON.stringify(result));
  await page.getByRole('button',{name:'Atualizar',exact:true}).click();await page.getByRole('button',{name:'Concluir pela equipe'}).waitFor();await shot('11-colega-ativo','Um colega aceitou: outro atribuído pode concluir pela equipe.');
  await page.setViewportSize({width:360,height:800});await shot('12-fila-360','Responsividade da interface atual em 360 pixels.');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:412,height:915});await shot('13-fila-412','Responsividade atual em 412 pixels.');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:812,height:375});await page.getByRole('button',{name:'Observação',exact:true}).first().click();await page.locator('dialog textarea').fill('TESTE LOCAL · Área reduzida; teclado Android real não foi simulado.');await shot('14-modal-paisagem','Viewport baixo/paisagem; NÃO é homologação de teclado Android.');await page.locator('dialog').getByRole('button',{name:'Cancelar'}).click();
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/technician/queue*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({items:[],total:0,revision:0,offset:0,nextOffset:null,serverTime:Date.now(),notifications:[],unread:0})}));
  await page.reload();await page.getByText('Nenhuma demanda nesta lista.',{exact:true}).waitFor();await shot('15-fila-vazia','Resposta vazia induzida apenas para referência visual.');await page.unroute('**/api/technician/queue*');
  await page.route('**/api/technician/queue*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'TESTE LOCAL · Serviço temporariamente indisponível.'})}));
  await page.reload();await page.getByRole('heading',{name:'Acesso técnico'}).waitFor();await shot('16-erro-de-consulta','503 induzido, sem simular sucesso de gravação.');await page.unroute('**/api/technician/queue*');
  assert.deepEqual(h.errors,[]);
  fs.writeFileSync(path.join(base,'capturas.json'),JSON.stringify({generatedAt:new Date().toISOString(),localOnly:true,androidPhysical:false,screenshots:manifest,pageErrors:h.errors},null,2)+'\n');
  console.log(JSON.stringify({ok:true,captures:manifest.length,output:base,realWorker:true,database:'SQLite :memory:',productionWrites:0,androidPhysical:false}));
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
