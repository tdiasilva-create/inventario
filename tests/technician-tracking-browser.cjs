// UI bridge simulation against the actual Worker + isolated SQLite. Not physical GPS.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 const dir='docs/05-qualidade/evidencias/localizacao-d114-2026-11-13';fs.mkdirSync(dir,{recursive:true});
 const shot=async name=>{await page.evaluate(()=>{let b=document.querySelector('#test-label');if(!b){b=document.createElement('div');b.id='test-label';b.textContent='TESTE LOCAL · GPS e ponte Android simulados';b.style.cssText='position:fixed;bottom:0;right:0;z-index:99999;background:#16191d;color:white;font:11px sans-serif';document.body.append(b);}});await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});};
 try{
  const me=await(await page.request.get(origin+'/api/auth/me')).json();
  const post=async(path,data)=>{const r=await page.request.post(origin+path,{headers:{Origin:origin,'X-CSRF-Token':me.csrf},data});assert.ok(r.ok(),await r.text());return r.json();};
  const revision=()=>f.sqlite.prepare('SELECT revision FROM dispatch_meta').get().revision;
  await post('/api/dispatch/technician',{userId:f.root.id,enabled:true,operationId:crypto.randomUUID(),revision:revision()});
  const ids=[];for(let i=0;i<2;i++){const id=crypto.randomUUID();ids.push(id);await post('/api/operations/request-save',{id,operationId:crypto.randomUUID(),version:0,unitId:f.ids.pending,equipmentId:null,description:'TESTE LOCAL · atendimento '+(i+1),kind:'Visita técnica',source:'Painel',requester:'',responsible:'',scheduledDate:'',note:'',status:'Aberta'});await post('/api/dispatch/assign',{id,userIds:[f.root.id],operationId:crypto.randomUUID(),revision:revision()});}
  await page.addInitScript(()=>{
   if(!location.origin.startsWith('http://127.0.0.1:'))return;
   window.bridgeCalls=[];window.queueKey=JSON.parse(sessionStorage.getItem('test-key')||'null')||{id:crypto.randomUUID(),token:'a'.repeat(64)};let authorized=sessionStorage.getItem('test-authorized')==='1';
   window.SemedNative={
    prepareQueueTracking:()=>{sessionStorage.setItem('test-key',JSON.stringify(window.queueKey));return JSON.stringify(window.queueKey);},
    requestLocation:()=>setTimeout(()=>window.semedReceiveLocation({latitude:-2.54,longitude:-44.17,accuracy:12,observedAt:Date.now()}),10),
    resumeQueueTracking:user=>{window.bridgeCalls.push('resume');if(sessionStorage.getItem('test-key')){authorized=true;sessionStorage.setItem('test-authorized','1');}},
    hasQueueTracking:()=>authorized,
    stopTracking:()=>window.bridgeCalls.push('legacy-stop'),
    stopQueueTracking:()=>{window.bridgeCalls.push('queue-stop');authorized=false;sessionStorage.setItem('test-authorized','0');},
    clearEndedTracking:()=>{},signedIn:()=>{},signedOut:()=>{}
   };
  });
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/tecnico');await page.locator('.task.agora').waitFor();
  await page.getByRole('button',{name:'Aceitar e iniciar'}).first().click();assert.match(await page.locator('dialog').innerText(),/até concluir todas as demandas/);await shot('01-aviso-aceite');
  await page.locator('dialog [data-ok]').click();await page.locator('.task.active').waitFor();
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking WHERE ended_at IS NULL').get().n,1);
  await page.locator('.task.active').getByRole('button',{name:'Concluir atendimento',exact:true}).click();assert.match(await page.locator('dialog').innerText(),/localização continuará/);await page.locator('dialog [data-ok]').click();await page.waitForFunction(()=>!document.querySelector('.task.active'));
  await page.waitForFunction(()=>document.querySelector('.task.agora [data-action="accept"]')?.disabled===false);await page.waitForTimeout(200);await shot('02-entre-atendimentos');assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking WHERE ended_at IS NULL').get().n,1);
  assert.equal((await page.evaluate(()=>window.bridgeCalls)).includes('queue-stop'),false);
  const key=await page.evaluate(()=>window.queueKey),headers={'Content-Type':'application/json',Authorization:`SEMED-Tracking ${key.id}.${key.token}`};
  // Page no longer present: native capability still works, independent of cookies.
  await page.goto('about:blank');let r=await page.request.post(origin+'/api/technician/tracking-heartbeat',{headers,data:{}});assert.equal(r.status(),200);
  f.sqlite.prepare('UPDATE sessions SET expires_at=1 WHERE user_id=?').run(f.root.id);
  r=await page.request.post(origin+'/api/technician/tracking-heartbeat',{headers,data:{}});assert.equal(r.status(),200);
  r=await page.request.get(origin+'/api/technician/queue');assert.equal(r.status(),401);
  await page.goto(origin+'/tecnico');await page.locator('form.login').waitFor();assert.equal(await page.locator('#logout').isHidden(),false);
  await page.locator('#logout').click();await page.getByText('Você saiu.',{exact:true}).waitFor();assert.equal((await page.evaluate(()=>window.bridgeCalls)).includes('queue-stop'),true);
  r=await page.request.post(origin+'/api/technician/tracking-stop',{headers,data:{}});assert.equal(r.status(),200);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM dispatch_tracking_positions').get().n,0);
  assert.deepEqual(h.errors,[]);fs.writeFileSync(dir+'/browser.json',JSON.stringify({passed:true,backend:'actual Worker + isolated SQLite',androidBridge:'simulated',nativeGpsTested:false,partialKeepsTracking:true,pageClosedTokenWorks:true,expiredLoginOnlyLocation:true,logoutStops:true},null,2));console.log('D114 browser flow passed');
 }catch(e){await shot('failure');throw e;}finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
