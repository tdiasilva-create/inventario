const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{f,page,origin,env,errors}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),s=seedEquipmentConsultation(f);
 const out='docs/05-qualidade/evidencias/editar-equipamentos-2026-11-09';fs.mkdirSync(out,{recursive:true});
 const shot=name=>page.screenshot({path:out+'/'+name+'.png',fullPage:false});
 const modal=()=>page.locator('.equipment-name-editor[open]');
 const save=()=>modal().getByRole('button',{name:'Salvar nome',exact:true}).click();
 const openItem=async(id,query=id)=>{await page.goto(origin+'/equipamentos');await page.locator('.matrix [data-action="select-unit"][data-unit="'+s.unit+'"]').click();await page.locator('.eq-filters [name=q]').fill(query);await page.locator('.eq-filters button[type=submit]').click();await page.locator('[data-equipment-id="'+id+'"] h4 button').click();await page.locator('.eq-detail [data-eq-action=rename]').waitFor();};
 const openRename=async()=>{await page.locator('.eq-detail [data-eq-action=rename]').click();await modal().waitFor();};
 const input=()=>modal().locator('input[name=name]');
 try{
  env.PHOTOS={get:async()=>({body:fs.readFileSync('tests/fixtures/thumbnail-test.jpg')})};s.photo(s.printer);
  await page.setViewportSize({width:1440,height:950});await openItem(s.items[0].id);await openRename();await input().fill('Nome cancelado');await modal().getByRole('button',{name:'Cancelar',exact:true}).click();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_names').get().n,0);
  await openRename();await input().fill('Computador 05 · TESTE ISOLADO');await shot('01-editar-computador');await save();await page.waitForFunction(()=>document.querySelector('[data-eq-detail-title]')?.textContent==='Computador 05 · TESTE ISOLADO');
  assert.match(await page.locator('.eq-detail').textContent(),/Hostname informado pelo agente: TESTE-PC-001/);await page.locator('.eq-gallery img').waitFor();await page.locator('.eq-gallery img').scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.eq-gallery img')].every(img=>img.complete&&img.naturalWidth>0));assert.equal(await page.locator('.eq-gallery img').count(),1);await shot('02-computador-fotos-vinculo');
  // A second authenticated tab changes the name while the first edit remains open.
  await openRename();await input().fill('Minha correção preservada');
  const concurrent=await page.evaluate(async ({id,unitId})=>{const me=await(await fetch('/api/auth/me')).json();const r=await fetch('/api/root/equipment-name',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':me.csrf},body:JSON.stringify({id,unitId,version:1,name:'Nome da outra sessão',operationId:crypto.randomUUID()})});return r.status;},{id:s.items[0].id,unitId:s.unit});assert.equal(concurrent,200);
  await save();await modal().locator('[data-current]').waitFor();assert.equal(await input().inputValue(),'Minha correção preservada');await shot('03-conflito');await modal().locator('[data-current]').click();assert.equal(await input().inputValue(),'Nome da outra sessão');await input().fill('Computador 05 · TESTE ISOLADO');
  // Server commits; response is deliberately lost. Retry must keep the same UUID.
  let lose=true;await page.route('**/api/root/equipment-name',async route=>{if(lose&&route.request().method()==='POST'){lose=false;const r=await route.fetch();assert.equal(r.status(),200);await route.abort();}else await route.continue();});
  await save();await modal().locator('[role=alert]').waitFor();assert.equal(await input().inputValue(),'Computador 05 · TESTE ISOLADO');const count=f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_name_events').get().n;await save();await modal().waitFor({state:'detached'});assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_name_events').get().n,count);await page.unroute('**/api/root/equipment-name');
  await page.reload();await openItem(s.items[0].id,'Computador 05');assert.equal(await page.locator('[data-eq-detail-title]').textContent(),'Computador 05 · TESTE ISOLADO');
  await openItem(s.printer);await openRename();await input().fill('Impressora da secretaria · TESTE ISOLADO');await save();await page.waitForFunction(()=>document.querySelector('[data-eq-detail-title]')?.textContent.includes('Impressora da secretaria'));await page.locator('.eq-gallery img').waitFor();await page.locator('.eq-gallery img').scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.eq-gallery img')].every(img=>img.complete&&img.naturalWidth>0));assert.equal(await page.locator('.eq-gallery img').count(),1);await shot('04-impressora-com-foto');
  await page.goto(origin+'/computadores?unidade='+s.unit);const machine=page.locator('.ops-machine[data-id="'+s.items[0].id+'"]');await machine.waitFor();assert.match(await machine.getAttribute('title'),/Computador 05/);assert.match(await machine.getAttribute('title'),/TESTE-PC-001/);await machine.click();await page.locator('[data-op=rename-machine]').click();await modal().waitFor();assert.equal(await input().inputValue(),'Computador 05 · TESTE ISOLADO');await input().fill('Computador 05 · Laboratório teste');await save();await page.locator('.ops-dialog h2').filter({hasText:'Computador 05 · Laboratório teste'}).waitFor();await shot('05-computadores-por-unidade');await page.locator('.ops-dialog [data-op=close]').click();
  // An unfinished printer can be renamed without completing/publishing a visit.
  const open=crypto.randomUUID();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(open,s.unit,f.root.id,Date.now(),Date.now());
  f.sqlite.prepare('UPDATE equipments SET inspection_id=? WHERE id=?').run(open,s.printer);
  await page.goto(origin+'/coletas-em-andamento?vistoria='+open);await page.locator('[data-progress=rename-equipment][data-id="'+s.printer+'"]').click();await input().fill('Impressora corrigida na parcial');await save();await page.locator('.inventory-items strong').filter({hasText:'Impressora corrigida na parcial'}).waitFor();assert.equal(f.sqlite.prepare('SELECT state FROM inspections WHERE id=?').get(open).state,'open');await shot('06-coleta-em-andamento');
  // Renaming never changed the agent link and IDs/photo references remain the same.
  assert.equal(f.sqlite.prepare('SELECT equipment_id FROM agent_equipment_links WHERE device_id=? AND ended_at IS NULL').get(s.device).equipment_id,s.items[0].id);
  assert.equal(f.sqlite.prepare('SELECT target_id FROM collection_photos WHERE id=?').get(s.firstPhoto).target_id,s.items[0].id);
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);
  await page.goto(origin+'/equipamentos');await page.locator('.matrix [data-action="select-unit"][data-unit="'+s.unit+'"]').click();await page.locator('[data-equipment-id="'+s.items[0].id+'"] h4 button').click();assert.equal(await page.locator('[data-eq-action=rename]').count(),0);
  assert.deepEqual(errors,[]);const result={passed:true,cancel:true,computer:true,printer:true,photos:true,agent:true,concurrency:true,lostResponse:true,partial:true,readOnly:true};fs.writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
