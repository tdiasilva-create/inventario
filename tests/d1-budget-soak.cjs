// Real-time polling soak against LOCAL Worker/SQLite. No calls to the real account.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const seconds=Number(process.env.SEMED_SOAK_SECONDS||300);assert.ok(seconds>=120&&seconds<=7200);
 const h=await require('./helpers/panel-browser.cjs')(),pages=[h.page],counts=new Map(),started=Date.now();
 const dir='docs/05-qualidade/evidencias/d1-budget-2026-11-12';fs.mkdirSync(dir,{recursive:true});
 try{
  h.f.sqlite.prepare('UPDATE sessions SET expires_at=?').run(Date.now()+3*3600000);
  for(let i=0;i<71;i++){const id=crypto.randomUUID();h.f.sqlite.prepare('INSERT INTO units(id,name,name_key,unit_type,active,created_at,updated_at,latitude,longitude) VALUES(?,?,?,\'Escola municipal\',1,0,0,?,?)').run(id,'TESTE LOCAL '+i,id,-2.5+(i%10)*.005,-44.2+Math.floor(i/10)*.005);}
  for(let i=1;i<5;i++)pages.push(await h.page.context().browser().newPage({viewport:{width:1440,height:900}}));
  for(const [i,p]of pages.entries()){
   counts.set(i,{status:0,fleet:0});if(i)p.on('pageerror',e=>h.errors.push(e.stack));
   p.on('request',r=>{const path=new URL(r.url()).pathname;if(path==='/api/inventory/panel-status')counts.get(i).status++;if(path==='/api/operations/units')counts.get(i).fleet++;});
   await p.route('https://**/*',r=>r.abort());
   await p.goto(h.origin+'/panorama');await p.locator('#municipal-map[data-map-ready=true]').waitFor();
  }
  const report=()=>({elapsedSeconds:Math.round((Date.now()-started)/1000),tabs:5,localOnly:true,sameRootSession:true,requests:Object.fromEntries(counts),pageErrors:h.errors.length});
  console.log(JSON.stringify({started:true,...report()}));
  const loops=Math.ceil(seconds/30);let hiddenBefore;
  for(let n=1;n<=loops;n++){
   await new Promise(r=>setTimeout(r,30000));
   if(n===1){hiddenBefore={...counts.get(0)};await pages[0].evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});}
   if(n===3){assert.deepEqual(counts.get(0),hiddenBefore,'hidden tab must stop polling');await pages[0].evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});}
   if(n%10===0){fs.writeFileSync(dir+'/soak-progress.json',JSON.stringify(report(),null,2));console.log(JSON.stringify(report()));}
   assert.deepEqual(h.errors,[]);
  }
  for(const count of counts.values()){
   assert.ok(count.status>=Math.floor(seconds/15)-10&&count.status<=Math.ceil(seconds/15)+8,'status polling stays bounded');
   assert.ok(count.fleet>=Math.floor(seconds/60)-4&&count.fleet<=Math.ceil(seconds/60)+5,'fleet polling stays bounded');
  }
  const result={passed:true,...report(),hiddenPauseAndResume:true};fs.writeFileSync(dir+'/soak-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await h.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
