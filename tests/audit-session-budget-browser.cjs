// D123: only local SQLite and synthetic sessions. No production traffic or credentials.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const h=await require('./helpers/panel-browser.cjs')(),{page,origin,f}=h;
 try{
  await page.route('https://**/*',r=>r.abort());
  await page.clock.install({time:Date.now()});
  await page.goto(origin+'/panorama');await page.locator('#panel-pulse[data-state=ok]').waitFor();
  // An ordinary forbidden endpoint must not stop allowed reads.
  await page.route('**/test-client.js',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('web/desktop-request.js','utf8')}));
  await page.route('**/api/test-forbidden',r=>r.fulfill({status:403,contentType:'application/json',body:'{}'}));
  assert.equal(await page.evaluate(async()=>{const m=await import('/test-client.js');try{await m.readPanelJson('/api/test-forbidden');}catch{}return (await m.readPanelJson('/api/auth/me')).role;}),'root');
  f.sqlite.prepare('DELETE FROM sessions').run();
  const denied=page.waitForResponse(r=>r.status()===401&&r.url().includes('/api/'));
  await page.clock.fastForward(16000);await denied;
  await page.waitForTimeout(100);const count=h.requests.length;
  await page.clock.fastForward(300000);await page.waitForTimeout(100);
  assert.equal(h.requests.length,count,'expired document must stop network polling');
  assert.match(await page.locator('[data-action=notifications]').first().getAttribute('title'),/expirou/);
  fs.mkdirSync('private-data/d123',{recursive:true});await page.screenshot({path:'private-data/d123/local-session-expired.png'});
  assert.deepEqual(h.errors,[]);
  console.log('PASS D123: 403 scoped; 401 stops further network reads for five simulated minutes, explicit error retained.');
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
