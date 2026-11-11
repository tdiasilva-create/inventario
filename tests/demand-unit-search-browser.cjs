// Worker real e banco em memória; não cria demandas no ambiente oficial.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const {seedEquipmentConsultation}=await import('./helpers/equipment-consultation.mjs'),seed=seedEquipmentConsultation(f);
 const names={pending:'TESTE · Escola São José',assigned:'TESTE · Escola São José',progress:'TESTE · Escola Raio de Luz',inactive:'TESTE · Unidade Inativa',blocked:'TESTE · <img src=x onerror=alert(1)>'};
 for(const [key,name]of Object.entries(names))f.sqlite.prepare('UPDATE units SET name=? WHERE id=?').run(name,f.ids[key]);
 const out='docs/05-qualidade/evidencias/demandas-busca-2026-11-11';fs.mkdirSync(out,{recursive:true});
 const filter=page.locator('#request-filters'),form=page.locator('#request-form');let writes=0,unitReads=0;
 page.on('request',r=>{if(r.url().endsWith('/api/operations/request-save')&&r.method()==='POST')writes++;if(r.url().endsWith('/api/operations/units'))unitReads++;});
 const choose=(host,id)=>host.locator('[role=option][data-unit-id="'+id+'"]').click();
 const close=async()=>{await page.getByRole('dialog').getByRole('button',{name:'Fechar',exact:true}).click();await page.locator('.ops-dialog').waitFor({state:'detached'});};
 const shot=async name=>{await page.evaluate(()=>{if(document.querySelector('#test-label'))return;const b=document.createElement('div');b.id='test-label';b.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';b.style.cssText='position:fixed;bottom:0;z-index:99999;background:#16191d;color:white;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(b);});await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  await page.clock.install({time:Date.now()});await page.goto(origin+'/demandas?unidade='+f.ids.progress);await filter.locator('input[role=combobox]').waitFor();
  assert.equal(await filter.locator('[name=unit]').inputValue(),f.ids.progress);assert.equal(await filter.locator('input[role=combobox]').inputValue(),names.progress);
  await page.getByRole('button',{name:'Registrar demanda',exact:true}).click();assert.equal(await form.locator('[name=unit]').inputValue(),f.ids.progress);await close();
  const reads=unitReads;await filter.locator('input[role=combobox]').fill('SAO JOSE');assert.equal(await filter.locator('[role=option]').count(),2);assert.equal(await filter.locator('[name=unit]').inputValue(),'');assert.equal(unitReads,reads,'digitação usa catálogo já carregado');
  assert.match(await filter.getByRole('listbox').innerText(),/ID /,'homônimas identificadas por IDs distintos');await shot('01-busca-central');
  await page.clock.fastForward(16000);assert.equal(await filter.locator('input[role=combobox]').inputValue(),'SAO JOSE');
  await choose(filter,seed.unit);await filter.getByRole('button',{name:'Filtrar',exact:true}).click();await page.waitForFunction(id=>document.querySelector('[data-ops-cross]').getAttribute('href')==='/computadores?unidade='+id,seed.unit);
  await page.getByRole('button',{name:'Registrar demanda',exact:true}).click();assert.equal(await form.locator('[name=unit]').inputValue(),seed.unit,'busca prevalece sobre unidade anterior na URL');
  await form.locator('#equipment-picker summary').click();await form.locator('[data-equipment]').first().waitFor();await form.locator('[data-equipment]').first().click();await form.getByRole('button',{name:'Remover vínculo',exact:true}).waitFor();
  await form.locator('input[role=combobox]').fill('raio');assert.equal(await form.locator('[name=unit]').inputValue(),'');assert.equal(await form.locator('[data-equipment]').count(),0);assert.equal(await form.getByRole('button',{name:'Remover vínculo',exact:true}).count(),0);
  await form.locator('input[role=combobox]').press('ArrowDown');await form.locator('input[role=combobox]').press('Enter');assert.equal(await form.locator('[name=unit]').inputValue(),f.ids.progress);await shot('02-demanda-unidade-selecionada');
  await form.locator('textarea[name=description]').fill('TESTE ISOLADO · visita técnica à unidade');await form.getByRole('button',{name:'Salvar demanda',exact:true}).click();await page.locator('.ops-dialog').waitFor({state:'detached'});await page.locator('#request-saved').filter({hasText:'Demanda #1 registrada com sucesso.'}).waitFor();await page.locator('#request-saved').getByRole('button',{name:'Ver demanda',exact:true}).click();await page.getByRole('heading',{name:'Demanda #1',exact:true}).waitFor();
  const saved=f.sqlite.prepare('SELECT unit_id,equipment_id FROM service_requests WHERE number=1').get();assert.equal(saved.unit_id,f.ids.progress);assert.equal(saved.equipment_id,null);assert.equal(writes,1);assert.equal(await form.locator('input[role=combobox]').count(),0,'edição preserva unidade histórica');await close();
  await filter.getByRole('button',{name:'Limpar unidade',exact:true}).click();await filter.locator('input[role=combobox]').press('Escape');await filter.getByRole('button',{name:'Filtrar',exact:true}).click();await page.locator('.ops-request').waitFor();
  await page.getByRole('button',{name:'Registrar demanda',exact:true}).click();await form.locator('input[role=combobox]').fill('nome inexistente');assert.equal(await form.locator('[role=option]').count(),0);assert.match(await form.innerText(),/Nenhuma unidade encontrada/);await form.locator('textarea[name=description]').fill('TESTE · não deve salvar nome livre');await form.getByRole('button',{name:'Salvar demanda',exact:true}).click();assert.equal(writes,1);assert.equal(await form.locator('input[role=combobox]').evaluate(n=>n.checkValidity()),false);
  await form.locator('input[role=combobox]').press('Escape');assert.equal(await page.locator('.ops-dialog[open]').count(),1,'Escape primeiro fecha resultados');
  await form.locator('input[role=combobox]').fill('inativa');assert.equal(await form.locator('[role=option]').count(),0);
  await form.locator('input[role=combobox]').fill('<img');assert.equal(await form.locator('.unit-name-options img').count(),0);assert.match(await form.locator('[role=option]').innerText(),/<img/);
  await page.setViewportSize({width:390,height:844});await form.locator('input[role=combobox]').fill('sao jose');await shot('03-busca-390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await choose(form,seed.unit);await close();
  f.sqlite.prepare("UPDATE users SET role='visualizador' WHERE id=?").run(f.root.id);await page.reload();await filter.locator('input[role=combobox]').waitFor();await filter.locator('input[role=combobox]').fill('raio');await choose(filter,f.ids.progress);await filter.getByRole('button',{name:'Filtrar',exact:true}).click();await page.locator('.ops-request').waitFor();assert.equal(await page.getByRole('button',{name:'Registrar demanda',exact:true}).count(),0);assert.equal(writes,1);
  assert.deepEqual(h.errors,[]);console.log(JSON.stringify({passed:true,partialAccentSearch:true,explicitIdSelection:true,duplicateNames:true,keyboard:true,noTypingRequests:true,pollKeepsInput:true,newDemandPrefill:true,equipmentCleared:true,freeTextBlocked:true,escapedNames:true,inactiveHidden:true,mobile:true,viewerReadOnly:true}));
 }catch(error){await shot('falha');throw error;}finally{await h.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
