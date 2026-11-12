// Controlled comparison: isolated Worker/SQLite, same synthetic units, 60 ms per local HTTP read.
// Not production latency. No cookies/records exported and no production writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
const out='docs/05-qualidade/evidencias/desempenho-correcao-2026-11-12';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const result={method:'Same isolated fixture; 60 ms artificial server delay per request; 5 warm reloads; idle clock advanced 20 x 15s. No production timing.'};
 for(const [label,assets] of [['before','private-data/perf-before/dist/painel'],['after','dist/painel']]){
  const h=await require('./helpers/panel-browser.cjs')({assets,delayMs:60}),{page,origin,requests,errors}=h;
  const ready=async()=>{await page.locator('#municipal-map[data-map-ready=true]').waitFor();await page.getByRole('link',{name:'Consultar registros recebidos',exact:true}).waitFor();await page.locator('#panel-pulse[data-state=ok]').waitFor();await page.waitForFunction(()=>!document.querySelector('.selected-panel')?.textContent.includes('Atualizando dados'));};
  try{
   await page.route('https://**/*',r=>r.abort());
   await page.goto(origin+'/panorama');await ready();
   const samples=[];
   for(let i=0;i<5;i++){
    requests.length=0;await page.reload();await ready();
    const sample=await page.evaluate(()=>({observedReadyMs:Math.round(performance.now()),domContentLoadedMs:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),js:performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname.endsWith('.js')).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize})),api:performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname.startsWith('/api/')).map(r=>({path:new URL(r.name).pathname,start:Math.round(r.startTime),end:Math.round(r.responseEnd)}))}));
    samples.push(sample);
   }
   await page.clock.install({time:Date.now()});await page.reload();await ready();await page.waitForTimeout(500);
   const begin=requests.length;
   for(let n=0;n<20;n++){await page.clock.fastForward(15000);await new Promise(r=>setTimeout(r,300));}
   const idle=requests.slice(begin).filter(r=>r.path.startsWith('/api/')).reduce((m,r)=>(m[r.path]=(m[r.path]||0)+1,m),{});
   result[label]={samples,idle,idleTotal:Object.values(idle).reduce((n,v)=>n+v,0),errors};
   fs.writeFileSync(out+'/local-comparison.json',JSON.stringify(result,null,2));assert.deepEqual(errors,[]);
   if(label==='after'){
    assert.ok(samples.every(s=>s.js.filter(j=>j.path.startsWith('/bundles/')).length===1));
    assert.equal(idle['/api/inventory/pending-summary']||0,0);assert.equal(idle['/api/inventory/monitoring']||0,0);
    assert.equal(idle['/api/inventory/panel-status'],20);
    await page.evaluate(()=>{window.__map=document.querySelector('#municipal-map');window.__pulseLink=document.querySelector('#panel-pulse a');});
    await page.clock.fastForward(15000);await new Promise(r=>setTimeout(r,300));
    assert.equal(await page.evaluate(()=>__map===document.querySelector('#municipal-map')),true);
    await page.evaluate(()=>{const label=document.createElement('p');label.textContent='TESTE LOCAL · Dados sintéticos · Desempenho';label.style='position:fixed;bottom:0;z-index:9999;background:#fff;padding:8px';document.body.append(label);});
    await page.screenshot({path:out+'/local-panorama.png'});
    // Account uses one bundle and must-change page remains usable.
    h.f.sqlite.prepare('UPDATE users SET must_change=1 WHERE id=?').run(h.f.root.id);
    await page.goto(origin+'/conta');await page.locator('#password-form').waitFor({state:'visible'});assert.equal(await page.locator('#new-password').isVisible(),true);
    await page.screenshot({path:out+'/local-primeiro-acesso.png'});
   }
  }finally{await h.close();}
 }
 assert.ok(result.after.idleTotal<result.before.idleTotal);
 fs.writeFileSync(out+'/local-comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,before:result.before.idle,after:result.after.idle}));
})().catch(e=>{console.error(e);process.exitCode=1;});
