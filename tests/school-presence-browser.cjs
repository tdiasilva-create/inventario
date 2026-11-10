// Worker real + SQLite isolado. Nenhuma gravação em produção.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),s=seedEquipmentConsultation(f);
 const out='docs/05-qualidade/evidencias/escolas-online-2026-11-10';fs.mkdirSync(out,{recursive:true});
 const now=new Date().toISOString();
 const setPresence=(id,ago=0,reason='periodic')=>{const at=new Date(Date.now()-ago).toISOString();f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:at,last_reason:reason,last_reason_at:at}),id);};
 const link=(equipmentId,unitId)=>{
  const room=crypto.randomUUID();f.sqlite.prepare('INSERT INTO environments(id,unit_id,name,type,created_at,created_by) VALUES(?,?,?,?,?,?)').run(room,unitId,'TESTE · Sala','Sala',Date.now(),f.root.id);
  f.sqlite.prepare('UPDATE equipments SET unit_id=?,environment_id=? WHERE id=?').run(unitId,room,equipmentId);
  const id=crypto.randomUUID();f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(id,now);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,inspection_id,linked_by,linked_at,device_confirmed_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),id,equipmentId,s.visit,f.root.id,now,now);
  f.sqlite.prepare('INSERT INTO agent_presence(device_id,data_json,updated_at) VALUES(?,?,?)').run(id,'{}',now);setPresence(id);return id;
 };
 for(const [key,type]of [['pending','Escola municipal'],['progress','Creche municipal'],['blocked','Unidade administrativa'],['assigned','Escola municipal militar'],['inactive','Escola municipal']])f.sqlite.prepare('UPDATE units SET unit_type=?,latitude=?,longitude=? WHERE id=?').run(type,-2.54-Object.keys(f.ids).indexOf(key)*.01,-44.17,f.ids[key]);
 const second=link(s.items[1].id,s.unit),creche=link(s.items[2].id,f.ids.progress);
 link(s.items[3].id,f.ids.blocked);link(s.items[4].id,f.ids.inactive);
 let reads=0;page.on('request',r=>{if(new URL(r.url()).pathname==='/api/operations/units')reads++;});
 const metric=()=>page.locator('[data-schools-online] strong');
 const expect=async value=>page.waitForFunction(v=>document.querySelector('[data-schools-online] strong')?.textContent===v,String(value));
 const refresh=()=>page.evaluate(async()=>{(await import('/panel-pulse.js')).startPulse({role:'root'});});
 const shot=async name=>{await page.evaluate(()=>{let b=document.getElementById('test-label');if(!b){b=document.createElement('div');b.id='test-label';b.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;text-align:center;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(b);}});await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');await expect(2);
  await page.locator('#municipal-map[data-map-ready=true]').waitFor();assert.equal(reads,1,'indicador compartilha consulta do pulso');
  assert.equal(await page.locator('[data-result-working]').count(),0);assert.match(await page.locator('[data-schools-online]').innerText(),/Escolas onlines/);
  assert.match(await page.locator('[data-schools-online]').getAttribute('title'),/17 minutos/);
  const markerColors=await page.locator('#municipal-map path[data-hardware-state=none]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('fill').toUpperCase()));
  assert.equal(markerColors.length,4,'mapa inclui apenas unidades ativas do catálogo');assert.deepEqual(markerColors.sort(),['#7523C9','#DB2777','#DC2626','#EAB308'].sort());await page.clock.runFor(2000);await shot('panorama-roxo-escolas-online');
  const map=await page.locator('#municipal-map').elementHandle();
  await page.locator('[data-filter=type]').selectOption('Unidade administrativa');await expect(0);assert.equal(reads,1);
  await page.locator('[data-filter=type]').selectOption('Creche municipal');await expect(1);
  await page.locator('[data-filter=type]').selectOption('Todas');await expect(2);
  // Uma escola com dois PCs segue online quando um perde comunicação.
  setPresence(s.device,18*60000);await refresh();await expect(2);
  // Perda do último PC da escola: atualização automática de 60 s, sem remontar mapa.
  setPresence(second,18*60000);const before=reads;await page.clock.fastForward(61000);await expect(1);assert.equal(reads,before+1);
  assert.equal(await map.evaluate(n=>n===document.querySelector('#municipal-map')),true);
  setPresence(second);await refresh();await expect(2);
  setPresence(creche,0,'shutdown');await refresh();await expect(1);setPresence(creche);await refresh();await expect(2);
  // Erro de outra seção não invalida comunicação recebida; erro de presença nunca vira zero.
  await page.route('**/api/inventory/pending-summary',r=>r.fulfill({status:503,body:'{}'}));await page.evaluate(async()=>{await (await import('/desktop-demand-count.js')).refreshPendingIndicators();});await refresh();await page.locator('#panel-pulse[data-state=ok]').waitFor();await expect(2);await page.unroute('**/api/inventory/pending-summary');
  await page.route('**/api/operations/units',r=>r.fulfill({status:503,body:'{}'}));await refresh();await expect('—');assert.match(await page.locator('[data-schools-online]').innerText(),/indisponível/);await shot('falha-consulta');
  await page.unroute('**/api/operations/units');await refresh();await expect(2);
  await page.setViewportSize({width:390,height:844});await shot('panorama-390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);await page.reload();await expect(2);
  assert.deepEqual(h.errors,[]);console.log(JSON.stringify({passed:true,uniqueSchools:true,filters:true,categoryMarkers:true,lossReturn:true,sharedPolling:true,failureRecovery:true,viewer:true,mobile:true}));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
