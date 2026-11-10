const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,env,errors}=h,{seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),{runAgentMonitoring}=await import('../server/agent-monitoring.mjs');
 const seed=seedEquipmentConsultation(f),folder='docs/05-qualidade/evidencias/monitoramento-2026-11-08';fs.mkdirSync(folder,{recursive:true});
 const shot=name=>page.screenshot({path:path.resolve(folder,name+'.png'),fullPage:false});
 const contact=(at,reason='periodic')=>f.sqlite.prepare('UPDATE agent_presence SET data_json=? WHERE device_id=?').run(JSON.stringify({last_live_contact_at:new Date(at).toISOString(),last_reason_at:new Date(at).toISOString(),last_reason:reason}),seed.device);
 try{
  await runAgentMonitoring(env);await page.clock.install({time:Date.now()});
  await page.goto(origin+'/panorama?id='+seed.unit+'&equipment='+seed.items[0].id);
  await page.locator('.eq-detail').waitFor();await page.locator('[data-monitor-equipment]').waitFor();await page.waitForFunction(()=>document.querySelector('.eq-detail')?.textContent.includes('PROCESSADOR-TESTE'));
  await page.locator('.eq-filters input[name=q]').fill('anotacao-de-busca');await page.locator('.eq-filters input[name=q]').evaluate(el=>el.setSelectionRange(3,3));
  contact(Date.now()-1100000);await runAgentMonitoring(env);await page.clock.fastForward(16000);
  await page.waitForFunction(()=>document.querySelector('[data-monitor-equipment]')?.textContent.includes('Sem comunicação'));
  assert.equal(await page.locator('.eq-filters input[name=q]').inputValue(),'anotacao-de-busca');assert.equal(await page.locator('.eq-filters input[name=q]').evaluate(el=>el.selectionStart),3);
  await page.locator('.header').getByRole('button',{name:/^Notificações/}).click();await page.getByRole('heading',{name:'Perda de comunicação'}).waitFor();await shot('perda-comunicacao');
  await page.getByRole('button',{name:'Marcar como lida',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.monitor-count')?.hidden);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM agent_notification_reads').get().n,1);
  contact(Date.now());await runAgentMonitoring(env);await page.clock.fastForward(16000);await page.waitForFunction(()=>document.querySelector('.monitor-item')?.textContent.includes('Comunicação retomada'));await shot('comunicacao-retomada');
  const old=f.sqlite.prepare('SELECT * FROM agent_inventory_snapshots WHERE device_id=?').get(seed.device),sec=JSON.parse(old.sections_json);sec.memory.data.installed_bytes=34359738368;const id=crypto.randomUUID(),iso=new Date(Date.now()+1000).toISOString();
  f.sqlite.prepare('INSERT INTO agent_inventory_snapshots(inventory_id,device_id,equipment_id,collected_at,received_at,boot_id,sequence,reason,snapshot_hash,sections_json) VALUES(?,?,?,?,?,?,2,?,?,?)').run(id,seed.device,seed.items[0].id,iso,iso,crypto.randomUUID(),'hardware_change','TESTE',JSON.stringify(sec));f.sqlite.prepare('UPDATE agent_current_snapshot SET inventory_id=?,collected_at=? WHERE device_id=?').run(id,iso,seed.device);await runAgentMonitoring(env,Date.now()+2000);
  await page.clock.fastForward(16000);await page.getByRole('heading',{name:/Alteração de hardware detectada/}).waitFor();await page.getByText('Ver peças e valores anteriores / novos').click();await shot('mudanca-hardware');
  await page.clock.fastForward(16000);assert.equal(await page.locator('.monitor-item details').evaluate(el=>el.open),true,'atualização não fecha comparativo');
  await page.getByRole('button',{name:'Fechar notificações'}).click();await page.waitForFunction(()=>document.querySelector('.eq-detail')?.textContent.includes('32 GiB'));
  await page.clock.fastForward(2100);await page.locator('.hardware-dialog[open]').waitFor();await page.getByRole('button',{name:'Aceitar alteração',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.hardware-feedback')?.textContent.includes('Alteração aceita'));await page.getByRole('button',{name:'Fechar aviso de hardware'}).click();
  await page.route('**/api/inventory/monitoring?**',route=>route.abort());await page.clock.fastForward(16000);await page.waitForFunction(()=>document.querySelector('.monitor-count')?.textContent==='!');await page.locator('.header').getByRole('button',{name:/^Notificações/}).click();await page.locator('.monitor-error').waitFor();await shot('falha-atualizacao');await page.unroute('**/api/inventory/monitoring?**');await page.getByRole('button',{name:'Atualizar agora'}).click();await page.waitForFunction(()=>!document.querySelector('.monitor-error'));
  await page.getByRole('button',{name:'Fechar notificações'}).click();await page.goto(origin+'/cadastro-unidades');await page.locator('.header').getByRole('button',{name:/^Notificações/}).click();await page.getByRole('heading',{name:/Alteração de hardware/}).waitFor();
  await page.locator('.monitor-item [data-monitor-link]').first().click();await page.locator('.eq-detail').waitFor();assert.match(await page.locator('.eq-detail').textContent(),new RegExp(seed.items[0].id));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,automaticStatus:true,automaticInventory:true,focusAndCursorPreserved:true,acknowledge:true,recovery:true,hardwareBeforeAfter:true,retry:true,administrationBell:true}));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
