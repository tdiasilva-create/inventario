// Cinco regressões de navegação. Worker real + SQLite local; nenhuma escrita remota.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const out='docs/05-qualidade/evidencias/painel-navegacao-2026-11-11';fs.mkdirSync(out,{recursive:true});
 const checks=[],writeRequests=[];
 page.on('request',r=>{if(r.url().startsWith(origin+'/api/')&&!['GET','HEAD'].includes(r.method()))writeRequests.push(r.method()+' '+new URL(r.url()).pathname);});
 f.sqlite.prepare('INSERT INTO users(id,username,role,password_hash,salt,created_at) VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),'admin','admin','TEST-ONLY','TEST-ONLY',Date.now());
 f.sqlite.prepare('UPDATE units SET latitude=-2.54,longitude=-44.17 WHERE id IN (?,?)').run(f.ids.pending,f.ids.progress);
 f.sqlite.prepare('UPDATE units SET latitude=-2.57,longitude=-44.14 WHERE id=?').run(f.ids.assigned);
 const name=id=>f.sqlite.prepare('SELECT name FROM units WHERE id=?').get(id).name;
 const chosen=()=>new URL(page.url()).searchParams.get('id');
 const marker=id=>page.locator('.unit-map-marker[data-unit-id="'+id+'"]');
 const shot=async name=>{await page.evaluate(()=>{if(document.querySelector('#test-label'))return;const n=document.createElement('div');n.id='test-label';n.textContent='TESTE LOCAL · Dados sintéticos · Sem gravação em produção';n.style.cssText='position:fixed;bottom:0;z-index:99999;background:#16191d;color:white;padding:5px;font:12px sans-serif;pointer-events:none';document.body.append(n);});await page.screenshot({path:out+'/'+name+'.png'});};
 try{
  await page.goto(origin+'/panorama?id='+f.ids.pending);await page.locator('#municipal-map[data-map-ready=true]').waitFor();
  const geo=await page.locator('.unit-map-marker').evaluateAll(nodes=>nodes.map(n=>[n.dataset.unitId,n.getAttribute('d'),n.getAttribute('fill')]));
  const hit=await marker(f.ids.progress).boundingBox();await page.mouse.click(hit.x+hit.width/2,hit.y+hit.height/2);
  await page.locator('.map-unit-choices').waitFor();assert.equal(await page.locator('[data-map-choice]').count(),2);await page.waitForFunction(()=>getComputedStyle(document.querySelector('.unit-choice-popup')).opacity==='1');await shot('escolha-unidades-proximas');
  await page.locator('[data-map-choice="'+f.ids.progress+'"]').click();assert.equal(chosen(),f.ids.progress);
  await page.reload();await page.locator('#municipal-map[data-map-ready=true]').waitFor();assert.equal(chosen(),f.ids.progress);
  await marker(f.ids.pending).focus();await page.keyboard.press('Enter');assert.equal(chosen(),f.ids.pending);assert.equal(await page.locator('.map-unit-choices').count(),0);
  await marker(f.ids.assigned).click();assert.equal(chosen(),f.ids.assigned,'ponto isolado seleciona diretamente');
  await marker(f.ids.pending).focus();await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('.unit-map-marker').evaluateAll(nodes=>nodes.map(n=>[n.dataset.unitId,n.getAttribute('d'),n.getAttribute('fill')])),geo,'geografia e cores preservadas');
  await page.locator('[data-action=map-expand]').click();const p=await marker(f.ids.progress).boundingBox();await page.mouse.click(p.x+p.width/2,p.y+p.height/2);await page.locator('.map-unit-choices').waitFor();
  await page.keyboard.press('Escape');await page.locator('.map-unit-choices').waitFor({state:'detached'});assert.equal(await page.locator('.map-expanded').count(),1,'Esc fecha apenas a escolha primeiro');await page.keyboard.press('Escape');assert.equal(await page.locator('.map-expanded').count(),0);checks.push('mapa: sobreposição, ponto isolado, teclado, Escape, coordenadas e cores');
  await page.goto(origin+'/ambientes?id='+f.ids.pending);const input=page.locator('#unit-picker');await input.waitFor();
  await input.fill(name(f.ids.progress));await input.press('Tab');await page.waitForURL('**/ambientes?id='+f.ids.progress);await page.reload();await input.waitFor();assert.equal(await input.inputValue(),name(f.ids.progress));await shot('ambientes-contexto-preservado');
  await input.fill(name(f.ids.assigned));await input.press('Tab');await page.waitForURL('**/ambientes?id='+f.ids.assigned);
  await page.goBack();await page.waitForFunction(n=>document.querySelector('#unit-picker')?.value===n,name(f.ids.progress));await page.goForward();await page.waitForFunction(n=>document.querySelector('#unit-picker')?.value===n,name(f.ids.assigned));
  checks.push('ambientes: seleção, recarga, URL direta, Voltar e Avançar');
  await page.goto(origin+'/coletas-em-andamento');const open=page.locator('[data-progress=open]').first();await open.waitFor();await open.click();await page.locator('.progress-detail').waitFor();const detailUrl=page.url();assert.ok(new URL(detailUrl).searchParams.get('vistoria'));
  await page.goBack();await page.locator('.progress-list').waitFor();assert.equal(new URL(page.url()).pathname,'/coletas-em-andamento');assert.equal(new URL(page.url()).searchParams.has('vistoria'),false);
  await page.goForward();await page.locator('.progress-detail').waitFor();assert.equal(page.url(),detailUrl);await page.reload();await page.locator('.progress-detail').waitFor();
  await page.locator('[data-progress=list]').click();await page.locator('.progress-list').waitFor();await page.goBack();await page.locator('.progress-detail').waitFor();await shot('coleta-voltar-avancar');
  checks.push('coletas parciais: histórico lista/detalhe, recarga e botão Voltar à lista');
  await page.goto(origin+'/usuarios');const menus=page.locator('details.actions-menu'),summaries=menus.locator('summary');await summaries.nth(1).waitFor();
  await summaries.nth(0).click();assert.equal(await page.locator('details.actions-menu[open]').count(),1);await summaries.nth(1).click();assert.equal(await page.locator('details.actions-menu[open]').count(),1);assert.equal(await menus.nth(0).getAttribute('open'),null);
  await page.keyboard.press('Escape');assert.equal(await page.locator('details.actions-menu[open]').count(),0);assert.equal(await summaries.nth(1).evaluate(n=>n===document.activeElement),true);
  await summaries.nth(0).click();await page.locator('.header h1').click();assert.equal(await page.locator('details.actions-menu[open]').count(),0);
  await summaries.nth(0).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('details.actions-menu[open]').count(),1);await page.keyboard.press('Tab');assert.equal(await page.locator('details.actions-menu[open]').count(),1,'foco dentro do menu mantém ações');await page.locator('.search input').focus();assert.equal(await page.locator('details.actions-menu[open]').count(),0);
  checks.push('usuários: um menu por vez, clique fora, Esc e navegação por teclado');
  const profile=page.locator('#profile-toggle'),profileMenu=page.locator('#profile-menu');await profile.click();assert.equal(await profileMenu.isVisible(),true);await page.keyboard.press('Escape');assert.equal(await profileMenu.isVisible(),false);assert.equal(await profile.getAttribute('aria-expanded'),'false');assert.equal(await profile.evaluate(n=>n===document.activeElement),true);
  await profile.click();await page.locator('.header h1').click();assert.equal(await profileMenu.isVisible(),false);await profile.click();await summaries.nth(0).click();assert.equal(await profileMenu.isVisible(),false);await profile.click();assert.equal(await page.locator('details.actions-menu[open]').count(),0);await page.keyboard.press('Escape');await shot('menus-fechados');
  await page.setViewportSize({width:390,height:844});await profile.click();await page.keyboard.press('Escape');assert.equal(await profileMenu.isVisible(),false);checks.push('perfil: Esc, foco devolvido, clique fora, troca de menu e tela pequena');
  assert.deepEqual(writeRequests,[]);assert.deepEqual(h.errors,[]);const result={passed:true,checks,writeRequests,errors:h.errors};fs.writeFileSync(out+'/resultado.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }catch(e){await shot('falha');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
