// Worker real, SQLite isolated; no official requests or writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),s=seedEquipmentConsultation(f);
 const out='docs/05-qualidade/evidencias/vinculos-panorama-d127-2026-11-16';fs.mkdirSync(out,{recursive:true});
 const now=new Date().toISOString();
 for(const [key,name,type]of [['pending','TESTE · Escola Árvore','Escola municipal'],['blocked','TESTE · Sede administrativa','Unidade administrativa'],['progress','TESTE · Escola sem coleta','Escola municipal'],['assigned','TESTE · Outra escola','Escola municipal']])f.sqlite.prepare('UPDATE units SET name=?,unit_type=? WHERE id=?').run(name,type,f.ids[key]);
 const link=(equipmentId,unitId)=>{
  f.sqlite.prepare('UPDATE equipments SET unit_id=? WHERE id=?').run(unitId,equipmentId);
  const device=crypto.randomUUID();f.sqlite.prepare("INSERT INTO agent_devices VALUES(?,'linked',?,NULL,NULL,NULL)").run(device,now);
  f.sqlite.prepare('INSERT INTO agent_equipment_links(link_id,device_id,equipment_id,linked_by,linked_at) VALUES(?,?,?,?,?)').run(crypto.randomUUID(),device,equipmentId,f.root.id,now);return device;
 };
 const second=link(s.items[1].id,s.unit),admin=link(s.items[2].id,f.ids.blocked);
 f.sqlite.prepare("UPDATE agent_presence SET data_json='{}' WHERE device_id=?").run(s.device);
 const button=state=>page.locator('[data-unit-agent-group='+state+']'),dialog=page.locator('.unit-agent-dialog');
 const count=async(state,n)=>page.waitForFunction(({state,n})=>document.querySelector('[data-unit-agent-group='+state+'] strong')?.textContent===String(n),{state,n});
 const refresh=async()=>page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 const close=async()=>{await dialog.getByRole('button',{name:'Fechar',exact:true}).click();await dialog.waitFor({state:'detached'});};
 const query=()=>dialog.getByRole('searchbox',{name:'Buscar unidade por nome'});
 const screenshot=async name=>{await page.evaluate(()=>{let n=document.getElementById('test-label');if(!n){n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Dados sintéticos';n.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#171a1c;color:white;z-index:99999;text-align:center;font:12px sans-serif';document.body.append(n);}});await page.screenshot({path:out+'/'+name+'.png'});};
 let reads=0;page.on('request',r=>{if(new URL(r.url()).pathname==='/api/operations/units')reads++;});
 try{
  await page.clock.install({time:Date.now()});await page.goto(origin+'/panorama');await count('linked',2);await count('unlinked',2);
  assert.equal(reads,1);await button('linked').scrollIntoViewIfNeeded();await screenshot('01-botoes');
  await button('linked').click();assert.equal(await dialog.locator('li').count(),2);assert.match(await dialog.innerText(),/2 computador\(es\) com agente vinculado/);await query().fill('arvore');assert.equal(await dialog.locator('li').count(),1);assert.equal(await dialog.locator('a').getAttribute('href'),'/unidade?id='+s.unit);assert.equal(reads,1,'abrir e digitar não consultam D1');await screenshot('02-lista-busca');
  await query().fill('ausente');assert.match(await dialog.innerText(),/Nenhuma unidade encontrada/);await query().fill('ÁRVORE');
  const before=reads;await page.clock.fastForward(61000);await count('linked',2);assert.equal(reads,before+1,'somente a leitura de frota já existente');assert.equal(await query().inputValue(),'ÁRVORE');assert.equal(await dialog.locator('li').count(),1);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(await button('linked').evaluate(n=>n===document.activeElement),true);
  await page.locator('[data-filter=type]').selectOption('Unidade administrativa');await count('linked',1);await count('unlinked',0);const noFilterReads=reads;await button('unlinked').click();assert.match(await dialog.innerText(),/Nenhuma unidade neste grupo/);await close();assert.equal(reads,noFilterReads);
  await page.locator('[data-filter=type]').selectOption('Todas');await count('linked',2);
  await button('linked').click();await query().fill('arvore');
  f.sqlite.prepare('UPDATE agent_equipment_links SET ended_at=? WHERE device_id IN (?,?)').run(now,s.device,second);
  await refresh();await count('linked',1);await count('unlinked',3);assert.match(await dialog.innerText(),/Nenhuma unidade encontrada/);await close();
  await button('unlinked').click();await query().fill('arvore');assert.equal(await dialog.locator('li').count(),1);
  await page.route('**/api/operations/units',r=>r.fulfill({status:503,body:'{}'}));await refresh();await count('linked','—');await count('unlinked','—');assert.equal(await button('linked').isDisabled(),true);assert.equal(await dialog.locator('li').count(),0);assert.match(await dialog.innerText(),/Lista indisponível/);assert.equal(await query().inputValue(),'arvore');
  await page.unroute('**/api/operations/units');await refresh();await count('unlinked',3);assert.equal(await dialog.locator('li').count(),1);await close();
  f.sqlite.prepare("UPDATE agent_devices SET state='revoked' WHERE device_id=?").run(admin);await refresh();await count('linked',0);await count('unlinked',4);
  await button('unlinked').click();await query().fill('arvore');await dialog.locator('a').click();await page.locator('.detail-banner h2').waitFor();assert.equal(await dialog.count(),0);assert.ok(page.url().includes(s.unit));
  await page.goto(origin+'/panorama');await count('unlinked',4);const extra=[];
  for(let i=0;i<35;i++){const name=i?'TESTE · Unidade '+i:'TESTE · <img src=x onerror=alert(1)>';extra.push(name);f.sqlite.prepare('INSERT INTO units(id,name,name_key,unit_type,active,created_at,updated_at) VALUES(?,?,?,?,1,?,?)').run(crypto.randomUUID(),name,'d127-'+i,'Escola municipal',Date.now(),Date.now());}
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);
  await page.reload();await count('unlinked',39);await page.setViewportSize({width:390,height:844});await button('unlinked').click();assert.equal(await dialog.locator('li').count(),39);assert.equal(await dialog.locator('img').count(),0);assert.equal(await dialog.locator('.unit-agent-list').evaluate(n=>n.scrollHeight>n.clientHeight&&n.clientHeight>0),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await screenshot('03-lista-390');await query().fill('unidade 12');assert.equal(await dialog.locator('li').count(),1);await screenshot('04-busca-390');await close();
  await page.goto(origin+'/mapa');assert.equal(await page.locator('#panorama-agent-links').count(),0,'apenas Panorama');
  assert.deepEqual(h.errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,noExtraReadOnOpenOrSearch:true,sharedFleetInterval:60000,scope:'LOCAL ISOLADO',errors:h.errors},null,2));console.log('D127 navegador PASS: grupos, busca, filtro, offline, encerramento, falha, recuperação, acessibilidade e nenhuma consulta extra.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
