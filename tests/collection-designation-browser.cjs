// Local real Worker + synthetic SQLite. No official demands or notifications.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const out='docs/05-qualidade/evidencias/designar-coleta-d128-2026-11-17';fs.mkdirSync(out,{recursive:true});
 f.sqlite.prepare("UPDATE units SET name='TESTE · Escola Árvore' WHERE id=?").run(f.ids.pending);
 f.sqlite.prepare('INSERT INTO dispatch_technicians VALUES(?,1,?,?)').run(f.operator.id,Date.now(),f.root.id);
 const list=page.locator('.unit-agent-dialog'),form=page.locator('.collection-designation-dialog');
 const open=async query=>{await page.locator('[data-unit-agent-group=unlinked]').click();await list.getByRole('searchbox').fill(query);await list.getByRole('button',{name:/^Designar coleta ·/}).click();await form.getByLabel('Técnico responsável').waitFor();};
 const closeForm=async()=>{await form.getByRole('button',{name:'Fechar',exact:true}).click();await form.waitFor({state:'detached'});};
 const waitText=async(locator,text)=>{await locator.getByText(text,{exact:false}).first().waitFor();};
 const capture=async name=>{await page.evaluate(()=>{let n=document.getElementById('test-label');if(!n){n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Dados sintéticos';n.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#171a1c;color:white;z-index:99999;text-align:center;font:12px sans-serif';document.body.append(n);}});await page.screenshot({path:out+'/'+name+'.png'});};
 const reads=()=>h.requests.filter(r=>r.path==='/api/dispatch/collection-tasks').length;
 try{
  await page.goto(origin+'/panorama');await page.locator('[data-unit-agent-group=unlinked]:not(:disabled)').waitFor();assert.equal(reads(),0,'entrada no Panorama não consulta designações');
  await open('arvore');assert.equal(reads(),1);assert.equal(await form.locator('select option').count(),2);
  await form.getByLabel('Técnico responsável').selectOption(f.operator.id);await form.getByLabel('Orientação para a visita').fill('TESTE · instalar e vincular agentes na secretaria.');await capture('01-designar-desktop');
  // Lost HTTP response after server commit must be retried using the same operation.
  let drop=true;await page.route('**/api/dispatch/collection-designate',async route=>{if(drop){drop=false;await route.fetch();await route.abort('failed');}else await route.continue();});
  await form.getByRole('button',{name:'Criar demanda e designar'}).click();await waitText(form,'Tente novamente para conferir o mesmo envio');
  assert.equal(await form.getByLabel('Técnico responsável').isDisabled(),true);
  await form.getByRole('button',{name:'Conferir envio / tentar novamente'}).click();await waitText(form,'Demanda #1 confirmada');await closeForm();
  await waitText(list,'Coleta designada — Operador');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_notifications').get().n,1);
  assert.equal(reads(),2,'somente abertura e atualização após sucesso');await capture('02-designada-desktop');
  const before=reads();await list.getByRole('searchbox').fill('ar');await list.getByRole('searchbox').fill('ÁRVORE');assert.equal(reads(),before,'busca local');
  await page.clock.install();await page.clock.fastForward(61000);assert.equal(reads(),before,'nenhum polling de designações');
  await page.setViewportSize({width:390,height:844});await capture('03-designada-390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await list.getByRole('searchbox').fill('preenchimento');await list.getByRole('button',{name:/^Designar coleta ·/}).click();await form.getByLabel('Técnico responsável').waitFor();await capture('04-formulario-390');
  assert.equal(await form.evaluate(n=>n.getBoundingClientRect().left>=0&&n.getBoundingClientRect().right<=innerWidth),true);await page.keyboard.press('Escape');await form.waitFor({state:'detached'});assert.equal(await list.isVisible(),true);
  await list.getByRole('searchbox').fill('arvore');await list.getByRole('link',{name:'Ver demanda #1'}).click();await page.waitForURL('**/demandas?demanda=*');await waitText(page.locator('body'),'Realizar coleta de inventário');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_attendances').get().n,0,'designar não aceita nem inicia GPS');
  // No eligible technician and explicit query failure remain actionable, with no extra writes.
  f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=0').run();await page.goto(origin+'/panorama');await page.locator('[data-unit-agent-group=unlinked]:not(:disabled)').waitFor();await page.locator('[data-unit-agent-group=unlinked]').click();await list.getByRole('searchbox').fill('preenchimento');await list.getByRole('button',{name:/^Designar coleta ·/}).click();await waitText(form,'Não há técnico habilitado');await closeForm();
  await page.route('**/api/dispatch/collection-tasks?*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'TESTE · indisponibilidade'})}));await list.getByRole('button',{name:'Atualizar designações',exact:true}).click();await waitText(list,'Designações indisponíveis');await list.getByRole('button',{name:/^Verificar designação ·/}).click();await waitText(form,'Não há técnico habilitado');await closeForm();
  await page.unroute('**/api/dispatch/collection-tasks?*');await list.getByRole('button',{name:'Fechar',exact:true}).click();
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);await page.reload();await page.locator('[data-unit-agent-group=unlinked]:not(:disabled)').waitFor();const viewerReads=reads();await page.locator('[data-unit-agent-group=unlinked]').click();assert.equal(await list.getByRole('button',{name:/Designar coleta|Atualizar designações/}).count(),0);assert.equal(reads(),viewerReads);
  assert.deepEqual(h.errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,scope:'LOCAL ISOLADO',noPolling:true,lostAckReplayed:true,roleRestricted:true,errors:h.errors},null,2));console.log('D128 navegador PASS: designação, ACK perdido, responsável, consulta explícita, falhas, permissões, 390px e nenhuma ativação de GPS.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
