// Real Worker + isolated SQLite. Synthetic records never reach production.
const assert=require('node:assert/strict'),fs=require('node:fs');
const out='docs/05-qualidade/evidencias/desempenho-d104-2026-11-12';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const comparison={method:'76 synthetic map markers; identical monitoring/pending-summary event pair, 20 cycles. Counts of SVG path attribute mutations after initial map stabilization. Local only.'};
 for(const [label,assets] of [['before','private-data/perf-d104-before/painel'],['after','dist/painel']]){
  if(label==='before'&&!fs.existsSync(assets))continue;
  const h=await require('./helpers/panel-browser.cjs')({assets}),{page,origin,f,errors}=h;
  try{
   const rows=f.sqlite.prepare('SELECT id FROM units').all();
   for(let n=rows.length;n<76;n++){const id=crypto.randomUUID();f.sqlite.prepare('INSERT INTO units(id,name,name_key,active,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,'TESTE LOCAL '+n,id,1,Date.now(),Date.now());rows.push({id});}
   rows.forEach((r,n)=>f.sqlite.prepare('UPDATE units SET active=1,latitude=?,longitude=? WHERE id=?').run(-2.5+(n%10)*.005,-44.2+Math.floor(n/10)*.005,r.id));
   await page.route('https://**/*',r=>r.abort());
   await page.goto(origin+'/panorama');await page.locator('#municipal-map[data-map-ready=true]').waitFor();
   await page.waitForFunction(()=>document.querySelector('#municipal-map')?.dataset.markerCount==='76');await page.waitForTimeout(800);
   // Hide periodic HTTP polling; dispatch the same confirmed state, then count only paths.
   const count=await page.evaluate(async()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
    let mutations=0;const observer=new MutationObserver(entries=>mutations+=entries.filter(e=>e.target.matches('path.unit-map-marker')).length);
    observer.observe(document.querySelector('#municipal-map'),{subtree:true,attributes:true});
    for(let n=0;n<20;n++){
     window.dispatchEvent(new CustomEvent('semed:monitoring',{detail:{hardware:{units:[]}}}));window.dispatchEvent(new Event('semed:pending-summary'));
     await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    }
    observer.disconnect();return mutations;
   });
   comparison[label]={markers:76,cycles:20,pathAttributeMutations:count};
   if(label==='after'){
    assert.equal(count,0);
    await page.evaluate(()=>{const label=document.createElement('div');label.textContent='TESTE LOCAL · 76 marcadores sintéticos · Sem dados de produção';label.style='position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#16191d;color:white;padding:8px;text-align:center';document.body.append(label);});
    await page.screenshot({path:out+'/local-mapa.png'});
   }
   assert.deepEqual(errors,[]);
  }finally{await h.close();}
 }
 if(comparison.before)assert.ok(comparison.before.pathAttributeMutations>0);
 fs.writeFileSync(out+'/map-comparison.json',JSON.stringify(comparison,null,2));
 // Test repeated attach against the real read routes, while a response is held.
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f,errors}=h;
 try{
  await page.route('**/test-progress',r=>r.fulfill({contentType:'text/html',body:'<html><body><main id="progress-content"></main></body></html>'}));
  let release,calls=0;const held=new Promise(r=>release=r);
  await page.route('**/api/inventory/in-progress?*',async r=>{calls++;if(calls===1)await held;await r.continue();});
  await page.goto(origin+'/test-progress');
  await page.evaluate(async()=>{const {createProgressView}=await import('/desktop-progress.js');window.progress=createProgressView();for(let n=0;n<10;n++)progress.attach();});
  await page.waitForTimeout(100);release();
  await page.getByRole('button',{name:'Ver dados parciais',exact:true}).first().waitFor();await page.waitForTimeout(250);assert.equal(calls,1,'initial repeated attach must not queue a second read');
  const selected=f.sqlite.prepare('SELECT id FROM inspections WHERE unit_id=?').get(f.ids.progress).id;
  await page.evaluate(id=>{for(let n=0;n<10;n++)progress.attach(id);},selected);
  await page.getByRole('heading',{name:'Ambientes cadastrados na unidade',exact:true}).waitFor();await page.waitForTimeout(200);assert.equal(calls,2,'same pending selection must not queue repeated reads');
  await page.getByRole('button',{name:'Atualizar agora',exact:true}).click();await page.waitForTimeout(250);assert.equal(calls,3,'explicit manual refresh still queries');
  await page.evaluate(()=>progress.attach(null));await page.getByRole('button',{name:'Ver dados parciais',exact:true}).first().waitFor();
  const other=crypto.randomUUID();f.sqlite.prepare('INSERT INTO inspections(id,unit_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?)').run(other,f.ids.pending,f.root.id,Date.now(),Date.now());
  let releaseDetail,detailStarted;const started=new Promise(r=>detailStarted=r),detailHeld=new Promise(r=>releaseDetail=r);
  await page.route('**/api/inventory/in-progress-detail?id='+selected,async r=>{detailStarted();await detailHeld;await r.continue();});
  await page.evaluate(id=>progress.attach(id),selected);await started;
  await page.evaluate(id=>progress.attach(id),other);releaseDetail();
  await page.getByRole('heading',{name:'TESTE ISOLADO · Unidade sem inventário',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'TESTE ISOLADO · Unidade em preenchimento',exact:true}).count(),0,'late detail cannot replace the new selection');
  await page.unroute('**/api/inventory/in-progress-detail?id='+selected);
  await page.route('**/api/inventory/in-progress?*',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"Falha controlada de leitura"}'}));
  await page.getByRole('button',{name:'Atualizar agora',exact:true}).click();await page.getByRole('alert').filter({hasText:'Falha controlada de leitura'}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'TESTE ISOLADO · Unidade sem inventário',exact:true}).isVisible(),true,'failure preserves last confirmed detail');
  assert.deepEqual(errors,[]);comparison.progress={initialAttach:1,selectedAttach:1,manualRefresh:1,errors};
  fs.writeFileSync(out+'/local-regression.json',JSON.stringify(comparison,null,2));
 }finally{await h.close();}
 console.log(JSON.stringify(comparison));
})().catch(e=>{console.error(e);process.exitCode=1;});
