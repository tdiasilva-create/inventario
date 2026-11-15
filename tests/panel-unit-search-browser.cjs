// Isolated SQLite fixture and real Worker/UI. No production data or writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,requests}=h;
 const out='docs/05-qualidade/evidencias/busca-unidades-2026-11-15';fs.mkdirSync(out,{recursive:true});
 const update=f.sqlite.prepare('UPDATE units SET name=?,unit_type=?,latitude=?,longitude=? WHERE id=?');
 update.run('DEMONSTRAÇÃO · EMI ALANA LUDMILA','Escola municipal',-2.54,-44.17,f.ids.pending);
 update.run('DEMONSTRAÇÃO · EM RAIO DE LUZ','Escola municipal',-2.56,-44.15,f.ids.progress);
 update.run('DEMONSTRAÇÃO · Escola São José','Escola municipal',-2.53,-44.16,f.ids.blocked);
 update.run('DEMONSTRAÇÃO · Unidade sem localização','Unidade administrativa',null,null,f.ids.assigned);
 f.sqlite.prepare('UPDATE units SET name=? WHERE id=?').run('DEMONSTRAÇÃO · Escola inativa',f.ids.inactive);
 const field=page.locator('.unit-search input'),option=id=>page.locator('.unit-search [data-unit-id="'+id+'"]'),popup=page.locator('.unit-search-popup');
 const shot=async name=>page.screenshot({path:out+'/'+name+'.png'});
 const checkVisible=async locator=>{const b=await locator.boundingBox();assert.ok(b&&b.x>=0&&b.y>=0);assert.equal(await locator.evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true);};
 try{
  await page.goto(origin+'/panorama');await page.locator('#municipal-map[data-map-ready=true]').waitFor();
  assert.equal(await page.getByPlaceholder('Buscar unidades e equipamentos').count(),0);
  for(const text of ['s','sa','sao','sao jose'])await field.fill(text);
  await option(f.ids.blocked).waitFor();assert.equal(await page.locator('.unit-search [role=option]').count(),1);
  assert.equal(requests.filter(r=>r.path==='/api/units').length,1,'catalogue already loaded is reused');
  assert.equal(requests.filter(r=>r.path==='/api/inventory/search').length,0,'typing never queries equipment');
  await field.press('ArrowDown');await field.press('Enter');
  await page.waitForFunction(id=>new URL(location.href).searchParams.get('id')===id,f.ids.blocked);
  assert.equal(new URL(page.url()).pathname,'/panorama');assert.equal(await page.locator('#municipal-map').getAttribute('data-map-zoom'),'15');
  await field.fill('alana');await option(f.ids.pending).waitFor();await shot('01-sugestoes-panorama');
  const sameField=await field.elementHandle();await page.locator('[data-action=map-expand]').click();
  assert.equal(await page.locator('.map-expanded .unit-search').count(),1);assert.equal(await sameField.evaluate(n=>n===document.querySelector('.unit-search input')),true);assert.equal(await field.inputValue(),'alana');
  await checkVisible(field);await field.fill('raio');await option(f.ids.progress).click();
  assert.equal(await page.locator('.map-expanded').count(),1);assert.equal(new URL(page.url()).searchParams.get('id'),f.ids.progress);
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-tooltip').length===1);assert.match(await page.locator('.leaflet-tooltip').innerText(),/EM RAIO DE LUZ/);
  await field.fill('escola');await shot('02-busca-mapa-ampliado');
  await field.press('Escape');assert.equal(await popup.isVisible(),false);assert.equal(await page.locator('.map-expanded').count(),1,'first Escape closes suggestions');
  await field.press('Escape');assert.equal(await page.locator('.map-expanded').count(),0);assert.equal(await page.locator('.header .unit-search').count(),1);assert.equal(await page.locator('[inert]').count(),0);
  await page.locator('[data-action=map-expand]').click();await page.keyboard.press('/');assert.equal(await field.evaluate(n=>n===document.activeElement),true);
  await field.fill('sem localização');await option(f.ids.assigned).click();await page.getByRole('status').filter({hasText:'Esta unidade ainda não tem coordenadas'}).waitFor();assert.equal(await page.locator('.map-expanded').count(),1);
  await page.locator('[data-action=map-collapse]').click();await field.fill('computador-nao-e-unidade');await page.getByText('Nenhuma unidade encontrada.',{exact:true}).waitFor();
  await field.fill('inativa');await page.getByText('Nenhuma unidade encontrada.',{exact:true}).waitFor();
  await page.locator('.unit-search-clear').click();assert.equal(await field.inputValue(),'');await page.getByText('Digite o nome ou INEP da unidade.',{exact:true}).waitFor();
  await page.locator('[data-action=map-expand]').click();await field.fill('alana');await option(f.ids.pending).waitFor();
  for(const size of [{width:390,height:844},{width:812,height:375}]){
   await page.setViewportSize(size);await checkVisible(field);await checkVisible(option(f.ids.pending));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('03-ampliado-'+size.width);
  }
  await page.locator('[data-action=map-collapse]').click();await page.setViewportSize({width:1672,height:1050});
  assert.equal(requests.filter(r=>r.path==='/api/units').length,1);assert.equal(requests.filter(r=>r.path==='/api/inventory/search').length,0);
  // Standalone pages use one lazy catalogue. A failure is explicit and retryable.
  await page.goto(origin+'/testes-internet');await field.waitFor();let calls=0;
  await page.route('**/api/units',async route=>{calls++;if(calls===1)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"TESTE: indisponível"}'});await new Promise(r=>setTimeout(r,150));return route.continue();});
  await field.fill('alana');await page.getByText('Não foi possível consultar as unidades. Use a lupa para tentar novamente.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Procurar unidade',exact:true}).click();await field.fill('raio');await option(f.ids.progress).waitFor();assert.equal(await option(f.ids.pending).count(),0);assert.equal(calls,2);
  await option(f.ids.progress).click();await page.waitForURL('**/unidade?id='+f.ids.progress);
  assert.deepEqual(h.errors,[]);fs.writeFileSync(out+'/resultado.json',JSON.stringify({passed:true,liveNames:true,accentInsensitive:true,noEquipmentQueries:true,sharedCatalogue:true,fullscreen:true,sameField:true,escape:true,keyboard:true,noCoordinates:true,mobile:true,retry:true,staleResponse:true},null,2));
  console.log('Busca de unidades: fluxo incremental, teclado, mapa ampliado, responsividade, consumo e recuperação aprovados.');
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
