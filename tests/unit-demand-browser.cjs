const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,f,origin}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),s=seedEquipmentConsultation(f);
 f.sqlite.prepare("UPDATE units SET name='TESTE · Escola Árvore',latitude=-2.53,longitude=-44.1,unit_type='Escola municipal' WHERE id=?").run(s.unit);
 f.sqlite.prepare('INSERT INTO dispatch_technicians VALUES(?,1,?,?)').run(f.operator.id,Date.now(),f.root.id);
 const out='docs/05-qualidade/evidencias/demanda-unidade-d129-2026-11-17';fs.mkdirSync(out,{recursive:true});
 const dialog=page.getByRole('dialog',{name:'Registrar nova demanda',exact:true}),button=page.getByRole('button',{name:'Registrar nova demanda',exact:true});
 const capture=async name=>{await page.evaluate(()=>{let n=document.getElementById('test-label');if(!n){n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Dados sintéticos';n.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#171a1c;color:white;z-index:99999;text-align:center;font:12px sans-serif';document.body.append(n);}});await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  await page.goto(origin+'/panorama');await page.getByRole('button',{name:/^TESTE · Escola Árvore · Escola municipal/}).click();await page.waitForURL('**/unidade?id='+s.unit);await button.waitFor();
  assert.equal(await button.evaluate(n=>n.closest('.detail-unit-title')?.querySelector('h2')?.textContent),'TESTE · Escola Árvore');
  assert.equal(h.requests.filter(r=>r.path.includes('unit-request-')).length,0);await capture('01-cabecalho');
  await button.click();await dialog.getByLabel('O que a unidade precisa?').waitFor();assert.match(await dialog.innerText(),/TESTE · Escola Árvore/);assert.equal(await dialog.getByLabel('Técnico responsável').locator('option').count(),2);
  await dialog.getByLabel('O que a unidade precisa?').fill('TESTE · trocar teclado e revisar impressora');await dialog.getByLabel('Técnico responsável').selectOption(f.operator.id);await capture('02-modal');
  let drop=true;await page.route('**/api/dispatch/unit-request-create',async route=>{if(drop){drop=false;await route.fetch();await route.abort('failed');}else await route.continue();});
  await dialog.getByRole('button',{name:'Registrar e designar',exact:true}).click();await dialog.getByRole('button',{name:'Conferir envio / tentar novamente',exact:true}).waitFor();assert.equal(await dialog.getByLabel('O que a unidade precisa?').inputValue(),'TESTE · trocar teclado e revisar impressora');
  await dialog.getByRole('button',{name:'Conferir envio / tentar novamente',exact:true}).click();await dialog.waitFor({state:'detached'});await page.getByRole('status').filter({hasText:'Demanda #1 registrada e atribuída'}).waitFor();assert.ok(page.url().includes('/unidade?id='+s.unit));
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM service_requests').get().n,1);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_notifications').get().n,1);assert.equal(await button.evaluate(n=>n===document.activeElement),true);await capture('03-confirmada');
  await page.setViewportSize({width:390,height:844});assert.equal(await button.evaluate(n=>n.getBoundingClientRect().right<=innerWidth&&n.getBoundingClientRect().left>=0),true,'botão inteiro na tela, sem corte');await capture('04-cabecalho-390');await button.click();await dialog.getByLabel('O que a unidade precisa?').waitFor();await capture('05-modal-390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  f.sqlite.prepare('UPDATE dispatch_technicians SET enabled=0').run();await button.click();await dialog.getByText('Não há técnico ativo habilitado.',{exact:false}).waitFor();await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
  for(const role of ['admin','visualizador']){f.sqlite.prepare('UPDATE users SET role=? WHERE id=?').run(role,f.root.id);await page.reload();await page.locator('.detail-banner h2').waitFor();assert.equal(await button.count(),0);}
  assert.deepEqual(h.errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,mapToUnit:true,headerButton:true,unitFixed:true,retryIdempotent:true,modalClosesAfterSave:true,noGpsStart:true,rootOnly:true,errors:h.errors},null,2));console.log('D129 navegador PASS: mapa → unidade → Registrar nova demanda; unidade fixa, atribuição, ACK perdido, fechamento, permissões e 390px.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
