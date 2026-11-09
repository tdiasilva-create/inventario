const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{f,page,origin,env,errors}=h;
 const {seedLinkStates}=await import('./helpers/equipment-link-state.mjs'),s=seedLinkStates(f);
 const out='docs/05-qualidade/evidencias/vinculos-agentes-2026-11-09';fs.mkdirSync(out,{recursive:true});
 const shot=name=>page.screenshot({path:out+'/'+name+'.png',fullPage:false});
 const states=['linked','manual','pending','ended','unknown'];
 try{
  env.PHOTOS={get:async()=>({body:fs.readFileSync('tests/fixtures/thumbnail-test.jpg')})};
  for(let i=0;i<5;i++)f.sqlite.prepare('UPDATE equipments SET position_label=? WHERE id=?').run('PC 0'+(i+1),s.items[i].id);
  for(let i=5;i<s.items.length;i++)f.sqlite.prepare('UPDATE equipments SET position_label=? WHERE id=?').run('Posição '+(i+1),s.items[i].id);
  await page.setViewportSize({width:1440,height:1000});await page.goto(origin+'/computadores?unidade='+s.unit);
  await page.locator('.ops-machine[data-id="'+s.items[0].id+'"] [data-link-state=linked]').waitFor();
  for(const state of states)await page.locator('.ops-machine [data-link-state='+state+']').first().waitFor();
  assert.match(await page.locator('.ops-machine[data-id="'+s.items[0].id+'"]').textContent(),/Sem comunicação recente/);
  assert.match(await page.locator('.ops-machine[data-id="'+s.items[0].id+'"]').getAttribute('title'),/TESTE-PC-001[\s\S]*Agente vinculado/);
  await shot('01-computadores-vinculo-separado');
  for(const state of states){await page.locator('select[name=link]').selectOption(state);await page.waitForFunction(st=>{const cards=[...document.querySelectorAll('.ops-machine')];return cards.length>0&&cards.every(c=>c.querySelector('.equipment-link-badge')?.dataset.linkState===st);},state);}
  await page.locator('select[name=link]').selectOption('linked');await page.locator('.ops-machine[data-id="'+s.items[0].id+'"]').click();await page.locator('.ops-dialog [data-link-state=linked]').waitFor();assert.match(await page.locator('.ops-dialog').textContent(),/Sem comunicação recente/);await shot('02-ficha-vinculada');await page.locator('.ops-dialog [data-op=close]').click();
  await page.goto(origin+'/equipamentos');await page.locator('.matrix [data-action=select-unit][data-unit="'+s.unit+'"]').click();await page.locator('.eq-row [data-link-state=linked]').waitFor();
  for(const state of states)await page.locator('.eq-row [data-link-state='+state+']').first().waitFor();
  await page.locator('.eq-row[data-equipment-id="'+s.items[0].id+'"] h4 button').click();await page.locator('.eq-detail [data-link-state=linked]').waitFor();await page.locator('.eq-detail').getByText('Vínculo e comunicação',{exact:true}).waitFor();await shot('03-consulta-e-ficha');
  // A link closed in another session changes the badge on the existing monitoring refresh.
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id=?').run(new Date().toISOString(),s.device);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('semed:monitoring',{detail:{statuses:[]}})));
  await page.locator('.eq-detail [data-link-state=ended]').waitFor();
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=NULL WHERE device_id=?').run(s.device);
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('semed:monitoring',{detail:{statuses:[]}})));
  await page.locator('.eq-detail [data-link-state=linked]').waitFor();
  await page.locator('[data-eq-action=close-detail]').click();
  for(const state of states){await page.locator('.eq-filters select[name=agent]').selectOption(state);await page.locator('.eq-filters button[type=submit]').click();await page.waitForFunction(st=>{const items=[...document.querySelectorAll('.eq-row')];return items.length>0&&items.every(i=>i.querySelector('.equipment-link-badge')?.dataset.linkState===st);},state);}
  await page.locator('.eq-filters select[name=agent]').selectOption('manual');await page.locator('.eq-filters button[type=submit]').click();await page.locator('.eq-row[data-equipment-id="'+s.items[1].id+'"] h4 button').click();await page.locator('.eq-detail [data-link-state=manual]').waitFor();await page.locator('.eq-gallery img').waitFor();await page.locator('.eq-gallery img').scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.querySelectorAll('.eq-gallery img')].every(i=>i.complete&&i.naturalWidth>0));await shot('04-manual-foto-preservada');
  const open=crypto.randomUUID(),now=Date.now();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(open,s.unit,f.root.id,now,now);for(let i=0;i<5;i++)f.sqlite.prepare('UPDATE equipments SET inspection_id=? WHERE id=?').run(open,s.items[i].id);
  await page.goto(origin+'/coletas-em-andamento?vistoria='+open);for(const state of states)await page.locator('.inventory-items [data-link-state='+state+']').waitFor();await page.locator('.inventory-items').scrollIntoViewIfNeeded();await shot('05-parciais');
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);
  await page.goto(origin+'/computadores?unidade='+s.unit);await page.locator('.ops-machine [data-link-state=linked]').first().waitFor();await page.locator('.ops-machine[data-id="'+s.items[0].id+'"]').click();assert.equal(await page.locator('[data-op=delete-machine]').count(),0);assert.equal(await page.locator('[data-op=rename-machine]').count(),0);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM equipment_deletions').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_equipment_links WHERE ended_at IS NULL').get().n,1);assert.deepEqual(errors,[]);
  const result={passed:true,states,filters:true,linkedWithoutContact:true,photos:true,partial:true,viewer:true,productionWrites:false};fs.writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
