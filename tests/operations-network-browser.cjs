// Visão "toda a rede" por estado de comunicação (10/11/2026): pulso e ribbon de Computadores
// levam à lista dos computadores naquele estado, agrupada por unidade, com ficha e demanda a partir dela.
// Dados sintéticos em SQLite isolado; nunca produção. Executar: node tests/operations-network-browser.cjs
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,errors}=h,{seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs');
 const seed=seedEquipmentConsultation(f);
 const device=(equipmentId,contactAgo,reason)=>{const id=crypto.randomUUID(),iso=new Date().toISOString(),contact=new Date(Date.now()-contactAgo).toISOString();
  f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(id,iso);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at,device_confirmed_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),id,equipmentId,seed.visit,f.root.id,iso,iso);
  f.sqlite.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(id,JSON.stringify({last_live_contact_at:contact,last_reason_at:reason?new Date(Date.now()-contactAgo+1000).toISOString():contact,last_reason:reason||'periodic'}),iso);};
 device(seed.items[1].id,60000);device(seed.items[2].id,7200000);device(seed.items[3].id,5400000);device(seed.items[4].id,120000,'shutdown');
 const output=process.env.SEMED_EVIDENCE_DIR||'docs/05-qualidade/evidencias/tour-logica-2026-11-10';fs.mkdirSync(output,{recursive:true});
 const shot=async name=>{await page.evaluate(()=>{const b=document.createElement('div');b.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;text-align:center;padding:5px;font:12px sans-serif;pointer-events:none';b.className='test-label';document.querySelectorAll('.test-label').forEach(n=>n.remove());document.body.append(b);});await page.screenshot({path:output+'/'+name+'.png'});};
 f.sqlite.prepare('UPDATE equipments SET unit_id=? WHERE id=?').run(f.ids.progress,seed.items[3].id);
 try{
  await page.goto(origin+'/panorama');await page.waitForFunction(()=>document.querySelector('#panel-pulse')?.dataset.state==='ok');
  const units=await (await fetch(origin+'/api/operations/units')).json(),sum=units.units.reduce((c,u)=>{c.online+=u.online;c.lost+=u.lost;c.unlinked+=u.unlinked;c.other+=u.other;c.computers+=u.computers;return c;},{online:0,lost:0,unlinked:0,other:0,computers:0});
  assert.equal(sum.online,2);assert.equal(sum.lost,2);assert.equal(sum.other,1);
  const pulse=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.pulse-item')].map(p=>[p.querySelector('small')?.textContent.trim(),{value:p.querySelector('b')?.textContent.trim(),href:p.querySelector('a')?.getAttribute('href')}])));
  assert.equal(pulse['Sem comunicação'].value,String(sum.lost));assert.equal(pulse['Sem comunicação'].href,'/computadores?estado=sem-comunicacao');assert.equal(pulse['Comunicando'].href,'/computadores?estado=comunicando');
  await page.mouse.move(900,600);await page.locator('.pulse-item a:has-text("Sem comunicação")').click();await page.waitForURL(/estado=sem-comunicacao/);await page.locator('#ops-body .ops-machine').first().waitFor();
  assert.match(await page.locator('#ops-body h2').first().textContent(),/sem comunicação recente/i);
  const states=await page.evaluate(()=>[...document.querySelectorAll('#ops-body .ops-machine')].map(b=>b.dataset.state));assert.equal(states.length,sum.lost);assert.ok(states.every(s=>s==='no_recent_communication'));
  assert.equal(await page.locator('#ops-stats [aria-pressed=true][data-state=lost]').count(),1,'ribbon marca o estado ativo');
  assert.equal(await page.locator('#ops-body .ops-room').count(),2);await shot('rede-sem-comunicacao');
  await page.locator('#ops-body .ops-machine').first().click();await page.locator('.ops-dialog').waitFor();assert.match(await page.locator('.ops-dialog .ops-details').textContent(),/Sem comunicação recente/);await page.locator('.ops-dialog [data-op=close]').click();
  await page.locator('#ops-stats [data-op=net][data-state=online]').click();await page.waitForURL(/estado=comunicando/);await page.waitForFunction(n=>document.querySelectorAll('#ops-body .ops-machine[data-state^=communicating]').length===n&&document.querySelectorAll('#ops-body .ops-machine').length===n,sum.online);
  await shot('rede-comunicando');
  const stats=await page.evaluate(()=>[...document.querySelectorAll('#ops-stats .ops-stat strong')].map(s=>Number(s.textContent)));assert.equal(stats.length,5);assert.equal(stats[0],stats[1]+stats[2]+stats[3]+stats[4],'cadastrados = soma dos quatro estados');
  await page.locator('#ops-body [data-op=net][data-state=""]').click();await page.waitForURL(/unidade=/);await page.locator('#ops-body .ops-header h2').waitFor();assert.doesNotMatch(await page.locator('#ops-body h2').first().textContent(),/toda a rede/i);
  // sem unitId e sem presence continua recusado
  const r=await fetch(origin+'/api/operations/computers');assert.equal(r.status,400);
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);await page.goto(origin+'/computadores?estado=sem-comunicacao');await page.locator('#ops-body .ops-machine').first().click();await page.locator('.ops-dialog').waitFor();assert.equal(await page.locator('.ops-dialog [data-op=machine-request], .ops-dialog [data-op=delete-machine]').count(),0);await page.locator('.ops-dialog [data-op=close]').click();await page.setViewportSize({width:390,height:844});await shot('rede-mobile-visualizador');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,pulseLinks:true,networkList:true,ribbonButtons:true,sumMatches:true,backToUnit:true}));
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
