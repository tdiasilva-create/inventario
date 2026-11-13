// Worker real e SQLite em memória. Nenhum dado/parecer criado na produção.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,f,env,origin,errors}=h;
 const {hardwareChange}=await import('./helpers/hardware-change.mjs'),s=await hardwareChange(f,env);
 f.sqlite.prepare("UPDATE units SET unit_type='Unidade administrativa' WHERE id=?").run(f.ids.blocked);
 const out='docs/05-qualidade/evidencias/indicadores-pendencias-2026-11-10';fs.mkdirSync(out,{recursive:true});
 const counts=async expected=>page.waitForFunction(a=>['demands','hardware'].every((k,i)=>document.querySelector('[data-pending-value='+k+']')?.textContent===String(a[i+1])),expected);
 const refresh=()=>page.evaluate(()=>{const button=document.querySelector('[data-pending-refresh]');if(button)button.click();else window.dispatchEvent(new Event('semed:pending-refresh'));});
 const shot=async name=>{await page.mouse.move(Math.round(page.viewportSize().width*.8),100);await page.clock.runFor(400);await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>{if(!document.getElementById('test-label')){const b=document.createElement('div');b.id='test-label';b.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;text-align:center;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(b);}});await page.screenshot({path:out+'/'+name+'.png',fullPage:true});};
 try{
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');await counts([3,0,1]);
  await page.locator('#municipal-map[data-map-ready=true]').waitFor();assert.equal(await page.locator('dialog[open]').count(),0,'nenhum modal automático');
  assert.equal(await page.locator('.inventory-stats .metric').count(),2);assert.equal(await page.locator('.pending-metric').count(),2);
  await page.locator('[data-filter=type]').selectOption('Unidade administrativa');await counts([3,0,1]);assert.match(await page.locator('[data-pending-summary]').textContent(),/toda a rede/);await page.locator('[data-filter=type]').selectOption('Todas');
  await shot('panorama-tres-indicadores');
  await page.locator('.pending-metric[data-pending-hardware]').click();await page.locator('[data-hardware-id]').waitFor();assert.match(await page.locator('.hardware-dialog').innerText(),/16 GiB|32 GiB/);await shot('hardware-aguardando-parecer');
  await page.locator('[data-decision=demand]').click();await counts([3,1,0]);await page.getByText('Nenhuma alteração de hardware aguardando parecer.',{exact:true}).waitFor();
  await page.locator('.hardware-dialog [data-close]').click();
  // Contagem de demanda acompanha avanço de atendimento e conclusão por outro administrador.
  f.sqlite.prepare("UPDATE service_requests SET status='Em atendimento'").run();await page.clock.fastForward(15000);await counts([3,1,0]);
  f.sqlite.prepare("UPDATE service_requests SET status='Concluída'").run();await page.clock.fastForward(15000);await counts([3,0,0]);
  // Uma revisita aumenta só a fila de coleta, sem alterar métricas oficialmente publicadas.
  const visit=crypto.randomUUID();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(visit,s.unit,f.root.id,Date.now(),Date.now());await page.clock.fastForward(15000);await counts([4,0,0]);
  await s.change(68719476736,3000);await refresh();await counts([4,0,1]);await page.locator('.pending-metric[data-pending-hardware]').click();await page.locator('[data-decision=accepted]').click();await counts([4,0,0]);await page.locator('.hardware-dialog [data-close]').click();
  // Falha do resumo não apaga presença do agente e não vira contagem zero.
  await page.route('**/api/inventory/panel-status?*',r=>r.fulfill({status:503,body:'{}'}));await refresh();await counts(['—','—','—']);await page.locator('[data-pending-error]:visible').waitFor();await shot('falha-explicita');
  assert.equal(await page.locator('#panel-pulse').getAttribute('data-state'),'ok');await page.unroute('**/api/inventory/panel-status?*');await page.locator('[data-pending-refresh]').click();await counts([4,0,0]);
  // Atalho mostra a mesma lista inclusive unidades sem visita; filtro, rota e retorno.
  await page.goto(origin+'/coletas-pendentes');await page.locator('#pending-results tbody tr').first().waitFor();assert.equal(await page.locator('#pending-results tbody tr').count(),4);
  await page.locator('#pending-filter [name=state]').selectOption('in_progress');await page.locator('#pending-filter button').click();await page.waitForFunction(()=>document.querySelectorAll('#pending-results tbody tr').length===2);
  await shot('coletas-pendentes');await page.locator('#pending-results a[href*="vistoria="]').first().click();await page.waitForURL('**/coletas-em-andamento?vistoria=*');
  await page.goBack();await page.locator('#pending-results tbody tr').first().waitFor();assert.equal(await page.locator('#pending-filter [name=state]').inputValue(),'in_progress');
  // Falha da lista mantém histórico visível com aviso; não gera novas visitas.
  await page.route('**/api/inventory/pending-collections?*',r=>r.fulfill({status:503,body:'{}'}));await page.locator('[data-collection-refresh]').first().click();await page.locator('#pending-error:visible').waitFor();assert.match(await page.locator('#pending-status').innerText(),/desatualizados/);await page.unroute('**/api/inventory/pending-collections?*');await page.locator('[data-collection-refresh]').first().click();await page.locator('#pending-error').waitFor({state:'hidden'});
  await page.goto(origin+'/panorama');await counts([4,0,0]);await page.locator('.pending-metric[href="/demandas"]').click();await page.waitForURL('**/demandas');
  await page.goto(origin+'/panorama');await counts([4,0,0]);await page.setViewportSize({width:390,height:844});await shot('panorama-390');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Visualizador vê as filas, mas não ganha botões de parecer.
  await s.change(137438953472,5000);f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);await page.reload();await counts([4,0,1]);await page.locator('.pending-metric[data-pending-hardware]').click();await page.locator('[data-hardware-id]').waitFor();assert.equal(await page.locator('[data-decision]').count(),0);await page.locator('.hardware-dialog [data-close]').click();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,separateCounts:true,networkScope:true,automatic15s:true,acceptAndForward:true,readOnlyList:true,revisit:true,failuresAndRecovery:true,mobile:true,viewer:true,productionWrites:false}));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
